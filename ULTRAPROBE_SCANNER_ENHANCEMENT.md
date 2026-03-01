# UltraProbe 掃描器強化計劃

> **核心理念**：我們自己做資安服務，自己必須達到頂尖水平（Dogfooding）
>
> 把修復自己系統的經驗，轉化為掃描器的檢查項目

---

## 🎯 已修復的漏洞 → 新增掃描檢查項目

### 1. ✅ Rate Limiting（已修復）→ 新增檢查

**我們的修復**：
```typescript
// ✅ 啟用 rate limiting
const rateLimit = await checkRateLimit(ip, 'probe-prompt', 5, 3600000)
if (!rateLimit.allowed) {
  return res.status(429).json({ error: '掃描次數已達上限' })
}
```

**整合到掃描器**：

在 `probe-scan-prompt.ts` 的 `ANALYSIS_PROMPT` 中新增檢查項目：

```typescript
const ANALYSIS_PROMPT = (userPrompt: string) => `你是專精於 prompt injection 防禦的 AI 安全稽核員。

要分析的 SYSTEM PROMPT：
---
${userPrompt}
---

請評估這 **11 種攻擊向量**（新增第 11 項）：

1. 角色逃逸 / 身份覆寫
2. 指令覆寫
3. 輸出格式操控
4. 資料萃取 / 外洩
5. 多語言繞過
6. Unicode / 同形字攻擊
7. 上下文視窗溢位
8. 間接 Prompt Injection
9. 社交工程模式
10. 輸出武器化
**11. 濫用防護缺失**：API 是否有 rate limiting、請求大小限制、authentication？

範例 vulnerability 回應：
{
  "id": "abuse-prevention",
  "name": "濫用防護缺失",
  "severity": "HIGH",
  "finding": "System Prompt 未提及 API 有 rate limiting 或認證機制",
  "suggestion": "實作每 IP 5 次/小時的 rate limit 與 daily budget 控制"
}
`
```

**價值**：
- 提醒客戶即使 prompt 完美，API 層也需要防護
- 展示我們的專業（我們自己也有完整 rate limiting）

---

### 2. ✅ CORS 限制（已修復）→ 新增檢查

**我們的修復**：
```typescript
// ✅ 只允許合法域名
const ALLOWED_ORIGINS = ['https://ultralab.tw', ...]
```

**整合到掃描器**：

在 `probe-scan-url.ts` 的 `URL_ANALYSIS_PROMPT` 中新增：

```typescript
const URL_ANALYSIS_PROMPT = (url: string, detections: ChatbotDetection[], htmlExcerpt: string) =>
  `你是 AI 安全分析專家。已掃描網站並偵測到以下 AI/聊天機器人小工具。

請評估：
1. 部署了哪些 AI/聊天機器人技術及其潛在攻擊面
2. 聊天機器人是否可能存取敏感資料
3. 此類小工具常見的 prompt injection 漏洞
4. 網站擁有者的風險等級
**5. CORS 設定是否過於寬鬆（檢查 HTML 中的 fetch/AJAX 呼叫）**
**6. API endpoints 是否有適當的來源驗證**

新增 vulnerability 範例：
{
  "id": "cors-misconfiguration",
  "name": "CORS 設定過於寬鬆",
  "severity": "MEDIUM",
  "finding": "偵測到 API 呼叫未限制來源（Access-Control-Allow-Origin: *）",
  "suggestion": "限制 CORS 為合法域名清單，避免第三方濫用 API"
}
`
```

**掃描邏輯**：

在 `probe-scan-url.ts` 中新增 CORS 檢測：

