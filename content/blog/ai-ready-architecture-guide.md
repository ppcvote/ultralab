---
title: "為什麼你的 SaaS 需要「預留 AI 接口」？我們用三個產品驗證的架構設計"
slug: ai-ready-architecture-guide
date: "2026-03-05"
description: "從只用 Gemini 到 Multi-LLM 容錯架構 — Ultra Lab 三個產品踩過的坑、學到的事、以及你現在就該做的 7 件事。"
tags: ["AI", "Architecture", "SaaS", "Multi-LLM", "MCP"]
author: "Min Yi Chen"
readTime: "12 min"
---

## TL;DR

你現在建的每一個系統，三年內都會被問：「這能接 AI 嗎？」

如果你的答案是「要重寫」，你就輸了。如果你的答案是「已經接好了，開就行」，你就贏了。

這篇文章是我們用三個上線產品（Mind Threads、UltraProbe、Ultra Advisor）踩坑後整理的實戰指南。不是理論，是正在跑的 code。

---

## 現況：一個 API Key 撐起三個產品

先說實話。我們三個產品目前都只用 Google Gemini：

| 產品 | AI 用途 | 模型 |
|------|---------|------|
| Mind Threads | 社群文案生成（35篇/天） | Gemini 2.0 Flash |
| UltraProbe | AI 安全掃描（12 攻擊向量） | Gemini 2.5 Flash |
| Ultra Advisor | 保單 OCR + 產品分類 | Gemini 2.0 Flash |

這在初期是對的。Gemini Flash 免費額度夠大、速度夠快、中文能力堪用。但這個架構有三個致命問題：

### 問題一：單點故障

2026 年 2 月 Google 出了一次 API 限流事件，我們三個產品同時掛掉。一個 API key、一個供應商、三個產品。這不是架構，這是賭博。

### 問題二：場景錯配

Gemini Flash 對「生成社群文案」很好，但對「精確的安全分析」和「結構化 OCR」不夠穩定。不同任務需要不同模型，但我們被綁死在一個。

### 問題三：無法升級

客戶問：「你的系統能串 Claude 嗎？能用 GPT-4o 嗎？」我們的回答只能是：「可以，但要改 code。」這不是產品化的回答。

---

## 解法：AI-Ready 架構的 7 個設計原則

以下是我們正在實施的改造，每一條都來自真實的踩坑經驗。

### 原則 1：Model Router — 不綁死任何一家

```typescript
// 錯誤做法：直接 import 特定 SDK
import { GoogleGenerativeAI } from '@google/generative-ai'

// 正確做法：統一介面 + 路由
interface AIProvider {
  generate(prompt: string, config: AIConfig): Promise<AIResponse>
}

const router = createAIRouter({
  primary: 'gemini-2.5-flash',
  fallback: ['claude-sonnet-4-6', 'gpt-4o-mini'],
  routing: {
    'content-generation': 'gemini',    // 文案用 Gemini（快）
    'security-analysis': 'claude',      // 安全分析用 Claude（精確）
    'structured-extraction': 'gemini',  // OCR 用 Gemini（多模態）
    'code-generation': 'claude',        // 程式碼用 Claude（邏輯）
  }
})
```

**為什麼重要**：模型更新速度是按月計的。今天最強的模型，三個月後可能被超越。你的架構不該因為換模型就要改 business logic。

### 原則 2：Prompt Template Registry — Prompt 是資產，不是字串

我們犯的最大錯誤：把 prompt 直接寫死在 API handler 裡。

```typescript
// 錯誤做法：prompt 散落在各個 API 檔案
const ANALYSIS_PROMPT = `你是專精於 prompt injection 防禦的 AI 安全稽核員...`

// 正確做法：集中管理 + 版本控制
const promptRegistry = {
  'probe.scan-prompt': {
    version: '2.1',
    template: loadTemplate('probe/scan-prompt.md'),
    model: 'claude-sonnet-4-6',
    temperature: 0.3,
    maxTokens: 4096,
    schema: ScanResultSchema,  // Zod schema for validation
  },
  'threads.generate-post': {
    version: '1.4',
    template: loadTemplate('threads/generate-post.md'),
    model: 'gemini-2.0-flash',
    temperature: 1.0,
    maxTokens: 1024,
  }
}
```

**為什麼重要**：Prompt 是你最核心的 IP。散落在 code 裡你無法追蹤哪個版本效果好、無法 A/B 測試、無法讓非工程師優化。

### 原則 3：Response Cache — 相同問題不要問兩次

Ultra Advisor 做對了一件事：保單產品分類結果存到 Firestore cache。同一個保險產品，第二次查詢直接回 cache，不打 Gemini。

```typescript
// Ultra Advisor 的快取策略（已上線）
async function lookupProduct(insurer: string, name: string) {
  const cached = await db.collection('productCache')
    .where('insurer', '==', insurer)
    .where('productName', '==', name)
    .limit(1).get()

  if (!cached.empty) {
    await cached.docs[0].ref.update({
      searchCount: FieldValue.increment(1)
    })
    return cached.docs[0].data()
  }

  // Cache miss — call Gemini
  const result = await gemini.generate(classifyPrompt(insurer, name))
  await db.collection('productCache').add({ ...result, insurer, name })
  return result
}
```

**效果**：相同產品查詢從 2-3 秒降到 50ms，Gemini API 費用減少 60%。

### 原則 4：Structured Output — AI 回的東西必須可驗證

UltraProbe 踩過的坑：Gemini 有時候回的 JSON 格式不對，整個掃描結果就壞了。

