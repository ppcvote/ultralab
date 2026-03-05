# UltraProbe API — Complete Guide

## 🎯 Overview

UltraProbe is an AI-powered security scanner that analyzes AI prompts and system instructions for vulnerabilities. It detects 10 major attack vectors and provides actionable security recommendations.

**Production Endpoint:** `https://ultralab.tw/api/v1/scan-prompt`

---

## 🔑 Authentication

All API requests require a Bearer token in the `Authorization` header:

```bash
Authorization: Bearer up_live_YOUR_API_KEY
```

**Your API Key:**
```
up_live_0da7ecf117700d9fc8fa5a90bd81da740c9bb321d395a3277232b25060c2036d
```

⚠️ **Security:** Store this key securely. Never commit it to version control.

---

## 📊 Pricing Tiers

| Tier | Price | Monthly Limit | Rate Limit |
|------|-------|---------------|------------|
| **Free** | $0 | 100 scans | 5/hour |
| **Pro** | $0.01/scan | Unlimited | 100/hour |
| **Enterprise** | Custom | Unlimited | Custom |

Current Tier: **Free** (100 scans/month)

---

## 🚀 Quick Start

### cURL Example

```bash
curl -X POST https://ultralab.tw/api/v1/scan-prompt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer up_live_0da7ecf117700d9fc8fa5a90bd81da740c9bb321d395a3277232b25060c2036d" \
  -d '{
    "prompt": "You are a helpful assistant. Answer user questions."
  }'
```

### Node.js Example

```javascript
const response = await fetch('https://ultralab.tw/api/v1/scan-prompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer up_live_YOUR_API_KEY'
  },
  body: JSON.stringify({
    prompt: 'You are a helpful assistant. Answer user questions.'
  })
})

const data = await response.json()
console.log('Grade:', data.analysis.grade)
console.log('Score:', data.analysis.score)
console.log('Vulnerabilities:', data.analysis.vulnerabilities)
```

### Python Example

```python
import requests

response = requests.post(
    'https://ultralab.tw/api/v1/scan-prompt',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer up_live_YOUR_API_KEY'
    },
    json={
        'prompt': 'You are a helpful assistant. Answer user questions.'
    }
)

data = response.json()
print(f"Grade: {data['analysis']['grade']}")
print(f"Score: {data['analysis']['score']}/100")
```

---

## 📡 API Reference

### `POST /api/v1/scan-prompt`

Analyzes a system prompt for security vulnerabilities.

#### Request Body

```typescript
{
  prompt: string      // 20-10,000 characters (required)
  language?: 'en' | 'zh-TW'  // Default: 'en'
}
```

#### Response (Success - 200 OK)

```typescript
{
  ok: true,
  analysis: {
    grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
    score: number,  // 0-100
    summary: string,
    vulnerabilities: [
      {
        id: string,
        name: string,
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        finding: string,
        suggestion: string
      }
    ],
    positives: string[],
    overallRecommendation: string
  },
  usage: {
    current: number,
    limit: number,
    tier: 'free' | 'pro' | 'enterprise'
  }
}
```

#### Error Responses

| Status | Error | Reason |
|--------|-------|--------|
| **400** | `Missing or invalid "prompt" field` | Prompt not provided or wrong type |
| **400** | `Prompt must be at least 20 characters.` | Prompt too short |
| **400** | `Prompt cannot exceed 10,000 characters.` | Prompt too long |
| **401** | `Missing or invalid Authorization header` | No Bearer token |
| **401** | `Invalid or expired API key` | API key not found |
| **429** | `Usage limit exceeded` | Monthly limit reached |
| **500** | `Scan failed. Please try again.` | Server error |

---

## 🔍 Attack Vectors Detected

UltraProbe analyzes 10 major security vulnerabilities:

1. **Role Escape** — Attempts to break out of assigned AI role
2. **Instruction Override** — Malicious instructions that override system rules
3. **Output Format Manipulation** — Exploiting output format to inject code
4. **Data Extraction/Leakage** — Tricks to extract sensitive training data
5. **Multi-language Bypass** — Using non-English to evade filters
6. **Unicode/Homoglyph Attacks** — Visual deception with similar characters
7. **Context Window Overflow** — Overwhelming context to drop rules
8. **Indirect Prompt Injection** — Injecting via external data sources
9. **Social Engineering** — Manipulating AI via persuasion
10. **Output Weaponization** — Using AI output as attack vector

---

## 📈 Grade Scale

| Grade | Score | Security Level |
|-------|-------|----------------|
| **A** | 90-100 | Excellent — Production-ready |
| **B** | 80-89 | Good — Minor improvements needed |
| **C** | 70-79 | Moderate — Security gaps exist |
| **D** | 60-69 | Poor — Major vulnerabilities |
| **E** | 50-59 | Very Poor — High risk |
| **F** | 0-49 | Critical — Extremely vulnerable |

---

## 🧪 Testing

Run the included test suite:

```bash
node test-ultraprobe-api.js
```

This will test 4 prompts ranging from insecure (Grade F) to secure (Grade B).

---

## ⚡ Rate Limiting

- **Free Tier:** 5 requests per hour, 100 per month
- **Pro Tier:** 100 requests per hour, unlimited monthly
- **Enterprise:** Custom limits

**Headers returned:**
- `X-RateLimit-Remaining` — Scans remaining this hour
- `X-RateLimit-Reset` — Unix timestamp when limit resets

---

## 🐛 Troubleshooting

### Error: "Invalid or expired API key"

- Verify you're using the correct API key
- Ensure `Bearer ` prefix is included in Authorization header
- Check that key hasn't been revoked

### Error: "Usage limit exceeded"

- Free tier: 100/month limit reached
- Upgrade to Pro tier or wait until next month

### Error: "Prompt must be at least 20 characters"

- System prompts shorter than 20 chars are too simple to analyze meaningfully

### Error: "Scan failed. Please try again."

- Server error during analysis
- Retry the request
- If persists, contact support

---

## 📞 Support

- **Email:** contact@ultralab.tw
- **Documentation:** https://ultralab.tw/docs
- **Status:** https://status.ultralab.tw

---

## 🔐 Security Best Practices

1. **Never expose your API key** in client-side code
2. **Use environment variables** to store keys
3. **Rotate keys regularly** (every 90 days)
4. **Monitor usage** for anomalies
5. **Implement rate limiting** on your side
6. **Validate inputs** before sending to API

---

## 📜 Changelog

### v1.0.0 (2026-02-28)

- ✅ Initial release
- ✅ 10 attack vector detection
- ✅ English + Traditional Chinese support
- ✅ Free tier: 100 scans/month
- ✅ JSON output format

---

*Last updated: 2026-02-28*
