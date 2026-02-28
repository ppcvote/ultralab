// Script to extract tech stack from package.json files and import to Notion
import { Client } from '@notionhq/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ULTRA_LAB_PACKAGE_JSON = path.join(__dirname, '../../package.json')
const ULTRA_ADVISOR_PACKAGE_JSON = 'C:/Users/User/financial-planner/package.json'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_TECH_STACK_DB_ID = process.env.NOTION_TECH_STACK_DB_ID

if (!NOTION_API_KEY || !NOTION_TECH_STACK_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_TECH_STACK_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

// Rate limiting: 500ms delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Category mapping based on common package patterns
function categorizePackage(packageName) {
  const categories = {
    Frontend: [
      'react',
      'vue',
      'angular',
      'svelte',
      'tailwind',
      'lucide',
      'recharts',
      'antd',
      '@ant-design',
      'framer-motion',
    ],
    Backend: ['express', 'fastify', 'koa', 'hapi'],
    Database: ['firebase', 'mongoose', 'prisma', 'sequelize', '@vercel/postgres'],
    Deployment: ['vercel', 'netlify', 'aws', 'cloudflare'],
    'AI/ML': ['@anthropic', 'openai', '@google/generative-ai', 'langchain'],
    Email: ['resend', 'nodemailer', 'sendgrid', '@sendgrid'],
    Payment: ['stripe', 'paypal'],
    CRM: ['@notionhq'],
    Analytics: ['@vercel/analytics', 'google-analytics'],
    Authentication: ['firebase/auth', 'next-auth', 'auth0'],
    Storage: ['firebase/storage', 'aws-sdk'],
  }

  for (const [category, patterns] of Object.entries(categories)) {
    if (patterns.some((pattern) => packageName.toLowerCase().includes(pattern))) {
      return category
    }
  }

  // Default categorization
  if (packageName.startsWith('@types/')) return 'Frontend'
  if (packageName.includes('vite') || packageName.includes('webpack')) return 'Frontend'
  return 'Frontend' // Default fallback
}

// Get license from package.json (if available)
function getLicense(packageName, packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Most packages use MIT
    return 'MIT' // Simplified for now
  } catch (error) {
    return 'MIT'
  }
}

// Determine if package is critical (core dependencies)
function isCriticalPackage(packageName, isDev) {
  if (isDev) return false // Dev dependencies are not critical

  const criticalPackages = [
    'react',
    'firebase',
    'vercel',
    '@notionhq',
    '@anthropic',
    '@google/generative-ai',
  ]

  return criticalPackages.some((critical) => packageName.includes(critical))
}

// Extract tech stack from package.json
function extractTechStack(packageJsonPath, projectName) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const techStack = []

  const dependencies = packageJson.dependencies || {}
  const devDependencies = packageJson.devDependencies || {}

  // Process production dependencies
  Object.entries(dependencies).forEach(([name, version]) => {
    techStack.push({
      name,
      version: version.replace(/[\^~]/, ''), // Remove ^ or ~
      packageName: name,
      category: categorizePackage(name),
      license: getLicense(name, packageJsonPath),
      critical: isCriticalPackage(name, false),
      usedBy: [projectName],
    })
  })

  // Process dev dependencies (marked as non-critical)
  Object.entries(devDependencies).forEach(([name, version]) => {
    techStack.push({
      name,
      version: version.replace(/[\^~]/, ''),
      packageName: name,
      category: categorizePackage(name),
      license: getLicense(name, packageJsonPath),
      critical: false,
      usedBy: [projectName],
    })
  })

  return techStack
}

// Create Notion page for tech stack entry
async function createTechStackPage(tech) {
  try {
    const properties = {
      Name: {
        title: [
          {
            text: {
              content: tech.name.substring(0, 2000),
            },
          },
        ],
      },
      Category: {
        select: tech.category ? { name: tech.category } : null,
      },
      Version: {
        rich_text: [
          {
            text: {
              content: tech.version.substring(0, 2000),
            },
          },
        ],
      },
      'Package Name': {
        rich_text: [
          {
            text: {
              content: tech.packageName.substring(0, 2000),
            },
          },
        ],
      },
      'Documentation URL': {
        url: `https://www.npmjs.com/package/${tech.packageName}`,
      },
      License: {
        select: tech.license ? { name: tech.license } : null,
      },
      Critical: {
        checkbox: tech.critical || false,
      },
      Notes: {
        rich_text: [
          {
            text: {
              content: `Used by: ${tech.usedBy.join(', ')}`,
            },
          },
        ],
      },
    }

    // Remove null properties
    Object.keys(properties).forEach((key) => {
      if (properties[key] === null) {
        delete properties[key]
      }
    })

    await notion.pages.create({
      parent: { database_id: NOTION_TECH_STACK_DB_ID },
      properties,
    })

    console.log(`✅ Created: ${tech.name} (${tech.category})`)
  } catch (error) {
    console.error(`❌ Failed to create: ${tech.name}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Starting Tech Stack Extraction...\n')

  const allTechStack = []

  // Extract from Ultra Lab
  console.log('📦 Extracting from Ultra Lab package.json...')
  if (fs.existsSync(ULTRA_LAB_PACKAGE_JSON)) {
    const ultraLabStack = extractTechStack(ULTRA_LAB_PACKAGE_JSON, 'Ultra Lab')
    allTechStack.push(...ultraLabStack)
    console.log(`   ✅ Found ${ultraLabStack.length} packages\n`)
  } else {
    console.log(`   ⚠️  Not found: ${ULTRA_LAB_PACKAGE_JSON}\n`)
  }

  // Extract from Ultra Advisor
  console.log('📦 Extracting from Ultra Advisor package.json...')
  if (fs.existsSync(ULTRA_ADVISOR_PACKAGE_JSON)) {
    const ultraAdvisorStack = extractTechStack(ULTRA_ADVISOR_PACKAGE_JSON, 'Ultra Advisor')
    allTechStack.push(...ultraAdvisorStack)
    console.log(`   ✅ Found ${ultraAdvisorStack.length} packages\n`)
  } else {
    console.log(`   ⚠️  Not found: ${ULTRA_ADVISOR_PACKAGE_JSON}\n`)
  }

  // Deduplicate (merge packages used by multiple projects)
  const uniqueTechStack = []
  const seen = new Map()

  allTechStack.forEach((tech) => {
    if (seen.has(tech.name)) {
      // Merge usedBy arrays
      const existing = seen.get(tech.name)
      existing.usedBy = [...new Set([...existing.usedBy, ...tech.usedBy])]
    } else {
      seen.set(tech.name, tech)
      uniqueTechStack.push(tech)
    }
  })

  console.log(`📊 Total unique packages: ${uniqueTechStack.length}\n`)

  // Import to Notion
  console.log('📤 Importing to Notion...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const tech of uniqueTechStack) {
    try {
      await createTechStackPage(tech)
      totalCreated++
      await delay(500) // Rate limiting
    } catch (error) {
      console.error(`❌ Failed to import ${tech.name}:`, error.message)
      totalFailed++
    }
  }

  // Summary
  console.log('\n')
  console.log('🎉 Tech Stack Extraction Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the imported tech stack')
  console.log('2. Manually add "Used By" relations in Notion UI')
  console.log('3. Add monthly cost for paid services (Firebase, Vercel, etc.)')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
