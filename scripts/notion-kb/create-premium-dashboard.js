// Premium Dashboard - World-Class Design with Guided Setup
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
  console.log('💎 Creating Premium Dashboard (World-Class Template)...\n')

  try {
    // Update page
    await notion.pages.update({
      page_id: NOTION_PARENT_PAGE_ID,
      icon: { type: 'emoji', emoji: '🎯' },
      properties: {
        title: {
          title: [{ text: { content: '🎯 傲創戰情室 | Ultra Command Center' } }],
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

    console.log('🏗️  Building premium structure...\n')

    const allBlocks = [
      // ==========================================
      // HERO SECTION
      // ==========================================
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '🚀' },
          color: 'purple_background',
          rich_text: [
            {
              text: { content: 'Ultra Creation 生態系統總覽' },
              annotations: { bold: true },
            },
            { text: { content: '\n' } },
            {
              text: {
                content:
                  '🏢 5 個品牌  •  📊 261 頁文檔  •  💰 NT$3000萬目標  •  🟢 100% 運作中',
              },
            },
          ],
        },
      },

      // ONE-TIME SETUP GUIDE (collapsible)
      {
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: { content: '💡 首次設定指南（完成後可收合）' },
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
                        '下方每個區塊都有「⬇️ 在此設定視圖」的提示。請按照以下步驟操作：\n\n',
                    },
                  },
                  {
                    text: { content: '步驟 1：' },
                    annotations: { bold: true },
                  },
                  {
                    text: {
                      content:
                        ' 在「⬇️ 在此設定視圖」callout 的正下方，輸入 /linked\n',
                    },
                  },
                  {
                    text: { content: '步驟 2：' },
                    annotations: { bold: true },
                  },
                  { text: { content: ' 搜尋並選擇指定的 database\n' } },
                  {
                    text: { content: '步驟 3：' },
                    annotations: { bold: true },
                  },
                  { text: { content: ' 切換成推薦的 view type\n' } },
                  {
                    text: { content: '步驟 4：' },
                    annotations: { bold: true },
                  },
                  {
                    text: {
                      content:
                        ' 完成所有區塊後，刪除所有「⬇️ 在此設定視圖」callouts\n\n',
                    },
                  },
                  {
                    text: {
                      content: '預計完成時間：5-8 分鐘\n完成後你將擁有世界頂尖的知識庫！',
                    },
                    annotations: { italic: true },
                  },
                ],
              },
            },
          ],
        },
      },

      { type: 'divider', divider: {} },

      // ==========================================
      // SECTION 1: 產品總覽 (Products Overview)
      // ==========================================
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🏢 產品總覽' } }],
          color: 'purple',
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
                  '5 個品牌的完整資訊：Ultra Lab, Ultra Advisor, Mind Threads, UltraProbe, MinYi',
              },
            },
          ],
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：輸入 /linked → 選擇「產品中心 | Products」→ 切換成「畫廊」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } }, // Spacer

      // Brand Guidelines
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '🎨 品牌規範' } }],
          color: 'purple',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「品牌規範 | Brand Guidelines」→ 「畫廊」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      { type: 'divider', divider: {} },

      // ==========================================
      // SECTION 2: 內容中心 (Content Hub)
      // ==========================================
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '📝 內容中心' } }],
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
                content: '73 篇文章  •  12 個 Email 範本  •  15 個 AI 查詢範本',
              },
            },
          ],
        },
      },

      // Blog Posts
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '📰 部落格文章 (73 篇)' } }],
          color: 'orange',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「部落格文章 | Blog Posts」→ 「看板」view (依 Category 分組)',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      // Email Templates
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '📧 Email 範本 (12 個)' } }],
          color: 'orange',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「Email 範本 | Email Templates」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      // AI Query Templates
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '🤖 AI 查詢範本 (15 個)' } }],
          color: 'orange',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「AI 查詢範本 | AI Query Templates」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      { type: 'divider', divider: {} },

      // ==========================================
      // SECTION 3: 開發者資源 (Developer Resources)
      // ==========================================
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🔧 開發者資源' } }],
          color: 'blue',
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
                content: '40+ 技術棧  •  11+ API 端點  •  86+ React 元件  •  10+ ADR',
              },
            },
          ],
        },
      },

      // Tech Stack
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '⚙️ 技術棧清單 (40+)' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「技術棧清單 | Tech Stack」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      // API Endpoints
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '🔌 API 端點清單 (11+)' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「API 端點清單 | API Endpoints」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      // Components
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '🧩 元件庫 (86+)' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「元件庫 | Components」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      // ADR
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '📋 架構決策記錄 (10+)' } }],
          color: 'blue',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「架構決策記錄 | ADR」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      { type: 'divider', divider: {} },

      // ==========================================
      // SECTION 4: 客戶管理 (CRM)
      // ==========================================
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '👥 客戶管理' } }],
          color: 'pink',
        },
      },

      // Inquiries
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '📬 客戶詢問' } }],
          color: 'pink',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「客戶詢問 | Inquiries」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      // Probe Leads
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: '🔍 安全掃描 Leads' } }],
          color: 'pink',
        },
      },
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '⬇️' },
          color: 'yellow_background',
          rich_text: [
            {
              text: {
                content:
                  '在此設定視圖：/linked → 「安全掃描 Leads | Security Leads」→ 「表格」view',
              },
            },
          ],
        },
      },
      { type: 'paragraph', paragraph: { rich_text: [] } },

      { type: 'divider', divider: {} },

      // ==========================================
      // FOOTER
      // ==========================================
      {
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '✨' },
          color: 'green_background',
          rich_text: [
            {
              text: { content: '🎉 設定完成檢查清單' },
              annotations: { bold: true },
            },
            {
              text: {
                content:
                  '\n\n完成後，你的 Dashboard 將包含：\n✅ 11 個嵌入的 database views\n✅ 世界頂尖的視覺層次\n✅ 直觀的資訊架構\n✅ 專業的戰情室美學\n\n🎯 別忘了刪除所有黃色的「⬇️ 在此設定視圖」提示！',
              },
            },
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
              text: { content: '  •  Ultra Creation Co., Ltd.  •  ' },
              annotations: { italic: true },
            },
            {
              text: { content: '💎 World-Class Knowledge Base' },
              annotations: { bold: true, italic: true },
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

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💎 Premium Dashboard Template Created!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✨ What makes this world-class:')
    console.log('   ✅ 視覺豐富 - 色彩、emoji、間距精心設計')
    console.log('   ✅ 引導性強 - 每個步驟都有清楚說明')
    console.log('   ✅ 專業美感 - 4 大區塊 + 層次分明')
    console.log('   ✅ 嵌入視圖 - 完成後直接在 dashboard 上看到所有資料')
    console.log('\n📋 Next Steps:')
    console.log('   1. 打開 Notion 頁面')
    console.log('   2. 展開頂部的「💡 首次設定指南」')
    console.log('   3. 按照指示在每個黃色區塊下方添加 linked views')
    console.log('   4. 預計 5-8 分鐘完成所有設定')
    console.log('   5. 刪除所有黃色提示 callouts')
    console.log('\n🎯 完成後你將擁有世界頂尖的知識庫！')
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
