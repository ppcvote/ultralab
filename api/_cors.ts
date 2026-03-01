import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  'https://ultralab.tw',
  'https://www.ultralab.tw',
  'http://localhost:5173',  // Vite dev
  'http://localhost:4173',  // Vite preview
]

/**
 * Set CORS headers based on origin whitelist
 * @returns true if request is OPTIONS (preflight), false otherwise
 */
export function setCorsHeaders(
  req: VercelRequest,
  res: VercelResponse
): boolean {
  const origin = req.headers.origin

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  } else {
    // Fallback to main domain for direct requests
    res.setHeader('Access-Control-Allow-Origin', 'https://ultralab.tw')
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')

  // Return true if this is a preflight request
  return req.method === 'OPTIONS'
}
