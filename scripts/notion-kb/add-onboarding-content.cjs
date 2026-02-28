// Add content to Onboarding Guide
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PAGE_ID = '31545842-ecf0-81ec-9f64-de389e98a294'

async function callNotionAPI(endpoint, method, body) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`API Error: ${JSON.stringify(data, null, 2)}`)
  return data
}

async function addContent() {
  const blocks = [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: 'Welcome to Ultra Creation!' } }],
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ text: { content: '30 分鐘內理解整個生態系統' } }],
        icon: { emoji: '💡' },
      },
    },
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📦 Our Products' } }],
      },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: 'Ultra Creation 管理 5 個產品品牌：' } }],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: 'Ultra Lab - 技術服務品牌' } }],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: 'Ultra Advisor - 財務規劃 SaaS' } }],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: 'Mind Threads - Threads 自動化 SaaS' } }],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: 'UltraProbe - AI 安全掃描工具' } }],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: 'MinYi Personal Brand - 財務顧問個人頁面' } }],
      },
    },
  ]

  await callNotionAPI(`/blocks/${PAGE_ID}/children`, 'PATCH', { children: blocks })
  console.log('✅ Onboarding Guide content added!')
}

addContent().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
