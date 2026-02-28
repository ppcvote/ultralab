// Script to create 5 Product pages in Notion Products Database
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID

if (!NOTION_API_KEY || !NOTION_PRODUCTS_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_PRODUCTS_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Product data from MEMORY.md and CLAUDE.md
const products = [
  {
    name: 'Ultra Lab',
    status: 'Active',
    productType: 'Service',
    primaryColor: '#8A5CFF → #CE4DFF',
    themeType: 'Dark',
    liveUrl: 'https://ultralab.tw',
    repositoryPath: 'C:\\Users\\User\\UltraLab',
    revenueModel: 'Services',
    launchDate: '2026-02-01',
    description: '技術服務品牌，提供 5 大服務：IG Reel 全自動發布、Threads 多帳號自動化、短影音自動產製、SaaS 全端建置、AI 串接應用。混合商業模式：先接案養品牌和現金流，同時將重複性高的交付物產品化為 SaaS 訂閱。',
    firebaseProject: 'ultra-lab-tw',
    vercelProject: 'ultra-lab',
  },
  {
    name: 'Ultra Advisor',
    status: 'Active',
    productType: 'SaaS',
    primaryColor: '#2E6BFF (Professional Blue) + #FF3A3A (Red Accent)',
    themeType: 'Dark',
    liveUrl: 'https://ultra-advisor.vercel.app',
    repositoryPath: 'C:\\Users\\User\\financial-planner',
    revenueModel: 'Freemium',
    launchDate: '2026-01-15',
    monthlyRevenue: 0,
    targetRevenue: 30000000,
    description: '財務規劃 SaaS 平台，專為財務顧問打造。18 個財務工具（房貸、退休、保單健診等）、67 篇 blog 文章、積分獎勵系統、5 種會員等級。技術：React 18 + Vite + Tailwind v3 + Recharts + Ant Design + Firebase + Cloud Functions。目標：NT$3000 萬營收，4000 付費用戶。',
    firebaseProject: 'ultra-lab-tw',
    vercelProject: 'ultra-advisor',
  },
  {
    name: 'Mind Threads',
    status: 'Active',
    productType: 'SaaS',
    primaryColor: '#8A5CFF (Purple gradient)',
    themeType: 'Dark',
    liveUrl: 'https://mind-threads.vercel.app',
    repositoryPath: '',
    revenueModel: 'Subscription',
    launchDate: '2025-12-01',
    monthlyRevenue: 0,
    targetRevenue: 0,
    description: 'Threads 多帳號自動化 SaaS。NT$1,990/月訂閱制。Meta Threads API + Gemini AI。成功案例：GinRollBT 6 個月 6500+ 粉絲。',
    firebaseProject: 'ultra-lab-tw',
    vercelProject: 'mind-threads',
  },
  {
    name: 'UltraProbe',
    status: 'Active',
    productType: 'Embedded Feature',
    primaryColor: '#4DA3FF → #2E6BFF (Blue-Purple)',
    themeType: 'Dark',
    liveUrl: 'https://ultralab.tw/probe',
    repositoryPath: 'C:\\Users\\User\\UltraLab (integrated)',
    revenueModel: 'Lead Gen',
    launchDate: '2026-02-10',
    description: 'AI 安全掃描工具（prompt + URL 掃描）。Free tier + Pro API ($0.01/scan)。Gemini 2.5 Flash 驅動。Lead generation 工具，整合於 Ultra Lab。Notion CRM sync 已實作。',
    firebaseProject: 'ultra-lab-tw',
    vercelProject: 'ultra-lab',
  },
  {
    name: 'MinYi Personal Brand',
    status: 'Active',
    productType: 'Embedded Feature',
    primaryColor: '#1E40AF (Light Blue)',
    themeType: 'Light',
    liveUrl: 'https://ultralab.tw/minyi',
    repositoryPath: 'C:\\Users\\User\\UltraLab (integrated)',
    revenueModel: 'Lead Gen',
    launchDate: '2026-02-01',
    description: 'MDRT 財務顧問個人頁面。淺色主題。產品商店、諮詢預約。IG Bio landing page。整合於 Ultra Lab。',
    firebaseProject: 'ultra-lab-tw',
    vercelProject: 'ultra-lab',
  },
]

async function createProductPage(product) {
  try {
    const properties = {
      Name: {
        title: [
          {
            text: {
              content: product.name,
            },
          },
        ],
      },
      Status: {
        select: { name: product.status },
      },
      'Product Type': {
        select: { name: product.productType },
      },
      'Primary Color': {
        rich_text: [
          {
            text: {
              content: product.primaryColor,
            },
          },
        ],
      },
      'Theme Type': {
        select: { name: product.themeType },
      },
      'Live URL': {
        url: product.liveUrl,
      },
      'Repository Path': {
        rich_text: [
          {
            text: {
              content: product.repositoryPath,
            },
          },
        ],
      },
      'Revenue Model': {
        select: { name: product.revenueModel },
      },
      Description: {
        rich_text: [
          {
            text: {
              content: product.description,
            },
          },
        ],
      },
      'Firebase Project': {
        rich_text: [
          {
            text: {
              content: product.firebaseProject,
            },
          },
        ],
      },
      'Vercel Project': {
        rich_text: [
          {
            text: {
              content: product.vercelProject,
            },
          },
        ],
      },
    }

    // Add optional fields
    if (product.launchDate) {
      properties['Launch Date'] = {
        date: {
          start: product.launchDate,
        },
      }
    }

    if (product.monthlyRevenue !== undefined) {
      properties['Monthly Revenue'] = {
        number: product.monthlyRevenue,
      }
    }

    if (product.targetRevenue !== undefined) {
      properties['Target Revenue'] = {
        number: product.targetRevenue,
      }
    }

    await notion.pages.create({
      parent: { database_id: NOTION_PRODUCTS_DB_ID },
      properties,
      icon: {
        type: 'emoji',
        emoji: product.productType === 'SaaS' ? '🚀' : product.productType === 'Service' ? '⚡' : '🔌',
      },
    })

    console.log(`✅ Created: ${product.name} (${product.productType})`)
  } catch (error) {
    console.error(`❌ Failed to create: ${product.name}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Creating 5 Product Pages...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const product of products) {
    try {
      await createProductPage(product)
      totalCreated++
      await delay(500)
    } catch (error) {
      console.error(`❌ Failed: ${product.name}`)
      totalFailed++
    }
  }

  console.log('\n')
  console.log('🎉 Product Pages Creation Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the 5 product pages')
  console.log('2. Add Relations to Tech Stack, APIs, Components, Blog Posts')
  console.log('3. Upload screenshots and brand assets')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
