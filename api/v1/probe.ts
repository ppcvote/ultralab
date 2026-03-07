import type { VercelRequest, VercelResponse } from '@vercel/node'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { validateApiKey, checkApiKeyUsage, incrementApiKeyUsage } from '../_api-auth.js'
import { getGeminiClient, GEMINI_MODEL } from '../_gemini.js'
import { getAdminDb } from '../_firebase.js'
import { collectVulnerabilityData } from '../_vuln-collector.js'
import {
  getPromptAnalysisPrompt,
  getUrlAnalysisPrompt,
  getNoDetectionPrompt,
  parseGeminiResponse,
  detectChatbotWidgets,
  detectCorsIssues,
  detectSSRFRisks,
  detectEmailValidationIssues,
  isAllowedUrl,
} from '../_probe-prompts.js'
import { runDeterministicScan } from '../_deterministic-scanner.js'

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const API_DOCS = {
  name: 'UltraProbe API',
  version: '1.0',
  docs: 'https://ultralab.tw/probe#api',
  endpoints: {
    'scan-prompt': {
      method: 'POST',
      description: 'Analyze a system prompt for injection vulnerabilities (12 attack vectors)',
      auth: 'Bearer up_live_YOUR_API_KEY',
      body: { action: 'scan-prompt', prompt: 'string (required, 20-10000 chars)', language: 'en | zh-TW (optional, default: en)' },
    },
    'scan-url': {
      method: 'POST',
      description: 'Scan a URL for AI chatbot widgets and security vulnerabilities',
      auth: 'Bearer up_live_YOUR_API_KEY',
      body: { action: 'scan-url', url: 'string (required, HTTPS only)', language: 'en | zh-TW (optional, default: en)' },
    },
    usage: {
      method: 'POST',
      description: 'Check your API usage and limits',
      auth: 'Bearer up_live_YOUR_API_KEY',
      body: { action: 'usage' },
    },
  },
  pricing: {
    free: '10 scans/month',
    pro: '$49/month — 100 scans',
    enterprise: '$299/month — unlimited',
  },
}

async function authenticate(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Missing or invalid Authorization header',
      hint: 'Use: Authorization: Bearer up_live_YOUR_API_KEY',
      docs: 'https://ultralab.tw/probe#api',
    })
    return null
  }

  const apiKey = authHeader.replace('Bearer ', '')
  const validation = await validateApiKey(apiKey)
  if (!validation.valid) {
    res.status(401).json({ error: validation.error })
    return null
  }

  const { tier, monthlyLimit } = validation.keyData!
  const usageCheck = await checkApiKeyUsage(apiKey, tier, monthlyLimit)
  if (!usageCheck.allowed) {
    res.status(429).json({ error: usageCheck.error, usage: usageCheck.usage, limit: usageCheck.limit })
    return null
  }

  return { apiKey, tier, monthlyLimit, usage: usageCheck.usage, limit: usageCheck.limit }
}

async function handleScanPrompt(req: VercelRequest, res: VercelResponse, auth: { apiKey: string, tier: string, usage: number, limit: number | null }) {
  const { prompt, language = 'en' } = req.body
  const lang = language === 'zh-TW' ? 'zh-TW' : 'en' as const

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt" field' })
  }
  if (prompt.length < 20) {
    return res.status(400).json({ error: lang === 'zh-TW' ? 'Prompt 至少需 20 個字元。' : 'Prompt must be at least 20 characters.' })
  }
  if (prompt.length > 10000) {
    return res.status(400).json({ error: lang === 'zh-TW' ? 'Prompt 不可超過 10,000 字元。' : 'Prompt cannot exceed 10,000 characters.' })
  }

  // Phase 1: Deterministic scan
  const deterministic = runDeterministicScan(prompt)

  // Phase 2: LLM analysis with deterministic context
  const deterministicContext = deterministic.checks
    .map(c => `- ${c.id}: ${c.defended ? 'DEFENDED' : 'NOT DEFENDED'} (${c.evidence})`)
    .join('\n')
  const contextPrefix = `[Pre-scan deterministic analysis — coverage ${deterministic.coverage}]:\n${deterministicContext}\n\nUse these as ground truth. Focus on nuances regex cannot catch.\n\n`

  const gemini = getGeminiClient()
  const model = gemini.getGenerativeModel({ model: GEMINI_MODEL })
  const promptText = getPromptAnalysisPrompt(lang, prompt)

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

  const analysis = parseGeminiResponse(result.response.text() || '')

  incrementApiKeyUsage(auth.apiKey).catch(() => {})
  collectVulnerabilityData('prompt', prompt, analysis.grade, analysis.score, analysis.vulnerabilities || [], lang, req.headers['user-agent'], req.headers['x-forwarded-for'] as string).catch(() => {})

  return res.status(200).json({
    ok: true,
    analysis,
    deterministic,
    usage: { current: auth.usage + 1, limit: auth.limit, tier: auth.tier },
  })
}

