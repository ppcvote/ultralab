// Script to create Component Library Database for Ultra Creation Knowledge Base
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

async function createComponentsDatabase() {
  console.log('🚀 Creating Component Library Database...\n')

  try {
    const componentsDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Component Library',
          },
        },
      ],
      properties: {
        'Component Name': {
          title: {},
        },
        Category: {
          select: {
            options: [
              { name: 'Layout', color: 'blue' },
              { name: 'Form', color: 'green' },
              { name: 'Chart', color: 'orange' },
              { name: 'Animation', color: 'purple' },
              { name: 'Auth', color: 'red' },
              { name: 'Feature', color: 'yellow' },
              { name: 'Navigation', color: 'pink' },
              { name: 'Display', color: 'gray' },
              { name: 'Input', color: 'default' },
            ],
          },
        },
        'File Path': {
          rich_text: {},
        },
        'Lines of Code': {
          number: {
            format: 'number',
          },
        },
        Complexity: {
          select: {
            options: [
              { name: 'Simple', color: 'green' },
              { name: 'Medium', color: 'yellow' },
              { name: 'Complex', color: 'red' },
            ],
          },
        },
        Reusable: {
          checkbox: {},
        },
        Status: {
          select: {
            options: [
              { name: 'Active', color: 'green' },
              { name: 'Deprecated', color: 'red' },
              { name: 'Needs Refactor', color: 'yellow' },
            ],
          },
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ Component Library Database created!')
    console.log(`   Database ID: ${componentsDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_COMPONENTS_DB_ID=${componentsDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Copy the Database ID to .env')
    console.log('3. Run extract-components.js to import from src/components/')
    console.log('4. Manually add Relation in Notion UI:')
    console.log('   - Product (Relation to Products Database)')

    return componentsDb.id
  } catch (error) {
    console.error('❌ Error creating Component Library database:', error)
    throw error
  }
}

createComponentsDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
