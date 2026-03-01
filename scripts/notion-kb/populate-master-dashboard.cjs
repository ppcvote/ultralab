/**
 * Populate Ultra Command Center Master Dashboard
 * 自動填充戰情室 Dashboard，展示完整的 Knowledge Base 架構
 */

require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

// All Database IDs
const DATABASES = {
  // Core Databases
  products: process.env.NOTION_PRODUCTS_DB_ID,
  blog: process.env.NOTION_BLOG_POSTS_DB_ID,
  techStack: process.env.NOTION_TECH_STACK_DB_ID,
  apis: process.env.NOTION_API_ENDPOINTS_DB_ID,
  components: process.env.NOTION_COMPONENTS_DB_ID,

  // Documentation
  brand: process.env.NOTION_BRAND_GUIDELINES_DB_ID,
  adr: process.env.NOTION_ADR_DB_ID,
  emailTemplates: process.env.NOTION_EMAIL_TEMPLATES_DB_ID,

  // CRM
  inquiries: process.env.NOTION_INQUIRIES_DB_ID,
  probeLeads: process.env.NOTION_PROBE_LEADS_DB_ID,

  // Mind Threads
  topics: process.env.NOTION_MINDTHREADS_TOPICS_DB_ID,
  posts: process.env.NOTION_MINDTHREADS_POSTS_DB_ID
}

async function callNotionAPI(endpoint, body) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function addBlock(blockData) {
  return callNotionAPI(`/blocks/${PARENT_PAGE_ID}/children`, {
    children: [blockData]
  })
}

