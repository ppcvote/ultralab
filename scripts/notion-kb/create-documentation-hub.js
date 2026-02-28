// Script to create Documentation Hub pages in Notion
import { Client } from '@notionhq/client'
import 'dotenv/config'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

if (!NOTION_API_KEY || !NOTION_PARENT_PAGE_ID) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NOTION_API_KEY, NOTION_PARENT_PAGE_ID')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Documentation pages content (bilingual)
const documentationPages = [
  {
    title: '🚀 Onboarding Guide | 新手入門指南',
    emoji: '🚀',
    content: [
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: 'Welcome to Ultra Creation! | 歡迎加入傲創！' } }],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'This guide will help you understand our ecosystem in 30 minutes or less. 本指南將幫助你在 30 分鐘內理解我們的整個生態系統。',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📦 Our Products | 我們的產品' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Ultra Lab - 技術服務品牌 (ultralab.tw) | Tech services brand providing 5 core services',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Ultra Advisor - 財務規劃 SaaS (18 tools, 67 blog posts) | Financial planning SaaS platform',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Mind Threads - Threads 自動化 SaaS (NT$1,990/month) | Threads automation SaaS',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'UltraProbe - AI 安全掃描工具 (integrated in Ultra Lab) | AI security scanning tool',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'MinYi Personal Brand - MDRT 財務顧問個人頁面 (integrated in Ultra Lab) | MDRT advisor personal page',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '🔧 Tech Stack Overview | 技術棧概覽' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: 'Frontend: React 18 + TypeScript + Vite' } },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Styling: Tailwind CSS v4 (Ultra Lab), v3 (Ultra Advisor)' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: 'Backend: Firebase Firestore + Cloud Functions' } },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Deployment: Vercel Serverless' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'AI: Gemini 2.5 Flash (primary)' } }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📚 Key Resources | 重要資源' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Products Database - 查看所有產品的詳細資訊 | View all product details' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'ADR Database - 必讀 Critical ADRs | Must-read Critical ADRs' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Tech Stack Registry - 所有技術依賴 | All technology dependencies',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Brand Guidelines - 品牌設計規範 | Brand design standards' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '🎯 Your First Week | 第一週任務' } }],
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Day 1: Read this Onboarding Guide (30 min) | 閱讀本指南' },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Day 2: Set up local environment (see Deployment Checklist) | 設定本地環境' },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            { type: 'text', text: { content: 'Day 3: Read all Critical ADRs | 閱讀所有 Critical ADRs' } },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Day 4-5: Deep dive into 1 product codebase | 深入了解一個產品的程式碼' },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '🆘 Need Help? | 需要協助？' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Check Troubleshooting Guides | 查看故障排除指南' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Search AI Query Templates for common questions | 搜尋 AI 查詢範本' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: 'Ask tech lead for urgent issues | 聯繫技術負責人' } },
          ],
        },
      },
    ],
  },
  {
    title: '🚀 Deployment Checklists | 部署檢查清單',
    emoji: '🚀',
    content: [
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Deployment Checklists | 部署檢查清單' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Ultra Lab Deployment | Ultra Lab 部署' } }],
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Clone repo: C:\\Users\\User\\UltraLab | 複製 repo：C:\\Users\\User\\UltraLab',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'npm install | 安裝依賴' } }],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            { type: 'text', text: { content: 'Copy .env.example to .env | 複製環境變數範本' } },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Fill in Firebase credentials in .env | 填寫 Firebase 憑證（從 Firebase Console 取得）',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Fill in Notion API key in .env | 填寫 Notion API key（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）',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            { type: 'text', text: { content: 'npm run dev to test locally | 本地測試' } },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'vercel (login with ppcvotes account) | 登入 Vercel（ppcvotes 帳號）',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'vercel env add (use printf, not echo!) | 設定環境變數（必須用 printf）',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'vercel --prod | 部署到 production' } }],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Ultra Advisor Deployment | Ultra Advisor 部署' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Clone repo: C:\\Users\\User\\financial-planner | 複製 repo：C:\\Users\\User\\financial-planner',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'npm install | 安裝依賴' } }],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            { type: 'text', text: { content: 'Copy .env.example to .env | 複製環境變數範本' } },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Fill in Firebase credentials (same project: ultra-lab-tw) | 填寫 Firebase 憑證（與 Ultra Lab 共用專案）',
              },
            },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [
            { type: 'text', text: { content: 'npm run dev to test locally | 本地測試' } },
          ],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: 'vercel --prod | 部署到 production' } }],
          checked: false,
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: '⚠️ Critical: Windows Bash Path Fix | Windows Bash 路徑修正' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '在 Git Bash on Windows，必須使用正斜線：/c/Users/User/UltraLab（不是 c:\\Users\\User\\UltraLab）。否則 Vercel CLI 會上傳 0 個檔案！In Git Bash on Windows, MUST use forward slashes: /c/Users/User/UltraLab (not c:\\Users\\User\\UltraLab). Otherwise Vercel CLI uploads 0 files!',
              },
            },
          ],
          icon: { type: 'emoji', emoji: '⚠️' },
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: '⚠️ Critical: printf vs echo for env vars | 環境變數必須用 printf' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '永遠使用 printf（不加 newline）而非 echo 來設定 env vars。echo 會加上 trailing newline，導致 Firebase Admin gRPC error！Always use printf (no newline) instead of echo for env vars. echo adds trailing newline, causing Firebase Admin gRPC error!',
              },
            },
          ],
          icon: { type: 'emoji', emoji: '🔴' },
        },
      },
      {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '# WRONG ❌\necho "ultra-lab-tw" | vercel env add FIREBASE_PROJECT_ID production\n\n# CORRECT ✅\nprintf "ultra-lab-tw" | vercel env add FIREBASE_PROJECT_ID production',
              },
            },
          ],
          language: 'bash',
        },
      },
    ],
  },
  {
    title: '🛠️ Troubleshooting Guides | 故障排除指南',
    emoji: '🛠️',
    content: [
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Troubleshooting Guides | 故障排除指南' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Tailwind v4 CSS Utilities Not Working | Tailwind v4 CSS utilities 失效' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '症狀：mx-auto, px-4 等 utilities 不生效 | Symptoms: mx-auto, px-4 utilities not working',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '原因：Unlayered CSS（如 * { margin: 0 }）優先級高於 @layer utilities | Root cause: Unlayered CSS (like * { margin: 0 }) has higher priority than @layer utilities',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '解法：將所有自定義 CSS 放在 @layer base 或 @layer components 內 | Solution: Put all custom CSS inside @layer base or @layer components',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '/* WRONG ❌ */\n* {\n  margin: 0;\n}\n\n/* CORRECT ✅ */\n@layer base {\n  * {\n    margin: 0;\n  }\n}',
              },
            },
          ],
          language: 'css',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '詳細說明請參考 ADR-001 | See ADR-001 for detailed explanation',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Firebase Admin gRPC Metadata Error | Firebase Admin gRPC 錯誤' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '症狀：Error: 3 INVALID_ARGUMENT: Request contains an invalid argument | 症狀：gRPC metadata error',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '原因：FIREBASE_PROJECT_ID 環境變數有 trailing newline（用 echo 設定的）| Root cause: FIREBASE_PROJECT_ID env var has trailing newline (set with echo)',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '解法：用 printf（不加 newline）重新設定環境變數 | Solution: Re-set env var with printf (no newline)',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'printf "ultra-lab-tw" | vercel env add FIREBASE_PROJECT_ID production',
              },
            },
          ],
          language: 'bash',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '詳細說明請參考 ADR-004 | See ADR-004 for detailed explanation',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Vercel Serverless: Cannot find module firebase-admin | Vercel Serverless 找不到 firebase-admin',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '症狀：Cannot find module \'firebase-admin\' | 症狀：找不到 firebase-admin 模組',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '原因：Root tsconfig 使用 moduleResolution: "bundler"（Vite 專用），但 Vercel serverless 需要 "node" | Root cause: Root tsconfig uses moduleResolution: "bundler" (Vite-specific), but Vercel serverless needs "node"',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '解法：建立 api/tsconfig.json 覆蓋 root 設定 | Solution: Create api/tsconfig.json to override root settings',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '{\n  "extends": "../tsconfig.json",\n  "compilerOptions": {\n    "module": "CommonJS",\n    "moduleResolution": "node"\n  }\n}',
              },
            },
          ],
          language: 'json',
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '詳細說明請參考 ADR-002 | See ADR-002 for detailed explanation',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Vercel CLI uploads 0 files | Vercel CLI 上傳 0 個檔案',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '症狀：vercel 顯示 "0 files uploaded" | Symptoms: vercel shows "0 files uploaded"',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '原因：在 Git Bash on Windows 使用反斜線路徑（c:\\Users\\...）導致 git root 檢測失敗 | Root cause: Using backslash paths (c:\\Users\\...) in Git Bash on Windows causes git root detection to fail',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '解法：cd /c/Users/User/UltraLab（使用正斜線）| Solution: cd /c/Users/User/UltraLab (use forward slashes)',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '詳細說明請參考 ADR-010 | See ADR-010 for detailed explanation',
              },
            },
          ],
        },
      },
    ],
  },
  {
    title: '📊 Business Strategy | 商業策略',
    emoji: '📊',
    content: [
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Business Strategy | 商業策略' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Revenue Model: Hybrid Services → SaaS | 混合營收模式：接案 → SaaS' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '純接案現金流好但不可擴展，純 SaaS 前期無收入風險高。Ultra Lab 採用混合模式：| Pure service has good cash flow but not scalable, pure SaaS has high upfront risk. Ultra Lab uses a hybrid model:',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '先接案養品牌和現金流（IG Reel, Threads 自動化）| Start with services to build brand and cash flow',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '將重複性高的交付物產品化為 SaaS（Mind Threads）| Productize high-repetition deliverables into SaaS',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '接案收入補貼 SaaS 開發成本 | Service revenue subsidizes SaaS development costs',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '客戶案例成為 SaaS 行銷素材 | Customer case studies become SaaS marketing materials',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '詳細說明請參考 ADR-006 | See ADR-006 for detailed explanation',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Product Roadmap Philosophy | 產品路線圖哲學' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '從客戶痛點出發，不做市場沒有需求的功能 | Start from customer pain points, don\'t build features without market demand',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '先做 MVP 驗證，再擴展功能 | Build MVP for validation first, then expand features',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '技術選型優先考慮可維護性，而非最新潮流 | Prioritize maintainability over latest trends in tech choices',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '每個產品必須有明確的 revenue model | Every product must have a clear revenue model',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Customer Segments | 客戶區隔' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'B2B 小型企業（1-10 人）：需要自動化工具節省人力 | B2B small businesses (1-10 people): need automation to save labor',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '個人創作者 / KOL：需要內容自動產製 | Individual creators / KOLs: need automated content production',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '財務顧問（Ultra Advisor）：需要專業工具提升服務品質 | Financial advisors (Ultra Advisor): need professional tools to improve service quality',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Pricing Strategy | 定價策略' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  '接案服務：面議預算（瞭解需求後報價）| Service projects: discuss budget (quote after understanding requirements)',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'SaaS 訂閱：NT$1,990-3,000/月（避免低價競爭）| SaaS subscription: NT$1,990-3,000/month (avoid low-price competition)',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Free tier + Pro API（UltraProbe）：$0.01/scan | Free tier + Pro API (UltraProbe): $0.01/scan',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Success Metrics | 成功指標' },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Ultra Advisor: NT$3000 萬營收，4000 付費用戶 | Ultra Advisor: NT$30M revenue, 4000 paid users',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'Mind Threads: 100 付費訂閱（NT$199,000/月）| Mind Threads: 100 paid subscriptions (NT$199,000/month)',
              },
            },
          ],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content:
                  'UltraProbe: 50 leads/月（潛在客戶）| UltraProbe: 50 leads/month (potential customers)',
              },
            },
          ],
        },
      },
    ],
  },
]

