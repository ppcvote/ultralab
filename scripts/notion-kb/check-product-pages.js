// Check what's inside product pages
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID

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
    throw new Error(`API Error: ${data.message}`)
  }

  return data
}

async function main() {
  console.log('🔍 檢查產品頁面內容...\n')

  // Get all products
  const productsData = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  console.log(`找到 ${productsData.results.length} 個產品\n`)

  for (const product of productsData.results) {
    const productName = product.properties.Name?.title?.[0]?.plain_text || '(無名稱)'
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📦 ${productName}`)
    console.log(`   ID: ${product.id}`)

    // Get blocks inside this product page
    const blocks = await callNotionAPI(`/blocks/${product.id}/children`)

    console.log(`   📊 總共 ${blocks.results.length} 個 blocks`)

    if (blocks.results.length === 0) {
      console.log(`   ⚠️  空白頁面！`)
    } else {
      console.log(`   📋 Block 類型：`)
      const blockTypes = {}
      blocks.results.forEach((block) => {
        blockTypes[block.type] = (blockTypes[block.type] || 0) + 1
      })
      for (const [type, count] of Object.entries(blockTypes)) {
        console.log(`      - ${type}: ${count}`)
      }

      // Show first few blocks
      console.log(`   🔍 前 3 個 blocks:`)
      blocks.results.slice(0, 3).forEach((block, i) => {
        console.log(`      ${i + 1}. ${block.type}`)
        if (block.type === 'callout') {
          const text = block.callout?.rich_text?.[0]?.text?.content || ''
          console.log(`         內容: ${text.substring(0, 50)}...`)
        } else if (block.type === 'heading_2') {
          const text = block.heading_2?.rich_text?.[0]?.text?.content || ''
          console.log(`         標題: ${text}`)
        }
      })
    }
    console.log('')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('✅ 檢查完成')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
