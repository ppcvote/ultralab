// Script to extract API endpoints from api/ folders and import to Notion
import { Client } from '@notionhq/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ULTRA_LAB_API_PATH = path.join(__dirname, '../../api')
const ULTRA_ADVISOR_API_PATH = 'C:/Users/User/financial-planner/api'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_API_ENDPOINTS_DB_ID = process.env.NOTION_API_ENDPOINTS_DB_ID

if (!NOTION_API_KEY || !NOTION_API_ENDPOINTS_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_API_ENDPOINTS_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

// Rate limiting: 500ms delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Extract API endpoint info from file
function extractEndpointInfo(filePath, projectName) {
  const fileName = path.basename(filePath, '.ts')
  const content = fs.readFileSync(filePath, 'utf-8')

  // Determine endpoint path
  let endpoint = `/api/${fileName}`

  // Determine HTTP method (from code analysis)
  let method = 'POST' // Default
  if (content.includes("req.method === 'GET'")) method = 'GET'
  if (content.includes("req.method === 'PUT'")) method = 'PUT'
  if (content.includes("req.method === 'DELETE'")) method = 'DELETE'
  if (content.includes("req.method === 'PATCH'")) method = 'PATCH'

  // Determine if auth required (look for auth checks in code)
  const authRequired = content.includes('verifyAdmin') || content.includes('checkAuth')

  // Determine if public API (has CORS headers)
  const publicAPI = content.includes('Access-Control-Allow-Origin')

  // Extract purpose from comments or function name
  let purpose = ''
  const commentMatch = content.match(/\/\/ (.+)/)
  if (commentMatch) {
    purpose = commentMatch[1]
  } else {
    // Generate purpose from filename
    const purposeMap = {
      notify: 'Send notification to admin about new inquiry',
      'probe-collect-email': 'Collect email from UltraProbe scan',
      'probe-scan-prompt': 'Scan AI prompt for security vulnerabilities',
      'probe-scan-url': 'Scan URL for security issues',
      'send-email': 'Send email to customers',
      'payuni-checkout': 'Create PayUni checkout session',
      'payuni-notify': 'Handle PayUni payment notification',
      'payuni-return': 'Handle PayUni payment return',
    }
    purpose = purposeMap[fileName] || `API endpoint: ${fileName}`
  }

  // Rate limit detection
  let rateLimit = ''
  if (content.includes('rateLimit')) {
    const rateLimitMatch = content.match(/rateLimit\((\d+)/)
    if (rateLimitMatch) {
      rateLimit = `${rateLimitMatch[1]} req/min`
    }
  }

  // Status determination
  let status = 'Live'
  if (content.includes('// TODO') || content.includes('// WIP')) {
    status = 'Development'
  }
  if (content.includes('// DEPRECATED')) {
    status = 'Deprecated'
  }

  return {
    endpoint,
    method,
    purpose,
    authRequired,
    rateLimit,
    sourceFile: filePath,
    publicAPI,
    status,
    product: projectName,
  }
}

// Create Notion page for API endpoint
async function createAPIEndpointPage(api) {
  try {
    const properties = {
      Endpoint: {
        title: [
          {
            text: {
              content: api.endpoint.substring(0, 2000),
            },
          },
        ],
      },
      Method: {
        select: api.method ? { name: api.method } : null,
      },
      Purpose: {
        rich_text: [
          {
            text: {
              content: api.purpose.substring(0, 2000),
            },
          },
        ],
      },
      'Auth Required': {
        checkbox: api.authRequired || false,
      },
      'Rate Limit': api.rateLimit
        ? {
            rich_text: [
              {
                text: {
                  content: api.rateLimit,
                },
              },
            ],
          }
        : { rich_text: [] },
      'Source File': {
        rich_text: [
          {
            text: {
              content: api.sourceFile.substring(0, 2000),
            },
          },
        ],
      },
      'Public API': {
        checkbox: api.publicAPI || false,
      },
      Status: {
        select: api.status ? { name: api.status } : null,
      },
    }

    // Remove null properties
    Object.keys(properties).forEach((key) => {
      if (properties[key] === null) {
        delete properties[key]
      }
    })

    await notion.pages.create({
      parent: { database_id: NOTION_API_ENDPOINTS_DB_ID },
      properties,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `Product: ${api.product}`,
                },
              },
            ],
          },
        },
      ],
    })

    console.log(`✅ Created: ${api.endpoint} [${api.method}] (${api.product})`)
  } catch (error) {
    console.error(`❌ Failed to create: ${api.endpoint}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Starting API Endpoints Extraction...\n')

  const allEndpoints = []

  // Extract from Ultra Lab api/ folder
  console.log('🔌 Extracting from Ultra Lab api/ folder...')
  if (fs.existsSync(ULTRA_LAB_API_PATH)) {
    const apiFiles = fs
      .readdirSync(ULTRA_LAB_API_PATH)
      .filter((file) => file.endsWith('.ts') && !file.startsWith('_')) // Skip _firebase.ts, _notion.ts

    console.log(`   Found ${apiFiles.length} API files\n`)

    apiFiles.forEach((file) => {
      const filePath = path.join(ULTRA_LAB_API_PATH, file)
      const endpointInfo = extractEndpointInfo(filePath, 'Ultra Lab')
      allEndpoints.push(endpointInfo)
    })
  } else {
    console.log(`   ⚠️  Not found: ${ULTRA_LAB_API_PATH}\n`)
  }

  // Extract from Ultra Advisor api/ folder
  console.log('🔌 Extracting from Ultra Advisor api/ folder...')
  if (fs.existsSync(ULTRA_ADVISOR_API_PATH)) {
    const apiFiles = fs
      .readdirSync(ULTRA_ADVISOR_API_PATH)
      .filter((file) => file.endsWith('.ts') && !file.startsWith('_'))

    console.log(`   Found ${apiFiles.length} API files\n`)

    apiFiles.forEach((file) => {
      const filePath = path.join(ULTRA_ADVISOR_API_PATH, file)
      const endpointInfo = extractEndpointInfo(filePath, 'Ultra Advisor')
      allEndpoints.push(endpointInfo)
    })
  } else {
    console.log(`   ⚠️  Not found: ${ULTRA_ADVISOR_API_PATH}\n`)
  }

  console.log(`📊 Total endpoints found: ${allEndpoints.length}\n`)

  // Import to Notion
  console.log('📤 Importing to Notion...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const api of allEndpoints) {
    try {
      await createAPIEndpointPage(api)
      totalCreated++
      await delay(500) // Rate limiting
    } catch (error) {
      console.error(`❌ Failed to import ${api.endpoint}:`, error.message)
      totalFailed++
    }
  }

  // Summary
  console.log('\n')
  console.log('🎉 API Endpoints Extraction Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the imported endpoints')
  console.log('2. Manually add Product relations in Notion UI')
  console.log('3. Update rate limits and auth requirements if needed')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
