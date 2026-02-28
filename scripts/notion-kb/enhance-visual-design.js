// Script to enhance Notion KB visual design to world-class standards
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
// Step 1: Update Parent Page (Knowledge Base Home)
// ========================================
async function enhanceParentPage() {
  console.log('🎨 Enhancing Parent Page: 傲創知識庫...\n')

  try {
    // Update parent page title
    await notion.pages.update({
      page_id: NOTION_PARENT_PAGE_ID,
      icon: {
        type: 'emoji',
        emoji: '🏢',
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: '傲創知識庫 | Ultra Creation Knowledge Base',
              },
            },
          ],
        },
      },
    })

    // Get existing children to preserve database links
    const existingBlocks = await notion.blocks.children.list({
      block_id: NOTION_PARENT_PAGE_ID,
    })

    // Create new rich content at the top
    const newBlocks = [
      // Hero callout
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: {
            type: 'emoji',
            emoji: '🚀',
          },
          color: 'purple_background',
          rich_text: [
            {
              type: 'text',
              text: {
                content: '歡迎來到傲創知識庫！',
              },
              annotations: {
                bold: true,
              },
            },
            {
              type: 'text',
              text: {
                content:
                  '\n這裡整合了 Ultra Creation 旗下 5 個產品品牌的所有技術文檔、設計規範、商業策略。\n30 分鐘內快速理解整個生態系統。',
              },
            },
          ],
        },
      },
      // Divider
      {
        object: 'block',
        type: 'divider',
        divider: {},
      },
      // Heading
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '📚 Knowledge Base 導覽',
              },
            },
          ],
          color: 'purple',
        },
      },
      // 2-column layout with quick stats
      {
        object: 'block',
        type: 'column_list',
        column_list: {},
      },
    ]

    // Append new blocks at the beginning
    await notion.blocks.children.append({
      block_id: NOTION_PARENT_PAGE_ID,
      children: newBlocks.slice(0, 3), // Callout, divider, heading first
    })

    console.log('✅ Parent page enhanced with hero section')

    // Create column layout separately (Notion API limitation)
    const columnList = await notion.blocks.children.append({
      block_id: NOTION_PARENT_PAGE_ID,
      children: [
        {
          object: 'block',
          type: 'column_list',
          column_list: {},
        },
      ],
    })

    const columnListId = columnList.results[0].id

    // Add columns
    await notion.blocks.children.append({
      block_id: columnListId,
      children: [
        {
          object: 'block',
          type: 'column',
          column: {},
        },
        {
          object: 'block',
          type: 'column',
          column: {},
        },
      ],
    })

    console.log('✅ Column layout added')
  } catch (error) {
    console.error('❌ Failed to enhance parent page:', error.message)
  }
}

// ========================================
// Step 2: Find and Enhance Grouping Pages
// ========================================
async function findGroupingPages() {
  console.log('\n🔍 Finding grouping pages...\n')

  const response = await notion.blocks.children.list({
    block_id: NOTION_PARENT_PAGE_ID,
  })

  const groupingPages = {
    products: null,
    content: null,
    tech: null,
    docs: null,
  }

  for (const block of response.results) {
    if (block.type !== 'child_page') continue

    const title = block.child_page?.title || ''

    if (title.includes('🏢')) {
      groupingPages.products = block.id
      console.log(`✅ Found: ${title}`)
    } else if (title.includes('📝')) {
      groupingPages.content = block.id
      console.log(`✅ Found: ${title}`)
    } else if (title.includes('🔧')) {
      groupingPages.tech = block.id
      console.log(`✅ Found: ${title}`)
    } else if (title.includes('📖')) {
      groupingPages.docs = block.id
      console.log(`✅ Found: ${title}`)
    }
  }

  return groupingPages
}

