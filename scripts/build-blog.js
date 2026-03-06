/**
 * Blog Build Script
 * Converts markdown files in content/blog/ to static HTML pages in dist/blog/
 * Each page has unique meta tags, Article JSON-LD, and full HTML content for SEO.
 * Also regenerates sitemap.xml to include all blog posts.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { marked } from 'marked'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content', 'blog')
const DIST_DIR = path.join(ROOT, 'dist')
const BLOG_DIST = path.join(DIST_DIR, 'blog')
const SITE_URL = 'https://ultralab.tw'

// Configure marked for good typography
marked.setOptions({
  gfm: true,
  breaks: false,
})

function readingTime(text) {
  // Chinese: ~400 chars/min, English: ~200 words/min
  const charCount = text.length
  const minutes = Math.ceil(charCount / 400)
  return Math.max(1, minutes)
}

function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDateISO(date) {
  return new Date(date).toISOString()
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wordCount(text) {
  // Chinese chars + English words
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 0).length
  return chineseChars + englishWords
}

function generateArticleJsonLd(post, url) {
  const wc = wordCount(post.content || '')
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': post.description,
    'image': post.ogImage || `${SITE_URL}/og-image.png`,
    'author': [
      {
        '@type': 'Person',
        'name': 'Min Yi Chen',
        'alternateName': '陳旻毅',
        'jobTitle': 'Founder & CTO',
        'url': 'https://www.threads.net/@minyi.chen',
        'worksFor': { '@type': 'Organization', 'name': 'Ultra Lab' },
      },
      {
        '@type': 'Organization',
        'name': 'Ultra Lab',
        'url': SITE_URL,
      },
    ],
    'publisher': {
      '@type': 'Organization',
      'name': 'Ultra Lab',
      'url': SITE_URL,
      'logo': { '@type': 'ImageObject', 'url': `${SITE_URL}/logo.svg`, 'width': 512, 'height': 512 },
    },
    'datePublished': formatDateISO(post.date),
    'dateModified': formatDateISO(post.updated || post.date),
    'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
    'inLanguage': 'zh-TW',
    'wordCount': wc,
    'articleSection': (post.tags && post.tags[0]) || 'AI 技術',
    'keywords': (post.tags || []).join(', '),
    'isAccessibleForFree': true,
    'copyrightHolder': { '@type': 'Organization', 'name': 'Ultra Lab' },
    'copyrightYear': new Date(post.date).getFullYear(),
  }, null, 2)
}

function generateBreadcrumbJsonLd(post, slug) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Ultra Lab', 'item': SITE_URL },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${SITE_URL}/blog` },
      { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': `${SITE_URL}/blog/${slug}` },
    ],
  }, null, 2)
}

function generateBlogPostHtml(post, htmlContent, slug) {
  const url = `${SITE_URL}/blog/${slug}`
  const readTime = readingTime(post.content || '')

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <meta name="theme-color" content="#0A0515" />
  <meta name="color-scheme" content="dark" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

  <title>${escapeHtml(post.title)} | Ultra Lab Blog</title>
  <meta name="description" content="${escapeHtml(post.description)}" />
  <meta name="keywords" content="${escapeHtml((post.tags || []).join(', '))}" />
  <link rel="canonical" href="${url}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(post.description)}" />
  <meta property="og:image" content="${post.ogImage || SITE_URL + '/og-image.png'}" />
  <meta property="og:locale" content="zh_TW" />
  <meta property="og:site_name" content="Ultra Lab" />
  <meta property="article:published_time" content="${formatDateISO(post.date)}" />
  ${post.updated ? `<meta property="article:modified_time" content="${formatDateISO(post.updated)}" />` : ''}
  ${(post.tags || []).map(t => `<meta property="article:tag" content="${escapeHtml(t)}" />`).join('\n  ')}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(post.title)}" />
  <meta name="twitter:description" content="${escapeHtml(post.description)}" />
  <meta name="twitter:image" content="${post.ogImage || SITE_URL + '/og-image.png'}" />

  <script type="application/ld+json">
  ${generateArticleJsonLd(post, url)}
  </script>

  <script type="application/ld+json">
  ${generateBreadcrumbJsonLd(post, slug)}
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/blog.css" />
</head>
<body>
  <nav class="blog-nav">
    <div class="blog-nav-inner">
      <a href="/" class="blog-nav-brand">
        <svg viewBox="0 0 320 420" width="20" height="28">
          <defs>
            <linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#CE4DFF"/><stop offset="100%" stop-color="#8A5CFF"/></linearGradient>
            <linearGradient id="gt" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#10B981"/></linearGradient>
          </defs>
          <path fill="none" stroke="url(#gp)" stroke-width="18" stroke-linecap="round" d="M 90,40 C 90,160 130,220 242,380"/>
          <path fill="none" stroke="url(#gt)" stroke-width="18" stroke-linecap="round" d="M 230,40 C 230,160 190,220 78,380"/>
          <path fill="none" stroke="#E8E0FF" stroke-width="12" stroke-linecap="round" opacity="0.6" d="M 91.5,314 L 228.5,314"/>
        </svg>
        <span>ULTRA LAB</span>
      </a>
      <div class="blog-nav-links">
        <a href="/blog">Blog</a>
        <a href="https://discord.gg/ewS4rWXvWk" target="_blank" rel="noopener noreferrer">Discord</a>
        <a href="/#contact">聯繫我們</a>
      </div>
    </div>
  </nav>

  <main class="blog-main">
    <article class="blog-article">
      <header class="blog-header">
        <div class="blog-meta">
          ${(post.tags || []).map(t => `<span class="blog-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="blog-info">
          <time datetime="${formatDateISO(post.date)}">${formatDate(post.date)}</time>
          <span class="blog-dot">&middot;</span>
          <span>${readTime} 分鐘閱讀</span>
        </div>
      </header>

      <div class="blog-content">
        ${htmlContent}
      </div>
    </article>

    <!-- CTA -->
    <section class="blog-cta">
      <h2>需要技術協助？</h2>
      <p>Ultra Lab 提供從社群自動化到 SaaS 建置的完整技術服務。免費諮詢，24 小時內回覆。</p>
      <div class="blog-cta-buttons">
        <a href="/#contact" class="blog-cta-btn">免費諮詢</a>
        <a href="https://discord.gg/ewS4rWXvWk" target="_blank" rel="noopener noreferrer" class="blog-cta-btn blog-cta-btn-discord">加入 Discord 社群</a>
      </div>
    </section>
  </main>

  <footer class="blog-footer">
    <p>&copy; 2026 Ultra Lab &middot; 傲創實業股份有限公司</p>
  </footer>
</body>
</html>`
}

function generateBlogIndexHtml(posts) {
  const postCards = posts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(p => `
      <a href="/blog/${p.slug}" class="blog-card">
        <div class="blog-card-tags">
          ${(p.tags || []).map(t => `<span class="blog-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.description)}</p>
        <div class="blog-card-meta">
          <time datetime="${formatDateISO(p.date)}">${formatDate(p.date)}</time>
          <span class="blog-dot">&middot;</span>
          <span>${readingTime(p.content || '')} 分鐘閱讀</span>
        </div>
      </a>
    `).join('')

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <meta name="theme-color" content="#0A0515" />
  <meta name="color-scheme" content="dark" />
  <meta name="robots" content="index, follow" />

  <title>Blog — Ultra Lab 技術部落格</title>
  <meta name="description" content="Ultra Lab 技術部落格：社群自動化、SaaS 建置、AI 應用的實戰教學與深度分析。" />
  <link rel="canonical" href="${SITE_URL}/blog" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${SITE_URL}/blog" />
  <meta property="og:title" content="Blog — Ultra Lab 技術部落格" />
  <meta property="og:description" content="社群自動化、SaaS 建置、AI 應用的實戰教學與深度分析。" />
  <meta property="og:image" content="${SITE_URL}/og-image.png" />
  <meta property="og:locale" content="zh_TW" />
  <meta property="og:site_name" content="Ultra Lab" />

  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Ultra Lab Blog',
    'description': '社群自動化、SaaS 建置、AI 應用的實戰教學與深度分析',
    'url': `${SITE_URL}/blog`,
    'inLanguage': 'zh-TW',
    'isPartOf': { '@type': 'WebSite', 'name': 'Ultra Lab', 'url': SITE_URL },
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': posts.length,
      'itemListElement': posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((p, i) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'url': `${SITE_URL}/blog/${p.slug}`,
          'name': p.title,
        })),
    },
  }, null, 2)}
  </script>

  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Ultra Lab', 'item': SITE_URL },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${SITE_URL}/blog` },
    ],
  }, null, 2)}
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/blog.css" />
</head>
<body>
  <nav class="blog-nav">
    <div class="blog-nav-inner">
      <a href="/" class="blog-nav-brand">
        <svg viewBox="0 0 320 420" width="20" height="28">
          <defs>
            <linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#CE4DFF"/><stop offset="100%" stop-color="#8A5CFF"/></linearGradient>
            <linearGradient id="gt" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#10B981"/></linearGradient>
          </defs>
          <path fill="none" stroke="url(#gp)" stroke-width="18" stroke-linecap="round" d="M 90,40 C 90,160 130,220 242,380"/>
          <path fill="none" stroke="url(#gt)" stroke-width="18" stroke-linecap="round" d="M 230,40 C 230,160 190,220 78,380"/>
          <path fill="none" stroke="#E8E0FF" stroke-width="12" stroke-linecap="round" opacity="0.6" d="M 91.5,314 L 228.5,314"/>
        </svg>
        <span>ULTRA LAB</span>
      </a>
      <div class="blog-nav-links">
        <a href="/blog" class="active">Blog</a>
        <a href="/#contact">聯繫我們</a>
      </div>
    </div>
  </nav>

  <main class="blog-main">
    <header class="blog-index-header">
      <span class="terminal-tag">cat /blog/*</span>
      <h1>Ultra Lab Blog</h1>
      <p>社群自動化、SaaS 建置、AI 應用的實戰教學與深度分析</p>
    </header>

    <div class="blog-grid">
      ${postCards}
    </div>

    <!-- Discord CTA -->
    <section class="blog-cta" style="margin-top: 48px;">
      <h2>加入 AI 技術社群</h2>
      <p>4 個 AI Agent 即時服務 — 資安掃描、Threads 自動化、理財規劃，每日自動更新內容。</p>
      <div class="blog-cta-buttons">
        <a href="https://discord.gg/ewS4rWXvWk" target="_blank" rel="noopener noreferrer" class="blog-cta-btn">加入 Discord</a>
      </div>
    </section>
  </main>

  <footer class="blog-footer">
    <p>&copy; 2026 Ultra Lab &middot; 傲創實業股份有限公司</p>
  </footer>
</body>
</html>`
}

function generateSitemap(posts) {
  const blogUrls = posts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(p => `  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${new Date(p.updated || p.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/probe</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
${blogUrls}
</urlset>`
}

// ========== Main ==========

console.log('[blog] Building blog...')

// Read all markdown files
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))

if (files.length === 0) {
  console.log('[blog] No blog posts found, skipping.')
  process.exit(0)
}

const posts = files.map(file => {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')
  const { data, content } = matter(raw)
  const slug = file.replace(/\.md$/, '')
  return { ...data, content, slug }
})

// Ensure dist/blog exists
fs.mkdirSync(BLOG_DIST, { recursive: true })

// Generate each post
for (const post of posts) {
  const htmlContent = marked(post.content)
  const postDir = path.join(BLOG_DIST, post.slug)
  fs.mkdirSync(postDir, { recursive: true })
  const html = generateBlogPostHtml(post, htmlContent, post.slug)
  fs.writeFileSync(path.join(postDir, 'index.html'), html)
  console.log(`[blog]   ✓ ${post.slug}`)
}

// Generate blog index
const indexHtml = generateBlogIndexHtml(posts)
fs.writeFileSync(path.join(BLOG_DIST, 'index.html'), indexHtml)
console.log('[blog]   ✓ blog/index.html')

// Update sitemap
const sitemap = generateSitemap(posts)
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap)
console.log('[blog]   ✓ sitemap.xml (updated with blog posts)')

// Generate posts.json for external consumers (Discord bot, RSS, etc.)
const postsJson = posts
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: new Date(p.date).toISOString().split('T')[0],
    tags: p.tags || [],
    readingTime: readingTime(p.content || ''),
    url: `${SITE_URL}/blog/${p.slug}`,
  }))
fs.writeFileSync(path.join(BLOG_DIST, 'posts.json'), JSON.stringify(postsJson, null, 2))
console.log('[blog]   ✓ blog/posts.json')

console.log(`[blog] Done — ${posts.length} posts built.`)