async function handleScanUrl(req: VercelRequest, res: VercelResponse, auth: { apiKey: string, tier: string, usage: number, limit: number | null }) {
  const { url, language = 'en' } = req.body
  const lang = language === 'zh-TW' ? 'zh-TW' : 'en' as const

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" field' })
  }
  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: lang === 'zh-TW' ? 'URL 必須是 HTTPS 且為公開網址。' : 'URL must be HTTPS and publicly accessible.' })
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'UltraProbe-Scanner/1.0 (+https://ultralab.tw/probe)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    return res.status(400).json({ error: `Failed to fetch URL: HTTP ${response.status}` })
  }

  const html = await response.text()
  const detections = detectChatbotWidgets(html)
  const htmlExcerpt = html.substring(0, 5000)

  const securityIssues = {
    cors: detectCorsIssues(html),
    ssrf: detectSSRFRisks(html),
    email: detectEmailValidationIssues(html),
  }

  const gemini = getGeminiClient()
  const model = gemini.getGenerativeModel({ model: GEMINI_MODEL })
  const prompt = detections.length > 0
    ? getUrlAnalysisPrompt(url, detections, htmlExcerpt, securityIssues, lang)
    : getNoDetectionPrompt(url, htmlExcerpt, lang)

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

  incrementApiKeyUsage(auth.apiKey).catch(() => {})
  collectVulnerabilityData('url', url, analysis.grade, analysis.score, analysis.vulnerabilities || [], lang, req.headers['user-agent'], req.headers['x-forwarded-for'] as string).catch(() => {})

  return res.status(200).json({
    ok: true,
    detections,
    analysis,
    usage: { current: auth.usage + 1, limit: auth.limit, tier: auth.tier },
  })
}

async function handleUsage(_req: VercelRequest, res: VercelResponse, auth: { apiKey: string, tier: string, limit: number | null }) {
  const db = getAdminDb()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const usageRef = db.collection('api_usage').doc(auth.apiKey).collection('monthly').doc(currentMonth)
  const usageDoc = await usageRef.get()

  const currentUsage = usageDoc.exists ? (usageDoc.data()?.scans || 0) : 0
  const lastScan = usageDoc.exists ? usageDoc.data()?.lastScan?.toDate() : null

  const history: { month: string, scans: number }[] = []
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthDoc = await db.collection('api_usage').doc(auth.apiKey).collection('monthly').doc(month).get()
    history.push({ month, scans: monthDoc.exists ? (monthDoc.data()?.scans || 0) : 0 })
  }

  return res.status(200).json({
    ok: true,
    tier: auth.tier,
    limit: auth.limit,
    currentMonth: {
      month: currentMonth,
      scans: currentUsage,
      remaining: auth.limit ? Math.max(0, auth.limit - currentUsage) : null,
      lastScan,
    },
    history: history.reverse(),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET = API documentation (no auth)
  if (req.method === 'GET') {
    return res.status(200).json(API_DOCS)
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action } = req.body || {}
  if (!action || !['scan-prompt', 'scan-url', 'usage'].includes(action)) {
    return res.status(400).json({
      error: 'Invalid or missing "action" field',
      validActions: ['scan-prompt', 'scan-url', 'usage'],
      docs: 'GET /api/v1/probe for full documentation',
    })
  }

  // Authenticate
  const auth = await authenticate(req, res)
  if (!auth) return // Response already sent

  try {
    switch (action) {
      case 'scan-prompt':
        return await handleScanPrompt(req, res, auth)
      case 'scan-url':
        return await handleScanUrl(req, res, auth)
      case 'usage':
        return await handleUsage(req, res, auth)
    }
  } catch (err: unknown) {
    console.error('UltraProbe API error:', err)
    if (err instanceof Error && err.name === 'TimeoutError') {
      return res.status(408).json({ error: 'Target URL timed out' })
    }
    return res.status(500).json({ error: 'Scan failed. Please try again.' })
  }
}