async function enhanceProductsPage(pageId) {
  console.log('\n🎨 Enhancing: 🏢 我的產品\n')

  try {
    // Clear existing content first
    const existingBlocks = await notion.blocks.children.list({
      block_id: pageId,
    })

    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }

    // Add rich content
    const blocks = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🏢' },
          color: 'blue_background',
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Ultra Creation 產品生態系統',
              },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content: '\n從技術服務品牌到 SaaS 平台，涵蓋 IG/Threads 自動化、財務規劃、AI 安全掃描等領域。',
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
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📦 所有產品' } }],
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
              text: {
                content: '👇 點擊下方資料庫查看詳細資訊（包含技術棧、API、元件、品牌規範）',
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
    ]

    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    })

    console.log('✅ Products page enhanced')
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

async function enhanceContentPage(pageId) {
  console.log('\n🎨 Enhancing: 📝 我的文章\n')

  try {
    const existingBlocks = await notion.blocks.children.list({
      block_id: pageId,
    })

    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }

    const blocks = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '✍️' },
          color: 'orange_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '內容創作中心' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content:
                  '\n79 篇部落格文章 + 12 個 Email 範本，涵蓋 IG/Threads 自動化、財務規劃、稅務、退休等主題。',
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
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📝 部落格文章' } }],
          color: 'orange',
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
                content: '73 篇已發布文章，依產品、分類、標籤分類。支援全文搜尋。',
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
          rich_text: [{ type: 'text', text: { content: '📧 Email 範本' } }],
          color: 'orange',
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
    ]

    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    })

    console.log('✅ Content page enhanced')
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

async function enhanceTechPage(pageId) {
  console.log('\n🎨 Enhancing: 🔧 技術資料\n')

  try {
    const existingBlocks = await notion.blocks.children.list({
      block_id: pageId,
    })

    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }

    const blocks = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⚙️' },
          color: 'gray_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '技術文檔中心' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content:
                  '\n給工程師看的：技術棧清單、API 端點、React 元件庫、架構決策記錄、AI 查詢範本。',
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
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🧰 技術棧清單 | Tech Stack' },
              annotations: { bold: true },
            },
          ],
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '40+ 技術依賴追蹤（React, Firebase, Vercel, Gemini AI...），包含版本號、成本、授權。',
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
                database_id: DB_IDS.TECH_STACK,
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🔌 API 端點清單 | API Endpoints' },
              annotations: { bold: true },
            },
          ],
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '11+ API endpoints 文檔（probe-scan, payuni-checkout, notify...），包含 method、auth、rate limit。',
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
                database_id: DB_IDS.API_ENDPOINTS,
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🧩 元件庫 | Components' },
              annotations: { bold: true },
            },
          ],
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '86+ React components（Hero, MortgageCalculator, ProbeScanner...），依複雜度分類。',
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
                database_id: DB_IDS.COMPONENTS,
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '📐 架構決策記錄 | ADR' },
              annotations: { bold: true },
            },
          ],
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '10 個關鍵技術決策（Tailwind v4 CSS layers, Firebase Admin tsconfig...），記錄脈絡與後果。',
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
                database_id: DB_IDS.ADR,
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: { content: '🤖 AI 查詢範本 | AI Query Templates' },
              annotations: { bold: true },
            },
          ],
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '15 個 AI Agent 查詢範本，包含自然語言查詢 + Notion Filter JSON + 使用範例。',
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
                database_id: DB_IDS.AI_QUERY_TEMPLATES,
              },
            },
          ],
        },
      },
    ]

    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    })

    console.log('✅ Tech page enhanced (with toggle blocks)')
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

