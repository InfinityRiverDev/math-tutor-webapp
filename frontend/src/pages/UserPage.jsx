import { useState, useEffect } from "react"
import { MANAGER_ID, PRINT_MANAGER_ID, API } from "../App"
import Tutor     from "./Tutor"
import Profile   from "./Profile"
import Wallet    from "./Wallet"
import Education from "./Education"
import Services  from "./Services"
import Focus     from "./Focus"
import OrderChat from "./OrderChat"

const ITEMS = [
  { id:"tutor",     icon:"🎓", label:"ИИ-репетитор",  desc:"Задай вопрос — получи ответ",  color:"#6366f1", locked:true  },
  { id:"education", icon:"📚", label:"Образование",    desc:"Лекции и расписание",           color:"#0ea5e9", locked:true  },
  { id:"focus",     icon:"🎯", label:"Фокус",          desc:"Музыка и помодоро",             color:"#f59e0b", locked:true  },
  { id:"services",  icon:"📝", label:"Услуги",         desc:"Распечатка и заказы",           color:"#10b981", locked:false },
  { id:"wallet",    icon:"💼", label:"Кошелёк",        desc:"Баланс и тарифы",               color:"#f59e0b", locked:false },
  { id:"profile",   icon:"👤", label:"Профиль",        desc:"Данные и подписка",             color:"#ec4899", locked:false },
]

const CHAT_CONFIGS = {
  presentation: { managerId: MANAGER_ID,       icon: "🎞️", label: "Презентации" },
  print:        { managerId: PRINT_MANAGER_ID, icon: "🖨️", label: "Распечатка"  },
}

