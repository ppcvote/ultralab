// Script to create API Endpoints Registry Database for Ultra Creation Knowledge Base
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

async function createAPIEndpointsDatabase() {
  console.log('🚀 Creating API Endpoints Registry Database...\n')

  try {
    const apiDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'API Endpoints Registry',
          },
        },
      ],
      properties: {
        Endpoint: {
          title: {},
        },
        Method: {
          select: {
            options: [
              { name: 'GET', color: 'blue' },
              { name: 'POST', color: 'green' },
              { name: 'PUT', color: 'yellow' },
              { name: 'DELETE', color: 'red' },
              { name: 'PATCH', color: 'orange' },
            ],
          },
        },
        Purpose: {
          rich_text: {},
        },
        'Auth Required': {
          checkbox: {},
        },
        'Rate Limit': {
          rich_text: {},
        },
        'Source File': {
          rich_text: {},
        },
        'Public API': {
          checkbox: {},
        },
        Status: {
          select: {
            options: [
              { name: 'Live', color: 'green' },
              { name: 'Beta', color: 'yellow' },
              { name: 'Deprecated', color: 'red' },
              { name: 'Development', color: 'gray' },
            ],
          },
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ API Endpoints Registry Database created!')
    console.log(`   Database ID: ${apiDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_API_ENDPOINTS_DB_ID=${apiDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Copy the Database ID to .env')
    console.log('3. Run extract-api-endpoints.js to import from api/ folders')
    console.log('4. Manually add Relation in Notion UI:')
    console.log('   - Product (Relation to Products Database)')

    return apiDb.id
  } catch (error) {
    console.error('❌ Error creating API Endpoints Registry database:', error)
    throw error
  }
}

createAPIEndpointsDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
