// Deep scan entire Notion workspace
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

// All database IDs
const DATABASES = {
  inquiries: process.env.NOTION_INQUIRIES_DB_ID,
  probeLeads: process.env.NOTION_PROBE_LEADS_DB_ID,
  products: process.env.NOTION_PRODUCTS_DB_ID,
  blog: process.env.NOTION_BLOG_POSTS_DB_ID,
  techStack: process.env.NOTION_TECH_STACK_DB_ID,
  apiEndpoints: process.env.NOTION_API_ENDPOINTS_DB_ID,
  components: process.env.NOTION_COMPONENTS_DB_ID,
  brandGuidelines: process.env.NOTION_BRAND_GUIDELINES_DB_ID,
}

async function callNotionAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
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
    throw new Error(`API Error: ${data.message}`)
  }

  return data
}

async function analyzeDatabaseQuality(dbId, dbName) {
  const data = await callNotionAPI(`/databases/${dbId}/query`, 'POST', { page_size: 100 })

  const entries = data.results
  const properties = entries[0]?.properties || {}

  // Analyze completeness
  let emptyFields = 0
  let totalFields = 0

  entries.forEach((entry) => {
    Object.keys(entry.properties).forEach((propName) => {
      totalFields++
      const prop = entry.properties[propName]

      // Check if empty
      if (prop.type === 'title' && prop.title.length === 0) emptyFields++
      if (prop.type === 'rich_text' && prop.rich_text.length === 0) emptyFields++
      if (prop.type === 'select' && !prop.select) emptyFields++
      if (prop.type === 'multi_select' && prop.multi_select.length === 0) emptyFields++
      if (prop.type === 'relation' && prop.relation.length === 0) emptyFields++
      if (prop.type === 'url' && !prop.url) emptyFields++
    })
  })

  const completeness = totalFields > 0 ? ((totalFields - emptyFields) / totalFields) * 100 : 0

  return {
    name: dbName,
    entries: entries.length,
    completeness: completeness.toFixed(1),
    emptyFields,
    totalFields,
    properties: Object.keys(properties),
  }
}

async function analyzePageQuality(pageId, pageName) {
  const blocks = await callNotionAPI(`/blocks/${pageId}/children`)

  const blockTypes = {}
  blocks.results.forEach((block) => {
    blockTypes[block.type] = (blockTypes[block.type] || 0) + 1
  })

  return {
    name: pageName,
    totalBlocks: blocks.results.length,
    blockTypes,
    hasContent: blocks.results.length > 0,
  }
}

async function main() {
  console.log('🔍 深度掃描 Notion Workspace...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. DATABASES ANALYSIS
  console.log('📊 DATABASE 品質分析\n')

  const dbAnalysis = {}

  for (const [key, dbId] of Object.entries(DATABASES)) {
    if (!dbId) {
      console.log(`   ⚠️  ${key}: 未設定`)
      continue
    }

    try {
      const analysis = await analyzeDatabaseQuality(dbId, key)
      dbAnalysis[key] = analysis

      console.log(`   ✅ ${analysis.name}`)
      console.log(`      Entries: ${analysis.entries}`)
      console.log(`      Completeness: ${analysis.completeness}%`)
      console.log(`      Properties: ${analysis.properties.length}`)
      console.log(`      Empty Fields: ${analysis.emptyFields}/${analysis.totalFields}`)
      console.log('')
    } catch (error) {
      console.log(`   ❌ ${key}: ${error.message}`)
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 2. PAGES ANALYSIS
  console.log('📄 KEY PAGES 分析\n')

  // Analyze Products pages
  const productsData = await callNotionAPI(`/databases/${DATABASES.products}/query`, 'POST', {
    page_size: 100,
  })

  for (const product of productsData.results) {
    const name = product.properties.Name?.title?.[0]?.plain_text || 'Unnamed'
    try {
      const pageAnalysis = await analyzePageQuality(product.id, name)
      console.log(`   📦 ${pageAnalysis.name}`)
      console.log(`      Blocks: ${pageAnalysis.totalBlocks}`)
      console.log(`      Types: ${Object.keys(pageAnalysis.blockTypes).join(', ')}`)
      console.log('')
    } catch (error) {
      console.log(`   ❌ ${name}: ${error.message}`)
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 3. OVERALL STATISTICS
  console.log('📈 整體統計\n')

  const totalEntries = Object.values(dbAnalysis).reduce((sum, db) => sum + db.entries, 0)
  const avgCompleteness =
    Object.values(dbAnalysis).reduce((sum, db) => sum + parseFloat(db.completeness), 0) /
    Object.keys(dbAnalysis).length

  console.log(`   Total Database Entries: ${totalEntries}`)
  console.log(`   Average Completeness: ${avgCompleteness.toFixed(1)}%`)
  console.log(`   Total Databases: ${Object.keys(DATABASES).length}`)
  console.log('')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 4. RECOMMENDATIONS
  console.log('💡 優化建議（宇宙最頂尖水平）\n')

  console.log('   🎨 視覺一致性：')
  console.log('      - 統一 emoji 使用規範（每個 database 一個代表 emoji）')
  console.log('      - 統一 color coding（callout 顏色、heading 顏色）')
  console.log('      - 雙語命名格式一致化（中文 | English）')
  console.log('')

  console.log('   📊 內容完整性：')
  Object.entries(dbAnalysis).forEach(([key, analysis]) => {
    if (parseFloat(analysis.completeness) < 80) {
      console.log(`      - ${analysis.name}: 完整度僅 ${analysis.completeness}%，需填充空白欄位`)
    }
  })
  console.log('')

  console.log('   🔗 關聯性優化：')
  console.log('      - 自動建立 Products ↔ Blog Posts 關聯')
  console.log('      - 自動建立 Products ↔ Tech Stack 關聯')
  console.log('      - 自動建立 Products ↔ API Endpoints 關聯')
  console.log('')

  console.log('   ✨ 進階功能：')
  console.log('      - 建立 Master Dashboard（統計 + 快速連結）')
  console.log('      - 創建 Entry Templates（標準化新增流程）')
  console.log('      - 設定 Database Views（依狀態、分類、優先級）')
  console.log('      - Icon & Cover 優化（統一品牌視覺）')
  console.log('')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('🚀 我能立即執行的自動化優化：\n')
  console.log('   1. 批量填充缺失的 Product 資訊（從 CLAUDE.md 提取）')
  console.log('   2. 自動建立所有 database relations（Products ↔ 其他）')
  console.log('   3. 統一所有 emoji 和 icon（品牌一致性）')
  console.log('   4. 創建 Master Dashboard（含統計和快速連結）')
  console.log('   5. 優化 Brand Guidelines（加入設計規範細節）')
  console.log('   6. 設定所有 database 的預設 views 和 filters')
  console.log('')

  console.log('要我執行哪些優化？（可全選）\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
