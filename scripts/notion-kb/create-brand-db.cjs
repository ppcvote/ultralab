// Script to create Brand Guidelines Database for Ultra Creation Knowledge Base
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

async function createBrandDatabase() {
  console.log('🚀 Creating Brand Guidelines Database...\n')

  try {
    const brandDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Brand Guidelines',
          },
        },
      ],
      properties: {
        'Brand Name': {
          title: {},
        },
        'Primary Color': {
          rich_text: {},
        },
        'Secondary Color': {
          rich_text: {},
        },
        'Background Color': {
          rich_text: {},
        },
        'Typography (Headings)': {
          rich_text: {},
        },
        'Typography (Body)': {
          rich_text: {},
        },
        'Theme Type': {
          select: {
            options: [
              { name: 'Dark', color: 'default' },
              { name: 'Light', color: 'gray' },
              { name: 'Mixed', color: 'blue' },
            ],
          },
        },
        'Design Spirit': {
          rich_text: {},
        },
        Status: {
          select: {
            options: [
              { name: 'Active', color: 'green' },
              { name: 'Beta', color: 'yellow' },
              { name: 'Sunset', color: 'red' },
            ],
          },
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ Brand Guidelines Database created!')
    console.log(`   Database ID: ${brandDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_BRAND_GUIDELINES_DB_ID=${brandDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Copy the Database ID to .env')
    console.log('3. Manually create 5 brand pages (Ultra Lab, Ultra Advisor, etc.)')
    console.log('4. Manually add Relation in Notion UI:')
    console.log('   - Product (Relation to Products Database)')

    return brandDb.id
  } catch (error) {
    console.error('❌ Error creating Brand Guidelines database:', error)
    throw error
  }
}

createBrandDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
