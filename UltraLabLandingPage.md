# Ultra Lab Landing Page — 技術規格書（Claude Code 執行用）

> **目的**：本文件提供完整的設計規格和技術需求，供 Claude Code 一次性建置 Ultra Lab Landing Page 專案。
> **產出**：一個可直接部署到 Vercel 的完整 React + TypeScript + Tailwind 專案。

---

## 1. 專案初始化

### 技術棧

| 項目 | 技術 |
|------|------|
| 框架 | React 18 + TypeScript |
| 建置工具 | Vite |
| 樣式 | Tailwind CSS v4（使用 `@tailwindcss/vite` 插件） |
| 圖示 | Lucide React |
| 部署 | Vercel |
| 動畫 | CSS 原生動畫 + `@keyframes` |

### 初始化指令

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss @tailwindcss/vite lucide-react
```

### Vite 配置（vite.config.ts）

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### CSS 入口（src/index.css）

```css
@import "tailwindcss";
```

### 專案結構

```
ultra-lab/
├── public/
│   └── logo.png              ← Ultra Lab Logo（之後放入）
├── src/
│   ├── App.tsx                ← 主應用（組合所有 Section）
│   ├── main.tsx               ← React 入口
│   ├── index.css              ← Tailwind 入口
│   └── components/
│       ├── Navbar.tsx         ← 頂部導覽列
│       ├── Hero.tsx           ← 主視覺區
│       ├── Services.tsx       ← 五大產品線
│       ├── HowItWorks.tsx     ← 運作流程
│       ├── Portfolio.tsx      ← 作品展示 / 成效數據
│       ├── Pricing.tsx        ← 服務報價總覽
│       ├── FAQ.tsx            ← 常見問題
│       ├── Contact.tsx        ← 聯絡 / CTA
│       └── Footer.tsx         ← 頁尾
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## 2. 品牌設計規範

### 色彩系統

Ultra Lab 以**紫色**為主色調（區別於 Ultra Advisor 的藍色），延續「戰情室」暗色美學：

```
主色（極致紫）：
  - Primary:     #8A5CFF
  - Primary Mid: #CE4DFF  
  - Primary Light: #E8E0FF

輔助色：
  - Strategy Blue:  #4DA3FF → #2E6BFF
  - Signal Red:     #FF6A6A → #FF3A3A
  - Amber Gold:     #F59E0B
  - Success Green:  #10B981
  - Teal:           #14B8A6

背景：
  - 主背景（深紫黑）: #0A0515
  - 卡片背景:        rgba(15, 10, 30, 0.8)
  - 網格線:          rgba(138, 92, 255, 0.05)

文字：
  - 主文字:   #F8FAFC (slate-50)
  - 副文字:   #94A3B8 (slate-400)
  - 弱文字:   #64748B (slate-500)
```

### 發光效果

```css
/* 紫色發光（主要 CTA） */
box-shadow: 0 0 20px rgba(138, 92, 255, 0.4);

/* 藍色發光 */
box-shadow: 0 0 20px rgba(77, 163, 255, 0.4);

/* 懸停增強 */
box-shadow: 0 0 40px rgba(138, 92, 255, 0.6);
```

### 背景設計

```css
/* 戰情室網格背景 — 紫色版 */
.bg-lab {
  background-color: #0A0515;
  background-image: 
    linear-gradient(rgba(138, 92, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(138, 92, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### 字體

```css
/* 主標題 */
font-family: 'Outfit', system-ui, sans-serif;
font-weight: 800;

/* 內文 */
font-family: 'Outfit', system-ui, sans-serif;
font-weight: 400;

/* 程式碼/數據 */
font-family: 'JetBrains Mono', monospace;
```

在 `index.html` 的 `<head>` 中加入 Google Fonts：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

---

## 3. 各 Section 詳細規格

### 3.1 Navbar（頂部導覽列）

- **固定在頂部**，滾動時加上 `backdrop-blur` 毛玻璃效果
- 左側：「ULTRA LAB」文字 Logo，紫色，`font-weight: 800`
- 右側導覽連結：`服務項目` `作品展示` `報價` `常見問題`
- 最右側 CTA 按鈕：`立即諮詢` → 錨點跳到 Contact section
- 手機版：漢堡選單

### 3.2 Hero（主視覺區）

**佈局**：全螢幕高度，置中對齊

**內容**：
```
標籤: "傲創實業 · 技術服務品牌"
主標題: "Build. Ship. Scale."
副標題: "把你做過的每一件事，變成別人願意付費的價值。"
說明文字: "全自動社群發布 × AI 內容生成 × SaaS 建置 — 從驗證到量產的技術夥伴"

