import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, phone, lineId, contactMethod, company, service, budget, message } = req.body

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const contactMethodLabel = contactMethod === 'line' ? 'LINE' : contactMethod === 'phone' ? '電話' : 'Email'

  const html = `
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
  `

  try {
    await transporter.sendMail({
      from: `"Ultra Lab" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER!,
      subject: `[新客戶] ${name} — ${service}`,
      html,
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Email send failed:', err)
    return res.status(500).json({ error: 'Failed to send notification' })
  }
}
