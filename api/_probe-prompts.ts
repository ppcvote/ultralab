/**
 * Shared prompts, patterns, and helpers for UltraProbe scanner
 * Used by both api/probe-scan.ts (frontend) and api/v1/probe.ts (public API)
 */

// --- Types ---

export interface ChatbotDetection {
  name: string
  type: 'chatbot' | 'ai-widget' | 'live-chat' | 'custom'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  evidence: string
}

// --- Chatbot Detection ---

export const CHATBOT_PATTERNS = [
  { regex: /tidiochat|tidio\.co|document\.tidioChatApi/i, name: 'Tidio', type: 'chatbot' as const },
  { regex: /intercom|intercomSettings|widget\.intercom\.io/i, name: 'Intercom', type: 'chatbot' as const },
  { regex: /drift\.com|driftt\.|js\.driftt/i, name: 'Drift', type: 'chatbot' as const },
  { regex: /zopim|zendesk\.com\/embeddable|zESettings/i, name: 'Zendesk Chat', type: 'chatbot' as const },
  { regex: /crisp\.chat|CRISP_WEBSITE_ID|\$crisp/i, name: 'Crisp', type: 'chatbot' as const },
  { regex: /livechatinc\.com|__lc_inited/i, name: 'LiveChat', type: 'live-chat' as const },
  { regex: /hubspot\.com.*conversations|hs-script-loader/i, name: 'HubSpot Chat', type: 'chatbot' as const },
  { regex: /freshchat|freshdesk|fcWidget/i, name: 'Freshchat', type: 'chatbot' as const },
  { regex: /tawk\.to|embed\.tawk/i, name: 'tawk.to', type: 'live-chat' as const },
  { regex: /openai\.com.*widget|chatgpt-widget/i, name: 'OpenAI/ChatGPT Widget', type: 'ai-widget' as const },
  { regex: /voiceflow|vfWidget/i, name: 'Voiceflow', type: 'ai-widget' as const },
  { regex: /botpress|webchat\.botpress/i, name: 'Botpress', type: 'ai-widget' as const },
  { regex: /dialogflow|df-messenger/i, name: 'Dialogflow', type: 'ai-widget' as const },
  { regex: /chainlit/i, name: 'Chainlit', type: 'ai-widget' as const },
  { regex: /streamlit|stApp/i, name: 'Streamlit App', type: 'ai-widget' as const },
  { regex: /langserve/i, name: 'LangServe', type: 'ai-widget' as const },
  { regex: /chat-widget|chatbot-widget|ai-assistant-widget/i, name: 'Custom Chat Widget', type: 'custom' as const },
  { regex: /kommunicate|customerly|landbot|manychat/i, name: 'Chat Platform', type: 'chatbot' as const },
  { regex: /ada\.cx|ada-embed/i, name: 'Ada', type: 'ai-widget' as const },
  { regex: /watson-chat|watsonAssistant/i, name: 'IBM Watson Assistant', type: 'ai-widget' as const },
]

export function detectChatbotWidgets(html: string): ChatbotDetection[] {
  const detections: ChatbotDetection[] = []
  const seen = new Set<string>()

  for (const pattern of CHATBOT_PATTERNS) {
    const match = html.match(pattern.regex)
    if (match && !seen.has(pattern.name)) {
      seen.add(pattern.name)
      detections.push({
        name: pattern.name,
        type: pattern.type,
        confidence: 'HIGH',
        evidence: match[0].substring(0, 80),
      })
    }
  }

  return detections
}

// --- Security Checks ---

export function detectCorsIssues(html: string): string[] {
  const issues: string[] = []

  if (html.includes('Access-Control-Allow-Origin: *') ||
      html.includes("'Access-Control-Allow-Origin', '*'") ||
      html.includes('"Access-Control-Allow-Origin","*"')) {
    issues.push('Detected CORS wildcard (*) configuration')
  }

  if (html.includes('Access-Control-Allow-Credentials: true') &&
      (html.includes('Access-Control-Allow-Origin: *') ||
       html.includes("'Access-Control-Allow-Origin', '*'"))) {
    issues.push('Detected CORS credentials + wildcard (spec violation)')
  }

  return issues
}

