import { useState } from "react"
import Tutor from "./Tutor"
import Profile from "./Profile"
import Wallet from "./Wallet"
import Education from "./Education"
import Services from "./Services"
import Focus from "./Focus"

const menuItems = [
  {
    id: "tutor",
    icon: "🎓",
    label: "ИИ-репетитор",
    desc: "Задай вопрос — получи ответ",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.18)",
    locked: true,
  },
  {
    id: "education",
    icon: "📚",
    label: "Образование",
    desc: "Лекции и расписание",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.18)",
    locked: true,
  },
  {
    id: "focus",
    icon: "🎯",
    label: "Фокус",
    desc: "Музыка и помодоро",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.18)",
    locked: true,
  },
  {
    id: "services",
    icon: "📝",
    label: "Услуги",
    desc: "Распечатка и заказы",
    color: "#10b981",
    glow: "rgba(16,185,129,0.18)",
    locked: false,
  },
  {
    id: "wallet",
    icon: "💼",
    label: "Кошелёк",
    desc: "Баланс и тарифы",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.18)",
    locked: false,
  },
  {
    id: "profile",
    icon: "👤",
    label: "Профиль",
    desc: "Данные и подписка",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.18)",
    locked: false,
  },
]

export default function UserPage({ user, subscription, reloadSubscription }) {
  const [page, setPage] = useState("home")
  const [pressed, setPressed] = useState(null)
  const [lockedFlash, setLockedFlash] = useState(null)

  const hasSubscription = subscription?.active === true

  const handleCardClick = (item) => {
    if (item.locked && !hasSubscription) {
      setLockedFlash(item.id)
      setTimeout(() => setLockedFlash(null), 600)
      return
    }
    setPage(item.id)
  }

  if (page === "tutor")     return <Tutor user={user} goBack={() => setPage("home")} />
  if (page === "profile")   return <Profile user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")    return <Wallet user={user} goBack={() => setPage("home")} subscription={subscription} reloadSubscription={reloadSubscription} />
  if (page === "education") return <Education user={user} goBack={() => setPage("home")} />
  if (page === "services")  return <Services goBack={() => setPage("home")} />
  if (page === "focus")     return <Focus goBack={() => setPage("home")} />

  const subBannerVisible = !hasSubscription

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.avatar}>
          {user.first_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={s.headerText}>
          <span style={s.greeting}>Привет, {user.first_name} 👋</span>
          <span style={s.subtitle}>
            {hasSubscription
              ? `✅ ${subscription.plan_name}`
              : "🔒 Нет активного тарифа"}
          </span>
        </div>
      </div>

      {/* Баннер без подписки */}
      {subBannerVisible && (
        <div style={s.banner} onClick={() => setPage("wallet")}>
          <div style={s.bannerGlow} />
          <div style={s.bannerLeft}>
            <span style={s.bannerIcon}>🔒</span>
            <div>
              <div style={s.bannerTitle}>Нет активного тарифа</div>
              <div style={s.bannerDesc}>Доступны только Услуги и Кошелёк</div>
            </div>
          </div>
          <div style={s.bannerBtn}>Купить →</div>
        </div>
      )}

      {/* Меню */}
      <div style={s.grid}>
        {menuItems.map((item) => {
          const isLocked = item.locked && !hasSubscription
          const isFlashing = lockedFlash === item.id
          return (
            <button
              key={item.id}
              style={{
                ...s.card,
                opacity: isLocked ? 0.52 : 1,
                borderColor: pressed === item.id
                  ? item.color
                  : isFlashing
                  ? "#ef4444"
                  : "rgba(255,255,255,0.07)",
                transform: pressed === item.id ? "scale(0.97)" : "scale(1)",
                background: isFlashing
                  ? "rgba(239,68,68,0.08)"
                  : pressed === item.id
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(255,255,255,0.04)",
              }}
              onPointerDown={() => setPressed(item.id)}
              onPointerUp={() => { setPressed(null); handleCardClick(item) }}
              onPointerLeave={() => setPressed(null)}
            >
              <div style={{ ...s.iconWrap, background: item.glow }}>
                <span style={s.icon}>{isLocked ? "🔒" : item.icon}</span>
              </div>
              <div style={s.cardBody}>
                <span style={s.cardLabel}>{item.label}</span>
                <span style={s.cardDesc}>
                  {isLocked ? "Требуется подписка" : item.desc}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )
        })}
      </div>

      <div style={s.badge}>
        <span style={s.badgeDot} />
        Math Tutor · powered by AI
      </div>
    </div>
  )
}

const s = {
  root: {
    minHeight: "100vh", background: "#0a0f1e",
    display: "flex", flexDirection: "column",
    padding: "0 0 32px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 14,
    padding: "28px 20px 22px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  avatar: {
    width: 48, height: 48, borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 600, color: "#fff", flexShrink: 0,
    boxShadow: "0 0 0 3px rgba(99,102,241,0.25)",
  },
  headerText: { display: "flex", flexDirection: "column", gap: 3 },
  greeting: { fontSize: 18, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.3px" },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  banner: {
    margin: "14px 16px 0",
    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.05))",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 16, padding: "14px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    cursor: "pointer", position: "relative", overflow: "hidden",
  },
  bannerGlow: {
    position: "absolute", top: -20, right: -20,
    width: 80, height: 80, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bannerLeft: { display: "flex", alignItems: "center", gap: 12 },
  bannerIcon: { fontSize: 24 },
  bannerTitle: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  bannerDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  bannerBtn: {
    background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
    color: "#818cf8", fontSize: 13, fontWeight: 600,
    padding: "6px 12px", borderRadius: 10,
    flexShrink: 0,
  },
  grid: { display: "flex", flexDirection: "column", gap: 10, padding: "16px 16px 0" },
  card: {
    display: "flex", alignItems: "center", gap: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "14px 16px",
    cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box",
    transition: "transform 0.12s ease, border-color 0.15s ease, background 0.15s ease, opacity 0.2s",
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  icon: { fontSize: 22 },
  cardBody: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.2px" },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  badge: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 28, fontSize: 12, color: "rgba(255,255,255,0.2)",
  },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" },
}