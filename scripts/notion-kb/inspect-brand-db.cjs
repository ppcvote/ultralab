// Inspect Brand Guidelines Database structure
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const BRAND_DB_ID = process.env.NOTION_BRAND_GUIDELINES_DB_ID

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

async function inspect() {
  console.log('🔍 Inspecting Brand Guidelines Database...\n')

  const brandsData = await callNotionAPI(`/databases/${BRAND_DB_ID}/query`, 'POST', {
    page_size: 5,
  })

  console.log(`Found ${brandsData.results.length} entries\n`)
  console.log('First entry structure:')
  console.log(JSON.stringify(brandsData.results[0], null, 2))
}

inspect()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
