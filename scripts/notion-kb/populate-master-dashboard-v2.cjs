/**
 * Populate Ultra Command Center Master Dashboard (API limitations workaround)
 * 由於 Notion API 不支援建立 linked_database blocks，改用 callout placeholders
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

async function addBlocks(blocks) {
  const response = await fetch(`https://api.notion.com/v1/blocks/${PARENT_PAGE_ID}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({ children: blocks }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function populateDashboard() {
  console.log('🚀 Populating Ultra Command Center Dashboard...')
  console.log('=' .repeat(60))

  const allBlocks = [
    // Welcome Callout
    {
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
    },

    // Divider
    { object: 'block', type: 'divider', divider: {} },

    // Core Databases Section
    {
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
    },
    {
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
    },

    // Core Databases - 5 databases
    ...['Products', 'Blog Posts', 'Tech Stack Registry', 'API Endpoints Registry', 'Component Library'].map(name => ({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: { content: `⬇️ 在此下方輸入 /linked view，選擇「${name}」database` },
          annotations: { bold: true }
        }],
        icon: { emoji: '📌' },
        color: 'yellow_background'
      }
    })),

    // Divider
    { object: 'block', type: 'divider', divider: {} },

    // Documentation Section
    {
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
    },
    {
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
    },

    // Documentation - 3 databases
    ...['Brand Guidelines', 'Architecture Decisions (ADR)', 'Email Templates'].map(name => ({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: { content: `⬇️ 在此下方輸入 /linked view，選擇「${name}」database` },
          annotations: { bold: true }
        }],
        icon: { emoji: '📌' },
        color: 'yellow_background'
      }
    })),

    // Divider
    { object: 'block', type: 'divider', divider: {} },

    // CRM Section
    {
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
    },
    {
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
    },

    // CRM - 2 databases
    ...['Ultra Lab - Inquiries', 'UltraProbe - Security Leads'].map(name => ({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: { content: `⬇️ 在此下方輸入 /linked view，選擇「${name}」database` },
          annotations: { bold: true }
        }],
        icon: { emoji: '📌' },
        color: 'yellow_background'
      }
    })),

    // Divider
    { object: 'block', type: 'divider', divider: {} },

    // Mind Threads Section
    {
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
    },
    {
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
    },

    // Mind Threads - 2 databases
    ...['Mind Threads - Topics', 'Mind Threads - Posts'].map(name => ({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: { content: `⬇️ 在此下方輸入 /linked view，選擇「${name}」database` },
          annotations: { bold: true }
        }],
        icon: { emoji: '📌' },
        color: 'yellow_background'
      }
    })),

    // Divider
    { object: 'block', type: 'divider', divider: {} },

    // Footer Callout
    {
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
    },

    // Final instruction callout
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: {
            content: '⚠️ 完成設定後，記得刪除所有黃色的「⬇️ 在此設定視圖」callouts，讓 dashboard 更簡潔美觀！'
          }
        }],
        icon: { emoji: '⚙️' },
        color: 'orange_background'
      }
    }
  ]

  try {
    console.log(`\n📝 Adding ${allBlocks.length} blocks to dashboard...`)

    const result = await addBlocks(allBlocks)

    console.log('\n✅ Dashboard structure created successfully!')
    console.log(`   Added ${result.results.length} blocks`)
    console.log(`\n🔗 View your dashboard at:`)
    console.log(`   https://www.notion.so/Ultra-Command-Center-${PARENT_PAGE_ID.replace(/-/g, '')}`)
    console.log(`\n💡 Next Steps:`)
    console.log(`   1. Open the dashboard URL above`)
    console.log(`   2. 在每個黃色 callout 下方輸入 /linked view`)
    console.log(`   3. 選擇對應的 database`)
    console.log(`   4. 刪除黃色 callouts（完成設定後）`)

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
  console.log('✨ Dashboard structure is ready!')
  console.log('\n🎨 To showcase to clients, manually link all databases now.')
}

main()
