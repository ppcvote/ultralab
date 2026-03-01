import type { VercelRequest, VercelResponse } from '@vercel/node'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { getGeminiClient, GEMINI_MODEL } from './_gemini.js'
import { checkRateLimit, checkDailyBudget } from './_rate-limit.js'
import { setCorsHeaders } from './_cors.js'

interface ChatbotDetection {
  name: string
  type: 'chatbot' | 'ai-widget' | 'live-chat' | 'custom'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  evidence: string
}

const CHATBOT_PATTERNS = [
  { regex: /tidiochat|tidio\.co|document\.tidioChatApi/i, name: 'Tidio', type: 'chatbot' as const },
  { regex: /intercom|intercomSettings|widget\.intercom\.io/i, name: 'Intercom', type: 'chatbot' as const },
  { regex: /drift\.com|driftt\.|js\.driftt/i, name: 'Drift', type: 'chatbot' as const },
  { regex: /zopim|zendesk\.com\/embeddable|zESettings/i, name: 'Zendesk Chat', type: 'chatbot' as const },
  { regex: /crisp\.chat|CRISP_WEBSITE_ID|\$crisp/i, name: 'Crisp', type: 'chatbot' as const },
  { regex: /livechatinc\.com|__lc_inited/i, name: 'LiveChat', type: 'live-chat' as const },
  { regex: /hubspot\.com.*conversations|hs-script-loader/i, name: 'HubSpot Chat', type: 'chatbot' as const },
  { regex: /freshchat|freshdesk|fcWidget/i, name: 'Freshchat', type: 'chatbot' as const },
  { regex: /tawk\.to|embed\.tawk/i, name: 'tawk.to', type: 'live-chat' as const },
  { regex: /openai\.com.*widget|chatgpt-widget/i, name: 'OpenAI/ChatGPT Widget', type: 'ai-widget' as const },
  { regex: /voiceflow|vfWidget/i, name: 'Voiceflow', type: 'ai-widget' as const },
  { regex: /botpress|webchat\.botpress/i, name: 'Botpress', type: 'ai-widget' as const },
  { regex: /dialogflow|df-messenger/i, name: 'Dialogflow', type: 'ai-widget' as const },
  { regex: /chainlit/i, name: 'Chainlit', type: 'ai-widget' as const },
  { regex: /streamlit|stApp/i, name: 'Streamlit App', type: 'ai-widget' as const },
  { regex: /langserve/i, name: 'LangServe', type: 'ai-widget' as const },
  { regex: /chat-widget|chatbot-widget|ai-assistant-widget/i, name: 'Custom Chat Widget', type: 'custom' as const },
  { regex: /kommunicate|customerly|landbot|manychat/i, name: 'Chat Platform', type: 'chatbot' as const },
  { regex: /ada\.cx|ada-embed/i, name: 'Ada', type: 'ai-widget' as const },
  { regex: /watson-chat|watsonAssistant/i, name: 'IBM Watson Assistant', type: 'ai-widget' as const },
]

function detectChatbotWidgets(html: string): ChatbotDetection[] {
  const detections: ChatbotDetection[] = []
  const seen = new Set<string>()

  for (const pattern of CHATBOT_PATTERNS) {
    const match = html.match(pattern.regex)
    if (match && !seen.has(pattern.name)) {
      seen.add(pattern.name)
      detections.push({
        name: pattern.name,
        type: pattern.type,
        confidence: 'HIGH',
        evidence: match[0].substring(0, 80),
      })
    }
  }

  return detections
}

function detectCorsIssues(html: string): string[] {
  const issues: string[] = []

  // Check for wildcard CORS
  if (html.includes('Access-Control-Allow-Origin: *') ||
      html.includes("'Access-Control-Allow-Origin', '*'") ||
      html.includes('"Access-Control-Allow-Origin","*"')) {
    issues.push('偵測到 CORS wildcard (*) 設定')
  }

  // Check for credentials + wildcard (forbidden by spec)
  if (html.includes('Access-Control-Allow-Credentials: true') &&
      (html.includes('Access-Control-Allow-Origin: *') ||
       html.includes("'Access-Control-Allow-Origin', '*'"))) {
    issues.push('偵測到 CORS credentials + wildcard（違反規範）')
  }

  return issues
}

function detectSSRFRisks(html: string): string[] {
  const risks: string[] = []

  // Check if there's URL fetching code
  if (html.includes('fetch(') || html.includes('XMLHttpRequest') ||
      html.includes('axios') || html.includes('$.ajax') || html.includes('$.get')) {
    risks.push('偵測到 URL fetching 功能')

    // Check for IP validation
    if (!html.includes('isPrivateIP') &&
        !html.includes('RFC 1918') &&
        !html.includes('172.16') &&
        !html.includes('169.254.169.254') &&
        !html.includes('metadata')) {
      risks.push('未偵測到私有 IP 範圍驗證')
    }
  }

  return risks
}

