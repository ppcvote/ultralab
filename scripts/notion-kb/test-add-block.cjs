/**
 * Test adding a single block to Notion page
 */

require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

async function testAddBlock() {
  const response = await fetch(`https://api.notion.com/v1/blocks/${PARENT_PAGE_ID}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      children: [
        {
          object: 'block',
          type: 'child_database',
          child_database: {
            title: 'Test Child Database'
          }
        }
      ]
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Error:', JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Success! Added block:', data.results[0].id)
}

testAddBlock()
