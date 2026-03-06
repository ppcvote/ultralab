import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateApiKey, checkApiKeyUsage, incrementApiKeyUsage } from '../_api-auth.js'
import { getGeminiClient, GEMINI_MODEL } from '../_gemini.js'
import { collectVulnerabilityData } from '../_vuln-collector.js'

interface ScanUrlRequest {
  url: string
  language?: 'en' | 'zh-TW'
}

// Chatbot detection patterns (simplified version)
const CHATBOT_PATTERNS = [
  { name: 'Tidio', type: 'live-chat', patterns: ['tidio.co', 'tidio-chat'] },
  { name: 'Intercom', type: 'chatbot', patterns: ['intercom.io', 'IntercomSettings'] },
  { name: 'Drift', type: 'chatbot', patterns: ['drift.com', 'driftt.com'] },
  { name: 'Crisp', type: 'live-chat', patterns: ['crisp.chat', '$crisp'] },
  { name: 'Zendesk', type: 'live-chat', patterns: ['zopim.com', 'zendesk.com/embeddable'] },
  { name: 'LiveChat', type: 'live-chat', patterns: ['livechatinc.com', 'LC_API'] },
  { name: 'Tawk.to', type: 'live-chat', patterns: ['embed.tawk.to', 'Tawk_API'] },
  { name: 'Botpress', type: 'chatbot', patterns: ['botpress.io', 'bp-widget'] },
  { name: 'Voiceflow', type: 'ai-widget', patterns: ['voiceflow.com', 'vf-chat'] },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Extract API key
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      message: 'Use: Authorization: Bearer up_live_YOUR_API_KEY',
    })
  }

  const apiKey = authHeader.replace('Bearer ', '')

  // Validate API key
  const validation = await validateApiKey(apiKey)
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error })
  }

  const { tier, monthlyLimit } = validation.keyData!

  // Check usage limits
  const usageCheck = await checkApiKeyUsage(apiKey, tier, monthlyLimit)
  if (!usageCheck.allowed) {
    return res.status(429).json({
      error: usageCheck.error,
      usage: usageCheck.usage,
      limit: usageCheck.limit,
    })
  }

  // Validate request body
  const { url, language = 'en' }: ScanUrlRequest = req.body || {}

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" field' })
  }

  if (!url.startsWith('http')) {
    return res.status(400).json({
      error: language === 'zh-TW' ? '請輸入有效的 HTTPS URL。' : 'Please provide a valid HTTPS URL.',
    })
  }

  // SSRF protection
  const blockedPatterns = [
    /^https?:\/\/(127\.|localhost|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i,
    /metadata\.google\.internal/i,
    /169\.254\.169\.254/,
  ]

  if (blockedPatterns.some(pattern => pattern.test(url))) {
    return res.status(400).json({
      error: language === 'zh-TW' ? '不允許掃描內部 IP 或 metadata 端點。' : 'Scanning private IPs or metadata endpoints is not allowed.',
    })
  }

  try {
    // Fetch URL
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UltraProbe-Scanner/1.0 (+https://ultralab.tw/probe)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to fetch URL: HTTP ${response.status}`,
      })
    }

    const html = await response.text()

    // Detect chatbots
    const detections = detectChatbots(html)

    // Analyze with Gemini
    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL })

    const systemPrompt = getUrlAnalysisPrompt(url, html.slice(0, 3000), detections.length, language)
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    })

    const responseText = result.response.text()
    const analysis = JSON.parse(responseText)

    // Increment usage counter (fire and forget)
    incrementApiKeyUsage(apiKey).catch(() => {})

    // Collect vulnerability data (fire and forget, privacy-safe)
    collectVulnerabilityData(
      'url',
      url,
      analysis.grade,
      analysis.score,
      analysis.vulnerabilities || [],
      language,
      req.headers['user-agent'],
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress
    ).catch(() => {})

    return res.status(200).json({
      ok: true,
      detections,
      analysis,
      usage: {
        current: usageCheck.usage + 1,
        limit: usageCheck.limit,
        tier,
      },
    })
  } catch (err) {
    console.error('URL scan error:', err)
    return res.status(500).json({ error: 'Scan failed. Please try again.' })
  }
}

function detectChatbots(html: string) {
  const htmlLower = html.toLowerCase()
  const detections: any[] = []

  for (const pattern of CHATBOT_PATTERNS) {
    const matches = pattern.patterns.filter(p => htmlLower.includes(p.toLowerCase()))
    if (matches.length > 0) {
      detections.push({
        name: pattern.name,
        type: pattern.type,
        confidence: matches.length >= 2 ? 'HIGH' : 'MEDIUM',
        evidence: `Found: ${matches.join(', ')}`,
      })
    }
  }

  return detections
}

function getUrlAnalysisPrompt(url: string, htmlExcerpt: string, detectionCount: number, language: 'en' | 'zh-TW'): string {
  if (language === 'zh-TW') {
    return `你是 AI 整合顧問。已掃描網站${detectionCount > 0 ? '並偵測到 AI 聊天機器人' : '但未偵測到已知的 AI 聊天機器人'}。

URL: ${url}
HTML 摘錄: ${htmlExcerpt}

請分析並回傳 JSON 格式：
{
  "grade": "N/A",
  "score": 0,
  "summary": "簡短總結（1 句話）",
  "vulnerabilities": [],
  "positives": [],
  "overallRecommendation": "",
  "detectedTech": ["React", "Tailwind CSS"],
  "aiIntegrationPotential": {
    "suitableFeatures": ["具體功能1", "具體功能2"],
    "businessValue": "1 句話",
    "implementationPriority": "HIGH" | "MEDIUM" | "LOW"
  },
  "securityConsiderations": ["考量1", "考量2"]
}`
  }

  return `You are an AI integration consultant. ${detectionCount > 0 ? 'AI chatbot detected' : 'No known AI chatbot detected'} on the website.

URL: ${url}
HTML Excerpt: ${htmlExcerpt}

Analyze and return JSON format:
{
  "grade": "N/A",
  "score": 0,
  "summary": "Brief summary (1 sentence)",
  "vulnerabilities": [],
  "positives": [],
  "overallRecommendation": "",
  "detectedTech": ["React", "Tailwind CSS"],
  "aiIntegrationPotential": {
    "suitableFeatures": ["Feature 1", "Feature 2"],
    "businessValue": "1 sentence",
    "implementationPriority": "HIGH" | "MEDIUM" | "LOW"
  },
  "securityConsiderations": ["Consideration 1", "Consideration 2"]
}`
}
