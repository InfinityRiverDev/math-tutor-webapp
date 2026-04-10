import { useState, useRef, useEffect } from "react"
import { API } from "../App"

// Separate localStorage keys for each mode's history
const HISTORY_KEY = {
  chat:     (uid) => `tutor_history_${uid}`,
  practice: (uid) => `practice_history_${uid}`,
}

export default function Tutor({ user, goBack }) {
  const [mode, setMode] = useState("menu")

  const switchMode = (m) => setMode(m)

  if (mode === "menu") {
    return (
      <div style={s.root}>
        <div style={s.header}>
          <div style={s.headerGlow} />
          <button style={s.backBtn} onClick={goBack}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={s.headerInfo}>
            <span style={s.headerTitle}>🎓 ИИ-помощник</span>
            <span style={s.headerSub}>Выбери режим</span>
          </div>
        </div>

        <div style={s.menuBody}>
          <ModeCard
            icon="🎓"
            title="Репетитор"
            desc="Объясняю теорию, решаю задачи шаг за шагом"
            color="#6366f1"
            glow="rgba(99,102,241,0.15)"
            onClick={() => switchMode("chat")}
          />
          <ModeCard
            icon="✍️"
            title="Практика"
            desc="Тренировочные задачи с разбором ошибок"
            color="#0ea5e9"
            glow="rgba(14,165,233,0.15)"
            onClick={() => switchMode("practice")}
          />
        </div>
      </div>
    )
  }

  return (
    <ChatView
      key={mode}
      mode={mode}
      user={user}
      onBack={() => setMode("menu")}
    />
  )
}

// ── Chat view (shared by both modes) ─────────────────────────────

function ChatView({ mode, user, onBack }) {
  const isPractice = mode === "practice"
  const storageKey = isPractice ? HISTORY_KEY.practice(user.id) : HISTORY_KEY.chat(user.id)

  const [input,    setInput]    = useState("")
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]")
    } catch { return [] }
  })
  const [loading, setLoading] = useState(false)
  const chatRef    = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  // Persist messages to localStorage
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages)) } catch {}
  }, [messages])

  const autoResize = (e) => {
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
  }

  const clearHistory = () => {
    setMessages([])
    try { localStorage.removeItem(storageKey) } catch {}
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    const newMessages = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = "40px"

    const url = isPractice ? `${API}/tutor/practice` : `${API}/tutor/`

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, user_id: user.id })
      })
      const data = await res.json()
      setMessages([...newMessages, { role: "assistant", content: data.answer }])
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Ошибка соединения. Попробуй ещё раз." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={s.chatRoot}>
      {/* Header */}
      <div style={s.chatHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ ...s.chatAvatar, background: isPractice ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          {isPractice ? "✍️" : "🎓"}
        </div>
        <div style={s.chatHeaderInfo}>
          <span style={s.chatHeaderTitle}>{isPractice ? "Практика" : "Репетитор"}</span>
          <span style={s.chatHeaderStatus}>
            <span style={{ ...s.statusDot, background: loading ? "#f59e0b" : "#10b981" }} />
            {loading ? "печатает..." : "онлайн"}
          </span>
        </div>
        {messages.length > 0 && (
          <button style={s.clearBtn} onClick={clearHistory} title="Очистить историю">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"
                stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={s.chat} ref={chatRef}>
        {messages.length === 0 && (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>{isPractice ? "✍️" : "🎓"}</div>
            <p style={s.emptyTitle}>{isPractice ? "Начнём практику!" : "Привет! Я твой репетитор"}</p>
            <p style={s.emptyDesc}>{isPractice ? "Скажи мне тему — и я дам задачу" : "Задай любой вопрос по математике"}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ ...s.row, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ ...s.msgAvatar, background: isPractice ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {isPractice ? "✍️" : "🎓"}
              </div>
            )}
            <div style={m.role === "user" ? s.bubbleUser : s.bubbleAssistant}>
              <div dangerouslySetInnerHTML={{ __html: m.content }} />
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...s.row, justifyContent: "flex-start" }}>
            <div style={{ ...s.msgAvatar, background: isPractice ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {isPractice ? "✍️" : "🎓"}
            </div>
            <div style={s.bubbleAssistant}>
              <div style={s.typingDots}><span /><span /><span /></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={s.inputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize(e) }}
          onKeyDown={handleKey}
          placeholder="Напиши сообщение..."
          rows={1}
          style={s.textarea}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7L8 10"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function ModeCard({ icon, title, desc, color, glow, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      style={{
        ...s.modeCard,
        borderColor: pressed ? color : "rgba(255,255,255,0.07)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        background: pressed ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick() }}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{ ...s.modeIcon, background: glow }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
      <div style={s.modeBody}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>{title}</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{desc}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

const s = {
  root: {
    minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12,
    padding: "20px 20px 18px", background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none",
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  menuBody: { display: "flex", flexDirection: "column", gap: 12, padding: "24px 16px" },
  modeCard: {
    display: "flex", alignItems: "center", gap: 16,
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "18px 16px",
    cursor: "pointer", transition: "transform 0.12s ease, border-color 0.12s ease, background 0.12s ease",
    textAlign: "left", width: "100%", boxSizing: "border-box",
  },
  modeIcon: { width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  modeBody: { flex: 1, display: "flex", flexDirection: "column" },
  chatRoot: {
    display: "flex", flexDirection: "column", height: "100vh", background: "#0a0f1e",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  chatHeader: {
    display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
    background: "rgba(13,19,35,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  },
  chatAvatar: {
    width: 38, height: 38, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 600, color: "#fff", flexShrink: 0,
  },
  chatHeaderInfo: { display: "flex", flexDirection: "column", gap: 1, flex: 1 },
  chatHeaderTitle: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  chatHeaderStatus: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.45)" },
  statusDot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block" },
  clearBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, padding: "6px 8px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  chat: { flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 },
  emptyState: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "60px 24px", textAlign: "center", gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9", margin: 0 },
  emptyDesc: { fontSize: 14, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5 },
  row: { display: "flex", width: "100%", alignItems: "flex-end", gap: 8 },
  msgAvatar: {
    width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, flexShrink: 0, marginBottom: 2,
  },
  bubbleUser: {
    maxWidth: "78%", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff",
    borderRadius: "18px 18px 4px 18px", padding: "10px 14px", fontSize: 14.5, lineHeight: 1.55,
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
  },
  bubbleAssistant: {
    maxWidth: "78%", background: "rgba(255,255,255,0.05)", color: "#e2e8f0",
    borderRadius: "18px 18px 18px 4px", border: "1px solid rgba(255,255,255,0.07)",
    padding: "10px 14px", fontSize: 14.5, lineHeight: 1.55,
  },
  typingDots: { display: "flex", gap: 5, padding: "2px 0", alignItems: "center" },
  inputArea: {
    background: "rgba(13,19,35,0.98)", padding: "10px 12px",
    display: "flex", alignItems: "flex-end", gap: 8,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  textarea: {
    flex: 1, background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "10px 14px",
    minHeight: 40, maxHeight: 120, fontFamily: "inherit", fontSize: 14.5,
    resize: "none", outline: "none", lineHeight: 1.45,
    transition: "border-color 0.2s", boxSizing: "border-box", overflow: "hidden",
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
    transition: "transform 0.15s, opacity 0.15s",
    boxShadow: "0 4px 16px rgba(99,102,241,0.45)",
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
}