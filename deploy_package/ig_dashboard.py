#!/usr/bin/env python3
"""
IG Reels 發布管理介面

用法：
  python ig_dashboard.py
  瀏覽器打開 http://localhost:5000
"""

import json
import os
import re
import subprocess
import threading
import time
import logging
from pathlib import Path

from flask import Flask, jsonify, request, send_file, Response

# Anthropic SDK (optional - graceful fallback if not installed)
try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

from upload_ig_reel import (
    SCRIPT_DIR,
    DEFAULT_VIDEO_DIR,
    DEFAULT_LIBRARY,
    parse_library,
    upload_reel,
    setup_logging,
    logger,
)

app = Flask(__name__)

UPLOADED_DIR = DEFAULT_VIDEO_DIR / "已上傳"
ARCHIVE_DIR = SCRIPT_DIR / "封存區"

# ===== 發布進度追蹤 =====
upload_state = {
    "status": "idle",       # idle / busy / done / error
    "step": "",
    "video": "",
    "post_id": None,
    "story_id": None,
    "error": None,
}
upload_lock = threading.Lock()

# ===== 轉檔進度追蹤 =====
render_state = {
    "status": "idle",       # idle / busy / done / error
    "step": "",
    "file": "",
    "percent": 0,
    "error": None,
}
render_lock = threading.Lock()

# ===== 批次轉檔進度追蹤 =====
batch_render_state = {
    "status": "idle",       # idle / busy / done / error
    "step": "",
    "files": [],            # 要轉檔的檔案列表
    "current_index": 0,     # 目前處理到第幾個
    "current_file": "",     # 目前正在處理的檔案
    "completed": [],        # 已完成的檔案
    "failed": [],           # 失敗的檔案
    "percent": 0,
    "error": None,
}
batch_render_lock = threading.Lock()

# ===== AI 生成進度追蹤 =====
generate_state = {
    "status": "idle",       # idle / busy / done / error
    "step": "",
    "topic": "",
    "file": "",
    "error": None,
}
generate_lock = threading.Lock()

# ===== 自動產線進度追蹤 =====
pipeline_state = {
    "status": "idle",       # idle / running / paused / error
    "step": "",
    "topic": "",
    "current_stage": "",    # topic / html / render / caption / publish
    "last_run": None,
    "next_run": None,
    "interval_hours": 4,
    "runs_completed": 0,
    "error": None,
    "log": [],              # 最近的執行日誌
}
pipeline_lock = threading.Lock()
pipeline_thread = None
pipeline_stop_event = threading.Event()

CONFIG_PATH = SCRIPT_DIR / "ig_config.json"
THREADS_CONFIG_PATH = SCRIPT_DIR / "threads_config.json"

# ===== Threads 發文狀態追蹤 =====
threads_state = {
    "status": "idle",       # idle / busy / done / error
    "step": "",
    "account": "",
    "error": None,
}
threads_lock = threading.Lock()

# ===== 文案庫自動排程狀態 (Threads) =====
scheduler_state = {
    "running": False,
    "accounts": {},  # {account_name: {"enabled": True, "next_post": "HH:MM", "last_check": datetime}}
}
scheduler_lock = threading.Lock()
scheduler_thread = None
scheduler_stop_event = threading.Event()

# ===== 發文紀錄 =====
post_logs = []  # [{time, account, type, status, message, post_id}, ...]
post_logs_lock = threading.Lock()
MAX_POST_LOGS = 100  # 最多保留 100 筆紀錄

def add_post_log(account, log_type, status, message, post_id=None):
    """新增發文紀錄"""
    with post_logs_lock:
        post_logs.insert(0, {
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "account": account,
            "type": log_type,  # "threads" or "ig"
            "status": status,  # "success" or "error"
            "message": message,
            "post_id": post_id
        })
        # 限制紀錄數量
        while len(post_logs) > MAX_POST_LOGS:
            post_logs.pop()

# ===== IG 影片排程狀態 =====
ig_scheduler_state = {
    "running": False,
    "next_post": None,
    "last_post": None,
}
ig_scheduler_lock = threading.Lock()
ig_scheduler_thread = None
ig_scheduler_stop_event = threading.Event()


def update_threads(**kwargs):
    with threads_lock:
        threads_state.update(kwargs)


def update_state(**kwargs):
    with upload_lock:
        upload_state.update(kwargs)


def update_render(**kwargs):
    with render_lock:
        render_state.update(kwargs)


def update_batch_render(**kwargs):
    with batch_render_lock:
        batch_render_state.update(kwargs)


def update_generate(**kwargs):
    with generate_lock:
        generate_state.update(kwargs)


def update_pipeline(**kwargs):
    with pipeline_lock:
        pipeline_state.update(kwargs)


def pipeline_log(msg, level="INFO"):
    """添加日誌到產線狀態"""
    from datetime import datetime
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = f"[{timestamp}] [{level}] {msg}"
    with pipeline_lock:
        pipeline_state["log"].append(entry)
        # 只保留最近 50 條日誌
        if len(pipeline_state["log"]) > 50:
            pipeline_state["log"] = pipeline_state["log"][-50:]


# ===== AI 生成輔助函數 =====
def get_published_topics():
    """從封存區取得已發布的主題列表（依修改時間排序，最新在前）"""
    topics = []
    if ARCHIVE_DIR.exists():
        files = list(ARCHIVE_DIR.glob("*.html"))
        # 依修改時間排序（最新在前）
        files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        for f in files:
            if f.stem != "index":  # 排除 index.html
                topics.append(f.stem)
    return topics


def build_system_prompt():
    """讀取規格檔案建構 system prompt"""
    parts = []

    # 優先使用新版規格書
    new_spec = SCRIPT_DIR / "UltraAdvisorVideo-Spec.md"
    if new_spec.exists():
        parts.append("=== Ultra Advisor Video 正式規格書 ===\n" + new_spec.read_text(encoding="utf-8"))
    else:
        # 舊版規格書 fallback
        claude_md = SCRIPT_DIR / "CLAUDE.md"
        if claude_md.exists():
            parts.append("=== CLAUDE.MD 技術規範 ===\n" + claude_md.read_text(encoding="utf-8"))

        spec_file = SCRIPT_DIR / "短影規格書.md"
        if spec_file.exists():
            parts.append("=== 短影規格書 ===\n" + spec_file.read_text(encoding="utf-8"))

    # 已發布主題列表（讓 AI 知道做過什麼）
    published = get_published_topics()
    if published:
        recent_20 = published[:20]  # 只顯示最近 20 個
        parts.append(f"""
=== 已發布主題列表（最近 {len(recent_20)} 篇，共 {len(published)} 篇） ===
以下是已經製作過的主題，從最新到最舊排序：
{chr(10).join(f'- {t}' for t in recent_20)}

【主題選擇建議】
- 可以重複已發布的主題，但建議間隔 10 篇以上再重複
- 優先選擇尚未製作過的新主題
- 如果使用者指定的主題已存在，仍然製作，但可以用不同的視覺隱喻
""")

    # 核心結構範例
    parts.append("""
=== 核心程式結構範例（必須遵循） ===

```javascript
// 1. 全域常數
const FPS = 30;
const DURATION = 25;
const TOTAL_FRAMES = FPS * DURATION;

// 2. 種子隨機（必須）
let seed = 12345;
function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

// 3. 防競爭機制（必須）- FFmpeg 錄製器會設定此變數
let isRecording = false;

// 4. 動畫狀態
let anim = { ... };
let firedEvents = {};

// 5. 狀態重置函數（必須）
function resetState() {
    seed = 12345;
    firedEvents = {};
    anim = { ...初始值 };
    // 重置所有 DOM 狀態
    document.querySelectorAll('.subtitle-group').forEach(el => el.classList.remove('active'));
    document.getElementById('watermark').style.opacity = '0.5';
    document.getElementById('end-scene').style.opacity = '0';
    // ... 其他 DOM 重置
}

// 6. 事件觸發系統（必須）
function checkEvent(frame, sec, callback) {
    const key = `event_${sec}`;
    if (frame >= Math.round(sec * FPS) && !firedEvents[key]) {
        firedEvents[key] = true;
        callback();
    }
}

// 7. 核心渲染函數（必須）
function renderSceneByFrame(frame) {
    if (frame === 0) resetState();
    const time = frame / FPS;

    // 時間軸事件
    checkEvent(frame, 0, () => { showSubtitle('t1'); });
    checkEvent(frame, 4, () => { showSubtitle('t2'); anim.phase = 'conflict'; });
    checkEvent(frame, 8, () => { showSubtitle('t3'); anim.phase = 'insight'; });
    checkEvent(frame, 12, () => { showSubtitle('t4'); anim.phase = 'solution'; });
    checkEvent(frame, 19, () => { showSubtitle('t6'); });
    checkEvent(frame, 21, () => {
        document.getElementById('watermark').style.opacity = '0';
        document.getElementById('end-scene').style.opacity = '1';
        // Outro Logo 描邊動畫
        setTimeout(() => {
            document.querySelectorAll('.lp').forEach(p => {
                p.style.transition = 'stroke-dashoffset 2s ease-in-out';
                p.style.strokeDashoffset = '0';
            });
        }, 100);
    });

    // 動畫邏輯（使用緩動）
    anim.value += (anim.target - anim.value) * 0.03;

    // 震動（使用正弦波，不要用 Math.random）
    let shakeX = Math.sin(time * 22) * anim.shake;
    let shakeY = Math.cos(time * 16) * anim.shake;
    if (anim.shake > 0) anim.shake *= 0.96;

    renderer.render(scene, camera);
}

// 8. 外部接口（必須）
window.renderSingleFrame = function(timeInSec) {
    renderSceneByFrame(Math.round(timeInSec * FPS));
};

// 9. 自動播放迴圈（有 isRecording 保護）
let currentFrame = 0;
function autoPlayLoop() {
    if (isRecording) return; // 錄製時停止自動播放
    renderSceneByFrame(currentFrame);
    currentFrame++;
    if (currentFrame < TOTAL_FRAMES) requestAnimationFrame(autoPlayLoop);
}
autoPlayLoop();
```

=== HTML 結構範例（必須遵循） ===

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>主題名稱</title>
    <!-- 必須引入的字體 -->
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        /* viewport 固定 1080x1920 */
        #viewport { width: 1080px; height: 1920px; position: relative; overflow: hidden; background: #000; }

        /* 字幕系統 */
        .subtitle-group { opacity: 0; transform: translateY(30px); transition: all 0.5s; position: absolute; width: 100%; }
        .subtitle-group.active { opacity: 1; transform: translateY(0); }
        .sub-en { font-family: 'Orbitron', sans-serif; font-size: 48px; }
        .sub-zh { font-family: 'Noto Sans TC', sans-serif; font-size: 36px; }

        /* 浮水印 */
        #watermark { position: absolute; bottom: 180px; left: 40px; z-index: 100; opacity: 0.5; transition: opacity 0.5s; }
        .wm-logo { ... }
        .wm-text { font-family: 'Orbitron'; }

        /* Outro Logo 描邊動畫 */
        .lp {
            fill: none;
            stroke-width: 16;
            stroke-linecap: round;
            stroke-dasharray: 800;
            stroke-dashoffset: 800;
        }
    </style>
</head>
<body>
    <div id="viewport">
        <div id="canvas-container"></div>

        <!-- 字幕 -->
        <div id="subtitle-container">
            <div class="subtitle-group" id="t1"><div class="sub-en">INTRO EN</div><div class="sub-zh">介紹中文</div></div>
            <div class="subtitle-group" id="t2"><div class="sub-en">CONFLICT EN</div><div class="sub-zh">衝突中文</div></div>
            <div class="subtitle-group" id="t3"><div class="sub-en">INSIGHT EN</div><div class="sub-zh">洞見中文</div></div>
            <div class="subtitle-group" id="t4"><div class="sub-en">SOLUTION EN</div><div class="sub-zh">解決中文</div></div>
            <div class="subtitle-group" id="t5"><div class="sub-en">...</div><div class="sub-zh">...</div></div>
            <div class="subtitle-group" id="t6"><div class="sub-en">ULTRA ADVISOR</div><div class="sub-zh">傲創思維</div></div>
        </div>

        <!-- 浮水印 -->
        <div id="watermark">
            <div class="wm-logo"><!-- SVG --></div>
            <div class="wm-text">ULTRA ADVISOR</div>
        </div>

        <!-- Outro 場景 -->
        <div id="end-scene">
            <svg viewBox="0 0 320 420">
                <defs>
                    <linearGradient id="gB" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4DA3FF"/><stop offset="100%" stop-color="#2E6BFF"/></linearGradient>
                    <linearGradient id="gR" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FF6A6A"/><stop offset="100%" stop-color="#FF3A3A"/></linearGradient>
                </defs>
                <path class="lp" stroke="url(#gB)" d="M 90,40 C 90,160 130,220 242,380"/>
                <path class="lp" stroke="url(#gR)" d="M 230,40 C 230,160 190,220 78,380"/>
            </svg>
            <div class="ln">ULTRA ADVISOR</div>
            <div class="le">關注我，啟發更多商業思維</div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        // JavaScript 程式碼（見上方結構範例）
    </script>
</body>
</html>
```
""")

    # 輸出指示
    parts.append("""
=== 輸出指示 ===
請輸出完整的 HTML 檔案，不要任何解釋文字或 markdown 代碼圍欄。
直接以 <!DOCTYPE html> 開頭，以 </html> 結尾。

【12 項必要驗證標準】
1. ✅ window.renderSingleFrame = function(timeInSec) 接口
2. ✅ 無迴圈模式（renderSingleFrame 直接呼叫 renderSceneByFrame）
3. ✅ 種子隨機 seed = 12345
4. ✅ 無 Math.random()（改用 random() 或正弦波）
5. ✅ 無 setTimeout()（改用 checkEvent 事件系統）
6. ✅ Orbitron 字體（Google Fonts 引入）
7. ✅ Noto Sans TC 字體（Google Fonts 引入）
8. ✅ 浮水印（含 wm-logo 或 watermark class）
9. ✅ Outro Logo 描邊動畫（.lp class + stroke-dasharray/dashoffset）
10. ✅ checkEvent 事件系統（或 firedEvents 物件）
11. ✅ resetState 函數（重置所有狀態和 DOM）
12. ✅ isRecording 變數（防止 autoPlayLoop 與錄製器競爭）

【嚴格禁止】
- 不要使用 Math.random()
- 不要使用 setTimeout() 或 setInterval()
- 不要在 renderSingleFrame 內使用迴圈
- 不要直接賦值位置（要用緩動公式）
""")

    return "\n\n".join(parts)


def build_user_prompt(topic, metaphors, subtitles, extra):
    """從表單輸入建構 user prompt"""
    parts = [f"請依照規格書製作「{topic}」HTML 動畫。\n"]

    parts.append(f"## 主題\n{topic}\n")

    if metaphors:
        parts.append(f"## 視覺隱喻\n{metaphors}\n")
    else:
        parts.append("## 視覺隱喻\n請自行設計合適的視覺隱喻。\n")

    if subtitles and len(subtitles) >= 4:
        parts.append("## 敘事結構")
        parts.append("| 階段 | 字幕 EN | 字幕 ZH |")
        parts.append("|------|---------|---------|")
        stages = ["Intro (0-4s)", "Conflict (4-8s)", "Insight (8-12s)", "Solution (12-19s)"]
        for i, stage in enumerate(stages):
            if i < len(subtitles):
                en = subtitles[i].get("en", "")
                zh = subtitles[i].get("zh", "")
                parts.append(f"| {stage} | {en} | {zh} |")
        parts.append("")
    else:
        parts.append("## 字幕\n請自行設計合適的中英文字幕。\n")

    if extra:
        parts.append(f"## 額外要求\n{extra}\n")

    parts.append("確保符合規格書的所有 12 項驗證標準。輸出完整的 HTML 檔案，不要任何解釋文字。")

    return "\n".join(parts)


