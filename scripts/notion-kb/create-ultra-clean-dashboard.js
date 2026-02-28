// Ultra Clean Dashboard - Minimalist, World-Class Design
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
  console.log('💎 Creating Ultra Clean Dashboard...\n')

  try {
    // Update page
    await notion.pages.update({
      page_id: NOTION_PARENT_PAGE_ID,
      icon: { type: 'emoji', emoji: '🎯' },
      properties: {
        title: {
          title: [{ text: { content: '🎯 傲創戰情室 | Command Center' } }],
        },
      },
    })
    console.log('✅ Updated title\n')

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

    console.log('🏗️  Building ultra clean layout...\n')

    const allBlocks = [
      // HERO (Compact)
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🚀' },
          color: 'purple_background',
          rich_text: [
            { text: { content: 'Ultra Creation 生態系統' }, annotations: { bold: true } },
            { text: { content: '\n━━━━━━━━━━━━━━━━━━━━━━━━' } },
            {
              text: {
                content:
                  '\n📊 5 個品牌  |  261 頁知識庫  |  💰 NT$3000萬目標  |  🚀 100% 運作中',
              },
            },
          ],
        },
      },
      { type: 'divider', divider: {} },

      // BRANDS (Compact Cards)
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🏢 品牌狀態' } }],
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
            {
              text: {
                content: '\nIG/Threads 自動化 + SaaS 建置  |  React + Firebase',
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
            {
              text: {
                content: '\n財務規劃 SaaS  |  18 個工具 + 67 篇 blog',
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
            {
              text: { content: '\nThreads 多帳號自動化  |  6500+ 粉絲案例' },
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
            { text: { content: 'UltraProbe  •  🟢 Embedded  •  /probe' } },
            { text: { content: '\nAI 安全掃描  |  Free + Pro API' } },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '👤' },
          color: 'default',
          rich_text: [
            { text: { content: 'MinYi  •  🟢 Embedded  •  /minyi' } },
            { text: { content: '\nMDRT 顧問個人頁面  |  IG Bio Landing' } },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // STATS (One Line)
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '📊 Knowledge Base' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📊' },
          color: 'blue_background',
          rich_text: [
            { text: { content: '📝 73 篇 文章  |  📧 12 個 Email  |  🔧 40+ 技術棧  |  🔌 11+ API  |  🧩 86+ 元件  |  🤖 15 個 AI 範本' } },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // DATABASES
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🗄️ 資料庫總覽' } }],
          color: 'purple',
        },
      },

      // ONE-TIME INSTRUCTION (Collapsible)
      {
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '💡 設定提示（第一次使用請展開）' },
              annotations: { bold: true },
            },
          ],
          color: 'yellow_background',
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content:
                        '在下方每個 heading 下方：\n1. 輸入 /linked\n2. 選擇對應資料庫\n3. 切換成 Gallery/Board/Timeline view\n\n完成後收合此區塊即可。',
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // Products
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🏢 產品中心 | Products' } }],
          color: 'purple',
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: '👇 在此輸入 /linked 選擇「產品中心」，切換成 Gallery view',
              },
              annotations: { italic: true },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // Blog Posts
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📝 部落格文章 | Blog Posts' } }],
          color: 'orange',
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content:
                  '👇 在此輸入 /linked 選擇「部落格文章」，切換成 Board view (依 Category)',
              },
              annotations: { italic: true },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // CRM
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '👥 CRM 客戶管理' } }],
          color: 'pink',
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content:
                  '👇 在此輸入 /linked 選擇「客戶詢問」和「安全掃描 Leads」，Table view',
              },
              annotations: { italic: true },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // ALL DATABASES (Collapsed)
      {
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '📚 完整資料庫清單（11 個）' },
              annotations: { bold: true },
            },
          ],
          color: 'gray_background',
          children: [
            {
              type: 'heading_3',
              heading_3: { rich_text: [{ text: { content: '🏢 產品' } }] },
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

    // Append
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

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💎 Ultra Clean Dashboard 創建完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✨ Improvements:')
    console.log('   ✅ 移除所有 placeholder callouts')
    console.log('   ✅ 移除重複的 database links')
    console.log('   ✅ 說明只出現一次（可收合）')
    console.log('   ✅ 簡潔的 dividers 分隔')
    console.log('   ✅ 每個 database: Heading → Linked View（乾淨！）')
    console.log('\n⚡ Next Step (1 分鐘):')
    console.log('   1. 在每個 heading 下方輸入 /linked')
    console.log('   2. 選擇資料庫')
    console.log('   3. 切換成 Gallery/Board view')
    console.log('\n💎 Result: 簡潔、專業、世界頂尖 ✅')
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
