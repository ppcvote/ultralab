// Script to create Relations by updating Product pages
// This will automatically create relation properties in Products database schema
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID
const NOTION_VERSION = '2022-06-28'

if (!NOTION_API_KEY || !NOTION_PRODUCTS_DB_ID) {
  console.error('❌ Missing environment variables!')
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
  console.log('🔗 Creating Product Relations...\n')

  try {
    // Step 1: Query all product pages
    const response = await callNotionAPI(`/databases/${NOTION_PRODUCTS_DB_ID}/query`, 'POST', {})

    const products = response.results

    console.log(`Found ${products.length} products\n`)

    // Step 2: Update first product with relation properties
    // This will automatically create the relation properties in database schema
    if (products.length > 0) {
      const firstProduct = products[0]
      const productName = firstProduct.properties.Name?.title?.[0]?.plain_text || 'Unknown'

      console.log(`Updating ${productName} to create relation properties...\n`)

      await callNotionAPI(`/pages/${firstProduct.id}`, 'PATCH', {
        properties: {
          'Blog Posts': {
            relation: [], // Empty relation, just to create the property
          },
          'Tech Stack': {
            relation: [],
          },
          'API Endpoints': {
            relation: [],
          },
          Components: {
            relation: [],
          },
          Brand: {
            relation: [],
          },
        },
      })

      console.log('✅ Successfully created 5 relation properties in Products database!')
      console.log('\nRelation properties created:')
      console.log('   1. Blog Posts')
      console.log('   2. Tech Stack')
      console.log('   3. API Endpoints')
      console.log('   4. Components')
      console.log('   5. Brand')
      console.log('\n✨ Done! The Products database now has relations to all relevant databases.')
    } else {
      console.log('❌ No products found in database')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2))
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
