import { useState, useEffect } from "react"
import { API, ADMIN_IDS, MANAGER_IDS, MANAGER_ID, PRINT_MANAGER_ID } from "../App"
import OrderChat from "./OrderChat"
import AdminStats from "./AdminStats"

// Конфиги: кто за что отвечает
const MANAGER_CONFIGS = {
  [MANAGER_ID]:       { icon: "🎞️", label: "Презентации", color: "#6366f1" },
  [PRINT_MANAGER_ID]: { icon: "🖨️", label: "Распечатка",  color: "#10b981" },
}

export default function AdminPage({ user, subscription, reloadSub }) {
  const isAdmin = ADMIN_IDS.includes(user.id)
  const myConfig = MANAGER_CONFIGS[user.id]

  const [page, setPage] = useState("orders")  // orders | stats | chat
  const [activeChat, setActiveChat] = useState(null)

  const TABS = []
  if (true)    TABS.push({ id: "orders", label: `${myConfig?.icon ?? "📋"} Заказы` })
  if (isAdmin) TABS.push({ id: "stats",  label: "📊 Статистика" })

  if (page === "stats") {
    return <AdminStats goBack={() => setPage("orders")} user={user} />
  }

  if (page === "chat" && activeChat) {
    return (
      <OrderChat
        user={user}
        managerId={user.id}         // менеджер видит чат со своей стороны
        chatLabel={`${activeChat.name || `User ${activeChat.user_id}`}`}
        chatIcon="👤"
        isManager={true}
        targetUserId={activeChat.user_id}
        goBack={() => { setPage("orders"); setActiveChat(null) }}
      />
    )
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={{ ...s.avatar, background: myConfig ? `linear-gradient(135deg, ${myConfig.color}, ${myConfig.color}88)` : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          {myConfig?.icon ?? "⚙️"}
        </div>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>{myConfig?.label ?? "Панель"}</span>
          <span style={s.headerSub}>{isAdmin ? "👑 Администратор" : "💼 Менеджер"}</span>
        </div>
      </div>

      {/* Tabs */}
      {TABS.length > 1 && (
        <div style={s.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(page === t.id ? s.tabActive : {}) }}
              onClick={() => setPage(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Список заказов */}
      <OrdersList
        managerId={user.id}
        onOpenChat={(chat) => { setActiveChat(chat); setPage("chat") }}
      />
    </div>
  )
}

// ── Список всех чатов-заказов ─────────────────────────────────────

function OrdersList({ managerId, onOpenChat }) {
  const [chats,   setChats]   = useState([])
  const [loading, setLoading] = useState(true)
  const [userInfoCache, setUserInfoCache] = useState({})

  useEffect(() => {
    loadChats()
    const interval = setInterval(loadChats, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadChats = async () => {
    try {
      const res  = await fetch(`${API}/billing/chat/orders?manager_id=${managerId}`)
      const data = await res.json()
      const list = data.chats ?? []
      setChats(list)
      // Загружаем инфо по пользователям
      const unknownIds = list.map(c => c.user_id).filter(id => !userInfoCache[id])
      if (unknownIds.length > 0) {
        const infos = await Promise.all(
          unknownIds.map(id =>
            fetch(`${API}/billing/chat/user-info?user_id=${id}`)
              .then(r => r.json())
              .then(d => ({ id, ...d }))
              .catch(() => ({ id, name: `User ${id}`, username: "" }))
          )
        )
        setUserInfoCache(prev => {
          const upd = { ...prev }
          infos.forEach(i => { upd[i.id] = i })
          return upd
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
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>Заказов пока нет</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
        Заказы появятся здесь, когда пользователи напишут вам
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 14px" }}>
      {chats.map(chat => {
        const info = userInfoCache[chat.user_id]
        const name = info?.name || `User ${chat.user_id}`
        const group = info?.group || ""
        return (
          <button
            key={chat.user_id}
            style={s.chatCard}
            onClick={() => onOpenChat({ ...chat, name })}
          >
            <div style={s.chatAvatar}>
              {name[0]?.toUpperCase() ?? "?"}
            </div>
            <div style={s.chatInfo}>
              <div style={s.chatName}>
                {name}
                {group && <span style={s.chatGroup}> · {group}</span>}
              </div>
              <div style={s.chatLast}>
                {chat.last_msg?.slice(0, 55) ?? "Нет сообщений"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              {chat.unread > 0 && (
                <div style={s.badge}>{chat.unread}</div>
              )}
              <div style={s.chatTime}>
                {chat.last_time?.slice(11, 16) ?? ""}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 14,
            padding: "28px 20px 22px", background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)" },
  headerGlow: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" },
  avatar: { width: 48, height: 48, borderRadius: "50%", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
            boxShadow: "0 0 0 3px rgba(99,102,241,0.25)" },
  headerInfo: { display: "flex", flexDirection: "column", gap: 3 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  tabs: { display: "flex", gap: 6, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  tab: { padding: "8px 16px", background: "rgba(255,255,255,0.04)",
         border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20,
         color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" },
  tabActive: { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.3)",
               color: "#818cf8", fontWeight: 600 },
  chatCard: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px",
              cursor: "pointer", width: "100%", textAlign: "left", boxSizing: "border-box",
              marginBottom: 6 },
  chatAvatar: { width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 },
  chatInfo: { flex: 1, overflow: "hidden" },
  chatName: { fontSize: 14.5, fontWeight: 600, color: "#f1f5f9" },
  chatGroup: { fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 400 },
  chatLast: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  chatTime: { fontSize: 11, color: "rgba(255,255,255,0.25)" },
  badge: { background: "#6366f1", borderRadius: 10, padding: "2px 7px",
           fontSize: 11, fontWeight: 700, color: "#fff" },
  spinner: { width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.08)",
             borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
           flex: 1, padding: "60px 24px", textAlign: "center" },
}