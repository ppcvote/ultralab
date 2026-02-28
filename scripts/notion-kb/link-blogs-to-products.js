// Link blog posts to their corresponding products
import { Client } from '@notionhq/client'
import 'dotenv/config'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const BLOG_DB_ID = process.env.NOTION_BLOG_POSTS_DB_ID
const PRODUCTS_DB_ID = process.env.NOTION_PRODUCTS_DB_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  console.log('🔗 連結文章到產品...\n')

  // Step 1: Find products
  const products = await notion.databases.query({
    database_id: PRODUCTS_DB_ID,
  })

  const ultraLab = products.results.find((p) =>
    p.properties.Name?.title?.[0]?.plain_text?.includes('Ultra Lab')
  )
  const ultraAdvisor = products.results.find((p) =>
    p.properties.Name?.title?.[0]?.plain_text?.includes('Ultra Advisor')
  )

  console.log('找到產品：')
  console.log('  Ultra Lab:', ultraLab ? '✓' : '✗')
  console.log('  Ultra Advisor:', ultraAdvisor ? '✓' : '✗')

  if (!ultraLab || !ultraAdvisor) {
    console.log('\n❌ 找不到產品，請檢查 Products database')
    return
  }

  // Step 2: Get all blog posts
  const blogPosts = await notion.databases.query({
    database_id: BLOG_DB_ID,
    page_size: 100,
  })

  console.log(`\n📝 總共 ${blogPosts.results.length} 篇文章\n`)

  // Step 3: Update blog posts
  let ultraLabCount = 0
  let ultraAdvisorCount = 0
  let skipped = 0

  for (const post of blogPosts.results) {
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
      console.log(`⏭️  跳過: ${title} (無法判斷產品)`)
      skipped++
      continue
    }

    try {
      await notion.pages.update({
        page_id: post.id,
        properties: {
          'Related to 產品中心 | Products (Blog Posts)': {
            relation: [{ id: productId }],
          },
        },
      })
      console.log(`✅ ${title} → ${productName}`)
      await delay(300)
    } catch (error) {
      console.log(`❌ ${title}: ${error.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ 完成！')
  console.log(`   Ultra Lab: ${ultraLabCount} 篇`)
  console.log(`   Ultra Advisor: ${ultraAdvisorCount} 篇`)
  console.log(`   跳過: ${skipped} 篇`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('🎯 現在重新整理 Notion，文章會按產品分組了！')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err)
    process.exit(1)
  })
