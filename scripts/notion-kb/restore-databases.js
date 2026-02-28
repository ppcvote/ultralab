// Script to restore all databases from trash
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
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function checkAndRestoreDatabase(dbId, dbName) {
  try {
    console.log(`📋 Checking: ${dbName}...`)

    // Retrieve database
    const database = await notion.databases.retrieve({
      database_id: dbId,
    })

    if (database.archived) {
      console.log(`   🗑️  ARCHIVED! Restoring...`)

      // Restore from trash
      await notion.databases.update({
        database_id: dbId,
        archived: false,
      })

      console.log(`   ✅ RESTORED: ${dbName}`)
      return { name: dbName, status: 'restored' }
    } else {
      console.log(`   ✅ OK: ${dbName}`)
      return { name: dbName, status: 'ok' }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${dbName} - ${error.message}`)
    return { name: dbName, status: 'error', error: error.message }
  }
}

async function main() {
  console.log('🔍 Checking all databases for archived status...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const results = []

  // Check all databases
  for (const [key, dbId] of Object.entries(DB_IDS)) {
    const result = await checkAndRestoreDatabase(dbId, key)
    results.push(result)
    await delay(500)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Summary:\n')

  const restored = results.filter((r) => r.status === 'restored')
  const ok = results.filter((r) => r.status === 'ok')
  const errors = results.filter((r) => r.status === 'error')

  if (restored.length > 0) {
    console.log(`✅ Restored from trash: ${restored.length}`)
    restored.forEach((r) => console.log(`   - ${r.name}`))
  }

  if (ok.length > 0) {
    console.log(`\n✅ Already active: ${ok.length}`)
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors: ${errors.length}`)
    errors.forEach((r) => console.log(`   - ${r.name}: ${r.error}`))
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (restored.length > 0) {
    console.log(`\n🎉 Successfully restored ${restored.length} databases!`)
    console.log('💡 Refresh your Notion workspace to see the changes.')
  } else if (errors.length === 0) {
    console.log('\n✅ All databases are active. No restoration needed.')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