async function populateDashboard() {
  console.log('🚀 Populating Ultra Command Center Dashboard...')
  console.log('=' .repeat(60))

  try {
    console.log(`\n📝 Building dashboard structure...`)

    let count = 0

    // Welcome Callout
    await addBlock({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: {
            content: '歡迎來到 Ultra Lab Knowledge Base！這是一個 Agent-Ready 的知識中樞，整合了 5 個產品品牌、79 篇 blog 文章、200+ 技術組件。30 分鐘 onboard 新開發者，0 秒 onboard AI Agents。'
          }
        }],
        icon: { emoji: '🎯' },
        color: 'purple_background'
      }
    })
    count++
    console.log(`   ✓ Added welcome callout (${count}/27)`)

    // Divider
    await addBlock({ type: 'divider', divider: {} })
    count++

    // Core Databases Section
    await addBlock({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{
          type: 'text',
          text: { content: '📊 Core Databases' },
          annotations: { bold: true }
        }],
        color: 'default'
      }
    })
    count++
    console.log(`   ✓ Added Core Databases section (${count}/27)`)

    await addBlock({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: '核心資料庫 — 產品、內容、技術棧的統一管理中心' },
          annotations: { italic: true }
        }],
        color: 'gray'
      }
    })
    count++

    // Products Database
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.products
      }
    })
    count++
    console.log(`   ✓ Linked Products database (${count}/27)`)

    // Blog Posts Database
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.blog
      }
    })
    count++
    console.log(`   ✓ Linked Blog Posts database (${count}/27)`)

    // Tech Stack Registry
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.techStack
      }
    })
    count++
    console.log(`   ✓ Linked Tech Stack database (${count}/27)`)

    // API Endpoints Registry
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.apis
      }
    })
    count++
    console.log(`   ✓ Linked API Endpoints database (${count}/27)`)

    // Component Library
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.components
      }
    })
    count++
    console.log(`   ✓ Linked Components database (${count}/27)`)

    // Divider
    await addBlock({ object: 'block', type: 'divider', divider: {} })
    count++

    // Documentation Section
    await addBlock({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{
          type: 'text',
          text: { content: '📚 Documentation & Guidelines' },
          annotations: { bold: true }
        }],
        color: 'default'
      }
    })
    count++
    console.log(`   ✓ Added Documentation section (${count}/27)`)

    await addBlock({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: '品牌規範、技術決策、溝通模板 — 確保一致性的核心文件' },
          annotations: { italic: true }
        }],
        color: 'gray'
      }
    })
    count++

    // Brand Guidelines
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.brand
      }
    })
    count++
    console.log(`   ✓ Linked Brand Guidelines database (${count}/27)`)

    // Architecture Decisions (ADR)
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.adr
      }
    })
    count++
    console.log(`   ✓ Linked ADR database (${count}/27)`)

    // Email Templates
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.emailTemplates
      }
    })
    count++
    console.log(`   ✓ Linked Email Templates database (${count}/27)`)

    // Divider
    await addBlock({ object: 'block', type: 'divider', divider: {} })
    count++

    // CRM Section
    await addBlock({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{
          type: 'text',
          text: { content: '💼 CRM & Lead Management' },
          annotations: { bold: true }
        }],
        color: 'default'
      }
    })
    count++
    console.log(`   ✓ Added CRM section (${count}/27)`)

    await addBlock({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: '客戶詢問、安全掃描 leads — 自動同步 Firestore 與 Notion' },
          annotations: { italic: true }
        }],
        color: 'gray'
      }
    })
    count++

    // Customer Inquiries
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.inquiries
      }
    })
    count++
    console.log(`   ✓ Linked Inquiries database (${count}/27)`)

    // UltraProbe Security Leads
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.probeLeads
      }
    })
    count++
    console.log(`   ✓ Linked Probe Leads database (${count}/27)`)

    // Divider
    await addBlock({ object: 'block', type: 'divider', divider: {} })
    count++

    // Mind Threads Section
    await addBlock({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{
          type: 'text',
          text: { content: '🧵 Mind Threads Content Hub' },
          annotations: { bold: true }
        }],
        color: 'default'
      }
    })
    count++
    console.log(`   ✓ Added Mind Threads section (${count}/27)`)

    await addBlock({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: 'Threads 多帳號自動化內容管理 — Notion as CMS' },
          annotations: { italic: true }
        }],
        color: 'gray'
      }
    })
    count++

    // Topics Database
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.topics
      }
    })
    count++
    console.log(`   ✓ Linked Topics database (${count}/27)`)

    // Posts Database
    await addBlock({
      object: 'block',
      type: 'linked_database',
      linked_database: {
        database_id: DATABASES.posts
      }
    })
    count++
    console.log(`   ✓ Linked Posts database (${count}/27)`)

    // Divider
    await addBlock({ object: 'block', type: 'divider', divider: {} })
    count++

    // Footer Callout
    await addBlock({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: {
            content: '🚀 這個 Knowledge Base 由 Ultra Lab 建置，展示了 Agent-Ready 知識管理的最佳實踐。所有 databases 自動同步，90%+ 內容由 automation scripts 匯入。'
          }
        }],
        icon: { emoji: '💡' },
        color: 'green_background'
      }
    })
    count++
    console.log(`   ✓ Added footer callout (${count}/27)`)

    console.log('\n✅ Dashboard populated successfully!')
    console.log(`   Added ${count} blocks total`)
    console.log(`\n🔗 View your dashboard at:`)
    console.log(`   https://www.notion.so/Ultra-Command-Center-${PARENT_PAGE_ID.replace(/-/g, '')}`)

  } catch (error) {
    console.error('\n❌ Failed to populate dashboard:', error.message)
    throw error
  }
}

async function main() {
  console.log('🎯 Ultra Command Center Dashboard Builder')
  console.log('=' .repeat(60))
  console.log(`📄 Parent Page ID: ${PARENT_PAGE_ID}`)
  console.log(`🗄️  Total Databases: ${Object.keys(DATABASES).length}`)
  console.log()

  // Verify all database IDs
  const missingDbs = Object.entries(DATABASES).filter(([key, id]) => !id)
  if (missingDbs.length > 0) {
    console.error('❌ Missing Database IDs:')
    missingDbs.forEach(([key]) => console.error(`   - ${key}`))
    process.exit(1)
  }

  console.log('✅ All database IDs verified\n')

  await populateDashboard()

  console.log('\n' + '='.repeat(60))
  console.log('✨ Dashboard is ready to showcase to clients!')
  console.log('\n💡 Next Steps:')
  console.log('   1. Open the dashboard URL above')
  console.log('   2. Verify all linked databases are visible')
  console.log('   3. Customize views (Table, Gallery, Board) as needed')
  console.log('   4. Share with your team or clients')
}

main()
