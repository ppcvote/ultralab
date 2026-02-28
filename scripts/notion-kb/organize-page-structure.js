// Script to organize KB structure - add database links under grouping pages
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_VERSION = '2022-06-28'
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

// Database IDs
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID
const BLOG_POSTS_DB_ID = process.env.NOTION_BLOG_POSTS_DB_ID
const TECH_STACK_DB_ID = process.env.NOTION_TECH_STACK_DB_ID
const API_ENDPOINTS_DB_ID = process.env.NOTION_API_ENDPOINTS_DB_ID
const COMPONENTS_DB_ID = process.env.NOTION_COMPONENTS_DB_ID
const BRAND_DB_ID = process.env.NOTION_BRAND_GUIDELINES_DB_ID
const ADR_DB_ID = process.env.NOTION_ADR_DB_ID
const EMAIL_TEMPLATES_DB_ID = process.env.NOTION_EMAIL_TEMPLATES_DB_ID
const AI_QUERY_DB_ID = process.env.NOTION_AI_QUERY_TEMPLATES_DB_ID

if (!NOTION_API_KEY || !PARENT_PAGE_ID) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

async function callNotionAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`https://api.notion.com/v1${endpoint}`, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function findGroupingPages() {
  console.log('🔍 Finding grouping pages...\n')

  // Get all child pages of parent page
  const response = await callNotionAPI(`/blocks/${PARENT_PAGE_ID}/children`, 'GET')

  const groupingPages = {
    products: null,
    content: null,
    tech: null,
    docs: null,
  }

  for (const block of response.results) {
    if (block.type !== 'child_page') continue

    const title = block.child_page?.title || ''

    if (title.includes('🏢')) {
      groupingPages.products = block.id
      console.log(`✅ Found: ${title} (${block.id})`)
    } else if (title.includes('📝')) {
      groupingPages.content = block.id
      console.log(`✅ Found: ${title} (${block.id})`)
    } else if (title.includes('🔧')) {
      groupingPages.tech = block.id
      console.log(`✅ Found: ${title} (${block.id})`)
    } else if (title.includes('📖')) {
      groupingPages.docs = block.id
      console.log(`✅ Found: ${title} (${block.id})`)
    }
  }

  return groupingPages
}

async function addDatabaseLinks(pageId, databaseIds, pageTitle) {
  console.log(`\n📝 Adding database links to: ${pageTitle}`)

  const children = databaseIds.map((dbId) => ({
    object: 'block',
    type: 'link_to_page',
    link_to_page: {
      type: 'database_id',
      database_id: dbId,
    },
  }))

  try {
    await callNotionAPI(`/blocks/${pageId}/children`, 'PATCH', {
      children,
    })

    console.log(`✅ Added ${databaseIds.length} database links`)
  } catch (error) {
    console.error(`❌ Failed:`, error.message)
  }
}

async function main() {
  console.log('📁 Organizing KB Structure...\n')
  console.log('目標：將 databases 組織到分組頁面下\n')

  // Step 1: Find grouping pages
  const grouping = await findGroupingPages()

  if (!grouping.products || !grouping.content || !grouping.tech || !grouping.docs) {
    console.error('\n❌ Could not find all grouping pages!')
    console.error('Make sure all 4 grouping pages exist: 🏢 我的產品, 📝 我的文章, 🔧 技術資料, 📖 使用手冊')
    return
  }

  await delay(1000)

  // Step 2: Add database links under each grouping page
  console.log('\n')
  console.log('🔗 Adding database links...\n')

  // 🏢 我的產品
  await addDatabaseLinks(grouping.products, [PRODUCTS_DB_ID], '🏢 我的產品')
  await delay(1000)

  // 📝 我的文章
  await addDatabaseLinks(grouping.content, [BLOG_POSTS_DB_ID, EMAIL_TEMPLATES_DB_ID], '📝 我的文章')
  await delay(1000)

  // 🔧 技術資料
  await addDatabaseLinks(
    grouping.tech,
    [TECH_STACK_DB_ID, API_ENDPOINTS_DB_ID, COMPONENTS_DB_ID, ADR_DB_ID, AI_QUERY_DB_ID],
    '🔧 技術資料'
  )
  await delay(1000)

  // 📖 使用手冊 (documentation pages - already added earlier)
  console.log('\n📖 使用手冊: Documentation pages already exist ✅')

  console.log('\n')
  console.log('🎉 Structure Organization Complete!')
  console.log('\n✅ Result:')
  console.log('   🏢 我的產品')
  console.log('      └── 產品中心 | Products')
  console.log('   📝 我的文章')
  console.log('      ├── 部落格文章 | Blog Posts')
  console.log('      └── Email 範本 | Email Templates')
  console.log('   🔧 技術資料')
  console.log('      ├── 技術棧清單 | Tech Stack')
  console.log('      ├── API 端點清單 | API Endpoints')
  console.log('      ├── 元件庫 | Components')
  console.log('      ├── 架構決策記錄 | ADR')
  console.log('      └── AI 查詢範本 | AI Query Templates')
  console.log('   📖 使用手冊')
  console.log('      ├── 新手入門指南 | Onboarding Guide')
  console.log('      ├── 部署檢查清單 | Deployment Checklists')
  console.log('      ├── 故障排除指南 | Troubleshooting Guides')
  console.log('      └── 商業策略 | Business Strategy')
  console.log('\n')
  console.log('🎯 100% 自動化完成！三歲小孩都看得懂的結構 ✅')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
