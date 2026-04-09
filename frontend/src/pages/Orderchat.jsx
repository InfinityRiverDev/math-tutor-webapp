import { useState, useEffect, useRef } from "react"
import { API } from "../App"

export default function OrderChat({ user, managerId, goBack, prefill }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState(prefill || "")
  const [sending, setSending]     = useState(false)
  const chatRef                   = useRef()
  const pollRef                   = useRef()

  useEffect(() => {
    loadMessages()
    pollRef.current = setInterval(loadMessages, 4000)
    return () => clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const loadMessages = async () => {
    try {
      const r = await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${managerId}`)
      const d = await r.json()
      setMessages(d.messages ?? [])
    } catch {}
  }

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || sending) return
    setSending(true)
    setInput("")
    try {
      await fetch(`${API}/billing/chat/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_id: user.id, to_id: managerId, text })
      })
      await loadMessages()
    } catch {}
    finally { setSending(false) }
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const autoResize = (e) => {
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px"
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.avatar}>🎞️</div>
        <div style={s.hinfo}>
          <div style={s.hname}>Менеджер презентаций</div>
          <div style={s.hstatus}><span style={s.dot} />онлайн</div>
        </div>
      </div>

      {/* Шапка заказа */}
      <div style={s.orderBanner}>
        💡 Напишите заказ и отправьте — менеджер ответит и пришлёт готовую презентацию
      </div>

      {/* Сообщения */}
      <div style={s.chat} ref={chatRef}>
        {messages.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize:42, marginBottom:8 }}>🎞️</div>
            <div style={s.emptyT}>Начните диалог</div>
            <div style={s.emptyD}>Опишите что нужно или отправьте заказ ниже</div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.from_id === user.id
          return (
            <div key={msg._id} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom:8 }}>
              {!isMe && <div style={s.msgAvatar}>🎞️</div>}
              <div style={isMe ? s.bubbleMe : s.bubbleThem}>
                {msg.text && <div>{msg.text}</div>}
                {msg.file_id && (
                  <div style={s.fileMsg}>
                    📎 <span style={s.fileName}>{msg.file_name || "Файл"}</span>
                    <span style={s.fileHint}>(скачайте через бот)</span>
                  </div>
                )}
                <div style={s.time}>{msg.created_at?.slice(11, 16)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ввод */}
      <div style={s.inputArea}>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); autoResize(e) }}
          onKeyDown={handleKey}
          placeholder="Написать сообщение..."
          rows={1} style={s.textarea}
        />
        <button style={{ ...s.sendBtn, opacity: !input.trim() || sending ? 0.4 : 1 }}
          disabled={!input.trim() || sending} onClick={() => send()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7L8 10"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

const s = {
  root: { height:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column",
          fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
            background:"rgba(13,19,35,0.97)", borderBottom:"1px solid rgba(255,255,255,0.06)" },
  back: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  avatar: { width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 },
  hinfo: { flex:1 },
  hname: { fontSize:15, fontWeight:600, color:"#f1f5f9" },
  hstatus: { display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,0.4)" },
  dot: { width:6, height:6, borderRadius:"50%", background:"#10b981", display:"inline-block" },
  orderBanner: { padding:"10px 16px", background:"rgba(99,102,241,0.08)",
                 borderBottom:"1px solid rgba(99,102,241,0.15)",
                 fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.5 },
  chat: { flex:1, overflowY:"auto", padding:"16px 14px" },
  empty: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
           height:"100%", textAlign:"center", padding:"40px 24px" },
  emptyT: { fontSize:17, fontWeight:600, color:"#f1f5f9" },
  emptyD: { fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:6, lineHeight:1.5 },
  msgAvatar: { width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
               display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
               flexShrink:0, marginRight:8, alignSelf:"flex-end", marginBottom:2 },
  bubbleMe: { maxWidth:"78%", background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"#fff",
              borderRadius:"18px 18px 4px 18px", padding:"10px 14px", fontSize:14.5, lineHeight:1.55,
              boxShadow:"0 4px 20px rgba(99,102,241,0.3)" },
  bubbleThem: { maxWidth:"78%", background:"rgba(255,255,255,0.06)", color:"#e2e8f0",
                borderRadius:"18px 18px 18px 4px", border:"1px solid rgba(255,255,255,0.08)",
                padding:"10px 14px", fontSize:14.5, lineHeight:1.55 },
  fileMsg: { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" },
  fileName: { fontWeight:600, color:"#818cf8" },
  fileHint: { fontSize:11, color:"rgba(255,255,255,0.4)" },
  time: { fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4, textAlign:"right" },
  inputArea: { background:"rgba(13,19,35,0.98)", padding:"10px 12px",
               display:"flex", alignItems:"flex-end", gap:8,
               borderTop:"1px solid rgba(255,255,255,0.05)" },
  textarea: { flex:1, background:"rgba(255,255,255,0.06)", color:"#f1f5f9",
              border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"10px 14px",
              minHeight:40, maxHeight:110, fontFamily:"inherit", fontSize:14.5,
              resize:"none", outline:"none", lineHeight:1.45, boxSizing:"border-box" },
  sendBtn: { width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#4f46e5)",
             border:"none", color:"white", display:"flex", alignItems:"center", justifyContent:"center",
             cursor:"pointer", flexShrink:0, boxShadow:"0 4px 16px rgba(99,102,241,0.45)",
             transition:"opacity 0.15s" },
}