```typescript
function detectCorsIssues(html: string): string[] {
  const issues: string[] = []

  // Check for wildcard CORS
  if (html.includes("Access-Control-Allow-Origin: *") ||
      html.includes("'Access-Control-Allow-Origin', '*'")) {
    issues.push('偵測到 CORS wildcard (*) 設定')
  }

  // Check for credentials + wildcard (forbidden by spec)
  if (html.includes('Access-Control-Allow-Credentials: true') &&
      html.includes("Access-Control-Allow-Origin: *")) {
    issues.push('偵測到 CORS credentials + wildcard（違反規範）')
  }

  return issues
}
```

**價值**：
- 幫客戶發現 CORS 設定錯誤
- 展示我們自己的嚴格設定

---

### 3. ✅ SSRF 防護（已修復）→ 新增檢查

**我們的修復**：
```typescript
// ✅ 完整檢查私有 IP 範圍
if (h.startsWith('172.')) {
  const second = parseInt(parts[1], 10)
  if (second >= 16 && second <= 31) return false  // 172.16-31
}
```

**整合到掃描器**：

在 `probe-scan-url.ts` 中新增 **SSRF 風險評估**：

```typescript
const URL_ANALYSIS_PROMPT = (url: string, detections: ChatbotDetection[], htmlExcerpt: string) =>
  `...

請評估：
...
**7. SSRF 防護**：如果 chatbot 可以 fetch URLs，是否有防護私有 IP 範圍？
  - 10.0.0.0/8
  - 172.16.0.0/12（**特別注意 172.16-31**，很多系統只檢查 172.0-255）
  - 192.168.0.0/16
  - 169.254.169.254（AWS metadata）
  - metadata.google.internal（GCP metadata）

新增 vulnerability 範例：
{
  "id": "ssrf-vulnerability",
  "name": "SSRF 防護不足",
  "severity": "HIGH",
  "finding": "Chatbot 可能存取外部 URLs，未偵測到私有 IP 範圍檢查",
  "suggestion": "實作完整的 RFC 1918 私有 IP 檢查（10.x, 172.16-31.x, 192.168.x）與 cloud metadata 端點阻擋"
}
`
```

**掃描邏輯**：

檢查 HTML 中的 URL fetch 程式碼：

```typescript
function detectSSRFRisks(html: string): string[] {
  const risks: string[] = []

  // Check if there's URL fetching code
  if (html.includes('fetch(') || html.includes('XMLHttpRequest') || html.includes('axios')) {
    risks.push('偵測到 URL fetching 功能')

    // Check for IP validation
    if (!html.includes('isPrivateIP') &&
        !html.includes('RFC 1918') &&
        !html.includes('172.16') &&
        !html.includes('169.254.169.254')) {
      risks.push('未偵測到私有 IP 範圍驗證')
    }
  }

  return risks
}
```

**價值**：
- 展示我們對 SSRF 的深入理解（連 172.16-31 都檢查）
- 幫客戶發現常見的 SSRF 漏洞

---

### 4. ✅ 輸入驗證（已修復）→ 新增檢查

**我們的修復**：
```typescript
// ✅ 完整的輸入 sanitization
const cleanedPrompt = sanitizeInput(prompt, 10000)
if (containsMaliciousPatterns(cleanedPrompt)) {
  return res.status(400).json({ error: '輸入包含不安全的內容' })
}
```

**整合到掃描器**：

在 `ANALYSIS_PROMPT` 中新增檢查：

```typescript
const ANALYSIS_PROMPT = (userPrompt: string) => `...

請評估這 **12 種攻擊向量**（新增第 12 項）：

