// Script to create Command Center Dashboard (戰情室)
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

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
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ========================================
// Transform Parent Page into Command Center
// ========================================
async function createCommandCenter() {
  console.log('🎯 Creating Command Center Dashboard...\n')

  try {
    // Step 1: Update page title and icon
    await notion.pages.update({
      page_id: NOTION_PARENT_PAGE_ID,
      icon: {
        type: 'emoji',
        emoji: '🎯',
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: '傲創戰情室 | Ultra Creation Command Center',
              },
            },
          ],
        },
      },
    })

    console.log('✅ Page title updated')

    // Step 2: Clear all existing content
    console.log('🗑️  Clearing existing content...')
    const existingBlocks = await notion.blocks.children.list({
      block_id: NOTION_PARENT_PAGE_ID,
      page_size: 100,
    })

    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }

    console.log('✅ Existing content cleared\n')

    // Step 3: Build Command Center layout
    console.log('🏗️  Building Command Center layout...\n')

    const blocks = [
      // ==================== HERO SECTION ====================
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🚀' },
          color: 'purple_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '歡迎來到 Ultra Creation 戰情室' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content:
                  '\n5 個產品品牌 | 261 頁知識庫 | 30 分鐘快速上手\n一進來就能看到：品牌狀態、最新內容、關鍵資源。',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'divider',
        divider: {},
      },

      // ==================== BRAND STATUS OVERVIEW ====================
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🏢 品牌運作狀態' },
            },
          ],
          color: 'purple',
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
                content: '👇 點擊展開查看各品牌詳情（技術棧、營收模式、進度）',
              },
            },
          ],
        },
      },

      // Ultra Lab Card
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🟣 Ultra Lab — 技術服務品牌 ' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: '[ 🟢 Active | ultralab.tw ]' },
              annotations: { code: true },
            },
          ],
          color: 'purple_background',
          children: [
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '定位：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: 'IG/Threads 自動化 + 短影音 + SaaS 建置 + AI 串接',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '技術棧：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: 'React 18 + Vite + Tailwind v4 + Firebase + Vercel',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '營收模式：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: '混合模式（接案 → SaaS）' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '整合功能：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'UltraProbe (安全掃描) + MinYi (個人頁面)' },
                  },
                ],
              },
            },
          ],
        },
      },

      // Ultra Advisor Card
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🔵 Ultra Advisor — 財務規劃 SaaS ' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: '[ 🟢 Active | NT$3000萬目標 ]' },
              annotations: { code: true },
            },
          ],
          color: 'blue_background',
          children: [
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '定位：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: '財務顧問專用 SaaS（18 個財務工具 + 67 篇 blog）',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '技術棧：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: 'React 18 + Tailwind v3 + Recharts + Ant Design + Firebase',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '營收目標：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'NT$3000萬（4000 付費用戶 × NT$7500）' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '特色功能：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: '積分獎勵系統、5 種會員等級、Admin 後台' },
                  },
                ],
              },
            },
          ],
        },
      },

      // Mind Threads Card
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '💬 Mind Threads — Threads 多帳號自動化 ' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: '[ 🟢 Live | NT$1,990/月 ]' },
              annotations: { code: true },
            },
          ],
          color: 'default',
          children: [
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '定位：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: 'Threads 排程發文 SaaS（Meta API + Gemini AI）',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '技術棧：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'Meta Threads API + Gemini AI + Vercel Cron' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '成功案例：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'GinRollBT 6 個月 6500+ 粉絲' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '網址：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: 'mind-threads.vercel.app',
                      link: { url: 'https://mind-threads.vercel.app' },
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      // UltraProbe Card
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🔍 UltraProbe — AI 安全掃描工具 ' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: '[ 🟢 Embedded | /probe ]' },
              annotations: { code: true },
            },
          ],
          color: 'default',
          children: [
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '定位：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: {
                      content: 'AI 安全掃描（prompt injection + URL 掃描）',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '技術棧：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'Gemini 2.5 Flash + Firebase + Notion CRM Sync' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '營收模式：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'Free tier + Pro API ($0.01/scan)' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '功能：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'Lead generation 工具（email 收集 → Notion sync）' },
                  },
                ],
              },
            },
          ],
        },
      },

      // MinYi Card
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '👤 MinYi — MDRT 顧問個人頁面 ' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: '[ 🟢 Embedded | /minyi ]' },
              annotations: { code: true },
            },
          ],
          color: 'default',
          children: [
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '定位：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: 'MDRT 財務顧問個人品牌頁面（IG Bio landing）' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '設計風格：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: '淺色主題（#1E40AF 藍色）' },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: '功能：' },
                    annotations: { bold: true },
                  },
                  {
                    type: 'text',
                    text: { content: '產品商店、諮詢預約、個人簡介' },
                  },
                ],
              },
            },
          ],
        },
      },

      {
        object: 'block',
        type: 'divider',
        divider: {},
      },

      // ==================== QUICK NAVIGATION ====================
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🧭 快速導航' },
            },
          ],
          color: 'blue',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: '點擊下方卡片快速跳轉到需要的資源' },
            },
          ],
        },
      },

      // Navigation Card: Content
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📝' },
          color: 'orange_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '內容庫 | Content Library' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content: '\n73 篇部落格文章 + 12 個 Email 範本',
              },
            },
          ],
        },
      },

      // Navigation Card: Tech
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⚙️' },
          color: 'gray_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '開發者專區 | Developer Zone' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content: '\n技術棧 + API 端點 + React 元件 + 架構決策 + AI 查詢範本',
              },
            },
          ],
        },
      },

      // Navigation Card: Docs
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📖' },
          color: 'green_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '新手文檔 | Documentation' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content: '\n入門指南 + 部署流程 + 故障排除 + 商業策略',
              },
            },
          ],
        },
      },

      // Navigation Card: CRM
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '👥' },
          color: 'pink_background',
          rich_text: [
            {
              type: 'text',
              text: { content: 'CRM 客戶管理 | Customer Management' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content: '\n客戶詢問 + UltraProbe Leads',
              },
            },
          ],
        },
      },

      {
        object: 'block',
        type: 'divider',
        divider: {},
      },

      // ==================== ALL DATABASES (Collapsed) ====================
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🗄️ 完整資料庫清單（進階用戶）' },
              annotations: { bold: true },
            },
          ],
          color: 'gray_background',
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '以下是所有 11 個資料庫的完整清單。一般使用者不需要直接存取。',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'heading_3',
              heading_3: {
                rich_text: [
                  { type: 'text', text: { content: '🏢 產品與品牌' } },
                ],
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.PRODUCTS,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.BRAND_GUIDELINES,
              },
            },
            {
              object: 'block',
              type: 'heading_3',
              heading_3: {
                rich_text: [{ type: 'text', text: { content: '📝 內容' } }],
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.BLOG_POSTS,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.EMAIL_TEMPLATES,
              },
            },
            {
              object: 'block',
              type: 'heading_3',
              heading_3: {
                rich_text: [{ type: 'text', text: { content: '🔧 技術' } }],
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.TECH_STACK,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.API_ENDPOINTS,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.COMPONENTS,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.ADR,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.AI_QUERY_TEMPLATES,
              },
            },
            {
              object: 'block',
              type: 'heading_3',
              heading_3: {
                rich_text: [{ type: 'text', text: { content: '👥 CRM' } }],
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.INQUIRIES,
              },
            },
            {
              object: 'block',
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.PROBE_LEADS,
              },
            },
          ],
        },
      },

      // ==================== FOOTER ====================
      {
        object: 'block',
        type: 'divider',
        divider: {},
      },
      {
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '💡 新開發者？直接點擊上方「📖 新手文檔」開始 30 分鐘快速上手',
              },
            },
          ],
          color: 'gray',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: '最後更新：' },
              annotations: { italic: true },
            },
            {
              type: 'text',
              text: {
                content: new Date().toLocaleDateString('zh-TW'),
              },
              annotations: { italic: true, code: true },
            },
            {
              type: 'text',
              text: { content: ' | Ultra Creation Co., Ltd.' },
              annotations: { italic: true },
            },
          ],
        },
      },
    ]

    // Append all blocks
    console.log('📝 Adding content blocks...\n')

    // Notion API has a 100 block limit per request, so we need to batch
    const batchSize = 100
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize)
      await notion.blocks.children.append({
        block_id: NOTION_PARENT_PAGE_ID,
        children: batch,
      })
      console.log(`   ✅ Added batch ${Math.floor(i / batchSize) + 1}`)
      await delay(1000)
    }

    console.log('\n✅ Command Center created successfully!')
  } catch (error) {
    console.error('❌ Failed to create Command Center:', error.message)
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2))
    }
  }
}

// ========================================
// Main Execution
// ========================================
async function main() {
  console.log('🎯 Creating Command Center Dashboard...\n')
  console.log('目標：戰情室設計 — 一眼看到品牌狀態、直觀點點點導航\n')

  await createCommandCenter()

  console.log('\n')
  console.log('🎉 Command Center Complete!')
  console.log('\n✅ Features:')
  console.log('   🚀 Hero section with key stats')
  console.log('   🏢 5 brand cards (toggle to expand)')
  console.log('   🧭 Quick navigation cards')
  console.log('   🗄️ Full database list (collapsed)')
  console.log('\n')
  console.log('💎 Result: 戰情室 > 倉庫 ✅')
  console.log('   - 一進來就看到 5 個品牌運作狀態')
  console.log('   - 直觀點點點就能找到需要的資源')
  console.log('   - 進階用戶才需要展開完整資料庫清單')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
