// Script to extract React components from src/components/ folders and import to Notion
import { Client } from '@notionhq/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ULTRA_LAB_COMPONENTS_PATH = path.join(__dirname, '../../src/components')
const ULTRA_ADVISOR_COMPONENTS_PATH = 'C:/Users/User/financial-planner/src/components'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_COMPONENTS_DB_ID = process.env.NOTION_COMPONENTS_DB_ID

if (!NOTION_API_KEY || !NOTION_COMPONENTS_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_COMPONENTS_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

// Rate limiting: 500ms delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Categorize component based on name and content
function categorizeComponent(componentName, content) {
  const categories = {
    Layout: ['Navbar', 'Footer', 'Header', 'Sidebar', 'Layout', 'Container'],
    Form: ['Form', 'Input', 'Select', 'Checkbox', 'Radio', 'Upload'],
    Chart: ['Chart', 'Graph', 'Plot', 'Visualization'],
    Animation: ['Animation', 'Transition', 'Motion'],
    Auth: ['Login', 'Register', 'Auth', 'Profile'],
    Feature: ['Calculator', 'Tool', 'Widget', 'Dashboard'],
    Navigation: ['Nav', 'Menu', 'Breadcrumb', 'Tabs'],
    Display: ['Card', 'Table', 'List', 'Grid', 'Hero', 'Banner'],
  }

  for (const [category, patterns] of Object.entries(categories)) {
    if (patterns.some((pattern) => componentName.includes(pattern))) {
      return category
    }
  }

  // Analyze content for additional hints
  if (content.includes('useState') || content.includes('useForm')) return 'Form'
  if (content.includes('motion.') || content.includes('animate')) return 'Animation'
  if (content.includes('Chart') || content.includes('Recharts')) return 'Chart'

  return 'Display' // Default
}

// Determine complexity based on file size and patterns
function determineComplexity(content) {
  const lines = content.split('\n').length

  if (lines < 100) return 'Simple'
  if (lines < 300) return 'Medium'
  return 'Complex'
}

// Check if component is reusable (has props, no hardcoded data)
function isReusable(content) {
  // Simple heuristic: has props interface or parameters
  const hasProps = content.includes('interface') || content.includes('Props')
  const hasHardcoded = content.includes('hardcoded') || content.includes('TODO')

  return hasProps && !hasHardcoded
}

// Extract component info from file
function extractComponentInfo(filePath, projectName) {
  const componentName = path.basename(filePath, path.extname(filePath))
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  return {
    componentName,
    category: categorizeComponent(componentName, content),
    filePath,
    linesOfCode: lines.length,
    complexity: determineComplexity(content),
    reusable: isReusable(content),
    status: 'Active',
    product: projectName,
  }
}

// Recursively get all .tsx files
function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      getAllTsxFiles(filePath, fileList)
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Create Notion page for component
async function createComponentPage(component) {
  try {
    const properties = {
      'Component Name': {
        title: [
          {
            text: {
              content: component.componentName.substring(0, 2000),
            },
          },
        ],
      },
      Category: {
        select: component.category ? { name: component.category } : null,
      },
      'File Path': {
        rich_text: [
          {
            text: {
              content: component.filePath.substring(0, 2000),
            },
          },
        ],
      },
      'Lines of Code': {
        number: component.linesOfCode || null,
      },
      Complexity: {
        select: component.complexity ? { name: component.complexity } : null,
      },
      Reusable: {
        checkbox: component.reusable || false,
      },
      Status: {
        select: component.status ? { name: component.status } : null,
      },
    }

    // Remove null properties
    Object.keys(properties).forEach((key) => {
      if (properties[key] === null) {
        delete properties[key]
      }
    })

    await notion.pages.create({
      parent: { database_id: NOTION_COMPONENTS_DB_ID },
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
                  content: `Product: ${component.product}`,
                },
              },
            ],
          },
        },
      ],
    })

    console.log(
      `✅ Created: ${component.componentName} (${component.category}, ${component.linesOfCode} LOC)`
    )
  } catch (error) {
    console.error(`❌ Failed to create: ${component.componentName}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Starting Components Extraction...\n')

  const allComponents = []

  // Extract from Ultra Lab components/ folder
  console.log('🧩 Extracting from Ultra Lab components/ folder...')
  if (fs.existsSync(ULTRA_LAB_COMPONENTS_PATH)) {
    const componentFiles = getAllTsxFiles(ULTRA_LAB_COMPONENTS_PATH)

    console.log(`   Found ${componentFiles.length} component files\n`)

    componentFiles.forEach((filePath) => {
      const componentInfo = extractComponentInfo(filePath, 'Ultra Lab')
      allComponents.push(componentInfo)
    })
  } else {
    console.log(`   ⚠️  Not found: ${ULTRA_LAB_COMPONENTS_PATH}\n`)
  }

  // Extract from Ultra Advisor components/ folder
  console.log('🧩 Extracting from Ultra Advisor components/ folder...')
  if (fs.existsSync(ULTRA_ADVISOR_COMPONENTS_PATH)) {
    const componentFiles = getAllTsxFiles(ULTRA_ADVISOR_COMPONENTS_PATH)

    console.log(`   Found ${componentFiles.length} component files\n`)

    componentFiles.forEach((filePath) => {
      const componentInfo = extractComponentInfo(filePath, 'Ultra Advisor')
      allComponents.push(componentInfo)
    })
  } else {
    console.log(`   ⚠️  Not found: ${ULTRA_ADVISOR_COMPONENTS_PATH}\n`)
  }

  console.log(`📊 Total components found: ${allComponents.length}\n`)

  // Import to Notion
  console.log('📤 Importing to Notion...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const component of allComponents) {
    try {
      await createComponentPage(component)
      totalCreated++
      await delay(500) // Rate limiting
    } catch (error) {
      console.error(`❌ Failed to import ${component.componentName}:`, error.message)
      totalFailed++
    }
  }

  // Summary
  console.log('\n')
  console.log('🎉 Components Extraction Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the imported components')
  console.log('2. Manually add Product relations in Notion UI')
  console.log('3. Review complexity assessments and update if needed')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
