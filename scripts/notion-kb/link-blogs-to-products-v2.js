// Link blog posts to products using REST API
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const BLOG_DB_ID = process.env.NOTION_BLOG_POSTS_DB_ID
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function main() {
  console.log('🔗 連結文章到產品...\n')

  // Step 1: Find products
  const productsData = await callNotionAPI(`/databases/${PRODUCTS_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  const ultraLab = productsData.results.find((p) =>
    p.properties.Name?.title?.[0]?.plain_text?.includes('Ultra Lab')
  )
  const ultraAdvisor = productsData.results.find((p) =>
    p.properties.Name?.title?.[0]?.plain_text?.includes('Ultra Advisor')
  )

  console.log('找到產品：')
  console.log('  Ultra Lab:', ultraLab ? '✓' : '✗', ultraLab?.id || '')
  console.log('  Ultra Advisor:', ultraAdvisor ? '✓' : '✗', ultraAdvisor?.id || '')

  if (!ultraLab || !ultraAdvisor) {
    console.log('\n❌ 找不到產品')
    return
  }

  // Step 2: Get all blog posts
  const blogData = await callNotionAPI(`/databases/${BLOG_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  console.log(`\n📝 總共 ${blogData.results.length} 篇文章\n`)

  // Step 3: Update blog posts
  let ultraLabCount = 0
  let ultraAdvisorCount = 0

  for (const post of blogData.results) {
    const sourcePath = post.properties['Source File Path']?.rich_text?.[0]?.plain_text || ''
    const title = post.properties.Title?.title?.[0]?.plain_text || '(no title)'

    let productId = null
    let productName = ''

    if (sourcePath.includes('UltraLab') || sourcePath.includes('content/blog')) {
      productId = ultraLab.id
      productName = 'Ultra Lab'
      ultraLabCount++
    } else if (sourcePath.includes('financial-planner')) {
      productId = ultraAdvisor.id
      productName = 'Ultra Advisor'
      ultraAdvisorCount++
    } else {
      continue
    }

    try {
      await callNotionAPI(`/pages/${post.id}`, 'PATCH', {
        properties: {
          'Related to 產品中心 | Products (Blog Posts)': {
            relation: [{ id: productId }],
          },
        },
      })
      console.log(`✅ ${title.substring(0, 50)} → ${productName}`)
      await delay(300)
    } catch (error) {
      console.log(`❌ ${title}: ${error.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ 完成！')
  console.log(`   Ultra Lab: ${ultraLabCount} 篇`)
  console.log(`   Ultra Advisor: ${ultraAdvisorCount} 篇`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('🎯 重新整理 Notion，文章會按產品分組！')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err.message)
    process.exit(1)
  })
