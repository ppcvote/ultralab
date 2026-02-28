// Create Architecture Decisions (ADR) Database
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

async function callNotionAPI(endpoint, body) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function createADRDatabase() {
  console.log('🔧 Creating Architecture Decisions (ADR) Database...\n')

  const body = {
    parent: {
      type: 'page_id',
      page_id: PARENT_PAGE_ID,
    },
    icon: {
      type: 'emoji',
      emoji: '⚙️',
    },
    title: [
      {
        type: 'text',
        text: {
          content: 'Architecture Decisions (ADR)',
        },
      },
    ],
    properties: {
      Title: {
        title: {},
      },
      'Decision ID': {
        rich_text: {},
      },
      Date: {
        date: {},
      },
      Status: {
        select: {
          options: [
            { name: 'Accepted', color: 'green' },
            { name: 'Superseded', color: 'yellow' },
            { name: 'Deprecated', color: 'red' },
          ],
        },
      },
      Severity: {
        select: {
          options: [
            { name: 'Critical', color: 'red' },
            { name: 'High', color: 'orange' },
            { name: 'Medium', color: 'yellow' },
            { name: 'Low', color: 'gray' },
          ],
        },
      },
      Context: {
        rich_text: {},
      },
      Decision: {
        rich_text: {},
      },
      Consequences: {
        rich_text: {},
      },
      Alternatives: {
        rich_text: {},
      },
    },
  }

  const result = await callNotionAPI('/databases', body)

  console.log('✅ ADR Database Created!')
  console.log('📋 Database ID:', result.id)
  console.log('\n💡 Please add this to your .env file:')
  console.log(`NOTION_ADR_DB_ID=${result.id}`)
  console.log('\n🔗 Database URL:', result.url)

  return result.id
}

createADRDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