CTA 按鈕（兩個）:
  - 主按鈕（紫色漸層）: "免費諮詢" → 跳到 Contact
  - 次按鈕（邊框）: "查看服務項目" → 跳到 Services
```

**視覺效果**：
- 背景：深紫黑 + 紫色網格 + 右上角一個大的紫色模糊光暈 (`blur-[150px]`)
- 主標題使用漸層文字效果（紫→藍）
- 入場動畫：由下往上 fade-in，各元素 stagger 延遲

**數據指標列**（Hero 底部）：
```
5 大產品線 | 全自動端到端 | 台灣市場零競品 | 接案 → 產品化
```

### 3.3 Services（五大產品線）

**佈局**：先顯示一個總覽卡片列（5 張），點擊或滾動到各自的詳細介紹

**五大服務（各自一個卡片）**：

#### A. IG Reel 全自動發布系統
- **圖示**: `Video` (Lucide)
- **主色**: `#10B981` (green)
- **標語**: "從素材到發布，全自動"
- **說明**: "AI 生成文案 → 自動製作影片 → 排程 → 自動發布。端到端全自動的 IG Reel 運營系統。"
- **亮點標籤**: `全自動` `AI文案` `排程發布` `零人工`
- **服務層級**:
  - 代營運: NT$15,000-30,000/月
  - SaaS 訂閱: NT$2,999-5,999/月
  - 私有化部署: NT$50,000-100,000

#### B. Threads 多帳號自動化系統
- **圖示**: `MessageSquare` (Lucide)
- **主色**: `#14B8A6` (teal)
- **標語**: "多帳號 × AI 生成 × 全自動"
- **說明**: "多帳號同時排程 + AI 自動生成內容 + 自動發布。Threads 無官方 API，能穩定運作的系統極為稀缺。"
- **亮點標籤**: `多帳號` `AI內容` `零競品` `先行者優勢`
- **服務層級**:
  - 代營運: NT$10,000-25,000/月
  - SaaS 訂閱: NT$1,999-4,999/月
  - 企業方案: NT$80,000-200,000

#### C. 短影音自動產製系統
- **圖示**: `Clapperboard` (Lucide)
- **主色**: `#FF3A3A` (red)
- **標語**: "14 秒打動人心"
- **說明**: "HTML 動畫 → Playwright → FFmpeg 全流程自動化。含三類心理觸發模板（恐懼/效率/貪婪）。"
- **亮點標籤**: `14-18秒` `心理觸發` `模板庫` `自動化`
- **服務層級**:
  - 接案: NT$5,000-15,000/支
  - 模板訂閱: NT$999/月
  - API/白標: NT$30,000+/月

#### D. SaaS 全端建置方案
- **圖示**: `Code2` (Lucide)
- **主色**: `#2E6BFF` (blue)
- **標語**: "你的 SaaS，兩週上線"
- **說明**: "React + TypeScript + Firebase + Vercel。已驗證的認證系統、訂閱管理、點數經濟、管理後台全套方案。"
- **亮點標籤**: `全端` `Firebase` `訂閱制` `管理後台`
- **服務層級**:
  - 全端接案: NT$80,000-300,000
  - 加速器: NT$50,000 起
  - 維運顧問: NT$10,000-30,000/月

#### E. AI 串接應用服務
- **圖示**: `Sparkles` (Lucide)
- **主色**: `#8A5CFF` (purple)
- **標語**: "不只串 API，更懂你的業務"
- **說明**: "Gemini/Claude API 串接 + Prompt 工程 + 業務邏輯整合。從保單 OCR 到 AI 健檢報告的實戰方法論。"
- **亮點標籤**: `Prompt工程` `OCR` `Gemini` `業務整合`
- **服務層級**:
  - AI 諮詢: NT$10,000/次
  - 客製整合: NT$30,000-100,000
  - AI 工具訂閱: NT$1,999/月起

**卡片設計規範**：
- 背景：`rgba(15, 10, 30, 0.8)` + `backdrop-blur(12px)`
- 邊框：`1px solid rgba(138, 92, 255, 0.15)`
- hover 時邊框變為該服務的主色，並加上對應的發光效果
- 圓角：`16px`
- 內距：`24px`

### 3.4 HowItWorks（運作流程）

**標題**: "混合模式：從接案到產品化"
**副標題**: "先用服務驗證價值，再用產品實現規模"

**三階段流程圖**（水平排列，手機版垂直）：

```
Phase 1: 接案驗證          Phase 2: 產品化轉型          Phase 3: 規模化
─────────────────      ─────────────────────      ────────────────
圖示: Wrench             圖示: Package                圖示: Rocket
色彩: Amber              色彩: Blue                   色彩: Purple

"幫你做"                 "你自己做"                   "大家都能做"
代營運 / 客製開發         SaaS 訂閱 / 模板庫           API / 白標 / 企業方案
建立信任 + 收集案例       累積 MRR                     產品收入 > 接案收入
```