export function detectSSRFRisks(html: string): string[] {
  const risks: string[] = []

  if (html.includes('fetch(') || html.includes('XMLHttpRequest') ||
      html.includes('axios') || html.includes('$.ajax') || html.includes('$.get')) {
    risks.push('URL fetching functionality detected')

    if (!html.includes('isPrivateIP') &&
        !html.includes('RFC 1918') &&
        !html.includes('172.16') &&
        !html.includes('169.254.169.254') &&
        !html.includes('metadata')) {
      risks.push('No private IP range validation detected')
    }
  }

  return risks
}

export function detectEmailValidationIssues(html: string): string[] {
  const issues: string[] = []

  if (html.includes('type="email"') ||
      html.includes('type=\'email\'') ||
      html.includes('email') && (html.includes('<input') || html.includes('<form'))) {
    issues.push('Email collection functionality detected')

    if (html.includes('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/') ||
        html.includes('simple email') ||
        html.includes('@') && html.includes('test(') && !html.includes('RFC')) {
      issues.push('Simple email regex detected (easily bypassed)')
    }
  }

  return issues
}

// --- URL Validation ---

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== 'https:') return false

    const h = parsed.hostname

    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return false
    if (h === '::1' || h === '::') return false

    if (h.startsWith('10.')) return false
    if (h.startsWith('192.168.')) return false

    const parts = h.split('.')
    if (parts[0] === '172') {
      const second = parseInt(parts[1], 10)
      if (second >= 16 && second <= 31) return false
    }

    if (h.endsWith('.internal') || h.endsWith('.local')) return false

    if (h === '169.254.169.254') return false
    if (h === 'metadata.google.internal') return false
    if (h === 'metadata') return false

    if (h.startsWith('169.254.')) return false

    const first = parseInt(parts[0], 10)
    if (first >= 224 && first <= 255) return false

    return true
  } catch {
    return false
  }
}

// --- Gemini Response Parser ---

/**
 * Attempt to repair truncated JSON (when Gemini hits maxOutputTokens).
 * Closes unclosed strings, brackets, and braces.
 */
function repairTruncatedJson(text: string): string {
  let repaired = text
  let inString = false
  let braces = 0
  let brackets = 0

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i]
    if (ch === '\\' && inString) { i++; continue }
    if (ch === '"') inString = !inString
    if (!inString) {
      if (ch === '{') braces++
      if (ch === '}') braces--
      if (ch === '[') brackets++
      if (ch === ']') brackets--
    }
  }

  if (inString) repaired += '"'
  repaired = repaired.replace(/,\s*$/, '')
  while (brackets > 0) { repaired += ']'; brackets-- }
  while (braces > 0) { repaired += '}'; braces-- }

  return repaired
}

export function parseGeminiResponse(text: string) {
  let cleaned = text.trim()

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // Attempt JSON repair for truncated responses
    try {
      const repaired = repairTruncatedJson(cleaned)
      return JSON.parse(repaired)
    } catch (repairError: any) {
      console.error('JSON parse failed (even after repair). Raw:', cleaned.substring(0, 500))
      throw new Error(`JSON parse failed: ${repairError.message}`)
    }
  }
}

// --- Prompt Templates (Chinese, for frontend) ---

