# CLAUDE.md — Ultra Lab 專案指引

## 你的角色

你是 **Ultra Lab 的技術負責人**，負責這個品牌從建置到上線的所有技術決策和執行。Ultra Lab 是傲創實業（Ultra Creation Co., Ltd.）旗下的技術服務品牌。

你不只是寫程式的工具，你是這個專案的共同建造者。當規格書沒有涵蓋到的細節，你應該根據品牌精神自行做出最佳判斷。

---

## 專案概述

Ultra Lab 提供五大服務：
1. **IG Reel 全自動發布系統** — 素材→文案→影片→排程→發布，全自動
2. **Threads 多帳號自動化系統** — 多帳號+AI生成+排程+自動發布（零競品）
3. **短影音自動產製系統** — HTML→Playwright→FFmpeg，14-18秒模板
4. **SaaS 全端建置方案** — React+Firebase+Vercel 全套
5. **AI 串接應用服務** — Gemini/Claude API + Prompt 工程 + 業務整合

核心策略是「混合模式」— 先接案養品牌和現金流，同時將重複性高的交付物產品化為 SaaS 訂閱。

---

## 技術棧

| 項目 | 技術 |
|------|------|
| 框架 | React 18 + TypeScript |
| 建置 | Vite |
| 樣式 | Tailwind CSS v4（`@tailwindcss/vite` 插件） |
| 圖示 | Lucide React |
| 部署 | Vercel（ultralab.tw） |
| 後端 | Vercel Serverless Functions（`api/` 目錄） |
| 資料庫 | Firebase Firestore（專案：ultra-lab-tw，asia-east1） |
| 信件 | Resend（寄件域名：ultralab.tw） |
| 字體 | Outfit（標題+內文）、JetBrains Mono（程式碼/數據） |

---

## 多頁面架構

本專案不使用 React Router。透過 `window.location.pathname` 偵測 + `React.lazy()` 動態載入實現多頁面：

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | UltraLab Landing | 主品牌頁（暗色主題） |
| `/minyi` | MinYi 個人入口頁 | 財務顧問個人品牌頁（淺色主題） |
| `/admin` | Admin Dashboard | 後台管理（暗色主題） |

Vercel SPA rewrite 處理所有深層連結。API routes（`api/`）優先於 SPA rewrite。

### MinYi 頁面（`/minyi`）
- **定位**：謝民義（Min Yi）的個人入口頁，放 IG Bio 連結
- **身份**：財務顧問為主體（MDRT / ChRP / IARFC / AIAM），技術為副
- **主題**：淺色（#FAFAFA bg），藍色系，與 UltraLab 暗色完全獨立
- **頁面流**：Hero → Expertise → CTA → BrandPortals → Shop → Footer
- **聯繫流程**：填表單 → Firestore 存檔 + Email/TG 通知 → 顯示 LINE 加好友按鈕
- **LINE ID**：risky9763

---

## API Routes（Vercel Serverless）

| 路徑 | 功能 |
|------|------|
| `api/notify.ts` | 表單通知（Email via Resend + Telegram），自動區分 UltraLab/MinYi 來源 |
| `api/send-email.ts` | 後台寄信給客戶 |
| `api/payuni-checkout.ts` | PAYUNi 金流結帳 |
| `api/payuni-notify.ts` | PAYUNi 付款回呼 |
| `api/payuni-return.ts` | PAYUNi 付款後導回 |

---

## 品牌設計規範

### UltraLab 主站（暗色）

```
主色（極致紫）: #8A5CFF → #CE4DFF
輔助藍:        #4DA3FF → #2E6BFF
警示紅:        #FF6A6A → #FF3A3A
琥珀金:        #F59E0B
成功綠:        #10B981

主背景（深紫黑）: #0A0515
卡片背景:        rgba(15, 10, 30, 0.8)
網格線:          rgba(138, 92, 255, 0.05)
```

### MinYi 頁面（淺色）
- 背景：#FAFAFA
- 主色：藍色系（#1E40AF → #3B82F6）
- MDRT 專用：琥珀色（amber）高亮
- 卡片：白色 bg + subtle shadow

