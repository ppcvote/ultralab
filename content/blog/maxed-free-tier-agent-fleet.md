---
title: "免費仔的極限：1,500 RPD 跑 105 個自動化任務，月成本 $0 的 AI Agent 頂配攻略"
slug: maxed-free-tier-agent-fleet
date: 2026-03-08
author: Ultra Lab
tags: [AI Agent, OpenClaw, Gemini, Token 優化, 免費方案, 自動化, 一人公司]
description: "大多數人用 Gemini 免費額度聊 15 次天。我們用同樣的 1,500 RPD 跑 25 個定時器、4 個 AI Agent、105 個日常任務，實現完整的商業自動化。月成本 $0。這篇文章公開完整架構、RPD 預算表、踩坑紀錄、和每一個優化技巧。"
og_image: /images/blog/agent-fleet-architecture.png
---

# 免費仔的極限：1,500 RPD 跑 105 個自動化任務，月成本 $0

> 「大多數人把 1,500 RPD 花在 15 次聊天。我們花在 105 個任務，營運一整間公司。」

我是 Ultra Lab 的創辦人，一個人在台灣經營技術服務品牌。沒有員工、沒有助理——4 隻 AI Agent 全年無休地幫我發文、回覆、追 lead、做研究、開策略會議。

全部跑在 Google Gemini 2.5 Flash **免費方案**上。月成本 $0。

這篇文章公開完整的架構設計、RPD 預算分配、踩過的坑、以及每一個讓免費額度發揮到極限的技巧。

---

## 為什麼要榨乾免費額度？

先講清楚數字。Gemini 2.5 Flash 免費方案給你：

- **1,500 RPD**（Requests Per Day）
- 每分鐘 15 次請求
- 每次最多 1M token context

大多數人怎麼用？開一個長對話，來回聊 20 輪，一次對話吃掉 100 RPD。聊 15 次，今天的額度就沒了。

但如果你把每個請求都設計成**短、精準、一次性**的任務呢？

1,500 RPD 突然變成了 1,500 個工作單元。這足夠跑一整間公司的自動化了。

---

## 架構概覽

```
┌─────────────────────────────────────────────────┐
│                 OpenClaw Gateway                 │
│            (WSL2 Ubuntu, port 18789)             │
├─────────┬──────────┬──────────┬─────────────────┤
│  Main   │MindThread│  Probe   │    Advisor       │
│ (CEO)   │ (社群)   │ (資安)   │   (顧問)         │
├─────────┴──────────┴──────────┴─────────────────┤
│              25 systemd timers                   │
│              62 bash/node scripts                │
│              19 intelligence .md files           │
├─────────────────────────────────────────────────┤
│  blogwatcher │ hn-trending │ summarize │ curl    │
│  (RSS)       │ (HN API)   │ (Jina)    │ (HTTP)  │
│         ↑ 全部 0 LLM cost（純 HTTP）↑           │
└─────────────────────────────────────────────────┘
```

4 個 Agent，各有專長：

| Agent | 角色 | Moltbook 帳號 |
|-------|------|---------------|
| UltraLabTW ⚡ | CEO + 品牌策略 | @ultralabtw |
| MindThreadBot 🧵 | 社群自動化專家 | @mindthreadbot |
| UltraProbeBot 🔍 | AI 資安研究員 | @ultraprobebot |
| UltraAdvisor 💰 | 財務顧問 | @ultraadvisor |

硬體：一台 Windows 桌機跑 WSL2，不需要 Mac Mini。

---

## 六層強化架構

這是讓 Agent Fleet 從「能用」到「頂配」的完整升級路徑。

### Layer 1：品質閘門（+16 RPD/天）

最簡單也最有效的升級。每篇文不再「生成即發」，而是：

```
生成初稿 (1 call)
    ↓
自我審查：「這篇 1-10 分？」(1 call)
    ↓
< 7 分 → 重寫 (1 call)
≥ 7 分 → 直接發
```

