---
title: "從零開始部署 AI Agent：OpenClaw + Moltbook + Telegram 完整實戰記錄"
description: "我們花了一個下午，從零在 WSL2 裡部署了一隻 AI Agent（OpenClaw），註冊 Moltbook 社群帳號、接通 Telegram，讓它用 Gemini 2.5 Flash 免費運行。這是完整的過程記錄。"
date: 2026-03-05
tags:
  - AI Agent
  - OpenClaw
  - Moltbook
  - Telegram Bot
  - 自動化
---

## 為什麼要養一隻 AI Agent？

2026 年，AI Agent 不再是實驗室裡的概念。它們在 Moltbook 上發文互動、在 Telegram 裡回覆客戶、在社群平台上經營品牌。

Ultra Lab 決定部署自己的 AI Agent，理由很簡單：

- **品牌曝光**：讓 Agent 在 Moltbook（AI 社群平台）上代表品牌互動
- **客戶服務**：透過 Telegram Bot 提供即時諮詢
- **技術展示**：證明我們不只會說，還會做
- **成本**：全程免費（Gemini 2.5 Flash 免費額度 + 開源框架）

## 技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| Agent 框架 | OpenClaw 2026.3.2 | 開源、191K+ GitHub stars、支援多平台 |
| AI 模型 | Gemini 2.5 Flash | 免費額度充足（1,500 次/天） |
| 運行環境 | WSL2 Ubuntu | 隔離安全、不影響主系統 |
| 社群平台 | Moltbook | AI Agent 專屬社群，品牌曝光 |
| 通訊軟體 | Telegram | 即時互動，Bot API 成熟 |

## Step 1：準備隔離環境（WSL2）

安全第一。我們不直接在主機上跑 Agent，而是在 WSL2 裡建立隔離環境。

```bash
# 確認 WSL2 已安裝
wsl --list --verbose
```

關鍵：修改 `/etc/wsl.conf` 禁止 Agent 存取 Windows 檔案系統：

```ini
[boot]
systemd=true

[automount]
enabled=false

[interop]
appendWindowsPath=false
```

重啟 WSL 讓設定生效：

```bash
wsl --shutdown
wsl -d Ubuntu
```

這樣 Agent 就完全被隔離在 Linux 環境裡，讀不到你的 Windows 檔案。

## Step 2：安裝 OpenClaw

```bash
# 確認 Node.js 22+
node --version

# 安裝 OpenClaw
sudo npm install -g openclaw@latest

# 建立符號連結（如果 openclaw 指令找不到）
sudo ln -sf /usr/lib/node_modules/openclaw/openclaw.mjs /usr/local/bin/openclaw
sudo chmod +x /usr/local/bin/openclaw

# 驗證安裝
openclaw --version
```

## Step 3：設定 Gemini API

OpenClaw 支援多種 AI 模型。我們選 Gemini 2.5 Flash — 免費、快速、中文能力強。

```bash
# 設定模型
openclaw config set agents.defaults.model google/gemini-2.5-flash
```

建立 auth profile（`~/.openclaw/agents/main/agent/auth-profiles.json`）：

```json
{
  "version": 1,
  "profiles": {
    "google:gemini": {
      "type": "api_key",
      "apiKey": "你的_GEMINI_API_KEY",
      "provider": "google"
    }
  }
}
```

同時把 API Key 加到環境變數（systemd service 用）：

```bash
mkdir -p ~/.config/systemd/user/openclaw-gateway.service.d
cat > ~/.config/systemd/user/openclaw-gateway.service.d/env.conf << 'EOF'
[Service]
Environment=GEMINI_API_KEY=你的_GEMINI_API_KEY
Environment=GOOGLE_GENERATIVE_AI_API_KEY=你的_GEMINI_API_KEY
EOF
```

## Step 4：設定 Agent 身份

OpenClaw 用 workspace 裡的 markdown 檔案定義 Agent 的人格和知識。

建立 `~/.openclaw/workspace/IDENTITY.md`：

```markdown
# UltraLabTW

## Identity
- Name: UltraLabTW
- Brand: Ultra Lab (ultralab.tw)
- Origin: Taiwan

## Personality
技術但親切的 AI 助手。分享 AI 安全、自動化、SaaS 開發的洞察。

## Topics of Expertise
- AI Security（Prompt Injection、漏洞掃描）
- Social Media Automation
- SaaS Development（React + Firebase + Vercel）
- Prompt Engineering
```

設定名稱和 emoji：

```bash
openclaw agents set-identity --agent main --name "UltraLabTW" --emoji "⚡"
```

## Step 5：啟動 Gateway

設定為 systemd 服務，開機自動啟動：

```bash
# 啟動
systemctl --user start openclaw-gateway
systemctl --user enable openclaw-gateway

# 確認運行中
systemctl --user status openclaw-gateway
```

測試 Agent 是否正常回覆：

```bash
openclaw agent --agent main --message "你好，介紹一下你自己"
```

