import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

// Discord Interaction types
const PING = 1
const APPLICATION_COMMAND = 2
const PONG = 1
const CHANNEL_MESSAGE_WITH_SOURCE = 4
const PURPLE = 0x8A5CFF
const BLOG_URL = 'https://ultralab.tw/blog/posts.json'

// Required: disable body parsing to verify Ed25519 signature on raw bytes
export const config = { api: { bodyParser: false } }

function verifySignature(publicKey: string, sig: string, timestamp: string, body: string): boolean {
  try {
    return crypto.verify(
      'ed25519',
      Buffer.from(timestamp + body),
      Buffer.from(publicKey, 'hex'),
      Buffer.from(sig, 'hex'),
    )
  } catch {
    return false
  }
}

function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function fetchPosts(): Promise<any[]> {
  const res = await fetch(BLOG_URL)
  return res.json()
}

function blogEmbed(title: string, posts: any[], footer?: string) {
  return {
    title,
    url: 'https://ultralab.tw/blog',
    color: PURPLE,
    fields: posts.map(p => ({
      name: p.title,
      value: `[閱讀全文](${p.url}) · \`${p.date}\` · ${p.readingTime} 分鐘`,
      inline: false,
    })),
    ...(footer ? { footer: { text: footer } } : {}),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const publicKey = process.env.DISCORD_PUBLIC_KEY ?? ''
  const sig = req.headers['x-signature-ed25519'] as string
  const timestamp = req.headers['x-signature-timestamp'] as string
  const rawBody = await getRawBody(req)

  if (!sig || !timestamp || !verifySignature(publicKey, sig, timestamp, rawBody)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const body = JSON.parse(rawBody)

  // Discord verification ping
  if (body.type === PING) {
    return res.status(200).json({ type: PONG })
  }

  if (body.type === APPLICATION_COMMAND && body.data?.name === 'blog') {
    const sub = body.data?.options?.[0]

    let posts: any[]
    try {
      posts = await fetchPosts()
    } catch {
      return res.status(200).json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '⚠️ 無法取得部落格資料，請稍後再試。', flags: 64 },
      })
    }

    // /blog latest [count]
    if (sub?.name === 'latest') {
      const count = Math.max(1, Math.min(sub.options?.[0]?.value ?? 5, 10))
      return res.status(200).json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [blogEmbed('📚 Ultra Lab 最新文章', posts.slice(0, count), `共 ${posts.length} 篇 | ultralab.tw/blog`)],
        },
      })
    }

    // /blog search <keyword>
    if (sub?.name === 'search') {
      const kw = (sub.options?.[0]?.value ?? '').toLowerCase()
      const results = posts.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(kw))
      )

      if (!results.length) {
        return res.status(200).json({
          type: CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🔍 找不到關於「${kw}」的文章。完整列表：<https://ultralab.tw/blog>` },
        })
      }

      const show = results.slice(0, 5)
      const footer = results.length > 5 ? `顯示前 5 篇，共 ${results.length} 篇結果` : undefined
      return res.status(200).json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [{
            ...blogEmbed(`🔍 搜尋：${kw}`, show, footer),
            description: `找到 ${results.length} 篇相關文章`,
          }],
        },
      })
    }
  }

  return res.status(400).json({ error: 'Unknown interaction' })
}