export default function UserPage({ user, subscription, reloadSub }) {
  const [page,      setPage]      = useState("home")
  const [pressed,   setPressed]   = useState(null)
  const [flash,     setFlash]     = useState(null)
  const [chatType,  setChatType]  = useState(null)
  const [orderMsg,  setOrderMsg]  = useState(null)
  const [chatList,  setChatList]  = useState([])
  const [chatListLoading, setChatListLoading] = useState(false)

  const hasSub = subscription?.active === true

  const handleCard = (item) => {
    if (item.locked && !hasSub) {
      setFlash(item.id)
      setTimeout(() => setFlash(null), 600)
      return
    }
    setPage(item.id)
  }

  const openOrder = (type, _managerId, prefill) => {
    setChatType(type)
    setOrderMsg(prefill)
    setPage("order_chat")
  }

  const openChatList = async () => {
    setPage("chat_list")
    setChatListLoading(true)
    try {
      const results = await Promise.all(
        Object.entries(CHAT_CONFIGS).map(async ([type, cfg]) => {
          try {
            const r = await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${cfg.managerId}`)
            const d = await r.json()
            const msgs = d.messages ?? []
            return { type, cfg, lastMsg: msgs[msgs.length - 1] ?? null, count: msgs.length }
          } catch {
            return { type, cfg, lastMsg: null, count: 0 }
          }
        })
      )
      setChatList(results)
    } catch {}
    finally { setChatListLoading(false) }
  }

  if (page === "tutor")      return <Tutor     user={user} goBack={() => setPage("home")} />
  if (page === "profile")    return <Profile   user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")     return <Wallet    user={user} goBack={() => setPage("home")} subscription={subscription} reloadSub={reloadSub} />
  if (page === "education")  return <Education user={user} goBack={() => setPage("home")} />
  if (page === "focus")      return <Focus     goBack={() => setPage("home")} />
  if (page === "services")   return <Services  goBack={() => setPage("home")} onOrder={openOrder} />
  if (page === "order_chat") {
    const cfg = CHAT_CONFIGS[chatType] ?? CHAT_CONFIGS.presentation
    return (
      <OrderChat
        user={user}
        managerId={cfg.managerId}
        chatLabel={cfg.label}
        chatIcon={cfg.icon}
        goBack={() => setPage("home")}
        prefill={orderMsg}
      />
    )
  }
  if (page === "chat_list") return (
    <ChatList
      chatList={chatList}
      loading={chatListLoading}
      goBack={() => setPage("home")}
      onOpen={(type) => {
        setChatType(type)
        setOrderMsg(null)
        setPage("order_chat")
      }}
    />
  )

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.hglow} />
        <div style={s.avatar}>{user.first_name?.[0]?.toUpperCase() ?? "?"}</div>
        <div style={s.htxt}>
          <span style={s.greet}>Привет, {user.first_name} 👋</span>
          <span style={s.sub}>
            {hasSub ? `✅ ${subscription.plan_name}` : "🔒 Нет тарифа"}
          </span>
        </div>
      </div>

      {!hasSub && (
        <div style={s.banner} onClick={() => setPage("wallet")}>
          <div style={s.bannerGlow} />
          <div style={s.bannerL}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <div style={s.bannerTitle}>Нет активного тарифа</div>
              <div style={s.bannerDesc}>Доступны только Услуги, Кошелёк, Профиль</div>
            </div>
          </div>
          <div style={s.bannerBtn}>Купить →</div>
        </div>
      )}

      <div style={s.grid}>
        {ITEMS.map(item => {
          const locked   = item.locked && !hasSub
          const flashing = flash === item.id
          return (
            <button
              key={item.id}
              style={{
                ...s.card,
                opacity:     locked ? 0.52 : 1,
                borderColor: flashing ? "#ef4444" : pressed === item.id ? item.color : "rgba(255,255,255,0.07)",
                background:  flashing ? "rgba(239,68,68,0.08)" : pressed === item.id ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                transform:   pressed === item.id ? "scale(0.97)" : "scale(1)",
              }}
              onPointerDown={() => setPressed(item.id)}
              onPointerUp={() => { setPressed(null); handleCard(item) }}
              onPointerLeave={() => setPressed(null)}
            >
              <div style={{ ...s.iw, background: item.color + "28" }}>
                <span style={{ fontSize: 22 }}>{locked ? "🔒" : item.icon}</span>
              </div>
              <div style={s.cb}>
                <span style={s.cl}>{item.label}</span>
                <span style={s.cd}>{locked ? "Требуется подписка" : item.desc}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )
        })}
      </div>

      <div style={s.badge}><span style={s.dot} />Math Tutor · powered by AI</div>

      {/* Floating chat button */}
      <button style={s.chatFab} onClick={openChatList} title="Мои заказы">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 4h14a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"
            stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

function ChatList({ chatList, loading, goBack, onOpen }) {
  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.hglow} />
        <button style={s.backBtnSm} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.htxt}>
          <span style={{ ...s.greet, fontSize: 17 }}>Мои заказы</span>
          <span style={s.sub}>Чаты с менеджерами</span>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"16px" }}>
        {loading && (
          <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
            <div style={{ width:28, height:28, border:"2.5px solid rgba(255,255,255,0.08)",
              borderTop:"2.5px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          </div>
        )}
        {!loading && chatList.map(({ type, cfg, lastMsg }) => (
          <button key={type} style={cl.card} onClick={() => onOpen(type)}>
            <div style={cl.icon}>{cfg.icon}</div>
            <div style={cl.body}>
              <div style={cl.label}>{cfg.label}</div>
              <div style={cl.preview}>
                {lastMsg
                  ? (lastMsg.text
                      ? lastMsg.text.slice(0, 48) + (lastMsg.text.length > 48 ? "…" : "")
                      : "📎 Файл")
                  : "Нажмите чтобы написать"}
              </div>
            </div>
            {lastMsg && <div style={cl.time}>{lastMsg.created_at?.slice(11, 16)}</div>}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

const cl = {
  card: {
    display:"flex", alignItems:"center", gap:12,
    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
    borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left",
    width:"100%", boxSizing:"border-box",
  },
  icon: {
    width:44, height:44, borderRadius:"50%",
    background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:20, flexShrink:0,
  },
  body: { flex:1, display:"flex", flexDirection:"column", gap:3 },
  label: { fontSize:15, fontWeight:600, color:"#f1f5f9" },
  preview: { fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.4 },
  time: { fontSize:11, color:"rgba(255,255,255,0.3)", flexShrink:0 },
}

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column",
          padding:"0 0 32px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
          position:"relative" },
  header: { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:14,
            padding:"28px 20px 22px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)",
            borderBottom:"1px solid rgba(255,255,255,0.05)" },
  hglow: { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%",
           background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)", pointerEvents:"none" },
  avatar: { width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:600,
            color:"#fff", flexShrink:0, boxShadow:"0 0 0 3px rgba(99,102,241,0.25)" },
  htxt: { display:"flex", flexDirection:"column", gap:3 },
  greet: { fontSize:18, fontWeight:600, color:"#f1f5f9", letterSpacing:"-0.3px" },
  sub: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  backBtnSm: {
    background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
  },
  banner: { margin:"14px 16px 0", background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.05))",
            border:"1px solid rgba(99,102,241,0.25)", borderRadius:16, padding:"14px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            cursor:"pointer", position:"relative", overflow:"hidden" },
  bannerGlow: { position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%",
                background:"radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)", pointerEvents:"none" },
  bannerL: { display:"flex", alignItems:"center", gap:12 },
  bannerTitle: { fontSize:14, fontWeight:600, color:"#f1f5f9" },
  bannerDesc: { fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 },
  bannerBtn: { background:"rgba(99,102,241,0.2)", border:"1px solid rgba(99,102,241,0.4)",
               color:"#818cf8", fontSize:13, fontWeight:600, padding:"6px 12px", borderRadius:10, flexShrink:0 },
  grid: { display:"flex", flexDirection:"column", gap:10, padding:"16px 16px 0" },
  card: { display:"flex", alignItems:"center", gap:14, border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left", width:"100%",
          boxSizing:"border-box", transition:"transform 0.12s,border-color 0.15s,background 0.15s,opacity 0.2s" },
  iw: { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  cb: { flex:1, display:"flex", flexDirection:"column", gap:2 },
  cl: { fontSize:15, fontWeight:600, color:"#f1f5f9", letterSpacing:"-0.2px" },
  cd: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  badge: { display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:28,
           fontSize:12, color:"rgba(255,255,255,0.2)" },
  dot: { width:6, height:6, borderRadius:"50%", background:"#10b981", display:"inline-block" },
  chatFab: {
    position:"fixed", bottom:24, right:20,
    width:52, height:52, borderRadius:"50%",
    background:"linear-gradient(135deg,#6366f1,#4f46e5)",
    border:"none", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 4px 20px rgba(99,102,241,0.5)",
    zIndex:100,
  },
}