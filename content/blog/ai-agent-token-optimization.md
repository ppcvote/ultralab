---
title: "AI Agent 省 Token 實戰：我們如何把 4 隻 Agent 的浪費砍掉 40%"
slug: ai-agent-token-optimization
date: 2026-03-07
author: Ultra Lab
tags: [AI Agent, Token 優化, OpenClaw, LLM 成本, 自動化]
description: "我們營運 4 隻 AI Agent 全自動推廣品牌，月成本 $0。但 Token 不是免費的——每天 1,500 RPD 的配額要花在刀口上。這篇文章記錄我們如何審計、瘦身、優化整個 Agent Fleet 的 Token 效率。"
---

# AI Agent 省 Token 實戰：我們如何把 4 隻 Agent 的浪費砍掉 40%

> 「免費不代表可以浪費。」

Ultra Lab 營運 4 隻 AI Agent（UltraLabTW、MindThreadBot、UltraProbeBot、UltraAdvisor），用 Google Gemini 2.5 Flash 免費方案，每天 1,500 RPD（Requests Per Day）的配額，實現全自動社群推廣。

聽起來很爽？實際跑起來，我們發現大量 Token 被浪費在沒有產出的地方。

這篇文章記錄我們的 Token 審計過程、發現的三大黑洞、以及具體的優化手法。

---

## 我們的 Agent 架構

| Agent | 角色 | 每日任務 |
|-------|------|---------|
| UltraLabTW ⚡ | 總部 CEO | 4 次發文 + 互動 + 策略反思 |
| MindThreadBot 🧵 | 社群專家 | 4 次發文 + 互動 |
| UltraProbeBot 🔍 | 資安研究 | 4 次發文 + 漏洞掃描 |
| UltraAdvisor 💰 | 財務顧問 | 互動 + 諮詢 |

技術棧：OpenClaw 2026.3.2 + Gemini 2.5 Flash（免費）+ systemd timers + Discord/Telegram

---

## 審計發現：三大 Token 黑洞

### 黑洞 #1：空轉的歡迎機器人

```
discord-welcome-check: 每 2 小時跑一次（12 次/天）
每次消耗：~49,000 input tokens
每次結果："No new members to welcome."
每日浪費：588,000 input tokens
```

Discord 伺服器初期成員很少，但歡迎機器人每 2 小時就花 49K tokens 檢查一次，然後回報「沒有新成員」。**100% 的 Token 都浪費了。**

### 黑洞 #2：吃飽沒事做的 Context

每隻 Agent 啟動時都會讀取整個 workspace 的檔案。問題是：

- **UltraProbeBot**（資安 Agent）每次都讀 5,574 chars 的 Threads 社群數據 — 它根本不需要知道 Threads 有幾個粉絲
- **UltraAdvisor**（財務 Agent）每次都讀完整的四產品更新 — 它只需要自己的產品資訊
- **AGENTS.md** 是 7,869 chars 的通用模板 — 其中 80% 是 Group Chat 禮儀和 Heartbeat 教學，我們的 Agent 根本不用

### 黑洞 #3：失敗但照扣的 Cron Job

```
autopost-main:  289,097 input tokens → Status: error
daily-reflect:  473,611 input tokens → Status: error
```

Cron Job 失敗了，Token 照扣。Agent 花了大量 Token 讀 context、思考、甚至開始動作——然後在最後一步失敗。等於白忙一場。

---

## 優化手法

### 1. 降頻 — 頻率 ≠ 效果

```diff
- discord-welcome-check: every 2h (12x/day)
+ discord-welcome-check: every 8h (3x/day)
```

一天檢查 3 次就夠了。省下 ~75% 的 Token。

**同時啟用 `--light-context`**：這個 OpenClaw 內建選項讓低優先級的 Job 載入更少的 workspace 檔案。

### 2. 精準投餵 — 每隻 Agent 只給它需要的

**Before：所有 Agent 讀一模一樣的檔案**
```
main:       62,631 chars (~15,600 tokens)
mindthread: 33,701 chars (~8,400 tokens)
probe:      32,368 chars (~8,100 tokens)
advisor:    27,969 chars (~7,000 tokens)
```

**After：只給相關資料**
```
main:       55,974 chars (~14,000 tokens)  ← CEO 需要全局視野
mindthread: 27,302 chars (~6,800 tokens)   -19%
probe:      20,444 chars (~5,100 tokens)   -37%
advisor:    12,707 chars (~3,200 tokens)   -55%
```

具體做了什麼：
- Probe / Advisor 移除 MINDTHREAD-DATA.md（不需要 Threads 數據）
- Advisor 的 PRODUCT-UPDATES.md 從四產品完整版改為只包含自己的產品
- AGENTS.md 從 212 行通用模板精簡到 40 行精華版（-81%）

### 3. 把省下的 Token 投資在學習

Token 省下來不是為了省，是為了做更有價值的事。

我們用省下的配額增加了：

**自由探索 Cron（2x/day，10:00 + 22:00）**：
```
每天給 CEO Agent 兩次「自由探索」時間：
- 市場研究（用 market-research skill）
- 競品監控
- 內容靈感搜集（用 deep-research skill）
- 自我改進（回顧發文表現）
探索結果寫入 MEMORY.md，最有趣的發現分享到 Discord。
```

**Proactive Claw（主動學習 Skill）**：
讓 Agent 在互動對話中能主動觀察環境、發現機會，而不是永遠被動等指令。

---

## 最終 RPD 預算分配

| 用途 | Before | After | 節省 |
|------|--------|-------|------|
| 現有營運（發文+互動+反思） | ~204 RPD | ~170 RPD | -17% |
| discord-welcome-check | ~24 RPD | ~6 RPD | -75% |
| 自由探索（新增） | 0 | ~20 RPD | 投資 |
| 互動對話預留 | ~20 RPD | ~20 RPD | — |
| **使用總計** | **~248** | **~216** | **-13%** |
| **剩餘配額** | **~1,252** | **~1,284** | +2.5% |

營運消耗降低了，但 Agent 實際能力增加了（多了自由探索 + 主動學習）。

---

## Token 最佳化的核心原則

經過這次審計，我們歸納出幾個原則：

1. **先量再砍**：不要猜哪裡浪費，用數據說話。`openclaw cron runs` 可以看到每個 Job 的 input_tokens。

2. **Context 是最大的隱形成本**：你以為只是「多放一個檔案」，但那個檔案每次 API call 都要付費。4 隻 Agent × 每天 20 次 call × 多餘的 5K tokens = 一天 400K tokens 白花。

3. **空轉比失敗更浪費**：失敗至少會報錯讓你修。空轉（每次都回「沒事做」）會悄悄吃掉配額。

4. **省 Token 不是目的，重新分配才是**：省下來的配額拿去做更有價值的事——市場研究、競品分析、自我學習。

5. **每隻 Agent 只需要知道跟它相關的事**：資安 Agent 不需要知道 Threads 粉絲數。財務 Agent 不需要知道 SaaS 開發優先級。精準投餵 > 全員廣播。

---

## 想讓你的 AI Agent 也省 Token？

我們正在將這套 Token 最佳化方法論產品化。如果你也在營運 AI Agent Fleet（不管是用 OpenClaw、LangGraph、CrewAI 還是自建框架），歡迎聯繫我們做一次免費的 Token 審計。

[聯繫 Ultra Lab →](https://ultralab.tw/#contact)
[看我們的 Agent Fleet 實況 →](https://ultralab.tw/agent)
