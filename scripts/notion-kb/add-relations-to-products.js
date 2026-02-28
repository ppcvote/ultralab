// Script to add relation properties to Products database schema
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_VERSION = '2022-06-28'

// Database IDs
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID
const BLOG_POSTS_DB_ID = process.env.NOTION_BLOG_POSTS_DB_ID
const TECH_STACK_DB_ID = process.env.NOTION_TECH_STACK_DB_ID
const API_ENDPOINTS_DB_ID = process.env.NOTION_API_ENDPOINTS_DB_ID
const COMPONENTS_DB_ID = process.env.NOTION_COMPONENTS_DB_ID
const BRAND_DB_ID = process.env.NOTION_BRAND_GUIDELINES_DB_ID

if (!NOTION_API_KEY) {
  console.error('❌ Missing NOTION_API_KEY!')
  process.exit(1)
}

async function callNotionAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
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

async function main() {
  console.log('🔗 Adding Relations to Products Database...\n')

  try {
    // Get current database schema
    const database = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}`, 'GET')

    console.log('Current database properties:', Object.keys(database.properties).join(', '))
    console.log('\n')

    // Prepare new relation properties (dual_property for two-way relations)
    const newProperties = {
      'Blog Posts': {
        relation: {
          database_id: BLOG_POSTS_DB_ID,
          dual_property: {},
        },
      },
      'Tech Stack': {
        relation: {
          database_id: TECH_STACK_DB_ID,
          dual_property: {},
        },
      },
      'API Endpoints': {
        relation: {
          database_id: API_ENDPOINTS_DB_ID,
          dual_property: {},
        },
      },
      Components: {
        relation: {
          database_id: COMPONENTS_DB_ID,
          dual_property: {},
        },
      },
      Brand: {
        relation: {
          database_id: BRAND_DB_ID,
          dual_property: {},
        },
      },
    }

    console.log('Adding 5 relation properties...\n')

    // Update database schema
    const result = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}`, 'PATCH', {
      properties: newProperties,
    })

    console.log('✅ Successfully added 5 relation properties!')
    console.log('\nNew properties:')
    console.log('   1. Blog Posts → 部落格文章 | Blog Posts')
    console.log('   2. Tech Stack → 技術棧清單 | Tech Stack')
    console.log('   3. API Endpoints → API 端點清單 | API Endpoints')
    console.log('   4. Components → 元件庫 | Components')
    console.log('   5. Brand → 品牌規範 | Brand Guidelines')
    console.log('\n✨ Done! Now you can link products to their resources.')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