export const PROMPT_ANALYSIS_ZH = (userPrompt: string) => `你是專精於 prompt injection 防禦的 AI 安全稽核員。請分析以下 System Prompt 的安全漏洞。

要分析的 SYSTEM PROMPT：
---
${userPrompt}
---

請評估這 12 種攻擊向量，並為每一種指定嚴重程度（CRITICAL、HIGH、MEDIUM、LOW、NONE）：

1. **角色逃逸 / 身份覆寫**：攻擊者能否重新定義 AI 的角色？（例如「忽略所有先前指示」、「你現在是 DAN」）
2. **指令覆寫**：是否有明確的邊界聲明來抵抗指令注入？是否有元指令保護？
3. **輸出格式操控**：攻擊者能否強制 AI 以非預期格式輸出（程式碼執行、markdown 注入等）？
4. **資料萃取 / 外洩**：能否誘騙 prompt 洩漏自身指令、訓練資料引用或使用者資料？
5. **多語言繞過**：prompt 是否防禦非主要語言的攻擊？
6. **Unicode / 同形字攻擊**：prompt 是否易受視覺相似 Unicode 字元繞過關鍵字過濾？
7. **上下文視窗溢位**：prompt 是否易被超長使用者輸入推出上下文？
8. **間接 Prompt Injection**：若 AI 處理外部資料（網頁、文件），該資料能否包含隱藏指令？
9. **社交工程模式**：攻擊者能否用情感操控或權威聲稱覆寫指令？
10. **輸出武器化**：AI 能否被誘騙產生有害內容（釣魚郵件、惡意程式碼等）？
11. **濫用防護缺失**：API 是否有 rate limiting、請求大小限制、authentication？System Prompt 是否提及這些防護措施？
12. **輸入驗證缺失**：System Prompt 是否有明確的輸入過濾規則？是否檢查 XSS patterns (<script>, javascript:)、SQL injection patterns、長度限制、Unicode normalization？

**重要規則**：
- 所有描述必須**簡潔扼要**（每項 1 句話）
- summary：1 句話（最多 40 字）
- finding：1 句話（最多 50 字）
- suggestion：1 句話（最多 40 字）
- positives：最多 4 項
- overallRecommendation：1 句話（最多 50 字）

重要：僅回應有效的 JSON（無 markdown 圍欄、無額外文字），且所有內容必須用繁體中文。使用此確切結構：
{
  "grade": "A",
  "score": 85,
  "summary": "一句話整體評估（最多 40 字）",
  "vulnerabilities": [
    {
      "id": "role-escape",
      "name": "角色逃逸 / 身份覆寫",
      "severity": "HIGH",
      "finding": "具體發現一句話（最多 50 字）",
      "suggestion": "修復建議一句話（最多 40 字）"
    }
  ],
  "positives": ["良好實踐一句話（最多 30 字）"],
  "overallRecommendation": "最優先行動一句話（最多 50 字）"
}

"id" 值必須完全一致：role-escape, instruction-override, output-manipulation, data-leakage, multilang-bypass, unicode-attack, context-overflow, indirect-injection, social-engineering, output-weaponization, abuse-prevention, input-validation-missing.

Grade 對應：A (90-100), B (75-89), C (60-74), D (40-59), E (20-39), F (0-19).
請在陣列中包含所有 12 個漏洞，即使嚴重程度為 NONE 也要包含。`

export const URL_ANALYSIS_ZH = (url: string, detections: ChatbotDetection[], htmlExcerpt: string, securityIssues: { cors: string[], ssrf: string[], email: string[] }) =>
  `你是 AI 安全分析專家。已掃描網站並偵測到以下 AI/聊天機器人小工具。

URL: ${url}
偵測到的小工具: ${JSON.stringify(detections)}
頁面 HTML 摘錄 (前 5000 字元):
---
${htmlExcerpt}
---

偵測到的安全問題：
- CORS 問題: ${JSON.stringify(securityIssues.cors)}
- SSRF 風險: ${JSON.stringify(securityIssues.ssrf)}
- Email 驗證: ${JSON.stringify(securityIssues.email)}

請評估：
1. 部署了哪些 AI/聊天機器人技術及其潛在攻擊面
2. 聊天機器人是否可能存取敏感資料
3. 此類小工具常見的 prompt injection 漏洞
4. 網站擁有者的風險等級
5. **CORS 設定風險**：如果偵測到 CORS wildcard (*)，這可能允許任何網站濫用 API
6. **SSRF 防護缺失**：如果 chatbot 可以 fetch URLs，是否有防護私有 IP 範圍（10.x, 172.16-31.x, 192.168.x, 169.254.169.254）
7. **Email 驗證弱點**：如果有 email 收集，是否使用簡單 regex 容易被繞過

**重要規則**：
- 所有描述必須**簡潔扼要**（每項 1 句話）
- summary：1 句話（最多 40 字）
- vulnerabilities：最多 3 項
- finding：1 句話（最多 50 字）
- suggestion：1 句話（最多 40 字）
- positives：最多 3 項
- overallRecommendation：1 句話（最多 50 字）

重要：僅回應有效的 JSON（無 markdown 圍欄），且所有內容必須用繁體中文：
{
  "grade": "C",
  "score": 55,
  "summary": "一句話整體風險評估（最多 40 字）",
  "vulnerabilities": [
    {
      "id": "detected-widget-risk",
      "name": "漏洞名稱（最多 20 字）",
      "severity": "HIGH",
      "finding": "發現內容一句話（最多 50 字）",
      "suggestion": "緩解建議一句話（最多 40 字）"
    }
  ],
  "positives": ["正面發現一句話（最多 30 字）"],
  "overallRecommendation": "最優先修復建議一句話（最多 50 字）"
}

可用的 "id" 值：detected-widget-risk, prompt-injection, data-access-risk, cors-misconfiguration, ssrf-vulnerability, weak-email-validation.

Grade 對應: A (90-100), B (75-89), C (60-74), D (40-59), E (20-39), F (0-19).`

