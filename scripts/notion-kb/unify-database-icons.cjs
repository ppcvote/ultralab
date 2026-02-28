// Unify all database icons with consistent emojis
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY

// All database IDs and their desired emojis
const DATABASES = {
  products: {
    id: process.env.NOTION_PRODUCTS_DB_ID,
    emoji: '📦',
    name: 'Products'
  },
  blog: {
    id: process.env.NOTION_BLOG_POSTS_DB_ID,
    emoji: '📝',
    name: 'Blog Posts'
  },
  techStack: {
    id: process.env.NOTION_TECH_STACK_DB_ID,
    emoji: '🔧',
    name: 'Tech Stack Registry'
  },
  apiEndpoints: {
    id: process.env.NOTION_API_ENDPOINTS_DB_ID,
    emoji: '🔌',
    name: 'API Endpoints'
  },
  components: {
    id: process.env.NOTION_COMPONENTS_DB_ID,
    emoji: '🧩',
    name: 'Component Library'
  },
  brandGuidelines: {
    id: process.env.NOTION_BRAND_GUIDELINES_DB_ID,
    emoji: '🎨',
    name: 'Brand Guidelines'
  },
  adr: {
    id: process.env.NOTION_ADR_DB_ID,
    emoji: '⚙️',
    name: 'Architecture Decisions'
  },
  emailTemplates: {
    id: process.env.NOTION_EMAIL_TEMPLATES_DB_ID,
    emoji: '📧',
    name: 'Email Templates'
  },
  inquiries: {
    id: process.env.NOTION_INQUIRIES_DB_ID,
    emoji: '📨',
    name: 'Ultra Lab - Inquiries'
  },
  probeLeads: {
    id: process.env.NOTION_PROBE_LEADS_DB_ID,
    emoji: '🔍',
    name: 'UltraProbe - Security Leads'
  },
}

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

async function updateDatabaseIcon(dbId, emoji, dbName) {
  if (!dbId) {
    console.log(`⚠️  ${dbName}: Database ID not found, skipping`)
    return
  }

  try {
    await callNotionAPI(`/databases/${dbId}`, 'PATCH', {
      icon: {
        type: 'emoji',
        emoji: emoji
      }
    })
    console.log(`✅ ${dbName}: Icon set to ${emoji}`)
  } catch (error) {
    console.error(`❌ ${dbName}: Failed to update icon -`, error.message)
  }
}

async function main() {
  console.log('🎨 Unifying database icons...\n')

  for (const [key, db] of Object.entries(DATABASES)) {
    await updateDatabaseIcon(db.id, db.emoji, db.name)
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('\n✨ All database icons updated!\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
