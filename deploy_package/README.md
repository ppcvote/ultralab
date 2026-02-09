# IG Reels & Threads 自動發文管理系統

## 系統概述

這是一個整合 Instagram Reels 和 Threads 的自動發文管理系統，包含：

- **IG Reels 自動發布** - 排程發布影片到 Instagram Reels + Story
- **Threads 多帳號管理** - 支援多個 Threads 帳號的文案庫和自動發文
- **AI 文案生成** - 使用 Gemini API 批量生成 Threads 貼文
- **文案庫管理** - 手動導入、編輯、排序文案
- **發文紀錄** - 追蹤成功/失敗的發文歷史

---

## 檔案清單

```
deploy_package/
├── ig_dashboard.py          # 主程式（Flask 應用）
├── ig_config.json           # Instagram 設定
├── threads_config.json      # Threads 帳號設定
├── firebase-key.json        # Firebase 服務帳號金鑰
├── *_library.json           # 各帳號的文案庫
├── requirements.txt         # Python 套件需求
└── README.md                # 本說明文件
```

---

## 環境需求

### Python 版本
- Python 3.10 或更高版本

### 安裝套件

```bash
pip install -r requirements.txt
```

或手動安裝：

```bash
pip install flask requests google-generativeai firebase-admin
```

---

## 設定檔說明

### ig_config.json

Instagram 相關設定：

```json
{
    "instagram_access_token": "你的 IG Access Token",
    "instagram_user_id": "你的 IG User ID",
    "firebase_bucket": "Firebase Storage Bucket 名稱",
    "firebase_key_path": "firebase-key.json",
    "ig_schedule": {
        "enabled": true,
        "schedule_times": "09:00,12:00,15:00,18:00,21:00",
        "also_story": true,
        "last_post": "2026-02-09 12:01"
    }
}
```

### threads_config.json

Threads 帳號設定（支援多帳號）：

```json
{
    "accounts": [
        {
            "name": "帳號名稱",
            "enabled": true,
            "threads_access_token": "Threads Access Token",
            "threads_user_id": "Threads User ID",
            "gemini_api_key": "Gemini API Key（用於 AI 生成）",
            "schedule_times": "09:00, 12:00, 18:00",
            "system_prompt": "AI 生成文案的系統提示詞",
            "last_post": "-"
        }
    ]
}
```

### firebase-key.json

Firebase 服務帳號金鑰（從 Firebase Console 下載）

---

## 啟動方式

### 開發環境

```bash
python ig_dashboard.py
```

預設在 `http://0.0.0.0:5000` 啟動

### 正式環境（推薦）

使用 gunicorn：

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 ig_dashboard:app
```

或使用 waitress（Windows 友善）：

```bash
pip install waitress
waitress-serve --port=5000 ig_dashboard:app
```

---

## 反向代理設定（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 保持程式運行

### Linux (systemd)

建立 `/etc/systemd/system/ig-dashboard.service`：

```ini
[Unit]
Description=IG Dashboard
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/deploy_package
ExecStart=/usr/bin/python3 ig_dashboard.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

啟動：

```bash
sudo systemctl enable ig-dashboard
sudo systemctl start ig-dashboard
```

### Windows（排程工作）

使用「工作排程器」設定開機啟動

### PM2（Node.js 環境）

```bash
pm2 start ig_dashboard.py --interpreter python3
pm2 save
pm2 startup
```

---

## 功能說明

### 1. IG Reels 自動發布

- 將 MP4 影片放到 `出貨區/` 資料夾
- 系統會依據排程時間自動上傳到 Instagram
- 發布成功後影片會移動到 `出貨區/已上傳/`

### 2. Threads 多帳號管理

- 在「Threads」頁面管理多個帳號
- 每個帳號可設定獨立的：
  - 發文排程時間
  - AI 生成提示詞
  - 文案庫

### 3. 文案庫

- **AI 批量生成**：使用 Gemini API 生成指定數量的文案
- **手動導入**：貼上多篇文案，用 `---` 分隔
- **排序管理**：上移、下移調整發文順序

### 4. 排程發文

- 系統啟動時自動開始排程
- 每次發文前會隨機延遲 0-5 分鐘（避免過於規律）
- 發文成功/失敗都會記錄在「發文紀錄」

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | Dashboard 主頁面 |
| GET | `/api/threads/accounts` | 取得 Threads 帳號列表 |
| POST | `/api/threads/post` | 發布 Threads 貼文 |
| GET | `/api/library/<account>` | 取得文案庫 |
| POST | `/api/library/<account>/import` | 導入文案 |
| GET | `/api/post-logs` | 取得發文紀錄 |
| GET | `/api/ig-schedule` | 取得 IG 排程設定 |

---

## 安全注意事項

1. **敏感資料保護**
   - `ig_config.json`、`threads_config.json`、`firebase-key.json` 包含敏感金鑰
   - 請確保這些檔案不會被公開存取
   - 建議設定適當的檔案權限（chmod 600）

2. **HTTPS**
   - 正式環境務必啟用 HTTPS
   - 可使用 Let's Encrypt 免費憑證

3. **存取控制**
   - 目前系統沒有登入機制
   - 建議透過 Nginx 設定基本認證或 IP 白名單

---

## 常見問題

### Q: 排程沒有自動發文？

1. 確認程式持續運行中
2. 檢查帳號的 `enabled` 是否為 `true`
3. 確認 Access Token 沒有過期

### Q: AI 生成失敗？

1. 檢查 Gemini API Key 是否正確
2. 確認有安裝 `google-generativeai` 套件

### Q: IG 發布失敗？

1. 檢查 Instagram Access Token 是否有效
2. 確認 Firebase 設定正確
3. 檢查影片格式是否符合規格（9:16, < 60MB）

---

## 技術支援

如有問題，請檢查：
1. Console 輸出的錯誤訊息
2. 發文紀錄中的錯誤描述
3. 網路連線狀態

---

## 版本資訊

- 版本：v2.1
- 最後更新：2026-02-09
