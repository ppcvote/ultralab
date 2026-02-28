// Inspect Ultra Lab product page structure
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const ULTRA_LAB_PAGE_ID = '31545842-ecf0-8126-befb-ea27a4ec66f7' // Ultra Lab product page

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
  console.log('🔍 檢查 Ultra Lab 頁面結構...\n')

  // Get all blocks
  const blocks = await callNotionAPI(`/blocks/${ULTRA_LAB_PAGE_ID}/children`)

  console.log(`📊 總共 ${blocks.results.length} 個 blocks\n`)

  // Analyze block types
  const blockTypes = {}
  blocks.results.forEach((block) => {
    blockTypes[block.type] = (blockTypes[block.type] || 0) + 1
  })

  console.log('📋 Block 類型統計：')
  for (const [type, count] of Object.entries(blockTypes)) {
    console.log(`   ${type}: ${count}`)
  }

  // Show all blocks in detail
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📝 詳細 Block 列表：\n')

  blocks.results.forEach((block, i) => {
    console.log(`${i + 1}. ${block.type} (ID: ${block.id})`)

    if (block.type === 'callout') {
      const text = block.callout?.rich_text?.[0]?.text?.content || ''
      console.log(`   內容: ${text.substring(0, 80)}...`)
      console.log(`   顏色: ${block.callout?.color}`)
      console.log(`   Icon: ${block.callout?.icon?.emoji}`)
    } else if (block.type === 'heading_2') {
      const text = block.heading_2?.rich_text?.[0]?.text?.content || ''
      console.log(`   標題: ${text}`)
    } else if (block.type === 'link_to_page') {
      console.log(`   連結類型: ${block.link_to_page?.type}`)
      console.log(`   Database ID: ${block.link_to_page?.database_id}`)
    } else if (block.type === 'child_database') {
      console.log(`   ✨ Child Database 找到了！`)
      console.log(`   Title: ${block.child_database?.title}`)
    } else if (block.type === 'linked_database_mention') {
      console.log(`   ✨ Linked Database Mention 找到了！`)
    }

    console.log('')
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Check for linked databases
  const linkedDBs = blocks.results.filter(
    (b) =>
      b.type === 'child_database' ||
      b.type === 'linked_database' ||
      b.type === 'linked_database_mention'
  )

  if (linkedDBs.length > 0) {
    console.log(`✅ 找到 ${linkedDBs.length} 個 linked database blocks！`)
    console.log('🎯 可以嘗試複製這些 blocks 到其他產品頁面')
  } else {
    console.log('⚠️  沒有找到 linked database blocks')
    console.log('💡 這可能表示你手動添加的 linked databases 在 API 中不可見')
    console.log('   或者被識別為其他 block type')
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('💾 完整 JSON 輸出（供調試用）：\n')
  console.log(JSON.stringify(blocks.results, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
