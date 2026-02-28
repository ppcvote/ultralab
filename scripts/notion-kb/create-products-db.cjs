// Script to create Products Database for Ultra Creation Knowledge Base
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

async function createProductsDatabase() {
  console.log('🚀 Creating Products Database...\n')

  try {
    const productsDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Products',
          },
        },
      ],
      properties: {
        Name: {
          title: {},
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
        'Product Type': {
          select: {
            options: [
              { name: 'SaaS', color: 'blue' },
              { name: 'Service', color: 'purple' },
              { name: 'Embedded Feature', color: 'gray' },
            ],
          },
        },
        'Primary Color': {
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
        'Live URL': {
          url: {},
        },
        'Repository Path': {
          rich_text: {},
        },
        'Revenue Model': {
          select: {
            options: [
              { name: 'Subscription', color: 'green' },
              { name: 'Services', color: 'blue' },
              { name: 'Freemium', color: 'yellow' },
              { name: 'Lead Gen', color: 'orange' },
            ],
          },
        },
        'Launch Date': {
          date: {},
        },
        'Monthly Revenue': {
          number: {
            format: 'number',
          },
        },
        'Target Revenue': {
          number: {
            format: 'number',
          },
        },
        Description: {
          rich_text: {},
        },
        'Firebase Project': {
          rich_text: {},
        },
        'Vercel Project': {
          rich_text: {},
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ Products Database created!')
    console.log(`   Database ID: ${productsDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_PRODUCTS_DB_ID=${productsDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Copy the Database ID to .env')
    console.log('3. Manually add Relations in Notion UI:')
    console.log('   - Tech Stack (Relation to Tech Stack Registry)')
    console.log('   - API Endpoints (Relation to API Endpoints Registry)')
    console.log('   - Components (Relation to Component Library)')
    console.log('   - Blog Posts (Relation to Blog Posts Database)')
    console.log('   - Brand Guidelines (Relation to Brand Guidelines Database)')

    return productsDb.id
  } catch (error) {
    console.error('❌ Error creating Products database:', error)
    throw error
  }
}

createProductsDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