階段之間用箭頭或漸層連接線串起來。

### 3.5 Portfolio（作品展示）

**標題**: "實戰驗證，不是紙上談兵"
**副標題**: "每一個服務都從自己的需求中誕生"

**展示卡片**（2-3 個）：

#### 卡片 1: Ultra Advisor
```
標籤: "SaaS 建置"
標題: "Ultra Advisor — 台灣最強財務顧問提案平台"
描述: "18+ 種財務數據視覺化工具，從零打造完整 SaaS 平台，含訂閱管理、點數經濟、LINE Bot 整合、管理後台。"
技術標籤: React, TypeScript, Firebase, Vercel, LINE LIFF
成效: "18+ 工具上線 · 完整 SaaS 架構 · 已有付費用戶"
```

#### 卡片 2: Threads 自動化
```
標籤: "社群自動化"  
標題: "@ginrollbt — 全自動 Threads 經營"
描述: "用自建系統經營的 Threads 帳號，AI 自動生成內容、多帳號排程、全自動發布。"
技術標籤: Node.js, Python, AI Content Gen
成效: "XXX 粉絲 · 全自動運營 · 零人工干預"
（備註：粉絲數留佔位符，之後填入真實數據）
```

#### 卡片 3: IG Reel 工廠
```
標籤: "內容自動化"
標題: "IG Reel 全自動產製線"
描述: "從素材到發布的端到端自動化。AI 生成文案、自動製作影片、排程發布，完全無需人工介入。"
技術標籤: Node.js, Python, FFmpeg, AI
成效: "全自動流程 · 素材→發布 · 端到端"
```

**卡片設計**：暗色背景 + 左側色條（對應服務主色）+ 右上角技術標籤

### 3.6 Pricing（服務報價總覽）

**標題**: "透明報價，沒有隱藏費用"

**佈局**：Tab 切換或橫向卡片，每個服務一欄

**只顯示最受歡迎的方案**（簡化版，詳細報價引導到諮詢）：

| 服務 | 入門方案 | 進階方案 | 備註 |
|------|----------|----------|------|
| IG Reel | SaaS NT$2,999/月 | 代營運 NT$15,000/月起 | 私有化部署另議 |
| Threads | SaaS NT$1,999/月 | 代營運 NT$10,000/月起 | 企業方案另議 |
| 短影音 | 模板 NT$999/月 | 接案 NT$5,000/支起 | API 另議 |
| SaaS 建置 | 加速器 NT$50,000起 | 全端 NT$80,000起 | 維運另議 |
| AI 串接 | 諮詢 NT$10,000/次 | 整合 NT$30,000起 | 訂閱另議 |

每欄底部都有一個「了解更多」按鈕 → 跳到 Contact

### 3.7 FAQ（常見問題）

**使用手風琴（Accordion）展開/收合**

問題列表：
```
Q: Ultra Lab 和 Ultra Advisor 是什麼關係？
A: 都是傲創實業旗下品牌。Ultra Advisor 是我們的財務顧問 SaaS 產品，Ultra Lab 則是把打造 Advisor 過程中累積的技術能力，對外提供服務的品牌。

Q: IG Reel 和 Threads 系統真的是全自動嗎？
A: 是的。從 AI 內容生成、影片製作、到排程發布，全程不需要人工介入。你只需要設定好策略和風格，系統會自動執行。

Q: Threads 沒有官方 API，系統穩定嗎？
A: 我們的系統已經穩定運行在自己的帳號上，經過充分驗證。我們會持續維護和更新以確保穩定性。

Q: 代營運和 SaaS 訂閱有什麼差別？
A: 代營運是「我們幫你做」— 包含內容策略、執行、優化，適合想省時間的客戶。SaaS 訂閱是「你自己做」— 我們提供系統，你自行操作，適合有團隊的客戶。

Q: 可以先試用再決定嗎？
A: 可以。我們提供免費諮詢，會根據你的需求建議最適合的方案。代營運服務也可以先從一個月開始。

Q: 付款方式？
A: 目前支援銀行轉帳。代營運服務為月付制，SaaS 訂閱為月付或年付（年付享折扣）。接案服務依專案報價。
```

### 3.8 Contact（聯絡 / CTA）

**佈局**：大面積紫色漸層背景區塊

