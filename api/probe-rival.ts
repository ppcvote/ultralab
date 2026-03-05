import type { VercelRequest, VercelResponse } from '@vercel/node'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { getGeminiClient, GEMINI_MODEL } from './_gemini.js'
import { checkRateLimit, checkDailyBudget } from './_rate-limit.js'
import { setCorsHeaders } from './_cors.js'

const MIN_CONTENT_LENGTH = 200
const MAX_CONTENT_LENGTH = 10000
const JINA_TIMEOUT = 12000

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const h = parsed.hostname
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return false
    if (h === '::1' || h === '::') return false
    if (h.startsWith('10.') || h.startsWith('192.168.')) return false
    const parts = h.split('.')
    if (parts[0] === '172') {
      const second = parseInt(parts[1], 10)
      if (second >= 16 && second <= 31) return false
    }
    if (h.endsWith('.internal') || h.endsWith('.local')) return false
    if (h === '169.254.169.254' || h === 'metadata.google.internal' || h === 'metadata') return false
    if (h.startsWith('169.254.')) return false
    const first = parseInt(parts[0], 10)
    if (first >= 224 && first <= 255) return false
    return true
  } catch {
    return false
  }
}

async function extractViaJina(url: string): Promise<{ content: string; success: boolean }> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/markdown',
        'User-Agent': 'UltraProbe/1.0 (Rival Analysis; +https://ultralab.tw/probe)',
      },
      signal: AbortSignal.timeout(JINA_TIMEOUT),
    })

    if (!response.ok) {
      return { content: '', success: false }
    }

    const text = await response.text()

    // Clean markdown: remove image embeds, keep link text
    const cleaned = text
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (cleaned.length < MIN_CONTENT_LENGTH) {
      return { content: cleaned, success: false }
    }

    return { content: cleaned.substring(0, 8000), success: true }
  } catch {
    return { content: '', success: false }
  }
}

const RIVAL_ANALYSIS_PROMPT = (url: string, content: string) =>
  `你是社群媒體競爭分析專家。請分析以下從競爭對手帳號擷取的內容，提供深入的策略洞察。

來源 URL: ${url}
擷取內容:
---
${content}
---

請分析以下面向，提供具體且可行動的洞察（非泛泛而論）：

1. **帳號概要**：平台、帳號名稱、個人簡介摘要、預估內容量
2. **內容策略**：
   - 主題分布（每個主題佔比 %，加總 100%）
   - 內容格式（圖文、影片、Carousel 等）
   - 發文頻率估計
   - 表現最好的內容類型
3. **互動模式**：
   - 開頭 Hook 手法（列舉具體句型，至少 3 個）
   - CTA 手法（列舉具體句型，至少 2 個）
   - 互動風格（回覆方式、社群經營手法）
4. **流量來源**：
   - Hashtag 策略分析
   - 跨平台導流連結
   - SEO 關鍵字
5. **競爭洞察**：
   - 對手的 3 個強項（要具體）
   - 對手的 3 個弱點（= 你的機會）
   - 3 個可把握的市場機會
6. **AI 內容生成建議**：
   - 1 個內容創作 Prompt（可直接使用，完整且具體）
   - 1 個 Hook 開頭 Prompt（可直接使用）
   - 1 個互動引導 Prompt（可直接使用）

**規則**：
- 所有內容用**繁體中文**
- Hook/CTA 句型舉例必須是**具體句子**，非抽象描述
- Prompt 建議必須是**可直接複製使用**的完整 prompt
- 如果內容不足以分析某個面向，該欄位填「資料不足」而非瞎猜

重要：僅回應有效的 JSON（無 markdown 圍欄），使用此結構：
{
  "profileSummary": {
    "platform": "Threads/Instagram/YouTube/其他",
    "handle": "@帳號名稱",
    "bio": "個人簡介摘要（最多 50 字）",
    "contentVolume": "預估發文量描述"
  },
  "contentStrategy": {
    "themes": [
      { "topic": "主題名稱", "percentage": 40 }
    ],
    "formats": ["圖文", "短影音"],
    "postingFrequency": "描述發文頻率",
    "bestPerformingType": "表現最好的內容類型"
  },
  "engagementPatterns": {
    "hookPatterns": ["具體 Hook 句型 1", "具體 Hook 句型 2", "具體 Hook 句型 3"],
    "ctaPatterns": ["具體 CTA 句型 1", "具體 CTA 句型 2"],
    "interactionStyle": "互動風格描述（最多 50 字）"
  },
  "trafficSources": {
    "hashtagStrategy": "Hashtag 策略描述（最多 60 字）",
    "crossPlatformLinks": ["連結 1"],
    "seoKeywords": ["關鍵字 1", "關鍵字 2", "關鍵字 3"]
  },
  "competitiveInsights": {
    "strengths": ["強項 1", "強項 2", "強項 3"],
    "weaknesses": ["弱點 1", "弱點 2", "弱點 3"],
    "opportunities": ["機會 1", "機會 2", "機會 3"]
  },
  "promptSuggestions": {
    "contentPrompt": "完整的內容創作 prompt...",
    "hookPrompt": "完整的 Hook 開頭 prompt...",
    "engagementPrompt": "完整的互動引導 prompt..."
  }
}`

function parseGeminiResponse(text: string) {
  let cleaned = text.trim()
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

  // Rate limit: 3 per IP per hour
  const rateLimit = await checkRateLimit(ip, 'probe-rival', 3, 3600000)
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining))
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: '分析次數已達上限，請稍後再試。', resetAt: rateLimit.resetAt })
  }

  const budgetOk = await checkDailyBudget(200)
  if (!budgetOk) {
    return res.status(503).json({ error: '今日分析額度已用完，請明天再試。' })
  }

  const { url, manualContent } = req.body || {}

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '請提供要分析的 URL。' })
  }
  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: 'URL 必須是 HTTPS 且為公開網址。' })
  }

  // If user provided manual content, use that directly
  if (manualContent && typeof manualContent === 'string') {
    const trimmed = manualContent.trim()
    if (trimmed.length < 100) {
      return res.status(400).json({ error: '手動輸入的內容至少需要 100 字。' })
    }
    const content = trimmed.substring(0, MAX_CONTENT_LENGTH)
    return analyzeWithGemini(url, content, res)
  }

  // Try Jina Reader extraction
  try {
    const { content, success } = await extractViaJina(url)

    if (!success) {
      return res.status(200).json({
        ok: false,
        needsManualInput: true,
        reason: '無法自動擷取足夠的內容。請手動貼上對手的貼文內容（至少 3-5 則）。',
        partialContent: content,
      })
    }

    return analyzeWithGemini(url, content, res)
  } catch (err: unknown) {
    console.error('Probe rival scan error:', err)
    if (err instanceof Error && err.name === 'TimeoutError') {
      return res.status(200).json({
        ok: false,
        needsManualInput: true,
        reason: '目標網頁回應超時。請手動貼上對手的貼文內容。',
        partialContent: '',
      })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: `分析失敗，請稍後再試。(${message})` })
  }
}

async function analyzeWithGemini(url: string, content: string, res: VercelResponse) {
  try {
    const client = getGeminiClient()
    const model = client.getGenerativeModel({ model: GEMINI_MODEL })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: RIVAL_ANALYSIS_PROMPT(url, content) }] }],
      generationConfig: {
        temperature: 0.4,
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
    return res.status(200).json({ ok: true, analysis })
  } catch (err: unknown) {
    console.error('Gemini analysis error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: `AI 分析失敗。(${message})` })
  }
}