async function createDocumentationPage(page) {
  try {
    const result = await notion.pages.create({
      parent: { page_id: NOTION_PARENT_PAGE_ID },
      icon: {
        type: 'emoji',
        emoji: page.emoji,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: page.title,
              },
            },
          ],
        },
      },
      children: page.content,
    })

    console.log(`✅ Created: ${page.title}`)
    return result.id
  } catch (error) {
    console.error(`❌ Failed to create: ${page.title}`)
    console.error(`   Error: ${error.message}`)
    throw error
  }
}

async function main() {
  console.log('🚀 Creating Documentation Hub Pages (Bilingual)...\n')

  let totalCreated = 0
  let totalFailed = 0
  const createdPageIds = []

  for (const page of documentationPages) {
    try {
      const pageId = await createDocumentationPage(page)
      createdPageIds.push({ title: page.title, id: pageId })
      totalCreated++
      await delay(1000) // Longer delay for page creation with content blocks
    } catch (error) {
      console.error(`❌ Failed: ${page.title}`)
      totalFailed++
    }
  }

  console.log('\n')
  console.log('🎉 Documentation Hub Creation Complete!')
  console.log(`   ✅ Created: ${totalCreated}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${totalCreated + totalFailed}`)
  console.log('\n')
  console.log('📚 Created Documentation Pages:')
  createdPageIds.forEach((page) => {
    console.log(`   ✅ ${page.title}`)
    console.log(`      Page ID: ${page.id}`)
  })
  console.log('\n')
  console.log('📌 Next Steps:')
  console.log('1. Go to Notion and verify the Documentation Hub pages')
  console.log('2. Rename parent page "123" to "傲創知識庫 | Ultra Creation Knowledge Base"')
  console.log('3. Share all databases to "Ultra Lab CRM" integration')
  console.log('4. Create Relations between databases (Products ↔ Blog, Tech Stack, etc.)')
  console.log('5. Verify entire Notion KB: 257+ pages + 10 databases')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