function detectEmailValidationIssues(html: string): string[] {
  const issues: string[] = []

  // Check for email input fields
  if (html.includes('type="email"') ||
      html.includes('type=\'email\'') ||
      html.includes('email') && (html.includes('<input') || html.includes('<form'))) {
    issues.push('偵測到 email 收集功能')

    // Check for weak validation patterns (simple regex)
    if (html.includes('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/') ||
        html.includes('simple email') ||
        html.includes('@') && html.includes('test(') && !html.includes('RFC')) {
      issues.push('偵測到簡單的 email regex（容易繞過）')
    }
  }

  return issues
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // 1. Only allow HTTPS
    if (parsed.protocol !== 'https:') return false

    const h = parsed.hostname

    // 2. Block localhost / loopback
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return false
    if (h === '::1' || h === '::') return false  // IPv6 loopback

    // 3. Block private IP ranges (RFC 1918)
    if (h.startsWith('10.')) return false
    if (h.startsWith('192.168.')) return false

    // Complete 172.16.0.0/12 check (172.16.0.0 - 172.31.255.255)
    const parts = h.split('.')
    if (parts[0] === '172') {
      const second = parseInt(parts[1], 10)
      if (second >= 16 && second <= 31) return false
    }

    // 4. Block internal TLDs
    if (h.endsWith('.internal') || h.endsWith('.local')) return false

    // 5. Block cloud metadata endpoints
    if (h === '169.254.169.254') return false  // AWS
    if (h === 'metadata.google.internal') return false  // GCP
    if (h === 'metadata') return false  // Azure

    // 6. Block link-local (169.254.0.0/16)
    if (h.startsWith('169.254.')) return false

    // 7. Block multicast / reserved (224.0.0.0+)
    const first = parseInt(parts[0], 10)
    if (first >= 224 && first <= 255) return false

    return true
  } catch {
    return false
  }
}

const URL_ANALYSIS_PROMPT = (url: string, detections: ChatbotDetection[], htmlExcerpt: string, securityIssues: { cors: string[], ssrf: string[], email: string[] }) =>
  `你是 AI 安全分析專家。已掃描網站並偵測到以下 AI/聊天機器人小工具。

URL: ${url}
偵測到的小工具: ${JSON.stringify(detections)}
頁面 HTML 摘錄 (前 5000 字元):
---
${htmlExcerpt}
---

偵測到的安全問題：
- CORS 問題: ${JSON.stringify(securityIssues.cors)}
- SSRF 風險: ${JSON.stringify(securityIssues.ssrf)}
- Email 驗證: ${JSON.stringify(securityIssues.email)}

請評估：
1. 部署了哪些 AI/聊天機器人技術及其潛在攻擊面
2. 聊天機器人是否可能存取敏感資料
3. 此類小工具常見的 prompt injection 漏洞
4. 網站擁有者的風險等級
5. **CORS 設定風險**：如果偵測到 CORS wildcard (*)，這可能允許任何網站濫用 API
6. **SSRF 防護缺失**：如果 chatbot 可以 fetch URLs，是否有防護私有 IP 範圍（10.x, 172.16-31.x, 192.168.x, 169.254.169.254）
7. **Email 驗證弱點**：如果有 email 收集，是否使用簡單 regex 容易被繞過

**重要規則**：
- 所有描述必須**簡潔扼要**（每項 1 句話）
- summary：1 句話（最多 40 字）
- vulnerabilities：最多 3 項
- finding：1 句話（最多 50 字）
- suggestion：1 句話（最多 40 字）
- positives：最多 3 項
- overallRecommendation：1 句話（最多 50 字）

重要：僅回應有效的 JSON（無 markdown 圍欄），且所有內容必須用繁體中文：
{
  "grade": "C",
  "score": 55,
  "summary": "一句話整體風險評估（最多 40 字）",
  "vulnerabilities": [
    {
      "id": "detected-widget-risk",
      "name": "漏洞名稱（最多 20 字）",
      "severity": "HIGH",
      "finding": "發現內容一句話（最多 50 字）",
      "suggestion": "緩解建議一句話（最多 40 字）"
    }
  ],
  "positives": ["正面發現一句話（最多 30 字）"],
  "overallRecommendation": "最優先修復建議一句話（最多 50 字）"
}

可用的 "id" 值：detected-widget-risk, prompt-injection, data-access-risk, cors-misconfiguration, ssrf-vulnerability, weak-email-validation.

Grade 對應: A (90-100), B (75-89), C (60-74), D (40-59), E (20-39), F (0-19).`