實作方式——在 autopost 腳本裡加一段：

```bash
# === Quality Gate ===
REVIEW_PROMPT="Review this draft. Score 1-10.
TITLE: ${TITLE}
CONTENT: ${CONTENT:0:500}

If >= 7: output APPROVED
If < 7: output REWRITE then a better TITLE:/--- version."

REVIEW=$(openclaw agent --agent main --message "$REVIEW_PROMPT")

if echo "$REVIEW" | grep -qi "REWRITE"; then
  # Parse rewritten version
  TITLE=$(echo "$REVIEW" | grep "^TITLE:" | head -1 | sed 's/^TITLE: *//')
  CONTENT=$(echo "$REVIEW" | sed '1,/^---$/d')
  log "Quality gate: REWRITE"
else
  log "Quality gate: APPROVED"
fi
```

**效果**：8 篇文 × 2 calls = 16 RPD。內容品質直接翻倍。

### Layer 2：數據驅動 Context（+0 RPD）

這層完全免費。把已經產生的情報檔注入發文 prompt：

```bash
# 注入自己的發文成效
PERF_FILE="$HOME/.openclaw/workspace/POST-PERFORMANCE.md"
if [ -f "$PERF_FILE" ]; then
  RESEARCH_CONTEXT="${RESEARCH_CONTEXT}$(head -30 "$PERF_FILE")"
fi

# 注入競品情報
COMP_FILE="$HOME/.openclaw/workspace/COMPETITOR-INTEL.md"
if [ -f "$COMP_FILE" ]; then
  RESEARCH_CONTEXT="${RESEARCH_CONTEXT}$(head -25 "$COMP_FILE")"
fi
```

Agent 寫文前就知道：
- 哪種標題拿高分（POST-PERFORMANCE.md）
- 競品在寫什麼（COMPETITOR-INTEL.md）
- 今天的科技趨勢（RESEARCH-NOTES.md）
- HN 熱門話題（hn-trending）

**效果**：0 額外 RPD，但內容從「LLM 想像」變成「數據驅動」。

### Layer 3：對話經營（+0-30 RPD/天）

大多數 Agent 在社群上是 drive-by：貼文 → 走人。我們不一樣。

```bash
# 追蹤對話深度
THREAD_DEPTH=$(node -e "
  const t = JSON.parse(require('fs').readFileSync('$THREAD_FILE','utf8'));
  console.log(t['$POST_ID'] || 0);
")

# 最多回覆 2 輪，避免無限循環
if [ "$THREAD_DEPTH" -ge 2 ]; then
  log "Thread depth limit reached, skipping"
  continue
fi
```

Reply-checker v2 會：
1. 偵測所有新留言（透過 Moltbook notifications API）
2. 追蹤每篇文的對話深度
3. 最多回覆 2 輪（避免燒 RPD）
4. 每則回覆都帶追問問題，延續對話

**效果**：社群從「公告板」變成「有溫度的對話」。

### Layer 4：Agent 互審（+0-8 RPD/天）

發文前讓另一個 Agent 過目：

```bash
# peer-review.sh — 交叉審稿
RESPONSE=$(openclaw agent --agent "$REVIEWER" --message \
  "Review this teammate's draft. APPROVED or SUGGESTION: [one fix]")
```

Main 的文讓 Probe 看：「有沒有安全相關可以補？」
Probe 的文讓 Main 看：「一般人看得懂嗎？」

**效果**：交叉視角 = 更少盲點。

### Layer 5：週策略會議（+5 RPD/週）

每週日 12:00 自動觸發：

```
Step 1: 3 個 Agent 各讀全部情報檔，提出下週 Top 3 優先事項
Step 2: Main (CEO) Agent 綜合所有提案，產出最終策略
Step 3: 寫入 STRATEGY-NEXT-WEEK.md → 全部 Agent 可讀
```

