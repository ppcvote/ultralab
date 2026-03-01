/**
 * Populate Ultra Command Center Master Dashboard (Client Showcase Version)
 * 為客戶展示用的精美版本，使用描述性內容替代 linked database views
 */

require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

const DATABASES = {
  products: process.env.NOTION_PRODUCTS_DB_ID,
  blog: process.env.NOTION_BLOG_POSTS_DB_ID,
  techStack: process.env.NOTION_TECH_STACK_DB_ID,
  apis: process.env.NOTION_API_ENDPOINTS_DB_ID,
  components: process.env.NOTION_COMPONENTS_DB_ID,
  brand: process.env.NOTION_BRAND_GUIDELINES_DB_ID,
  adr: process.env.NOTION_ADR_DB_ID,
  emailTemplates: process.env.NOTION_EMAIL_TEMPLATES_DB_ID,
  inquiries: process.env.NOTION_INQUIRIES_DB_ID,
  probeLeads: process.env.NOTION_PROBE_LEADS_DB_ID,
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

function createDatabaseCard(emoji, title, description, stats) {
  return [
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: { content: title },
          annotations: { bold: true }
        }],
        icon: { emoji },
        color: 'gray_background'
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: description }
        }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{
          type: 'text',
          text: { content: stats },
          annotations: { code: true }
        }]
      }
    }
  ]
}

async function populateDashboard() {
  console.log('🚀 Populating Ultra Command Center Dashboard (Showcase Version)...')
  console.log('=' .repeat(60))

  const allBlocks = [
    // Hero Section
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
        }]
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

    ...createDatabaseCard(
      '📦',
      'Products Database',
      '5 個產品品牌的中央資訊樞紐 — Ultra Lab, Ultra Advisor, Mind Threads, UltraProbe, MinYi',
      '5 products | Tech stack relations | Revenue tracking | Live URLs'
    ),

    ...createDatabaseCard(
      '📝',
      'Blog Posts Database',
      '79 篇文章的集中管理與 SEO 追蹤 — 自動匯入 .md 和 .ts 檔案',
      '79 articles | 12 from Ultra Lab + 67 from Ultra Advisor | Auto-categorized'
    ),

    ...createDatabaseCard(
      '🔧',
      'Tech Stack Registry',
      '所有技術依賴追蹤與成本管理 — React, Firebase, Vercel, Tailwind v4, etc.',
      '40+ technologies | Cost tracking | Version management | License tracking'
    ),

    ...createDatabaseCard(
      '🔌',
      'API Endpoints Registry',
      '完整的 API 文檔與監控 — 22+ endpoints from api/ folders',
      '22+ endpoints | Method + Auth + Rate limits | Public/Private classification'
    ),

    ...createDatabaseCard(
      '🧩',
      'Component Library',
      '86+ React components 追蹤與重用 — 自動掃描 src/components/',
      '86+ components | 12 Ultra Lab + 74 Ultra Advisor | Complexity ratings'
    ),

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
        }]
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

    ...createDatabaseCard(
      '🎨',
      'Brand Guidelines',
      '5 個品牌的視覺一致性保證 — Color codes, Typography, Design principles',
      '5 brands | Primary colors | Font families | Logo files | Theme types'
    ),

    ...createDatabaseCard(
      '⚙️',
      'Architecture Decisions (ADR)',
      '關鍵技術決策的脈絡保存 — Tailwind v4 CSS layers, Vercel tsconfig, Fire-and-forget pattern',
      '10+ ADRs | Context + Decision + Consequences | Critical severity tracking'
    ),

    ...createDatabaseCard(
      '📧',
      'Email Templates',
      '客戶溝通標準化 — 12-15 templates by service type and budget tier',
      '12-15 templates | Budget tiers | Service types | Success rate tracking'
    ),

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
        }]
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

    ...createDatabaseCard(
      '💬',
      'Ultra Lab - Inquiries',
      'Contact Form 提交記錄 — 自動同步 Firestore + Telegram + Email',
      'Auto-sync from ultralab.tw/kb contact form | Fire-and-forget pattern'
    ),

    ...createDatabaseCard(
      '🔍',
      'UltraProbe - Security Leads',
      'AI 安全掃描工具 leads — Email subscribers + scan results',
      'Email collection | Scan type tracking | Lead scoring | Follow-up status'
    ),

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
        }]
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

    ...createDatabaseCard(
      '💡',
      'Mind Threads - Topics',
      '主題庫 — Keywords, Target audience, Tone, Category, Priority',
      'Topic management | Audience targeting | Content categorization | Posts count tracking'
    ),

    ...createDatabaseCard(
      '📄',
      'Mind Threads - Posts',
      '文章庫 (Notion as CMS) — 6 accounts, 35 posts/day, Gemini AI generated',
      'Multi-account | Scheduled publishing | AI modes | Performance metrics | Threads API integration'
    ),

    { object: 'block', type: 'divider', divider: {} },

    // Footer Callouts
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

    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: { content: '📊 統計數據: ' },
            annotations: { bold: true }
          },
          {
            type: 'text',
            text: { content: '12 databases | 230+ pages | 70% automation | 30-min onboarding | 0-sec AI agent onboarding' }
          }
        ],
        icon: { emoji: '📈' },
        color: 'blue_background'
      }
    },

    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{
          type: 'text',
          text: {
            content: '✨ 這是客戶付費後會獲得的 Knowledge Base 架構展示。實際交付時，所有 database views 將完整嵌入，並填入客戶自己的資料。'
          }
        }],
        icon: { emoji: '🎁' },
        color: 'purple_background'
      }
    }
  ]

  try {
    console.log(`\n📝 Adding ${allBlocks.length} blocks to dashboard...`)

    const result = await addBlocks(allBlocks)

    console.log('\n✅ Dashboard showcase created successfully!')
    console.log(`   Added ${result.results.length} blocks`)
    console.log(`\n🔗 View your dashboard at:`)
    console.log(`   https://www.notion.so/Ultra-Command-Center-${PARENT_PAGE_ID.replace(/-/g, '')}`)
    console.log(`\n💡 This is the CLIENT SHOWCASE version.`)
    console.log(`   For working version with embedded databases, manually link them via Notion UI.`)

  } catch (error) {
    console.error('\n❌ Failed to populate dashboard:', error.message)
    throw error
  }
}

async function main() {
  console.log('🎯 Ultra Command Center Dashboard Builder (Showcase)')
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
  console.log('✨ Dashboard showcase is ready for client presentations!')
  console.log('\n🎨 Perfect for product demos. No yellow placeholders, looks complete.')
}

main()
