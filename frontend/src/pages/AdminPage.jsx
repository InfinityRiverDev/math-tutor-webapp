import { useState, useEffect } from "react"
import { API, ADMIN_IDS, MANAGER_IDS, MANAGER_ID, PRINT_MANAGER_ID } from "../App"
import OrderChat  from "./OrderChat"
import AdminStats from "./AdminStats"
import Wallet     from "./Wallet"
import Profile    from "./Profile"
import Education  from "./Education"
import Tutor      from "./Tutor"
import Focus      from "./Focus"
import StatsView  from "./StatsView"

const MANAGER_CFG = {
  [MANAGER_ID]:       { icon: "🎞️", label: "Презентации", color: "#6366f1", chatType: "presentation" },
  [PRINT_MANAGER_ID]: { icon: "🖨️", label: "Распечатка",  color: "#10b981", chatType: "print"        },
}

export default function AdminPage({ user, subscription, reloadSub, startParams }) {
  const isAdmin  = ADMIN_IDS.includes(user.id)
  const myConfig = MANAGER_CFG[user.id]

  const [page,       setPage]       = useState("orders")
  const [activeChat, setActiveChat] = useState(null)

  // Вкладки: всегда Заказы, у админов + Статистика, у менеджеров + доп.разделы
  const TABS = [
    { id: "orders",  label: `${myConfig?.icon ?? "📋"} Заказы` },
    ...(isAdmin ? [{ id: "stats", label: "📊 Статистика" }] : []),
    { id: "wallet",  label: "💼 Кошелёк" },
    { id: "profile", label: "👤 Профиль" },
  ]

  if (page === "stats")
    return <AdminStats goBack={() => setPage("orders")} user={user} />
  if (page === "wallet")
    return <Wallet user={user} goBack={() => setPage("orders")} subscription={subscription} reloadSubscription={reloadSub} />
  if (page === "profile")
    return <Profile user={user} goBack={() => setPage("orders")} subscription={subscription} />
  if (page === "chat" && activeChat)
    return (
      <OrderChat
        user={user}
        managerId={user.id}
        isManager={true}
        targetUserId={activeChat.user_id}
        chatLabel={activeChat.name || `User ${activeChat.user_id}`}
        chatIcon="👤"
        goBack={() => { setPage("orders"); setActiveChat(null) }}
      />
    )

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.hglow} />
        <div style={{
          ...s.avatar,
          background: myConfig
            ? `linear-gradient(135deg, ${myConfig.color}, ${myConfig.color}88)`
            : "linear-gradient(135deg,#6366f1,#8b5cf6)"
        }}>
          {myConfig?.icon ?? "⚙️"}
        </div>
        <div style={s.hinfo}>
          <span style={s.htitle}>{myConfig?.label ?? "Панель управления"}</span>
          <span style={s.hsub}>{isAdmin ? "👑 Администратор" : "💼 Менеджер"}</span>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            style={{ ...s.tab, ...(page === t.id ? s.tabActive : {}) }}
            onClick={() => setPage(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {page === "orders" && (
        <OrdersList
          managerId={user.id}
          onOpenChat={(chat) => { setActiveChat(chat); setPage("chat") }}
        />
      )}
    </div>
  )
}

// ── Список чатов-заказов для менеджера ────────────────────────────

function OrdersList({ managerId, onOpenChat }) {
  const [chats,   setChats]   = useState([])
  const [loading, setLoading] = useState(true)
  const [cache,   setCache]   = useState({})

  useEffect(() => {
    loadChats()
    const timer = setInterval(loadChats, 10000)
    return () => clearInterval(timer)
  }, [])

  const loadChats = async () => {
    try {
      const res  = await fetch(`${API}/billing/chat/orders?manager_id=${managerId}`)
      const data = await res.json()
      const list = data.chats ?? []
      setChats(list)

      // Загружаем имена неизвестных пользователей
      const unknown = list.map(c => c.user_id).filter(id => !cache[id])
      if (unknown.length) {
        const infos = await Promise.all(
          unknown.map(id =>
            fetch(`${API}/billing/chat/user-info?user_id=${id}`)
              .then(r => r.json())
              .then(d => ({ id, ...d }))
              .catch(() => ({ id, name: `User ${id}`, username: "", group: "" }))
          )
        )
        setCache(prev => {
          const up = { ...prev }
          infos.forEach(i => { up[i.id] = i })
          return up
        })
      }
    } catch {}
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <div style={s.spinner} />
    </div>
  )

  if (chats.length === 0) return (
    <div style={s.empty}>
      <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>Заказов пока нет</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6, lineHeight: 1.5 }}>
        Когда пользователи напишут вам — заказы появятся здесь
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px" }}>
      {chats.map(chat => {
        const info = cache[chat.user_id]
        const name = info?.name || `User ${chat.user_id}`
        const grp  = info?.group || ""
        return (
          <button key={chat.user_id} style={s.chatCard}
            onClick={() => onOpenChat({ ...chat, name })}
          >
            <div style={s.chatAvatar}>{name[0]?.toUpperCase() ?? "?"}</div>
            <div style={s.chatInfo}>
              <div style={s.chatName}>
                {name}
                {grp && <span style={s.chatGrp}> · {grp}</span>}
              </div>
              <div style={s.chatLast}>{chat.last_msg?.slice(0, 55) ?? "Нет сообщений"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              {chat.unread > 0 && <div style={s.badge}>{chat.unread}</div>}
              <div style={s.chatTime}>{chat.last_time?.slice(11, 16) ?? ""}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const s = {
  root:   { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:14, padding:"28px 20px 22px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  hglow:  { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)", pointerEvents:"none" },
  avatar: { width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, boxShadow:"0 0 0 3px rgba(99,102,241,0.25)" },
  hinfo:  { display:"flex", flexDirection:"column", gap:3 },
  htitle: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  hsub:   { fontSize:12, color:"rgba(255,255,255,0.4)" },
  tabs:   { display:"flex", gap:6, padding:"12px 14px", overflowX:"auto", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  tab:    { padding:"8px 16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },
  tabActive: { background:"rgba(99,102,241,0.15)", borderColor:"rgba(99,102,241,0.3)", color:"#818cf8", fontWeight:600 },
  chatCard: { display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"12px 14px", cursor:"pointer", width:"100%", textAlign:"left", boxSizing:"border-box" },
  chatAvatar: { width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:"#fff", flexShrink:0 },
  chatInfo: { flex:1, overflow:"hidden" },
  chatName: { fontSize:14.5, fontWeight:600, color:"#f1f5f9" },
  chatGrp:  { fontSize:12, color:"rgba(255,255,255,0.35)", fontWeight:400 },
  chatLast: { fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  chatTime: { fontSize:11, color:"rgba(255,255,255,0.25)" },
  badge:    { background:"#6366f1", borderRadius:10, padding:"2px 7px", fontSize:11, fontWeight:700, color:"#fff" },
  spinner:  { width:28, height:28, border:"2.5px solid rgba(255,255,255,0.08)", borderTop:"2.5px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
  empty:    { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:"60px 24px", textAlign:"center" },
}