```bash
for AGENT in main mindthread probe; do
  RESPONSE=$(openclaw agent --agent "$AGENT" --message \
    "Based on this week's data, propose TOP 3 priorities for next week.
     $PERF_DATA $COMP_DATA $INQUIRY_DATA")
  PROPOSALS="${PROPOSALS}### ${AGENT}: ${RESPONSE}"
done

# CEO synthesizes
FINAL=$(openclaw agent --agent main --message \
  "Synthesize these proposals into next week's strategy: $PROPOSALS")
```

**效果**：Agent 不只執行，還會反思和規劃。

### Layer 6：主動研究鏈（+6-10 RPD/天）

```
blogwatcher (RSS) ──→ 新文章 URL
hn-trending (API) ──→ 高分 URL
         ↓
    summarize (Jina Reader) ──→ 全文 markdown
         ↓                        ↑ 0 LLM cost
    Agent 分析 (1 call) ──→ RESEARCH-NOTES.md
         ↓
    下次 autopost 引用真實資料
```

關鍵：RSS 監控、HN 抓取、URL 摘要全部是**純 HTTP**，0 LLM 成本。只有最後的「這對我們的客戶意味什麼？」才用到 1 次 LLM call。

```bash
# 只處理新 URL（seen list 去重）
SUMMARY=$(timeout 20 summarize "$URL" | head -c 2000)
ANALYSIS=$(openclaw agent --agent main --message \
  "Analyze this for business relevance: $SUMMARY")
echo "$ANALYSIS" >> RESEARCH-NOTES.md
```

---

## 完整 RPD 預算表

這是真實的每日消耗：

| 任務 | 頻率 | 日 RPD | 分類 |
|------|------|--------|------|
| Autopost × 4 agents | 2x/天 | 8 | 內容 |
| Quality gate 自評 | 每篇 1 次 | 8 | 內容 |
| Quality gate 重寫 | ~50% 觸發 | ~4 | 內容 |
| Engage × 4 agents | 1x/天 | 4 | 互動 |
| Reply-checker | 2x/天 | ~15 | 互動 |
| Cross-engage | 2x/週 | ~1 | 互動 |
| Research chain | 2x/天 | ~8 | 情報 |
| Daily reflect | 1x/天 | 4 | 運營 |
| Daily briefing | 1x/天 | 1 | 運營 |
| Auto-respond | 觸發式 | ~1 | 運營 |
| Lead follow-up | 觸發式 | ~1 | 運營 |
| Blog-to-social | 觸發式 | ~0.5 | 內容 |
| Weekly strategy | 週日 | ~0.7 | 策略 |
| **合計** | | **~56-105** | |
| **剩餘** | | **~1,395-1,444** | 給你跟 Agent 對話用 |

**RPD 利用率：3-7%。** 93% 的額度留給互動式使用。

---

## 完整日程表

```
05:00  ┃ research-chain → RESEARCH-NOTES.md
05:30  ┃ MindThread 數據同步 → MINDTHREAD-DATA.md
06:00  ┃ 客戶洞察同步 + 諮詢追蹤 → INQUIRY-STATUS.md
06:30  ┃ competitor-watch → COMPETITOR-INTEL.md
       ┃
07:00  ┃ autopost-probe (讀全部情報 → 品質閘門 → 發文)
08:00  ┃ autopost-main
09:00  ┃ autopost-mindthread
10:00  ┃ autopost-advisor + engage × 4 (交錯 15 分鐘)
       ┃
11:00  ┃ reply-checker（對話經營）
12:00  ┃ 諮詢追蹤（第 2 輪）
14:00  ┃ blog-to-social（如有新文章）
       ┃
17:00  ┃ research-chain（第 2 輪）+ daily-briefing
18:00  ┃ 諮詢追蹤（第 3 輪）
       ┃
19-22  ┃ autopost 第 2 輪（4 agents）
22:00  ┃ post-stats → POST-PERFORMANCE.md
23:00  ┃ reply-checker（第 2 輪）+ daily-reflect
       ┃
Sun 12 ┃ weekly-strategy → STRATEGY-NEXT-WEEK.md
Tue/Fri┃ cross-engage（跨 Agent 互動）
```

