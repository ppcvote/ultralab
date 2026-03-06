import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

const HASH_KEY = process.env.PAYUNI_HASH_KEY || ''
const HASH_IV = process.env.PAYUNI_HASH_IV || ''

function decryptAES(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV)
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // PAYUNi redirects user here after payment (POST with EncryptInfo + HashInfo)
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  try {
    const { EncryptInfo } = req.body

    if (!EncryptInfo) {
      return res.redirect(302, '/minyi?order=error')
    }

    const decrypted = decryptAES(EncryptInfo)
    const params = new URLSearchParams(decrypted)
    const status = params.get('Status') || ''
    const merTradeNo = params.get('MerTradeNo') || ''

    if (status === 'SUCCESS') {
      return res.redirect(302, `/minyi?order=success&trade=${merTradeNo}`)
    } else {
      return res.redirect(302, `/minyi?order=failed&trade=${merTradeNo}`)
    }
  } catch (err) {
    console.error('PAYUNi return error:', err)
    return res.redirect(302, '/minyi?order=error')
  }
}