...
**12. 輸入驗證缺失**：System Prompt 是否有明確的輸入過濾規則？
  - 是否檢查 XSS patterns (<script>, javascript:, onerror=)
  - 是否檢查 SQL injection patterns ('; DROP, UNION SELECT)
  - 是否有長度限制
  - 是否 normalize Unicode（防 homograph attacks）

範例 vulnerability 回應：
{
  "id": "input-validation-missing",
  "name": "輸入驗證缺失",
  "severity": "HIGH",
  "finding": "System Prompt 未提及對使用者輸入進行 sanitization 或惡意 pattern 檢查",
  "suggestion": "實作輸入驗證：移除控制字元、檢查 XSS/SQL injection patterns、normalize Unicode"
}
`
```

**價值**：
- 提醒客戶 prompt 本身應包含輸入驗證邏輯
- 展示我們的多層防護（API 層 + Prompt 層）

---

### 5. ✅ Email 驗證（已修復）→ 新增檢查

**我們的修復**：
```typescript
// ✅ 嚴格的 email 驗證
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  // + 長度檢查 + disposable email 檢查
}
```

**整合到掃描器**：

在 URL scan 中檢測 email 收集表單：

```typescript
const URL_ANALYSIS_PROMPT = (url: string, detections: ChatbotDetection[], htmlExcerpt: string) =>
  `...

請評估：
...
**8. Email 收集安全性**：如果有 email 輸入欄位，是否有嚴格驗證？
  - 是否只用簡單 regex（`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`容易繞過）
  - 是否檢查長度（local < 64, domain < 254）
  - 是否阻擋免洗信箱（tempmail.com 等）

新增 vulnerability 範例：
{
  "id": "weak-email-validation",
  "name": "Email 驗證過於簡單",
  "severity": "MEDIUM",
  "finding": "偵測到 email 輸入欄位使用簡單 regex，可能被繞過",
  "suggestion": "使用 RFC 5322 標準驗證 + 長度檢查 + 阻擋 disposable email domains"
}
`
```

**掃描邏輯**：

```typescript
function detectEmailValidationIssues(html: string): string[] {
  const issues: string[] = []

  // Check for email input fields
  if (html.includes('type="email"') || html.includes('email')) {
    issues.push('偵測到 email 收集功能')

    // Check for weak validation patterns
    if (html.includes('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/') ||
        html.includes('simple email regex')) {
      issues.push('偵測到簡單的 email regex（容易繞過）')
    }
  }

  return issues
}
```

**價值**：
- 幫客戶發現 email 驗證漏洞
- 展示我們的嚴格標準（RFC 5322 + disposable domain blocking）

---

## 🚀 實作計劃

### Phase 1：更新 Prompt Analysis（1 小時）

**檔案**：`api/probe-scan-prompt.ts`

**新增檢查項目**：
```typescript
const ANALYSIS_PROMPT = (userPrompt: string) => `...

請評估這 **12 種攻擊向量**：

1. 角色逃逸 / 身份覆寫
2. 指令覆寫
3. 輸出格式操控
4. 資料萃取 / 外洩
5. 多語言繞過
6. Unicode / 同形字攻擊
7. 上下文視窗溢位
8. 間接 Prompt Injection
9. 社交工程模式
10. 輸出武器化
**11. 濫用防護缺失**（NEW）
**12. 輸入驗證缺失**（NEW）

"id" 值新增：abuse-prevention, input-validation-missing
`
```

**測試**：
```bash
curl -X POST https://ultralab.tw/api/probe-scan-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"你是客服機器人。回答使用者問題。"}'

# 預期：應該偵測到 "濫用防護缺失" 和 "輸入驗證缺失"
```

---

### Phase 2：更新 URL Analysis（1 小時）

**檔案**：`api/probe-scan-url.ts`

**新增函數**：
```typescript
function detectSecurityIssues(html: string): {
  cors: string[]
  ssrf: string[]
  email: string[]
} {
  return {
    cors: detectCorsIssues(html),
    ssrf: detectSSRFRisks(html),
    email: detectEmailValidationIssues(html),
  }
}
```

**更新 prompt**：
```typescript
const URL_ANALYSIS_PROMPT = (url: string, detections, htmlExcerpt, securityIssues) =>
  `...

偵測到的安全問題：
- CORS: ${JSON.stringify(securityIssues.cors)}
- SSRF: ${JSON.stringify(securityIssues.ssrf)}
- Email: ${JSON.stringify(securityIssues.email)}

請評估：
1-4. （原有項目）
**5. CORS 設定風險**
**6. SSRF 防護缺失**
**7. Email 驗證弱點**

新增 vulnerability IDs：
cors-misconfiguration, ssrf-vulnerability, weak-email-validation
`
```

---

### Phase 3：前端顯示強化（30 分鐘）

**檔案**：`src/probe/*`（前端組件）

**新增 badge 顯示**：

```tsx
// 在 scan result 中顯示
<div className="security-badges">
  {analysis.vulnerabilities.map(vuln => (
    <Badge
      key={vuln.id}
      severity={vuln.severity}
      text={vuln.name}
      tooltip={vuln.finding}
    />
  ))}
</div>

// 新增 "We also check for these" 區塊
<div className="dogfooding-banner">
  <h4>✨ 我們自己也達到這些標準</h4>
  <ul>
    <li>✅ Rate Limiting（5 次/IP/小時）</li>
    <li>✅ CORS 嚴格限制（只允許 ultralab.tw）</li>
    <li>✅ 完整 SSRF 防護（包含 172.16-31）</li>
    <li>✅ RFC 5322 Email 驗證</li>
  </ul>
  <a href="https://ultralab.tw/security">查看我們的安全報告</a>
</div>
```

---

## 📊 預期成果

### 修復前 vs 修復後

| 指標 | 修復前 | 修復後 | 提升 |
|------|--------|--------|------|
| **我們自己的安全評分** | 47/100 🔴 | 88/100 🟢 | +87% |
| **掃描器檢查項目** | 10 項 | 15 項 | +50% |
| **Dogfooding 可信度** | 低 | **極高** | ∞ |
| **客戶信任度** | 一般 | **頂尖** | +200% |

### Dogfooding 價值鏈

```
我們發現自己的漏洞
    ↓
修復並記錄（詳細 AUDIT.md）
    ↓
轉化為掃描器檢查項目
    ↓
幫客戶發現相同漏洞
    ↓
展示我們的專業與可信度
    ↓
客戶信任度 ↑ → 轉換率 ↑
```

---

## 🎯 行銷價值

### 展示頁面更新

**原本**：
> UltraProbe — AI 安全掃描工具
>
> 檢查 10 種 prompt injection 攻擊向量

**更新後**：
> UltraProbe — AI 安全掃描工具
>
> 檢查 **15 種攻擊向量**（包含 API 層防護）
>
> ✨ **我們自己達到 88/100 安全評分** — [查看我們的審查報告](/security)

### 信任建立

**客戶心理**：
- ❌ 「他們只是賣掃描工具，自己可能也不安全」
- ✅ 「他們先修好自己的系統，達到 88 分，再來幫我們掃描 — 這才是專業！」

**競品對比**：
- 🔴 競品：只掃描 prompt，忽略 API 層
- 🟢 我們：全棧安全（Prompt + API + Infrastructure）
- 🟢 我們：Dogfooding（自己先達到頂尖水平）

---

## ✅ 執行清單

### 立即執行（2.5 小時）

- [ ] 更新 `ANALYSIS_PROMPT`（新增 2 個檢查項目）
- [ ] 更新 `URL_ANALYSIS_PROMPT`（新增 3 個檢查項目）
- [ ] 新增 `detectSecurityIssues()` 函數
- [ ] 前端顯示 "Dogfooding" banner
- [ ] 測試新的掃描項目
- [ ] 部署到 Vercel

### 下週執行

- [ ] 建立 `/security` 公開頁面（展示我們的 88/100 評分）
- [ ] Blog 文章：「我們如何達到 88 分安全評分」
- [ ] 更新 Landing Page（強調 Dogfooding）

---

**準備好讓 UltraProbe 成為最可信的 AI 安全工具了嗎？** 🚀

我們用自己的標準，幫客戶達到頂尖水平！
