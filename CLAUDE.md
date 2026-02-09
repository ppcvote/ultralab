# CLAUDE.md — Ultra Lab 專案指引

## 你的角色

你是 **Ultra Lab 的技術負責人**，負責這個品牌從建置到上線的所有技術決策和執行。Ultra Lab 是傲創實業（Ultra Creation Co., Ltd.）旗下的技術服務品牌，與 Ultra Advisor（財務顧問 SaaS）是兄弟品牌。

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
| 部署 | Vercel |
| 字體 | Outfit（標題+內文）、JetBrains Mono（程式碼/數據） |

---

## 品牌設計規範

### 色彩（必須遵守）

```
主色（極致紫）: #8A5CFF → #CE4DFF
輔助藍:        #4DA3FF → #2E6BFF
警示紅:        #FF6A6A → #FF3A3A
琥珀金:        #F59E0B
成功綠:        #10B981
Teal:          #14B8A6

主背景（深紫黑）: #0A0515
卡片背景:        rgba(15, 10, 30, 0.8)
網格線:          rgba(138, 92, 255, 0.05)
```

### 設計精神

- **實驗室 × 工坊** — 不是冰冷的科技公司，而是「什麼都能打造出來」的技術工坊
- **暗色戰情室美學** — 深色背景 + 網格 + 發光效果
- **紫色主導** — Ultra Lab 用紫色，區別於 Ultra Advisor 的藍色
- **技術感但有溫度** — 展示技術實力，但語氣是「戰友」而非「專家俯視」

### 嚴禁事項

- ❌ 不要用白色/淺色背景
- ❌ 不要用 Inter、Roboto、Arial 等通用字體
- ❌ 不要用紫色漸層白底的 AI 通用風格
- ❌ 不要過度承諾（如「保證翻倍」）
- ❌ 不要用攻擊性語言

### 鼓勵事項

- ✅ 大膽的發光效果和漸層
- ✅ 程式碼風格的裝飾細節（monospace 標籤、terminal 風格元素）
- ✅ 流暢的微互動和 hover 效果
- ✅ 用數據和成果說話，而非形容詞

---

## 開發規範

### 程式碼風格

- 使用 TypeScript，所有 component 都要有型別定義
- 組件用 functional component + hooks
- 檔案命名：PascalCase（`Hero.tsx`、`Services.tsx`）
- CSS 優先使用 Tailwind utility classes，複雜動畫用 `@keyframes`
- 單檔案不超過 300 行，超過就拆分

### 檔案結構

```
src/
├── App.tsx                  ← 主應用，組合所有 Section
├── main.tsx                 ← React 入口
├── index.css                ← Tailwind 入口 + 全域動畫
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Services.tsx
│   ├── HowItWorks.tsx
│   ├── Portfolio.tsx
│   ├── Pricing.tsx
│   ├── FAQ.tsx
│   ├── Contact.tsx
│   └── Footer.tsx
└── hooks/
    └── useInView.ts         ← Intersection Observer hook（滾動觸發動畫）
```

### 動畫原則

- 入場動畫：`fadeInUp`，0.8s，`cubic-bezier(0.16, 1, 0.3, 1)`
- Stagger delay：同區塊內元素間隔 0.1s
- Hover：`transition-all 0.3s`，`translateY(-4px)` + 發光增強
- 使用 Intersection Observer 觸發滾動進場動畫
- 不要用任何第三方動畫庫，純 CSS + hooks

### 響應式

- 桌面優先設計，用 Tailwind 的 `md:` 和 `lg:` 斷點
- 手機版必須完整可用，不能只是「縮小版桌面」
- Navbar 手機版要有漢堡選單

---

## 重要文件

- `ULTRA_LAB_LANDING_PAGE_SPEC.md` — 完整的設計規格書，包含每個 Section 的詳細內容、文案、色碼、佈局。**請在開始開發前完整閱讀此文件。**

---

## 工作流程

1. **先讀規格書** — 完整閱讀 `ULTRA_LAB_LANDING_PAGE_SPEC.md`
2. **初始化專案** — 按規格書的指令建置 Vite + React + Tailwind 專案
3. **逐一建置 Section** — 從 Navbar → Hero → Services → ... → Footer
4. **確保品質** — 每個 Section 完成後確認：RWD 正確、動畫流暢、無 TS 錯誤
5. **最終檢查** — `npm run build` 無錯誤，所有功能正常

---

## 決策原則

當遇到規格書沒有涵蓋的情況時，請依據以下優先順序做決策：

1. **品牌一致性** — 符合 Ultra Lab 的暗色工坊美學
2. **使用者體驗** — 訪客能在 10 秒內理解 Ultra Lab 做什麼
3. **技術簡潔** — 不引入不必要的依賴，保持輕量
4. **可維護性** — 程式碼結構清楚，之後容易擴展

---

## 未來擴展（先知道，現在不用做）

- 串接 Firebase 做客戶詢問表單
- Blog / 技術文章頁面
- 案例詳情頁面
- 多語系支援
- 客戶後台（查看服務進度）

這些之後會分階段加入，現在先專注把 Landing Page 做到位。

---

*「技術是武器，產品是子彈，品牌是戰場。」— Ultra Lab*