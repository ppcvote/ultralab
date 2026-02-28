// Create Email Templates Database
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

async function callNotionAPI(endpoint, body) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function createEmailTemplatesDatabase() {
  console.log('📧 Creating Email Templates Database...\n')

  const body = {
    parent: {
      type: 'page_id',
      page_id: PARENT_PAGE_ID,
    },
    icon: {
      type: 'emoji',
      emoji: '📧',
    },
    title: [
      {
        type: 'text',
        text: {
          content: 'Email Templates',
        },
      },
    ],
    properties: {
      'Template Name': {
        title: {},
      },
      Category: {
        select: {
          options: [
            { name: 'Inquiry Response', color: 'blue' },
            { name: 'Follow-up', color: 'green' },
            { name: 'Onboarding', color: 'purple' },
            { name: 'Technical Support', color: 'orange' },
          ],
        },
      },
      'Service Type': {
        select: {
          options: [
            { name: 'Threads', color: 'default' },
            { name: 'IG Reel', color: 'pink' },
            { name: 'Short Video', color: 'red' },
            { name: 'SaaS Build', color: 'blue' },
            { name: 'AI Integration', color: 'purple' },
            { name: 'UltraProbe', color: 'gray' },
          ],
        },
      },
      'Budget Tier': {
        select: {
          options: [
            { name: 'Discuss', color: 'gray' },
            { name: 'Under 3K', color: 'yellow' },
            { name: '3K-10K', color: 'orange' },
            { name: '10K+', color: 'red' },
          ],
        },
      },
      'Subject Line': {
        rich_text: {},
      },
      Hook: {
        rich_text: {},
      },
      'Core Message': {
        rich_text: {},
      },
      CTA: {
        rich_text: {},
      },
      Signature: {
        rich_text: {},
      },
      'Success Rate': {
        number: {
          format: 'percent',
        },
      },
    },
  }

  const result = await callNotionAPI('/databases', body)

  console.log('✅ Email Templates Database Created!')
  console.log('📋 Database ID:', result.id)
  console.log('\n💡 Please add this to your .env file:')
  console.log(`NOTION_EMAIL_TEMPLATES_DB_ID=${result.id}`)
  console.log('\n🔗 Database URL:', result.url)

  return result.id
}

createEmailTemplatesDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