注意資料流的方向：**上游產出情報，下游消費情報**。Research chain 在 05:00 跑完，07:00 的 autopost 就能引用最新資料。Post-stats 在 22:00 跑完，隔天的 autopost 就知道什麼標題有效。

---

## 19 個情報檔案

每個 Agent 的工作目錄裡有這些 `.md` 檔，全部自動更新：

| 檔案 | 來源 | 更新頻率 |
|------|------|---------|
| POST-PERFORMANCE.md | post-stats.sh | 每天 22:00 |
| COMPETITOR-INTEL.md | competitor-watch.sh | 每天 06:30 |
| RESEARCH-NOTES.md | research-chain.sh | 2x/天 |
| INQUIRY-STATUS.md | inquiry-tracker.js | 每 6 小時 |
| CUSTOMER-INSIGHTS.md | Firestore sync | 每天 06:00 |
| MINDTHREAD-DATA.md | Firestore sync | 每天 05:30 |
| STRATEGY-NEXT-WEEK.md | weekly-strategy.sh | 每週日 |
| HEALTH-STATUS.md | health-monitor.sh | 每小時 |
| IDENTITY.md | 手動維護 | Agent 的人格和產品知識 |
| STRATEGY.md | 手動 + Agent 更新 | OKR 和決策框架 |
| PRODUCTS.md | 手動維護 | 產品知識庫 |

Agent 不需要「記得」任何事情——它只需要在每次被呼叫時**讀取最新的 .md 檔**。這就是為什麼短任務比長對話高效：context 是預先計算好的，不需要在對話中反覆提及。

---

## 0 成本工具鏈

這些工具完全不消耗 LLM 額度：

```bash
# blogwatcher — 監控 5 個 AI 產業部落格的 RSS
blogwatcher scan --json
# 追蹤: LangChain, OpenAI, Anthropic, Google AI, OWASP LLM

# hn-trending — HN 熱門文章
hn-trending 10 --json
# 回傳: title, url, score, comments

# summarize — URL → Markdown（Jina Reader）
summarize "https://example.com/article"
# 回傳: 乾淨的 markdown 全文

# curl — Moltbook API, Firestore, Telegram Bot API
# 全部是 REST API，0 LLM cost
```

**核心原則**：能用 HTTP 解決的，絕不用 LLM。LLM 只負責需要「思考」的工作。

---

## 踩坑紀錄

### 坑 1：$127.80 的 Gemini 帳單

從 Google Cloud Console 建的 API key，專案有開 billing。結果：

- Thinking tokens 以 $3.50/1M 計費
- 沒有 rate limit cap（free tier 有，billing 沒有）
- 7 天燒了 $127.80

**修復**：永遠從 AI Studio 建 key，不要從有 billing 的 GCP 專案建。用 `openclaw secrets audit` 確認所有 key 來源。

### 坑 2：同一天發 3 篇一樣的文

Pillar rotation 用 `day_of_year % 5`——同一天不管跑幾次都是同一個 pillar。

```bash
# 壞的
PILLAR_INDEX=$(( DAY_OF_YEAR % 5 ))

# 好的 — 每篇文不同 pillar
POST_SLOT=$(( DAY_OF_YEAR * 2 + HOUR / 12 ))
PILLAR_INDEX=$(( POST_SLOT % 5 ))
```

### 坑 3：Telegram 心跳造成重啟循環

健康檢查腳本呼叫了 `getUpdates`，跟 gateway 的 long-polling 衝突。結果：

- Gateway 偵測到 conflict → 重啟
- 重啟後健康檢查又跑 → 又衝突
- 3 分鐘內發了 18 則重複 TG 訊息

**教訓**：永遠不要從診斷腳本呼叫 `getUpdates`。

### 坑 4：Reply-checker 一次回 33 則

累積的未讀留言一次全回，吃光當時的 rate limit，其他任務全部 starve。

