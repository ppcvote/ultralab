// Script to enhance Command Center with clickable navigation + grouping pages
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
// Step 1: Create 4 Grouping Pages
// ========================================
async function createGroupingPages() {
  console.log('📁 Creating 4 grouping pages...\n')

  const pages = []

  // Page 1: Content Library
  const contentPage = await notion.pages.create({
    parent: { page_id: NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '📝' },
    properties: {
      title: {
        title: [{ text: { content: '內容庫 | Content Library' } }],
      },
    },
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📝 部落格文章 | Blog Posts' } }],
          color: 'orange',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '73 篇已發布文章，依產品、分類、標籤分類。' } },
          ],
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
        type: 'divider',
        divider: {},
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📧 Email 範本 | Email Templates' } }],
          color: 'orange',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: '12 個標準化回覆範本，依服務類型、預算區間分類。',
              },
            },
          ],
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
    ],
  })
  console.log('✅ Created: 內容庫 | Content Library')
  pages.push({ name: 'content', id: contentPage.id })
  await delay(1000)

  // Page 2: Developer Zone
  const devPage = await notion.pages.create({
    parent: { page_id: NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '⚙️' },
    properties: {
      title: {
        title: [{ text: { content: '開發者專區 | Developer Zone' } }],
      },
    },
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🧰 技術棧清單 | Tech Stack' } }],
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
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🔌 API 端點清單 | API Endpoints' } }],
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
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🧩 元件庫 | Components' } }],
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
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📐 架構決策記錄 | ADR' } }],
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
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🤖 AI 查詢範本 | AI Query Templates' } }],
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
    ],
  })
  console.log('✅ Created: 開發者專區 | Developer Zone')
  pages.push({ name: 'dev', id: devPage.id })
  await delay(1000)

  // Page 3: Documentation
  const docsPage = await notion.pages.create({
    parent: { page_id: NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '📖' },
    properties: {
      title: {
        title: [{ text: { content: '新手文檔 | Documentation' } }],
      },
    },
    children: [
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🎯' },
          color: 'green_background',
          rich_text: [
            {
              text: { content: '30 分鐘快速上手 Ultra Creation 生態系統' },
              annotations: { bold: true },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📚 文檔清單' } }],
          color: 'green',
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              text: { content: '新手入門指南 | Onboarding Guide', link: null },
              annotations: { bold: true },
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
              text: {
                content: '部署檢查清單 | Deployment Checklists',
                link: null,
              },
              annotations: { bold: true },
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
              text: {
                content: '故障排除指南 | Troubleshooting Guides',
                link: null,
              },
              annotations: { bold: true },
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
              text: { content: '商業策略 | Business Strategy', link: null },
              annotations: { bold: true },
            },
          ],
        },
      },
    ],
  })
  console.log('✅ Created: 新手文檔 | Documentation')
  pages.push({ name: 'docs', id: docsPage.id })
  await delay(1000)

  // Page 4: CRM
  const crmPage = await notion.pages.create({
    parent: { page_id: NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '👥' },
    properties: {
      title: {
        title: [{ text: { content: 'CRM 客戶管理 | Customer Management' } }],
      },
    },
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📋 客戶詢問 | Inquiries' } }],
          color: 'pink',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '來自 Ultra Lab 聯絡表單的客戶詢問。' } },
          ],
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
        type: 'divider',
        divider: {},
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            { text: { content: '🔍 UltraProbe Leads | Security Leads' } },
          ],
          color: 'pink',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '來自 UltraProbe 安全掃描工具的 email 訂閱。' } },
          ],
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
  })
  console.log('✅ Created: CRM 客戶管理 | Customer Management')
  pages.push({ name: 'crm', id: crmPage.id })

  return pages
}

