// Try to create linked database view using SDK
import { Client } from '@notionhq/client'
import 'dotenv/config'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Test with UltraProbe product page
const PRODUCT_PAGE_ID = '31545842-ecf0-81e2-ba29-ca95a87e0171' // UltraProbe
const TECH_STACK_DB_ID = process.env.NOTION_TECH_STACK_DB_ID

async function tryLinkedDatabase() {
  console.log('🧪 嘗試建立 linked database...\n')

  try {
    // Method 1: Try child_database
    console.log('📝 方法 1: child_database')
    const result1 = await notion.blocks.children.append({
      block_id: PRODUCT_PAGE_ID,
      children: [
        {
          type: 'child_database',
          child_database: {
            title: '測試技術棧',
          },
        },
      ],
    })
    console.log('✅ 成功！', result1)
  } catch (error) {
    console.log('❌ 失敗:', error.message)
  }

  try {
    // Method 2: Try linked_database_mention
    console.log('\n📝 方法 2: linked_database_mention')
    const result2 = await notion.blocks.children.append({
      block_id: PRODUCT_PAGE_ID,
      children: [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'mention',
                mention: {
                  type: 'database',
                  database: { id: TECH_STACK_DB_ID },
                },
              },
            ],
          },
        },
      ],
    })
    console.log('✅ 成功！', result2)
  } catch (error) {
    console.log('❌ 失敗:', error.message)
  }

  try {
    // Method 3: Try embed
    console.log('\n📝 方法 3: embed')
    const result3 = await notion.blocks.children.append({
      block_id: PRODUCT_PAGE_ID,
      children: [
        {
          type: 'embed',
          embed: {
            url: `https://www.notion.so/${TECH_STACK_DB_ID.replace(/-/g, '')}`,
          },
        },
      ],
    })
    console.log('✅ 成功！', result3)
  } catch (error) {
    console.log('❌ 失敗:', error.message)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 結論：可能都不行，Notion API 就是不支援 😭')
}

tryLinkedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err)
    process.exit(1)
  })
