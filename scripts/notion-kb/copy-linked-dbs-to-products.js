// Copy linked database blocks from Ultra Lab to other products
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID
const ULTRA_LAB_PAGE_ID = '31545842-ecf0-8126-befb-ea27a4ec66f7' // Ultra Lab

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function callNotionAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`https://api.notion.com/v1${endpoint}`, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(`API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function copyBlocksToProduct(targetProductId, targetProductName) {
  console.log(`\n📝 複製到: ${targetProductName}`)

  // Get Ultra Lab page blocks
  const ultraLabBlocks = await callNotionAPI(`/blocks/${ULTRA_LAB_PAGE_ID}/children`)

  // Filter only the child_database blocks (skip other blocks)
  const childDatabaseBlocks = ultraLabBlocks.results.filter((b) => b.type === 'child_database')

  console.log(`   找到 ${childDatabaseBlocks.length} 個 child_database blocks`)

  if (childDatabaseBlocks.length === 0) {
    console.log(`   ⚠️  沒有 child_database blocks 可複製`)
    return
  }

  // Get target product page blocks
  const existingBlocks = await callNotionAPI(`/blocks/${targetProductId}/children`)

  // Clear existing content (except first callout - product description)
  console.log(`   🗑️  清除目標頁面內容...`)
  let keepFirst = true
  for (const block of existingBlocks.results) {
    if (keepFirst && block.type === 'callout' && block.callout?.icon?.type === 'emoji') {
      keepFirst = false
      continue
    }
    await callNotionAPI(`/blocks/${block.id}`, 'DELETE')
    await delay(200)
  }

  // Try to copy child_database blocks
  console.log(`   ➕ 嘗試複製 child_database blocks...`)

  for (const block of childDatabaseBlocks) {
    try {
      // Attempt to create a child_database block
      await callNotionAPI(`/blocks/${targetProductId}/children`, 'PATCH', {
        children: [
          {
            type: 'child_database',
            child_database: {
              title: block.child_database?.title || 'Untitled',
            },
          },
        ],
      })
      console.log(`      ✅ 成功複製 1 個 child_database`)
    } catch (error) {
      console.log(`      ❌ 失敗: ${error.message.substring(0, 100)}...`)
      console.log(`      💡 嘗試替代方案：複製 block ID 引用...`)

      // Alternative: try to reference the existing block
      // (This probably won't work, but worth a try)
      try {
        await callNotionAPI(`/blocks/${targetProductId}/children`, 'PATCH', {
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: `Linked Database: ${block.child_database?.title || 'Untitled'}`,
                    },
                  },
                ],
              },
            },
          ],
        })
        console.log(`      ⚠️  改用 paragraph 代替（API 限制）`)
      } catch (altError) {
        console.log(`      ❌ 替代方案也失敗了`)
      }
    }
    await delay(500)
  }

  console.log(`   ✅ 完成複製嘗試`)
}

async function main() {
  console.log('🎨 複製 Ultra Lab 的 linked databases 到其他產品...\n')

  // Get all products
  const productsData = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  // Filter out Ultra Lab and MinYi
  const targetProducts = productsData.results.filter((p) => {
    const name = p.properties.Name?.title?.[0]?.plain_text || ''
    return name !== 'Ultra Lab' && name !== 'MinYi Personal Brand'
  })

  console.log(`找到 ${targetProducts.length} 個目標產品（排除 Ultra Lab 和 MinYi）`)

  for (const product of targetProducts) {
    const productName = product.properties.Name?.title?.[0]?.plain_text || ''
    try {
      await copyBlocksToProduct(product.id, productName)
      await delay(1000)
    } catch (error) {
      console.log(`   ❌ 錯誤: ${error.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 複製嘗試完成！')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('💡 如果看到錯誤，這是 Notion API 限制')
  console.log('   child_database blocks 可能無法通過 API 創建')
  console.log('   你可能需要手動複製貼上到其他產品頁面')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
