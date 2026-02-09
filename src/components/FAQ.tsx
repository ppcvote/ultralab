import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Ultra Lab 和 Ultra Advisor 是什麼關係？',
    answer:
      '都是傲創實業旗下品牌。Ultra Advisor 是我們的財務顧問 SaaS 產品，Ultra Lab 則是把打造 Advisor 過程中累積的技術能力，對外提供服務的品牌。',
  },
  {
    question: 'IG Reel 和 Threads 系統真的是全自動嗎？',
    answer:
      '是的。從 AI 內容生成、影片製作、到排程發布，全程不需要人工介入。你只需要設定好策略和風格，系統會自動執行。',
  },
  {
    question: 'Threads 沒有官方 API，系統穩定嗎？',
    answer:
      '我們的系統已經穩定運行在自己的帳號上，經過充分驗證。我們會持續維護和更新以確保穩定性。',
  },
  {
    question: '訂閱工具和專案服務有什麼差別？',
    answer:
      '訂閱工具是「你自己用」— 我們提供自動化系統（IG Reel、Threads、短影音），你自行操作，月付即可開始。專案服務是「我們幫你做」— 包含 SaaS 建置、AI 串接、技術諮詢，依專案需求報價。',
  },
  {
    question: '可以先試用再決定嗎？',
    answer:
      '可以。我們提供免費諮詢，會根據你的需求建議最適合的方案。訂閱服務沒有合約綁定，隨時可以取消。',
  },
  {
    question: '付款方式？',
    answer:
      '線上付款，支援信用卡和多種支付方式。訂閱服務為月付制（年付享折扣），專案服務依報價分期付款。',
  },
]

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="border border-[rgba(138,92,255,0.1)] rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: isOpen ? 'rgba(138, 92, 255, 0.05)' : 'rgba(15, 10, 30, 0.5)',
        borderColor: isOpen ? 'rgba(138, 92, 255, 0.3)' : 'rgba(138, 92, 255, 0.1)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
      >
        <span className="text-base font-semibold text-white pr-4">{item.question}</span>
        <ChevronDown
          size={20}
          className={`text-[#8A5CFF] shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen ? '200px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</div>
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
          <span
            className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border border-[rgba(138,92,255,0.3)] text-[#CE4DFF] mb-4"
            style={{
              background: 'rgba(138, 92, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            FAQ
          </span>
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
