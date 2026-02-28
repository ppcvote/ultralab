// Script to import blog posts from Ultra Lab (.md) and Ultra Advisor (.ts) to Notion
import { Client } from '@notionhq/client'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ULTRA_LAB_BLOG_PATH = path.join(__dirname, '../../content/blog')
const ULTRA_ADVISOR_BLOG_PATH = 'C:/Users/User/financial-planner/src/data/blog/articles'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_BLOG_DB_ID = process.env.NOTION_BLOG_POSTS_DB_ID

if (!NOTION_API_KEY || !NOTION_BLOG_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_BLOG_POSTS_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

// Rate limiting: 500ms delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Parse Ultra Lab .md files (frontmatter)
function parseUltraLabArticle(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: markdown } = matter(content)

  return {
    title: data.title || path.basename(filePath, '.md'),
    slug: path.basename(filePath, '.md'),
    excerpt: data.description || '',
    category: 'Automation', // Default for Ultra Lab
    tags: data.tags || [],
    publishDate: data.date ? new Date(data.date).toISOString().split('T')[0] : null,
    content: markdown,
    wordCount: markdown.length,
    readTime: Math.ceil(markdown.length / 400), // 400 chars/min
    source: 'Ultra Lab',
    sourceFilePath: filePath,
    status: 'Published',
  }
}

// Parse Ultra Advisor .ts files (TypeScript module exports)
// Using regex parsing instead of dynamic import to avoid dependency issues
function parseUltraAdvisorArticle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Extract article object using regex
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/)
    const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/)
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/)
    const excerptMatch = content.match(/excerpt:\s*['"]([^'"]+)['"]/)
    const categoryMatch = content.match(/category:\s*['"]([^'"]+)['"]/)
    const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/)
    const readTimeMatch = content.match(/readTime:\s*(\d+)/)
    const publishDateMatch = content.match(/publishDate:\s*['"]([^'"]+)['"]/)
    const contentMatch = content.match(/content:\s*`([\s\S]+?)`\s*,?\s*}/)

    // Parse tags array
    let tags = []
    if (tagsMatch) {
      tags = tagsMatch[1]
        .split(',')
        .map((t) => t.trim().replace(/['"]/g, ''))
        .filter(Boolean)
    }

    // Extract content (HTML)
    const articleContent = contentMatch ? contentMatch[1].trim() : ''

    // Map category to simplified name
    const categoryMap = {
      mortgage: 'Mortgage',
      retirement: 'Retirement',
      tax: 'Tax',
      insurance: 'Insurance',
      investment: 'Financial Planning',
    }

    const category = categoryMatch ? categoryMatch[1] : 'general'

    return {
      title: titleMatch ? titleMatch[1] : 'Untitled',
      slug: slugMatch ? slugMatch[1] : path.basename(filePath, '.ts'),
      excerpt: excerptMatch ? excerptMatch[1] : '',
      category: categoryMap[category] || 'Financial Planning',
      tags: tags,
      publishDate: publishDateMatch ? publishDateMatch[1] : null,
      content: articleContent,
      wordCount: articleContent.length,
      readTime: readTimeMatch ? parseInt(readTimeMatch[1]) : Math.ceil(articleContent.length / 400),
      source: 'Ultra Advisor',
      sourceFilePath: filePath,
      status: 'Published',
    }
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message)
    return null
  }
}

// Create Notion page for blog post
async function createBlogPage(article) {
  try {
    const properties = {
      Title: {
        title: [
          {
            text: {
              content: article.title.substring(0, 2000), // Notion limit
            },
          },
        ],
      },
      Slug: {
        rich_text: [
          {
            text: {
              content: article.slug.substring(0, 2000),
            },
          },
        ],
      },
      Category: {
        select: article.category ? { name: article.category } : null,
      },
      Tags: {
        multi_select: article.tags.slice(0, 10).map((tag) => ({ name: tag })), // Limit 10 tags
      },
      Excerpt: {
        rich_text: [
          {
            text: {
              content: article.excerpt.substring(0, 2000),
            },
          },
        ],
      },
      'Read Time': {
        number: article.readTime || null,
      },
      'Word Count': {
        number: article.wordCount || null,
      },
      'Publish Date': article.publishDate
        ? {
            date: {
              start: article.publishDate,
            },
          }
        : null,
      Status: {
        select: { name: article.status },
      },
      'Source File Path': {
        rich_text: [
          {
            text: {
              content: article.sourceFilePath.substring(0, 2000),
            },
          },
        ],
      },
    }

    // Remove null properties (Notion API doesn't accept null)
    Object.keys(properties).forEach((key) => {
      if (properties[key] === null) {
        delete properties[key]
      }
    })

    await notion.pages.create({
      parent: { database_id: NOTION_BLOG_DB_ID },
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
                  content: `Source: ${article.source}`,
                },
              },
            ],
          },
        },
      ],
    })

    console.log(`✅ Created: ${article.title} (${article.source})`)
  } catch (error) {
    console.error(`❌ Failed to create: ${article.title}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Starting Blog Posts Import...\n')

  let totalCreated = 0
  let totalFailed = 0

  // Import Ultra Lab articles (.md)
  console.log('📖 Importing Ultra Lab articles (.md)...')
  if (fs.existsSync(ULTRA_LAB_BLOG_PATH)) {
    const mdFiles = fs
      .readdirSync(ULTRA_LAB_BLOG_PATH)
      .filter((file) => file.endsWith('.md'))

    console.log(`   Found ${mdFiles.length} markdown files\n`)

    for (const file of mdFiles) {
      const filePath = path.join(ULTRA_LAB_BLOG_PATH, file)
      try {
        const article = parseUltraLabArticle(filePath)
        await createBlogPage(article)
        totalCreated++
        await delay(500) // Rate limiting
      } catch (error) {
        console.error(`❌ Failed to process ${file}:`, error.message)
        totalFailed++
      }
    }
  } else {
    console.log(`⚠️  Ultra Lab blog path not found: ${ULTRA_LAB_BLOG_PATH}`)
  }

  console.log('\n')

  // Import Ultra Advisor articles (.ts)
  console.log('📖 Importing Ultra Advisor articles (.ts)...')
  if (fs.existsSync(ULTRA_ADVISOR_BLOG_PATH)) {
    const tsFiles = fs
      .readdirSync(ULTRA_ADVISOR_BLOG_PATH)
      .filter((file) => file.endsWith('.ts'))

    console.log(`   Found ${tsFiles.length} TypeScript files\n`)

    for (const file of tsFiles) {
      const filePath = path.join(ULTRA_ADVISOR_BLOG_PATH, file)
      try {
        const article = parseUltraAdvisorArticle(filePath)
        if (article) {
          await createBlogPage(article)
          totalCreated++
          await delay(500) // Rate limiting
        } else {
          totalFailed++
        }
      } catch (error) {
        console.error(`❌ Failed to process ${file}:`, error.message)
        totalFailed++
      }
    }
  } else {
    console.log(`⚠️  Ultra Advisor blog path not found: ${ULTRA_ADVISOR_BLOG_PATH}`)
  }

  // Summary
  console.log('\n')
  console.log('🎉 Blog Posts Import Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the imported pages')
  console.log('2. Manually add Product relations in Notion UI')
  console.log('3. Review and update any missing categories/tags')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
