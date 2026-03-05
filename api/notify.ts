import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { createInquiryPage } from './_notion.js'

const TG_API = 'https://api.telegram.org/bot'

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  await fetch(`${TG_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, phone, lineId, contactMethod, company, service, budget, message, source, refCode } = req.body || {}

  const isMinYi = source === 'minyi-page'

  // Track Agent referral if refCode present
  if (refCode && typeof refCode === 'string') {
    try {
      const { getFirestore, Timestamp } = await import('firebase-admin/firestore')
      const { initFirebaseAdmin } = await import('./_firebase.js')
      initFirebaseAdmin()
      const db = getFirestore()
      const partnerQuery = await db.collection('agent_partners').where('refCode', '==', refCode).limit(1).get()
      if (!partnerQuery.empty) {
        const partnerRef = partnerQuery.docs[0].ref
        await partnerRef.update({ totalReferrals: (partnerQuery.docs[0].data().totalReferrals ?? 0) + 1 })
        await db.collection('agent_referrals').add({
          refCode, name, email, service: service ?? null, source,
          createdAt: Timestamp.now(), status: 'lead',
        })
      }
    } catch {}
  }
  const contactMethodLabel = contactMethod === 'line' ? 'LINE' : contactMethod === 'phone' ? '電話' : 'Email'

  // === Telegram notification ===
  const tgLines = isMinYi
    ? [
        `📩 <b>新諮詢（MinYi）</b>`,
        ``,
        `<b>姓名：</b>${name}`,
        `<b>電話：</b>${phone}`,
        `<b>Email：</b>${email}`,
        message ? `<b>想聊：</b>${message}` : '',
      ].filter(Boolean).join('\n')
    : [
        `🔔 <b>新客戶諮詢</b>`,
        ``,
        `<b>姓名：</b>${name}`,
        company ? `<b>公司：</b>${company}` : '',
        `<b>Email：</b>${email}`,
        phone ? `<b>電話：</b>${phone}` : '',
        lineId ? `<b>LINE：</b>${lineId}` : '',
        `<b>偏好聯繫：</b>${contactMethodLabel}`,
        `<b>服務：</b>${service}`,
        budget ? `<b>預算：</b>${budget}` : '',
        message ? `\n<b>需求：</b>\n${message}` : '',
        ``,
        `👉 <a href="https://ultralab.tw/admin">開啟後台</a>`,
      ].filter(Boolean).join('\n')

  // === Email notification via Resend ===
  const html = isMinYi
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1E40AF; margin-bottom: 16px;">新詢問 — 謝民義</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #666; width: 80px;">姓名</td><td style="padding: 6px 0; font-weight: bold;">${name}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">電話</td><td style="padding: 6px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
        ${message ? `<tr><td style="padding: 6px 0; color: #666;">想聊</td><td style="padding: 6px 0;">${message}</td></tr>` : ''}
      </table>
      <p style="margin-top: 16px; color: #999; font-size: 11px;">來自 ultralab.tw/minyi</p>
    </div>
  </body></html>`
    : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #8A5CFF; border-bottom: 2px solid #8A5CFF; padding-bottom: 8px;">
        Ultra Lab — 新客戶諮詢
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 8px 0; color: #666; width: 120px;">姓名</td><td style="padding: 8px 0; font-weight: bold;">${name}</td></tr>
        ${company ? `<tr><td style="padding: 8px 0; color: #666;">公司</td><td style="padding: 8px 0;">${company}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding: 8px 0; color: #666;">電話</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
        ${lineId ? `<tr><td style="padding: 8px 0; color: #666;">LINE ID</td><td style="padding: 8px 0;">${lineId}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #666;">偏好聯繫</td><td style="padding: 8px 0; font-weight: bold; color: #8A5CFF;">${contactMethodLabel}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">服務項目</td><td style="padding: 8px 0; font-weight: bold;">${service}</td></tr>
        ${budget ? `<tr><td style="padding: 8px 0; color: #666;">預算</td><td style="padding: 8px 0;">${budget}</td></tr>` : ''}
        ${message ? `<tr><td style="padding: 8px 0; color: #666;">需求描述</td><td style="padding: 8px 0;">${message}</td></tr>` : ''}
      </table>
      <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        來源：ultralab.tw 聯繫表單
      </p>
    </div>
  </body></html>`

  const results = { email: false, telegram: false, notion: false }

  try {
    const [emailResult, tgResult, notionResult] = await Promise.allSettled([
      (async () => {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: isMinYi
            ? 'Min Yi <minyi@ultralab.tw>'
            : 'Ultra Lab <contact@ultralab.tw>',
          to: process.env.VITE_ADMIN_EMAIL || 'risky9763@gmail.com',
          subject: isMinYi
            ? `[新詢問] ${name} — 財務諮詢`
            : `[新客戶] ${name} — ${service}`,
          html,
        })
        results.email = true
      })(),
      (async () => {
        await sendTelegram(tgLines)
        results.telegram = true
      })(),
      (async () => {
        await createInquiryPage({
          name,
          email,
          phone,
          lineId,
          company,
          service,
          budget,
          contactMethod,
          message,
          source: source || 'landing-page',
          createdAt: new Date(),
        })
        results.notion = true
      })(),
    ])

    if (emailResult.status === 'rejected') {
      console.error('Email failed:', emailResult.reason)
    }
    if (tgResult.status === 'rejected') {
      console.error('Telegram failed:', tgResult.reason)
    }
    if (notionResult.status === 'rejected') {
      console.error('Notion failed:', notionResult.reason)
    }

    return res.status(200).json({ ok: true, ...results })
  } catch (err) {
    console.error('Notification error:', err)
    return res.status(200).json({ ok: true, ...results })
  }
}
