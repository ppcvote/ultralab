// Verify all databases exist and show their info
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY

const DB_IDS = {
  PRODUCTS: process.env.NOTION_PRODUCTS_DB_ID,
  BLOG_POSTS: process.env.NOTION_BLOG_POSTS_DB_ID,
  TECH_STACK: process.env.NOTION_TECH_STACK_DB_ID,
  API_ENDPOINTS: process.env.NOTION_API_ENDPOINTS_DB_ID,
  COMPONENTS: process.env.NOTION_COMPONENTS_DB_ID,
  BRAND_GUIDELINES: process.env.NOTION_BRAND_GUIDELINES_DB_ID,
  ADR: process.env.NOTION_ADR_DB_ID,
  EMAIL_TEMPLATES: process.env.NOTION_EMAIL_TEMPLATES_DB_ID,
  AI_QUERY_TEMPLATES: process.env.NOTION_AI_QUERY_TEMPLATES_DB_ID,
  INQUIRIES: process.env.NOTION_INQUIRIES_DB_ID,
  PROBE_LEADS: process.env.NOTION_PROBE_LEADS_DB_ID,
}

const notion = new Client({ auth: NOTION_API_KEY })

async function main() {
  console.log('🔍 Checking all databases...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  for (const [key, dbId] of Object.entries(DB_IDS)) {
    try {
      const db = await notion.databases.retrieve({ database_id: dbId })

      const title = db.title?.[0]?.plain_text || '(no title)'
      const archived = db.archived ? '🗑️ ARCHIVED' : '✅ Active'
      const url = db.url

      console.log(`${key}:`)
      console.log(`  Title: ${title}`)
      console.log(`  Status: ${archived}`)
      console.log(`  URL: ${url}`)
      console.log(`  ID: ${dbId}`)

      // Query to check if there are pages
      const query = await notion.databases.query({
        database_id: dbId,
        page_size: 1,
      })

      console.log(`  Pages: ${query.results.length > 0 ? `${query.results.length}+ pages` : '0 pages'}`)
      console.log('')
    } catch (error) {
      console.log(`${key}: ❌ ERROR - ${error.message}`)
      console.log('')
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 如果所有資料庫都是 Active，那麼問題可能是：')
  console.log('   1. Notion 搜尋索引延遲（重新整理頁面）')
  console.log('   2. 資料庫沒有被 share 給 integration')
  console.log('   3. 你在錯誤的 workspace 裡搜尋')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
