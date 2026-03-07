import type { VercelRequest, VercelResponse } from '@vercel/node'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { getGeminiClient, GEMINI_MODEL } from './_gemini.js'
import { checkRateLimit, checkDailyBudget } from './_rate-limit.js'
import { setCorsHeaders } from './_cors.js'
import { sanitizeInput, containsMaliciousPatterns, isContentLengthValid } from './_validation.js'
import {
  PROMPT_ANALYSIS_ZH,
  URL_ANALYSIS_ZH,
  NO_DETECTION_ZH,
  parseGeminiResponse,
  detectChatbotWidgets,
  detectCorsIssues,
  detectSSRFRisks,
  detectEmailValidationIssues,
  isAllowedUrl,
} from './_probe-prompts.js'
import { runDeterministicScan, type DeterministicResult } from './_deterministic-scanner.js'

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

function buildDeterministicFallback(deterministic: DeterministicResult) {
  return {
    grade: deterministic.score >= 70 ? 'B' : deterministic.score >= 40 ? 'C' : 'D',
    score: deterministic.score,
    summary: `確定性掃描：${deterministic.coverage} 項防禦通過。AI 深度分析暫時無法使用。`,
    vulnerabilities: deterministic.checks
      .filter(c => !c.defended)
      .map((c, i) => ({ id: `det-${i}`, name: c.name, severity: 'MEDIUM' as const, finding: `未偵測到 ${c.name} 相關防禦措施`, suggestion: `建議在 System Prompt 中加入 ${c.name} 防禦指示` })),
    positives: deterministic.checks.filter(c => c.defended).map(c => `${c.name}: ${c.evidence}`),
  }
}

async function handlePromptScan(req: VercelRequest, res: VercelResponse, ip: string) {
  const rateLimit = await checkRateLimit(ip, 'probe-prompt', 5, 3600000)
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining))
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: '掃描次數已達上限，請稍後再試。', resetAt: rateLimit.resetAt })
  }

  const budgetOk = await checkDailyBudget(200)
  if (!budgetOk) {
    return res.status(503).json({ error: '今日掃描額度已用完，請明天再試。' })
  }

  const { prompt } = req.body || {}
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: '請提供要分析的 System Prompt。' })
  }

  const cleanedPrompt = sanitizeInput(prompt, 10000)

  if (cleanedPrompt.length < 20) {
    return res.status(400).json({ error: 'Prompt 太短（至少 20 個字元）。' })
  }

  if (containsMaliciousPatterns(cleanedPrompt)) {
    return res.status(400).json({ error: '輸入包含不安全的內容。' })
  }

  // Phase 1: Deterministic scan (< 5ms, 100% reproducible)
  const deterministic = runDeterministicScan(cleanedPrompt)

  // Phase 2: LLM deep analysis with deterministic context
  const deterministicContext = deterministic.checks
    .map(c => `- ${c.id}: ${c.defended ? 'DEFENDED' : 'NOT DEFENDED'} (${c.evidence})`)
    .join('\n')

  let analysis
  try {
    const client = getGeminiClient()
    const model = client.getGenerativeModel({ model: GEMINI_MODEL })
    const promptText = PROMPT_ANALYSIS_ZH(cleanedPrompt)
    const contextPrefix = `[Pre-scan deterministic analysis — coverage ${deterministic.coverage}]:\n${deterministicContext}\n\nUse these as ground truth. Focus on nuances regex cannot catch.\n\n`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: contextPrefix + promptText }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        // @ts-expect-error — thinkingConfig not yet in SDK types
        thinkingConfig: { thinkingBudget: 0 },
      },
      safetySettings: SAFETY_SETTINGS,
    })

    const rawText = result.response.text() || ''
    analysis = parseGeminiResponse(rawText)
  } catch (geminiErr) {
    const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
    console.error('Gemini analysis failed:', errMsg)
    analysis = buildDeterministicFallback(deterministic)
  }
  return res.status(200).json({ ok: true, analysis, deterministic })
}

async function handleUrlScan(req: VercelRequest, res: VercelResponse, ip: string) {
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

  const securityIssues = {
    cors: detectCorsIssues(html),
    ssrf: detectSSRFRisks(html),
    email: detectEmailValidationIssues(html),
  }

  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL })
  const prompt = detections.length > 0
    ? URL_ANALYSIS_ZH(url, detections, htmlExcerpt, securityIssues)
    : NO_DETECTION_ZH(url, htmlExcerpt)

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      // @ts-expect-error — thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: SAFETY_SETTINGS,
  })

  const analysis = parseGeminiResponse(result.response.text() || '')
  return res.status(200).json({ ok: true, detections, analysis })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end()
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!isContentLengthValid(req.headers['content-length'])) {
    return res.status(413).json({ error: '請求內容過大（最大 100 KB）。' })
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
  const { type } = req.body || {}

  try {
    if (type === 'prompt') {
      return await handlePromptScan(req, res, ip)
    } else if (type === 'url') {
      return await handleUrlScan(req, res, ip)
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "prompt" or "url".' })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Probe scan error:', message, err)
    if (err instanceof Error && err.name === 'TimeoutError') {
      return res.status(408).json({ error: '目標網頁回應超時，請確認 URL 是否正確。' })
    }
    return res.status(500).json({ error: '掃描失敗，請稍後再試。' })
  }
}