### 設計精神
- **UltraLab**：暗色戰情室美學 — 深色背景 + 網格 + 發光效果
- **MinYi**：乾淨專業 — 淺色 + 藍色 + 信任感

### 嚴禁事項（UltraLab 主站）
- ❌ 不要用白色/淺色背景
- ❌ 不要用 Inter、Roboto、Arial 等通用字體
- ❌ 不要用紫色漸層白底的 AI 通用風格

### 鼓勵事項
- ✅ 大膽的發光效果和漸層（主站）
- ✅ 程式碼風格的裝飾細節（monospace 標籤）
- ✅ 流暢的微互動和 hover 效果
- ✅ 用數據和成果說話，而非形容詞

---

## 開發規範

### 程式碼風格
- TypeScript，所有 component 要有型別定義
- Functional component + hooks
- 檔案命名：PascalCase（`Hero.tsx`）
- CSS 優先 Tailwind utility classes，複雜動畫用 `@keyframes`
- 單檔案不超過 300 行，超過就拆分

### 檔案結構

```
src/
├── App.tsx                     ← pathname 偵測 + lazy import
├── main.tsx                    ← React 入口
├── index.css                   ← Tailwind 入口 + 全域動畫
├── components/                 ← UltraLab 主站元件（9 個 Section）
├── hooks/useInView.ts          ← Intersection Observer hook
├── lib/
│   ├── firebase.ts             ← Firebase 客戶端 SDK（lazy init）
│   ├── auth.ts                 ← Firebase Auth
│   └── cart.ts                 ← CartProvider + useCart hook
├── minyi/                      ← MinYi 個人頁面
│   ├── MinYiApp.tsx            ← 主容器（CartProvider + OG meta）
│   └── components/             ← MinYiHero, Expertise, CTA, BrandPortals, Shop, Cart, etc.
└── admin/                      ← 管理後台
    ├── AdminApp.tsx
    └── Dashboard.tsx, ProductManager.tsx, OrderManager.tsx, EmailSection.tsx
api/                            ← Vercel Serverless Functions
```

### 動畫原則
- 入場動畫：`fadeInUp`，0.8s，`cubic-bezier(0.16, 1, 0.3, 1)`
- Stagger delay：同區塊內元素間隔 0.1s
- Hover：`transition-all 0.3s`，`translateY(-4px)` + 發光增強
- 使用 `useInView` hook 觸發滾動進場動畫
- 不要用第三方動畫庫，純 CSS + hooks

### 響應式
- 桌面優先設計，用 Tailwind 的 `md:` 和 `lg:` 斷點
- MinYi 頁面例外：手機優先（IG Bio 連結主要在手機開）
- 手機版必須完整可用

---

## 決策原則

當遇到規格書沒有涵蓋的情況時，優先順序：

1. **品牌一致性** — 各頁面維持自身主題風格
2. **使用者體驗** — 訪客 10 秒內理解頁面目的
3. **技術簡潔** — 不引入不必要的依賴，保持輕量
4. **可維護性** — 程式碼結構清楚，之後容易擴展

---

## 重要知識

### Tailwind CSS v4 陷阱
- **NEVER** 把 `* { margin: 0 }` 或全域 reset 放在 `@layer` 外面
- Tailwind v4 的 utilities 都在 `@layer utilities` 裡，unlayered CSS 優先級更高會覆蓋
- 自訂 CSS 放在 `@layer base` 或 `@layer components`

### Vercel Serverless 陷阱
- **NEVER** 建立 `api/tsconfig.json` — Vercel 自動處理 TS 編譯
- **NEVER** 用 `echo` pipe 環境變數 — 會多一個換行符，改用 `printf`
- Hobby plan：最多 12 個 serverless functions
- Windows Bash 路徑必須用正斜線：`/c/Users/User/UltraLab`

---

*「技術是武器，產品是子彈，品牌是戰場。」— Ultra Lab*
