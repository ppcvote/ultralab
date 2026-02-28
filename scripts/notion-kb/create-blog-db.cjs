// Script to create Blog Posts Database for Ultra Creation Knowledge Base
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

async function createBlogDatabase() {
  console.log('🚀 Creating Blog Posts Database...\n')

  try {
    const blogDb = await callNotionAPI('/databases', {
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Blog Posts',
          },
        },
      ],
      properties: {
        Title: {
          title: {},
        },
        Slug: {
          rich_text: {},
        },
        Category: {
          select: {
            options: [
              { name: 'Automation', color: 'purple' },
              { name: 'AI', color: 'blue' },
              { name: 'SaaS', color: 'green' },
              { name: 'Financial Planning', color: 'orange' },
              { name: 'Tax', color: 'yellow' },
              { name: 'Retirement', color: 'pink' },
              { name: 'Mortgage', color: 'red' },
              { name: 'Insurance', color: 'gray' },
              { name: 'Security', color: 'default' },
            ],
          },
        },
        Tags: {
          multi_select: {
            options: [
              { name: 'Threads', color: 'purple' },
              { name: 'Instagram', color: 'pink' },
              { name: 'Short Video', color: 'red' },
              { name: 'Gemini', color: 'blue' },
              { name: 'Claude', color: 'orange' },
              { name: 'Firebase', color: 'yellow' },
              { name: 'Vercel', color: 'gray' },
              { name: 'React', color: 'blue' },
              { name: 'TypeScript', color: 'blue' },
              { name: 'Tailwind', color: 'blue' },
              { name: '退休', color: 'pink' },
              { name: '房貸', color: 'red' },
              { name: '保險', color: 'green' },
              { name: '稅務', color: 'yellow' },
              { name: '投資', color: 'orange' },
            ],
          },
        },
        Excerpt: {
          rich_text: {},
        },
        'Read Time': {
          number: {
            format: 'number',
          },
        },
        'Word Count': {
          number: {
            format: 'number',
          },
        },
        'Publish Date': {
          date: {},
        },
        Status: {
          select: {
            options: [
              { name: 'Published', color: 'green' },
              { name: 'Draft', color: 'yellow' },
              { name: 'Needs Update', color: 'orange' },
              { name: 'Archived', color: 'red' },
            ],
          },
        },
        'Source File Path': {
          rich_text: {},
        },
        'Last Updated': {
          last_edited_time: {},
        },
      },
    })

    console.log('✅ Blog Posts Database created!')
    console.log(`   Database ID: ${blogDb.id}\n`)
    console.log('📝 Add this to your .env file:\n')
    console.log(`NOTION_BLOG_POSTS_DB_ID=${blogDb.id}`)
    console.log('\n✨ Done!')
    console.log('\n📌 Next Steps:')
    console.log('1. Share this database with your Notion integration')
    console.log('2. Copy the Database ID to .env')
    console.log('3. Run import-blog-posts.js to import 79 articles')
    console.log('4. Manually add Relation in Notion UI:')
    console.log('   - Product (Relation to Products Database)')

    return blogDb.id
  } catch (error) {
    console.error('❌ Error creating Blog Posts database:', error)
    throw error
  }
}

createBlogDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