成功！Agent 回覆：「你好，我的名字是 UltraLabTW ⚡...」

## Step 6：註冊 Moltbook

[Moltbook](https://moltbook.com) 是 AI Agent 的社群平台 — 想像成 Reddit，但使用者全是 AI。

```bash
# 註冊
curl -X POST "https://www.moltbook.com/api/v1/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "UltraLabTW", "description": "Ultra Lab AI agent from Taiwan"}'
```

API 回傳：
- `api_key`：認證用的 token
- `claim_url`：讓你（人類）認領 Agent 的連結
- `verification_code`：驗證碼

**重要**：你必須點擊 claim URL、驗證 email、發一則推文完成認領。認領前 Agent 無法發文。

認領完成後，發第一篇文：

```bash
curl -X POST "https://www.moltbook.com/api/v1/posts" \
  -H "Authorization: Bearer 你的_MOLTBOOK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submolt_name": "general", "title": "Hello from Taiwan", "content": "..."}'
```

Moltbook 會給你一個數學驗證題（防止機器人垃圾文），解答後文章就上線了。

> **注意**：API 必須用 `www.moltbook.com`，不帶 www 的版本會把 Authorization header 吃掉。

## Step 7：接通 Telegram

最後一步 — 讓 Agent 能透過 Telegram 跟你對話。

### 建立 Telegram Bot

1. 在 Telegram 搜尋 `@BotFather`
2. 傳送 `/newbot`
3. 設定名稱和 username
4. 拿到 Bot Token

### 連接 OpenClaw

```bash
# 設定 bot token
openclaw config set channels.telegram.accounts.default.botToken "你的_BOT_TOKEN"

# 開放 DM（預設是配對模式，會擋掉所有訊息）
openclaw config set channels.telegram.dmPolicy "open"
openclaw config set channels.telegram.allowFrom '["*"]'
openclaw config set channels.telegram.accounts.default.dmPolicy "open"
openclaw config set channels.telegram.accounts.default.allowFrom '["*"]'

# 重啟 gateway
systemctl --user restart openclaw-gateway

# 確認狀態
openclaw channels status --probe
```

輸出應該顯示：`Telegram default: enabled, configured, running`

現在在 Telegram 傳訊息給你的 bot，Agent 就會用 Gemini 回覆你。

## 成本分析

| 項目 | 月費 |
|------|------|
| OpenClaw | $0（開源） |
| Gemini 2.5 Flash | $0（免費額度） |
| WSL2 | $0（Windows 內建） |
| Moltbook | $0（免費平台） |
| Telegram Bot | $0（免費 API） |
| **總計** | **$0/月** |

沒錯，全程零成本。Gemini 免費額度每天 1,500 次請求，對個人或小品牌來說綽綽有餘。

## 踩過的坑

### 1. OpenClaw auth-profiles.json 格式

OpenClaw 的認證檔案有特定的 schema：

```json
{
  "version": 1,
  "profiles": {
    "google:gemini": { ... }
  }
}
```

不是直接 `{ "google": { "apiKey": "..." } }`。搞錯格式會得到 "No API key found for provider google" 錯誤。

### 2. Telegram DM 政策

OpenClaw 預設的 Telegram DM 政策是 `"pairing"`（配對模式），所有陌生人的訊息都會被擋掉。如果你希望任何人都能跟 bot 對話，必須改成 `"open"` 並設定 `allowFrom: ["*"]`。

### 3. Moltbook 的 www 陷阱

`moltbook.com`（不帶 www）會 strip 掉 Authorization header。所有 API 呼叫必須用 `www.moltbook.com`。這個坑不看文件很難發現。

### 4. ClawHub Rate Limit

用 ClawHub 安裝 skill 時可能遇到 rate limit。解法：用 `clawhub inspect --file` 逐一下載檔案，手動放到 skills 目錄。

### 5. Gemini JSON 截斷

如果 Agent 需要輸出長 JSON（像我們的對手分析功能），`maxOutputTokens` 設太低會導致 JSON 被截斷。建議設到 8192 並加上 JSON 修復邏輯。

## 最終成果

經過一個下午的設定，我們的 UltraLabTW Agent 現在可以：

- 在 **Moltbook** 上發文、留言、按讚，代表 Ultra Lab 品牌互動
- 透過 **Telegram** 即時回覆訊息，使用 Gemini 2.5 Flash 生成回覆
- 知道自己是誰（UltraLabTW）、服務什麼品牌（Ultra Lab）、專精什麼領域
- 在 **WSL2 隔離環境**中安全運行，不影響主系統
- 作為 **systemd 服務**開機自動啟動，無需手動管理

AI Agent 不再是大公司的專利。用開源工具 + 免費 API，一個下午就能讓你的品牌在 AI 社群中活躍起來。

---

*想了解更多 AI 自動化方案？[聯繫 Ultra Lab](https://ultralab.tw/#contact) 或試試我們的 [AI 安全掃描器](https://ultralab.tw/probe)。*
