// Script to create AI Query Templates Database
require('dotenv').config()

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID || '31545842-ecf0-8039-b56a-d690a83d44cd'
const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_VERSION = '2022-06-28'

async function callNotionAPI(endpoint, body) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function createAIQueryTemplatesDatabase() {
  console.log('🚀 Creating AI Query Templates Database...\n')

  try {
    const queryTemplatesDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'AI Query Templates | AI 查詢範本',
          },
        },
      ],
      properties: {
        'Template Name': {
          title: {},
        },
        'Query Type': {
          select: {
            options: [
              { name: 'Search', color: 'blue' },
              { name: 'Filter', color: 'green' },
              { name: 'Aggregate', color: 'orange' },
              { name: 'Relation', color: 'purple' },
            ],
          },
        },
        'Target Database': {
          select: {
            options: [
              { name: 'Products', color: 'blue' },
              { name: 'Blog Posts', color: 'green' },
              { name: 'Tech Stack', color: 'orange' },
              { name: 'API Endpoints', color: 'purple' },
              { name: 'Components', color: 'pink' },
              { name: 'ADR', color: 'red' },
            ],
          },
        },
        'Natural Language Query': {
          rich_text: {},
        },
        'Notion Filter': {
          rich_text: {},
        },
        'Example Usage': {
          rich_text: {},
        },
        'Use Case': {
          select: {
            options: [
              { name: 'Developer Onboarding', color: 'blue' },
              { name: 'Troubleshooting', color: 'red' },
              { name: 'Content Discovery', color: 'green' },
              { name: 'Tech Decision', color: 'orange' },
            ],
          },
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ AI Query Templates Database created!')
    console.log(`   Database ID: ${queryTemplatesDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_AI_QUERY_TEMPLATES_DB_ID=${queryTemplatesDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Populate with AI query templates')

    return queryTemplatesDb.id
  } catch (error) {
    console.error('❌ Error creating AI Query Templates database:', error)
    throw error
  }
}

createAIQueryTemplatesDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