```typescript
// 正確做法：用 Zod 驗證 AI 輸出
import { z } from 'zod'

const ScanResultSchema = z.object({
  grade: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  score: z.number().min(0).max(100),
  vulnerabilities: z.array(z.object({
    name: z.string(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
    finding: z.string().max(100),
    suggestion: z.string().max(100),
  }))
})

// AI 回傳後立即驗證
const raw = await aiRouter.generate(prompt)
const parsed = ScanResultSchema.safeParse(JSON.parse(raw))
if (!parsed.success) {
  // Retry with stricter prompt, or fallback to another model
}
```

**為什麼重要**：AI 輸出是不確定的。你的系統不能因為 AI 回了一個怪格式就 500 Error。

### 原則 5：BYOK（Bring Your Own Key）— 讓客戶用自己的 key

Mind Threads 已經實作了這個模式：用戶可以在設定頁面輸入自己的 Gemini API key，繞過平台的用量限制。

```typescript
// Mind Threads 的 BYOK 實作
async function getApiKey(userId: string) {
  const settings = await db.collection('userSettings').doc(userId).get()
  const userKey = settings.data()?.geminiApiKey

  if (userKey) {
    return { key: userKey, source: 'user', unlimited: true }
  }

  return { key: process.env.GEMINI_API_KEY, source: 'platform', unlimited: false }
}
```

**為什麼重要**：
- 降低你的 API 成本
- 讓 Pro 用戶不受平台限制
- 未來可以支援多家模型的 key（Gemini key、OpenAI key、Anthropic key）

### 原則 6：MCP Server — 讓你的系統能被 AI Agent 呼叫

這是 2026 最重要的趨勢。MCP（Model Context Protocol）讓 AI Agent 可以直接操作你的系統。

Ultra KB 已經是 Agent-Ready 架構（Notion 知識庫可被 AI 讀寫），但我們還沒有正式的 MCP Server。規劃中的接口：

```typescript
// 規劃中的 MCP Server 工具定義
const tools = [
  {
    name: 'ultraprobe_scan',
    description: '掃描一段 System Prompt 的安全漏洞',
    input: { prompt: 'string', language: 'zh-TW | en' },
    output: { grade: 'A-F', vulnerabilities: 'array' }
  },
  {
    name: 'ultrakb_query',
    description: '從知識庫查詢特定主題的文件',
    input: { query: 'string', collection: 'string' },
    output: { documents: 'array', relevance: 'number' }
  },
  {
    name: 'threads_generate',
    description: '生成一篇 Threads 貼文',
    input: { topic: 'string', persona: 'viral|knowledge|story|quote' },
    output: { content: 'string', hashtags: 'array' }
  }
]
```

**為什麼重要**：當 Claude Desktop、Cursor、Windsurf 這些工具的用戶可以直接呼叫你的服務，你就不只是 SaaS，你是 AI 生態系的一部分。

### 原則 7：Observability — AI 呼叫必須可追蹤

我們現在缺的最嚴重的東西：AI 呼叫的可觀測性。

```typescript
// 每一次 AI 呼叫都應該記錄
interface AICallLog {
  id: string
  timestamp: Date
  model: string
  provider: string
  endpoint: string              // 哪個 API 觸發的
  promptTokens: number
  completionTokens: number
  latencyMs: number
  cost: number                  // 估算成本
  success: boolean
  retryCount: number
  cacheHit: boolean
  userId?: string               // 誰觸發的
}
```

**為什麼重要**：你不知道每個月花多少錢在 AI 上、哪個功能最耗 token、哪個模型最常失敗。沒有數據，就沒有優化。

---

## 我們的實施路線圖

### Phase 1（現在）— 品牌層
- [x] 所有服務標註 AI-Ready 能力
- [x] 文件化現有 AI 整合點
- [x] 統一 prompt 管理規範

### Phase 2（Q2 2026）— 技術層
- [ ] 建立 AI Router middleware（multi-model）
- [ ] 所有 prompt 遷移到 template registry
- [ ] 加入 Zod schema 驗證所有 AI 輸出
- [ ] 實作 response cache 層

### Phase 3（Q3 2026）— 生態層
- [ ] UltraProbe MCP Server
- [ ] Ultra KB 語意搜尋（RAG）
- [ ] AI Observability Dashboard
- [ ] 客戶 BYOK 支援多家模型

---

## 你現在就該做的事

不管你的產品在什麼階段，這三件事成本最低、價值最高：

1. **把 AI 呼叫抽成獨立函數**。不要在 business logic 裡直接 `fetch(gemini_url)`。一個 `aiService.generate()` 就夠了。

2. **把 prompt 獨立成檔案**。`.md` 或 `.txt` 都行，不要寫死在 code 裡。

3. **記錄每一次 AI 呼叫的 token 數和延遲**。`console.log` 就好，之後再建 dashboard。

這三件事加起來不到半天，但它們決定了你的系統三年後是「可以接 AI」還是「要重寫」。

---

## 結語

AI 不是功能，是基礎設施。

就像你不會等到需要搜尋時才加資料庫索引，你也不該等到客戶問「能接 AI 嗎」時才開始改架構。

我們用三個產品、數萬次 API 呼叫驗證了這套方法論。它不完美，但它正在運作。

如果你正在建 SaaS，現在就預留 AI 接口。未來的你會感謝現在的你。

---

*Min Yi Chen — Founder, Ultra Creation Co., Ltd.*
*目前運營 6 個 AI 產品，日均 AI 呼叫 200+ 次*

**想讓你的系統 AI-Ready？** [免費諮詢](https://ultralab.tw/#contact)
