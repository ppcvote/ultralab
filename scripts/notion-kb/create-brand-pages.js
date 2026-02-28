// Script to create 5 Brand Guidelines pages in Notion
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_BRAND_DB_ID = process.env.NOTION_BRAND_GUIDELINES_DB_ID

if (!NOTION_API_KEY || !NOTION_BRAND_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_BRAND_GUIDELINES_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Brand data from CLAUDE.md and MEMORY.md
const brands = [
  {
    name: 'Ultra Lab',
    primaryColor: '#8A5CFF → #CE4DFF (極致紫漸層)',
    secondaryColor: '#4DA3FF → #2E6BFF (輔助藍)',
    backgroundColor: '#0A0515 (深紫黑)',
    typographyHeadings: 'Outfit (sans-serif)',
    typographyBody: 'Outfit (body) + JetBrains Mono (code/data)',
    themeType: 'Dark',
    designSpirit: '實驗室 × 工坊美學。暗色戰情室風格，深色背景 + 網格 + 發光效果。技術感但有溫度，展示技術實力但語氣是「戰友」而非「專家俯視」。',
    status: 'Active',
  },
  {
    name: 'Ultra Advisor',
    primaryColor: '#2E6BFF (Professional Blue)',
    secondaryColor: '#FF3A3A (Red Accent)',
    backgroundColor: '#0A0A1A (深藍黑)',
    typographyHeadings: 'Outfit / Inter (sans-serif)',
    typographyBody: 'Inter / system-ui',
    themeType: 'Dark',
    designSpirit: '專業財務顧問工具。深色主題搭配專業藍色，紅色用於警示和強調（如風險提示）。數據視覺化優先（Recharts + Ant Design），提供信任感和專業形象。',
    status: 'Active',
  },
  {
    name: 'Mind Threads',
    primaryColor: '#8A5CFF (Purple gradient)',
    secondaryColor: '#CE4DFF (Bright Purple)',
    backgroundColor: '#0A0515 (深紫黑)',
    typographyHeadings: 'Outfit',
    typographyBody: 'Outfit',
    themeType: 'Dark',
    designSpirit: 'Threads 自動化 SaaS。承襲 Ultra Lab 的紫色系，但更鮮豔明亮。強調自動化的「心智延伸」概念，讓 AI 成為你的思考夥伴。',
    status: 'Active',
  },
  {
    name: 'UltraProbe',
    primaryColor: '#4DA3FF → #2E6BFF (Blue-Purple)',
    secondaryColor: '#FF6A6A (Warning Red)',
    backgroundColor: '#0A0515 (深紫黑)',
    typographyHeadings: 'Outfit',
    typographyBody: 'Outfit + JetBrains Mono (security reports)',
    themeType: 'Dark',
    designSpirit: 'AI 安全掃描工具。藍紫色系（承襲 Ultra Lab 但偏藍）強調「安全」和「信任」。紅色用於漏洞警示。技術文檔風格，JetBrains Mono 用於 security reports。',
    status: 'Active',
  },
  {
    name: 'MinYi Personal Brand',
    primaryColor: '#1E40AF (Professional Blue)',
    secondaryColor: '#F59E0B (Gold/Amber)',
    backgroundColor: '#FFFFFF (White) + #F8FAFC (Light Gray)',
    typographyHeadings: 'Outfit',
    typographyBody: 'Outfit / Inter',
    themeType: 'Light',
    designSpirit: 'MDRT 財務顧問個人品牌。淺色主題，專業藍色搭配金色強調（象徵財富和信任）。溫暖、親切、專業形象，與 Ultra Lab 暗色主題形成對比，凸顯個人品牌的溫度。',
    status: 'Active',
  },
]

async function createBrandPage(brand) {
  try {
    const properties = {
      'Brand Name': {
        title: [
          {
            text: {
              content: brand.name,
            },
          },
        ],
      },
      'Primary Color': {
        rich_text: [
          {
            text: {
              content: brand.primaryColor,
            },
          },
        ],
      },
      'Secondary Color': {
        rich_text: [
          {
            text: {
              content: brand.secondaryColor,
            },
          },
        ],
      },
      'Background Color': {
        rich_text: [
          {
            text: {
              content: brand.backgroundColor,
            },
          },
        ],
      },
      'Typography (Headings)': {
        rich_text: [
          {
            text: {
              content: brand.typographyHeadings,
            },
          },
        ],
      },
      'Typography (Body)': {
        rich_text: [
          {
            text: {
              content: brand.typographyBody,
            },
          },
        ],
      },
      'Theme Type': {
        select: { name: brand.themeType },
      },
      'Design Spirit': {
        rich_text: [
          {
            text: {
              content: brand.designSpirit,
            },
          },
        ],
      },
      Status: {
        select: { name: brand.status },
      },
    }

    await notion.pages.create({
      parent: { database_id: NOTION_BRAND_DB_ID },
      properties,
      icon: {
        type: 'emoji',
        emoji: '🎨',
      },
    })

    console.log(`✅ Created: ${brand.name} (${brand.themeType} theme)`)
  } catch (error) {
    console.error(`❌ Failed to create: ${brand.name}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Creating 5 Brand Guidelines Pages...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const brand of brands) {
    try {
      await createBrandPage(brand)
      totalCreated++
      await delay(500)
    } catch (error) {
      console.error(`❌ Failed: ${brand.name}`)
      totalFailed++
    }
  }

  console.log('\n')
  console.log('🎉 Brand Guidelines Creation Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the 5 brand pages')
  console.log('2. Upload logo files and color palette images')
  console.log('3. Add Product relations in Notion UI')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
