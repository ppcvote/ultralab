// Script to create Email Templates in Notion (中英雙語)
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_EMAIL_TEMPLATES_DB_ID = process.env.NOTION_EMAIL_TEMPLATES_DB_ID

if (!NOTION_API_KEY || !NOTION_EMAIL_TEMPLATES_DB_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_EMAIL_TEMPLATES_DB_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Email templates from EMAIL_RESPONSE_SPEC.md (中英雙語)
const templates = [
  {
    name: 'Threads 自動化 - 面議預算｜Threads Automation - Discuss Budget',
    category: 'Inquiry Response',
    serviceType: 'Threads',
    budgetTier: 'Discuss',
    subject: '24 小時 0→1,300 追蹤 — 你的帳號也能這樣跑｜24hrs 0→1,300 Followers',
    hook: '{Name} 你好，看到你對 Threads 自動化有興趣。我們最近做了一個全新帳號 risk.clock.tw，創建 24 小時內突破 1,300 追蹤，全自動運行。',
    coreMessage: '目前穩定管理 6 個帳號，每天自動產出 35 篇貼文（全 AI 生成），24 小時自動運行。\n\n怎麼做到的？\n- AI 分析你的領域，自動生成高互動內容\n- 自動排程發布（最佳時段分散）\n- 自動回覆留言（維持互動率）\n- 每週成效回報\n\n想先問你幾個問題：\n1. 你的帳號主題是？（財經/美食/科技...）\n2. 目標是增粉還是變現？\n3. 有想過每天發幾篇嗎？',
    cta: '直接回這封信就好，我們來聊聊你的想法。｜Just reply to this email.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: 'Threads 自動化 - 3K 以下預算｜Threads Automation - Under 3K',
    category: 'Inquiry Response',
    serviceType: 'Threads',
    budgetTier: 'Under 3K',
    subject: '早鳥體驗方案 NT$990/月 — Threads 全代管｜Early Bird NT$990/mo',
    hook: '{Name} 你好！我們現在有早鳥體驗方案，NT$990/月就能試試 Threads 全自動化。',
    coreMessage: '包含什麼？\n- 1 帳號全代管（AI 生成內容 + 自動發布）\n- 每天自動發 5-10 篇（依你的領域調整）\n- 每週成效回報（追蹤成長、互動數據）\n\n成功案例：\n- risk.clock.tw：24 小時內 0→1,300 追蹤\n- GinRollBT：半年 0→6,500 追蹤，成功變現\n\n快問兩個問題：\n1. 你的 Threads 帳號是？\n2. 主題方向是？（財經/美食/科技...）',
    cta: '回信告訴我帳號資訊，我直接幫你開跑。｜Reply with your account info.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: 'Threads 自動化 - 3K-10K 預算｜Threads Automation - 3K-10K',
    category: 'Inquiry Response',
    serviceType: 'Threads',
    budgetTier: '3K-10K',
    subject: 'Threads 標準方案 + 7 天免費試用｜Standard Plan + 7-Day Free Trial',
    hook: '{Name} 你好，看到你對 Threads 自動化有興趣，這個預算可以跑標準方案。',
    coreMessage: '標準方案 NT$3,990/月：\n- 2-3 個帳號全代管\n- 每天自動發 15-20 篇（依帳號分配）\n- AI 生成 + 自動排程 + 自動回覆\n- 每週詳細成效報告\n- 7 天免費試用（滿意再付款）\n\n目前管理 6 個帳號，每天 35 篇全自動，案例：\n- risk.clock.tw：24 小時 0→1,300\n- GinRollBT：6 個月 0→6,500\n\n想問幾個問題：\n1. 你有幾個帳號要管？\n2. 主題方向是？\n3. 目標是增粉還是變現？',
    cta: '直接回信，我們先跑 7 天免費試用。｜Reply to start 7-day free trial.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: 'IG Reel 自動發布 - 面議預算｜IG Reel Automation - Discuss',
    category: 'Inquiry Response',
    serviceType: 'IG Reel',
    budgetTier: 'Discuss',
    subject: 'IG Reel 全自動系統 — 素材→影片→發布｜IG Reel Full Automation',
    hook: '{Name} 你好，看到你對 IG Reel 自動發布有興趣。我們做了一套系統：素材→文案→影片→排程→發布，全自動。',
    coreMessage: '系統流程：\n1. 提供素材（圖片/短片）或我們幫你找\n2. AI 自動生成文案 + 配音\n3. 自動剪輯成 Reel（14-18 秒）\n4. 自動排程發布（最佳時段）\n\n適合：\n- 房仲、保險業務（需要持續曝光）\n- 電商、餐飲（產品展示）\n- 個人品牌（知識分享）\n\n想先了解：\n1. 你的產業/主題是？\n2. 目前有素材嗎？還是需要我們協助？\n3. 預計每週發幾支？',
    cta: '回信聊聊你的需求，我們來討論最適合的方案。｜Reply to discuss.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: '短影音自動產製 - 面議預算｜Short Video Automation - Discuss',
    category: 'Inquiry Response',
    serviceType: 'Short Video',
    budgetTier: 'Discuss',
    subject: '短影音自動產製系統 — HTML→影片 14-18 秒｜Short Video Auto-Gen',
    hook: '{Name} 你好，短影音產製系統的核心是：HTML 模板 → Playwright 截圖 → FFmpeg 合成，14-18 秒自動產出。',
    coreMessage: '技術流程：\n1. 設計 HTML 模板（財經數據/知識卡片/產品展示）\n2. Playwright 自動截圖（動態數據渲染）\n3. FFmpeg 合成影片（加配音、字幕、轉場）\n4. 自動發布到 IG Reel / Threads / YouTube Shorts\n\n適合場景：\n- 財經數據視覺化（股市、匯率、基金）\n- 知識卡片（名言、技巧、教學）\n- 產品介紹（規格、價格、比較）\n\n想了解：\n1. 你的內容類型是？（數據/知識/產品）\n2. 有設計稿嗎？還是需要我們設計？\n3. 預計每天產出幾支？',
    cta: '回信告訴我你的需求，我們來評估技術方案。｜Reply with your needs.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: 'SaaS 全端建置 - 面議預算｜SaaS Full-Stack - Discuss',
    category: 'Inquiry Response',
    serviceType: 'SaaS Build',
    budgetTier: 'Discuss',
    subject: 'SaaS 建置方案 — React + Firebase + Vercel｜SaaS Build Solution',
    hook: '{Name} 你好，看到你對 SaaS 建置有興趣。我們用 React 18 + Firebase + Vercel 全套，從 0 到上線。',
    coreMessage: '技術棧：\n- 前端：React 18 + TypeScript + Tailwind CSS v4\n- 後端：Firebase (Auth, Firestore, Functions)\n- 部署：Vercel (CI/CD, Edge Functions)\n- AI 整合：Gemini / Claude API\n\n成功案例：\n- Ultra Advisor：財務規劃 SaaS，18 個工具，67 篇 blog\n- Mind Threads：Threads 自動化 SaaS，NT$1,990/月訂閱\n\n想了解：\n1. 你的 SaaS 是做什麼的？（簡單描述）\n2. 目標用戶是誰？\n3. 預計多久要上線？',
    cta: '回信聊聊你的想法，我們來評估工期和報價。｜Reply to discuss timeline.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: 'AI 串接應用 - 面議預算｜AI Integration - Discuss',
    category: 'Inquiry Response',
    serviceType: 'AI Integration',
    budgetTier: 'Discuss',
    subject: 'AI 串接應用方案 — Gemini / Claude API｜AI Integration Solution',
    hook: '{Name} 你好，AI 串接的核心是：找到對的場景 + 設計好的 prompt + 整合到現有系統。',
    coreMessage: '我們做過的 AI 應用：\n- Threads 自動化：AI 生成內容（每天 35 篇，6 個帳號）\n- UltraProbe：AI 安全掃描（prompt + URL 漏洞檢測）\n- 財務顧問工具：AI 分析客戶需求 + 自動生成建議\n\n技術選擇：\n- Gemini 2.5 Flash：快速、便宜（免費 quota）\n- Claude Sonnet：高品質、推理能力強\n- 混合使用：依場景選擇最佳模型\n\n想了解：\n1. 你想用 AI 做什麼？（文案生成/數據分析/客服...）\n2. 現有系統是什麼？（網站/App/內部工具）\n3. 預算範圍大概多少？',
    cta: '回信告訴我你的需求，我們來討論技術方案。｜Reply with your use case.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: 'UltraProbe 安全掃描 - Follow-up｜UltraProbe Security Scan Follow-up',
    category: 'Follow-up',
    serviceType: 'UltraProbe',
    budgetTier: 'N/A',
    subject: '你的 AI 安全掃描報告 — 發現 {X} 個潛在風險｜Your AI Security Report',
    hook: '{Name} 你好，剛看到你在 UltraProbe 做了掃描，發現了 {X} 個潛在漏洞。',
    coreMessage: '掃描結果：\n- 總分：{Score}/100（等級：{Grade}）\n- 漏洞數量：{VulnerabilityCount} 個\n- 風險等級：{RiskLevel}\n\nUltraProbe 是我們做的免費 AI 安全掃描工具，可以檢測：\n- Prompt Injection 風險\n- URL 安全性問題\n- LLM 應用漏洞\n\n如果你需要：\n- 完整的安全評估報告\n- AI 應用安全加固方案\n- 定期安全掃描服務\n\n我們可以提供進階服務。',
    cta: '有任何問題直接回信，或是繼續使用免費掃描。｜Reply if you need help.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: '技術諮詢 - 一般詢問｜Technical Consultation - General',
    category: 'Technical Support',
    serviceType: 'General',
    budgetTier: 'N/A',
    subject: 'Re: {OriginalSubject}',
    hook: '{Name} 你好，看到你的問題了。',
    coreMessage: '關於 {Topic}，我的建議是：\n\n[具體建議 1-3 點]\n\n如果需要更深入討論：\n1. {Question 1}\n2. {Question 2}\n\n我們可以安排時間詳聊。',
    cta: '直接回信，或加 LINE (risky9763) 討論。｜Reply or add LINE.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: '客戶 Onboarding - 新客戶歡迎｜Client Onboarding - Welcome',
    category: 'Onboarding',
    serviceType: 'General',
    budgetTier: 'N/A',
    subject: '歡迎加入 Ultra Lab！接下來的流程｜Welcome to Ultra Lab!',
    hook: '{Name} 你好，歡迎加入 Ultra Lab！',
    coreMessage: '接下來的流程：\n\n第 1 步：提供帳號資訊\n- Threads 帳號名稱\n- 主題方向\n- 目標受眾\n\n第 2 步：AI 內容設定（1-2 天）\n- 分析你的領域\n- 設計內容策略\n- 設定自動化排程\n\n第 3 步：開始運行\n- 每天自動發布\n- 每週成效回報\n- 隨時調整優化\n\n有任何問題隨時找我。',
    cta: '回信提供帳號資訊，我們立即開始設定。｜Reply with account info.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: '成效回報 - 週報範本｜Performance Report - Weekly Template',
    category: 'Follow-up',
    serviceType: 'Threads',
    budgetTier: 'N/A',
    subject: 'Threads 週報：{Date} - {AccountName}｜Weekly Report',
    hook: '{Name} 你好，這週的成效報告來了。',
    coreMessage: '本週數據：\n- 發布貼文：{PostCount} 篇\n- 追蹤成長：+{FollowerGrowth}（目前 {TotalFollowers}）\n- 總互動數：{TotalEngagement}（讚 + 留言 + 分享）\n- 平均互動率：{EngagementRate}%\n\n表現最好的貼文：\n1. "{TopPost1}" - {TopPost1Engagement} 互動\n2. "{TopPost2}" - {TopPost2Engagement} 互動\n\n下週優化方向：\n- {Optimization1}\n- {Optimization2}',
    cta: '有任何想調整的直接回信。｜Reply if you want adjustments.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
  {
    name: '流失挽回 - 客戶暫停服務｜Churn Prevention - Service Pause',
    category: 'Follow-up',
    serviceType: 'General',
    budgetTier: 'N/A',
    subject: '有什麼可以改進的嗎？｜Any feedback for us?',
    hook: '{Name} 你好，看到你暫停了服務，想了解一下有什麼可以改進的地方？',
    coreMessage: '如果是因為：\n- 成效不如預期 → 我們可以調整策略\n- 預算考量 → 我們可以討論更彈性的方案\n- 時間不夠 → 我們可以簡化流程\n- 其他原因 → 直接跟我說，我們來想辦法\n\n你的回饋對我們很重要，幫助我們做得更好。\n\n如果未來有需要，隨時都可以再聯繫。',
    cta: '回信告訴我你的想法，或加 LINE 聊聊。｜Reply with feedback.',
    signature: '皮皮 C / PiPi C\nUltra Lab 創辦人｜Founder\nLINE: risky9763',
  },
]

async function createEmailTemplatePage(template) {
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
      Category: {
        select: { name: template.category },
      },
      'Service Type': {
        select: { name: template.serviceType },
      },
      'Budget Tier': {
        select: { name: template.budgetTier },
      },
      'Subject Line': {
        rich_text: [
          {
            text: {
              content: template.subject,
            },
          },
        ],
      },
      Hook: {
        rich_text: [
          {
            text: {
              content: template.hook.substring(0, 2000),
            },
          },
        ],
      },
      'Core Message': {
        rich_text: [
          {
            text: {
              content: template.coreMessage.substring(0, 2000),
            },
          },
        ],
      },
      CTA: {
        rich_text: [
          {
            text: {
              content: template.cta,
            },
          },
        ],
      },
      Signature: {
        rich_text: [
          {
            text: {
              content: template.signature,
            },
          },
        ],
      },
    }

    await notion.pages.create({
      parent: { database_id: NOTION_EMAIL_TEMPLATES_DB_ID },
      properties,
      icon: {
        type: 'emoji',
        emoji: '📧',
      },
    })

    console.log(`✅ Created: ${template.name}`)
  } catch (error) {
    console.error(`❌ Failed to create: ${template.name}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Creating Email Templates (中英雙語)...\n')

  let totalCreated = 0
  let totalFailed = 0

  for (const template of templates) {
    try {
      await createEmailTemplatePage(template)
      totalCreated++
      await delay(500)
    } catch (error) {
      console.error(`❌ Failed: ${template.name}`)
      totalFailed++
    }
  }

  console.log('\n')
  console.log('🎉 Email Templates Creation Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📊 Summary by Category:')
  console.log(`   📬 Inquiry Response: ${templates.filter((t) => t.category === 'Inquiry Response').length}`)
  console.log(`   📮 Follow-up: ${templates.filter((t) => t.category === 'Follow-up').length}`)
  console.log(`   🎓 Onboarding: ${templates.filter((t) => t.category === 'Onboarding').length}`)
  console.log(`   🛠️  Technical Support: ${templates.filter((t) => t.category === 'Technical Support').length}`)
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the email templates')
  console.log('2. Test templates by copy-pasting to real emails')
  console.log('3. Track success rates in "Success Rate" field')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
