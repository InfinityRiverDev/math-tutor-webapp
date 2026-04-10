import { useState } from "react"
import { MANAGER_ID } from "../App"
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

export default function UserPage({ user, subscription, reloadSub }) {
  const [page,     setPage]     = useState("home")
  const [pressed,  setPressed]  = useState(null)
  const [flash,    setFlash]    = useState(null)
  const [orderMsg, setOrderMsg] = useState(null)

  const hasSub = subscription?.active === true

  const handleCard = (item) => {
    if (item.locked && !hasSub) {
      setFlash(item.id)
      setTimeout(() => setFlash(null), 600)
      return
    }
    setPage(item.id)
  }

  const openOrder = (msg) => {
    setOrderMsg(msg)
    setPage("order_chat")
  }

  if (page === "tutor")      return <Tutor     user={user} goBack={() => setPage("home")} />
  if (page === "profile")    return <Profile   user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")     return <Wallet    user={user} goBack={() => setPage("home")} subscription={subscription} reloadSub={reloadSub} />
  if (page === "education")  return <Education user={user} goBack={() => setPage("home")} />
  if (page === "focus")      return <Focus     goBack={() => setPage("home")} />
  if (page === "services")   return <Services  goBack={() => setPage("home")} onOrder={openOrder} />
  if (page === "order_chat") return <OrderChat user={user} managerId={MANAGER_ID} goBack={() => setPage("home")} prefill={orderMsg} />

  return (
    <div style={s.root}>
      {/* Header */}
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

      {/* Баннер — нет подписки */}
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

      {/* Меню */}
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
    </div>
  )
}

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column",
          padding:"0 0 32px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
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
}