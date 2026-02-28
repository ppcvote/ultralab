import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from './_firebase.js'
import { createProbeLeadPage } from './_notion.js'

interface CollectEmailRequest {
  email: string
  scanType: 'prompt' | 'url'
  metadata?: {
    grade?: string
    score?: number
    vulnerabilityCount?: number
  }
}

const TG_API = 'https://api.telegram.org/bot'

// Simple email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

async function notifyTelegram(email: string, scanType: string, metadata?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('[Telegram] Bot token or chat ID not configured, skipping notification')
    return
  }

  const metadataText = metadata
    ? `\n<b>結果:</b> ${metadata.grade || 'N/A'} (${metadata.score || 0}/100)\n<b>漏洞:</b> ${metadata.vulnerabilityCount || 0} 個`
    : ''

  const text = [
    `🔍 <b>UltraProbe 新 Lead!</b>`,
    ``,
    `<b>Email:</b> <code>${email}</code>`,
    `<b>掃描類型:</b> ${scanType === 'prompt' ? 'Prompt 掃描' : 'URL 掃描'}${metadataText}`,
    ``,
    `👉 <a href="https://ultralab.tw/admin">開啟後台</a>`,
  ].join('\n')

  try {
    await fetch(`${TG_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    console.log('[Telegram] Notification sent for:', email)
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, scanType, metadata }: CollectEmailRequest = req.body || {}

  // Validate email
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: '請提供有效的 Email 地址。' })
  }

  if (!isValidEmail(email.trim())) {
    return res.status(400).json({ error: 'Email 格式不正確。' })
  }

  // Validate scanType
  if (!scanType || !['prompt', 'url'].includes(scanType)) {
    return res.status(400).json({ error: 'scanType 必須是 "prompt" 或 "url"。' })
  }

  try {
    const db = getAdminDb()
    const normalizedEmail = email.trim().toLowerCase()

    // Check if email already exists
    const existingLeads = await db
      .collection('probe_leads')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get()

    const now = new Date()
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    if (!existingLeads.empty) {
      // Email exists - update lastSeenAt
      const docRef = existingLeads.docs[0].ref
      const existingData = existingLeads.docs[0].data()

      await docRef.update({
        lastSeenAt: now,
        scanCount: (existingData.scanCount || 1) + 1,
        lastScanType: scanType,
        lastMetadata: metadata || null,
      })

      console.log('[Email Collection] Updated existing lead:', normalizedEmail)

      // Don't notify Telegram for returning users
      return res.status(200).json({
        ok: true,
        message: '感謝您！完整報告已解鎖。',
        returning: true,
      })
    } else {
      // New email - create new lead
      const docRef = await db.collection('probe_leads').add({
        email: normalizedEmail,
        scanType,
        metadata: metadata || null,
        source: 'ultraprobe',
        createdAt: now,
        lastSeenAt: now,
        scanCount: 1,
        ip,
        userAgent,
        status: 'active',
      })

      console.log('[Email Collection] New lead created:', normalizedEmail)

      // Notify via Telegram for new leads (fire-and-forget)
      notifyTelegram(normalizedEmail, scanType, metadata).catch(() => {})

      // Sync to Notion for new leads (fire-and-forget)
      createProbeLeadPage({
        email: normalizedEmail,
        scanType,
        grade: metadata?.grade,
        score: metadata?.score,
        vulnerabilityCount: metadata?.vulnerabilityCount,
        scanCount: 1,
        status: 'active',
        source: 'ultraprobe',
        createdAt: now,
        lastSeenAt: now,
        ip,
        userAgent,
        firestoreId: docRef.id,
      }).catch((err) => {
        console.error('[Notion] Probe lead sync failed:', err)
      })

      return res.status(200).json({
        ok: true,
        message: '感謝您！完整報告已解鎖。',
        new: true,
      })
    }
  } catch (error) {
    console.error('[Email Collection] Error:', error)
    return res.status(500).json({
      error: '儲存失敗，請稍後再試。',
    })
  }
}
