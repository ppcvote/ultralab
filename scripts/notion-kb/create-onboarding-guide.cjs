// Create Onboarding Guide Page
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

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

async function createOnboardingGuide() {
  console.log('📚 Creating Onboarding Guide...\n')

  // Create the page
  const page = await callNotionAPI('/pages', 'POST', {
    parent: {
      type: 'page_id',
      page_id: PARENT_PAGE_ID,
    },
    icon: {
      type: 'emoji',
      emoji: '🚀',
    },
    properties: {
      title: [
        {
          text: {
            content: 'Ultra Creation — 30 分鐘 Onboarding Guide',
          },
        },
      ],
    },
  })

  console.log('✅ Page created:', page.id)

  // Add content blocks
  const blocks = [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: 'Welcome to Ultra Creation! 🎉' } }],
        color: 'purple',
      },
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            text: {
              content:
                '這份指南將幫助你在 30 分鐘內理解整個 Ultra Creation 生態系統。無論你是新加入的開發者、合作夥伴，還是想了解我們產品線的人，這裡有你需要的一切。',
            },
          },
        ],
        icon: { emoji: '💡' },
        color: 'yellow_background',
      },
    },
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📦 我們的產品 | Our Products' } }],
        color: 'blue',
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
                'Ultra Creation 管理 5 個產品品牌，每個都有獨立的技術棧、設計語言和商業模式。',
            },
          },
        ],
      },
    },
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🚀 Quick Start — 如何開始' } }],
        color: 'green',
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [
          { text: { content: 'Clone repositories' } },
        ],
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ text: { content: '閱讀各專案的 CLAUDE.md' } }],
      },
    },
    {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ text: { content: '設定 Firebase 和 Vercel credentials' } }],
      },
    },
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            text: {
              content: '🎯 目標：30 分鐘內理解整個生態系統。知識不流失，效率最大化。',
              annotations: { bold: true },
            },
          },
        ],
        icon: { emoji: '✨' },
        color: 'gray_background',
      },
    },
  ]

  await callNotionAPI(`/blocks/${page.id}/children`, 'PATCH', { children: blocks })

  console.log('✅ Content blocks added')
  console.log('\n🔗 Onboarding Guide URL:', page.url)
  console.log('\n✅ Onboarding Guide created!\n')
}

createOnboardingGuide()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
