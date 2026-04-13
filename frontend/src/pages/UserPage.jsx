import { useState, useEffect } from "react"
import { API, MANAGER_ID, PRINT_MANAGER_ID } from "../App"
import Tutor     from "./Tutor"
import Profile   from "./Profile"
import Wallet    from "./Wallet"
import Education from "./Education"
import Focus     from "./Focus"
import OrderChat from "./OrderChat"

// Конфиги чатов с менеджерами
const CHAT_CONFIGS = {
  presentation: { managerId: MANAGER_ID,       icon: "🎞️", label: "Презентации" },
  print:        { managerId: PRINT_MANAGER_ID, icon: "🖨️", label: "Распечатка"  },
}

const ITEMS = [
  { id: "tutor",     icon: "🎓", label: "ИИ-репетитор", desc: "Задай вопрос — получи ответ",  color: "#6366f1", locked: true  },
  { id: "education", icon: "📚", label: "Образование",   desc: "Лекции и расписание",           color: "#0ea5e9", locked: true  },
  { id: "focus",     icon: "🎯", label: "Фокус",         desc: "Музыка и помодоро",             color: "#f59e0b", locked: true  },
  { id: "services",  icon: "📝", label: "Услуги",        desc: "Мои заказы и чаты",             color: "#10b981", locked: false },
  { id: "wallet",    icon: "💼", label: "Кошелёк",       desc: "Баланс и тарифы",               color: "#f59e0b", locked: false },
  { id: "profile",   icon: "👤", label: "Профиль",       desc: "Данные и подписка",             color: "#ec4899", locked: false },
]

