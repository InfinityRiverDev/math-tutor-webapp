import { useState, useEffect, useRef } from "react"
import { API } from "../App"

export default function OrderChat({ user, managerId, goBack, prefill, chatLabel, chatIcon, isManager, targetUserId }) {
  const label = chatLabel || "Менеджер"
  const icon  = chatIcon  || "🎞️"

  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState(prefill || "")
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState(null)
  const chatRef                   = useRef()
  const pollRef                   = useRef()

  // ✅ ИСПРАВЛЕНО: определяем otherParty ПРАВИЛЬНО
  const otherParty = (() => {
    if (isManager && targetUserId) {
      return targetUserId
    }
    // Если managerId не передан или undefined
    if (managerId && typeof managerId === 'number') {
      return managerId
    }
    console.error("OrderChat: managerId is missing!", { isManager, targetUserId, managerId })
    return null
  })()

  useEffect(() => {
    // Не делаем запрос если otherParty не определён
    if (!otherParty) return
    
    loadMessages()
    pollRef.current = setInterval(loadMessages, 4000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [otherParty])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const loadMessages = async () => {
    if (!otherParty) return
    
    try {
      const r = await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${otherParty}`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setMessages(d.messages ?? [])
      setError(null)
    } catch (e) {
      console.error("Chat load error:", e)
    }
  }

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || sending || !otherParty) return
    
    setSending(true)
    setError(null)
    setInput("")
    
    // Оптимистично добавляем сообщение
    const tempId = Date.now().toString()
    const tempMsg = {
      _id: tempId,
      from_id: user.id,
      to_id: otherParty,
      text: text,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])
    
    try {
      const r = await fetch(`${API}/billing/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          from_id: user.id, 
          to_id: otherParty, 
          text: text 
        })
      })
      
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      
      const d = await r.json()
      if (!d.success) throw new Error(d.error || "Ошибка отправки")
      
      // Перезагружаем сообщения с сервера
      await loadMessages()
    } catch (e) {
      console.error("Chat send error:", e)
      setError("Не удалось отправить сообщение")
      // Удаляем оптимистичное сообщение при ошибке
      setMessages(prev => prev.filter(m => m._id !== tempId))
      setInput(text) // Возвращаем текст
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault()
      send() 
    }
  }

  const autoResize = (e) => {
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px"
  }

  // Если otherParty не определён — показываем ошибку
  if (!otherParty) {
    return (
      <div style={st.root}>
        <div style={st.header}>
          <button style={st.back} onClick={goBack}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={st.hname}>Ошибка</div>
            <div style={st.hstatus}>Не удалось определить получателя</div>
          </div>
        </div>
        <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          ⚠️ Ошибка загрузки чата. Попробуйте перезапустить приложение.
        </div>
      </div>
    )
  }

  return (
    <div style={st.root}>
      <div style={st.header}>
        <button style={st.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={st.avatar}>{icon}</div>
        <div style={st.hinfo}>
          <div style={st.hname}>{label}</div>
          <div style={st.hstatus}><span style={st.dot} />онлайн</div>
        </div>
      </div>

      <div style={st.orderBanner}>
        💡 Опишите ваш заказ — менеджер ответит в ближайшее время
      </div>

      <div style={st.chat} ref={chatRef}>
        {messages.length === 0 && (
          <div style={st.empty}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>{icon}</div>
            <div style={st.emptyT}>Начните диалог</div>
            <div style={st.emptyD}>Опишите что нужно или отправьте заказ ниже</div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.from_id === user.id
          return (
            <div key={msg._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
              {!isMe && <div style={st.msgAvatar}>{icon}</div>}
              <div style={isMe ? st.bubbleMe : st.bubbleThem}>
                {msg.text && <div>{msg.text}</div>}
                {msg.file_id && (
                  <div style={st.fileMsg}>
                    📎 <span style={st.fileName}>{msg.file_name || "Файл"}</span>
                    <span style={st.fileHint}>(скачайте через бот)</span>
                  </div>
                )}
                <div style={st.time}>{msg.created_at?.slice(11, 16)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={st.errorBanner}>
          ⚠️ {error}
          <button 
            onClick={loadMessages}
            style={{ marginLeft: 10, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}
          >
            Повторить
          </button>
        </div>
      )}

      <div style={st.inputArea}>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); autoResize(e) }}
          onKeyDown={handleKey}
          placeholder="Написать сообщение..."
          rows={1} 
          style={st.textarea}
        />
        <button 
          style={{ ...st.sendBtn, opacity: !input.trim() || sending ? 0.4 : 1 }}
          disabled={!input.trim() || sending} 
          onClick={() => send()}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7L8 10"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

const st = {
  root: { height: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column",
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "rgba(13,19,35,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  back: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  hinfo: { flex: 1 },
  hname: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  hstatus: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.4)" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" },
  orderBanner: { padding: "10px 16px", background: "rgba(99,102,241,0.08)",
                 borderBottom: "1px solid rgba(99,102,241,0.15)",
                 fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 },
  chat: { flex: 1, overflowY: "auto", padding: "16px 14px" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
           height: "100%", textAlign: "center", padding: "40px 24px" },
  emptyT: { fontSize: 17, fontWeight: 600, color: "#f1f5f9" },
  emptyD: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6, lineHeight: 1.5 },
  msgAvatar: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
               display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
               flexShrink: 0, marginRight: 8, alignSelf: "flex-end", marginBottom: 2 },
  bubbleMe: { maxWidth: "78%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
              borderRadius: "18px 18px 4px 18px", padding: "10px 14px", fontSize: 14.5, lineHeight: 1.55,
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)" },
  bubbleThem: { maxWidth: "78%", background: "rgba(255,255,255,0.06)", color: "#e2e8f0",
                borderRadius: "18px 18px 18px 4px", border: "1px solid rgba(255,255,255,0.08)",
                padding: "10px 14px", fontSize: 14.5, lineHeight: 1.55 },
  fileMsg: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  fileName: { fontWeight: 600, color: "#818cf8" },
  fileHint: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  time: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, textAlign: "right" },
  errorBanner: { padding: "8px 16px", background: "rgba(239,68,68,0.1)", 
                 borderTop: "1px solid rgba(239,68,68,0.2)",
                 fontSize: 12, color: "#ef4444", textAlign: "center",
                 display: "flex", alignItems: "center", justifyContent: "center" },
  inputArea: { background: "rgba(13,19,35,0.98)", padding: "10px 12px",
               display: "flex", alignItems: "flex-end", gap: 8,
               borderTop: "1px solid rgba(255,255,255,0.05)" },
  textarea: { flex: 1, background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "10px 14px",
              minHeight: 40, maxHeight: 110, fontFamily: "inherit", fontSize: 14.5,
              resize: "none", outline: "none", lineHeight: 1.45, boxSizing: "border-box" },
  sendBtn: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)",
             border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center",
             cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 16px rgba(99,102,241,0.45)",
             transition: "opacity 0.15s" },
}