**教訓**：backlog 清理要設上限。或者更好的做法——reply-checker 從 2x/天改成更頻繁但每次上限 5 則。

### 坑 5：Moltbook API 的 www

Moltbook API 必須用 `www.moltbook.com`。`moltbook.com`（無 www）會 strip Authorization header。6 個 skill script 全用錯，debug 了一小時。

---

## 核心洞察：為什麼短任務比長對話高效 100 倍

```
長對話模式（大多數人）：
  人 → Agent → 人 → Agent → 人 → Agent
  每輪都帶完整 history，context 越滾越大
  20 輪對話 ≈ 100 RPD，產出 1 個結果

短任務模式（我們）：
  定時器觸發 → 讀取 .md 情報 → 1 次 prompt → 1 次 response → 完成
  1 個任務 = 1 RPD，產出 1 個結果
```

差異在哪？

1. **Context 是預先計算的**。POST-PERFORMANCE.md 已經算好了成效排名，Agent 不需要「請幫我分析一下最近的發文表現」這種來回。

2. **每個請求都是 self-contained**。不依賴對話歷史，不需要「上次我們聊到...」。

3. **研究步驟不用 LLM**。RSS 監控、HN 抓取、URL 摘要全部是 HTTP。只有最後的分析才用 LLM。

4. **失敗是隔離的**。一個任務失敗不影響其他 24 個。長對話中途 error 整個 context 都浪費了。

---

## 月成本明細

| 項目 | 月費 |
|------|------|
| Gemini 2.5 Flash | $0（free tier） |
| Vercel hosting | $0（hobby plan） |
| Firebase Firestore | $0（free tier） |
| Resend email | $0（100 封/天 free） |
| Telegram Bot API | $0 |
| Moltbook API | $0 |
| Jina Reader (summarize) | $0 |
| HN API | $0 |
| blogwatcher | $0（自架） |
| Windows 電費 | ~$5 |
| **Total** | **~$5/月** |

不需要 Mac Mini。不需要 VPS。不需要付費 API。

---

## 這套系統適合誰？

✅ 一人公司 / 小團隊想要自動化社群經營
✅ 已經在用 AI Agent 但覺得 Token 燒太多
✅ 想要 Agent 不只會聊天，還會「上班」
✅ 預算有限但想要企業級自動化

❌ 需要即時回覆的客服場景（cron-based 有延遲）
❌ 不願意碰 Linux / systemd 的人
❌ 期待 Agent 完全取代人類判斷的人

---

## 想要自己建？

完整的設定步驟：

1. **裝 OpenClaw** + Gemini 2.5 Flash free tier key（從 AI Studio 建！）
2. **建 4 個 Agent workspace**，各有 IDENTITY.md 定義人格
3. **裝 0-cost 工具鏈**：blogwatcher + hn-trending + summarize
4. **設定 systemd timers**：從 autopost 開始，逐步加情報層
5. **建立回饋迴路**：post-stats → POST-PERFORMANCE.md → 注入 autopost
6. **加品質閘門**：generate → self-review → rewrite
7. **開啟對話經營**：reply-checker + conversation threading

**如果你想要我們幫你架設**——包含客製化 Agent 人格、視覺化戰情室 dashboard、完整的 timer 設定和回饋迴路——[聯繫我們](https://ultralab.tw/#contact)。

我們也開放了一個[即時 Agent 戰情室 demo](https://ultralab.tw/agent)，可以看 4 隻 Agent 在像素風辦公室裡走來走去。

---

## 結語

AI Agent 的真正瓶頸不是模型能力——是**架構設計**。

同樣的免費額度，你可以聊 15 次天，或者跑 105 個自動化任務。差別只在於你怎麼把工作拆成短、精準、一次性的單元，然後用預先計算的數據餵給它。

不需要更貴的模型。不需要更多的 Token。你需要的是更聰明的架構。

---

*Ultra Lab — AI that works.*
*https://ultralab.tw*
