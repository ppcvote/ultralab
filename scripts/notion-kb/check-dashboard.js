import { Client } from '@notionhq/client'
import 'dotenv/config'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const pageId = process.env.NOTION_PARENT_PAGE_ID

console.log('🔍 檢查 Dashboard 設定狀態...\n')

try {
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  })

  console.log(`📊 總共 ${blocks.results.length} 個 blocks\n`)

  // Count block types
  const blockTypes = {}
  blocks.results.forEach((block) => {
    blockTypes[block.type] = (blockTypes[block.type] || 0) + 1
  })

  console.log('📋 Block 類型統計：')
  for (const [type, count] of Object.entries(blockTypes)) {
    console.log(`   ${type}: ${count}`)
  }

  // Check for linked databases
  const linkedDBs = blocks.results.filter(
    (b) => b.type === 'child_database' || b.type === 'linked_database'
  )

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 檢查結果：\n')

  if (linkedDBs.length > 0) {
    console.log(`✅ 成功！找到 ${linkedDBs.length} 個嵌入的 database views！`)
    console.log('🎉 你已經完成設定了！')
    console.log('\n💡 下一步：刪除所有黃色的「⬇️ 在此設定視圖」callouts')
  } else {
    console.log('⏳ 還沒有嵌入的 database views')
    console.log('💡 記得在黃色 callout 下方輸入 /linked 來添加 database')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
} catch (error) {
  console.error('❌ 錯誤:', error.message)
}
