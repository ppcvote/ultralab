// Script to optimize Notion KB structure for human-friendly UX
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

// All database IDs
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

if (!NOTION_API_KEY || !NOTION_PARENT_PAGE_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_PARENT_PAGE_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Step 1: Rename all databases (Chinese first | English)
const databaseRenames = [
  { id: DB_IDS.PRODUCTS, newTitle: '產品中心 | Products' },
  { id: DB_IDS.BLOG_POSTS, newTitle: '部落格文章 | Blog Posts' },
  { id: DB_IDS.TECH_STACK, newTitle: '技術棧清單 | Tech Stack' },
  { id: DB_IDS.API_ENDPOINTS, newTitle: 'API 端點清單 | API Endpoints' },
  { id: DB_IDS.COMPONENTS, newTitle: '元件庫 | Components' },
  { id: DB_IDS.BRAND_GUIDELINES, newTitle: '品牌規範 | Brand Guidelines' },
  { id: DB_IDS.ADR, newTitle: '架構決策記錄 | ADR' },
  { id: DB_IDS.EMAIL_TEMPLATES, newTitle: 'Email 範本 | Email Templates' },
  { id: DB_IDS.AI_QUERY_TEMPLATES, newTitle: 'AI 查詢範本 | AI Query Templates' },
  { id: DB_IDS.INQUIRIES, newTitle: '客戶詢問 | Inquiries' },
  { id: DB_IDS.PROBE_LEADS, newTitle: '安全掃描 Leads | Security Leads' },
]

async function renameDatabase(dbId, newTitle) {
  try {
    await notion.databases.update({
      database_id: dbId,
      title: [
        {
          text: {
            content: newTitle,
          },
        },
      ],
    })
    console.log(`✅ Renamed database: ${newTitle}`)
  } catch (error) {
    console.error(`❌ Failed to rename database ${dbId}:`, error.message)
  }
}

// Step 2: Add relations to Products database
async function addProductRelations() {
  try {
    console.log('\n🔗 Adding relations to Products database...')

    // Get current database schema
    const database = await notion.databases.retrieve({
      database_id: DB_IDS.PRODUCTS,
    })

    // Add 5 relation properties
    const newProperties = {
      ...database.properties,
      'Blog Posts': {
        relation: {
          database_id: DB_IDS.BLOG_POSTS,
          type: 'dual_property',
          dual_property: {
            synced_property_name: 'Product',
          },
        },
      },
      'Tech Stack': {
        relation: {
          database_id: DB_IDS.TECH_STACK,
          type: 'dual_property',
          dual_property: {
            synced_property_name: 'Used By',
          },
        },
      },
      'API Endpoints': {
        relation: {
          database_id: DB_IDS.API_ENDPOINTS,
          type: 'dual_property',
          dual_property: {
            synced_property_name: 'Product',
          },
        },
      },
      Components: {
        relation: {
          database_id: DB_IDS.COMPONENTS,
          type: 'dual_property',
          dual_property: {
            synced_property_name: 'Product',
          },
        },
      },
      Brand: {
        relation: {
          database_id: DB_IDS.BRAND_GUIDELINES,
          type: 'dual_property',
          dual_property: {
            synced_property_name: 'Product',
          },
        },
      },
    }

    await notion.databases.update({
      database_id: DB_IDS.PRODUCTS,
      properties: newProperties,
    })

    console.log('✅ Added 5 relations to Products database')
  } catch (error) {
    console.error('❌ Failed to add relations:', error.message)
    // Continue even if this fails
  }
}

// Step 3: Create grouping pages
async function createGroupingPages() {
  console.log('\n📁 Creating grouping pages...')

  const groupPages = [
    {
      title: '🏢 我的產品',
      emoji: '🏢',
      content: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '👉 點擊下方查看所有產品（Ultra Lab、Ultra Advisor、Mind Threads、UltraProbe、MinYi）',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '每個產品頁面都包含相關的部落格文章、技術棧、API、元件和品牌規範。',
                },
              },
            ],
          },
        },
      ],
    },
    {
      title: '📝 我的文章',
      emoji: '📝',
      content: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '👉 包含：部落格文章（73 篇）、Email 範本（12 個）',
                },
              },
            ],
          },
        },
      ],
    },
    {
      title: '🔧 技術資料',
      emoji: '🔧',
      content: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '👉 給工程師看的：技術棧清單、API 端點清單、元件庫、架構決策記錄、AI 查詢範本',
                },
              },
            ],
          },
        },
      ],
    },
    {
      title: '📖 使用手冊',
      emoji: '📖',
      content: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '👉 新手看這裡：新手入門指南、部署檢查清單、故障排除指南、商業策略',
                },
              },
            ],
          },
        },
      ],
    },
  ]

  const createdPages = []

  for (const page of groupPages) {
    try {
      const result = await notion.pages.create({
        parent: { page_id: NOTION_PARENT_PAGE_ID },
        icon: {
          type: 'emoji',
          emoji: page.emoji,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: page.title,
                },
              },
            ],
          },
        },
        children: page.content,
      })

      createdPages.push({ title: page.title, id: result.id })
      console.log(`✅ Created: ${page.title}`)
      await delay(500)
    } catch (error) {
      console.error(`❌ Failed to create ${page.title}:`, error.message)
    }
  }

  return createdPages
}

// Main execution
async function main() {
  console.log('🚀 Optimizing Notion KB Structure...\n')
  console.log('目標：簡單到三歲小孩都看得懂 + 專業給 AI 看\n')

  // Step 1: Rename all databases
  console.log('📝 Step 1: Renaming databases (中文化)...\n')
  for (const rename of databaseRenames) {
    await renameDatabase(rename.id, rename.newTitle)
    await delay(500)
  }

  // Step 2: Add relations to Products
  console.log('\n🔗 Step 2: Adding relations to Products database...')
  await addProductRelations()
  await delay(1000)

  // Step 3: Create grouping pages
  console.log('\n📁 Step 3: Creating grouping pages...')
  const createdPages = await createGroupingPages()

  // Summary
  console.log('\n')
  console.log('🎉 Optimization Complete!')
  console.log('\n✅ Completed Tasks:')
  console.log(`   📝 Renamed ${databaseRenames.length} databases`)
  console.log('   🔗 Added 5 relations to Products database')
  console.log(`   📁 Created ${createdPages.length} grouping pages`)
  console.log('\n')
  console.log('📚 Created Grouping Pages:')
  createdPages.forEach((page) => {
    console.log(`   ✅ ${page.title}`)
    console.log(`      Page ID: ${page.id}`)
  })
  console.log('\n')
  console.log('📌 Next Steps (Manual - 5 minutes):')
  console.log('1. Go to Notion parent page: 傲創知識庫 | Ultra Creation Knowledge Base')
  console.log('2. Drag databases under the corresponding grouping pages:')
  console.log('   - 產品中心 | Products → under 🏢 我的產品')
  console.log('   - 部落格文章, Email 範本 → under 📝 我的文章')
  console.log('   - 技術棧清單, API 端點, 元件庫, ADR, AI 查詢範本 → under 🔧 技術資料')
  console.log('   - Onboarding Guide, Deployment, Troubleshooting, Business Strategy → under 📖 使用手冊')
  console.log('3. Optionally: Hide the original flat databases from main page view')
  console.log('\n')
  console.log('🎯 Result: 簡單到三歲小孩都看得懂的結構 ✅')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