```
標題: "準備好把你的想法變成產品了嗎？"
副標題: "免費諮詢，15 分鐘了解我們能幫你什麼"

CTA 按鈕（大按鈕）: 
  "LINE 免費諮詢" → https://lin.ee/xxxxx（之後替換真實連結）
  圖示: MessageCircle

次要連結:
  "或 Email 聯繫" → mailto:contact@ultralab.tw（之後替換）
```

### 3.9 Footer

```
左側: "© 2026 Ultra Lab · 傲創實業股份有限公司"
中間: 連結 → 服務項目 | 報價 | 常見問題
右側: "Powered by Ultra Creation"
```

---

## 4. 動畫規範

### 入場動畫

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
```

- Hero 區域的元素使用 stagger delay（標籤 0s → 標題 0.1s → 副標 0.2s → CTA 0.3s → 數據列 0.4s）
- 使用 Intersection Observer 讓各 Section 滾動進入時觸發動畫（可用簡單的 custom hook）

### 卡片互動

```css
/* 服務卡片 hover */
transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

hover:
  - transform: translateY(-4px)
  - border-color: 該服務的主色
  - box-shadow: 對應的發光效果
```

### 按鈕互動

```css
/* CTA 按鈕 hover */
transition: all 0.3s;

hover:
  - transform: translateY(-2px)
  - box-shadow 增強
```

---

## 5. RWD 響應式設計

| 斷點 | 行為 |
|------|------|
| >= 1280px | 完整桌面版 |
| 768-1279px | 平板，服務卡片 2 欄 |
| < 768px | 手機版，單欄，漢堡選單 |

關鍵調整：
- Hero 標題：桌面 `text-6xl` → 手機 `text-4xl`
- 服務卡片：桌面 3 欄 → 平板 2 欄 → 手機 1 欄
- 流程圖：桌面水平 → 手機垂直
- Navbar：桌面完整顯示 → 手機漢堡選單

---

## 6. SEO & Meta

### index.html head

```html
<title>Ultra Lab — Build. Ship. Scale. | 全自動社群發布 × AI × SaaS 建置</title>
<meta name="description" content="Ultra Lab 是傲創實業旗下技術服務品牌，提供 IG Reel 全自動發布、Threads 多帳號自動化、短影音產製、SaaS 建置、AI 串接等五大服務。從驗證到量產的技術夥伴。">
<meta property="og:title" content="Ultra Lab — Build. Ship. Scale.">
<meta property="og:description" content="全自動社群發布 × AI 內容生成 × SaaS 建置 — 從驗證到量產的技術夥伴">
<meta property="og:type" content="website">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" href="/logo.png">
```

---

## 7. Vercel 部署設定

### vercel.json

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

部署指令：
```bash
npm run build
# 之後連結 Vercel，自動從 GitHub 部署
```

---

## 8. 佔位符清單（之後替換）

以下內容使用佔位符，上線前需替換為真實資料：

| 項目 | 佔位符 | 說明 |
|------|--------|------|
| LINE 連結 | `https://lin.ee/xxxxx` | 替換為 Ultra Lab 的 LINE OA 連結 |
| Email | `contact@ultralab.tw` | 替換為真實 Email |
| Logo 圖片 | `/logo.png` | 放入 Ultra Lab Logo 檔 |
| Threads 粉絲數 | `XXX 粉絲` | 填入 @ginrollbt 真實粉絲數 |
| IG Reel 成效數據 | 佔位文字 | 填入真實自動化成效 |

---

## 9. 品質檢查清單

完成後請確認：

- [ ] `npm run build` 無錯誤
- [ ] 所有 Section 正常渲染
- [ ] 手機版佈局正確（可用 Chrome DevTools 模擬）
- [ ] 所有錨點連結正常跳轉
- [ ] hover 效果和動畫流暢
- [ ] 字體正確載入（Outfit + JetBrains Mono）
- [ ] 背景網格效果正常
- [ ] 無 TypeScript 錯誤
- [ ] 圖片/Logo 有 fallback 處理

---

## 10. 設計精神提醒

Ultra Lab 的視覺必須傳達：
1. **技術實力** — 暗色系 + 程式碼風格的細節 → 「這個團隊懂技術」
2. **已驗證** — Portfolio 展示真實產品 → 「不是嘴砲，是做出來的」
3. **稀缺性** — 特別強調 Threads 零競品、IG Reel 全自動 → 「別人做不到」
4. **專業信任** — 透明報價 + FAQ → 「跟這團隊合作很安心」

整體風格：**實驗室 × 工坊** — 不是冰冷的科技公司，而是一個「什麼都能打造出來」的技術工坊。紫色代表 AI 與創新，暗色背景代表專業深度。

---

**此文件為 Claude Code 執行用。請根據以上規格完整建置專案，產出可直接 `npm run dev` 運行的程式碼。**