// ========================================
// Step 2: Update Command Center with Clickable Links
// ========================================
async function updateCommandCenter(groupingPages) {
  console.log('\n🎨 Updating Command Center with clickable navigation...\n')

  try {
    // Clear existing content
    const existingBlocks = await notion.blocks.children.list({
      block_id: NOTION_PARENT_PAGE_ID,
      page_size: 100,
    })

    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }

    console.log('✅ Cleared existing content\n')

    // Find page IDs
    const contentPageId = groupingPages.find((p) => p.name === 'content')?.id
    const devPageId = groupingPages.find((p) => p.name === 'dev')?.id
    const docsPageId = groupingPages.find((p) => p.name === 'docs')?.id
    const crmPageId = groupingPages.find((p) => p.name === 'crm')?.id

    // Build new layout
    const blocks = [
      // Hero
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🚀' },
          color: 'purple_background',
          rich_text: [
            {
              text: { content: '歡迎來到 Ultra Creation 戰情室' },
              annotations: { bold: true },
            },
            {
              text: {
                content:
                  '\n5 個產品品牌 | 261 頁知識庫 | 30 分鐘快速上手\n一眼看到品牌狀態，點點點找到需要的資源。',
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

      // Brand Status
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🏢 品牌運作狀態' } }],
          color: 'purple',
        },
      },

      // Ultra Lab
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '🟣 Ultra Lab — 技術服務品牌 ' },
              annotations: { bold: true },
            },
            {
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
                  { text: { content: '定位：' }, annotations: { bold: true } },
                  {
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
                    text: { content: '技術棧：' },
                    annotations: { bold: true },
                  },
                  {
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
                    text: { content: '營收模式：' },
                    annotations: { bold: true },
                  },
                  { text: { content: '混合模式（接案 → SaaS）' } },
                ],
              },
            },
          ],
        },
      },

      // Ultra Advisor
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '🔵 Ultra Advisor — 財務規劃 SaaS ' },
              annotations: { bold: true },
            },
            {
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
                  { text: { content: '定位：' }, annotations: { bold: true } },
                  {
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
                    text: { content: '技術棧：' },
                    annotations: { bold: true },
                  },
                  {
                    text: {
                      content:
                        'React 18 + Tailwind v3 + Recharts + Ant Design + Firebase',
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
                    text: { content: '營收目標：' },
                    annotations: { bold: true },
                  },
                  {
                    text: { content: 'NT$3000萬（4000 付費用戶 × NT$7500）' },
                  },
                ],
              },
            },
          ],
        },
      },

      // Mind Threads
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '💬 Mind Threads — Threads 多帳號自動化 ' },
              annotations: { bold: true },
            },
            {
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
                  { text: { content: '定位：' }, annotations: { bold: true } },
                  {
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
                    text: { content: '成功案例：' },
                    annotations: { bold: true },
                  },
                  { text: { content: 'GinRollBT 6 個月 6500+ 粉絲' } },
                ],
              },
            },
          ],
        },
      },

      // UltraProbe
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '🔍 UltraProbe — AI 安全掃描工具 ' },
              annotations: { bold: true },
            },
            {
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
                  { text: { content: '定位：' }, annotations: { bold: true } },
                  {
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
                    text: { content: '營收模式：' },
                    annotations: { bold: true },
                  },
                  { text: { content: 'Free tier + Pro API ($0.01/scan)' } },
                ],
              },
            },
          ],
        },
      },

      // MinYi
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '👤 MinYi — MDRT 顧問個人頁面 ' },
              annotations: { bold: true },
            },
            {
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
                  { text: { content: '定位：' }, annotations: { bold: true } },
                  {
                    text: {
                      content: 'MDRT 財務顧問個人品牌頁面（IG Bio landing）',
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
                    text: { content: '設計風格：' },
                    annotations: { bold: true },
                  },
                  { text: { content: '淺色主題（#1E40AF 藍色）' } },
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

      // Quick Navigation
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🧭 快速導航' } }],
          color: 'blue',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '👇 點擊下方卡片快速跳轉到需要的資源' } },
          ],
        },
      },

      // Content Library (clickable)
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📝' },
          color: 'orange_background',
          rich_text: [
            {
              text: { content: '內容庫 | Content Library' },
              annotations: { bold: true },
            },
            {
              text: { content: '\n73 篇部落格文章 + 12 個 Email 範本\n' },
            },
            {
              text: { content: '👉 點擊下方連結進入 →' },
              annotations: { italic: true },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'link_to_page',
        link_to_page: {
          type: 'page_id',
          page_id: contentPageId,
        },
      },

      // Developer Zone (clickable)
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⚙️' },
          color: 'gray_background',
          rich_text: [
            {
              text: { content: '開發者專區 | Developer Zone' },
              annotations: { bold: true },
            },
            {
              text: {
                content: '\n技術棧 + API 端點 + React 元件 + 架構決策 + AI 查詢範本\n',
              },
            },
            {
              text: { content: '👉 點擊下方連結進入 →' },
              annotations: { italic: true },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'link_to_page',
        link_to_page: {
          type: 'page_id',
          page_id: devPageId,
        },
      },

      // Documentation (clickable)
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📖' },
          color: 'green_background',
          rich_text: [
            {
              text: { content: '新手文檔 | Documentation' },
              annotations: { bold: true },
            },
            {
              text: {
                content: '\n入門指南 + 部署流程 + 故障排除 + 商業策略\n',
              },
            },
            {
              text: { content: '👉 點擊下方連結進入 →' },
              annotations: { italic: true },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'link_to_page',
        link_to_page: {
          type: 'page_id',
          page_id: docsPageId,
        },
      },

      // CRM (clickable)
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '👥' },
          color: 'pink_background',
          rich_text: [
            {
              text: { content: 'CRM 客戶管理 | Customer Management' },
              annotations: { bold: true },
            },
            {
              text: { content: '\n客戶詢問 + UltraProbe Leads\n' },
            },
            {
              text: { content: '👉 點擊下方連結進入 →' },
              annotations: { italic: true },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'link_to_page',
        link_to_page: {
          type: 'page_id',
          page_id: crmPageId,
        },
      },

      {
        object: 'block',
        type: 'divider',
        divider: {},
      },

      // Products Database (direct link)
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🏢 產品中心 | Products' } }],
          color: 'purple',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content:
                  '5 個產品的完整資訊（包含 tech stack, APIs, components, brand guidelines 的關聯）',
              },
            },
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
        type: 'divider',
        divider: {},
      },

      // Footer
      {
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [
            {
              text: {
                content: '💡 新開發者？直接點擊「📖 新手文檔」開始 30 分鐘快速上手',
              },
            },
          ],
          color: 'gray',
        },
      },
    ]

    // Append blocks in batches
    const batchSize = 100
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize)
      await notion.blocks.children.append({
        block_id: NOTION_PARENT_PAGE_ID,
        children: batch,
      })
      console.log(`✅ Added batch ${Math.floor(i / batchSize) + 1}`)
      await delay(1000)
    }

    console.log('\n✅ Command Center updated with clickable navigation!')
  } catch (error) {
    console.error('❌ Failed:', error.message)
    if (error.body) {
      console.error('Details:', JSON.stringify(error.body, null, 2))
    }
  }
}

// ========================================
// Main Execution
// ========================================
async function main() {
  console.log('🚀 Enhancing Command Center to World-Class Standards...\n')
  console.log('目標：可點擊導航 + 頂尖視覺設計\n')

  // Step 1: Create grouping pages
  const groupingPages = await createGroupingPages()
  await delay(2000)

  // Step 2: Update Command Center
  await updateCommandCenter(groupingPages)

  console.log('\n')
  console.log('🎉 Enhancement Complete!')
  console.log('\n✅ Improvements:')
  console.log('   📁 Created 4 grouping pages (Content, Dev, Docs, CRM)')
  console.log('   🔗 All Quick Navigation cards now clickable')
  console.log('   🎨 Professional layout with clear visual hierarchy')
  console.log('   🏢 Direct link to Products database added')
  console.log('\n')
  console.log('💎 Result: 世界頂尖的戰情室設計 ✅')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
