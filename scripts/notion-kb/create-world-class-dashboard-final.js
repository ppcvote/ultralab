// Ultra Clean Dashboard - World-Class Design (Final Version)
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

const notion = new Client({ auth: NOTION_API_KEY })
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  console.log('💎 Creating World-Class Dashboard (Final Version)...\n')

  try {
    // Update page title & icon
    await notion.pages.update({
      page_id: NOTION_PARENT_PAGE_ID,
      icon: { type: 'emoji', emoji: '🎯' },
      properties: {
        title: {
          title: [{ text: { content: '🎯 Ultra Creation | Command Center' } }],
        },
      },
    })
    console.log('✅ Updated page title\n')

    // Clear existing content
    const existing = await notion.blocks.children.list({
      block_id: NOTION_PARENT_PAGE_ID,
      page_size: 100,
    })
    for (const block of existing.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }
    console.log('✅ Cleared existing content\n')

    console.log('🏗️  Building world-class layout...\n')

    const allBlocks = [
      // ============================================
      // HERO: Ultra Creation Ecosystem Status
      // ============================================
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🚀' },
          color: 'purple_background',
          rich_text: [
            {
              text: { content: 'Ultra Creation 生態系統 | Ecosystem Status' },
              annotations: { bold: true },
            },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n🏢 5 Brands  •  📊 261 Pages  •  💰 NT$30M Target  •  🟢 100% Operational',
              },
            },
          ],
        },
      },

      // ============================================
      // SECTION 1: Products & Brands
      // ============================================
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🏢 產品與品牌 | Products & Brands' } }],
          color: 'purple',
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.PRODUCTS },
      },
      {
        type: 'link_to_page',
        link_to_page: {
          type: 'database_id',
          database_id: DB_IDS.BRAND_GUIDELINES,
        },
      },

      { type: 'divider', divider: {} },

      // ============================================
      // SECTION 2: Content Management
      // ============================================
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📝 內容管理 | Content Management' } }],
          color: 'orange',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📊' },
          color: 'gray_background',
          rich_text: [
            {
              text: {
                content:
                  '73 篇文章  •  12 個 Email 範本  •  15 個 AI 查詢範本',
              },
            },
          ],
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.BLOG_POSTS },
      },
      {
        type: 'link_to_page',
        link_to_page: {
          type: 'database_id',
          database_id: DB_IDS.EMAIL_TEMPLATES,
        },
      },
      {
        type: 'link_to_page',
        link_to_page: {
          type: 'database_id',
          database_id: DB_IDS.AI_QUERY_TEMPLATES,
        },
      },

      { type: 'divider', divider: {} },

      // ============================================
      // SECTION 3: Developer Zone
      // ============================================
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🔧 開發者專區 | Developer Zone' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⚡' },
          color: 'gray_background',
          rich_text: [
            {
              text: {
                content: '40+ 技術棧  •  11+ API 端點  •  86+ React 元件',
              },
            },
          ],
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.TECH_STACK },
      },
      {
        type: 'link_to_page',
        link_to_page: {
          type: 'database_id',
          database_id: DB_IDS.API_ENDPOINTS,
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.COMPONENTS },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.ADR },
      },

      { type: 'divider', divider: {} },

      // ============================================
      // SECTION 4: CRM & Leads
      // ============================================
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '👥 客戶管理 | CRM & Leads' } }],
          color: 'pink',
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.INQUIRIES },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.PROBE_LEADS },
      },

      { type: 'divider', divider: {} },

      // ============================================
      // FOOTER: Meta Info
      // ============================================
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '💡' },
          color: 'yellow_background',
          rich_text: [
            { text: { content: '💡 使用提示 | Quick Tips' } },
            {
              text: {
                content:
                  '\n• 點擊上方連結可直接開啟 database 完整頁面\n• 想要嵌入視圖？在任何位置輸入 /linked 選擇 database\n• 切換視圖：畫廊（卡片）、看板（分組）、表格（完整）',
              },
            },
          ],
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
          ],
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '最後更新：' }, annotations: { italic: true } },
            {
              text: { content: new Date().toLocaleDateString('zh-TW') },
              annotations: { code: true },
            },
            {
              text: { content: '  •  Ultra Creation Co., Ltd.' },
              annotations: { italic: true },
            },
          ],
        },
      },
    ]

    // Append all blocks
    const batchSize = 100
    for (let i = 0; i < allBlocks.length; i += batchSize) {
      const batch = allBlocks.slice(i, i + batchSize)
      await notion.blocks.children.append({
        block_id: NOTION_PARENT_PAGE_ID,
        children: batch.map((b) => ({ object: 'block', ...b })),
      })
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} added`)
      await delay(1000)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💎 World-Class Dashboard Created!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✨ Design Principles:')
    console.log('   ✅ 極簡設計 - 移除所有冗餘文字')
    console.log('   ✅ 可點擊連結 - 每個 database 都可直接開啟')
    console.log('   ✅ 視覺分組 - 4 大區塊清楚分類')
    console.log('   ✅ 戰情室美學 - 狀態一目了然')
    console.log('   ✅ 世界頂尖水準 - 專業、簡潔、高效')
    console.log('\n🎯 Result: 點開頁面就能立即開始工作！')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal:', err)
    process.exit(1)
  })
