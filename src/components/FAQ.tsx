import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Ultra Lab 的核心技術是什麼？',
    answer:
      '我們的核心是 AI 自動化基礎設施。透過 Gemini / Claude 等 LLM API 驅動內容生成、FFmpeg + Playwright 處理影音、Firebase 即時數據引擎、Vercel Edge 部署。所有產品從 AI Prompt 工程到端到端自動化全自研。',
  },
  {
    question: 'Ultra Lab 和 Ultra Advisor / Mind Threads 是什麼關係？',
    answer:
      '都是傲創實業（Ultra Creation）旗下品牌。Ultra Advisor 是 AI 財務顧問 SaaS，Mind Threads 是 Threads AI 自動化 SaaS（台灣零競品）。Ultra Lab 是技術引擎 — 負責打造這些 AI 產品並對外提供技術服務。',
  },
  {
    question: '你們的 AI 系統真的是 100% 全自動嗎？',
    answer:
      '是的。從 Gemini API 生成內容、自動製作影片、到排程發布，全程零人工介入。我們同時運行 6 個 Threads 帳號、每天自動發布 35+ 篇 AI 內容，持續運作中。',
  },
  {
    question: '你們用了哪些 AI / GPU 相關技術？',
    answer:
      'LLM 端：Gemini 2.5 Flash / Pro、Claude API、多模型切換。影音端：FFmpeg GPU 編碼、Playwright 渲染引擎。安全端：自研 UltraProbe AI 安全掃描器（10 攻擊向量自動化測試）。我們正在評估將部分推理工作負載遷移到 NVIDIA GPU 以提升延遲效能。',
  },
  {
    question: '訂閱工具和專案服務有什麼差別？',
    answer:
      '訂閱工具是「你自己用」— 我們提供 AI 自動化系統（IG Reel、Threads），月付即可開始。專案服務是「我們幫你做」— 包含 SaaS 建置、AI 串接、知識中樞、安全防護，依專案需求報價。',
  },
  {
    question: '可以先試用再決定嗎？',
    answer:
      '可以。我們提供免費諮詢，會根據你的需求建議最適合的方案。UltraProbe AI 安全掃描器可以直接免費使用。訂閱服務沒有合約綁定，隨時可以取消。',
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
