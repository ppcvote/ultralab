import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || ''
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.users?.[0]?.email || null
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify Firebase auth
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  const email = await verifyFirebaseToken(token)
  if (!email || email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Validate input
  const { to, subject, html } = req.body
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  // Send via Resend — wrap in proper HTML with charset
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`
  const resend = new Resend(RESEND_API_KEY)
  try {
    const result = await resend.emails.send({
      from: 'Ultra Lab <contact@ultralab.tw>',
      to,
      subject,
      html: fullHtml,
    })
    return res.status(200).json({ ok: true, id: result.data?.id })
  } catch (err) {
    console.error('Email send failed:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