export default function UserPage({ user, subscription, reloadSub }) {
  const [page,     setPage]     = useState("home")
  const [pressed,  setPressed]  = useState(null)
  const [flash,    setFlash]    = useState(null)
  const [chatType, setChatType] = useState(null)
  const [prefill,  setPrefill]  = useState(null)

  const hasSub = subscription?.active === true

  const handleCard = (item) => {
    if (item.locked && !hasSub) {
      setFlash(item.id)
      setTimeout(() => setFlash(null), 600)
      return
    }
    setPage(item.id)
  }

  // Открыть чат конкретного типа (presentation | print)
  const openChat = (type, msg = null) => {
    setChatType(type)
    setPrefill(msg)
    setPage("order_chat")
  }

  // Страницы
  if (page === "tutor")     return <Tutor     user={user} goBack={() => setPage("home")} />
  if (page === "profile")   return <Profile   user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")    return <Wallet    user={user} goBack={() => setPage("home")} subscription={subscription} reloadSubscription={reloadSub} />
  if (page === "education") return <Education user={user} goBack={() => setPage("home")} />
  if (page === "focus")     return <Focus     goBack={() => setPage("home")} />

  // Раздел «Услуги» — список чатов юзера
  if (page === "services") return (
    <ServicesPage
      user={user}
      goBack={() => setPage("home")}
      onOpenChat={openChat}
    />
  )

  // Полноэкранный чат с менеджером
  if (page === "order_chat") {
    const cfg = CHAT_CONFIGS[chatType] ?? CHAT_CONFIGS.presentation
    return (
      <OrderChat
        user={user}
        managerId={cfg.managerId}
        chatLabel={cfg.label}
        chatIcon={cfg.icon}
        prefill={prefill}
        goBack={() => { setPage("services"); setPrefill(null) }}
      />
    )
  }

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

      {/* Баннер без подписки */}
      {!hasSub && (
        <div style={s.banner} onClick={() => setPage("wallet")}>
          <div style={s.bannerGlow} />
          <div style={s.bannerL}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <div style={s.bannerTitle}>Нет активного тарифа</div>
              <div style={s.bannerDesc}>Доступны Услуги, Кошелёк, Профиль</div>
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
              onPointerUp={()   => { setPressed(null); handleCard(item) }}
              onPointerLeave={()=> setPressed(null)}
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

// ── ServicesPage — список чатов пользователя с менеджерами ────────

function ServicesPage({ user, goBack, onOpenChat }) {
  const [chats,   setChats]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const results = await Promise.all(
        Object.entries(CHAT_CONFIGS).map(async ([type, cfg]) => {
          try {
            const r    = await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${cfg.managerId}`)
            const d    = await r.json()
            const msgs = d.messages ?? []
            return { type, cfg, msgs, lastMsg: msgs[msgs.length - 1] ?? null }
          } catch {
            return { type, cfg, msgs: [], lastMsg: null }
          }
        })
      )
      setChats(results)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={sv.root}>
      {/* Header */}
      <div style={sv.header}>
        <button style={sv.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={sv.headerInfo}>
          <span style={sv.headerTitle}>📝 Услуги</span>
          <span style={sv.headerSub}>Мои заказы и чаты</span>
        </div>
      </div>

      <div style={sv.body}>
        {/* Описание услуг */}
        <div style={sv.infoCard}>
          <div style={sv.infoTitle}>Как это работает?</div>
          <div style={sv.infoText}>Нажмите на карточку — откроется чат с менеджером. Опишите заказ и отправьте. Менеджер ответит и пришлёт результат.</div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.08)", borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : chats.map(({ type, cfg, lastMsg }) => (
          <button key={type} style={sv.card} onClick={() => onOpenChat(type)}>
            {/* Иконка */}
            <div style={{ ...sv.cardIcon, background: type === "presentation" ? "rgba(99,102,241,0.2)" : "rgba(16,185,129,0.2)" }}>
              <span style={{ fontSize: 24 }}>{cfg.icon}</span>
            </div>
            {/* Инфо */}
            <div style={sv.cardBody}>
              <div style={sv.cardTitle}>{cfg.label}</div>
              <div style={sv.cardPreview}>
                {lastMsg
                  ? (lastMsg.text
                    ? (lastMsg.text.length > 45 ? lastMsg.text.slice(0, 45) + "…" : lastMsg.text)
                    : "📎 Файл")
                  : type === "presentation"
                    ? "От 250₽ · Срок: 1 день"
                    : "1 страница — 10₽ · ДАС №6"
                }
              </div>
            </div>
            {/* Время последнего сообщения */}
            {lastMsg && (
              <div style={sv.cardTime}>{lastMsg.created_at?.slice(11, 16)}</div>
            )}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", padding: "0 0 32px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 14, padding: "28px 20px 22px", background: "linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  hglow: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)", pointerEvents: "none" },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "#fff", flexShrink: 0, boxShadow: "0 0 0 3px rgba(99,102,241,0.25)" },
  htxt: { display: "flex", flexDirection: "column", gap: 3 },
  greet: { fontSize: 18, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.3px" },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  banner: { margin: "14px 16px 0", background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.05))", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", position: "relative", overflow: "hidden" },
  bannerGlow: { position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)", pointerEvents: "none" },
  bannerL: { display: "flex", alignItems: "center", gap: 12 },
  bannerTitle: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  bannerDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  bannerBtn: { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8", fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 10, flexShrink: 0 },
  grid: { display: "flex", flexDirection: "column", gap: 10, padding: "16px 16px 0" },
  card: { display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box", transition: "transform 0.12s,border-color 0.15s,background 0.15s,opacity 0.2s" },
  iw: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cb: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  cl: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.2px" },
  cd: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  badge: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28, fontSize: 12, color: "rgba(255,255,255,0.2)" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" },
}

const sv = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 18px", background: "linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  body: { display: "flex", flexDirection: "column", gap: 12, padding: "16px" },
  infoCard: { background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "14px 16px" },
  infoTitle: { fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 6 },
  infoText: { fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 },
  card: { display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box", transition: "background 0.15s" },
  cardIcon: { width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  cardPreview: { fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 },
  cardTime: { fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0, marginRight: 4 },
}