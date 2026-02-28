// Script to create Architecture Decision Records (ADR) in Notion
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_ADR_DB_ID = process.env.NOTION_ADR_DB_ID

if (!NOTION_API_KEY || !NOTION_ADR_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_ADR_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ADRs from MEMORY.md and development experience
const adrs = [
  {
    id: 'ADR-001',
    title: 'Tailwind v4 CSS Layers Issue',
    date: '2026-02-05',
    status: 'Accepted',
    context: 'Tailwind v4 將所有 utilities (mx-auto, px-*, etc.) 放在 @layer utilities 內。當在 CSS 中放置 unlayered CSS（如 * { margin: 0 }）時，unlayered CSS 的優先級高於任何 @layer 內容，導致所有 Tailwind margin/padding utilities 被覆蓋。',
    decision: '禁止在 Tailwind v4 專案中使用 unlayered global resets。所有自定義 CSS 必須放在 @layer base 或 @layer components 內。Tailwind v4 preflight 已包含必要的 resets。',
    consequences: '✅ 所有 Tailwind utilities 正常運作\n✅ 避免神秘的 margin/padding 失效問題\n❌ 需要團隊理解 CSS layers 優先級',
    alternatives: '1. 降級到 Tailwind v3（放棄 v4 新功能）\n2. 使用 !important 覆蓋（不推薦，破壞可維護性）',
    severity: 'Critical',
  },
  {
    id: 'ADR-002',
    title: 'Vercel Serverless + Firebase Admin tsconfig 分離',
    date: '2026-02-08',
    status: 'Accepted',
    context: 'Root tsconfig.json 使用 moduleResolution: "bundler"（Vite 專用）。但 Vercel serverless functions 需要 moduleResolution: "node" + module: "CommonJS"，否則 firebase-admin 無法正確 import。',
    decision: '建立 api/tsconfig.json 來覆蓋 root tsconfig 設定。API functions 使用 Node.js 模式，前端使用 Bundler 模式。',
    consequences: '✅ Firebase Admin 在 Vercel 正常運作\n✅ 前端和後端可使用各自最佳設定\n❌ 需要維護兩個 tsconfig 檔案',
    alternatives: '1. 統一使用 "node" resolution（前端失去 Vite 優化）\n2. 不使用 TypeScript（失去型別安全）',
    severity: 'Critical',
  },
  {
    id: 'ADR-003',
    title: 'Fire-and-Forget Notion Sync Pattern',
    date: '2026-02-09',
    status: 'Accepted',
    context: 'Contact Form 和 UltraProbe 需要同步到 Notion，但 Notion API 可能失敗或緩慢。不能因為 Notion 失敗就讓用戶提交失敗。',
    decision: '實作 fire-and-forget pattern：Firestore 寫入成功後，並行執行 Telegram + Email + Notion。Notion 失敗不阻擋主流程，只記錄 error log。',
    consequences: '✅ 用戶體驗不受 Notion API 影響\n✅ Firestore 永遠是 source of truth\n❌ Notion 資料可能不完整（需要 retry 機制）',
    alternatives: '1. 同步等待 Notion（用戶體驗差）\n2. Background job queue（增加複雜度）',
    severity: 'High',
  },
  {
    id: 'ADR-004',
    title: 'printf vs echo for Environment Variables',
    date: '2026-02-09',
    status: 'Accepted',
    context: '使用 echo 將 env vars pipe 到 vercel env add 時，echo 會自動加上 trailing newline。這導致 FIREBASE_PROJECT_ID 被設為 "ultra-lab-tw\\n"，造成 gRPC metadata error。',
    decision: '永遠使用 printf（不加 newline）而非 echo 來設定 env vars。範例：printf "value" | vercel env add KEY',
    consequences: '✅ 環境變數正確設定\n✅ 避免神秘的 Firebase Admin 錯誤\n❌ 團隊需要記住用 printf',
    alternatives: '1. 手動在 Vercel Dashboard 設定（無法自動化）\n2. 使用 --value flag（某些 CLI 不支援）',
    severity: 'High',
  },
  {
    id: 'ADR-005',
    title: 'Multi-page SPA without React Router',
    date: '2026-02-01',
    status: 'Accepted',
    context: 'Ultra Lab 需要多個獨立頁面（/probe, /minyi），但不想引入 React Router 增加 bundle size。每個頁面的導航模式不同（landing page vs tool page）。',
    decision: '使用多個獨立的 HTML entry points + Vite multi-page config。每個頁面有獨立的 bundle，透過 <a href> 導航。',
    consequences: '✅ 更小的 bundle size（每頁只載入需要的 code）\n✅ SEO 友善（真實的 HTML pages）\n❌ 頁面間導航需要 full reload（可接受）',
    alternatives: '1. React Router（增加 ~20KB bundle）\n2. 單一 SPA 用 conditional rendering（所有 code 一次載入）',
    severity: 'Medium',
  },
  {
    id: 'ADR-006',
    title: 'Hybrid Revenue Model: Services → SaaS',
    date: '2026-02-01',
    status: 'Accepted',
    context: '純接案現金流好但不可擴展，純 SaaS 前期無收入風險高。Ultra Lab 需要平衡現金流和長期成長。',
    decision: '混合模式：先接案養品牌和現金流（IG Reel, Threads 自動化），同時將重複性高的交付物產品化為 SaaS（Mind Threads）。接案收入補貼 SaaS 開發成本。',
    consequences: '✅ 短期有現金流\n✅ 長期建立可擴展產品\n✅ 客戶案例成為 SaaS 行銷素材\n❌ 資源分散，兩邊都要兼顧',
    alternatives: '1. 純接案（無長期價值）\n2. 純 SaaS（前期燒錢）',
    severity: 'Critical',
  },
  {
    id: 'ADR-007',
    title: 'Firestore as Single Source of Truth',
    date: '2026-02-09',
    status: 'Accepted',
    context: '資料同步到多個平台（Firestore, Notion, Telegram, Email）時，需要明確定義哪個是 source of truth。',
    decision: 'Firestore 永遠是 source of truth。Notion/Telegram/Email 都是「副本」或「通知」。所有資料修改必須先寫 Firestore，再同步到其他平台。',
    consequences: '✅ 資料一致性有保證\n✅ 其他平台失敗不影響主資料\n✅ 可以隨時重建 Notion 資料\n❌ Notion 編輯不會自動同步回 Firestore',
    alternatives: '1. Notion 為 source of truth（webhook 不穩定）\n2. 雙向同步（複雜度爆炸）',
    severity: 'Critical',
  },
  {
    id: 'ADR-008',
    title: 'Gemini 2.5 Flash 作為主要 AI 模型',
    date: '2026-02-10',
    status: 'Accepted',
    context: 'UltraProbe 需要快速、便宜的 AI 模型來掃描 prompt 和 URL。Claude API 每次 $0.003-0.015，Gemini 2.5 Flash 免費（有 quota）或 $0.00001875/1K tokens。',
    decision: '使用 Gemini 2.5 Flash 作為主要 AI 模型。Claude 保留給需要更高品質的場景（如長文章生成）。',
    consequences: '✅ 成本降低 100-1000 倍\n✅ 速度更快（Flash 針對 latency 優化）\n❌ 品質略低於 Claude（可接受）\n❌ 依賴 Google API quota',
    alternatives: '1. Claude Haiku（更貴但品質好）\n2. OpenAI GPT-4o-mini（中等價格）',
    severity: 'High',
  },
  {
    id: 'ADR-009',
    title: 'Vite Scaffolding 不適用於非空目錄（Windows）',
    date: '2026-02-01',
    status: 'Accepted',
    context: 'Windows 上使用 npm create vite@latest 無法在非空目錄執行，導致專案初始化失敗。',
    decision: '改為手動建立檔案結構：package.json, vite.config.ts, tsconfig.json, index.html, src/。使用已驗證的設定檔範本，避免 scaffolding 工具的限制。',
    consequences: '✅ 可在任何目錄初始化專案\n✅ 完全控制設定檔內容\n❌ 需要維護設定檔範本\n❌ 新手可能覺得複雜',
    alternatives: '1. 清空目錄後 scaffold（可能遺失 .git）\n2. 使用其他 scaffolding 工具',
    severity: 'Low',
  },
  {
    id: 'ADR-010',
    title: 'Windows Bash Path 必須用正斜線',
    date: '2026-02-09',
    status: 'Accepted',
    context: 'Git Bash on Windows 處理路徑時，c:\\Users\\User\\path 會被錯誤解析為相對路徑，導致 Vercel CLI 找不到 git root，上傳 0 個檔案。',
    decision: '所有 Bash 指令中的路徑必須使用正斜線：/c/Users/User/path。避免使用反斜線。',
    consequences: '✅ Vercel CLI 正常運作\n✅ 避免路徑解析錯誤\n❌ Windows 用戶需要記住轉換',
    alternatives: '1. 使用 WSL（增加環境複雜度）\n2. 使用 PowerShell（某些工具不支援）',
    severity: 'Medium',
  },
]

async function createADRPage(adr) {
  try {
    const properties = {
      Title: {
        title: [
          {
            text: {
              content: adr.title,
            },
          },
        ],
      },
      'Decision ID': {
        rich_text: [
          {
            text: {
              content: adr.id,
            },
          },
        ],
      },
      Date: {
        date: {
          start: adr.date,
        },
      },
      Status: {
        select: { name: adr.status },
      },
      Context: {
        rich_text: [
          {
            text: {
              content: adr.context.substring(0, 2000),
            },
          },
        ],
      },
      Decision: {
        rich_text: [
          {
            text: {
              content: adr.decision.substring(0, 2000),
            },
          },
        ],
      },
      Consequences: {
        rich_text: [
          {
            text: {
              content: adr.consequences.substring(0, 2000),
            },
          },
        ],
      },
      Alternatives: {
        rich_text: [
          {
            text: {
              content: adr.alternatives.substring(0, 2000),
            },
          },
        ],
      },
      Severity: {
        select: { name: adr.severity },
      },
    }

    await notion.pages.create({
      parent: { database_id: NOTION_ADR_DB_ID },
      properties,
      icon: {
        type: 'emoji',
        emoji: adr.severity === 'Critical' ? '🔴' : adr.severity === 'High' ? '🟠' : '🟡',
      },
    })

    console.log(`✅ Created: ${adr.id} - ${adr.title} (${adr.severity})`)
  } catch (error) {
    console.error(`❌ Failed to create: ${adr.id}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Creating Architecture Decision Records (ADR)...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const adr of adrs) {
    try {
      await createADRPage(adr)
      totalCreated++
      await delay(500)
    } catch (error) {
      console.error(`❌ Failed: ${adr.id}`)
      totalFailed++
    }
  }

  console.log('\n')
  console.log('🎉 ADR Creation Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📊 Summary by Severity:')
  console.log(`   🔴 Critical: ${adrs.filter((a) => a.severity === 'Critical').length}`)
  console.log(`   🟠 High: ${adrs.filter((a) => a.severity === 'High').length}`)
  console.log(`   🟡 Medium: ${adrs.filter((a) => a.severity === 'Medium').length}`)
  console.log(`   ⚪ Low: ${adrs.filter((a) => a.severity === 'Low').length}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the ADR pages')
  console.log('2. Add Related Products relations in Notion UI')
  console.log('3. Review and update ADRs as new decisions are made')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
