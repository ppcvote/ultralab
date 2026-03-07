import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from './_firebase.js'
import { createProbeLeadPage } from './_notion.js'
import { setCorsHeaders } from './_cors.js'
import { isValidEmail as validateEmail } from './_validation.js'

interface CollectEmailRequest {
  email: string
  scanType: 'prompt' | 'url' | 'newsletter'
  metadata?: {
    grade?: string
    score?: number
    vulnerabilityCount?: number
  }
}

const TG_API = 'https://api.telegram.org/bot'

function unsubPage(message: string, success: boolean) {
  const color = success ? '#10B981' : '#FF6A6A'
  return `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>取消訂閱 — Ultra Lab</title></head>
<body style="margin:0;padding:0;background:#0A0515;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="text-align:center;padding:40px;max-width:400px;">
<h1 style="color:#CE4DFF;font-size:24px;font-weight:800;margin:0 0 16px;">ULTRA LAB</h1>
<p style="color:${color};font-size:16px;margin:0 0 24px;">${message}</p>
<a href="https://ultralab.tw" style="color:#8A5CFF;font-size:14px;">← 回到首頁</a>
</div></body></html>`
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
  if (setCorsHeaders(req, res)) {
    return res.status(200).end()
  }

  // GET: one-click unsubscribe
  if (req.method === 'GET' && req.query.unsubscribe) {
    try {
      const emailB64 = req.query.unsubscribe as string
      const email = Buffer.from(emailB64, 'base64url').toString('utf-8')
      if (!email || !email.includes('@')) {
        return res.status(400).send(unsubPage('連結無效。', false))
      }
      const db = getAdminDb()
      const snap = await db.collection('subscribers').where('email', '==', email.toLowerCase()).limit(1).get()
      if (snap.empty) {
        return res.status(200).send(unsubPage('此 email 未在訂閱名單中。', true))
      }
      await snap.docs[0].ref.update({ status: 'unsubscribed', unsubscribedAt: new Date() })
      return res.status(200).send(unsubPage('已成功取消訂閱。你不會再收到 Ultra Lab 週報。', true))
    } catch {
      return res.status(500).send(unsubPage('處理失敗，請稍後再試。', false))
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, scanType, metadata }: CollectEmailRequest = req.body || {}

  // Validate email
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: '請提供有效的 Email 地址。' })
  }

  if (!validateEmail(email.trim())) {
    return res.status(400).json({ error: 'Email 格式不正確或使用免洗信箱。' })
  }

  // Validate scanType
  if (!scanType || !['prompt', 'url', 'newsletter'].includes(scanType)) {
    return res.status(400).json({ error: 'scanType 必須是 "prompt"、"url" 或 "newsletter"。' })
  }

  try {
    // Newsletter subscription — separate flow
    if (scanType === 'newsletter') {
      const db = getAdminDb()
      const normalizedEmail = email.trim().toLowerCase()
      const existing = await db.collection('subscribers').where('email', '==', normalizedEmail).limit(1).get()
      if (!existing.empty) {
        return res.status(200).json({ ok: true, message: '你已經訂閱了！', returning: true })
      }
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
      await db.collection('subscribers').add({
        email: normalizedEmail,
        source: 'blog',
        createdAt: new Date(),
        ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        status: 'active',
      })
      // TG notification for new subscriber
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (token && chatId) {
        fetch(`${TG_API}${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `📧 <b>新電子報訂閱！</b>\n\n<b>Email:</b> <code>${normalizedEmail}</code>`,
            parse_mode: 'HTML',
          }),
        }).catch(() => {})
      }
      return res.status(200).json({ ok: true, message: '訂閱成功！每週會收到 AI 自動化實戰筆記。', new: true })
    }

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
