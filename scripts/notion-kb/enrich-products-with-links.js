// Add linked database references to product pages
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID
const BLOG_DB_ID = process.env.NOTION_BLOG_POSTS_DB_ID
const TECH_STACK_DB_ID = process.env.NOTION_TECH_STACK_DB_ID
const API_DB_ID = process.env.NOTION_API_ENDPOINTS_DB_ID
const COMPONENTS_DB_ID = process.env.NOTION_COMPONENTS_DB_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function callNotionAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
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
    throw new Error(`API Error: ${data.message}`)
  }

  return data
}

// Product info
const PRODUCT_INFO = {
  'Ultra Lab': {
    description:
      '技術服務品牌 | 提供 IG Reel 自動化、Threads 多帳號管理、短影音產製、SaaS 全端建置、AI 串接等服務。暗紫色主題 (#8A5CFF → #CE4DFF)，React 18 + Vite + Tailwind v4 + Firebase。',
    emoji: '🟣',
    color: 'purple_background',
  },
  'Ultra Advisor': {
    description:
      '財務規劃 SaaS 平台 | 18 個財務工具 + 67 篇 blog，專為財務顧問設計。藍色主題 (#2E6BFF) + 紅色強調 (#FF3A3A)，目標 NT$3000萬營收。',
    emoji: '🔵',
    color: 'blue_background',
  },
  'Mind Threads': {
    description:
      'Threads 多帳號自動化 SaaS | NT$1,990/月訂閱制，Meta Threads API + Gemini AI 驅動。成功案例：GinRollBT 6 個月 6500+ 粉絲。',
    emoji: '💬',
    color: 'default',
  },
  UltraProbe: {
    description:
      'AI 安全掃描工具 | Prompt + URL 掃描，Free tier + Pro API ($0.01/scan)。Gemini 2.5 Flash 驅動，整合於 Ultra Lab (/probe)。',
    emoji: '🔍',
    color: 'default',
  },
  MinYi: {
    description:
      'MDRT 財務顧問個人頁面 | 淺色主題 (#1E40AF 藍色)，產品商店 + 諮詢預約。IG Bio landing page，整合於 Ultra Lab (/minyi)。',
    emoji: '👤',
    color: 'default',
  },
}

async function enrichProductPage(productId, productName) {
  console.log(`\n📝 豐富化: ${productName}`)

  const info = PRODUCT_INFO[productName]
  if (!info) {
    console.log(`   ⏭️  跳過 (無描述資訊)`)
    return
  }

  // Build content blocks with link_to_page
  const blocks = [
    // Product description
    {
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: info.emoji },
        color: info.color,
        rich_text: [
          { text: { content: '產品簡介 | Overview' }, annotations: { bold: true } },
          { text: { content: `\n${info.description}` } },
        ],
      },
    },
    { type: 'divider', divider: {} },

    // Related Blog Posts
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📰 相關文章 | Related Blog Posts' } }],
        color: 'orange',
      },
    },
    {
      type: 'link_to_page',
      link_to_page: {
        type: 'database_id',
        database_id: BLOG_DB_ID,
      },
    },
    {
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `點擊上方連結 → 在 database 中設定篩選條件：「Related to 產品中心 包含 ${productName}」`,
            },
          },
        ],
      },
    },

    { type: 'divider', divider: {} },

    // Tech Stack
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '⚙️ 技術棧 | Tech Stack' } }],
        color: 'blue',
      },
    },
    {
      type: 'link_to_page',
      link_to_page: {
        type: 'database_id',
        database_id: TECH_STACK_DB_ID,
      },
    },
    {
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `點擊上方連結 → 在 database 中設定篩選條件：「Used By 產品 包含 ${productName}」`,
            },
          },
        ],
      },
    },

    { type: 'divider', divider: {} },

    // API Endpoints
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🔌 API 端點 | API Endpoints' } }],
        color: 'blue',
      },
    },
    {
      type: 'link_to_page',
      link_to_page: {
        type: 'database_id',
        database_id: API_DB_ID,
      },
    },
    {
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `點擊上方連結 → 在 database 中設定篩選條件：「Product 包含 ${productName}」`,
            },
          },
        ],
      },
    },

    { type: 'divider', divider: {} },

    // Components
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🧩 元件庫 | Component Library' } }],
        color: 'blue',
      },
    },
    {
      type: 'link_to_page',
      link_to_page: {
        type: 'database_id',
        database_id: COMPONENTS_DB_ID,
      },
    },
    {
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `點擊上方連結 → 在 database 中設定篩選條件：「Product 包含 ${productName}」`,
            },
          },
        ],
      },
    },
  ]

  // Get existing blocks and DELETE everything except the first callout (product description)
  const existingBlocks = await callNotionAPI(`/blocks/${productId}/children`)

  console.log(`   🗑️  清除舊內容...`)
  let keepFirst = true
  for (const block of existingBlocks.results) {
    // Keep the first callout (product description)
    if (keepFirst && block.type === 'callout' && block.callout?.icon?.type === 'emoji') {
      keepFirst = false
      continue
    }
    await callNotionAPI(`/blocks/${block.id}`, 'DELETE')
    await delay(200)
  }

  // Append new blocks with link_to_page
  console.log(`   ➕ 添加 database 連結...`)
  await callNotionAPI(`/blocks/${productId}/children`, 'PATCH', { children: blocks })

  console.log(`   ✅ 已添加豐富內容（含 database 連結）`)
}

async function main() {
  console.log('🎨 豐富化所有產品頁面（用 link_to_page）...\n')

  // Get all products
  const productsData = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  console.log(`找到 ${productsData.results.length} 個產品`)

  for (const product of productsData.results) {
    const productName = product.properties.Name?.title?.[0]?.plain_text || ''
    if (productName) {
      try {
        await enrichProductPage(product.id, productName)
        await delay(1000)
      } catch (error) {
        console.log(`   ❌ 錯誤: ${error.message}`)
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ 完成！所有產品頁面已豐富化（database 連結）')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('💡 現在產品頁面有可點擊的 database 連結了！')
  console.log('   點擊連結會跳轉到 database，然後可以設定篩選條件')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
