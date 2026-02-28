// Script to create Tech Stack Registry Database for Ultra Creation Knowledge Base
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

async function createTechStackDatabase() {
  console.log('🚀 Creating Tech Stack Registry Database...\n')

  try {
    const techStackDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Tech Stack Registry',
          },
        },
      ],
      properties: {
        Name: {
          title: {},
        },
        Category: {
          select: {
            options: [
              { name: 'Frontend', color: 'blue' },
              { name: 'Backend', color: 'purple' },
              { name: 'Database', color: 'green' },
              { name: 'Deployment', color: 'orange' },
              { name: 'AI/ML', color: 'pink' },
              { name: 'Email', color: 'yellow' },
              { name: 'Payment', color: 'red' },
              { name: 'CRM', color: 'gray' },
              { name: 'Analytics', color: 'default' },
              { name: 'Authentication', color: 'blue' },
              { name: 'Storage', color: 'green' },
            ],
          },
        },
        Version: {
          rich_text: {},
        },
        'Package Name': {
          rich_text: {},
        },
        'Documentation URL': {
          url: {},
        },
        License: {
          select: {
            options: [
              { name: 'MIT', color: 'green' },
              { name: 'Apache 2.0', color: 'blue' },
              { name: 'BSD', color: 'gray' },
              { name: 'GPL', color: 'yellow' },
              { name: 'Proprietary', color: 'red' },
            ],
          },
        },
        'Monthly Cost': {
          number: {
            format: 'number',
          },
        },
        Critical: {
          checkbox: {},
        },
        Notes: {
          rich_text: {},
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ Tech Stack Registry Database created!')
    console.log(`   Database ID: ${techStackDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_TECH_STACK_DB_ID=${techStackDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Copy the Database ID to .env')
    console.log('3. Run extract-tech-stack.js to import from package.json')
    console.log('4. Manually add Relation in Notion UI:')
    console.log('   - Used By (Relation to Products Database)')

    return techStackDb.id
  } catch (error) {
    console.error('❌ Error creating Tech Stack Registry database:', error)
    throw error
  }
}

createTechStackDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