def extract_html(text):
    """從 Claude 回應中擷取 HTML（處理 markdown fences）"""
    # 嘗試從 code fences 中擷取
    match = re.search(r'```html?\s*\n([\s\S]*?)\n```', text)
    if match:
        return match.group(1).strip()

    # 如果直接以 <!DOCTYPE 開頭，直接使用
    text = text.strip()
    if text.startswith('<!DOCTYPE') or text.startswith('<html'):
        return text

    # 嘗試在文字中找到 HTML
    match = re.search(r'(<!DOCTYPE[\s\S]*</html>)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    return text


# ===== 自訂 log handler 攔截進度 =====
class ProgressHandler(logging.Handler):
    STEP_MAP = [
        ("開始上傳到 Firebase", "上傳到 Firebase..."),
        ("Firebase 上傳完成", "Firebase 上傳完成"),
        ("建立 IG Reels Container", "建立 IG Container..."),
        ("IG Container 建立成功", "等待 IG 處理影片..."),
        ("等待 IG 處理影片", "等待 IG 處理影片..."),
        ("處理中...", "IG 處理中..."),
        ("影片處理完成", "影片處理完成"),
        ("開始發布 Reel", "發布 Reel 中..."),
        ("發布成功", "Reel 發布成功！"),
        ("建立限時動態", "建立限時動態..."),
        ("限時動態 Container 建立成功", "等待限動處理..."),
        ("發布限時動態...", "發布限時動態..."),
        ("限時動態發布成功", "限時動態發布成功！"),
        ("Firebase 暫存檔已清理", "清理完成"),
        ("Firebase 上傳失敗", "Firebase 上傳重試中..."),
    ]

    def emit(self, record):
        msg = record.getMessage()
        for keyword, step_text in self.STEP_MAP:
            if keyword in msg:
                update_state(step=step_text)
                break


# ===== HTML 品質驗證（移植自 fast_single.js） =====
def validate_html(file_path: str) -> dict:
    """驗證 HTML 是否符合規格書，回傳 {passed: bool, checks: [...]}"""
    path = Path(file_path)
    html = path.read_text(encoding="utf-8")

    checks = []

    def check(name, passed, detail=""):
        checks.append({"name": name, "passed": passed, "detail": detail})

    # 1. renderSingleFrame 接口
    has_rsf = bool(re.search(r'window\.renderSingleFrame\s*=\s*function\s*\(\s*timeInSec\s*\)', html))
    check("renderSingleFrame 接口", has_rsf)

    # 2. 無迴圈模式
    has_loop = bool(re.search(r'renderSingleFrame[\s\S]{0,200}for\s*\(\s*var\s+\w+\s*=\s*0', html))
    check("無迴圈模式", not has_loop, "renderSingleFrame 應直接呼叫 renderSceneByFrame" if has_loop else "")

    # 3. 種子隨機
    has_seed = bool(re.search(r'seed\s*=\s*12345', html))
    check("種子隨機 seed=12345", has_seed)

    # 4. 無 Math.random
    script_matches = re.findall(r'<script[^>]*>[\s\S]*?</script>', html, re.IGNORECASE)
    scripts = "\n".join(script_matches)
    inline_script = re.sub(r'<script[^>]*src=[^>]*></script>', '', scripts, flags=re.IGNORECASE)
    has_math_random = bool(re.search(r'Math\.random\s*\(', inline_script))
    check("無 Math.random()", not has_math_random)

    # 5. 無 setTimeout
    has_set_timeout = bool(re.search(r'setTimeout\s*\(', inline_script))
    check("無 setTimeout()", not has_set_timeout, "會導致錄製加速，請改用 checkEvent" if has_set_timeout else "")

    # 6. Orbitron 字體
    has_orbitron = bool(re.search(r'Orbitron', html))
    check("Orbitron 字體", has_orbitron)

    # 7. Noto Sans TC 字體
    has_noto = bool(re.search(r'Noto\s*Sans\s*TC', html))
    check("Noto Sans TC 字體", has_noto)

    # 8. 浮水印
    has_watermark = bool(re.search(r'wm-logo|watermark', html))
    check("浮水印", has_watermark)

    # 9. Outro Logo 描邊
    has_lp = bool(re.search(r'class=["\']lp["\']', html))
    check("Outro Logo 描邊 (.lp)", has_lp)

    # 10. checkEvent 系統
    has_check_event = bool(re.search(r'checkEvent|firedEvents', html))
    check("checkEvent 事件系統", has_check_event)

    # 11. resetState
    has_reset = bool(re.search(r'resetState', html))
    check("resetState 函數", has_reset)

    # 12. isRecording 防競爭
    has_is_recording = bool(re.search(r'isRecording', html))
    check("isRecording 防競爭", has_is_recording)

    all_passed = all(c["passed"] for c in checks)
    return {"passed": all_passed, "checks": checks}


# ===== API 路由 - 影片 =====

@app.route("/api/videos")
def api_videos():
    pending = []
    uploaded = []

    if DEFAULT_VIDEO_DIR.exists():
        uploaded_names = set()
        if UPLOADED_DIR.exists():
            uploaded_names = {f.stem for f in UPLOADED_DIR.glob("*.mp4")}

        for mp4 in sorted(DEFAULT_VIDEO_DIR.glob("*.mp4")):
            name = mp4.stem
            size_mb = round(mp4.stat().st_size / (1024 * 1024), 1)

            try:
                parse_library(str(DEFAULT_LIBRARY), name)
                has_caption = True
            except (FileNotFoundError, ValueError):
                has_caption = False

            if name in uploaded_names:
                continue

            pending.append({
                "name": name, "file": mp4.name,
                "size_mb": size_mb, "has_caption": has_caption,
            })

        if UPLOADED_DIR.exists():
            for mp4 in sorted(UPLOADED_DIR.glob("*.mp4")):
                size_mb = round(mp4.stat().st_size / (1024 * 1024), 1)
                uploaded.append({"name": mp4.stem, "file": mp4.name, "size_mb": size_mb})

    return jsonify({"pending": pending, "uploaded": uploaded})


@app.route("/api/caption/<name>")
def api_caption(name):
    try:
        caption = parse_library(str(DEFAULT_LIBRARY), name)
        return jsonify({"success": True, "caption": caption})
    except (FileNotFoundError, ValueError) as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/video/<path:filename>")
def serve_video(filename):
    video_path = DEFAULT_VIDEO_DIR / filename
    if not video_path.exists():
        video_path = UPLOADED_DIR / filename
    if not video_path.exists():
        return "File not found", 404
    return send_file(str(video_path), mimetype="video/mp4")


# ===== API 路由 - 發布 =====

@app.route("/api/upload", methods=["POST"])
def api_upload():
    with upload_lock:
        if upload_state["status"] == "busy":
            return jsonify({"success": False, "error": "已有發布任務進行中"}), 409

    data = request.get_json()
    video_name = data.get("video", "")
    also_story = data.get("also_story", False)

    video_path = DEFAULT_VIDEO_DIR / f"{video_name}.mp4"
    if not video_path.exists():
        return jsonify({"success": False, "error": f"找不到影片：{video_name}.mp4"}), 404

    try:
        caption = parse_library(str(DEFAULT_LIBRARY), video_name)
    except (FileNotFoundError, ValueError) as e:
        return jsonify({"success": False, "error": f"文案匹配失敗：{e}"}), 400

    update_state(status="busy", step="準備中...", video=video_name,
                 post_id=None, story_id=None, error=None)

    def do_upload():
        try:
            result = upload_reel(str(video_path), caption, also_story=also_story)
            if result["success"]:
                # 移動檔案到「已上傳」資料夾
                try:
                    import shutil
                    UPLOADED_DIR.mkdir(exist_ok=True)
                    dest = UPLOADED_DIR / video_path.name
                    if dest.exists():
                        dest.unlink()  # 如果已存在，先刪除
                    shutil.move(str(video_path), str(dest))
                    logger.info(f"影片已移至: {dest}")
                except Exception as move_err:
                    logger.warning(f"移動檔案失敗: {move_err}")
                    # 不影響發布結果，只是檔案沒有移動
                update_state(status="done", step="發布完成！",
                             post_id=result.get("post_id"), story_id=result.get("story_id"))
            else:
                update_state(status="error", step="發布失敗",
                             error=result.get("error", "未知錯誤"))
        except Exception as e:
            update_state(status="error", step="發布失敗", error=str(e))

    threading.Thread(target=do_upload, daemon=True).start()
    return jsonify({"success": True, "message": "發布任務已啟動"})


@app.route("/api/upload/status")
def api_upload_status():
    with upload_lock:
        return jsonify(dict(upload_state))


@app.route("/api/upload/reset", methods=["POST"])
def api_upload_reset():
    update_state(status="idle", step="", video="", post_id=None, story_id=None, error=None)
    return jsonify({"success": True})


# ===== IG 排程 API =====

@app.route("/api/ig-schedule")
def api_ig_schedule():
    """取得 IG 排程設定和狀態"""
    config = load_ig_config()
    schedule_config = config.get("ig_schedule", {
        "enabled": False,
        "schedule_times": "09:00,18:00",
        "also_story": True,
        "last_post": "-"
    })

    schedule_times = parse_schedule_times(schedule_config.get("schedule_times", ""))
    pending = get_pending_videos()

    return jsonify({
        "success": True,
        "schedule": schedule_config,
        "stats": {
            "pending_count": len(pending),
            "daily_required": len(schedule_times),
            "days_available": len(pending) // len(schedule_times) if schedule_times else 0,
            "next_post_time": get_next_scheduled_time(schedule_times) if schedule_times else None,
            "scheduler_running": ig_scheduler_state["running"]
        },
        "pending_videos": [v["name"] for v in pending[:10]]  # 只返回前 10 個
    })


@app.route("/api/ig-schedule", methods=["POST"])
def api_ig_schedule_save():
    """儲存 IG 排程設定"""
    data = request.get_json()
    config = load_ig_config()

    schedule_config = config.get("ig_schedule", {})
    schedule_config["enabled"] = data.get("enabled", False)
    schedule_config["schedule_times"] = data.get("schedule_times", "09:00,18:00")
    schedule_config["also_story"] = data.get("also_story", True)

    config["ig_schedule"] = schedule_config
    save_ig_config(config)

    return jsonify({"success": True})


@app.route("/api/ig-schedule/start", methods=["POST"])
def api_ig_schedule_start():
    """啟動 IG 排程器"""
    success = start_ig_scheduler()
    return jsonify({"success": success, "running": ig_scheduler_state["running"]})


@app.route("/api/ig-schedule/stop", methods=["POST"])
def api_ig_schedule_stop():
    """停止 IG 排程器"""
    success = stop_ig_scheduler()
    return jsonify({"success": success, "running": ig_scheduler_state["running"]})


@app.route("/api/video/<name>/move-to-uploaded", methods=["POST"])
def api_video_move_to_uploaded(name):
    """手動將影片移動到已上傳資料夾"""
    import shutil

    video_path = DEFAULT_VIDEO_DIR / f"{name}.mp4"
    if not video_path.exists():
        return jsonify({"success": False, "error": f"找不到影片：{name}.mp4"}), 404

    try:
        UPLOADED_DIR.mkdir(exist_ok=True)
        dest = UPLOADED_DIR / video_path.name
        if dest.exists():
            dest.unlink()  # 如果已存在，先刪除
        shutil.move(str(video_path), str(dest))
        return jsonify({"success": True, "message": f"已移動 {name}.mp4 到已上傳"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/video/<name>/move-to-pending", methods=["POST"])
def api_video_move_to_pending(name):
    """將影片從已上傳移回待發布"""
    import shutil

    video_path = UPLOADED_DIR / f"{name}.mp4"
    if not video_path.exists():
        return jsonify({"success": False, "error": f"找不到影片：{name}.mp4"}), 404

    try:
        dest = DEFAULT_VIDEO_DIR / video_path.name
        if dest.exists():
            dest.unlink()
        shutil.move(str(video_path), str(dest))
        return jsonify({"success": True, "message": f"已移回 {name}.mp4 到待發布"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ===== API 路由 - 製作（HTML 清單 + 驗證 + 轉檔） =====

@app.route("/api/html-files")
def api_html_files():
    """列出根目錄的 HTML 檔案（待轉檔）和封存區的 HTML（已轉檔）"""
    pending = []
    archived = []

    for f in sorted(SCRIPT_DIR.glob("*.html")):
        size_kb = round(f.stat().st_size / 1024, 1)
        pending.append({"name": f.stem, "file": f.name, "size_kb": size_kb})

    if ARCHIVE_DIR.exists():
        for f in sorted(ARCHIVE_DIR.glob("*.html")):
            size_kb = round(f.stat().st_size / 1024, 1)
            archived.append({"name": f.stem, "file": f.name, "size_kb": size_kb})

    return jsonify({"pending": pending, "archived": archived})


@app.route("/api/validate/<name>")
def api_validate(name):
    """驗證指定 HTML 是否符合規格"""
    html_path = SCRIPT_DIR / f"{name}.html"
    if not html_path.exists():
        # 也看封存區
        html_path = ARCHIVE_DIR / f"{name}.html"
    if not html_path.exists():
        return jsonify({"success": False, "error": "找不到檔案"}), 404

    result = validate_html(str(html_path))
    return jsonify({"success": True, **result})


@app.route("/html-preview/<name>")
def serve_html_preview(name):
    """提供 HTML 檔案預覽"""
    html_path = SCRIPT_DIR / f"{name}.html"
    if not html_path.exists():
        html_path = ARCHIVE_DIR / f"{name}.html"
    if not html_path.exists():
        return "File not found", 404
    return send_file(str(html_path), mimetype="text/html")


@app.route("/api/render", methods=["POST"])
def api_render():
    """開始轉檔（背景執行 node fast_single.js 單一檔案）"""
    with render_lock:
        if render_state["status"] == "busy":
            return jsonify({"success": False, "error": "已有轉檔任務進行中"}), 409

    data = request.get_json()
    html_name = data.get("file", "")

    html_path = SCRIPT_DIR / f"{html_name}.html"
    if not html_path.exists():
        return jsonify({"success": False, "error": f"找不到 HTML：{html_name}.html"}), 404

    # 先驗證
    validation = validate_html(str(html_path))
    if not validation["passed"]:
        failed = [c["name"] for c in validation["checks"] if not c["passed"]]
        return jsonify({"success": False,
                        "error": f"規格驗證未通過：{', '.join(failed)}"}), 400

    update_render(status="busy", step="啟動轉檔...", file=html_name, percent=0, error=None)

    def do_render():
        try:
            # 執行 node fast_single.js（它會自動處理根目錄的 HTML）
            # 但我們只想轉特定檔案，所以先把其他 HTML 暫時忽略
            # 方法：直接用 node 跑，它會掃描根目錄所有 .html
            # 因為通常只有幾個 HTML 在根目錄，這樣最簡單
            update_render(step="渲染中...", percent=5)

            proc = subprocess.Popen(
                ["node", str(SCRIPT_DIR / "fast_single.js")],
                cwd=str(SCRIPT_DIR),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding="utf-8",
                errors="replace",
            )

            for line in proc.stdout:
                line = line.strip()
                if not line:
                    continue

                # 解析進度
                pct_match = re.search(r'進度:\s*(\d+)%', line)
                if pct_match:
                    pct = int(pct_match.group(1))
                    update_render(step=f"渲染中... {pct}%", percent=pct)
                elif "驗證通過" in line:
                    update_render(step="驗證通過，開始渲染...", percent=3)
                elif "驗證失敗" in line:
                    update_render(step="驗證失敗", percent=0)
                elif "開始錄製" in line:
                    update_render(step="開始錄製...", percent=5)
                elif "合併音樂" in line:
                    update_render(step="合併 BGM...", percent=92)
                elif "音樂合併完成" in line:
                    update_render(step="BGM 合併完成", percent=95)
                elif "已封存" in line:
                    update_render(step="封存完成", percent=98)
                elif "完成" in line and "耗時" in line:
                    update_render(step="渲染完成！", percent=90)
                elif "全部完工" in line:
                    update_render(step="全部完工！", percent=100)

            proc.wait()

            if proc.returncode == 0:
                update_render(status="done", step="轉檔完成！", percent=100)
            else:
                update_render(status="error", step="轉檔失敗",
                              error=f"fast_single.js 退出碼：{proc.returncode}")

        except Exception as e:
            update_render(status="error", step="轉檔失敗", error=str(e))

    threading.Thread(target=do_render, daemon=True).start()
    return jsonify({"success": True, "message": "轉檔任務已啟動"})


@app.route("/api/render/status")
def api_render_status():
    with render_lock:
        return jsonify(dict(render_state))


@app.route("/api/render/reset", methods=["POST"])
def api_render_reset():
    update_render(status="idle", step="", file="", percent=0, error=None)
    return jsonify({"success": True})


# ===== API 路由 - 批次轉檔 =====

@app.route("/api/batch-render", methods=["POST"])
def api_batch_render():
    """開始批次轉檔（背景執行多個檔案）"""
    with batch_render_lock:
        if batch_render_state["status"] == "busy":
            return jsonify({"success": False, "error": "已有批次轉檔任務進行中"}), 409

    data = request.get_json()
    files = data.get("files", [])

    if not files:
        return jsonify({"success": False, "error": "請選擇至少一個檔案"}), 400

    # 驗證所有檔案存在
    valid_files = []
    for f in files:
        html_path = SCRIPT_DIR / f"{f}.html"
        if html_path.exists():
            valid_files.append(f)

    if not valid_files:
        return jsonify({"success": False, "error": "沒有有效的 HTML 檔案"}), 400

    update_batch_render(
        status="busy",
        step=f"準備轉檔 {len(valid_files)} 個檔案...",
        files=valid_files,
        current_index=0,
        current_file="",
        completed=[],
        failed=[],
        percent=0,
        error=None,
    )

    def do_batch_render():
        try:
            total = len(valid_files)
            completed = []
            failed = []

            for i, filename in enumerate(valid_files):
                # 更新進度
                progress = int((i / total) * 100)
                update_batch_render(
                    current_index=i,
                    current_file=filename,
                    step=f"[{i+1}/{total}] 處理 {filename}...",
                    percent=progress,
                )

                html_path = SCRIPT_DIR / f"{filename}.html"

                # 先驗證
                validation = validate_html(str(html_path))
                if not validation["passed"]:
                    failed_checks = [c["name"] for c in validation["checks"] if not c["passed"]]
                    failed.append({"file": filename, "error": f"驗證失敗: {', '.join(failed_checks)}"})
                    update_batch_render(failed=failed)
                    continue

                # 執行 node fast_single.js（處理單一檔案）
                # 由於 fast_single.js 會處理根目錄所有 HTML，我們需要逐一處理
                update_batch_render(step=f"[{i+1}/{total}] 渲染 {filename}...")

                proc = subprocess.Popen(
                    ["node", str(SCRIPT_DIR / "fast_single.js")],
                    cwd=str(SCRIPT_DIR),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                    errors="replace",
                )

                # 監聽輸出
                for line in proc.stdout:
                    line = line.strip()
                    if not line:
                        continue
                    # 解析進度
                    pct_match = re.search(r'進度:\s*(\d+)%', line)
                    if pct_match:
                        file_pct = int(pct_match.group(1))
                        # 計算總體進度
                        overall_pct = int((i / total) * 100 + (file_pct / total))
                        update_batch_render(
                            step=f"[{i+1}/{total}] 渲染 {filename}... {file_pct}%",
                            percent=overall_pct,
                        )

                proc.wait()

                if proc.returncode == 0:
                    completed.append(filename)
                    update_batch_render(completed=completed)
                else:
                    failed.append({"file": filename, "error": f"退出碼 {proc.returncode}"})
                    update_batch_render(failed=failed)

            # 完成
            if len(failed) == 0:
                update_batch_render(
                    status="done",
                    step=f"全部完成！成功轉檔 {len(completed)} 個檔案",
                    percent=100,
                )
            else:
                update_batch_render(
                    status="done",
                    step=f"完成！成功 {len(completed)} 個，失敗 {len(failed)} 個",
                    percent=100,
                )

        except Exception as e:
            update_batch_render(status="error", step="批次轉檔失敗", error=str(e))

    threading.Thread(target=do_batch_render, daemon=True).start()
    return jsonify({"success": True, "message": f"批次轉檔任務已啟動，共 {len(valid_files)} 個檔案"})


@app.route("/api/batch-render/status")
def api_batch_render_status():
    with batch_render_lock:
        return jsonify(dict(batch_render_state))


@app.route("/api/batch-render/reset", methods=["POST"])
def api_batch_render_reset():
    update_batch_render(
        status="idle",
        step="",
        files=[],
        current_index=0,
        current_file="",
        completed=[],
        failed=[],
        percent=0,
        error=None,
    )
    return jsonify({"success": True})


# ===== API 路由 - 設定 =====

@app.route("/api/config")
def api_config():
    """檢查 API Key 和 anthropic 套件是否存在"""
    has_key = False
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        api_key = cfg.get("anthropic_api_key", "")
        has_key = bool(api_key and len(api_key) > 10)
    return jsonify({
        "has_anthropic_key": has_key,
        "has_anthropic_package": HAS_ANTHROPIC,
    })


@app.route("/api/config", methods=["POST"])
def api_config_update():
    """儲存 API Key"""
    data = request.get_json()
    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if "anthropic_api_key" in data:
        cfg["anthropic_api_key"] = data["anthropic_api_key"]
    CONFIG_PATH.write_text(json.dumps(cfg, indent=4, ensure_ascii=False), encoding="utf-8")
    return jsonify({"success": True})


# ===== API 路由 - 設定頁面 =====

@app.route("/api/settings")
def api_settings_get():
    """取得設定"""
    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    return jsonify({
        "success": True,
        "settings": {
            "gemini_api_key": bool(cfg.get("gemini_api_key")),
            "anthropic_api_key": bool(cfg.get("anthropic_api_key")),
            "ai_model": cfg.get("ai_model", "gemini"),
        }
    })


@app.route("/api/settings", methods=["POST"])
def api_settings_update():
    """更新設定"""
    data = request.get_json()
    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    if "gemini_api_key" in data:
        cfg["gemini_api_key"] = data["gemini_api_key"]
    if "anthropic_api_key" in data:
        cfg["anthropic_api_key"] = data["anthropic_api_key"]
    if "ai_model" in data:
        cfg["ai_model"] = data["ai_model"]

    CONFIG_PATH.write_text(json.dumps(cfg, indent=4, ensure_ascii=False), encoding="utf-8")
    return jsonify({"success": True})


@app.route("/api/settings/spec")
def api_settings_spec_get():
    """取得規格書內容"""
    spec_file = SCRIPT_DIR / "UltraAdvisorVideo-Spec.md"
    if spec_file.exists():
        content = spec_file.read_text(encoding="utf-8")
    else:
        # 嘗試讀取 CLAUDE.md
        claude_md = SCRIPT_DIR / "CLAUDE.md"
        if claude_md.exists():
            content = claude_md.read_text(encoding="utf-8")
        else:
            content = "# 規格書\n\n尚未建立規格書檔案。"

    return jsonify({"success": True, "content": content})


@app.route("/api/settings/spec", methods=["POST"])
def api_settings_spec_update():
    """更新規格書內容"""
    data = request.get_json()
    content = data.get("content", "")

    spec_file = SCRIPT_DIR / "UltraAdvisorVideo-Spec.md"
    spec_file.write_text(content, encoding="utf-8")

    return jsonify({"success": True})


# ===== API 路由 - AI 生成 =====

def call_gemini_api(api_key, system_prompt, user_prompt):
    """呼叫 Gemini API 生成內容"""
    import google.generativeai as genai
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt
    )

    response = model.generate_content(
        user_prompt,
        generation_config=genai.GenerationConfig(
            max_output_tokens=32768,
            temperature=0.7,
        )
    )

    return response.text


def call_anthropic_api(api_key, system_prompt, user_prompt):
    """呼叫 Anthropic API 生成內容"""
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16384,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


@app.route("/api/generate", methods=["POST"])
def api_generate():
    """啟動 AI HTML 生成"""
    with generate_lock:
        if generate_state["status"] == "busy":
            return jsonify({"success": False, "error": "已有生成任務進行中"}), 409

    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    # 讀取設定的 AI 模型
    ai_model = cfg.get("ai_model", "gemini")

    # 根據模型選擇 API Key
    if ai_model == "gemini":
        api_key = cfg.get("gemini_api_key", "")
        if not api_key:
            return jsonify({"success": False, "error": "請先在設定頁面設定 Gemini API Key"}), 400
    else:
        if not HAS_ANTHROPIC:
            return jsonify({"success": False, "error": "請先安裝 anthropic 套件：pip install anthropic"}), 400
        api_key = cfg.get("anthropic_api_key", "")
        if not api_key:
            return jsonify({"success": False, "error": "請先在設定頁面設定 Anthropic API Key"}), 400

    data = request.get_json()
    topic = data.get("topic", "").strip()
    if not topic:
        return jsonify({"success": False, "error": "請輸入主題名稱"}), 400

    metaphors = data.get("metaphors", "").strip()
    subtitles = data.get("subtitles", [])
    extra = data.get("extra", "").strip()

    output_path = SCRIPT_DIR / f"{topic}.html"
    if output_path.exists():
        return jsonify({"success": False, "error": f"檔案 {topic}.html 已存在"}), 409

    update_generate(status="busy", step="準備生成...", topic=topic, file="", error=None)

    def do_generate():
        try:
            update_generate(step="建構提示詞...")

            system_prompt = build_system_prompt()
            user_prompt = build_user_prompt(topic, metaphors, subtitles, extra)

            model_name = "Gemini" if ai_model == "gemini" else "Claude"
            update_generate(step=f"呼叫 {model_name} API（可能需要 30-90 秒）...")

            if ai_model == "gemini":
                response_text = call_gemini_api(api_key, system_prompt, user_prompt)
            else:
                response_text = call_anthropic_api(api_key, system_prompt, user_prompt)

            html_content = extract_html(response_text)

            if not html_content or len(html_content) < 5000:
                update_generate(status="error", step="生成失敗",
                              error="生成的內容太短或格式不正確")
                return

            update_generate(step="儲存檔案...")
            output_path.write_text(html_content, encoding="utf-8")

            update_generate(step="驗證中...")
            validation = validate_html(str(output_path))

            passed_count = sum(1 for c in validation["checks"] if c["passed"])
            total_count = len(validation["checks"])

            if validation["passed"]:
                update_generate(status="done",
                              step=f"生成完成！驗證全通過 ({passed_count}/{total_count})",
                              file=f"{topic}.html")
            else:
                failed = [c["name"] for c in validation["checks"] if not c["passed"]]
                update_generate(status="done",
                              step=f"已生成，但驗證未全通過 ({passed_count}/{total_count}): {', '.join(failed[:3])}",
                              file=f"{topic}.html")

        except Exception as e:
            error_msg = str(e)
            if "API_KEY" in error_msg.upper() or "AUTHENTICATION" in error_msg.upper():
                update_generate(status="error", step="API Key 無效", error="API Key 驗證失敗，請檢查設定")
            elif "RATE" in error_msg.upper() or "LIMIT" in error_msg.upper():
                update_generate(status="error", step="API 限流", error="API 請求頻率過高，請稍後再試")
            else:
                update_generate(status="error", step="生成失敗", error=error_msg)

    threading.Thread(target=do_generate, daemon=True).start()
    return jsonify({"success": True, "message": "生成任務已啟動"})


@app.route("/api/generate/status")
def api_generate_status():
    with generate_lock:
        return jsonify(dict(generate_state))


@app.route("/api/generate/reset", methods=["POST"])
def api_generate_reset():
    update_generate(status="idle", step="", topic="", file="", error=None)
    return jsonify({"success": True})


# ===== API 路由 - 自動產線 =====

def generate_topic_for_pipeline():
    """讓 AI 自動選擇一個新主題"""
    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    api_key = cfg.get("anthropic_api_key", "")
    if not api_key:
        return None

    published = get_published_topics()
    recent_10 = published[:10] if len(published) >= 10 else published

    prompt = f"""你是一個財經教育內容策劃師。

已經製作過的最近主題（避免重複）：
{chr(10).join(f'- {t}' for t in recent_10)}

請建議一個新的主題名稱，要求：
1. 是財經、心理學、或商業策略相關的概念
2. 可以用 3D 動畫視覺化
3. 2-6 個中文字
4. 不要與上面的主題重複

只回覆主題名稱，不要其他文字。例如：「邊際效應」"""

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=50,
        messages=[{"role": "user", "content": prompt}]
    )

    topic = response.content[0].text.strip()
    topic = topic.strip("「」『』\"'")
    return topic


def generate_html_for_pipeline(topic, api_key):
    """使用 AI 生成 HTML 動畫"""
    pipeline_log(f"開始生成 HTML：{topic}")
    update_pipeline(current_stage="html", step=f"生成 HTML：{topic}")

    system_prompt = build_system_prompt()
    user_prompt = f"""請依照規格書製作「{topic}」HTML 動畫。

要求：
1. 視覺隱喻要有創意，能清楚表達主題概念
2. 確保符合所有 12 項驗證標準
3. 動畫要有層次感和電影感
4. 字幕要精煉有力

直接輸出完整 HTML，不要任何解釋。"""

    client = anthropic.Anthropic(api_key=api_key)
    pipeline_log("呼叫 Claude API（預計 30-90 秒）...")
    update_pipeline(step="呼叫 Claude API...")

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16384,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    response_text = message.content[0].text
    html_content = extract_html(response_text)

    if not html_content or len(html_content) < 5000:
        raise Exception("生成的內容太短或格式不正確")

    output_path = SCRIPT_DIR / f"{topic}.html"
    output_path.write_text(html_content, encoding="utf-8")
    pipeline_log(f"HTML 已儲存：{output_path.name}")

    # 驗證
    validation = validate_html(str(output_path))
    passed_count = sum(1 for c in validation["checks"] if c["passed"])
    total_count = len(validation["checks"])
    pipeline_log(f"驗證結果：{passed_count}/{total_count} 通過")

    return output_path


def render_mp4_for_pipeline(html_path):
    """將 HTML 轉檔為 MP4"""
    pipeline_log(f"開始轉檔：{html_path.name}")
    update_pipeline(current_stage="render", step=f"轉檔中：{html_path.stem}")

    result = subprocess.run(
        ["node", str(SCRIPT_DIR / "fast_single.js")],
        cwd=str(SCRIPT_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    if result.returncode != 0:
        raise Exception(f"轉檔失敗：{result.stderr}")

    mp4_name = html_path.stem + ".mp4"
    shipping_dir = SCRIPT_DIR / "出貨區"
    mp4_path = shipping_dir / mp4_name

    if mp4_path.exists():
        pipeline_log(f"MP4 已生成：{mp4_path.name}")
        return mp4_path
    else:
        raise Exception("MP4 檔案未找到")


def generate_caption_for_pipeline(topic, api_key):
    """使用 AI 生成 IG 文案"""
    pipeline_log(f"生成文案：{topic}")
    update_pipeline(current_stage="caption", step=f"生成文案：{topic}")

    prompt = f"""你是一個專業的 IG 財經教育帳號的文案撰寫者。

請為主題「{topic}」撰寫一則 IG Reels 文案。

格式要求：
1. 開頭用 emoji 吸引注意
2. 第一行是主題標題
3. 用 2-3 句話解釋這個概念
4. 加入一個實際應用的例子或思考問題
5. 結尾用 CTA 鼓勵互動
6. 加入 5-8 個相關的 hashtag

範例格式：
💡 認知偏誤

你有沒有發現，我們總是更容易記住支持自己觀點的資訊？

這就是「確認偏誤」在作祟...

下次做決定前，試著主動找找反面證據 👀

#財經知識 #投資心理學 #確認偏誤 #理性思考 #投資者心態"""

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )

    caption = response.content[0].text.strip()
    pipeline_log("文案生成完成")

    # 儲存到文案庫
    library_path = SCRIPT_DIR / "文案庫.md"
    entry = f"\n\n## {topic}\n\n{caption}\n"
    if library_path.exists():
        content = library_path.read_text(encoding="utf-8")
    else:
        content = "# 文案庫\n\n自動生成的 IG Reels 文案集合\n"
    content += entry
    library_path.write_text(content, encoding="utf-8")
    pipeline_log(f"文案已加入文案庫")

    return caption


def publish_reel_for_pipeline(mp4_path, caption):
    """發布到 IG Reels"""
    pipeline_log(f"開始發布：{mp4_path.name}")
    update_pipeline(current_stage="publish", step=f"發布中：{mp4_path.stem}")

    result = upload_reel(str(mp4_path), caption, also_story=True)

    if result["success"]:
        pipeline_log(f"發布成功！Post ID: {result.get('post_id')}")

        # 移動到已上傳資料夾
        uploaded_dir = mp4_path.parent / "已上傳"
        uploaded_dir.mkdir(exist_ok=True)
        dest = uploaded_dir / mp4_path.name
        if dest.exists():
            dest.unlink()
        import shutil
        shutil.move(str(mp4_path), str(dest))
        pipeline_log(f"影片已移至：已上傳/{mp4_path.name}")
        return True
    else:
        raise Exception(result.get("error", "發布失敗"))


def run_single_pipeline(dry_run=False, no_publish=False):
    """執行一次完整產線流程"""
    from datetime import datetime

    pipeline_log("=" * 40)
    pipeline_log("開始執行自動產線")

    # 檢查 API Key
    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    api_key = cfg.get("anthropic_api_key", "")
    if not api_key:
        raise Exception("缺少 Anthropic API Key")

    # Step 1: 選擇主題
    update_pipeline(current_stage="topic", step="AI 選擇主題...")
    pipeline_log("AI 自動選擇主題...")
    topic = generate_topic_for_pipeline()
    if not topic:
        raise Exception("無法生成主題")
    pipeline_log(f"選定主題：{topic}")
    update_pipeline(topic=topic)

    # 檢查是否已存在
    html_path = SCRIPT_DIR / f"{topic}.html"
    if html_path.exists():
        pipeline_log(f"主題 {topic} 的 HTML 已存在，跳過生成")
    else:
        # Step 2: 生成 HTML
        html_path = generate_html_for_pipeline(topic, api_key)

    if dry_run:
        pipeline_log("Dry-run 模式，跳過轉檔和發布")
        return True

    # Step 3: 轉檔 MP4
    mp4_path = render_mp4_for_pipeline(html_path)

    # Step 4: 生成文案
    caption = generate_caption_for_pipeline(topic, api_key)

    if no_publish:
        pipeline_log("no-publish 模式，跳過發布")
        return True

    # Step 5: 發布
    publish_reel_for_pipeline(mp4_path, caption)

    pipeline_log("=" * 40)
    pipeline_log(f"✅ 流程完成：{topic}")
    return True


def pipeline_loop():
    """持續執行的產線迴圈"""
    from datetime import datetime, timedelta

    while not pipeline_stop_event.is_set():
        try:
            with pipeline_lock:
                interval = pipeline_state["interval_hours"]

            # 執行一次流程
            run_single_pipeline()

            with pipeline_lock:
                pipeline_state["runs_completed"] += 1
                pipeline_state["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                next_time = datetime.now() + timedelta(hours=interval)
                pipeline_state["next_run"] = next_time.strftime("%Y-%m-%d %H:%M:%S")
                pipeline_state["step"] = f"等待下次執行（{interval} 小時後）"
                pipeline_state["current_stage"] = ""

            pipeline_log(f"下次執行：{pipeline_state['next_run']}")

            # 等待下次執行（每分鐘檢查一次是否要停止）
            wait_seconds = interval * 3600
            for _ in range(wait_seconds // 60):
                if pipeline_stop_event.is_set():
                    break
                time.sleep(60)

        except Exception as e:
            pipeline_log(f"執行錯誤：{str(e)}", "ERROR")
            update_pipeline(error=str(e))
            # 錯誤後等待 10 分鐘再重試
            for _ in range(10):
                if pipeline_stop_event.is_set():
                    break
                time.sleep(60)

    update_pipeline(status="idle", step="已停止", current_stage="")
    pipeline_log("產線已停止")


@app.route("/api/pipeline/start", methods=["POST"])
def api_pipeline_start():
    """啟動自動產線"""
    global pipeline_thread

    with pipeline_lock:
        if pipeline_state["status"] == "running":
            return jsonify({"success": False, "error": "產線已在運行中"}), 409

    if not HAS_ANTHROPIC:
        return jsonify({"success": False, "error": "請先安裝 anthropic 套件"}), 400

    cfg = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if not cfg.get("anthropic_api_key"):
        return jsonify({"success": False, "error": "請先設定 Anthropic API Key"}), 400

    data = request.get_json() or {}
    interval = data.get("interval", 4)
    mode = data.get("mode", "loop")  # loop / once

    pipeline_stop_event.clear()
    update_pipeline(
        status="running",
        step="啟動中...",
        topic="",
        current_stage="",
        interval_hours=interval,
        error=None,
        log=[]
    )

    if mode == "once":
        # 單次執行
        def run_once():
            try:
                run_single_pipeline()
                update_pipeline(status="idle", step="單次執行完成")
                with pipeline_lock:
                    pipeline_state["runs_completed"] += 1
            except Exception as e:
                update_pipeline(status="error", step="執行失敗", error=str(e))

        pipeline_thread = threading.Thread(target=run_once, daemon=True)
    else:
        # 持續執行
        pipeline_thread = threading.Thread(target=pipeline_loop, daemon=True)

    pipeline_thread.start()
    return jsonify({"success": True, "message": f"產線已啟動（模式：{mode}）"})


@app.route("/api/pipeline/stop", methods=["POST"])
def api_pipeline_stop():
    """停止自動產線"""
    pipeline_stop_event.set()
    update_pipeline(status="idle", step="停止中...")
    pipeline_log("收到停止指令")
    return jsonify({"success": True, "message": "正在停止產線..."})


@app.route("/api/pipeline/status")
def api_pipeline_status():
    """查詢產線狀態"""
    with pipeline_lock:
        return jsonify(dict(pipeline_state))


# ===== API 路由 - Threads 發文 =====

def load_threads_config():
    """載入 Threads 設定"""
    if THREADS_CONFIG_PATH.exists():
        return json.loads(THREADS_CONFIG_PATH.read_text(encoding="utf-8"))
    return {"accounts": [], "global_settings": {"post_interval_seconds": 15}}


def save_threads_config(config):
    """儲存 Threads 設定"""
    THREADS_CONFIG_PATH.write_text(
        json.dumps(config, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


# ===== IG 影片排程功能 =====
import uuid
from datetime import datetime, timedelta


def load_ig_config():
    """載入 IG 設定"""
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    return {}


def save_ig_config(config):
    """儲存 IG 設定"""
    CONFIG_PATH.write_text(
        json.dumps(config, ensure_ascii=False, indent=4),
        encoding="utf-8"
    )


def get_pending_videos():
    """取得待發布影片列表（有對應文案的）"""
    pending = []
    if DEFAULT_VIDEO_DIR.exists():
        uploaded_names = set()
        if UPLOADED_DIR.exists():
            uploaded_names = {f.stem for f in UPLOADED_DIR.glob("*.mp4")}

        for mp4 in sorted(DEFAULT_VIDEO_DIR.glob("*.mp4")):
            if mp4.stem not in uploaded_names:
                # 檢查是否有對應文案
                try:
                    caption = parse_library(str(DEFAULT_LIBRARY), mp4.stem)
                    if caption:
                        pending.append({
                            "name": mp4.stem,
                            "path": str(mp4),
                            "has_caption": True
                        })
                except:
                    pass  # 沒有文案的不加入排程
    return pending


# ===== 問題影片資料夾 =====
PROBLEM_VIDEO_DIR = DEFAULT_VIDEO_DIR / "問題影片"


def validate_video_for_ig(video_path):
    """
    驗證影片是否符合 IG Reels 規格

    IG Reels 要求：
    - 時長：3-90 秒（建議 15-60 秒）
    - 格式：MP4
    - 解析度：最低 720p，建議 1080x1920 (9:16)
    - 檔案大小：最大 4GB
    - 幀率：至少 23 FPS，建議 30 FPS

    Returns: (is_valid, issues_list)
    """
    import subprocess
    import json as json_module

    issues = []
    video_path = Path(video_path)

    if not video_path.exists():
        return False, ["檔案不存在"]

    # 檢查檔案大小（應至少有一定大小才是完整影片）
    file_size_mb = video_path.stat().st_size / (1024 * 1024)
    if file_size_mb < 1:
        issues.append(f"檔案過小 ({file_size_mb:.1f} MB)，可能轉檔失敗")
    elif file_size_mb > 4096:
        issues.append(f"檔案過大 ({file_size_mb:.1f} MB)，超過 4GB 限制")

    # 使用 ffprobe 檢查影片屬性
    try:
        # 嘗試找 ffprobe
        ffprobe_cmd = "ffprobe"
        # 如果系統 PATH 沒有，嘗試常見位置
        possible_paths = [
            "ffprobe",
            str(SCRIPT_DIR / "ffprobe.exe"),
            str(SCRIPT_DIR / "ffmpeg" / "bin" / "ffprobe.exe"),
            "C:/ffmpeg/bin/ffprobe.exe",
        ]

        ffprobe_path = None
        for p in possible_paths:
            try:
                result = subprocess.run(
                    [p, "-version"],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    ffprobe_path = p
                    break
            except:
                continue

        if ffprobe_path:
            # 取得影片資訊
            result = subprocess.run(
                [
                    ffprobe_path,
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height,r_frame_rate,duration,codec_name",
                    "-show_entries", "format=duration",
                    "-of", "json",
                    str(video_path)
                ],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                info = json_module.loads(result.stdout)

                # 取得時長
                duration = None
                if "format" in info and "duration" in info["format"]:
                    duration = float(info["format"]["duration"])
                elif info.get("streams") and info["streams"][0].get("duration"):
                    duration = float(info["streams"][0]["duration"])

                if duration:
                    if duration < 3:
                        issues.append(f"影片過短 ({duration:.1f} 秒)，至少需要 3 秒")
                    elif duration > 90:
                        issues.append(f"影片過長 ({duration:.1f} 秒)，最多 90 秒")

                # 取得解析度
                if info.get("streams"):
                    stream = info["streams"][0]
                    width = stream.get("width", 0)
                    height = stream.get("height", 0)

                    if width and height:
                        if height < 720:
                            issues.append(f"解析度過低 ({width}x{height})，建議至少 720p")

                    # 檢查幀率
                    fps_str = stream.get("r_frame_rate", "0/1")
                    try:
                        if "/" in fps_str:
                            num, den = fps_str.split("/")
                            fps = float(num) / float(den) if float(den) > 0 else 0
                        else:
                            fps = float(fps_str)

                        if fps < 15:
                            issues.append(f"幀率過低 ({fps:.1f} FPS)，建議至少 23 FPS")
                    except:
                        pass
        else:
            # 沒有 ffprobe，只能依賴檔案大小判斷
            # 正常 25 秒 1080p 影片約 15-50 MB
            if file_size_mb < 5 and file_size_mb > 0:
                issues.append(f"檔案大小異常 ({file_size_mb:.1f} MB)，可能轉檔不完整")

    except Exception as e:
        # ffprobe 失敗，依賴其他檢查
        pass

    return len(issues) == 0, issues


def move_to_problem_folder(video_path, reason):
    """將有問題的影片移到問題資料夾"""
    import shutil

    video_path = Path(video_path)
    if not video_path.exists():
        return False

    PROBLEM_VIDEO_DIR.mkdir(exist_ok=True)

    # 建立問題記錄
    log_file = PROBLEM_VIDEO_DIR / "問題記錄.txt"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {video_path.name}: {reason}\n"

    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except:
        pass

    # 移動檔案
    dest = PROBLEM_VIDEO_DIR / video_path.name
    if dest.exists():
        dest.unlink()

    try:
        shutil.move(str(video_path), str(dest))
        print(f"[IG排程] 已將問題影片移至: {dest}")
        return True
    except Exception as e:
        print(f"[IG排程] 移動問題影片失敗: {e}")
        return False


def ig_scheduler_worker():
    """IG 排程工作 thread"""
    while not ig_scheduler_stop_event.is_set():
        try:
            config = load_ig_config()
            schedule_config = config.get("ig_schedule", {})

            if not schedule_config.get("enabled", False):
                ig_scheduler_stop_event.wait(30)
                continue

            schedule_times = parse_schedule_times(schedule_config.get("schedule_times", ""))
            if not schedule_times:
                ig_scheduler_stop_event.wait(30)
                continue

            # 取得待發布影片
            pending = get_pending_videos()
            if not pending:
                ig_scheduler_stop_event.wait(30)
                continue

            # 檢查是否該發布
            last_post = schedule_config.get("last_post", "-")
            last_post_time = None
            if last_post and last_post != "-":
                try:
                    last_post_time = datetime.strptime(last_post, "%Y-%m-%d %H:%M").isoformat()
                except:
                    pass

            if should_post_now(schedule_times, last_post_time):
                # 檢查是否正在發布中
                with upload_lock:
                    if upload_state["status"] == "busy":
                        ig_scheduler_stop_event.wait(30)
                        continue

                also_story = schedule_config.get("also_story", True)

                # 遍歷待發布影片，找到第一個通過驗證的
                valid_video = None
                for video in pending:
                    video_path = Path(video["path"])
                    print(f"[IG排程] 檢查影片：{video['name']}")

                    # 驗證影片是否符合 IG 規格
                    is_valid, issues = validate_video_for_ig(str(video_path))

                    if is_valid:
                        valid_video = video
                        print(f"[IG排程] 影片驗證通過：{video['name']}")
                        break
                    else:
                        # 影片不符合規格，移到問題資料夾
                        print(f"[IG排程] 影片驗證失敗：{video['name']}")
                        for issue in issues:
                            print(f"  - {issue}")

                        reason = "；".join(issues)
                        move_to_problem_folder(str(video_path), reason)
                        print(f"[IG排程] 已將問題影片移至：問題影片/{video['name']}")

                if not valid_video:
                    print("[IG排程] 沒有符合規格的影片可發布")
                    ig_scheduler_stop_event.wait(30)
                    continue

                print(f"[IG排程] 自動發布：{valid_video['name']}")

                try:
                    video_path = Path(valid_video["path"])
                    caption = parse_library(str(DEFAULT_LIBRARY), valid_video["name"])

                    result = upload_reel(str(video_path), caption, also_story=also_story)

                    if result["success"]:
                        # 移動檔案
                        try:
                            import shutil
                            UPLOADED_DIR.mkdir(exist_ok=True)
                            dest = UPLOADED_DIR / video_path.name
                            if dest.exists():
                                dest.unlink()
                            shutil.move(str(video_path), str(dest))
                        except Exception as move_err:
                            print(f"[IG排程] 移動檔案失敗: {move_err}")

                        # 更新最後發布時間
                        schedule_config["last_post"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                        config["ig_schedule"] = schedule_config
                        save_ig_config(config)

                        print(f"[IG排程] 發布成功：{valid_video['name']}, Post ID: {result.get('post_id')}")
                        # 記錄成功
                        add_post_log("IG Reels", "ig", "success", f"發布成功: {valid_video['name']}", result.get('post_id'))
                    else:
                        print(f"[IG排程] 發布失敗：{result.get('error')}")
                        # 記錄失敗
                        add_post_log("IG Reels", "ig", "error", f"發布失敗: {result.get('error')}")

                except Exception as e:
                    print(f"[IG排程] 發布錯誤：{e}")
                    # 記錄錯誤
                    add_post_log("IG Reels", "ig", "error", f"發布錯誤: {str(e)}")

                # 發布後等待
                ig_scheduler_stop_event.wait(10)

        except Exception as e:
            print(f"[IG排程] 錯誤: {e}")

        # 每 30 秒檢查一次
        ig_scheduler_stop_event.wait(30)


def start_ig_scheduler():
    """啟動 IG 排程器"""
    global ig_scheduler_thread

    with ig_scheduler_lock:
        if ig_scheduler_state["running"]:
            return False

        ig_scheduler_stop_event.clear()
        ig_scheduler_state["running"] = True

    ig_scheduler_thread = threading.Thread(target=ig_scheduler_worker, daemon=True)
    ig_scheduler_thread.start()
    print("[IG排程] 自動發布排程器已啟動")
    return True


def stop_ig_scheduler():
    """停止 IG 排程器"""
    global ig_scheduler_thread

    with ig_scheduler_lock:
        if not ig_scheduler_state["running"]:
            return False

        ig_scheduler_stop_event.set()
        ig_scheduler_state["running"] = False

    if ig_scheduler_thread:
        ig_scheduler_thread.join(timeout=5)
        ig_scheduler_thread = None

    print("[IG排程] 自動發布排程器已停止")
    return True


# ===== 文案庫自動排程功能 =====


def parse_schedule_times(schedule_str):
    """解析排程時間字串，返回時間列表 ['09:00', '12:00', ...]"""
    if not schedule_str:
        return []
    times = []
    for t in schedule_str.replace(" ", "").split(","):
        t = t.strip()
        if ":" in t and len(t) >= 4:
            times.append(t[:5])  # 取 HH:MM
    return sorted(set(times))


def get_daily_post_count(account_name):
    """取得帳號每日發文次數"""
    config = load_threads_config()
    for acc in config.get("accounts", []):
        if acc.get("name") == account_name:
            times = parse_schedule_times(acc.get("schedule_times", ""))
            return len(times)
    return 0


def get_next_scheduled_time(schedule_times):
    """取得下一個排程時間"""
    if not schedule_times:
        return None
    now = datetime.now()
    current_time = now.strftime("%H:%M")

    # 找今天剩餘的時間
    for t in schedule_times:
        if t > current_time:
            return t

    # 沒有了，返回明天第一個
    return schedule_times[0] if schedule_times else None


def should_post_now(schedule_times, last_post_time=None, tolerance_minutes=2):
    """檢查現在是否應該發文"""
    if not schedule_times:
        return False

    now = datetime.now()

    for scheduled_time in schedule_times:
        # 檢查當前時間是否在排程時間的容忍範圍內
        try:
            scheduled_dt = datetime.strptime(scheduled_time, "%H:%M").replace(
                year=now.year, month=now.month, day=now.day
            )
            diff = abs((now - scheduled_dt).total_seconds() / 60)

            if diff <= tolerance_minutes:
                # 檢查這個時間點今天是否已經發過
                if last_post_time:
                    try:
                        # 支援多種時間格式
                        last_dt = None
                        for fmt in ["%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"]:
                            try:
                                last_dt = datetime.strptime(last_post_time, fmt)
                                break
                            except:
                                continue

                        if last_dt:
                            # 如果今天這個排程時間窗口內已經發過，跳過
                            # 計算 last_post 與 scheduled_time 的差距
                            last_scheduled_dt = datetime.strptime(scheduled_time, "%H:%M").replace(
                                year=last_dt.year, month=last_dt.month, day=last_dt.day
                            )
                            last_diff = abs((last_dt - last_scheduled_dt).total_seconds() / 60)

                            # 如果上次發文是今天且在這個排程時間的容忍範圍內，跳過
                            if last_dt.date() == now.date() and last_diff <= tolerance_minutes:
                                continue
                    except Exception as e:
                        pass
                return True
        except:
            continue

    return False


def scheduler_worker():
    """排程工作 thread"""
    while not scheduler_stop_event.is_set():
        try:
            config = load_threads_config()

            for acc in config.get("accounts", []):
                if not acc.get("enabled", True):
                    continue

                account_name = acc.get("name", "")
                if not account_name:
                    continue

                schedule_times = parse_schedule_times(acc.get("schedule_times", ""))
                if not schedule_times:
                    continue

                # 檢查帳號設定是否完整
                if not acc.get("threads_access_token") or not acc.get("threads_user_id"):
                    continue

                # 取得文案庫
                library = load_library(account_name)
                pending_posts = [p for p in library.get("posts", []) if p.get("status") == "pending"]
                if not pending_posts:
                    continue

                # 取得上次發文時間
                last_post = acc.get("last_post", "-")
                last_post_time = None
                if last_post and last_post != "-":
                    try:
                        # 嘗試解析 last_post 格式 "2026-02-07 09:00"
                        last_post_time = datetime.strptime(last_post, "%Y-%m-%d %H:%M").isoformat()
                    except:
                        pass

                # 檢查是否該發文
                if should_post_now(schedule_times, last_post_time):
                    # 檢查是否正在發文中
                    with threads_lock:
                        if threads_state["status"] == "busy":
                            continue

                    # 隨機延遲 0-5 分鐘，避免每次都精準在整點發文
                    import random
                    random_delay = random.randint(0, 300)  # 0-300 秒 (0-5分鐘)
                    if random_delay > 0:
                        print(f"[排程] {account_name} 隨機延遲 {random_delay} 秒後發文...")
                        time.sleep(random_delay)

                    # 執行發文
                    post = pending_posts[0]
                    print(f"[排程] 自動發文到 {account_name}...")

                    try:
                        success, result = post_to_threads(
                            acc["threads_access_token"],
                            acc["threads_user_id"],
                            post["content"]
                        )

                        if success:
                            threads_post_id = result.replace("Post ID: ", "")
                            mark_post_published(account_name, post["id"], threads_post_id)
                            # 更新最後發文時間
                            acc["last_post"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                            save_threads_config(config)
                            print(f"[排程] {account_name} 發文成功: {result}")
                            # 記錄成功
                            add_post_log(account_name, "threads", "success", f"發文成功", threads_post_id)
                        else:
                            print(f"[排程] {account_name} 發文失敗: {result}")
                            # 記錄失敗
                            add_post_log(account_name, "threads", "error", f"發文失敗: {result}")
                    except Exception as e:
                        print(f"[排程] {account_name} 發文錯誤: {e}")
                        # 記錄錯誤
                        add_post_log(account_name, "threads", "error", f"發文錯誤: {str(e)}")

                    # 發文後等待一下再處理下一個帳號
                    time.sleep(5)

        except Exception as e:
            print(f"[排程] 錯誤: {e}")

        # 每 30 秒檢查一次
        scheduler_stop_event.wait(30)


def start_scheduler():
    """啟動排程器"""
    global scheduler_thread

    with scheduler_lock:
        if scheduler_state["running"]:
            return False

        scheduler_stop_event.clear()
        scheduler_state["running"] = True

    scheduler_thread = threading.Thread(target=scheduler_worker, daemon=True)
    scheduler_thread.start()
    print("[排程] 自動發文排程器已啟動")
    return True


def stop_scheduler():
    """停止排程器"""
    global scheduler_thread

    with scheduler_lock:
        if not scheduler_state["running"]:
            return False

        scheduler_stop_event.set()
        scheduler_state["running"] = False

    if scheduler_thread:
        scheduler_thread.join(timeout=5)
        scheduler_thread = None

    print("[排程] 自動發文排程器已停止")
    return True


# ===== 文案庫功能 =====
library_lock = threading.Lock()


def get_library_path(account_name):
    """取得文案庫檔案路徑"""
    safe_name = account_name.replace(" ", "_").replace("/", "_").replace("\\", "_")
    return SCRIPT_DIR / f"{safe_name}_library.json"


def load_library(account_name):
    """載入文案庫"""
    path = get_library_path(account_name)
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except:
            pass
    return {
        "account_name": account_name,
        "posts": [],
        "settings": {
            "auto_delete_published": False,
            "low_stock_warning": 5
        }
    }


def save_library(account_name, library):
    """儲存文案庫"""
    with library_lock:
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


def add_posts_to_library(account_name, contents):
    """批量新增文案到庫"""
    with library_lock:
        library = load_library(account_name)
        for content in contents:
            library["posts"].append({
                "id": f"post_{uuid.uuid4().hex[:8]}",
                "content": content,
                "status": "pending",
                "created_at": datetime.now().isoformat(),
                "published_at": None,
                "threads_post_id": None
            })
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    return len(contents)


def get_next_pending_post(account_name):
    """取得下一篇待發文案"""
    library = load_library(account_name)
    for post in library["posts"]:
        if post["status"] == "pending":
            return post
    return None


def mark_post_published(account_name, post_id, threads_post_id=None):
    """標記文案為已發布"""
    with library_lock:
        library = load_library(account_name)
        for post in library["posts"]:
            if post["id"] == post_id:
                post["status"] = "published"
                post["published_at"] = datetime.now().isoformat()
                post["threads_post_id"] = threads_post_id
                break
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


def get_library_stats(account_name):
    """取得文案庫統計"""
    library = load_library(account_name)
    pending = sum(1 for p in library["posts"] if p["status"] == "pending")
    published = sum(1 for p in library["posts"] if p["status"] == "published")
    total = len(library["posts"])
    return {"pending": pending, "published": published, "total": total}


def delete_post(account_name, post_id):
    """刪除指定文案"""
    with library_lock:
        library = load_library(account_name)
        library["posts"] = [p for p in library["posts"] if p["id"] != post_id]
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


def update_post(account_name, post_id, new_content):
    """更新指定文案內容"""
    with library_lock:
        library = load_library(account_name)
        for post in library["posts"]:
            if post["id"] == post_id:
                post["content"] = new_content
                break
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


def move_post(account_name, post_id, direction):
    """移動文案順序（direction: 'up' 或 'down'）"""
    with library_lock:
        library = load_library(account_name)
        posts = library["posts"]
        idx = next((i for i, p in enumerate(posts) if p["id"] == post_id), -1)
        if idx < 0:
            return False
        if direction == "up" and idx > 0:
            posts[idx], posts[idx - 1] = posts[idx - 1], posts[idx]
        elif direction == "down" and idx < len(posts) - 1:
            posts[idx], posts[idx + 1] = posts[idx + 1], posts[idx]
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    return True


def clear_published_posts(account_name):
    """清空已發布的文案"""
    with library_lock:
        library = load_library(account_name)
        library["posts"] = [p for p in library["posts"] if p["status"] != "published"]
        path = get_library_path(account_name)
        path.write_text(
            json.dumps(library, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


def generate_batch_posts(api_key, system_prompt, count=10):
    """批量生成多篇文案"""
    import requests as req

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    batch_prompt = f"""請一次產出 {count} 篇完整的 Threads 貼文。

【重要規則】
1. 每篇之間用 "---" 分隔
2. {count} 篇必須涵蓋完全不同的主題方向
3. {count} 篇必須使用不同的開頭句式（不能都用「別再...」開頭）
4. {count} 篇必須使用不同的隱喻系統
5. 每篇都是可以直接發布的完整貼文
6. 不要有任何編號、標題、標註

直接輸出 {count} 篇貼文，用 "---" 分隔。"""

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": system_prompt + "\n\n" + batch_prompt}]}
        ],
        "generationConfig": {
            "temperature": 1.0,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 8192,
        }
    }

    try:
        response = req.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=90)
        if response.status_code == 200:
            result = response.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            # 清理 code block
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            # 分割成多篇（支援多種分隔符）
            import re
            posts = [p.strip() for p in re.split(r'\n[-—]{2,}\n|\n[-—]{2,}$|^[-—]{2,}\n', text) if p.strip()]
            return True, posts
        else:
            return False, f"Gemini API 錯誤: {response.status_code}"
    except Exception as e:
        return False, f"請求失敗: {str(e)}"


def generate_threads_content(api_key, system_prompt, topic=None):
    """使用 Gemini API 生成 Threads 貼文"""
    import requests as req

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    if topic:
        user_prompt = f"請針對「{topic}」這個主題，寫一篇貼文。直接輸出貼文內容，不要有任何前言或說明。"
    else:
        user_prompt = "請自己發想一個主題，寫一篇貼文。主題要有新意。直接輸出貼文內容，不要有任何前言或說明。"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": system_prompt + "\n\n" + user_prompt}]}],
        "generationConfig": {"temperature": 1.0, "topK": 40, "topP": 0.95, "maxOutputTokens": 1024}
    }

    try:
        response = req.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return True, text.strip()
        else:
            return False, f"Gemini API 錯誤: {response.status_code}"
    except Exception as e:
        return False, f"請求失敗: {str(e)}"


def post_to_threads(access_token, user_id, text):
    """發布貼文到 Threads"""
    import requests as req

    try:
        # 建立貼文
        create_url = f"https://graph.threads.net/v1.0/{user_id}/threads"
        create_payload = {"media_type": "TEXT", "text": text, "access_token": access_token}
        response = req.post(create_url, data=create_payload, timeout=30)

        if response.status_code != 200:
            return False, f"建立貼文失敗: {response.text}"

        creation_id = response.json().get("id")
        time.sleep(3)

        # 發布貼文
        publish_url = f"https://graph.threads.net/v1.0/{user_id}/threads_publish"
        publish_payload = {"creation_id": creation_id, "access_token": access_token}
        response = req.post(publish_url, data=publish_payload, timeout=30)

        if response.status_code == 200:
            post_id = response.json().get("id")
            return True, f"Post ID: {post_id}"
        else:
            return False, f"發布失敗: {response.text}"
    except Exception as e:
        return False, f"請求失敗: {str(e)}"


@app.route("/api/threads/accounts")
def api_threads_accounts():
    """取得 Threads 帳號列表"""
    config = load_threads_config()
    # 隱藏敏感資訊
    accounts = []
    for acc in config.get("accounts", []):
        accounts.append({
            "name": acc.get("name", ""),
            "enabled": acc.get("enabled", True),
            "has_gemini_key": bool(acc.get("gemini_api_key")),
            "has_threads_token": bool(acc.get("threads_access_token")),
            "schedule_times": acc.get("schedule_times", "09:00, 18:00"),
            "last_post": acc.get("last_post", "-"),
        })
    return jsonify({"accounts": accounts})


@app.route("/api/threads/account/<int:idx>")
def api_threads_account_detail(idx):
    """取得單一帳號詳細資訊"""
    config = load_threads_config()
    accounts = config.get("accounts", [])
    if idx < 0 or idx >= len(accounts):
        return jsonify({"success": False, "error": "帳號不存在"}), 404

    acc = accounts[idx]
    return jsonify({
        "success": True,
        "account": {
            "name": acc.get("name", ""),
            "enabled": acc.get("enabled", True),
            "gemini_api_key": acc.get("gemini_api_key", ""),
            "threads_access_token": acc.get("threads_access_token", ""),
            "threads_user_id": acc.get("threads_user_id", ""),
            "schedule_times": acc.get("schedule_times", "09:00, 18:00"),
            "system_prompt": acc.get("system_prompt", ""),
        }
    })


@app.route("/api/threads/account", methods=["POST"])
def api_threads_account_save():
    """新增或更新帳號"""
    data = request.get_json()
    config = load_threads_config()

    idx = data.get("index", -1)
    account_data = {
        "name": data.get("name", "新帳號"),
        "enabled": data.get("enabled", True),
        "gemini_api_key": data.get("gemini_api_key", ""),
        "threads_access_token": data.get("threads_access_token", ""),
        "threads_user_id": data.get("threads_user_id", ""),
        "schedule_times": data.get("schedule_times", "09:00, 18:00"),
        "system_prompt": data.get("system_prompt", ""),
        "last_post": data.get("last_post", "-"),
    }

    if idx < 0 or idx >= len(config.get("accounts", [])):
        # 新增帳號
        if "accounts" not in config:
            config["accounts"] = []
        config["accounts"].append(account_data)
        idx = len(config["accounts"]) - 1
    else:
        # 更新帳號
        account_data["last_post"] = config["accounts"][idx].get("last_post", "-")
        config["accounts"][idx] = account_data

    save_threads_config(config)
    return jsonify({"success": True, "index": idx})


@app.route("/api/threads/account/<int:idx>", methods=["DELETE"])
def api_threads_account_delete(idx):
    """刪除帳號"""
    config = load_threads_config()
    accounts = config.get("accounts", [])

    if idx < 0 or idx >= len(accounts):
        return jsonify({"success": False, "error": "帳號不存在"}), 404

    del accounts[idx]
    save_threads_config(config)
    return jsonify({"success": True})


@app.route("/api/threads/preview", methods=["POST"])
def api_threads_preview():
    """預覽生成的貼文"""
    data = request.get_json()
    api_key = data.get("gemini_api_key", "")
    system_prompt = data.get("system_prompt", "")
    topic = data.get("topic", "")

    if not api_key:
        return jsonify({"success": False, "error": "缺少 Gemini API Key"}), 400
    if not system_prompt:
        return jsonify({"success": False, "error": "缺少 System Prompt"}), 400

    success, content = generate_threads_content(api_key, system_prompt, topic if topic else None)

    if success:
        return jsonify({"success": True, "content": content})
    else:
        return jsonify({"success": False, "error": content}), 500


@app.route("/api/threads/post", methods=["POST"])
def api_threads_post():
    """發布貼文到 Threads"""
    data = request.get_json()

    with threads_lock:
        if threads_state["status"] == "busy":
            return jsonify({"success": False, "error": "已有發文任務進行中"}), 409

    account_idx = data.get("account_index")
    content = data.get("content", "")
    topic = data.get("topic", "")

    config = load_threads_config()
    accounts = config.get("accounts", [])

    if account_idx is None or account_idx < 0 or account_idx >= len(accounts):
        return jsonify({"success": False, "error": "帳號不存在"}), 400

    acc = accounts[account_idx]

    if not acc.get("threads_access_token") or not acc.get("threads_user_id"):
        return jsonify({"success": False, "error": "帳號設定不完整"}), 400

    update_threads(status="busy", step="準備中...", account=acc["name"], error=None)

    def do_post():
        try:
            # 如果沒有提供內容，先生成
            post_content = content
            if not post_content:
                if not acc.get("gemini_api_key"):
                    update_threads(status="error", step="發文失敗", error="缺少 Gemini API Key")
                    return

                update_threads(step="生成貼文中...")
                success, result = generate_threads_content(
                    acc["gemini_api_key"],
                    acc.get("system_prompt", ""),
                    topic if topic else None
                )
                if not success:
                    update_threads(status="error", step="生成失敗", error=result)
                    return
                post_content = result

            update_threads(step="發布到 Threads...")
            success, result = post_to_threads(
                acc["threads_access_token"],
                acc["threads_user_id"],
                post_content
            )

            if success:
                # 更新最後發文時間
                from datetime import datetime
                acc["last_post"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                save_threads_config(config)
                update_threads(status="done", step=f"發布成功！{result}")
            else:
                update_threads(status="error", step="發布失敗", error=result)

        except Exception as e:
            update_threads(status="error", step="發文失敗", error=str(e))

    threading.Thread(target=do_post, daemon=True).start()
    return jsonify({"success": True, "message": "發文任務已啟動"})


@app.route("/api/threads/status")
def api_threads_status():
    """查詢發文狀態"""
    with threads_lock:
        return jsonify(dict(threads_state))


@app.route("/api/threads/reset", methods=["POST"])
def api_threads_reset():
    """重置發文狀態"""
    update_threads(status="idle", step="", account="", error=None)
    return jsonify({"success": True})


# ===== 文案庫 API =====

@app.route("/api/library/<account_name>")
def api_library_get(account_name):
    """取得文案庫內容"""
    library = load_library(account_name)
    stats = get_library_stats(account_name)

    # 取得每日發文次數和排程資訊
    daily_required = get_daily_post_count(account_name)
    config = load_threads_config()
    schedule_times = []
    next_post_time = None
    for acc in config.get("accounts", []):
        if acc.get("name") == account_name:
            schedule_times = parse_schedule_times(acc.get("schedule_times", ""))
            next_post_time = get_next_scheduled_time(schedule_times)
            break

    # 計算可維持天數
    days_available = stats["pending"] // daily_required if daily_required > 0 else 0

    return jsonify({
        "success": True,
        "posts": library["posts"],
        "settings": library.get("settings", {}),
        "stats": stats,
        "schedule": {
            "daily_required": daily_required,
            "schedule_times": schedule_times,
            "next_post_time": next_post_time,
            "days_available": days_available,
            "scheduler_running": scheduler_state["running"]
        }
    })


@app.route("/api/library/<account_name>/post", methods=["POST"])
def api_library_add_post(account_name):
    """新增單篇文案"""
    data = request.get_json()
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "error": "內容不能為空"}), 400
    add_posts_to_library(account_name, [content])
    return jsonify({"success": True})


@app.route("/api/library/<account_name>/post/<post_id>", methods=["PUT"])
def api_library_update_post(account_name, post_id):
    """更新文案內容"""
    data = request.get_json()
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "error": "內容不能為空"}), 400
    update_post(account_name, post_id, content)
    return jsonify({"success": True})


@app.route("/api/library/<account_name>/post/<post_id>", methods=["DELETE"])
def api_library_delete_post(account_name, post_id):
    """刪除文案"""
    delete_post(account_name, post_id)
    return jsonify({"success": True})


@app.route("/api/library/<account_name>/post/<post_id>/move", methods=["POST"])
def api_library_move_post(account_name, post_id):
    """移動文案順序"""
    data = request.get_json()
    direction = data.get("direction", "up")
    move_post(account_name, post_id, direction)
    return jsonify({"success": True})


@app.route("/api/library/<account_name>/clear-published", methods=["POST"])
def api_library_clear_published(account_name):
    """清空已發布文案"""
    clear_published_posts(account_name)
    return jsonify({"success": True})


# 批量生成狀態追蹤
batch_generate_state = {
    "status": "idle",  # idle / busy / done / error
    "step": "",
    "account": "",
    "count": 0,
    "generated": 0,
    "error": None,
}
batch_generate_lock = threading.Lock()


def update_batch_generate(**kwargs):
    with batch_generate_lock:
        batch_generate_state.update(kwargs)


@app.route("/api/library/<account_name>/batch-generate", methods=["POST"])
def api_library_batch_generate(account_name):
    """批量生成文案"""
    with batch_generate_lock:
        if batch_generate_state["status"] == "busy":
            return jsonify({"success": False, "error": "正在生成中"}), 409

    data = request.get_json()
    count = int(data.get("count", 10))

    # 取得帳號設定
    config = load_threads_config()
    account = None
    for acc in config.get("accounts", []):
        if acc.get("name") == account_name:
            account = acc
            break

    if not account:
        return jsonify({"success": False, "error": "帳號不存在"}), 404

    api_key = account.get("gemini_api_key")
    system_prompt = account.get("system_prompt", "")

    if not api_key:
        return jsonify({"success": False, "error": "缺少 Gemini API Key"}), 400
    if not system_prompt:
        return jsonify({"success": False, "error": "缺少 System Prompt"}), 400

    update_batch_generate(
        status="busy", step="正在生成...", account=account_name,
        count=count, generated=0, error=None
    )

    def do_generate():
        try:
            update_batch_generate(step=f"呼叫 Gemini API 生成 {count} 篇...")
            success, result = generate_batch_posts(api_key, system_prompt, count)

            if success:
                posts = result
                added = add_posts_to_library(account_name, posts)
                update_batch_generate(
                    status="done", step=f"成功生成 {added} 篇文案",
                    generated=added
                )
            else:
                update_batch_generate(status="error", step="生成失敗", error=result)
        except Exception as e:
            update_batch_generate(status="error", step="生成失敗", error=str(e))

    threading.Thread(target=do_generate, daemon=True).start()
    return jsonify({"success": True, "message": "批量生成已啟動"})


@app.route("/api/library/batch-status")
def api_library_batch_status():
    """查詢批量生成狀態"""
    with batch_generate_lock:
        return jsonify(dict(batch_generate_state))


@app.route("/api/library/batch-reset", methods=["POST"])
def api_library_batch_reset():
    """重置批量生成狀態"""
    update_batch_generate(status="idle", step="", account="", count=0, generated=0, error=None)
    return jsonify({"success": True})


@app.route("/api/library/<account_name>/import", methods=["POST"])
def api_library_import(account_name):
    """手動導入多篇文案"""
    data = request.get_json()
    posts = data.get("posts", [])

    if not posts:
        return jsonify({"success": False, "error": "沒有要導入的文案"}), 400

    # 載入現有文案庫（使用獨立的 library 檔案）
    library = load_library(account_name)

    # 新增文案
    imported_count = 0
    for post_content in posts:
        content = post_content.strip()
        if not content:
            continue

        post_id = f"import_{int(time.time() * 1000)}_{imported_count}"
        library["posts"].append({
            "id": post_id,
            "content": content,
            "status": "pending",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "source": "manual_import"
        })
        imported_count += 1

    # 儲存
    save_library(account_name, library)

    return jsonify({
        "success": True,
        "count": imported_count,
        "message": f"成功導入 {imported_count} 篇文案"
    })


@app.route("/api/post-logs")
def api_post_logs():
    """取得發文紀錄"""
    limit = request.args.get("limit", 20, type=int)
    account = request.args.get("account", "")
    status_filter = request.args.get("status", "")  # "success", "error", or ""

    with post_logs_lock:
        logs = post_logs.copy()

    # 篩選
    if account:
        logs = [l for l in logs if l["account"] == account]
    if status_filter:
        logs = [l for l in logs if l["status"] == status_filter]

    # 統計
    error_count = len([l for l in post_logs if l["status"] == "error"])
    success_count = len([l for l in post_logs if l["status"] == "success"])

    return jsonify({
        "logs": logs[:limit],
        "total": len(post_logs),
        "error_count": error_count,
        "success_count": success_count
    })


@app.route("/api/library/scheduler/start", methods=["POST"])
def api_scheduler_start():
    """啟動自動排程發文"""
    success = start_scheduler()
    return jsonify({"success": success, "running": scheduler_state["running"]})


@app.route("/api/library/scheduler/stop", methods=["POST"])
def api_scheduler_stop():
    """停止自動排程發文"""
    success = stop_scheduler()
    return jsonify({"success": success, "running": scheduler_state["running"]})


@app.route("/api/library/scheduler/status")
def api_scheduler_status():
    """取得排程器狀態"""
    return jsonify({
        "running": scheduler_state["running"],
        "accounts": scheduler_state["accounts"]
    })


@app.route("/api/library/<account_name>/post-from-library", methods=["POST"])
def api_library_post_from_library(account_name):
    """從文案庫取下一篇發布"""
    with threads_lock:
        if threads_state["status"] == "busy":
            return jsonify({"success": False, "error": "已有發文任務進行中"}), 409

    # 取得帳號設定
    config = load_threads_config()
    account = None
    account_idx = -1
    for i, acc in enumerate(config.get("accounts", [])):
        if acc.get("name") == account_name:
            account = acc
            account_idx = i
            break

    if not account:
        return jsonify({"success": False, "error": "帳號不存在"}), 404

    if not account.get("threads_access_token") or not account.get("threads_user_id"):
        return jsonify({"success": False, "error": "帳號設定不完整"}), 400

    # 取得下一篇待發文案
    post = get_next_pending_post(account_name)
    if not post:
        return jsonify({"success": False, "error": "文案庫已空，請補充文案"}), 400

    update_threads(status="busy", step="準備中...", account=account_name, error=None)

    def do_post():
        try:
            update_threads(step=f"發布文案 {post['id'][:12]}...")
            success, result = post_to_threads(
                account["threads_access_token"],
                account["threads_user_id"],
                post["content"]
            )

            if success:
                threads_post_id = result.replace("Post ID: ", "")
                mark_post_published(account_name, post["id"], threads_post_id)
                # 更新最後發文時間
                account["last_post"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                save_threads_config(config)
                update_threads(status="done", step=f"發布成功！{result}")

                # 檢查庫存
                stats = get_library_stats(account_name)
                if stats["pending"] <= 5:
                    update_threads(step=f"發布成功！剩餘 {stats['pending']} 篇，建議補充")
            else:
                update_threads(status="error", step="發布失敗", error=result)
        except Exception as e:
            update_threads(status="error", step="發文失敗", error=str(e))

    threading.Thread(target=do_post, daemon=True).start()
    return jsonify({"success": True, "message": "發文任務已啟動", "post_id": post["id"]})


# ===== 主頁面 =====

@app.route("/")
def index():
    return DASHBOARD_HTML


DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>IG Reels 管理中心 v2.1</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif; background: #1e1e1e; color: #ccc; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* 頂部導航 */
#topnav {
    display: flex; background: #1a1a2e; border-bottom: 1px solid #333; height: 44px; min-height: 44px;
}
.nav-tab {
    padding: 10px 24px; cursor: pointer; font-size: 14px; color: #888;
    border-bottom: 2px solid transparent; transition: all 0.2s; user-select: none;
}
.nav-tab:hover { color: #ccc; }
.nav-tab.active { color: #fff; border-bottom-color: #007acc; }

/* 主體 */
#app-body { flex: 1; display: flex; overflow: hidden; }

/* 左側欄 */
#sidebar {
    width: 280px; min-width: 280px; background: #252526; border-right: 1px solid #333;
    display: flex; flex-direction: column; height: 100%;
}
#sidebar-header {
    padding: 14px 20px; font-size: 14px; font-weight: bold; color: #fff;
    border-bottom: 1px solid #333; background: #1e1e1e;
}
#sidebar-list { flex: 1; overflow-y: auto; padding: 8px; }

.section-label {
    padding: 8px 12px; font-size: 11px; color: #888; text-transform: uppercase;
    letter-spacing: 1px; margin-top: 8px;
}
.list-item {
    padding: 10px 12px; cursor: pointer; border-radius: 6px; margin-bottom: 2px;
    display: flex; align-items: center; gap: 8px; transition: all 0.15s; font-size: 13px;
}
.list-item:hover { background: #2a2d2e; }
.list-item.active { background: #007acc; color: #fff; }
.list-item .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
.badge-ok { background: #2d6b3f; color: #4ec9b0; }
.badge-no { background: #5c2d2d; color: #f44747; }
.list-item .name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-item .size { font-size: 11px; color: #666; }

.archived-item {
    padding: 8px 12px; font-size: 12px; color: #555; margin-bottom: 1px;
    display: flex; align-items: center; gap: 8px;
}
.archived-item .name { flex: 1; }

.btn-move-video {
    padding: 2px 8px; font-size: 12px; border: none; border-radius: 4px;
    background: #3a3a3a; color: #888; cursor: pointer; opacity: 0;
    transition: opacity 0.2s, background 0.2s;
}
.list-item:hover .btn-move-video,
.archived-item:hover .btn-move-video { opacity: 1; }
.btn-move-video:hover { background: #4a4a4a; color: #fff; }
.btn-move-video.back { background: #2d3a2d; color: #4ec9b0; }
.btn-move-video.back:hover { background: #3a4a3a; }

/* 右側 */
#main { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
#main-header {
    padding: 12px 24px; background: #252526; border-bottom: 1px solid #333;
    font-size: 14px; color: #fff; display: flex; align-items: center; justify-content: space-between;
}
#content-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; align-items: center; }

.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: #555; font-size: 16px; }

/* 卡片 */
.card {
    width: 100%; max-width: 800px; background: #252526; border-radius: 8px; padding: 20px;
    margin-bottom: 16px; border: 1px solid #333;
}
.card-label { font-size: 12px; color: #888; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }

/* 影片播放器 */
#video-wrapper { width: 100%; display: flex; justify-content: center; margin-bottom: 20px; }
#video-player { max-height: 500px; max-width: 281px; border-radius: 12px; background: #000; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }

/* 文案 */
#caption-text { font-size: 14px; line-height: 1.8; color: #ddd; white-space: pre-wrap; max-height: 250px; overflow-y: auto; }
#caption-text .hashtags { color: #007acc; }

/* 驗證清單 */
.check-list { list-style: none; }
.check-item { padding: 6px 0; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.check-pass { color: #4ec9b0; }
.check-fail { color: #f44747; }
.check-icon { font-weight: bold; width: 24px; text-align: center; }

/* HTML 預覽 iframe */
#html-preview-wrapper {
    width: 100%; display: flex; justify-content: center; margin-bottom: 16px;
}
#html-preview-container {
    width: 270px; height: 480px; overflow: hidden; border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5); position: relative; background: #000;
}
#html-preview-frame {
    width: 1080px; height: 1920px; border: none;
    transform: scale(0.25); transform-origin: top left;
}

/* 控制 */
.control-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.control-row:last-child { margin-bottom: 0; }
.toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; user-select: none; }
.toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #007acc; cursor: pointer; }

.btn-primary {
    padding: 12px 32px; font-size: 15px; font-weight: bold;
    background: #007acc; color: #fff; border: none; border-radius: 8px;
    cursor: pointer; transition: all 0.2s; width: 100%;
}
.btn-primary:hover { background: #0062a3; }
.btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; }

.btn-render {
    padding: 12px 32px; font-size: 15px; font-weight: bold;
    background: #6b3fa0; color: #fff; border: none; border-radius: 8px;
    cursor: pointer; transition: all 0.2s; width: 100%;
}
.btn-render:hover { background: #5a2e8f; }
.btn-render:disabled { background: #333; color: #666; cursor: not-allowed; }

/* 批次轉檔 */
.batch-render-section { width: 100%; max-width: 800px; margin-bottom: 20px; display: none; }
.batch-render-card { background: #252526; border-radius: 8px; padding: 16px 20px; border: 1px solid #333; }
.batch-render-header { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
.batch-render-header h3 { margin: 0; font-size: 15px; color: #ddd; }
.batch-render-toggle { font-size: 12px; color: #888; }
.batch-render-body { display: none; margin-top: 16px; }
.batch-file-list { max-height: 250px; overflow-y: auto; border: 1px solid #333; border-radius: 6px; background: #1e1e1e; }
.batch-file-item { display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s; }
.batch-file-item:last-child { border-bottom: none; }
.batch-file-item:hover { background: #2a2a2a; }
.batch-file-item.selected { background: #2d3a4a; }
.batch-file-item input[type="checkbox"] { width: 16px; height: 16px; margin-right: 10px; accent-color: #6b3fa0; cursor: pointer; }
.batch-file-name { flex: 1; font-size: 13px; }
.batch-file-size { font-size: 12px; color: #666; }
.batch-controls { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.batch-select-all { padding: 8px 16px; background: #333; border: 1px solid #444; color: #aaa; border-radius: 6px; cursor: pointer; font-size: 13px; }
.batch-select-all:hover { background: #3a3a3a; color: #ddd; }
.btn-batch-render { padding: 10px 24px; background: #6b3fa0; color: #fff; font-size: 14px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; }
.btn-batch-render:hover { background: #5a2e8f; }
.btn-batch-render:disabled { background: #333; color: #666; cursor: not-allowed; }
.batch-selected-count { font-size: 13px; color: #888; }
.batch-status { margin-top: 12px; padding: 12px; background: #1e1e1e; border-radius: 6px; display: none; }
.batch-status-step { font-size: 13px; margin-bottom: 8px; }
.batch-progress-bar { height: 4px; background: #333; border-radius: 2px; overflow: hidden; }
.batch-progress-fill { height: 100%; background: #6b3fa0; transition: width 0.3s ease; }
.batch-result { margin-top: 12px; font-size: 12px; }
.batch-result .success { color: #4ec9b0; }
.batch-result .error { color: #f44747; }

/* 進度 */
.progress-box { width: 100%; max-width: 800px; background: #252526; border-radius: 8px; padding: 20px; border: 1px solid #333; display: none; margin-bottom: 16px; }
.progress-step { font-size: 14px; margin-bottom: 12px; }
.progress-bar-bg { height: 6px; background: #333; border-radius: 3px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.fill-blue { background: #007acc; }
.fill-purple { background: #6b3fa0; }

/* 結果 */
.result-box { width: 100%; max-width: 800px; border-radius: 8px; padding: 20px; border: 1px solid #333; display: none; margin-bottom: 16px; }
.result-box.success { background: #1a3a2a; border-color: #2d6b3f; }
.result-box.error { background: #3a1a1a; border-color: #6b2d2d; }
.result-text { font-size: 14px; line-height: 1.6; }

/* 捲軸 */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #1e1e1e; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }

.refresh-btn { background: none; border: 1px solid #444; color: #888; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.refresh-btn:hover { border-color: #888; color: #ccc; }

/* AI 生成區 */
.generate-section { width: 100%; max-width: 800px; margin-bottom: 20px; display: none; }
.gen-card { background: #252526; border-radius: 8px; padding: 16px 20px; border: 1px solid #333; }
.gen-header { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
.gen-header h3 { font-size: 14px; color: #4ec9b0; margin: 0; font-weight: 600; }
.gen-toggle { color: #888; font-size: 12px; }
.gen-body { margin-top: 16px; display: none; }
.gen-field { margin-bottom: 14px; }
.gen-field label { display: block; font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
.gen-input { width: 100%; padding: 10px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 14px; font-family: inherit; }
.gen-input:focus { border-color: #007acc; outline: none; }
.gen-textarea { width: 100%; min-height: 80px; padding: 10px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 13px; font-family: inherit; resize: vertical; }
.gen-textarea:focus { border-color: #007acc; outline: none; }
.gen-sub-row { display: flex; gap: 8px; margin-bottom: 6px; }
.gen-sub-row input { flex: 1; }
.btn-generate { padding: 12px 32px; font-size: 15px; font-weight: bold; background: #2d8f6f; color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; }
.btn-generate:hover { background: #247a5d; }
.btn-generate:disabled { background: #333; color: #666; cursor: not-allowed; }
.api-notice { background: #3a3a1a; border: 1px solid #665500; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 13px; color: #ddcc88; line-height: 1.6; }
.api-notice a { color: #88ccff; }
.api-notice code { background: #1e1e1e; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
.api-key-field { display: flex; gap: 8px; margin-top: 10px; }
.api-key-field input { flex: 1; }
.btn-save-key { padding: 8px 16px; background: #007acc; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: nowrap; }
.btn-save-key:hover { background: #0062a3; }
.fill-green { background: #2d8f6f; }

/* 自動產線區 */
.pipeline-section { width: 100%; max-width: 900px; display: none; }
.pipeline-card { background: #252526; border-radius: 8px; padding: 20px; border: 1px solid #333; margin-bottom: 16px; }
.pipeline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.pipeline-header h3 { font-size: 16px; color: #ff9f43; margin: 0; }
.pipeline-status { display: flex; align-items: center; gap: 8px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.idle { background: #666; }
.status-dot.running { background: #2d8f6f; animation: pulse 1.5s infinite; }
.status-dot.error { background: #f44747; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.status-text { font-size: 13px; color: #888; }

.pipeline-controls { display: flex; gap: 12px; margin-bottom: 20px; }
.pipeline-controls .field { flex: 1; }
.pipeline-controls label { display: block; font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; }
.pipeline-controls select, .pipeline-controls input { width: 100%; padding: 10px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 14px; }
.pipeline-controls select:focus, .pipeline-controls input:focus { border-color: #007acc; outline: none; }

.btn-start { padding: 12px 24px; background: #2d8f6f; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; }
.btn-start:hover { background: #247a5d; }
.btn-start:disabled { background: #333; color: #666; cursor: not-allowed; }
.btn-stop { padding: 12px 24px; background: #c0392b; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; }
.btn-stop:hover { background: #a93226; }
.btn-once { padding: 12px 24px; background: #6b3fa0; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; }
.btn-once:hover { background: #5a2e8f; }

.pipeline-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.info-item { background: #1e1e1e; padding: 16px; border-radius: 8px; text-align: center; }
.info-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
.info-value { font-size: 18px; color: #ddd; font-weight: bold; }
.info-value.highlight { color: #ff9f43; }

.pipeline-stage { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #1e1e1e; border-radius: 8px; margin-bottom: 12px; }
.stage-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; background: #333; color: #666; }
.stage-icon.active { background: #2d8f6f; color: #fff; }
.stage-icon.done { background: #247a5d; color: #fff; }
.stage-name { flex: 1; font-size: 14px; }
.stage-status { font-size: 12px; color: #888; }

.pipeline-log { background: #0d0d0d; border-radius: 8px; padding: 16px; max-height: 300px; overflow-y: auto; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.6; }
.pipeline-log .log-entry { color: #888; }
.pipeline-log .log-entry.error { color: #f44747; }
.pipeline-log .log-entry.success { color: #4ec9b0; }

/* Threads 發文區 */
.threads-section { width: 100%; max-width: 1000px; display: none; }
.threads-layout { display: flex; gap: 20px; }
.threads-sidebar { width: 280px; min-width: 280px; }
.threads-main { flex: 1; }
.threads-card { background: #252526; border-radius: 8px; padding: 16px; border: 1px solid #333; margin-bottom: 16px; }
.threads-card h3 { font-size: 14px; color: #00b894; margin: 0 0 12px 0; }
.threads-list { max-height: 300px; overflow-y: auto; }
.threads-item { padding: 10px 12px; cursor: pointer; border-radius: 6px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; font-size: 13px; transition: all 0.15s; }
.threads-item:hover { background: #2a2d2e; }
.threads-item.active { background: #00b894; color: #fff; }
.threads-item .t-status { font-size: 14px; }
.threads-item .t-name { flex: 1; }
.threads-item .t-time { font-size: 11px; color: #666; }
.threads-item.active .t-time { color: rgba(255,255,255,0.7); }
.threads-btn-row { display: flex; gap: 8px; margin-top: 12px; }
.btn-threads { padding: 8px 16px; font-size: 12px; border: none; border-radius: 6px; cursor: pointer; }
.btn-threads.add { background: #00b894; color: #fff; }
.btn-threads.del { background: #e94560; color: #fff; }
.threads-field { margin-bottom: 12px; }
.threads-field label { display: block; font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; }
.threads-input { width: 100%; padding: 10px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 14px; }
.threads-input:focus { border-color: #00b894; outline: none; }
.threads-textarea { width: 100%; min-height: 120px; padding: 10px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 13px; resize: vertical; }
.threads-textarea:focus { border-color: #00b894; outline: none; }
.threads-toggle { display: flex; align-items: center; gap: 10px; }
.threads-toggle input { width: 18px; height: 18px; accent-color: #00b894; }
.btn-threads-action { padding: 12px 24px; font-size: 14px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; }
.btn-threads-action.save { background: #00b894; color: #fff; }
.btn-threads-action.preview { background: #6c5ce7; color: #fff; }
.btn-threads-action.post { background: #e94560; color: #fff; }
.btn-threads-action:disabled { background: #333; color: #666; cursor: not-allowed; }
.threads-preview-box { background: #0d0d0d; border-radius: 8px; padding: 16px; margin-top: 12px; white-space: pre-wrap; font-size: 13px; line-height: 1.8; max-height: 300px; overflow-y: auto; }

/* Threads 子分頁 */
.threads-subtabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid #333; }
.threads-subtab { padding: 10px 20px; cursor: pointer; font-size: 13px; color: #888; border-bottom: 2px solid transparent; transition: all 0.2s; }
.threads-subtab:hover { color: #ccc; }
.threads-subtab.active { color: #00b894; border-bottom-color: #00b894; }

/* 文案庫區 */
.library-section { display: none; }
.library-section.active { display: block; }
#threads-library-section.active { display: flex; gap: 20px; }
.library-stats { display: flex; gap: 20px; margin-bottom: 16px; font-size: 13px; color: #888; }
.library-stats span { padding: 6px 12px; background: #1e1e1e; border-radius: 4px; }
.library-stats .pending { color: #f39c12; }
.library-stats .published { color: #00b894; }

.library-table { width: 100%; border-collapse: collapse; }
.library-table th { text-align: left; padding: 10px 12px; font-size: 11px; color: #888; text-transform: uppercase; border-bottom: 1px solid #333; }
.library-table td { padding: 10px 12px; border-bottom: 1px solid #2a2a2a; font-size: 13px; vertical-align: top; }
.library-table tr:hover { background: #2a2d2e; }
.library-table tr.selected { background: #0f3460; }
.library-table .col-order { width: 40px; text-align: center; color: #666; }
.library-table .col-preview { max-width: 400px; }
.library-table .col-preview .preview-text { max-height: 60px; overflow: hidden; text-overflow: ellipsis; white-space: pre-wrap; line-height: 1.5; cursor: pointer; }
.library-table .col-status { width: 70px; text-align: center; }
.library-table .col-actions { width: 100px; text-align: right; }
.library-table .status-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; }
.library-table .status-pending { background: #5c4d1a; color: #f39c12; }
.library-table .status-published { background: #1a5c3a; color: #00b894; }
.library-table .btn-small { padding: 4px 8px; font-size: 11px; border: none; border-radius: 4px; cursor: pointer; margin-left: 4px; }
.library-table .btn-edit { background: #0f3460; color: #7ecbf5; }
.library-table .btn-del { background: #3a1a1a; color: #f44747; }

.library-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.library-actions button { padding: 8px 14px; font-size: 12px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.library-actions .btn-move { background: #0f3460; color: #7ecbf5; }
.library-actions .btn-add { background: #00b894; color: #fff; }
.library-actions .btn-clear { background: #636e72; color: #fff; }
.library-actions .btn-post-lib { background: #e94560; color: #fff; }

.library-batch { background: #252526; border-radius: 8px; padding: 16px; border: 1px solid #333; margin-top: 16px; }
.library-batch h4 { font-size: 13px; color: #888; margin: 0 0 12px 0; }
.library-batch-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.library-batch select { padding: 8px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 14px; }
.library-batch .btn-generate { padding: 10px 20px; background: #e94560; color: #fff; font-size: 13px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; }
.library-batch .btn-generate:disabled { background: #333; color: #666; cursor: not-allowed; }
.library-batch-status { margin-top: 12px; padding: 10px; background: #1e1e1e; border-radius: 6px; font-size: 12px; display: none; }
.library-warning { color: #f39c12; font-size: 13px; margin-top: 12px; padding: 10px; background: #3a2d1a; border-radius: 6px; display: none; }

/* 帳號儀表板 */
.accounts-dashboard { width: 280px; min-width: 280px; background: #252526; border-radius: 10px; border: 1px solid #333; padding: 16px; height: fit-content; }
.accounts-dashboard h4 { font-size: 14px; color: #ccc; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
.account-card { background: #1e1e1e; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 3px solid #444; cursor: pointer; transition: all 0.2s; }
.account-card:hover { background: #2a2d2e; }
.account-card.active { border-left-color: #4ec9b0; background: #1a2a2a; }
.account-card.disabled { opacity: 0.5; border-left-color: #666; }
.account-card .account-name { font-size: 13px; font-weight: bold; color: #ddd; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.account-card .account-name .status-dot { width: 8px; height: 8px; border-radius: 50%; }
.account-card .account-name .status-dot.on { background: #00b894; }
.account-card .account-name .status-dot.off { background: #666; }
.account-card .account-stats { display: flex; gap: 8px; font-size: 11px; color: #888; margin-bottom: 6px; }
.account-card .account-stats span { padding: 2px 6px; background: #2a2a2a; border-radius: 3px; }
.account-card .account-stats .pending { color: #f39c12; }
.account-card .account-stats .published { color: #00b894; }
.account-card .account-rate { font-size: 10px; color: #666; }
.account-card .account-rate .rate-bar { height: 4px; background: #333; border-radius: 2px; margin-top: 4px; overflow: hidden; }
.account-card .account-rate .rate-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
.account-card .account-rate .rate-fill.good { background: #00b894; }
.account-card .account-rate .rate-fill.warning { background: #f39c12; }
.account-card .account-rate .rate-fill.danger { background: #e94560; }
.library-main-content { flex: 1; min-width: 0; }

/* 發文紀錄 */
.post-logs { margin-top: 16px; padding-top: 16px; border-top: 1px solid #333; }
.post-logs h4 { font-size: 12px; color: #888; margin: 0 0 10px 0; display: flex; align-items: center; justify-content: space-between; }
.post-logs h4 .log-stats { font-size: 10px; }
.post-logs h4 .log-stats .success { color: #00b894; }
.post-logs h4 .log-stats .error { color: #e94560; }
.post-log-item { padding: 8px; background: #1e1e1e; border-radius: 6px; margin-bottom: 6px; font-size: 11px; border-left: 3px solid #444; }
.post-log-item.success { border-left-color: #00b894; }
.post-log-item.error { border-left-color: #e94560; background: #2a1a1a; }
.post-log-item .log-time { color: #666; font-size: 10px; }
.post-log-item .log-account { color: #7ecbf5; font-weight: bold; }
.post-log-item .log-message { color: #ccc; margin-top: 4px; word-break: break-all; }
.post-log-item.error .log-message { color: #f44747; }

/* 手動導入區 */
.library-import { background: #252526; border-radius: 8px; padding: 16px; border: 1px solid #333; margin-top: 16px; }
.library-import h4 { font-size: 13px; color: #888; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
.library-import h4 .toggle-hint { font-size: 11px; color: #666; cursor: pointer; margin-left: auto; }
.library-import h4 .toggle-hint:hover { color: #4ec9b0; }
.library-import-hint { background: #1a2a2a; border: 1px solid #2a3a3a; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 12px; line-height: 1.8; display: none; }
.library-import-hint.show { display: block; }
.library-import-hint code { background: #0d0d0d; padding: 2px 6px; border-radius: 3px; color: #4ec9b0; }
.library-import-hint .example { background: #0d0d0d; padding: 10px; border-radius: 4px; margin-top: 8px; white-space: pre-wrap; color: #888; font-family: monospace; }
.library-import textarea { width: 100%; min-height: 150px; padding: 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 13px; line-height: 1.6; resize: vertical; }
.library-import textarea:focus { border-color: #4ec9b0; outline: none; }
.library-import-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.library-import .btn-import { padding: 10px 20px; background: #4ec9b0; color: #1e1e1e; font-size: 13px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; }
.library-import .btn-import:hover { background: #3db89a; }
.library-import .btn-import:disabled { background: #333; color: #666; cursor: not-allowed; }
.library-import .import-count { font-size: 12px; color: #888; }
.library-import-status { margin-top: 12px; padding: 10px; border-radius: 6px; font-size: 13px; display: none; }
.library-import-status.success { display: block; background: #1a3a2a; color: #4ec9b0; }
.library-import-status.error { display: block; background: #3a1a1a; color: #f44747; }

/* 編輯彈窗 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 1000; }
.modal-overlay.active { display: flex; }
.modal-box { background: #252526; border-radius: 10px; padding: 20px; width: 90%; max-width: 600px; max-height: 80vh; overflow: auto; border: 1px solid #444; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { font-size: 16px; color: #00b894; margin: 0; }
.modal-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
.modal-close:hover { color: #fff; }
.modal-body textarea { width: 100%; min-height: 250px; padding: 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 14px; resize: vertical; line-height: 1.7; }
.modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.modal-footer .char-count { font-size: 12px; color: #888; }
.modal-footer button { padding: 10px 24px; font-size: 14px; border: none; border-radius: 6px; cursor: pointer; }
.modal-footer .btn-cancel { background: #333; color: #888; }
.modal-footer .btn-save { background: #00b894; color: #fff; }

/* 設定頁面 */
.settings-section { width: 100%; max-width: 900px; display: none; }
.settings-card { background: #252526; border-radius: 10px; padding: 20px; border: 1px solid #333; margin-bottom: 20px; }
.settings-card h3 { font-size: 15px; color: #4ec9b0; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
.settings-field { margin-bottom: 16px; }
.settings-field label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; }
.settings-field .hint { font-size: 11px; color: #666; margin-top: 4px; }
.settings-input { width: 100%; padding: 10px 12px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; color: #ddd; font-size: 14px; }
.settings-input:focus { border-color: #4ec9b0; outline: none; }
.settings-textarea { width: 100%; min-height: 400px; padding: 12px; background: #0d0d0d; border: 1px solid #444; border-radius: 6px; color: #c5c5c5; font-size: 13px; font-family: 'Consolas', 'Monaco', monospace; line-height: 1.6; resize: vertical; }
.settings-textarea:focus { border-color: #4ec9b0; outline: none; }
.settings-btn-row { display: flex; gap: 10px; margin-top: 16px; }
.btn-settings { padding: 10px 20px; font-size: 13px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; }
.btn-settings.save { background: #4ec9b0; color: #1e1e1e; }
.btn-settings.save:hover { background: #3db89a; }
.btn-settings.reset { background: #444; color: #ccc; }
.btn-settings.reset:hover { background: #555; }
.settings-status { padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-top: 12px; display: none; }
.settings-status.success { display: block; background: #1a3a2a; color: #4ec9b0; }
.settings-status.error { display: block; background: #3a1a1a; color: #f44747; }
.api-key-row { display: flex; gap: 10px; align-items: center; }
.api-key-row .settings-input { flex: 1; }
.api-key-status { font-size: 12px; padding: 4px 10px; border-radius: 4px; }
.api-key-status.valid { background: #1a3a2a; color: #4ec9b0; }
.api-key-status.invalid { background: #3a1a1a; color: #f44747; }
.settings-tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid #333; }
.settings-tab { padding: 10px 20px; cursor: pointer; font-size: 13px; color: #888; border-bottom: 2px solid transparent; transition: all 0.2s; }
.settings-tab:hover { color: #ccc; }
.settings-tab.active { color: #4ec9b0; border-bottom-color: #4ec9b0; }
.settings-panel { display: none; }
.settings-panel.active { display: block; }
.model-selector { display: flex; gap: 10px; margin-top: 8px; }
.model-option { padding: 8px 16px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px; cursor: pointer; font-size: 13px; color: #888; }
.model-option:hover { border-color: #666; color: #ccc; }
.model-option.active { border-color: #4ec9b0; color: #4ec9b0; background: #1a2a2a; }
</style>
</head>
<body>

<!-- 頂部導航 -->
<div id="topnav">
    <div class="nav-tab active" onclick="switchTab('publish')">發布</div>
    <div class="nav-tab" onclick="switchTab('render')">製作</div>
    <div class="nav-tab" onclick="switchTab('pipeline')">自動產線</div>
    <div class="nav-tab" onclick="switchTab('threads')">Threads</div>
    <div class="nav-tab" onclick="switchTab('settings')">設定</div>
</div>

<div id="app-body">
    <div id="sidebar">
        <div id="sidebar-header">影片清單</div>
        <div id="sidebar-list"><div style="padding:20px;color:#555;">載入中...</div></div>
    </div>
    <div id="main">
        <div id="main-header">
            <span id="header-title">請選擇項目</span>
            <button class="refresh-btn" onclick="refreshList()">重新整理</button>
        </div>
        <div id="content-area">
            <div class="empty-state" id="empty-state">從左側選擇項目</div>

            <!-- ===== 發布模式內容 ===== -->
            <div id="publish-content" style="display:none;width:100%;max-width:800px;">
                <!-- IG 排程資訊面板 -->
                <div class="card" id="ig-schedule-card" style="background:#1a2a3a; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="margin:0; color:#7ecbf5;">IG 自動發布排程</h3>
                        <label class="toggle-label" style="margin:0;">
                            <input type="checkbox" id="ig-schedule-enabled" onchange="toggleIgSchedule()">
                            <span id="ig-schedule-status-text">已停用</span>
                        </label>
                    </div>
                    <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-bottom:12px;">
                        <div>
                            <span style="color:#888;">排程時間：</span>
                            <input type="text" id="ig-schedule-times" class="gen-input" style="width:180px; padding:6px 10px;" placeholder="09:00,18:00" value="09:00,18:00">
                        </div>
                        <label class="toggle-label" style="margin:0;">
                            <input type="checkbox" id="ig-schedule-story" checked>
                            <span style="color:#888;">同時發限動</span>
                        </label>
                        <button class="btn-save-key" onclick="saveIgSchedule()">儲存設定</button>
                    </div>
                    <div style="display:flex; gap:16px; flex-wrap:wrap; color:#888; font-size:13px;">
                        <span>待發布 <strong id="ig-pending-count" style="color:#4ec9b0;">0</strong> 部</span>
                        <span>每日 <strong id="ig-daily-count" style="color:#ffcc00;">0</strong> 部</span>
                        <span>可維持 <strong id="ig-days-available" style="color:#4ec9b0;">0</strong> 天</span>
                        <span>下一次：<strong id="ig-next-post" style="color:#ffcc00;">-</strong></span>
                        <span id="ig-scheduler-badge" style="padding:3px 8px; border-radius:10px; font-size:11px; background:#3a3a3a; color:#888;">排程停止</span>
                    </div>
                </div>

                <div id="video-wrapper"><video id="video-player" controls preload="metadata"></video></div>
                <div class="card" id="caption-card">
                    <div class="card-label">文案預覽</div>
                    <div id="caption-text"></div>
                </div>
                <div class="card">
                    <div class="control-row">
                        <label class="toggle-label"><input type="checkbox" id="story-toggle" checked> 同時發布限時動態</label>
                    </div>
                    <div class="control-row">
                        <button class="btn-primary" id="publish-btn" onclick="startPublish()">發布到 IG Reels</button>
                    </div>
                </div>
                <div class="progress-box" id="pub-progress">
                    <div class="progress-step" id="pub-progress-step">準備中...</div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill fill-blue" id="pub-progress-bar" style="width:0%"></div></div>
                </div>
                <div class="result-box" id="pub-result"><div class="result-text" id="pub-result-text"></div></div>
            </div>

            <!-- ===== AI 生成區（製作 tab 頂部） ===== -->
            <div class="generate-section" id="generate-section">
                <div class="gen-card">
                    <div class="gen-header" onclick="toggleGenerate()">
                        <h3>AI 生成 HTML</h3>
                        <span class="gen-toggle" id="gen-toggle">展開 ▼</span>
                    </div>
                    <div class="gen-body" id="gen-body">
                        <div class="api-notice" id="api-notice" style="display:none;">
                            <strong>需要 Anthropic API Key</strong><br>
                            1. 前往 <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a> 取得 API Key<br>
                            2. 在下方輸入 API Key 並儲存<br>
                            3. 確保已安裝套件：<code>pip install anthropic</code>
                            <div class="api-key-field">
                                <input type="password" class="gen-input" id="api-key-input" placeholder="sk-ant-...">
                                <button class="btn-save-key" onclick="saveApiKey()">儲存</button>
                            </div>
                        </div>
                        <div class="api-notice" id="pkg-notice" style="display:none;">
                            <strong>缺少 anthropic 套件</strong><br>
                            請在終端執行：<code>pip install anthropic</code> 然後重啟 Dashboard
                        </div>
                        <div id="gen-form">
                            <div class="gen-field">
                                <label>主題名稱 *</label>
                                <input type="text" class="gen-input" id="gen-topic" placeholder="例如：飛輪效應、沉沒成本謬誤">
                            </div>
                            <div class="gen-field">
                                <label>視覺隱喻（選填）</label>
                                <textarea class="gen-textarea" id="gen-metaphors" placeholder="例如：&#10;- 巨大齒輪 = 商業系統&#10;- 發光粒子 = 累積的動能&#10;- 顏色：灰色(靜止) → 青色(啟動) → 金色(加速)"></textarea>
                            </div>
                            <div class="gen-field">
                                <label>字幕（選填，留空則自動生成）</label>
                                <div id="subtitle-pairs">
                                    <div class="gen-sub-row"><input class="gen-input" placeholder="Intro EN" data-stage="0" data-lang="en"><input class="gen-input" placeholder="Intro 中文" data-stage="0" data-lang="zh"></div>
                                    <div class="gen-sub-row"><input class="gen-input" placeholder="Conflict EN" data-stage="1" data-lang="en"><input class="gen-input" placeholder="Conflict 中文" data-stage="1" data-lang="zh"></div>
                                    <div class="gen-sub-row"><input class="gen-input" placeholder="Insight EN" data-stage="2" data-lang="en"><input class="gen-input" placeholder="Insight 中文" data-stage="2" data-lang="zh"></div>
                                    <div class="gen-sub-row"><input class="gen-input" placeholder="Solution EN" data-stage="3" data-lang="en"><input class="gen-input" placeholder="Solution 中文" data-stage="3" data-lang="zh"></div>
                                </div>
                            </div>
                            <div class="gen-field">
                                <label>額外要求（選填）</label>
                                <textarea class="gen-textarea" id="gen-extra" placeholder="例如：齒輪使用 TorusGeometry 製作、Conflict 階段鏡頭震動" style="min-height:50px;"></textarea>
                            </div>
                            <div class="control-row">
                                <button class="btn-generate" id="generate-btn" onclick="startGenerate()">生成 HTML</button>
                            </div>
                        </div>
                        <div class="progress-box" id="gen-progress">
                            <div class="progress-step" id="gen-progress-step">準備中...</div>
                            <div class="progress-bar-bg"><div class="progress-bar-fill fill-green" id="gen-progress-bar" style="width:0%"></div></div>
                        </div>
                        <div class="result-box" id="gen-result"><div class="result-text" id="gen-result-text"></div></div>
                    </div>
                </div>
            </div>

            <!-- ===== 批次轉檔區 ===== -->
            <div class="batch-render-section" id="batch-render-section">
                <div class="batch-render-card">
                    <div class="batch-render-header" onclick="toggleBatchRender()">
                        <h3>批次轉檔 MP4</h3>
                        <span class="batch-render-toggle" id="batch-render-toggle">展開 ▼</span>
                    </div>
                    <div class="batch-render-body" id="batch-render-body">
                        <div class="batch-file-list" id="batch-file-list">
                            <div style="padding:12px;color:#666;font-size:13px;">載入中...</div>
                        </div>
                        <div class="batch-controls">
                            <button class="batch-select-all" onclick="toggleSelectAllBatch()">全選/取消</button>
                            <span class="batch-selected-count" id="batch-selected-count">已選擇 0 個</span>
                            <button class="btn-batch-render" id="batch-render-btn" onclick="startBatchRender()" disabled>開始批次轉檔</button>
                        </div>
                        <div class="batch-status" id="batch-status">
                            <div class="batch-status-step" id="batch-status-step">準備中...</div>
                            <div class="batch-progress-bar"><div class="batch-progress-fill" id="batch-progress-fill" style="width:0%"></div></div>
                            <div class="batch-result" id="batch-result"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== 製作模式內容 ===== -->
            <div id="render-content" style="display:none;width:100%;max-width:800px;">
                <div id="html-preview-wrapper">
                    <div id="html-preview-container">
                        <iframe id="html-preview-frame"></iframe>
                    </div>
                </div>
                <div class="card">
                    <div class="card-label">規格驗證（12 項）</div>
                    <ul class="check-list" id="check-list"><li style="color:#555;padding:8px 0;">選擇 HTML 檔案後自動驗證</li></ul>
                </div>
                <div class="card">
                    <div class="control-row">
                        <button class="btn-render" id="render-btn" onclick="startRender()" disabled>轉檔為 MP4</button>
                    </div>
                </div>
                <div class="progress-box" id="render-progress">
                    <div class="progress-step" id="render-progress-step">準備中...</div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill fill-purple" id="render-progress-bar" style="width:0%"></div></div>
                </div>
                <div class="result-box" id="render-result"><div class="result-text" id="render-result-text"></div></div>
            </div>

            <!-- ===== 自動產線內容 ===== -->
            <div class="pipeline-section" id="pipeline-content">
                <div class="pipeline-card">
                    <div class="pipeline-header">
                        <h3>🤖 全自動內容產線</h3>
                        <div class="pipeline-status">
                            <div class="status-dot idle" id="pipeline-dot"></div>
                            <span class="status-text" id="pipeline-status-text">閒置中</span>
                        </div>
                    </div>

                    <div class="pipeline-controls">
                        <div class="field">
                            <label>執行間隔</label>
                            <select id="pipeline-interval">
                                <option value="1">每 1 小時</option>
                                <option value="2">每 2 小時</option>
                                <option value="4" selected>每 4 小時</option>
                                <option value="6">每 6 小時</option>
                                <option value="8">每 8 小時</option>
                                <option value="12">每 12 小時</option>
                                <option value="24">每 24 小時</option>
                            </select>
                        </div>
                        <div class="field" style="display:flex; align-items:flex-end; gap:8px;">
                            <button class="btn-start" id="pipeline-start-btn" onclick="startPipeline()">▶ 啟動持續執行</button>
                            <button class="btn-once" id="pipeline-once-btn" onclick="runPipelineOnce()">執行一次</button>
                            <button class="btn-stop" id="pipeline-stop-btn" onclick="stopPipeline()" style="display:none;">■ 停止</button>
                        </div>
                    </div>

                    <div class="pipeline-info">
                        <div class="info-item">
                            <div class="info-label">目前主題</div>
                            <div class="info-value" id="pipeline-topic">-</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">已完成次數</div>
                            <div class="info-value highlight" id="pipeline-runs">0</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">上次執行</div>
                            <div class="info-value" id="pipeline-last">-</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">下次執行</div>
                            <div class="info-value" id="pipeline-next">-</div>
                        </div>
                    </div>

                    <div class="pipeline-stage" id="stage-topic">
                        <div class="stage-icon" id="stage-icon-topic">1</div>
                        <div class="stage-name">選擇主題</div>
                        <div class="stage-status" id="stage-status-topic">等待中</div>
                    </div>
                    <div class="pipeline-stage" id="stage-html">
                        <div class="stage-icon" id="stage-icon-html">2</div>
                        <div class="stage-name">AI 生成 HTML</div>
                        <div class="stage-status" id="stage-status-html">等待中</div>
                    </div>
                    <div class="pipeline-stage" id="stage-render">
                        <div class="stage-icon" id="stage-icon-render">3</div>
                        <div class="stage-name">轉檔 MP4</div>
                        <div class="stage-status" id="stage-status-render">等待中</div>
                    </div>
                    <div class="pipeline-stage" id="stage-caption">
                        <div class="stage-icon" id="stage-icon-caption">4</div>
                        <div class="stage-name">生成文案</div>
                        <div class="stage-status" id="stage-status-caption">等待中</div>
                    </div>
                    <div class="pipeline-stage" id="stage-publish">
                        <div class="stage-icon" id="stage-icon-publish">5</div>
                        <div class="stage-name">發布 IG Reels</div>
                        <div class="stage-status" id="stage-status-publish">等待中</div>
                    </div>
                </div>

                <div class="pipeline-card">
                    <h3 style="font-size:14px; color:#888; margin-bottom:12px;">執行日誌</h3>
                    <div class="pipeline-log" id="pipeline-log">
                        <div class="log-entry">等待啟動...</div>
                    </div>
                </div>
            </div>

            <!-- ===== Threads 發文內容 ===== -->
            <div class="threads-section" id="threads-content">
                <!-- 子分頁 -->
                <div class="threads-subtabs">
                    <div class="threads-subtab active" onclick="switchThreadsSubtab('manage')">帳號管理</div>
                    <div class="threads-subtab" onclick="switchThreadsSubtab('library')">📚 文案庫</div>
                </div>

                <!-- 帳號管理 -->
                <div class="library-section active" id="threads-manage-section">
                    <div class="threads-layout">
                        <div class="threads-sidebar">
                            <div class="threads-card">
                                <h3>📱 Threads 帳號</h3>
                                <div class="threads-list" id="threads-list">
                                    <div style="padding:12px;color:#555;font-size:13px;">載入中...</div>
                                </div>
                                <div class="threads-btn-row">
                                    <button class="btn-threads add" onclick="addThreadsAccount()">➕ 新增</button>
                                    <button class="btn-threads del" onclick="deleteThreadsAccount()">🗑️ 刪除</button>
                                </div>
                            </div>
                        </div>
                        <div class="threads-main">
                            <div class="threads-card">
                                <h3>⚙️ 帳號設定</h3>
                                <div class="threads-field">
                                    <label>帳號名稱</label>
                                    <input type="text" class="threads-input" id="t-name" placeholder="例如：主帳號">
                                </div>
                                <div class="threads-field">
                                    <label class="threads-toggle"><input type="checkbox" id="t-enabled" checked> 啟用此帳號</label>
                                </div>
                                <div class="threads-field">
                                    <label>Gemini API Key</label>
                                    <input type="password" class="threads-input" id="t-gemini-key" placeholder="從 Google AI Studio 取得">
                                </div>
                                <div class="threads-field">
                                    <label>Threads Access Token</label>
                                    <input type="password" class="threads-input" id="t-threads-token" placeholder="從 Meta Developer 取得">
                                </div>
                                <div class="threads-field">
                                    <label>Threads User ID</label>
                                    <input type="text" class="threads-input" id="t-threads-userid" placeholder="數字 ID">
                                </div>
                                <div class="threads-field">
                                    <label>排程時間（逗號分隔）</label>
                                    <input type="text" class="threads-input" id="t-schedule" placeholder="09:00, 18:00">
                                </div>
                                <div class="threads-field">
                                    <label>System Prompt（風格設定）</label>
                                    <textarea class="threads-textarea" id="t-prompt" placeholder="定義貼文風格..."></textarea>
                                </div>
                                <div style="display:flex; gap:8px; margin-top:16px;">
                                    <button class="btn-threads-action save" onclick="saveThreadsAccount()">💾 儲存設定</button>
                                </div>
                            </div>

                            <div class="threads-card">
                                <h3>✍️ 發文</h3>
                                <div class="threads-field">
                                    <label>主題（選填，留空則自動發想）</label>
                                    <input type="text" class="threads-input" id="t-topic" placeholder="例如：投資心態">
                                </div>
                                <div style="display:flex; gap:8px; margin-top:12px;">
                                    <button class="btn-threads-action preview" id="t-preview-btn" onclick="previewThreadsPost()">👁️ 預覽貼文</button>
                                    <button class="btn-threads-action post" id="t-post-btn" onclick="postToThreads()">📤 直接發文</button>
                                </div>
                                <div id="t-preview-box" class="threads-preview-box" style="display:none;"></div>
                                <div id="t-status-box" style="margin-top:12px; padding:12px; border-radius:8px; display:none;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 文案庫 -->
                <div class="library-section" id="threads-library-section" style="display:flex; gap:20px;">
                    <!-- 左側帳號儀表板 -->
                    <div class="accounts-dashboard" id="accounts-dashboard">
                        <h4>📊 帳號總覽</h4>
                        <div id="dashboard-accounts">
                            <div style="color:#666; font-size:12px; text-align:center; padding:20px;">載入中...</div>
                        </div>

                        <!-- 發文紀錄 -->
                        <div class="post-logs">
                            <h4>
                                📋 發文紀錄
                                <span class="log-stats">
                                    <span class="success" id="log-success-count">0</span> ✓ /
                                    <span class="error" id="log-error-count">0</span> ✗
                                </span>
                            </h4>
                            <div id="post-logs-list">
                                <div style="color:#666; font-size:11px; text-align:center; padding:10px;">暫無紀錄</div>
                            </div>
                        </div>
                    </div>

                    <!-- 右側主內容 -->
                    <div class="library-main-content">
                    <div class="threads-card" style="margin-bottom:16px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h3 style="margin:0;">📚 文案庫 - <span id="lib-account-name">選擇帳號</span></h3>
                            <select id="lib-account-select" class="threads-select" style="width:auto; display:none;" onchange="loadLibrary()">
                                <option value="">-- 選擇帳號 --</option>
                            </select>
                        </div>
                        <div class="library-stats" id="lib-stats">
                            <span class="pending">⏳ 待發 <strong id="lib-pending">0</strong> 篇</span>
                            <span class="published">✅ 已發 <strong id="lib-published">0</strong> 篇</span>
                            <span>📊 共 <strong id="lib-total">0</strong> 篇</span>
                        </div>
                        <!-- 排程資訊 -->
                        <div class="library-schedule" id="lib-schedule" style="margin-top:12px; padding:12px; background:#1a2a3a; border-radius:8px; display:none;">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                                <div style="display:flex; gap:16px; flex-wrap:wrap;">
                                    <span style="color:#7ecbf5;">📅 每日需要 <strong id="lib-daily-required" style="color:#4ec9b0;">0</strong> 篇</span>
                                    <span style="color:#888;">排程：<span id="lib-schedule-times">-</span></span>
                                    <span style="color:#888;">下一次：<span id="lib-next-post" style="color:#ffcc00;">-</span></span>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span id="lib-days-available" style="color:#888;">可維持 <strong style="color:#4ec9b0;">0</strong> 天</span>
                                    <span id="lib-scheduler-status" style="padding:4px 10px; border-radius:12px; font-size:12px; background:#1a3a2a; color:#4ec9b0;">自動發文中</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 補充文案區塊（移至上方） -->
                    <div style="display:flex; gap:16px; margin-bottom:16px; flex-wrap:wrap;">
                        <div class="library-batch" style="flex:1; min-width:280px; margin-top:0;">
                            <h4>🤖 AI 批量生成</h4>
                            <div class="library-batch-row">
                                <span style="color:#888;">生成數量：</span>
                                <select id="lib-batch-count">
                                    <option value="5">5 篇</option>
                                    <option value="10" selected>10 篇</option>
                                    <option value="15">15 篇</option>
                                    <option value="20">20 篇</option>
                                </select>
                                <button class="btn-generate" id="lib-batch-btn" onclick="batchGenerate()">🚀 批量生成</button>
                            </div>
                            <div class="library-batch-status" id="lib-batch-status"></div>
                        </div>

                        <div class="library-import" style="flex:1; min-width:280px; margin-top:0;">
                            <h4>📥 手動導入文案 <span class="toggle-hint" onclick="toggleImportHint()">查看格式說明 ▼</span></h4>
                            <div class="library-import-hint" id="import-hint">
                                <strong>📋 導入格式說明</strong><br><br>
                                • 每篇文案之間用 <code>---</code> 或 <code>—-</code> 分隔（獨立一行，2個以上減號或破折號）<br>
                                • 每篇文案會自動去除首尾空白<br>
                                • 空白的文案會被忽略<br>
                                • 支援 Emoji 和換行符號<br>
                                • 建議每篇文案控制在 500 字以內<br><br>
                                <strong>範例：</strong>
                                <div class="example">第一篇文案內容...

#標籤1 #標籤2
---
第二篇文案內容...

#標籤3 #標籤4</div>
                            </div>
                            <textarea id="import-content" placeholder="貼上多篇文案，每篇之間用 --- 分隔..." style="min-height:80px;"></textarea>
                            <div class="library-import-row">
                                <button class="btn-import" id="import-btn" onclick="importPosts()">📥 導入文案</button>
                                <span class="import-count" id="import-count">偵測到 0 篇文案</span>
                            </div>
                            <div class="library-import-status" id="import-status"></div>
                        </div>
                    </div>

                    <div class="library-actions">
                        <button class="btn-move" onclick="moveLibPost('up')">🔼 上移</button>
                        <button class="btn-move" onclick="moveLibPost('down')">🔽 下移</button>
                        <button class="btn-add" onclick="addSinglePost()">📝 新增單篇</button>
                        <button class="btn-del" style="background:#e94560;color:#fff;" onclick="deleteSelectedPost()">🗑️ 刪除選取</button>
                        <button class="btn-clear" onclick="clearPublished()">🧹 清空已發</button>
                        <button class="btn-post-lib" onclick="postFromLibrary()">📤 發布下一篇</button>
                    </div>

                    <div class="threads-card" style="padding:0; overflow:hidden;">
                        <table class="library-table">
                            <thead>
                                <tr>
                                    <th class="col-order">#</th>
                                    <th class="col-preview">內容預覽</th>
                                    <th class="col-status">狀態</th>
                                    <th class="col-actions">操作</th>
                                </tr>
                            </thead>
                            <tbody id="lib-table-body">
                                <tr><td colspan="4" style="text-align:center; padding:40px; color:#555;">請先選擇帳號</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="library-warning" id="lib-warning">⚠️ 文案庫剩餘不足 5 篇，建議補充！</div>
                    </div><!-- /library-main-content -->
                </div>
            </div>

            <!-- ===== 設定頁面 ===== -->
            <div class="settings-section" id="settings-content">
                <div class="settings-tabs">
                    <div class="settings-tab active" onclick="switchSettingsTab('api')">API 設定</div>
                    <div class="settings-tab" onclick="switchSettingsTab('spec')">規格書指令</div>
                </div>

                <!-- API 設定面板 -->
                <div class="settings-panel active" id="settings-api-panel">
                    <div class="settings-card">
                        <h3>🔑 AI API 設定</h3>

                        <div class="settings-field">
                            <label>AI 模型選擇（用於 HTML 生成）</label>
                            <div class="model-selector">
                                <div class="model-option" data-model="gemini" onclick="selectModel('gemini')">Gemini</div>
                                <div class="model-option" data-model="anthropic" onclick="selectModel('anthropic')">Claude (Anthropic)</div>
                            </div>
                        </div>

                        <div class="settings-field">
                            <label>Gemini API Key</label>
                            <div class="api-key-row">
                                <input type="password" class="settings-input" id="settings-gemini-key" placeholder="從 Google AI Studio 取得">
                                <span class="api-key-status" id="gemini-key-status"></span>
                            </div>
                            <div class="hint">前往 <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#4ec9b0;">Google AI Studio</a> 免費取得 API Key</div>
                        </div>

                        <div class="settings-field">
                            <label>Anthropic API Key</label>
                            <div class="api-key-row">
                                <input type="password" class="settings-input" id="settings-anthropic-key" placeholder="sk-ant-...">
                                <span class="api-key-status" id="anthropic-key-status"></span>
                            </div>
                            <div class="hint">前往 <a href="https://console.anthropic.com/" target="_blank" style="color:#4ec9b0;">Anthropic Console</a> 取得 API Key</div>
                        </div>

                        <div class="settings-btn-row">
                            <button class="btn-settings save" onclick="saveApiSettings()">💾 儲存 API 設定</button>
                        </div>
                        <div class="settings-status" id="api-settings-status"></div>
                    </div>
                </div>

                <!-- 規格書指令面板 -->
                <div class="settings-panel" id="settings-spec-panel">
                    <div class="settings-card">
                        <h3>📋 規格書指令</h3>
                        <div class="hint" style="margin-bottom:12px;">這是 AI 生成 HTML 時使用的規格書指令。修改後會影響所有 AI 生成結果。</div>

                        <div class="settings-field">
                            <label>規格書檔案：UltraAdvisorVideo-Spec.md</label>
                            <textarea class="settings-textarea" id="settings-spec-content" placeholder="載入中..."></textarea>
                        </div>

                        <div class="settings-btn-row">
                            <button class="btn-settings save" onclick="saveSpecContent()">💾 儲存規格書</button>
                            <button class="btn-settings reset" onclick="reloadSpecContent()">🔄 重新載入</button>
                        </div>
                        <div class="settings-status" id="spec-settings-status"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 編輯文案彈窗 -->
<div class="modal-overlay" id="edit-modal">
    <div class="modal-box">
        <div class="modal-header">
            <h3>📝 編輯文案</h3>
            <button class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <div class="modal-body">
            <textarea id="edit-content" placeholder="輸入文案內容..."></textarea>
        </div>
        <div class="modal-footer">
            <span class="char-count">字數：<span id="edit-char-count">0</span></span>
            <div>
                <button class="btn-cancel" onclick="closeEditModal()">取消</button>
                <button class="btn-save" onclick="saveEditPost()">💾 儲存</button>
            </div>
        </div>
    </div>
</div>

<script>
let currentTab = 'publish';
let currentVideo = null;
let currentHtml = null;
let currentHasCaption = false;
let pollTimer = null;
let renderPollTimer = null;
let genPollTimer = null;
let genExpanded = false;
let pipelinePollTimer = null;
let currentThreadsAccount = -1;
let currentThreadsSubtab = 'manage';
let selectedLibPost = null;
let editingPostId = null;
let batchPollTimer = null;

// ===== Tab 切換 =====
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const tabIndex = {publish: 0, render: 1, pipeline: 2, threads: 3, settings: 4}[tab] || 0;
    document.querySelectorAll('.nav-tab')[tabIndex].classList.add('active');

    document.getElementById('publish-content').style.display = 'none';
    document.getElementById('render-content').style.display = 'none';
    document.getElementById('pipeline-content').style.display = 'none';
    document.getElementById('threads-content').style.display = 'none';
    document.getElementById('settings-content').style.display = 'none';
    document.getElementById('generate-section').style.display = 'none';
    document.getElementById('batch-render-section').style.display = 'none';
    document.getElementById('sidebar').style.display = (tab === 'pipeline' || tab === 'threads' || tab === 'settings') ? 'none' : 'flex';

    stopPipelinePolling();

    if (tab === 'pipeline') {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('pipeline-content').style.display = 'block';
        document.getElementById('header-title').textContent = '自動產線控制台';
        startPipelinePolling();
    } else if (tab === 'threads') {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('threads-content').style.display = 'block';
        document.getElementById('header-title').textContent = 'Threads 多帳號發文';
        loadThreadsAccounts();
    } else if (tab === 'settings') {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('settings-content').style.display = 'block';
        document.getElementById('header-title').textContent = '系統設定';
        loadSettings();
    } else {
        document.getElementById('empty-state').style.display = 'flex';
        document.getElementById('generate-section').style.display = tab === 'render' ? 'block' : 'none';
        document.getElementById('batch-render-section').style.display = tab === 'render' ? 'block' : 'none';
        document.getElementById('sidebar-header').textContent = tab === 'publish' ? '影片清單' : 'HTML 檔案';
        document.getElementById('header-title').textContent = '請選擇項目';
        stopPipelinePolling();
    }

    currentVideo = null;
    currentHtml = null;
    if (tab !== 'pipeline' && tab !== 'settings') refreshList();
}

function refreshList() {
    if (currentTab === 'publish') loadVideos();
    else if (currentTab === 'render') loadHtmlFiles();
}

// ===== IG 排程功能 =====
async function loadIgSchedule() {
    try {
        const resp = await fetch('/api/ig-schedule');
        const data = await resp.json();

        if (data.success) {
            const s = data.schedule;
            const stats = data.stats;

            document.getElementById('ig-schedule-enabled').checked = s.enabled;
            document.getElementById('ig-schedule-times').value = s.schedule_times || '09:00,18:00';
            document.getElementById('ig-schedule-story').checked = s.also_story !== false;

            document.getElementById('ig-pending-count').textContent = stats.pending_count || 0;
            document.getElementById('ig-daily-count').textContent = stats.daily_required || 0;
            document.getElementById('ig-days-available').textContent = stats.days_available || 0;
            document.getElementById('ig-next-post').textContent = stats.next_post_time || '-';

            const statusText = document.getElementById('ig-schedule-status-text');
            const badge = document.getElementById('ig-scheduler-badge');

            if (s.enabled && stats.scheduler_running) {
                statusText.textContent = '已啟用';
                statusText.style.color = '#4ec9b0';
                badge.style.background = '#1a3a2a';
                badge.style.color = '#4ec9b0';
                badge.textContent = '自動發布中';
            } else if (s.enabled) {
                statusText.textContent = '已啟用';
                statusText.style.color = '#ffcc00';
                badge.style.background = '#3a3a1a';
                badge.style.color = '#ffcc00';
                badge.textContent = '等待啟動';
            } else {
                statusText.textContent = '已停用';
                statusText.style.color = '#888';
                badge.style.background = '#3a3a3a';
                badge.style.color = '#888';
                badge.textContent = '排程停止';
            }
        }
    } catch (e) {
        console.error('Load IG schedule error:', e);
    }
}

async function saveIgSchedule() {
    const enabled = document.getElementById('ig-schedule-enabled').checked;
    const times = document.getElementById('ig-schedule-times').value;
    const alsoStory = document.getElementById('ig-schedule-story').checked;

    try {
        await fetch('/api/ig-schedule', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                enabled: enabled,
                schedule_times: times,
                also_story: alsoStory
            })
        });

        // 根據啟用狀態控制排程器
        if (enabled) {
            await fetch('/api/ig-schedule/start', { method: 'POST' });
        } else {
            await fetch('/api/ig-schedule/stop', { method: 'POST' });
        }

        await loadIgSchedule();
        alert('IG 排程設定已儲存');
    } catch (e) {
        console.error('Save IG schedule error:', e);
        alert('儲存失敗');
    }
}

async function toggleIgSchedule() {
    await saveIgSchedule();
}

// ===== 發布模式 - 影片清單 =====
async function loadVideos() {
    // 同時載入排程資訊
    loadIgSchedule();
    const resp = await fetch('/api/videos');
    const data = await resp.json();
    const list = document.getElementById('sidebar-list');
    let html = '';

    html += '<div class="section-label">待發布</div>';
    if (data.pending.length === 0) {
        html += '<div style="padding:12px;color:#555;font-size:13px;">沒有待發布的影片</div>';
    }
    data.pending.forEach(v => {
        const bc = v.has_caption ? 'badge-ok' : 'badge-no';
        const bt = v.has_caption ? 'V' : 'X';
        html += `<div class="list-item" data-name="${v.name}" data-file="${v.file}" data-caption="${v.has_caption}" onclick="selectVideo(this)">
            <span class="badge ${bc}">${bt}</span>
            <span class="name">${v.name}</span>
            <span class="size">${v.size_mb} MB</span>
            <button class="btn-move-video" onclick="event.stopPropagation(); moveToUploaded('${v.name}')" title="標記為已上傳">→</button>
        </div>`;
    });

    if (data.uploaded.length > 0) {
        html += '<div class="section-label">已上傳</div>';
        data.uploaded.forEach(v => {
            html += `<div class="archived-item">
                <span class="name">${v.name}</span>
                <span class="size">${v.size_mb} MB</span>
                <button class="btn-move-video back" onclick="moveToPending('${v.name}')" title="移回待發布">←</button>
            </div>`;
        });
    }
    list.innerHTML = html;
}

async function moveToUploaded(name) {
    if (!confirm(`確定要將「${name}」標記為已上傳嗎？`)) return;
    try {
        const resp = await fetch(`/api/video/${encodeURIComponent(name)}/move-to-uploaded`, { method: 'POST' });
        const data = await resp.json();
        if (data.success) {
            loadVideos();
        } else {
            alert('移動失敗：' + data.error);
        }
    } catch (e) {
        alert('移動失敗：' + e.message);
    }
}

async function moveToPending(name) {
    if (!confirm(`確定要將「${name}」移回待發布嗎？`)) return;
    try {
        const resp = await fetch(`/api/video/${encodeURIComponent(name)}/move-to-pending`, { method: 'POST' });
        const data = await resp.json();
        if (data.success) {
            loadVideos();
        } else {
            alert('移動失敗：' + data.error);
        }
    } catch (e) {
        alert('移動失敗：' + e.message);
    }
}

async function selectVideo(el) {
    document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    const name = el.dataset.name;
    const file = el.dataset.file;
    const hasCaption = el.dataset.caption === 'true';
    currentVideo = name;
    currentHasCaption = hasCaption;

    document.getElementById('header-title').textContent = file;
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('publish-content').style.display = 'block';

    const player = document.getElementById('video-player');
    player.src = '/video/' + encodeURIComponent(file);
    player.load();

    const captionEl = document.getElementById('caption-text');
    if (hasCaption) {
        const resp = await fetch('/api/caption/' + encodeURIComponent(name));
        const data = await resp.json();
        if (data.success) {
            let text = data.caption;
            text = text.replace(/(#[^\s#]+)/g, '<span class="hashtags">$1</span>');
            captionEl.innerHTML = text;
        } else {
            captionEl.innerHTML = '<span style="color:#f44747">無法載入文案</span>';
        }
    } else {
        captionEl.innerHTML = '<span style="color:#f44747">此影片沒有對應文案，無法發布</span>';
    }

    const btn = document.getElementById('publish-btn');
    btn.disabled = !hasCaption;
    btn.textContent = hasCaption ? '發布到 IG Reels' : '缺少文案，無法發布';

    document.getElementById('pub-progress').style.display = 'none';
    document.getElementById('pub-result').style.display = 'none';
}

// ===== 發布 =====
async function startPublish() {
    if (!currentVideo || !currentHasCaption) return;
    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = '發布中...';

    document.getElementById('pub-progress').style.display = 'block';
    document.getElementById('pub-progress-step').textContent = '準備中...';
    document.getElementById('pub-progress-bar').style.width = '0%';
    document.getElementById('pub-result').style.display = 'none';

    const resp = await fetch('/api/upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({video: currentVideo, also_story: document.getElementById('story-toggle').checked}),
    });
    const data = await resp.json();
    if (!data.success) {
        showPubResult('error', data.error);
        btn.disabled = false; btn.textContent = '發布到 IG Reels';
        return;
    }
    startPubPolling();
}

const PUB_STEPS = {
    '準備中...':5,'上傳到 Firebase...':15,'Firebase 上傳重試中...':15,'Firebase 上傳完成':30,
    '建立 IG Container...':35,'等待 IG 處理影片...':40,'IG 處理中...':55,'影片處理完成':65,
    '發布 Reel 中...':70,'Reel 發布成功！':75,'建立限時動態...':80,'等待限動處理...':85,
    '發布限時動態...':90,'限時動態發布成功！':95,'清理完成':98,'發布完成！':100,
};

function startPubPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
        const resp = await fetch('/api/upload/status');
        const s = await resp.json();
        const step = s.step || '處理中...';
        document.getElementById('pub-progress-step').textContent = step;
        document.getElementById('pub-progress-bar').style.width = (PUB_STEPS[step]||50) + '%';

        if (s.status === 'done') {
            clearInterval(pollTimer); pollTimer = null;
            document.getElementById('pub-progress').style.display = 'none';
            let msg = 'Reel 發布成功！\nPost ID: ' + s.post_id;
            if (s.story_id) msg += '\n限時動態 ID: ' + s.story_id;
            showPubResult('success', msg);
            await loadVideos();
            currentVideo = null;
            document.getElementById('publish-btn').disabled = true;
            document.getElementById('publish-btn').textContent = '已發布';
            fetch('/api/upload/reset', {method:'POST'});
        }
        if (s.status === 'error') {
            clearInterval(pollTimer); pollTimer = null;
            document.getElementById('pub-progress').style.display = 'none';
            showPubResult('error', s.error || '未知錯誤');
            document.getElementById('publish-btn').disabled = false;
            document.getElementById('publish-btn').textContent = '重試發布';
            fetch('/api/upload/reset', {method:'POST'});
        }
    }, 2000);
}

function showPubResult(type, msg) {
    const el = document.getElementById('pub-result');
    el.style.display = 'block'; el.className = 'result-box ' + type;
    document.getElementById('pub-result-text').textContent = msg;
}

// ===== 製作模式 - HTML 清單 =====
async function loadHtmlFiles() {
    const resp = await fetch('/api/html-files');
    const data = await resp.json();
    const list = document.getElementById('sidebar-list');
    let html = '';

    html += '<div class="section-label">待轉檔</div>';
    if (data.pending.length === 0) {
        html += '<div style="padding:12px;color:#555;font-size:13px;">根目錄沒有 HTML 檔案</div>';
    }
    data.pending.forEach(f => {
        html += `<div class="list-item" data-name="${f.name}" onclick="selectHtml(this)">
            <span class="name">${f.name}.html</span>
            <span class="size">${f.size_kb} KB</span>
        </div>`;
    });

    if (data.archived.length > 0) {
        html += '<div class="section-label">已封存</div>';
        data.archived.forEach(f => {
            html += `<div class="archived-item"><span class="name">${f.name}.html</span><span class="size">${f.size_kb} KB</span></div>`;
        });
    }
    list.innerHTML = html;
}

async function selectHtml(el) {
    document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    const name = el.dataset.name;
    currentHtml = name;

    document.getElementById('header-title').textContent = name + '.html';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('render-content').style.display = 'block';

    // 載入 HTML 預覽
    document.getElementById('html-preview-frame').src = '/html-preview/' + encodeURIComponent(name);

    // 執行驗證
    const checkList = document.getElementById('check-list');
    checkList.innerHTML = '<li style="color:#888;padding:8px 0;">驗證中...</li>';

    const resp = await fetch('/api/validate/' + encodeURIComponent(name));
    const data = await resp.json();

    if (!data.success) {
        checkList.innerHTML = '<li style="color:#f44747;padding:8px 0;">驗證失敗：' + data.error + '</li>';
        document.getElementById('render-btn').disabled = true;
        return;
    }

    let html = '';
    data.checks.forEach(c => {
        const cls = c.passed ? 'check-pass' : 'check-fail';
        const icon = c.passed ? '[V]' : '[X]';
        let detail = c.detail ? ' <span style="color:#888;font-size:12px;">(' + c.detail + ')</span>' : '';
        html += `<li class="check-item ${cls}"><span class="check-icon">${icon}</span>${c.name}${detail}</li>`;
    });
    checkList.innerHTML = html;

    const renderBtn = document.getElementById('render-btn');
    renderBtn.disabled = !data.passed;
    renderBtn.textContent = data.passed ? '轉檔為 MP4' : '驗證未通過，無法轉檔';

    document.getElementById('render-progress').style.display = 'none';
    document.getElementById('render-result').style.display = 'none';
}

// ===== 轉檔 =====
async function startRender() {
    if (!currentHtml) return;
    const btn = document.getElementById('render-btn');
    btn.disabled = true; btn.textContent = '轉檔中...';

    document.getElementById('render-progress').style.display = 'block';
    document.getElementById('render-progress-step').textContent = '啟動轉檔...';
    document.getElementById('render-progress-bar').style.width = '0%';
    document.getElementById('render-result').style.display = 'none';

    const resp = await fetch('/api/render', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({file: currentHtml}),
    });
    const data = await resp.json();
    if (!data.success) {
        showRenderResult('error', data.error);
        btn.disabled = false; btn.textContent = '轉檔為 MP4';
        document.getElementById('render-progress').style.display = 'none';
        return;
    }
    startRenderPolling();
}

function startRenderPolling() {
    if (renderPollTimer) clearInterval(renderPollTimer);
    renderPollTimer = setInterval(async () => {
        const resp = await fetch('/api/render/status');
        const s = await resp.json();
        document.getElementById('render-progress-step').textContent = s.step || '處理中...';
        document.getElementById('render-progress-bar').style.width = (s.percent || 0) + '%';

        if (s.status === 'done') {
            clearInterval(renderPollTimer); renderPollTimer = null;
            document.getElementById('render-progress').style.display = 'none';
            showRenderResult('success', '轉檔完成！MP4 已放入出貨區，HTML 已封存。');
            await loadHtmlFiles();
            document.getElementById('render-btn').disabled = true;
            document.getElementById('render-btn').textContent = '已完成';
            fetch('/api/render/reset', {method:'POST'});
        }
        if (s.status === 'error') {
            clearInterval(renderPollTimer); renderPollTimer = null;
            document.getElementById('render-progress').style.display = 'none';
            showRenderResult('error', s.error || '未知錯誤');
            document.getElementById('render-btn').disabled = false;
            document.getElementById('render-btn').textContent = '重試轉檔';
            fetch('/api/render/reset', {method:'POST'});
        }
    }, 2000);
}

function showRenderResult(type, msg) {
    const el = document.getElementById('render-result');
    el.style.display = 'block'; el.className = 'result-box ' + type;
    document.getElementById('render-result-text').textContent = msg;
}

// ===== 批次轉檔 =====
let batchRenderExpanded = false;
let batchRenderPollTimer = null;
let batchPendingFiles = [];

function toggleBatchRender() {
    batchRenderExpanded = !batchRenderExpanded;
    document.getElementById('batch-render-body').style.display = batchRenderExpanded ? 'block' : 'none';
    document.getElementById('batch-render-toggle').textContent = batchRenderExpanded ? '收起 ▲' : '展開 ▼';
    if (batchRenderExpanded) loadBatchFileList();
}

async function loadBatchFileList() {
    const resp = await fetch('/api/html-files');
    const data = await resp.json();
    batchPendingFiles = data.pending;

    const list = document.getElementById('batch-file-list');
    if (data.pending.length === 0) {
        list.innerHTML = '<div style="padding:12px;color:#666;font-size:13px;">根目錄沒有待轉檔的 HTML 檔案</div>';
        return;
    }

    let html = '';
    data.pending.forEach(f => {
        html += `<div class="batch-file-item" onclick="toggleBatchFile(this, '${f.name}')">
            <input type="checkbox" data-name="${f.name}" onclick="event.stopPropagation(); updateBatchSelection()">
            <span class="batch-file-name">${f.name}.html</span>
            <span class="batch-file-size">${f.size_kb} KB</span>
        </div>`;
    });
    list.innerHTML = html;
    updateBatchSelection();
}

function toggleBatchFile(el, name) {
    const cb = el.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    el.classList.toggle('selected', cb.checked);
    updateBatchSelection();
}

function toggleSelectAllBatch() {
    const checkboxes = document.querySelectorAll('#batch-file-list input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
        cb.closest('.batch-file-item').classList.toggle('selected', cb.checked);
    });
    updateBatchSelection();
}

function updateBatchSelection() {
    const checkboxes = document.querySelectorAll('#batch-file-list input[type="checkbox"]:checked');
    const count = checkboxes.length;
    document.getElementById('batch-selected-count').textContent = `已選擇 ${count} 個`;
    document.getElementById('batch-render-btn').disabled = count === 0;
}

function getSelectedBatchFiles() {
    const checkboxes = document.querySelectorAll('#batch-file-list input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.name);
}

async function startBatchRender() {
    const files = getSelectedBatchFiles();
    if (files.length === 0) {
        alert('請選擇至少一個檔案');
        return;
    }

    const btn = document.getElementById('batch-render-btn');
    btn.disabled = true;
    btn.textContent = '轉檔中...';

    document.getElementById('batch-status').style.display = 'block';
    document.getElementById('batch-status-step').textContent = '啟動批次轉檔...';
    document.getElementById('batch-progress-fill').style.width = '0%';
    document.getElementById('batch-result').innerHTML = '';

    const resp = await fetch('/api/batch-render', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({files: files}),
    });

    const data = await resp.json();
    if (!data.success) {
        document.getElementById('batch-status-step').textContent = data.error;
        btn.disabled = false;
        btn.textContent = '開始批次轉檔';
        return;
    }

    startBatchRenderPolling();
}

function startBatchRenderPolling() {
    if (batchRenderPollTimer) clearInterval(batchRenderPollTimer);
    batchRenderPollTimer = setInterval(async () => {
        const resp = await fetch('/api/batch-render/status');
        const s = await resp.json();

        document.getElementById('batch-status-step').textContent = s.step || '處理中...';
        document.getElementById('batch-progress-fill').style.width = (s.percent || 0) + '%';

        // 顯示完成/失敗結果
        let resultHtml = '';
        if (s.completed && s.completed.length > 0) {
            resultHtml += '<div class="success">✓ 成功: ' + s.completed.join(', ') + '</div>';
        }
        if (s.failed && s.failed.length > 0) {
            s.failed.forEach(f => {
                resultHtml += '<div class="error">✗ ' + f.file + ': ' + f.error + '</div>';
            });
        }
        document.getElementById('batch-result').innerHTML = resultHtml;

        if (s.status === 'done' || s.status === 'error') {
            clearInterval(batchRenderPollTimer);
            batchRenderPollTimer = null;

            const btn = document.getElementById('batch-render-btn');
            btn.disabled = false;
            btn.textContent = '開始批次轉檔';

            await fetch('/api/batch-render/reset', {method:'POST'});
            await loadHtmlFiles();  // 重新整理側邊欄
            await loadBatchFileList();  // 重新整理批次列表
        }
    }, 2000);
}

// ===== AI 生成 =====
function toggleGenerate() {
    genExpanded = !genExpanded;
    document.getElementById('gen-body').style.display = genExpanded ? 'block' : 'none';
    document.getElementById('gen-toggle').textContent = genExpanded ? '收起 ▲' : '展開 ▼';
    if (genExpanded) checkApiConfig();
}

async function checkApiConfig() {
    const resp = await fetch('/api/config');
    const data = await resp.json();
    document.getElementById('api-notice').style.display = data.has_anthropic_key ? 'none' : 'block';
    document.getElementById('pkg-notice').style.display = data.has_anthropic_package ? 'none' : 'block';
    document.getElementById('generate-btn').disabled = !data.has_anthropic_key || !data.has_anthropic_package;
}

async function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) { alert('請輸入 API Key'); return; }
    await fetch('/api/config', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({anthropic_api_key: key}),
    });
    document.getElementById('api-key-input').value = '';
    await checkApiConfig();
}

async function startGenerate() {
    const topic = document.getElementById('gen-topic').value.trim();
    if (!topic) { alert('請輸入主題名稱'); return; }

    const metaphors = document.getElementById('gen-metaphors').value.trim();
    const extra = document.getElementById('gen-extra').value.trim();

    const subtitles = [];
    for (let i = 0; i < 4; i++) {
        const en = document.querySelector(`[data-stage="${i}"][data-lang="en"]`).value.trim();
        const zh = document.querySelector(`[data-stage="${i}"][data-lang="zh"]`).value.trim();
        if (en || zh) subtitles.push({en, zh});
    }

    const btn = document.getElementById('generate-btn');
    btn.disabled = true; btn.textContent = '生成中...';

    document.getElementById('gen-progress').style.display = 'block';
    document.getElementById('gen-progress-step').textContent = '啟動生成...';
    document.getElementById('gen-progress-bar').style.width = '0%';
    document.getElementById('gen-result').style.display = 'none';

    const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({topic, metaphors, subtitles, extra}),
    });
    const data = await resp.json();
    if (!data.success) {
        showGenResult('error', data.error);
        btn.disabled = false; btn.textContent = '生成 HTML';
        document.getElementById('gen-progress').style.display = 'none';
        return;
    }
    startGenPolling();
}

const GEN_STEPS = {
    '準備生成...':5, '建構提示詞...':10, '呼叫 Claude API（可能需要 30-90 秒）...':30,
    '儲存檔案...':80, '驗證中...':90,
};

function startGenPolling() {
    if (genPollTimer) clearInterval(genPollTimer);
    let elapsed = 0;
    genPollTimer = setInterval(async () => {
        elapsed += 2;
        const resp = await fetch('/api/generate/status');
        const s = await resp.json();
        const step = s.step || '處理中...';
        document.getElementById('gen-progress-step').textContent = step;

        let pct = GEN_STEPS[step] || 30;
        if (step.includes('Claude API') && elapsed > 4) {
            pct = Math.min(30 + (elapsed - 4) * 0.8, 75);
        }
        document.getElementById('gen-progress-bar').style.width = pct + '%';

        if (s.status === 'done') {
            clearInterval(genPollTimer); genPollTimer = null;
            document.getElementById('gen-progress').style.display = 'none';
            document.getElementById('gen-progress-bar').style.width = '100%';
            showGenResult('success', s.step + '\n檔案：' + s.file);
            document.getElementById('generate-btn').disabled = false;
            document.getElementById('generate-btn').textContent = '生成 HTML';
            document.getElementById('gen-topic').value = '';
            await loadHtmlFiles();
            fetch('/api/generate/reset', {method:'POST'});
        }
        if (s.status === 'error') {
            clearInterval(genPollTimer); genPollTimer = null;
            document.getElementById('gen-progress').style.display = 'none';
            showGenResult('error', s.error || '未知錯誤');
            document.getElementById('generate-btn').disabled = false;
            document.getElementById('generate-btn').textContent = '重試生成';
            fetch('/api/generate/reset', {method:'POST'});
        }
    }, 2000);
}

function showGenResult(type, msg) {
    const el = document.getElementById('gen-result');
    el.style.display = 'block'; el.className = 'result-box ' + type;
    document.getElementById('gen-result-text').textContent = msg;
}

// ===== 自動產線 =====
function startPipelinePolling() {
    if (pipelinePollTimer) return;
    updatePipelineStatus();
    pipelinePollTimer = setInterval(updatePipelineStatus, 2000);
}

function stopPipelinePolling() {
    if (pipelinePollTimer) {
        clearInterval(pipelinePollTimer);
        pipelinePollTimer = null;
    }
}

async function updatePipelineStatus() {
    try {
        const resp = await fetch('/api/pipeline/status');
        const s = await resp.json();

        // 更新狀態指示
        const dot = document.getElementById('pipeline-dot');
        const statusText = document.getElementById('pipeline-status-text');
        dot.className = 'status-dot ' + s.status;

        if (s.status === 'running') {
            statusText.textContent = s.step || '執行中...';
            document.getElementById('pipeline-start-btn').style.display = 'none';
            document.getElementById('pipeline-once-btn').style.display = 'none';
            document.getElementById('pipeline-stop-btn').style.display = 'inline-block';
        } else if (s.status === 'error') {
            statusText.textContent = '錯誤: ' + (s.error || '未知');
            document.getElementById('pipeline-start-btn').style.display = 'inline-block';
            document.getElementById('pipeline-once-btn').style.display = 'inline-block';
            document.getElementById('pipeline-stop-btn').style.display = 'none';
        } else {
            statusText.textContent = s.step || '閒置中';
            document.getElementById('pipeline-start-btn').style.display = 'inline-block';
            document.getElementById('pipeline-once-btn').style.display = 'inline-block';
            document.getElementById('pipeline-stop-btn').style.display = 'none';
        }

        // 更新資訊卡
        document.getElementById('pipeline-topic').textContent = s.topic || '-';
        document.getElementById('pipeline-runs').textContent = s.runs_completed || '0';
        document.getElementById('pipeline-last').textContent = s.last_run ? s.last_run.split(' ')[1] : '-';
        document.getElementById('pipeline-next').textContent = s.next_run ? s.next_run.split(' ')[1] : '-';

        // 更新階段指示
        const stages = ['topic', 'html', 'render', 'caption', 'publish'];
        const currentStage = s.current_stage;
        let passedCurrent = false;

        stages.forEach((stage, i) => {
            const icon = document.getElementById('stage-icon-' + stage);
            const status = document.getElementById('stage-status-' + stage);

            if (stage === currentStage) {
                icon.className = 'stage-icon active';
                status.textContent = '進行中...';
                passedCurrent = true;
            } else if (!passedCurrent && currentStage) {
                icon.className = 'stage-icon done';
                status.textContent = '完成';
            } else {
                icon.className = 'stage-icon';
                status.textContent = '等待中';
            }
        });

        // 更新日誌
        if (s.log && s.log.length > 0) {
            const logEl = document.getElementById('pipeline-log');
            logEl.innerHTML = s.log.map(entry => {
                let cls = 'log-entry';
                if (entry.includes('[ERROR]')) cls += ' error';
                else if (entry.includes('✅') || entry.includes('完成')) cls += ' success';
                return `<div class="${cls}">${entry}</div>`;
            }).join('');
            logEl.scrollTop = logEl.scrollHeight;
        }

    } catch (e) {
        console.error('Pipeline status error:', e);
    }
}

async function startPipeline() {
    const interval = document.getElementById('pipeline-interval').value;
    document.getElementById('pipeline-start-btn').disabled = true;

    try {
        const resp = await fetch('/api/pipeline/start', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ interval: parseInt(interval), mode: 'loop' })
        });
        const data = await resp.json();
        if (!data.success) {
            alert('啟動失敗: ' + data.error);
        }
    } catch (e) {
        alert('啟動錯誤: ' + e.message);
    }

    document.getElementById('pipeline-start-btn').disabled = false;
}

async function runPipelineOnce() {
    document.getElementById('pipeline-once-btn').disabled = true;

    try {
        const resp = await fetch('/api/pipeline/start', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ mode: 'once' })
        });
        const data = await resp.json();
        if (!data.success) {
            alert('啟動失敗: ' + data.error);
        }
    } catch (e) {
        alert('啟動錯誤: ' + e.message);
    }

    document.getElementById('pipeline-once-btn').disabled = false;
}

async function stopPipeline() {
    document.getElementById('pipeline-stop-btn').disabled = true;

    try {
        const resp = await fetch('/api/pipeline/stop', { method: 'POST' });
        const data = await resp.json();
        if (!data.success) {
            alert('停止失敗: ' + data.error);
        }
    } catch (e) {
        alert('停止錯誤: ' + e.message);
    }

    document.getElementById('pipeline-stop-btn').disabled = false;
}

// ===== Threads 子分頁切換 =====
function switchThreadsSubtab(subtab) {
    currentThreadsSubtab = subtab;
    document.querySelectorAll('.threads-subtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.threads-subtab')[subtab === 'manage' ? 0 : 1].classList.add('active');

    document.getElementById('threads-manage-section').classList.remove('active');
    document.getElementById('threads-library-section').classList.remove('active');

    if (subtab === 'manage') {
        document.getElementById('threads-manage-section').classList.add('active');
    } else {
        document.getElementById('threads-library-section').classList.add('active');
        updateLibAccountSelect();
    }
}

// ===== Threads 發文 =====
async function loadThreadsAccounts() {
    try {
        const resp = await fetch('/api/threads/accounts');
        const data = await resp.json();
        const list = document.getElementById('threads-list');

        if (data.accounts.length === 0) {
            list.innerHTML = '<div style="padding:12px;color:#555;font-size:13px;">尚未新增帳號</div>';
            return;
        }

        list.innerHTML = data.accounts.map((acc, i) => {
            const status = acc.enabled ? '✅' : '❌';
            return `<div class="threads-item ${currentThreadsAccount === i ? 'active' : ''}" onclick="selectThreadsAccount(${i})">
                <span class="t-status">${status}</span>
                <span class="t-name">${acc.name}</span>
                <span class="t-time">${acc.last_post}</span>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Load threads accounts error:', e);
    }
}

async function selectThreadsAccount(idx) {
    currentThreadsAccount = idx;

    document.querySelectorAll('.threads-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
    });

    try {
        const resp = await fetch('/api/threads/account/' + idx);
        const data = await resp.json();
        if (data.success) {
            const acc = data.account;
            document.getElementById('t-name').value = acc.name || '';
            document.getElementById('t-enabled').checked = acc.enabled !== false;
            document.getElementById('t-gemini-key').value = acc.gemini_api_key || '';
            document.getElementById('t-threads-token').value = acc.threads_access_token || '';
            document.getElementById('t-threads-userid').value = acc.threads_user_id || '';
            document.getElementById('t-schedule').value = acc.schedule_times || '09:00, 18:00';
            document.getElementById('t-prompt').value = acc.system_prompt || '';
        }
    } catch (e) {
        console.error('Select threads account error:', e);
    }
}

async function addThreadsAccount() {
    try {
        const resp = await fetch('/api/threads/account', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: '新帳號 ' + (Date.now() % 1000),
                enabled: true,
                system_prompt: `你是一位專業的社群媒體寫手。

## 寫作風格：
- 一句一行，短句斷行，節奏明快
- 直接犀利，不繞彎
- 帶點個人觀點，有溫度

## 格式規則：
- 每篇約 150-350 字
- 不使用 Markdown 格式
- 句子之間有清楚的空行

請直接輸出貼文內容，不要有任何前言或說明。`
            })
        });
        const data = await resp.json();
        if (data.success) {
            await loadThreadsAccounts();
            selectThreadsAccount(data.index);
        }
    } catch (e) {
        alert('新增失敗: ' + e.message);
    }
}

async function deleteThreadsAccount() {
    if (currentThreadsAccount < 0) {
        alert('請先選擇要刪除的帳號');
        return;
    }

    if (!confirm('確定要刪除此帳號嗎？')) return;

    try {
        const resp = await fetch('/api/threads/account/' + currentThreadsAccount, { method: 'DELETE' });
        const data = await resp.json();
        if (data.success) {
            currentThreadsAccount = -1;
            await loadThreadsAccounts();
            clearThreadsForm();
        }
    } catch (e) {
        alert('刪除失敗: ' + e.message);
    }
}

function clearThreadsForm() {
    document.getElementById('t-name').value = '';
    document.getElementById('t-enabled').checked = true;
    document.getElementById('t-gemini-key').value = '';
    document.getElementById('t-threads-token').value = '';
    document.getElementById('t-threads-userid').value = '';
    document.getElementById('t-schedule').value = '09:00, 18:00';
    document.getElementById('t-prompt').value = '';
    document.getElementById('t-preview-box').style.display = 'none';
}

async function saveThreadsAccount() {
    try {
        const resp = await fetch('/api/threads/account', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                index: currentThreadsAccount,
                name: document.getElementById('t-name').value,
                enabled: document.getElementById('t-enabled').checked,
                gemini_api_key: document.getElementById('t-gemini-key').value,
                threads_access_token: document.getElementById('t-threads-token').value,
                threads_user_id: document.getElementById('t-threads-userid').value,
                schedule_times: document.getElementById('t-schedule').value,
                system_prompt: document.getElementById('t-prompt').value,
            })
        });
        const data = await resp.json();
        if (data.success) {
            alert('設定已儲存！');
            currentThreadsAccount = data.index;
            await loadThreadsAccounts();
        } else {
            alert('儲存失敗: ' + data.error);
        }
    } catch (e) {
        alert('儲存失敗: ' + e.message);
    }
}

async function previewThreadsPost() {
    const geminiKey = document.getElementById('t-gemini-key').value;
    const prompt = document.getElementById('t-prompt').value;
    const topic = document.getElementById('t-topic').value;

    if (!geminiKey) { alert('請先填入 Gemini API Key'); return; }
    if (!prompt) { alert('請先填入 System Prompt'); return; }

    const btn = document.getElementById('t-preview-btn');
    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
        const resp = await fetch('/api/threads/preview', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ gemini_api_key: geminiKey, system_prompt: prompt, topic: topic })
        });
        const data = await resp.json();

        const box = document.getElementById('t-preview-box');
        if (data.success) {
            box.textContent = data.content;
            box.style.display = 'block';
        } else {
            box.textContent = '生成失敗: ' + data.error;
            box.style.display = 'block';
            box.style.color = '#f44747';
        }
    } catch (e) {
        alert('預覽失敗: ' + e.message);
    }

    btn.disabled = false;
    btn.textContent = '👁️ 預覽貼文';
}

async function postToThreads() {
    if (currentThreadsAccount < 0) { alert('請先選擇帳號'); return; }

    const topic = document.getElementById('t-topic').value;
    const previewBox = document.getElementById('t-preview-box');
    const content = previewBox.style.display !== 'none' ? previewBox.textContent : '';

    if (!confirm('確定要發布貼文嗎？')) return;

    const btn = document.getElementById('t-post-btn');
    btn.disabled = true;
    btn.textContent = '發布中...';

    const statusBox = document.getElementById('t-status-box');
    statusBox.style.display = 'block';
    statusBox.style.background = '#1e1e1e';
    statusBox.style.color = '#888';
    statusBox.textContent = '準備中...';

    try {
        const resp = await fetch('/api/threads/post', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ account_index: currentThreadsAccount, content: content, topic: topic })
        });
        const data = await resp.json();

        if (data.success) {
            // 開始輪詢狀態
            pollThreadsStatus();
        } else {
            statusBox.style.background = '#3a1a1a';
            statusBox.style.color = '#f44747';
            statusBox.textContent = '發布失敗: ' + data.error;
            btn.disabled = false;
            btn.textContent = '📤 直接發文';
        }
    } catch (e) {
        statusBox.style.background = '#3a1a1a';
        statusBox.style.color = '#f44747';
        statusBox.textContent = '發布失敗: ' + e.message;
        btn.disabled = false;
        btn.textContent = '📤 直接發文';
    }
}

async function pollThreadsStatus() {
    const statusBox = document.getElementById('t-status-box');
    const btn = document.getElementById('t-post-btn');

    try {
        const resp = await fetch('/api/threads/status');
        const s = await resp.json();

        statusBox.textContent = s.step || '處理中...';

        if (s.status === 'done') {
            statusBox.style.background = '#1a3a2a';
            statusBox.style.color = '#4ec9b0';
            btn.disabled = false;
            btn.textContent = '📤 直接發文';
            document.getElementById('t-preview-box').style.display = 'none';
            await loadThreadsAccounts();
            fetch('/api/threads/reset', { method: 'POST' });
        } else if (s.status === 'error') {
            statusBox.style.background = '#3a1a1a';
            statusBox.style.color = '#f44747';
            statusBox.textContent = '發布失敗: ' + (s.error || '未知錯誤');
            btn.disabled = false;
            btn.textContent = '📤 直接發文';
            fetch('/api/threads/reset', { method: 'POST' });
        } else {
            setTimeout(pollThreadsStatus, 1500);
        }
    } catch (e) {
        statusBox.textContent = '狀態查詢失敗';
        btn.disabled = false;
        btn.textContent = '📤 直接發文';
    }
}

// ===== 文案庫功能 =====

// 載入發文紀錄
async function loadPostLogs() {
    try {
        const resp = await fetch('/api/post-logs?limit=10');
        const data = await resp.json();

        // 更新統計
        document.getElementById('log-success-count').textContent = data.success_count || 0;
        document.getElementById('log-error-count').textContent = data.error_count || 0;

        const container = document.getElementById('post-logs-list');
        if (!data.logs || data.logs.length === 0) {
            container.innerHTML = '<div style="color:#666; font-size:11px; text-align:center; padding:10px;">暫無紀錄</div>';
            return;
        }

        container.innerHTML = data.logs.map(log => `
            <div class="post-log-item ${log.status}">
                <div class="log-time">${log.time}</div>
                <div class="log-account">${log.account} <span style="color:#666;">[${log.type}]</span></div>
                <div class="log-message">${log.message}</div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Load post logs error:', e);
    }
}

// 儀表板：載入所有帳號概覽
async function loadAccountsDashboard() {
    const container = document.getElementById('dashboard-accounts');
    if (!container) return;

    try {
        const resp = await fetch('/api/threads/accounts');
        const data = await resp.json();

        if (!data.accounts || data.accounts.length === 0) {
            container.innerHTML = '<div style="color:#666; font-size:12px; text-align:center; padding:20px;">尚無帳號</div>';
            return;
        }

        // 取得所有帳號的文案庫數據
        const accountsData = await Promise.all(data.accounts.map(async (acc) => {
            try {
                const libResp = await fetch('/api/library/' + encodeURIComponent(acc.name));
                const libData = await libResp.json();
                return {
                    name: acc.name,
                    enabled: acc.scheduler_enabled !== false,
                    pending: libData.stats?.pending || 0,
                    published: libData.stats?.published || 0,
                    total: libData.stats?.total || 0,
                    dailyRequired: libData.schedule?.daily_required || 0,
                    daysAvailable: libData.schedule?.days_available || 0
                };
            } catch (e) {
                return { name: acc.name, enabled: false, pending: 0, published: 0, total: 0, dailyRequired: 0, daysAvailable: 0 };
            }
        }));

        // 渲染帳號卡片
        const currentAccount = document.getElementById('lib-account-select')?.value || '';
        container.innerHTML = accountsData.map(acc => {
            const isActive = acc.name === currentAccount;
            const ratePercent = acc.dailyRequired > 0 ? Math.min(100, (acc.pending / (acc.dailyRequired * 7)) * 100) : 100;
            const rateClass = ratePercent >= 70 ? 'good' : (ratePercent >= 30 ? 'warning' : 'danger');

            return `
                <div class="account-card ${isActive ? 'active' : ''} ${!acc.enabled ? 'disabled' : ''}" onclick="selectDashboardAccount('${acc.name}')">
                    <div class="account-name">
                        <span class="status-dot ${acc.enabled ? 'on' : 'off'}"></span>
                        ${acc.name}
                    </div>
                    <div class="account-stats">
                        <span class="pending">待發 ${acc.pending}</span>
                        <span class="published">已發 ${acc.published}</span>
                    </div>
                    <div class="account-rate">
                        ${acc.dailyRequired > 0 ? `每日 ${acc.dailyRequired} 篇 · 可維持 ${acc.daysAvailable} 天` : '未設定排程'}
                        <div class="rate-bar">
                            <div class="rate-fill ${rateClass}" style="width: ${ratePercent}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Load accounts dashboard error:', e);
        container.innerHTML = '<div style="color:#f44; font-size:12px; text-align:center; padding:20px;">載入失敗</div>';
    }
}

// 從儀表板選擇帳號
function selectDashboardAccount(accountName) {
    const select = document.getElementById('lib-account-select');
    if (select) {
        select.value = accountName;
        loadLibrary();
    }
}

async function updateLibAccountSelect() {
    try {
        const resp = await fetch('/api/threads/accounts');
        const data = await resp.json();
        const select = document.getElementById('lib-account-select');
        select.innerHTML = '<option value="">-- 選擇帳號 --</option>';
        data.accounts.forEach(acc => {
            select.innerHTML += `<option value="${acc.name}">${acc.name}</option>`;
        });
        // 同時載入儀表板和發文紀錄
        loadAccountsDashboard();
        loadPostLogs();
    } catch (e) {
        console.error('Update lib account select error:', e);
    }
}

async function loadLibrary() {
    const accountName = document.getElementById('lib-account-select').value;
    const scheduleDiv = document.getElementById('lib-schedule');

    if (!accountName) {
        document.getElementById('lib-account-name').textContent = '選擇帳號';
        document.getElementById('lib-table-body').innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#555;">請先選擇帳號</td></tr>';
        document.getElementById('lib-pending').textContent = '0';
        document.getElementById('lib-published').textContent = '0';
        document.getElementById('lib-total').textContent = '0';
        document.getElementById('lib-warning').style.display = 'none';
        scheduleDiv.style.display = 'none';
        return;
    }

    document.getElementById('lib-account-name').textContent = accountName;

    // 更新儀表板的 active 狀態
    document.querySelectorAll('.account-card').forEach(card => {
        card.classList.toggle('active', card.querySelector('.account-name')?.textContent.trim().includes(accountName));
    });

    try {
        const resp = await fetch('/api/library/' + encodeURIComponent(accountName));
        const data = await resp.json();

        if (data.success) {
            document.getElementById('lib-pending').textContent = data.stats.pending;
            document.getElementById('lib-published').textContent = data.stats.published;
            document.getElementById('lib-total').textContent = data.stats.total;

            // 顯示警告
            document.getElementById('lib-warning').style.display = data.stats.pending <= 5 ? 'block' : 'none';

            // 顯示排程資訊
            if (data.schedule) {
                scheduleDiv.style.display = 'block';
                document.getElementById('lib-daily-required').textContent = data.schedule.daily_required || 0;
                document.getElementById('lib-schedule-times').textContent = data.schedule.schedule_times?.join(', ') || '-';
                document.getElementById('lib-next-post').textContent = data.schedule.next_post_time || '-';
                document.getElementById('lib-days-available').innerHTML = '可維持 <strong style="color:#4ec9b0;">' + (data.schedule.days_available || 0) + '</strong> 天';

                const statusEl = document.getElementById('lib-scheduler-status');
                if (data.schedule.scheduler_running) {
                    statusEl.style.background = '#1a3a2a';
                    statusEl.style.color = '#4ec9b0';
                    statusEl.textContent = '自動發文中';
                } else {
                    statusEl.style.background = '#3a3a3a';
                    statusEl.style.color = '#888';
                    statusEl.textContent = '排程已停止';
                }
            } else {
                scheduleDiv.style.display = 'none';
            }

            const tbody = document.getElementById('lib-table-body');
            if (data.posts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#555;">文案庫為空，請批量生成或新增單篇</td></tr>';
            } else {
                tbody.innerHTML = data.posts.map((post, i) => {
                    const preview = post.content.substring(0, 80).replace(/\n/g, ' ') + (post.content.length > 80 ? '...' : '');
                    const statusClass = post.status === 'pending' ? 'status-pending' : 'status-published';
                    const statusText = post.status === 'pending' ? '⏳待發' : '✅已發';
                    const selected = selectedLibPost === post.id ? 'selected' : '';
                    return `<tr class="${selected}" data-id="${post.id}" onclick="selectLibPost('${post.id}')">
                        <td class="col-order">${i + 1}</td>
                        <td class="col-preview"><div class="preview-text" ondblclick="editLibPost('${post.id}')">${escapeHtml(preview)}</div></td>
                        <td class="col-status"><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td class="col-actions">
                            <button class="btn-small btn-edit" onclick="event.stopPropagation(); editLibPost('${post.id}')">編輯</button>
                            <button class="btn-small btn-del" onclick="event.stopPropagation(); deleteLibPost('${post.id}')">刪</button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }
    } catch (e) {
        console.error('Load library error:', e);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectLibPost(postId) {
    selectedLibPost = selectedLibPost === postId ? null : postId;
    document.querySelectorAll('.library-table tbody tr').forEach(tr => {
        tr.classList.toggle('selected', tr.dataset.id === selectedLibPost);
    });
}

async function moveLibPost(direction) {
    if (!selectedLibPost) {
        alert('請先選擇一篇文案');
        return;
    }
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) return;

    try {
        await fetch(`/api/library/${encodeURIComponent(accountName)}/post/${selectedLibPost}/move`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ direction })
        });
        await loadLibrary();
    } catch (e) {
        console.error('Move post error:', e);
    }
}

async function addSinglePost() {
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) {
        alert('請先選擇帳號');
        return;
    }
    editingPostId = null;
    document.getElementById('edit-content').value = '';
    document.getElementById('edit-char-count').textContent = '0';
    document.getElementById('edit-modal').classList.add('active');
}

function editLibPost(postId) {
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) return;

    fetch(`/api/library/${encodeURIComponent(accountName)}`)
        .then(r => r.json())
        .then(data => {
            const post = data.posts.find(p => p.id === postId);
            if (post) {
                editingPostId = postId;
                document.getElementById('edit-content').value = post.content;
                document.getElementById('edit-char-count').textContent = post.content.length;
                document.getElementById('edit-modal').classList.add('active');
            }
        });
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingPostId = null;
}

document.getElementById('edit-content').addEventListener('input', function() {
    document.getElementById('edit-char-count').textContent = this.value.length;
});

async function saveEditPost() {
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) return;

    const content = document.getElementById('edit-content').value.trim();
    if (!content) {
        alert('內容不能為空');
        return;
    }

    try {
        if (editingPostId) {
            // 更新
            await fetch(`/api/library/${encodeURIComponent(accountName)}/post/${editingPostId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ content })
            });
        } else {
            // 新增
            await fetch(`/api/library/${encodeURIComponent(accountName)}/post`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ content })
            });
        }
        closeEditModal();
        await loadLibrary();
    } catch (e) {
        console.error('Save post error:', e);
        alert('儲存失敗');
    }
}

async function deleteLibPost(postId) {
    if (!confirm('確定要刪除這篇文案嗎？')) return;

    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) return;

    try {
        await fetch(`/api/library/${encodeURIComponent(accountName)}/post/${postId}`, {
            method: 'DELETE'
        });
        if (selectedLibPost === postId) selectedLibPost = null;
        await loadLibrary();
    } catch (e) {
        console.error('Delete post error:', e);
    }
}

async function deleteSelectedPost() {
    if (!selectedLibPost) {
        alert('請先選擇一篇文案');
        return;
    }
    await deleteLibPost(selectedLibPost);
}

async function clearPublished() {
    if (!confirm('確定要清空所有已發布的文案嗎？')) return;

    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) return;

    try {
        await fetch(`/api/library/${encodeURIComponent(accountName)}/clear-published`, {
            method: 'POST'
        });
        await loadLibrary();
    } catch (e) {
        console.error('Clear published error:', e);
    }
}

async function batchGenerate() {
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) {
        alert('請先選擇帳號');
        return;
    }

    const count = document.getElementById('lib-batch-count').value;
    const btn = document.getElementById('lib-batch-btn');
    const statusDiv = document.getElementById('lib-batch-status');

    btn.disabled = true;
    btn.textContent = '生成中...';
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#1e1e1e';
    statusDiv.style.color = '#888';
    statusDiv.textContent = '正在呼叫 Gemini API...';

    try {
        await fetch(`/api/library/${encodeURIComponent(accountName)}/batch-generate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ count: parseInt(count) })
        });
        pollBatchStatus();
    } catch (e) {
        statusDiv.style.color = '#f44747';
        statusDiv.textContent = '啟動失敗: ' + e.message;
        btn.disabled = false;
        btn.textContent = '🚀 批量生成';
    }
}

async function pollBatchStatus() {
    const btn = document.getElementById('lib-batch-btn');
    const statusDiv = document.getElementById('lib-batch-status');

    try {
        const resp = await fetch('/api/library/batch-status');
        const s = await resp.json();

        statusDiv.textContent = s.step || '處理中...';

        if (s.status === 'done') {
            statusDiv.style.background = '#1a3a2a';
            statusDiv.style.color = '#4ec9b0';
            statusDiv.textContent = `✅ ${s.step}`;
            btn.disabled = false;
            btn.textContent = '🚀 批量生成';
            await fetch('/api/library/batch-reset', { method: 'POST' });
            await loadLibrary();
        } else if (s.status === 'error') {
            statusDiv.style.background = '#3a1a1a';
            statusDiv.style.color = '#f44747';
            statusDiv.textContent = '❌ ' + (s.error || '生成失敗');
            btn.disabled = false;
            btn.textContent = '🚀 批量生成';
            await fetch('/api/library/batch-reset', { method: 'POST' });
        } else {
            batchPollTimer = setTimeout(pollBatchStatus, 2000);
        }
    } catch (e) {
        statusDiv.style.color = '#f44747';
        statusDiv.textContent = '狀態查詢失敗';
        btn.disabled = false;
        btn.textContent = '🚀 批量生成';
    }
}

// ===== 手動導入文案 =====
function toggleImportHint() {
    const hint = document.getElementById('import-hint');
    const toggle = document.querySelector('.toggle-hint');
    hint.classList.toggle('show');
    toggle.textContent = hint.classList.contains('show') ? '收起說明 ▲' : '查看格式說明 ▼';
}

// 監聽輸入框變化，即時計算文案數量
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('import-content');
    if (textarea) {
        textarea.addEventListener('input', updateImportCount);
    }
});

function updateImportCount() {
    const content = document.getElementById('import-content').value;
    const countSpan = document.getElementById('import-count');

    if (!content.trim()) {
        countSpan.textContent = '偵測到 0 篇文案';
        return;
    }

    // 支援多種分隔符：---、—-、——、--（獨立一行）
    const posts = content.split(/\n[-—]{2,}\n|\n[-—]{2,}$|^[-—]{2,}\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    countSpan.textContent = `偵測到 ${posts.length} 篇文案`;
}

async function importPosts() {
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) {
        alert('請先選擇帳號');
        return;
    }

    const content = document.getElementById('import-content').value;
    if (!content.trim()) {
        alert('請輸入要導入的文案');
        return;
    }

    // 支援多種分隔符：---、—-、——、--（獨立一行）
    const posts = content.split(/\n[-—]{2,}\n|\n[-—]{2,}$|^[-—]{2,}\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    if (posts.length === 0) {
        alert('未偵測到有效的文案，請檢查格式');
        return;
    }

    const btn = document.getElementById('import-btn');
    const statusDiv = document.getElementById('import-status');

    btn.disabled = true;
    btn.textContent = '導入中...';

    try {
        const resp = await fetch(`/api/library/${encodeURIComponent(accountName)}/import`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ posts: posts })
        });
        const data = await resp.json();

        if (data.success) {
            statusDiv.className = 'library-import-status success';
            statusDiv.textContent = `✅ 成功導入 ${data.count} 篇文案`;
            document.getElementById('import-content').value = '';
            updateImportCount();
            await loadLibrary();
            await loadAccountsDashboard();  // 同時更新儀表板
        } else {
            statusDiv.className = 'library-import-status error';
            statusDiv.textContent = '❌ ' + (data.error || '導入失敗');
        }
    } catch (e) {
        statusDiv.className = 'library-import-status error';
        statusDiv.textContent = '❌ 導入失敗: ' + e.message;
    }

    btn.disabled = false;
    btn.textContent = '📥 導入文案';

    setTimeout(() => { statusDiv.className = 'library-import-status'; }, 5000);
}

async function postFromLibrary() {
    const accountName = document.getElementById('lib-account-select').value;
    if (!accountName) {
        alert('請先選擇帳號');
        return;
    }

    const statusBox = document.getElementById('t-status-box');
    statusBox.style.display = 'block';
    statusBox.style.background = '#1e3a5f';
    statusBox.style.color = '#7ecbf5';
    statusBox.textContent = '正在發布...';

    try {
        const resp = await fetch(`/api/library/${encodeURIComponent(accountName)}/post-from-library`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        const data = await resp.json();

        if (data.success) {
            pollLibPostStatus();
        } else {
            statusBox.style.background = '#3a1a1a';
            statusBox.style.color = '#f44747';
            statusBox.textContent = '❌ ' + (data.error || '發布失敗');
        }
    } catch (e) {
        statusBox.style.background = '#3a1a1a';
        statusBox.style.color = '#f44747';
        statusBox.textContent = '❌ 請求失敗';
    }
}

async function pollLibPostStatus() {
    const statusBox = document.getElementById('t-status-box');

    try {
        const resp = await fetch('/api/threads/status');
        const s = await resp.json();

        statusBox.textContent = s.step || '處理中...';

        if (s.status === 'done') {
            statusBox.style.background = '#1a3a2a';
            statusBox.style.color = '#4ec9b0';
            await fetch('/api/threads/reset', { method: 'POST' });
            await loadLibrary();
        } else if (s.status === 'error') {
            statusBox.style.background = '#3a1a1a';
            statusBox.style.color = '#f44747';
            statusBox.textContent = '❌ ' + (s.error || '發布失敗');
            await fetch('/api/threads/reset', { method: 'POST' });
        } else {
            setTimeout(pollLibPostStatus, 1500);
        }
    } catch (e) {
        statusBox.style.color = '#f44747';
        statusBox.textContent = '狀態查詢失敗';
    }
}

// ===== 設定頁面 =====
let currentSettingsTab = 'api';
let currentAiModel = 'gemini';

function switchSettingsTab(tab) {
    currentSettingsTab = tab;
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));

    if (tab === 'api') {
        document.querySelector('.settings-tab:nth-child(1)').classList.add('active');
        document.getElementById('settings-api-panel').classList.add('active');
    } else {
        document.querySelector('.settings-tab:nth-child(2)').classList.add('active');
        document.getElementById('settings-spec-panel').classList.add('active');
        loadSpecContent();
    }
}

function selectModel(model) {
    currentAiModel = model;
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.model === model);
    });
}

async function loadSettings() {
    try {
        const resp = await fetch('/api/settings');
        const data = await resp.json();
        if (data.success) {
            const s = data.settings;
            document.getElementById('settings-gemini-key').value = s.gemini_api_key ? '********' : '';
            document.getElementById('settings-anthropic-key').value = s.anthropic_api_key ? '********' : '';

            currentAiModel = s.ai_model || 'gemini';
            selectModel(currentAiModel);

            // 顯示 Key 狀態
            const geminiStatus = document.getElementById('gemini-key-status');
            const anthropicStatus = document.getElementById('anthropic-key-status');
            if (s.gemini_api_key) {
                geminiStatus.textContent = '✓ 已設定';
                geminiStatus.className = 'api-key-status valid';
            } else {
                geminiStatus.textContent = '未設定';
                geminiStatus.className = 'api-key-status invalid';
            }
            if (s.anthropic_api_key) {
                anthropicStatus.textContent = '✓ 已設定';
                anthropicStatus.className = 'api-key-status valid';
            } else {
                anthropicStatus.textContent = '未設定';
                anthropicStatus.className = 'api-key-status invalid';
            }
        }
    } catch (e) {
        console.error('載入設定失敗:', e);
    }
}

async function saveApiSettings() {
    const geminiKey = document.getElementById('settings-gemini-key').value.trim();
    const anthropicKey = document.getElementById('settings-anthropic-key').value.trim();
    const statusEl = document.getElementById('api-settings-status');

    const payload = { ai_model: currentAiModel };
    if (geminiKey && !geminiKey.includes('*')) payload.gemini_api_key = geminiKey;
    if (anthropicKey && !anthropicKey.includes('*')) payload.anthropic_api_key = anthropicKey;

    try {
        const resp = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data.success) {
            statusEl.textContent = '✓ 設定已儲存';
            statusEl.className = 'settings-status success';
            loadSettings();
        } else {
            statusEl.textContent = '✗ ' + (data.error || '儲存失敗');
            statusEl.className = 'settings-status error';
        }
    } catch (e) {
        statusEl.textContent = '✗ 儲存失敗: ' + e.message;
        statusEl.className = 'settings-status error';
    }
    setTimeout(() => { statusEl.className = 'settings-status'; }, 3000);
}

async function loadSpecContent() {
    try {
        const resp = await fetch('/api/settings/spec');
        const data = await resp.json();
        if (data.success) {
            document.getElementById('settings-spec-content').value = data.content;
        }
    } catch (e) {
        console.error('載入規格書失敗:', e);
    }
}

async function reloadSpecContent() {
    await loadSpecContent();
    const statusEl = document.getElementById('spec-settings-status');
    statusEl.textContent = '✓ 已重新載入';
    statusEl.className = 'settings-status success';
    setTimeout(() => { statusEl.className = 'settings-status'; }, 2000);
}

async function saveSpecContent() {
    const content = document.getElementById('settings-spec-content').value;
    const statusEl = document.getElementById('spec-settings-status');

    try {
        const resp = await fetch('/api/settings/spec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const data = await resp.json();
        if (data.success) {
            statusEl.textContent = '✓ 規格書已儲存';
            statusEl.className = 'settings-status success';
        } else {
            statusEl.textContent = '✗ ' + (data.error || '儲存失敗');
            statusEl.className = 'settings-status error';
        }
    } catch (e) {
        statusEl.textContent = '✗ 儲存失敗: ' + e.message;
        statusEl.className = 'settings-status error';
    }
    setTimeout(() => { statusEl.className = 'settings-status'; }, 3000);
}

// ===== 初始化 =====
loadVideos();
</script>
</body>
</html>
"""


# ===== 啟動 =====
if __name__ == "__main__":
    setup_logging()

    progress_handler = ProgressHandler()
    progress_handler.setLevel(logging.INFO)
    logger.addHandler(progress_handler)

    # 自動啟動排程器
    start_scheduler()      # Threads 文案庫排程器
    start_ig_scheduler()   # IG 影片排程器

    print("=" * 50)
    print("  IG Reels 管理中心")
    print("  http://localhost:5000")
    print("  [Threads 排程器] 已自動啟動")
    print("  [IG 排程器] 已自動啟動")
    print("=" * 50)

    app.run(host="0.0.0.0", port=5000, debug=False)