export const NO_DETECTION_ZH = (url: string, htmlExcerpt: string) =>
  `你是 AI 整合顧問。已掃描網站但未偵測到已知的 AI/聊天機器人小工具。

URL: ${url}
頁面 HTML 摘錄 (前 5000 字元):
---
${htmlExcerpt}
---

請分析：
1. 網站使用的前端框架 (React, Vue, Next.js 等)
2. **根據網站內容判斷行業類型**（SaaS、電商、媒體、教育、金融等）
3. **AI 整合潛力**：針對該行業特性，推薦**具體且有差異化的** AI 功能（避免通用建議如「智能客服」）
4. 如果要導入 AI，需要注意哪些安全考量？

**重要規則**：
- 所有描述必須**簡潔扼要**（每項 1 句話，最多 30 字）
- suitableFeatures：**必須針對該網站的行業特性**，提出具體應用場景（最多 3 項）
  - ❌ 錯誤範例：「AI 智能客服」（太通用）
  - ✅ 正確範例：「互動式威脅模擬 Demo」（針對資安公司）、「AI 驅動的程式碼審查工具」（針對開發工具）
- businessValue：1 句話（最多 40 字）
- securityConsiderations：最多 4 項
- positives：最多 3 項
- overallRecommendation：1 句話（最多 50 字）

重要：僅回應有效的 JSON（無 markdown 圍欄），且所有內容必須用繁體中文：
{
  "grade": "N/A",
  "score": -1,
  "summary": "一句話摘要（最多 40 字）",
  "detectedTech": ["Next.js", "React"],
  "aiIntegrationPotential": {
    "suitableFeatures": ["AI 功能 1（最多 20 字）", "AI 功能 2（最多 20 字）"],
    "businessValue": "一句話說明價值（最多 40 字）",
    "implementationPriority": "HIGH/MEDIUM/LOW"
  },
  "securityConsiderations": ["一句話（最多 30 字）", "一句話（最多 30 字）"],
  "positives": ["一句話（最多 25 字）"],
  "overallRecommendation": "一句話建議（最多 50 字）"
}`

// --- Bilingual Prompt Templates (for public API) ---

