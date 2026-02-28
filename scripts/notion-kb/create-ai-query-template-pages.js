// Script to create AI Query Template pages in Notion
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_AI_QUERY_TEMPLATES_DB_ID = process.env.NOTION_AI_QUERY_TEMPLATES_DB_ID

if (!NOTION_API_KEY || !NOTION_AI_QUERY_TEMPLATES_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_AI_QUERY_TEMPLATES_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// AI Query Templates (bilingual, AI Agent-friendly)
const templates = [
  {
    name: '查找特定主題的所有 Blog 文章 | Find All Blog Posts About a Topic',
    queryType: 'Search',
    targetDatabase: 'Blog Posts',
    naturalLanguageQuery:
      '查找所有關於「Threads 自動化」的 blog 文章 | Find all blog posts about "Threads automation"',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Title',
            rich_text: { contains: 'Threads' },
          },
          {
            property: 'Status',
            select: { equals: 'Published' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '當用戶問「你們有哪些關於 Threads 的文章？」時使用此查詢 | Use when user asks "What articles do you have about Threads?"',
    useCase: 'Content Discovery',
  },
  {
    name: '列出某產品使用的所有技術棧 | List All Tech Stack for a Product',
    queryType: 'Relation',
    targetDatabase: 'Products',
    naturalLanguageQuery:
      '列出 Ultra Lab 使用的所有技術 | List all technologies used by Ultra Lab',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Name',
            title: { equals: 'Ultra Lab' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '新開發者問「Ultra Lab 用了哪些技術？」時，查詢 Products 並追蹤 Tech Stack relation | When new developer asks "What tech does Ultra Lab use?", query Products and follow Tech Stack relation',
    useCase: 'Developer Onboarding',
  },
  {
    name: '查找 Critical 級別的 ADR | Find Critical ADRs',
    queryType: 'Filter',
    targetDatabase: 'ADR',
    naturalLanguageQuery:
      '查找所有 Critical 級別的架構決策記錄 | Find all Critical-severity architecture decisions',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Severity',
            select: { equals: 'Critical' },
          },
          {
            property: 'Status',
            select: { equals: 'Accepted' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '新開發者必讀：Critical ADRs 是必須了解的技術決策 | New developers must-read: Critical ADRs are essential technical decisions',
    useCase: 'Developer Onboarding',
  },
  {
    name: '列出過去 30 天發布的 Blog 文章 | List Blog Posts Published in Last 30 Days',
    queryType: 'Filter',
    targetDatabase: 'Blog Posts',
    naturalLanguageQuery: '列出過去 30 天內發布的所有文章 | List all posts published in the last 30 days',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Publish Date',
            date: { past_month: {} },
          },
          {
            property: 'Status',
            select: { equals: 'Published' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '內容稽核：檢查最近發布的內容質量 | Content audit: check quality of recently published content',
    useCase: 'Content Discovery',
  },
  {
    name: '查找需要更新的 Blog 文章 | Find Blog Posts Needing Update',
    queryType: 'Filter',
    targetDatabase: 'Blog Posts',
    naturalLanguageQuery:
      '查找超過 12 個月未更新的文章 | Find articles not updated for more than 12 months',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Publish Date',
            date: { before: '2025-02-28' },
          },
          {
            property: 'Status',
            select: { equals: 'Published' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '內容維護：識別需要更新的陳舊內容 | Content maintenance: identify stale content needing updates',
    useCase: 'Content Discovery',
  },
  {
    name: '列出某產品的所有 API Endpoints | List All API Endpoints for a Product',
    queryType: 'Relation',
    targetDatabase: 'API Endpoints',
    naturalLanguageQuery:
      '列出 Ultra Lab 的所有 API endpoints | List all API endpoints for Ultra Lab',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Product',
            relation: { contains: 'PRODUCT_ID_PLACEHOLDER' },
          },
          {
            property: 'Status',
            select: { equals: 'Live' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      'API 文檔生成：自動產生某產品的 API reference | API documentation: auto-generate API reference for a product',
    useCase: 'Developer Onboarding',
  },
  {
    name: '查找公開的 API Endpoints | Find Public API Endpoints',
    queryType: 'Filter',
    targetDatabase: 'API Endpoints',
    naturalLanguageQuery:
      '查找所有對外公開的 API endpoints | Find all publicly exposed API endpoints',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Public API',
            checkbox: { equals: true },
          },
          {
            property: 'Status',
            select: { equals: 'Live' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '安全稽核：檢查所有公開 API 的認證和 rate limiting | Security audit: check authentication and rate limiting for all public APIs',
    useCase: 'Troubleshooting',
  },
  {
    name: '統計各產品的 Blog 文章數量 | Count Blog Posts per Product',
    queryType: 'Aggregate',
    targetDatabase: 'Blog Posts',
    naturalLanguageQuery:
      '統計每個產品有多少篇 blog 文章 | Count how many blog posts each product has',
    notionFilter: JSON.stringify(
      {
        group_by: 'Product',
        aggregations: [{ property: 'Title', function: 'count' }],
      },
      null,
      2
    ),
    exampleUsage:
      '內容策略分析：識別哪些產品需要更多內容 | Content strategy: identify which products need more content',
    useCase: 'Content Discovery',
  },
  {
    name: '查找可重用的 React Components | Find Reusable React Components',
    queryType: 'Filter',
    targetDatabase: 'Components',
    naturalLanguageQuery: '查找標記為「可重用」的 React components | Find React components marked as reusable',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Reusable',
            checkbox: { equals: true },
          },
          {
            property: 'Status',
            select: { equals: 'Active' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '重構建議：這些 components 可以提取到 shared library | Refactoring: these components can be extracted to a shared library',
    useCase: 'Tech Decision',
  },
  {
    name: '列出所有 Critical Dependencies | List All Critical Dependencies',
    queryType: 'Filter',
    targetDatabase: 'Tech Stack',
    naturalLanguageQuery:
      '列出所有標記為 Critical 的技術依賴 | List all tech dependencies marked as Critical',
    notionFilter: JSON.stringify(
      {
        property: 'Critical',
        checkbox: { equals: true },
      },
      null,
      2
    ),
    exampleUsage:
      '風險管理：監控 critical dependencies 的版本更新 | Risk management: monitor version updates for critical dependencies',
    useCase: 'Tech Decision',
  },
  {
    name: '查找特定 Email Template | Find Specific Email Template',
    queryType: 'Search',
    targetDatabase: 'Email Templates',
    naturalLanguageQuery:
      '查找「Threads 自動化」服務的「面議預算」Email 模板 | Find "Threads Automation" service "Discuss Budget" email template',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Service Type',
            select: { equals: 'Threads' },
          },
          {
            property: 'Budget Tier',
            select: { equals: 'Discuss' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '客戶溝通：快速找到正確的 email 回覆模板 | Customer communication: quickly find the right email response template',
    useCase: 'Content Discovery',
  },
  {
    name: '查找與某 ADR 相關的所有產品 | Find All Products Related to an ADR',
    queryType: 'Relation',
    targetDatabase: 'ADR',
    naturalLanguageQuery:
      '查找「Tailwind v4 CSS Layers Issue」ADR 影響了哪些產品 | Find which products are affected by "Tailwind v4 CSS Layers Issue" ADR',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Decision ID',
            rich_text: { equals: 'ADR-001' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '影響範圍分析：當修改某個 ADR 決策時，了解影響哪些產品 | Impact analysis: when changing an ADR decision, understand which products are affected',
    useCase: 'Tech Decision',
  },
  {
    name: '查找某品牌的設計規範 | Find Brand Guidelines for a Specific Brand',
    queryType: 'Search',
    targetDatabase: 'Brand Guidelines',
    naturalLanguageQuery: '查找 Ultra Lab 的品牌設計規範 | Find brand guidelines for Ultra Lab',
    notionFilter: JSON.stringify(
      {
        property: 'Brand Name',
        title: { equals: 'Ultra Lab' },
      },
      null,
      2
    ),
    exampleUsage:
      '設計一致性：確保新功能符合品牌視覺語言 | Design consistency: ensure new features follow brand visual language',
    useCase: 'Developer Onboarding',
  },
  {
    name: '列出所有 Dark 主題的產品 | List All Dark-Themed Products',
    queryType: 'Filter',
    targetDatabase: 'Brand Guidelines',
    naturalLanguageQuery: '列出所有使用 Dark 主題的產品 | List all products using Dark theme',
    notionFilter: JSON.stringify(
      {
        property: 'Theme Type',
        select: { equals: 'Dark' },
      },
      null,
      2
    ),
    exampleUsage:
      '品牌策略：Dark 主題產品共享相同的設計資產 | Brand strategy: Dark-themed products share the same design assets',
    useCase: 'Content Discovery',
  },
  {
    name: '查找需要 Auth 的所有 API | Find All APIs Requiring Authentication',
    queryType: 'Filter',
    targetDatabase: 'API Endpoints',
    naturalLanguageQuery:
      '查找所有需要認證的 API endpoints | Find all API endpoints that require authentication',
    notionFilter: JSON.stringify(
      {
        and: [
          {
            property: 'Auth Required',
            checkbox: { equals: true },
          },
          {
            property: 'Status',
            select: { equals: 'Live' },
          },
        ],
      },
      null,
      2
    ),
    exampleUsage:
      '安全稽核：檢查所有需要認證的 API 是否正確實作 auth middleware | Security audit: check if all auth-required APIs correctly implement auth middleware',
    useCase: 'Troubleshooting',
  },
]

async function createQueryTemplatePage(template) {
  try {
    const properties = {
      'Template Name': {
        title: [
          {
            text: {
              content: template.name,
            },
          },
        ],
      },
      'Query Type': {
        select: { name: template.queryType },
      },
      'Target Database': {
        select: { name: template.targetDatabase },
      },
      'Natural Language Query': {
        rich_text: [
          {
            text: {
              content: template.naturalLanguageQuery,
            },
          },
        ],
      },
      'Notion Filter': {
        rich_text: [
          {
            text: {
              content: template.notionFilter.substring(0, 2000),
            },
          },
        ],
      },
      'Example Usage': {
        rich_text: [
          {
            text: {
              content: template.exampleUsage,
            },
          },
        ],
      },
      'Use Case': {
        select: { name: template.useCase },
      },
    }

    await notion.pages.create({
      parent: { database_id: NOTION_AI_QUERY_TEMPLATES_DB_ID },
      properties,
      icon: {
        type: 'emoji',
        emoji:
          template.queryType === 'Search'
            ? '🔍'
            : template.queryType === 'Filter'
              ? '🎯'
              : template.queryType === 'Aggregate'
                ? '📊'
                : '🔗',
      },
    })

    console.log(`✅ Created: ${template.name.split('|')[0].trim()}`)
  } catch (error) {
    console.error(`❌ Failed to create: ${template.name.split('|')[0].trim()}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Creating AI Query Template Pages (Bilingual)...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const template of templates) {
    try {
      await createQueryTemplatePage(template)
      totalCreated++
      await delay(500)
    } catch (error) {
      console.error(`❌ Failed: ${template.name.split('|')[0].trim()}`)
      totalFailed++
    }
  }

  console.log('\n')
  console.log('🎉 AI Query Templates Creation Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📊 Summary by Query Type:')
  console.log(`   🔍 Search: ${templates.filter((t) => t.queryType === 'Search').length}`)
  console.log(`   🎯 Filter: ${templates.filter((t) => t.queryType === 'Filter').length}`)
  console.log(`   📊 Aggregate: ${templates.filter((t) => t.queryType === 'Aggregate').length}`)
  console.log(`   🔗 Relation: ${templates.filter((t) => t.queryType === 'Relation').length}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the AI Query Templates')
  console.log('2. Test each query template with actual Notion API calls')
  console.log('3. Update PRODUCT_ID_PLACEHOLDER with actual product IDs')
  console.log('4. Add more templates as use cases emerge')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