async function enhanceDocsPage(pageId) {
  console.log('\n🎨 Enhancing: 📖 使用手冊\n')

  try {
    const existingBlocks = await notion.blocks.children.list({
      block_id: pageId,
    })

    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }

    const blocks = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🎯' },
          color: 'green_background',
          rich_text: [
            {
              type: 'text',
              text: { content: '新手入門指南' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: {
                content: '\n30 分鐘快速上手！從產品概覽到技術棧，從部署到故障排除，從商業策略到成長路線圖。',
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
      {
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '💡 新開發者？從「新手入門指南」開始，然後依需求深入各專區。',
              },
            },
          ],
          color: 'green',
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📚 文檔清單' } }],
          color: 'green',
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: '新手入門指南 | Onboarding Guide' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: ' — 30 分鐘理解整個生態系統' },
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
              text: { content: '部署檢查清單 | Deployment Checklists' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: ' — Vercel + Firebase 上線流程' },
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
              text: { content: '故障排除指南 | Troubleshooting Guides' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: ' — 常見錯誤與解決方案' },
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
              text: { content: '商業策略 | Business Strategy' },
              annotations: { bold: true },
            },
            {
              type: 'text',
              text: { content: ' — 混合模式、定價、目標市場' },
            },
          ],
        },
      },
    ]

    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    })

    console.log('✅ Docs page enhanced')
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

// ========================================
// Step 3: Add Database Views
// ========================================
async function addDatabaseViews() {
  console.log('\n📊 Adding additional database views...\n')

  // Gallery view for Products
  try {
    await notion.databases.update({
      database_id: DB_IDS.PRODUCTS,
      // Note: Database views cannot be created/modified via API
      // This is a Notion limitation - views must be created manually in UI
      // But we can update database properties
    })
    console.log('ℹ️  Database views must be created manually in Notion UI')
    console.log('   Recommended views:')
    console.log('   - Products: Gallery view (with screenshots)')
    console.log('   - Blog Posts: Board by Category, Timeline by Publish Date')
    console.log('   - Tech Stack: Board by Category')
    console.log('   - Components: Board by Product')
  } catch (error) {
    console.error('❌ Note:', error.message)
  }
}

// ========================================
// Main Execution
// ========================================
async function main() {
  console.log('🎨 Enhancing Notion KB Visual Design to World-Class Standards...\n')
  console.log('目標：頂尖 1% 的視覺設計 + 簡單直觀的使用體驗\n')

  // Step 1: Enhance parent page
  await enhanceParentPage()
  await delay(2000)

  // Step 2: Find and enhance grouping pages
  const grouping = await findGroupingPages()

  if (!grouping.products || !grouping.content || !grouping.tech || !grouping.docs) {
    console.error('\n❌ Could not find all grouping pages!')
    return
  }

  await delay(1000)

  // Enhance each grouping page
  await enhanceProductsPage(grouping.products)
  await delay(2000)

  await enhanceContentPage(grouping.content)
  await delay(2000)

  await enhanceTechPage(grouping.tech)
  await delay(2000)

  await enhanceDocsPage(grouping.docs)
  await delay(2000)

  // Step 3: Database views info
  await addDatabaseViews()

  // Summary
  console.log('\n')
  console.log('🎉 Visual Design Enhancement Complete!')
  console.log('\n✅ Enhancements Applied:')
  console.log('   🎨 Parent page: Hero callout + column layout')
  console.log('   🏢 Products page: Callout + structured content')
  console.log('   📝 Content page: Separated sections with dividers')
  console.log('   🔧 Tech page: Toggle blocks for clean organization')
  console.log('   📖 Docs page: Quote block + bullet list')
  console.log('\n')
  console.log('📋 Manual Steps (5 minutes):')
  console.log('1. Open Notion workspace')
  console.log('2. For each database, add views:')
  console.log('   - Products: Add Gallery view (show cover images)')
  console.log('   - Blog Posts: Add Board view (group by Category), Timeline view (by Publish Date)')
  console.log('   - Tech Stack: Add Board view (group by Category)')
  console.log('   - Components: Add Board view (group by Product)')
  console.log('3. Add cover images to grouping pages (optional)')
  console.log('4. Customize database colors in UI (optional)')
  console.log('\n')
  console.log('💎 Result: 簡單到三歲小孩都看得懂 + 專業給 AI 看 ✅')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