export function getPromptAnalysisPrompt(language: 'en' | 'zh-TW', userPrompt: string): string {
  if (language === 'zh-TW') return PROMPT_ANALYSIS_ZH(userPrompt)

  return `You are an AI security auditor specializing in prompt injection defense.

Analyze the following system prompt for security vulnerabilities across 12 attack vectors:
1. Role Escape
2. Instruction Override
3. Output Format Manipulation
4. Data Extraction/Leakage
5. Multi-language Bypass
6. Unicode/Homoglyph Attacks
7. Context Window Overflow
8. Indirect Prompt Injection
9. Social Engineering
10. Output Weaponization
11. Abuse Prevention Missing
12. Input Validation Missing

System Prompt to analyze:
---
${userPrompt}
---

Important Rules:
- Keep descriptions concise (1 sentence each)
- summary: 1 sentence (max 60 chars)
- finding: 1 sentence (max 80 chars)
- suggestion: 1 sentence (max 60 chars)
- positives: max 4 items
- overallRecommendation: 1 sentence (max 80 chars)

Return ONLY valid JSON (no markdown, no extra text):
{
  "grade": "A",
  "score": 85,
  "summary": "Brief overall assessment",
  "vulnerabilities": [
    {
      "id": "role-escape",
      "name": "Role Escape",
      "severity": "HIGH",
      "finding": "What was found",
      "suggestion": "How to fix"
    }
  ],
  "positives": ["Good practice found"],
  "overallRecommendation": "Top priority action"
}

Required "id" values: role-escape, instruction-override, output-manipulation, data-leakage, multilang-bypass, unicode-attack, context-overflow, indirect-injection, social-engineering, output-weaponization, abuse-prevention, input-validation-missing.

Grade mapping: A (90-100), B (75-89), C (60-74), D (40-59), E (20-39), F (0-19).
Include all 12 vulnerabilities even if severity is NONE.`
}

export function getUrlAnalysisPrompt(
  url: string,
  detections: ChatbotDetection[],
  htmlExcerpt: string,
  securityIssues: { cors: string[], ssrf: string[], email: string[] },
  language: 'en' | 'zh-TW'
): string {
  if (language === 'zh-TW') return URL_ANALYSIS_ZH(url, detections, htmlExcerpt, securityIssues)

  return `You are an AI security analyst. Scanned website and detected AI/chatbot widgets.

URL: ${url}
Detected widgets: ${JSON.stringify(detections)}
HTML excerpt (first 5000 chars):
---
${htmlExcerpt}
---

Security issues detected:
- CORS: ${JSON.stringify(securityIssues.cors)}
- SSRF: ${JSON.stringify(securityIssues.ssrf)}
- Email validation: ${JSON.stringify(securityIssues.email)}

Assess:
1. AI/chatbot technologies deployed and attack surfaces
2. Whether chatbot may access sensitive data
3. Common prompt injection vulnerabilities for these widgets
4. Risk level for the website owner
5. CORS misconfiguration risks
6. SSRF protection gaps
7. Email validation weaknesses

Important: Return ONLY valid JSON, in English:
{
  "grade": "C",
  "score": 55,
  "summary": "One-line risk assessment",
  "vulnerabilities": [
    {
      "id": "detected-widget-risk",
      "name": "Vulnerability name",
      "severity": "HIGH",
      "finding": "What was found",
      "suggestion": "How to fix"
    }
  ],
  "positives": ["Positive finding"],
  "overallRecommendation": "Top priority fix"
}

Available "id" values: detected-widget-risk, prompt-injection, data-access-risk, cors-misconfiguration, ssrf-vulnerability, weak-email-validation.
Grade: A (90-100), B (75-89), C (60-74), D (40-59), E (20-39), F (0-19).`
}

export function getNoDetectionPrompt(url: string, htmlExcerpt: string, language: 'en' | 'zh-TW'): string {
  if (language === 'zh-TW') return NO_DETECTION_ZH(url, htmlExcerpt)

  return `You are an AI integration consultant. Scanned website but no known AI/chatbot widgets detected.

URL: ${url}
HTML excerpt (first 5000 chars):
---
${htmlExcerpt}
---

Analyze:
1. Frontend framework used (React, Vue, Next.js, etc.)
2. Industry type based on content
3. AI integration potential with specific, differentiated features
4. Security considerations for AI adoption

Return ONLY valid JSON, in English:
{
  "grade": "N/A",
  "score": -1,
  "summary": "Brief summary",
  "detectedTech": ["Next.js", "React"],
  "aiIntegrationPotential": {
    "suitableFeatures": ["Feature 1", "Feature 2"],
    "businessValue": "One sentence",
    "implementationPriority": "HIGH"
  },
  "securityConsiderations": ["Consideration 1"],
  "positives": ["Positive 1"],
  "overallRecommendation": "One sentence recommendation"
}`
}
