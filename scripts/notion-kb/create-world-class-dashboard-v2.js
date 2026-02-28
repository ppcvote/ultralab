// World-Class Dashboard - Simplified (No Columns, API-Stable)
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
  console.log('🏆 Creating World-Class Dashboard (Simplified, Stable)...\n')

  try {
    // Update page
    await notion.pages.update({
      page_id: NOTION_PARENT_PAGE_ID,
      icon: { type: 'emoji', emoji: '🎯' },
      properties: {
        title: {
          title: [
            { text: { content: '🎯 傲創戰情室 | Ultra Creation Command Center' } },
          ],
        },
      },
    })
    console.log('✅ Updated page title\n')

    // Clear
    const existing = await notion.blocks.children.list({
      block_id: NOTION_PARENT_PAGE_ID,
      page_size: 100,
    })
    for (const block of existing.results) {
      await notion.blocks.delete({ block_id: block.id })
      await delay(300)
    }
    console.log('✅ Cleared content\n')

    // Build (all in one big batch)
    console.log('🏗️  Building world-class layout...\n')

    const allBlocks = [
      // HERO
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🚀' },
          color: 'purple_background',
          rich_text: [
            {
              text: { content: 'Ultra Creation 生態系統戰情室' },
              annotations: { bold: true },
            },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' } },
            {
              text: { content: '📊 5 個產品品牌  |  261 頁知識庫  |  30 分鐘上手\n' },
            },
            { text: { content: '💰 目標營收: NT$3000萬+  |  🚀 100% 運作中' } },
          ],
        },
      },
      { type: 'divider', divider: {} },

      // BRANDS
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🏢 品牌運作狀態' } }],
          color: 'purple',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🟣' },
          color: 'purple_background',
          rich_text: [
            { text: { content: 'Ultra Lab' }, annotations: { bold: true } },
            { text: { content: '  •  🟢 Active  •  ultralab.tw' } },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n💼 IG/Threads 自動化 + 短影音 + SaaS 建置 + AI 串接\n🔧 React 18 + Vite + Tailwind v4 + Firebase + Vercel\n💰 混合模式（接案 → SaaS 產品化）',
              },
            },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🔵' },
          color: 'blue_background',
          rich_text: [
            { text: { content: 'Ultra Advisor' }, annotations: { bold: true } },
            { text: { content: '  •  🟢 Active  •  NT$3000萬目標' } },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n💼 財務規劃 SaaS 平台（18 個財務工具 + 67 篇 blog）\n🔧 React 18 + Tailwind v3 + Recharts + Ant Design + Firebase\n💰 訂閱制（目標 4000 付費用戶 × NT$7500）',
              },
            },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '💬' },
          color: 'default',
          rich_text: [
            { text: { content: 'Mind Threads' }, annotations: { bold: true } },
            { text: { content: '  •  🟢 Live  •  NT$1,990/月' } },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n💼 Threads 多帳號自動化 SaaS\n🔧 Meta Threads API + Gemini AI + Vercel Cron\n📈 成功案例: GinRollBT 6 個月 6500+ 粉絲',
              },
            },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🔍' },
          color: 'default',
          rich_text: [
            { text: { content: 'UltraProbe' }, annotations: { bold: true } },
            { text: { content: '  •  🟢 Embedded  •  /probe' } },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n💼 AI 安全掃描工具（prompt injection + URL 掃描）\n🔧 Gemini 2.5 Flash + Firebase + Notion CRM Sync\n💰 Free tier + Pro API ($0.01/scan) + Lead Generation',
              },
            },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '👤' },
          color: 'default',
          rich_text: [
            { text: { content: 'MinYi' }, annotations: { bold: true } },
            { text: { content: '  •  🟢 Embedded  •  /minyi' } },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n💼 MDRT 財務顧問個人頁面（IG Bio Landing Page）\n🔧 整合於 Ultra Lab，獨立路由\n🎨 淺色主題（#1E40AF 藍色系）',
              },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // STATS
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '📊 Knowledge Base 統計' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📝' },
          color: 'orange_background',
          rich_text: [
            { text: { content: '73 篇' }, annotations: { bold: true, code: true } },
            { text: { content: '  部落格文章（Ultra Lab 12 + Ultra Advisor 61）' } },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📧' },
          color: 'orange_background',
          rich_text: [
            { text: { content: '12 個' }, annotations: { bold: true, code: true } },
            { text: { content: '  Email 範本（依服務類型 + 預算區間）' } },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🔧' },
          color: 'gray_background',
          rich_text: [
            { text: { content: '40+' }, annotations: { bold: true, code: true } },
            { text: { content: '  技術棧（React, Firebase, Gemini AI, Vercel...）' } },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🔌' },
          color: 'gray_background',
          rich_text: [
            { text: { content: '11+' }, annotations: { bold: true, code: true } },
            { text: { content: '  API 端點（probe-scan, payuni, notify...）' } },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🧩' },
          color: 'gray_background',
          rich_text: [
            { text: { content: '86+' }, annotations: { bold: true, code: true } },
            { text: { content: '  React 元件（Hero, Calculator, Admin...）' } },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🤖' },
          color: 'purple_background',
          rich_text: [
            { text: { content: '15 個' }, annotations: { bold: true, code: true } },
            { text: { content: '  AI 查詢範本（AI Agent 專用）' } },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // DATABASES
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🗄️ 主要資料庫' } }],
          color: 'purple',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⚡' },
          color: 'yellow_background',
          rich_text: [
            {
              text: { content: '⚠️ 3 分鐘手動設定（Notion API 限制）' },
              annotations: { bold: true },
            },
            {
              text: {
                content:
                  '\n\n下方「📌 在此添加 Linked View」區塊：\n1. 點擊該區塊\n2. 輸入 /linked\n3. 選擇對應資料庫\n4. 切換成 Gallery/Board/Timeline view\n\n',
              },
            },
            {
              text: {
                content: '💡 這樣就能在一個頁面看到所有資料，締造神話級設計！',
              },
              annotations: { italic: true },
            },
          ],
        },
      },

      // Products
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🏢 產品中心 | Products' } }],
          color: 'purple',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📌' },
          color: 'purple_background',
          rich_text: [
            {
              text: { content: '在此添加 Linked View (/linked → 產品中心)' },
              annotations: { italic: true },
            },
            {
              text: {
                content: '\n💡 建議: Gallery view + 顯示 cover images',
              },
              annotations: { italic: true },
            },
          ],
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.PRODUCTS },
      },

      // Blog Posts
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📝 部落格文章 | Blog Posts' } }],
          color: 'orange',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📌' },
          color: 'orange_background',
          rich_text: [
            {
              text: { content: '在此添加 Linked View (/linked → 部落格文章)' },
              annotations: { italic: true },
            },
            {
              text: {
                content: '\n💡 建議: Board view (依 Category) 或 Timeline view (依發布日期)',
              },
              annotations: { italic: true },
            },
          ],
        },
      },
      {
        type: 'link_to_page',
        link_to_page: { type: 'database_id', database_id: DB_IDS.BLOG_POSTS },
      },

      // CRM
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '👥 CRM 客戶管理' } }],
          color: 'pink',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📌' },
          color: 'pink_background',
          rich_text: [
            {
              text: {
                content: '在此添加 2 個 Linked Views: 客戶詢問 + UltraProbe Leads',
              },
              annotations: { italic: true },
            },
            {
              text: {
                content: '\n💡 建議: Table view (顯示最新詢問)',
              },
              annotations: { italic: true },
            },
          ],
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

      // ALL DATABASES (Toggle)
      {
        type: 'toggle',
        toggle: {
          rich_text: [
            { text: { content: '📚 完整資料庫清單（11 個）' }, annotations: { bold: true } },
          ],
          color: 'gray_background',
          children: [
            {
              type: 'heading_3',
              heading_3: { rich_text: [{ text: { content: '🏢 產品與品牌' } }] },
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
            {
              type: 'heading_3',
              heading_3: { rich_text: [{ text: { content: '📝 內容' } }] },
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
              type: 'heading_3',
              heading_3: { rich_text: [{ text: { content: '🔧 技術' } }] },
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
            {
              type: 'link_to_page',
              link_to_page: {
                type: 'database_id',
                database_id: DB_IDS.AI_QUERY_TEMPLATES,
              },
            },
            {
              type: 'heading_3',
              heading_3: { rich_text: [{ text: { content: '👥 CRM' } }] },
            },
            {
              type: 'link_to_page',
              link_to_page: { type: 'database_id', database_id: DB_IDS.INQUIRIES },
            },
            {
              type: 'link_to_page',
              link_to_page: { type: 'database_id', database_id: DB_IDS.PROBE_LEADS },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // FOOTER
      {
        type: 'quote',
        quote: {
          rich_text: [
            {
              text: {
                content: '💡 完成 3 分鐘設定後，這將成為世界頂尖的 Notion Knowledge Base',
              },
              annotations: { bold: true },
            },
          ],
          color: 'purple',
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
              text: { content: '  |  Ultra Creation Co., Ltd.' },
              annotations: { italic: true },
            },
          ],
        },
      },
    ]

    // Append in batches
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

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 世界頂尖 Dashboard 創建完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Features:')
    console.log('   🚀 Hero with live stats (5 brands, 261 pages)')
    console.log('   🏢 5 brand cards (status, tech stack, revenue)')
    console.log('   📊 6 quick stats callouts')
    console.log('   📌 Linked view placeholders (3-min setup)')
    console.log('   📚 Collapsible full database list (11 databases)')
    console.log('\n⚠️  Next Step (3 minutes):')
    console.log('   1. Open Notion workspace')
    console.log('   2. Find「📌 在此添加 Linked View」blocks')
    console.log('   3. Type /linked → select database → choose Gallery/Board view')
    console.log('\n💎 Result: 締造神話級 Notion KB ✅')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.body) console.error(JSON.stringify(error.body, null, 2))
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal:', err)
    process.exit(1)
  })
