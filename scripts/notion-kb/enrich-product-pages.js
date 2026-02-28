// Add rich content to each product page
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

// Product descriptions
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

  // Check existing content
  const existingBlocks = await callNotionAPI(`/blocks/${productId}/children`)
  if (existingBlocks.results.length > 0) {
    console.log(`   ⚠️  已有內容，跳過（避免重複）`)
    return
  }

  // Build content blocks
  const blocks = [
    // Product description
    {
      object: 'block',
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
    { object: 'block', type: 'divider', divider: {} },

    // Related Blog Posts
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📰 相關文章 | Related Blog Posts' } }],
        color: 'orange',
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '⬇️' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `在此設定視圖：輸入 /linked → 選擇「部落格文章 | Blog Posts」→ 篩選條件設為「Related to 產品中心 包含 ${productName}」`,
            },
          },
        ],
      },
    },

    { object: 'block', type: 'divider', divider: {} },

    // Tech Stack
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '⚙️ 技術棧 | Tech Stack' } }],
        color: 'blue',
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '⬇️' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `在此設定視圖：輸入 /linked → 選擇「技術棧 | Tech Stack」→ 篩選條件設為「Used By 產品 包含 ${productName}」`,
            },
          },
        ],
      },
    },

    { object: 'block', type: 'divider', divider: {} },

    // API Endpoints
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🔌 API 端點 | API Endpoints' } }],
        color: 'blue',
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '⬇️' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `在此設定視圖：輸入 /linked → 選擇「API 端點 | API Endpoints」→ 篩選條件設為「Product 包含 ${productName}」`,
            },
          },
        ],
      },
    },

    { object: 'block', type: 'divider', divider: {} },

    // Components
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🧩 元件庫 | Component Library' } }],
        color: 'blue',
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '⬇️' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: `在此設定視圖：輸入 /linked → 選擇「元件庫 | Component Library」→ 篩選條件設為「Product 包含 ${productName}」`,
            },
          },
        ],
      },
    },
  ]

  // Append blocks
  await callNotionAPI(`/blocks/${productId}/children`, 'PATCH', { children: blocks })
  console.log(`   ✅ 已添加豐富內容`)
}

async function main() {
  console.log('🎨 豐富化所有產品頁面...\n')

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
  console.log('✅ 完成！所有產品頁面已豐富化')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('💡 注意：child_database 可能會失敗（API 限制）')
  console.log('   如果看到錯誤，需要手動在產品頁面中添加 linked database views')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
