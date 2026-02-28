// Enrich Products Database with complete information
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

// Complete product information
const PRODUCTS = {
  'Ultra Lab': {
    status: 'Active',
    productType: 'Service',
    primaryColor: '#8A5CFF → #CE4DFF',
    liveURL: 'https://ultralab.tw',
    repositoryPath: 'C:\Users\User\UltraLab',
    revenueModel: 'Services',
    launchDate: '2026-02-09',
    description: '技術服務品牌 landing page。提供 5 大服務：IG Reel 自動化、Threads 多帳號管理、短影音產製、SaaS 全端建置、AI 串接應用。整合 UltraProbe (/probe) 和 MinYi (/minyi)。',
  },
  'Ultra Advisor': {
    status: 'Active',
    productType: 'SaaS',
    primaryColor: '#2E6BFF',
    liveURL: 'https://ultra-advisor.vercel.app',
    repositoryPath: 'C:\Users\User\financial-planner',
    revenueModel: 'Freemium',
    launchDate: '2025-08-15',
    description: '財務規劃 SaaS 平台，專為財務顧問設計。18 個財務工具（房貸、退休、保單健診等）+ 67 篇 blog 文章。積分獎勵系統、5 種會員等級。目標：NT$3000 萬營收，4000 付費用戶。',
  },
  'Mind Threads': {
    status: 'Active',
    productType: 'SaaS',
    primaryColor: '#C46200 → #E8910C',
    liveURL: 'https://mindthread.tw',
    repositoryPath: 'C:\Users\User\UltraThreads',
    revenueModel: 'Subscription',
    launchDate: '2026-02-09',
    description: 'Threads 多帳號自動化 SaaS。NT$1,990/月訂閱制。Meta Threads API + Gemini 2.0 Flash AI 驅動。成功案例：GinRollBT 6 個月 6500+ 粉絲。OAuth 一鍵授權、排程發布、文案庫、Token 自動續期。',
  },
  UltraProbe: {
    status: 'Active',
    productType: 'Embedded Feature',
    primaryColor: '#4F46E5',
    liveURL: 'https://ultralab.tw/probe',
    repositoryPath: 'C:\Users\User\UltraLab (integrated)',
    revenueModel: 'Lead Gen',
    launchDate: '2026-02-20',
    description: 'AI 安全掃描工具（prompt + URL 掃描）。Free tier + Pro API ($0.01/scan)。Gemini 2.5 Flash 驅動。Lead generation 工具，Notion CRM sync 已實作。',
  },
  'MinYi Personal Brand': {
    status: 'Active',
    productType: 'Embedded Feature',
    primaryColor: '#1E40AF',
    liveURL: 'https://ultralab.tw/minyi',
    repositoryPath: 'C:\Users\User\UltraLab (integrated)',
    revenueModel: 'Services',
    launchDate: '2026-02-15',
    description: 'MDRT 財務顧問個人頁面。淺色主題（藍色系）。產品商店、諮詢預約。IG Bio landing page。',
  },
}

async function enrichProducts() {
  console.log('📦 Enriching Products Database...\n')

  // Get all existing products
  const productsData = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  console.log(`Found ${productsData.results.length} products\n`)

  for (const product of productsData.results) {
    const productName = product.properties.Name?.title?.[0]?.plain_text || ''
    const productInfo = PRODUCTS[productName]

    if (!productInfo) {
      console.log(`⏭️  Skipping ${productName} (no info)`)
      continue
    }

    console.log(`📝 Enriching: ${productName}`)

    try {
      await callNotionAPI(`/pages/${product.id}`, 'PATCH', {
        properties: {
          Status: {
            select: {
              name: productInfo.status,
            },
          },
          'Product Type': {
            select: {
              name: productInfo.productType,
            },
          },
          'Primary Color': {
            rich_text: [
              {
                text: {
                  content: productInfo.primaryColor,
                },
              },
            ],
          },
          'Live URL': {
            url: productInfo.liveURL,
          },
          'Repository Path': {
            rich_text: [
              {
                text: {
                  content: productInfo.repositoryPath,
                },
              },
            ],
          },
          'Revenue Model': {
            select: {
              name: productInfo.revenueModel,
            },
          },
          'Launch Date': {
            date: {
              start: productInfo.launchDate,
            },
          },
        },
      })

      // Add description as page content
      await callNotionAPI(`/blocks/${product.id}/children`, 'PATCH', {
        children: [
          {
            object: 'block',
            type: 'callout',
            callout: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: productInfo.description,
                  },
                },
              ],
              icon: {
                emoji: '📦',
              },
              color: 'blue_background',
            },
          },
        ],
      })

      console.log(`   ✅ Updated`)
      await delay(500)
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Products Database enriched!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

enrichProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
