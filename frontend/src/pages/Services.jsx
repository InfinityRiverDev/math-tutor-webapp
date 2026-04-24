import { useState } from "react"
import { API } from "../App"
import OrderChat from "./OrderChat"

const MANAGER_ID       = 858414038
const PRINT_MANAGER_ID = 1991833177

export default function Services({ user, goBack, onOrder }) {
  const [page,     setPage]     = useState("menu")
  const [chatType, setChatType] = useState(null)

  const CFGS = {
    presentation: { managerId: MANAGER_ID,       icon: "🎞️", label: "Презентации" },
    print:        { managerId: PRINT_MANAGER_ID, icon: "🖨️", label: "Распечатка"  },
  }

  const open = (type) => { setChatType(type); setPage("chat") }

  if (page === "chat" && chatType) {
    const cfg = CFGS[chatType]
    return <OrderChat user={user} managerId={cfg.managerId} chatLabel={cfg.label} chatIcon={cfg.icon} goBack={() => setPage("menu")} />
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={s.title}>📝 Услуги</div>
          <div style={s.sub}>Распечатка и заказы</div>
        </div>
      </div>
      <div style={s.body}>
        {[
          { type:"print",        icon:"🖨️", title:"Распечатка",  desc:"1 стр — 10₽ · ДАС №6",  color:"rgba(16,185,129,0.15)" },
          { type:"presentation", icon:"🎞️", title:"Презентации", desc:"От 250₽ · 1 день",         color:"rgba(99,102,241,0.15)" },
        ].map(c => (
          <div key={c.type} style={{ ...s.card, background:c.color }}>
            <div style={s.cardTop}>
              <span style={{ fontSize:28 }}>{c.icon}</span>
              <div>
                <div style={s.cardTitle}>{c.title}</div>
                <div style={s.cardDesc}>{c.desc}</div>
              </div>
            </div>
            <button style={s.cardBtn} onClick={() => open(c.type)}>💬 Написать →</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"system-ui" },
  header: { display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  back: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  title: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  sub: { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body: { padding:"16px", display:"flex", flexDirection:"column", gap:12 },
  card: { borderRadius:18, padding:"18px", border:"1px solid rgba(255,255,255,0.07)" },
  cardTop: { display:"flex", gap:14, alignItems:"flex-start", marginBottom:14 },
  cardTitle: { fontSize:16, fontWeight:700, color:"#f1f5f9" },
  cardDesc: { fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:3 },
  cardBtn: { display:"block", width:"100%", textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px", color:"#f1f5f9", fontSize:14, fontWeight:600, cursor:"pointer" },
}