const NO_DETECTION_PROMPT = (url: string, htmlExcerpt: string) =>
  `你是 AI 整合顧問。已掃描網站但未偵測到已知的 AI/聊天機器人小工具。

URL: ${url}
頁面 HTML 摘錄 (前 5000 字元):
---
${htmlExcerpt}
---

請分析：
1. 網站使用的前端框架 (React, Vue, Next.js 等)
2. **根據網站內容判斷行業類型**（SaaS、電商、媒體、教育、金融等）
3. **AI 整合潛力**：針對該行業特性，推薦**具體且有差異化的** AI 功能（避免通用建議如「智能客服」）
4. 如果要導入 AI，需要注意哪些安全考量？

**重要規則**：
- 所有描述必須**簡潔扼要**（每項 1 句話，最多 30 字）
- suitableFeatures：**必須針對該網站的行業特性**，提出具體應用場景（最多 3 項）
  - ❌ 錯誤範例：「AI 智能客服」（太通用）
  - ✅ 正確範例：「互動式威脅模擬 Demo」（針對資安公司）、「AI 驅動的程式碼審查工具」（針對開發工具）
- businessValue：1 句話（最多 40 字）
- securityConsiderations：最多 4 項
- positives：最多 3 項
- overallRecommendation：1 句話（最多 50 字）

重要：僅回應有效的 JSON（無 markdown 圍欄），且所有內容必須用繁體中文：
{
  "grade": "N/A",
  "score": -1,
  "summary": "一句話摘要（最多 40 字）",
  "detectedTech": ["Next.js", "React"],
  "aiIntegrationPotential": {
    "suitableFeatures": ["AI 功能 1（最多 20 字）", "AI 功能 2（最多 20 字）"],
    "businessValue": "一句話說明價值（最多 40 字）",
    "implementationPriority": "HIGH/MEDIUM/LOW"
  },
  "securityConsiderations": ["一句話（最多 30 字）", "一句話（最多 30 字）"],
  "positives": ["一句話（最多 25 字）"],
  "overallRecommendation": "一句話建議（最多 50 字）"
}`

function parseGeminiResponse(text: string) {
  let cleaned = text.trim()

  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  try {
    return JSON.parse(cleaned.trim())
  } catch (parseError: any) {
    console.error('JSON parse failed. Raw response:', cleaned.substring(0, 500))
    throw new Error(`JSON parse failed: ${parseError.message}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end()
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'

  // Rate limit: 3 per IP per hour (stricter than prompt scan due to fetch cost)
  const rateLimit = await checkRateLimit(ip, 'probe-url', 3, 3600000)
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining))
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: '掃描次數已達上限，請稍後再試。', resetAt: rateLimit.resetAt })
  }

  const budgetOk = await checkDailyBudget(200)
  if (!budgetOk) {
    return res.status(503).json({ error: '今日掃描額度已用完，請明天再試。' })
  }

  const { url } = req.body || {}
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '請提供要掃描的 URL。' })
  }
  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: 'URL 必須是 HTTPS 且為公開網址。' })
  }

  try {
    // Fetch target page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UltraProbe/1.0 (AI Security Scanner; +https://ultralab.tw/probe)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return res.status(400).json({ error: `無法存取目標網頁（HTTP ${response.status}）。` })
    }

    const html = await response.text()
    const detections = detectChatbotWidgets(html)
    const htmlExcerpt = html.substring(0, 5000)

    // Run security checks
    const securityIssues = {
      cors: detectCorsIssues(html),
      ssrf: detectSSRFRisks(html),
      email: detectEmailValidationIssues(html),
    }

    const client = getGeminiClient()
    const model = client.getGenerativeModel({ model: GEMINI_MODEL })
    const prompt = detections.length > 0
      ? URL_ANALYSIS_PROMPT(url, detections, htmlExcerpt, securityIssues)
      : NO_DETECTION_PROMPT(url, htmlExcerpt)

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const analysis = parseGeminiResponse(result.response.text() || '')
    return res.status(200).json({ ok: true, detections, analysis })
  } catch (err: unknown) {
    console.error('Probe URL scan error:', err)
    if (err instanceof Error && err.name === 'TimeoutError') {
      return res.status(408).json({ error: '目標網頁回應超時，請確認 URL 是否正確。' })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: `掃描失敗，請稍後再試。(${message})` })
  }
}
