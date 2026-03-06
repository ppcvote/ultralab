# Agent Dashboard — 標準化架構 Spec

> 目標：任何客戶的 Agent Fleet，套主題就能交付視覺化戰情室。

---

## 三層架構

```
Theme Layer（純渲染）     ← 設計師負責，不碰數據
─────────────────────
Standard Schema（標準接口）← 所有主題讀同一份 JSON
─────────────────────
Adapter Layer（框架適配器）← 每個框架寫一次，把 log 轉成標準格式
```

---

## Standard Schema

### 1. AgentConfig — 客戶的 Agent 清單

```
Firestore: dashboards/{clientId}/agents/{agentId}
```

```typescript
interface AgentConfig {
  id: string              // "agent-01"
  name: string            // "客服機器人"
  shortName: string       // "客服" (sprite 標籤用)
  role: string            // "Customer Support"
  color: string           // "#14B8A6"
  avatar: string          // 主題定義的角色類型 key
  skills: string[]        // ["回覆查詢", "訂單追蹤"]
  links?: {               // 選填，外部連結
    platform?: string
    product?: string
  }
}
```

### 2. ActivityFeed — 即時活動數據

```
Firestore: dashboards/{clientId}/activity/latest
```

```typescript
interface ActivityFeed {
  agents: Record<string, {
    status: 'online' | 'busy' | 'idle' | 'offline'
    currentTask: string           // "回覆客戶 #384"
    updatedAt: Timestamp
    stats: {
      actions: number             // 今日總動作數
      errors: number
    }
  }>
  events: {
    time: Timestamp               // ISO，UI 層格式化
    agentId: string
    type: 'post' | 'reply' | 'scan' | 'error' | 'learn' | 'idle'
    detail: string
  }[]
  fleet: {
    totalActions: number
    totalErrors: number
    uptime: number                // 0-100 整數，不是字串
    agentCount: number
  }
  updatedAt: Timestamp
}
```

### 3. ThemeManifest — 主題定義

```
每個主題是一個資料夾：themes/{themeId}/
├── manifest.json         ← 佈局 + 角色映射
├── styles.css            ← 主題專屬動畫
├── sprites/              ← 角色素材（或用 CSS 畫）
└── furniture/            ← 傢俱素材
```

```typescript
interface ThemeManifest {
  id: string                      // "cyberpunk" | "shrimp-pond" | "ranch"
  name: string                    // "賽博像素風"
  description: string
  rooms: {
    id: string                    // "room-01"
    label: string                 // "指揮中心" / "蝦池 A" / "牧場"
    position: { top: number, left: number, w: number, h: number }
    owner: string | null          // agentId，null = 共用
    style: Record<string, any>    // 主題專屬樣式
  }[]
  avatarMap: {
    // 把 AgentConfig.avatar 映射到主題的角色外觀
    [avatarKey: string]: {
      skin: string
      body: string
      accessory: string
      // ...主題自定義欄位
    }
  }
  corridorY: number               // 走廊 Y 軸位置 (%)
  ambientEffects?: string[]       // ["particles", "scan-line", "rain"]
}
```

---

## Adapter Layer

每個 Agent 框架寫一個 adapter，輸出 Standard Schema：

```typescript
// adapter 接口
interface DashboardAdapter {
  // 框架名稱
  framework: 'openclaw' | 'langgraph' | 'crewai' | 'custom'

  // 從框架原生 log 轉成 ActivityFeed
  syncActivity(clientId: string): Promise<void>

  // 初始化：讀框架 config → 寫 AgentConfig
  initAgents(clientId: string): Promise<void>
}
```

### OpenClaw Adapter（我們自己用的）

數據來源：
- `openclaw cron runs` → events + stats
- `fleet-status.json`（healthcheck 產出）→ agent status
- workspace `memory/*.md` → currentTask

輸出：寫入 Firestore `dashboards/{clientId}/activity/latest`

### 其他框架 Adapter（未來）

| 框架 | 數據來源 | 難度 |
|------|---------|------|
| LangGraph | LangSmith API / callback logs | 中 |
| CrewAI | crew.log / callback handler | 低 |
| AutoGen | conversation history JSON | 中 |
| 自建 | 客戶提供 webhook / log format | 客製 |

---

## 主題開發流程

```
1. 設計師畫房間佈局 + 角色 sprites
2. 寫 manifest.json（房間座標、角色映射）
3. 寫 styles.css（主題動畫）
4. 註冊到主題商店
5. 客戶選主題 → 前端載入 manifest → 渲染
```

設計師不需要懂 TypeScript，只需要：
- 會寫 JSON（佈局座標）
- 會寫 CSS（動畫）
- 會畫 pixel art 或 SVG（角色 + 傢俱）

---

## 現有架構 → 標準架構的遷移步驟

### Phase 1：數據解耦（不改 UI）

- [ ] 把 `agent-data.ts` 的 AGENTS_META 搬到 Firestore `dashboards/ultralab/agents/`
- [ ] 把 `useAgentActivity` 的 Firestore path 改為讀 `dashboards/ultralab/activity/latest`
- [ ] `update-fleet-status.js` 改為寫入標準 ActivityFeed 格式
- [ ] NerveCenter 改從 Firestore 讀 agent config（fallback 到現有 hardcode）

### Phase 2：主題抽離

- [ ] 把現有的賽博風佈局抽成 `themes/cyberpunk/manifest.json`
- [ ] NerveCenter 改為讀 manifest 渲染房間（不再 hardcode ROOMS）
- [ ] CSS 動畫搬到 `themes/cyberpunk/styles.css`
- [ ] Sprite 渲染改為讀 manifest 的 avatarMap

### Phase 3：第二個主題驗證

- [ ] 設計「釣蝦場」主題（manifest + sprites + CSS）
- [ ] 用同一份數據，切換主題能正常渲染
- [ ] 驗證：換主題不改任何 TypeScript code

### Phase 4：Adapter + 多租戶

- [ ] OpenClaw Adapter 正式化（從現有 healthcheck 腳本演化）
- [ ] `clientId` 路由：URL param 或 subdomain 決定讀哪份數據
- [ ] 主題商店 UI（選主題 → 預覽 → 套用）

---

## 交付 SOP（Phase 4 完成後）

```
新客戶 →
1. 開 Firestore dashboards/{clientId}/
2. 填 Agent 資料 → agents/ collection
3. 安裝 Adapter（framework-specific script）
4. 客戶選主題
5. 給客戶 URL：ultralab.tw/dashboard/{clientId}
6. 完成
```

新增主題 →
1. 設計師交付 manifest.json + CSS + sprites
2. 放入 themes/{themeId}/
3. 更新主題商店
4. 所有客戶都能選用

---

*Ultra Lab — Agent Dashboard Product Spec v0.1 (2026-03-07)*
