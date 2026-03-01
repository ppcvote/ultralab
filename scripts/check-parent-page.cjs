require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

async function checkPage() {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${PARENT_PAGE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    })

    const data = await response.json()

    if (data.object === 'error') {
      console.log('❌ Error:', data.message)
      return
    }

    console.log('📄 Page Title:', data.properties?.title?.title?.[0]?.plain_text || 'Untitled')
    console.log('🔗 Page URL:', data.url)
    console.log('📅 Created:', data.created_time)
    console.log('🔄 Last Edited:', data.last_edited_time)
    console.log('\n✅ Page exists! You can view it at:', data.url)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkPage()
