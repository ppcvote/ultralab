import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Ultra Lab 到底在做什麼？',
    answer:
      'Ultra Lab 是一間 AI Product Studio — 我們自己造 AI 產品，也幫客戶造。目前已有四個自有產品上線運營中：MindThread（Threads 自動化 SaaS）、UltraProbe（AI 安全掃描器）、AI Agents（品牌推廣 Agent 艦隊）、Ultra Advisor（財務顧問平台）。這些產品就是我們能力的最佳證明。',
  },
  {
    question: 'Ultra Lab 和 MindThread / Ultra Advisor 是什麼關係？',
    answer:
      '都是 Ultra Lab 造的產品。MindThread 是我們打造的 Threads 自動化 SaaS，已獨立為子品牌（mindthread.tw）。Ultra Advisor 是 AI 驅動的財務顧問平台。它們和 UltraProbe、AI Agents 一起，構成 Ultra Lab 的產品組合 — 每一個都是我們全端建置能力的活案例。',
  },
  {
    question: 'AI Agent 部署要多久？可以部署在哪些平台？',
    answer:
      '三天。我們使用 OpenClaw + Gemini 2.5 Flash 架構，支援 Moltbook、Discord、Telegram、LINE 等平台。Agent 可以自主發文、互動回覆、跨平台協作。Ultra Lab 自己的四個 Agent 每天 24 小時運行中，就是最好的 demo。',
  },
  {
    question: 'UltraProbe 是做什麼的？',
    answer:
      'UltraProbe 是我們自研的 AI 安全掃描器，針對 AI 應用進行 19 種攻擊向量的自動化滲透測試，包括 Prompt Injection、越獄攻擊、資料洩漏等。免費掃描，幾分鐘內出報告。目前是台灣唯一針對 AI 系統的安全掃描工具。',
  },
  {
    question: 'AI 產品建置服務包含什麼？多快可以上線？',
    answer:
      '全端建置：React + TypeScript 前端、Firebase 後端、Vercel 部署、LLM API 整合、管理後台、訂閱系統。兩週內上線 MVP。我們所有自有產品都用同套架構，經過生產環境驗證。',
  },
  {
    question: '可以免費諮詢嗎？',
    answer:
      '可以。UltraProbe AI 安全掃描完全免費使用。所有服務都提供免費初次諮詢，我們會根據你的需求建議最適合的方案。填寫聯絡表單後，我們會主動聯繫你。',
  },
]

function AccordionItem({ item, isOpen, onToggle, index }: { item: FAQItem; isOpen: boolean; onToggle: () => void; index: number }) {
  const panelId = `faq-panel-${index}`
  const headingId = `faq-heading-${index}`
  return (
    <div
      className="border border-[rgba(138,92,255,0.1)] rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: isOpen ? 'rgba(138, 92, 255, 0.05)' : 'rgba(15, 10, 30, 0.5)',
        borderColor: isOpen ? 'rgba(138, 92, 255, 0.3)' : 'rgba(138, 92, 255, 0.1)',
      }}
    >
      <h3>
      <button
        id={headingId}
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-base font-semibold text-white pr-4">{item.question}</span>
        <ChevronDown
          size={20}
          className={`text-[#8A5CFF] shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        className="grid transition-all duration-300"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</div>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <section id="faq" className="relative py-24 lg:py-32 bg-lab" ref={ref}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">man ultra-lab</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            常見<span className="text-gradient-purple">問題</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={isInView ? 'animate-fade-in-up' : 'opacity-0'}
              style={{ animationDelay: `${(index + 1) * 0.08}s` }}
            >
              <AccordionItem
                item={item}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
