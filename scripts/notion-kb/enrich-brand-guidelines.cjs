// Enrich Brand Guidelines Database
require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const BRAND_DB_ID = process.env.NOTION_BRAND_GUIDELINES_DB_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

const BRAND_GUIDELINES = {
  'Ultra Lab': {
    primaryColor: '#8A5CFF → #CE4DFF (極致紫漸層)',
    secondaryColor: '#4DA3FF → #2E6BFF (輔助藍)',
    backgroundColor: '#0A0515 (深紫黑)',
    typographyHeadings: 'Outfit (Headings)',
    typographyBody: 'Outfit (Body) + JetBrains Mono (Code/Data)',
    themeType: 'Dark',
    designSpirit: '暗色戰情室美學 — 實驗室 × 工坊，技術感但有溫度。展示實力而非俯視。深色背景 + 網格 + 發光效果。',
  },
  'Ultra Advisor': {
    primaryColor: '#2E6BFF (專業藍)',
    secondaryColor: '#FF3A3A (警示紅)',
    backgroundColor: '#FFFFFF (白底) / #F8FAFC (淺灰)',
    typographyHeadings: 'Noto Sans TC (思源黑體)',
    typographyBody: 'Noto Sans TC + Inter',
    themeType: 'Light',
    designSpirit: '專業財務平台美學 — 信任、清晰、數據驅動。藍色傳達專業與穩定，紅色用於警示與強調。',
  },
  'Mind Threads': {
    primaryColor: '#C46200 → #E8910C (琥珀棕漸層)',
    secondaryColor: '#FFCC80 (金色)',
    backgroundColor: '#0F0A05 (深棕黑) or #0A0515 (深色)',
    typographyHeadings: 'Outfit',
    typographyBody: 'Outfit + JetBrains Mono',
    themeType: 'Dark',
    designSpirit: '麥萃琥珀色系 — 溫暖、獨特、有機。區別於 Ultra Lab 的紫色，建立自己的品牌識別。',
  },
  UltraProbe: {
    primaryColor: '#4F46E5 (Indigo)',
    secondaryColor: '#06B6D4 (Cyan)',
    backgroundColor: '#0A0515 (深色)',
    typographyHeadings: 'Outfit',
    typographyBody: 'Outfit + JetBrains Mono',
    themeType: 'Dark',
    designSpirit: '安全掃描工具美學 — 專業、精準、科技感。Indigo 傳達信賴與技術專業。',
  },
  'MinYi Personal Brand': {
    primaryColor: '#1E40AF (深藍)',
    secondaryColor: '#3B82F6 (亮藍)',
    backgroundColor: '#FFFFFF (白底) / #F8FAFC (淺灰)',
    typographyHeadings: 'Noto Sans TC',
    typographyBody: 'Noto Sans TC + Inter',
    themeType: 'Light',
    designSpirit: 'MDRT 財務顧問個人品牌 — 專業、親和、值得信賴。淺色主題展現開放與透明。',
  },
}

async function enrichBrandGuidelines() {
  console.log('🎨 Enriching Brand Guidelines Database...\n')

  // Get all brands
  const brandsData = await callNotionAPI(`/databases/${BRAND_DB_ID}/query`, 'POST', {
    page_size: 100,
  })

  console.log(`Found ${brandsData.results.length} brand entries\n`)

  for (const brand of brandsData.results) {
    const brandName = brand.properties.Product?.title?.[0]?.plain_text || ''
    const brandInfo = BRAND_GUIDELINES[brandName]

    if (!brandInfo) {
      console.log(`⏭️  Skipping ${brandName} (no guideline info)`)
      continue
    }

    console.log(`🎨 Enriching: ${brandName}`)

    try {
      await callNotionAPI(`/pages/${brand.id}`, 'PATCH', {
        properties: {
          'Primary Color': {
            rich_text: [
              {
                text: {
                  content: brandInfo.primaryColor,
                },
              },
            ],
          },
          'Secondary Color': {
            rich_text: [
              {
                text: {
                  content: brandInfo.secondaryColor,
                },
              },
            ],
          },
          'Background Color': {
            rich_text: [
              {
                text: {
                  content: brandInfo.backgroundColor,
                },
              },
            ],
          },
          'Typography (Headings)': {
            rich_text: [
              {
                text: {
                  content: brandInfo.typographyHeadings,
                },
              },
            ],
          },
          'Typography (Body)': {
            rich_text: [
              {
                text: {
                  content: brandInfo.typographyBody,
                },
              },
            ],
          },
          'Theme Type': {
            select: {
              name: brandInfo.themeType,
            },
          },
          'Design Spirit': {
            rich_text: [
              {
                text: {
                  content: brandInfo.designSpirit,
                },
              },
            ],
          },
        },
      })

      console.log(`   ✅ Updated`)
      await delay(500)
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Brand Guidelines enriched!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

enrichBrandGuidelines()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
