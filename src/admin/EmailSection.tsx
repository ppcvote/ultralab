import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { getDb, getFirebaseAuth } from '../lib/firebase'
import { Mail, Send, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'

interface EmailRecord {
  id: string
  subject: string
  body: string
  sentAt: Timestamp
}

interface Props {
  inquiryId: string
  recipientEmail: string
  recipientName: string
}

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—'
  const d = ts.toDate()
  return d.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EmailSection({ inquiryId, recipientEmail, recipientName }: Props) {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)

  const fetchEmails = async () => {
    try {
      const snapshot = await getDocs(
        collection(getDb(), 'inquiries', inquiryId, 'emails')
      )
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmailRecord[]
      docs.sort((a, b) => (b.sentAt?.seconds ?? 0) - (a.sentAt?.seconds ?? 0))
      setEmails(docs)
    } catch (err) {
      console.error('Failed to fetch emails:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [inquiryId])

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const html = body.replace(/\n/g, '<br>')

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          html: `<div style="font-family: sans-serif; line-height: 1.6;">${html}</div>`,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Send failed')
      }

      // Store record in Firestore
      await addDoc(collection(getDb(), 'inquiries', inquiryId, 'emails'), {
        subject,
        body,
        sentAt: serverTimestamp(),
      })

      setSubject('')
      setBody('')
      setShowCompose(false)
      fetchEmails()
    } catch (err) {
      console.error('Failed to send email:', err)
      alert('發送失敗，請重試')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-purple-400" />
          <span className="text-sm text-slate-500">
            郵件記錄 {emails.length > 0 && `(${emails.length})`}
          </span>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)' }}
        >
          {showCompose ? <X size={12} /> : <Send size={12} />}
          {showCompose ? '取消' : '發送郵件'}
        </button>
      </div>

      {/* Compose form */}
      {showCompose && (
        <div className="mb-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="mb-2">
            <span className="text-xs text-slate-500">
              收件人：{recipientName} ({recipientEmail})
            </span>
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="主旨"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 mb-2"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="郵件內容（純文字，換行會自動轉為段落）"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)' }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              發送
            </button>
          </div>
        </div>
      )}

      {/* Email history */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="text-purple-500 animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-3">尚無郵件記錄</p>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedEmail(expandedEmail === email.id ? null : email.id)
                }
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <Send size={12} className="text-purple-400 flex-shrink-0" />
                <span className="text-sm text-white truncate flex-1">
                  {email.subject}
                </span>
                <span className="text-xs text-slate-600 flex-shrink-0">
                  {formatDate(email.sentAt)}
                </span>
                {expandedEmail === email.id ? (
                  <ChevronUp size={12} className="text-slate-600" />
                ) : (
                  <ChevronDown size={12} className="text-slate-600" />
                )}
              </button>
              {expandedEmail === email.id && (
                <div className="px-3 pb-3 pt-1 border-t border-white/5">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {email.body}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
