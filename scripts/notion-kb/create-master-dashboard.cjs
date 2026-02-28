// Create Master Dashboard Page
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

// All database IDs
const DATABASES = {
  products: process.env.NOTION_PRODUCTS_DB_ID,
  blog: process.env.NOTION_BLOG_POSTS_DB_ID,
  techStack: process.env.NOTION_TECH_STACK_DB_ID,
  apiEndpoints: process.env.NOTION_API_ENDPOINTS_DB_ID,
  components: process.env.NOTION_COMPONENTS_DB_ID,
  brandGuidelines: process.env.NOTION_BRAND_GUIDELINES_DB_ID,
  adr: process.env.NOTION_ADR_DB_ID,
  emailTemplates: process.env.NOTION_EMAIL_TEMPLATES_DB_ID,
  inquiries: process.env.NOTION_INQUIRIES_DB_ID,
  probeLeads: process.env.NOTION_PROBE_LEADS_DB_ID,
}

async function callNotionAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
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
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function getDatabaseStats(dbId) {
  if (!dbId) return null

  try {
    const data = await callNotionAPI(`/databases/${dbId}/query`, 'POST', { page_size: 1 })
    return {
      totalEntries: data.results.length > 0 ? '...' : 0, // Notion doesn't give total count directly
      hasEntries: data.results.length > 0
    }
  } catch (error) {
    console.error(`Failed to query database ${dbId}:`, error.message)
    return { totalEntries: 'Error', hasEntries: false }
  }
}

async function createMasterDashboard() {
  console.log('📊 Creating Master Dashboard...\n')

  // Create the page
  const page = await callNotionAPI('/pages', 'POST', {
    parent: {
      type: 'page_id',
      page_id: PARENT_PAGE_ID,
    },
    icon: {
      type: 'emoji',
      emoji: '🎯',
    },
    properties: {
      title: [
        {
          text: {
            content: 'Ultra Creation — Master Dashboard',
          },
        },
      ],
    },
  })

  console.log('✅ Page created:', page.id)

  // Add content blocks
  const blocks = [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: 'Ultra Creation Knowledge Base' } }],
        color: 'purple',
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            text: {
              content: '歡迎來到 Ultra Creation 的中央知識樞紐。這裡整合了 5 個產品品牌的所有資料、技術架構、內容管理系統。',
            },
          },
        ],
        icon: { emoji: '🏠' },
        color: 'blue_background',
      },
    },
    { object: 'block', type: 'divider', divider: {} },

    // Quick Stats
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📈 Quick Stats' } }],
        color: 'blue',
      },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: '🎨 Products: 5 brands\n' } },
          { text: { content: '📝 Blog Posts: 79 articles\n' } },
          { text: { content: '🔧 Tech Stack: 40+ technologies\n' } },
          { text: { content: '🔌 API Endpoints: 22+ endpoints\n' } },
          { text: { content: '🧩 Components: 86+ React components\n' } },
          { text: { content: '🎨 Brand Guidelines: 5 brands documented\n' } },
          { text: { content: '⚙️ Architecture Decisions: 15+ ADRs\n' } },
          { text: { content: '📧 Email Templates: 15 templates' } },
        ],
      },
    },
    { object: 'block', type: 'divider', divider: {} },

    // Core Databases
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🗄️ Core Databases' } }],
        color: 'green',
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '📦 Products Database — 5 產品的完整資訊' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '📝 Blog Posts Database — 79 篇文章集中管理' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '🔧 Tech Stack Registry — 40+ 技術依賴追蹤' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '🔌 API Endpoints Registry — 22+ API 文檔' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '🧩 Component Library — 86+ React components' } }
        ],
      },
    },
    { object: 'block', type: 'divider', divider: {} },

    // Documentation & Guidelines
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📚 Documentation & Guidelines' } }],
        color: 'orange',
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '🎨 Brand Guidelines — 5 品牌視覺規範' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '⚙️ Architecture Decisions (ADR) — 關鍵技術決策記錄' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '📧 Email Templates — 客戶溝通標準化' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: '🚀 Onboarding Guide — 30 分鐘快速導覽' } }
        ],
      },
    },
    { object: 'block', type: 'divider', divider: {} },

    // CRM & Leads
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📊 CRM & Leads' } }],
        color: 'red',
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: 'Ultra Lab - Inquiries — Contact Form submissions' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { text: { content: 'UltraProbe - Security Leads — Email subscribers' } }
        ],
      },
    },
    { object: 'block', type: 'divider', divider: {} },

    // Getting Started
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🎯 Getting Started' } }],
        color: 'purple',
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [
          { text: { content: '新開發者？先讀 Onboarding Guide（30 分鐘）' } }
        ],
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ text: { content: '了解產品線？查看 Products Database' } }],
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ text: { content: '技術細節？探索 Tech Stack + API Endpoints + Components' } }],
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ text: { content: '品牌設計？參考 Brand Guidelines' } }],
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ text: { content: '理解決策？閱讀 Architecture Decisions' } }],
      },
    },
    { object: 'block', type: 'divider', divider: {} },

    // Footer callout
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            text: {
              content: '🤖 這個 Knowledge Base 是 Agent-Ready 的 — 不只是給人類看，更是為 AI Agents 設計的知識基礎設施。所有資料都可透過 Notion API 查詢、更新、自動化。',
            },
          },
        ],
        icon: { emoji: '✨' },
        color: 'gray_background',
      },
    },
  ]

  await callNotionAPI(`/blocks/${page.id}/children`, 'PATCH', { children: blocks })

  console.log('✅ Content blocks added')
  console.log('\n🔗 Master Dashboard URL:', page.url)
  console.log('\n✅ Master Dashboard created!\n')
}

createMasterDashboard()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
