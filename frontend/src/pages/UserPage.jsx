import { useState } from "react"
import Tutor from "./Tutor"
import Profile from "./Profile"

const menuItems = [
  {
    id: "tutor",
    icon: "🎓",
    label: "ИИ-репетитор",
    desc: "Задай вопрос — получи ответ",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.3)",
  },
  {
    id: "education",
    icon: "📚",
    label: "Образование",
    desc: "Лекции и расписание",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.3)",
  },
  {
    id: "focus",
    icon: "🎯",
    label: "Фокус",
    desc: "Музыка и помодоро",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    id: "services",
    icon: "📝",
    label: "Услуги",
    desc: "Распечатка и заказы",
    color: "#10b981",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    id: "profile",
    icon: "👤",
    label: "Профиль",
    desc: "Данные и подписка",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.3)",
  },
]

export default function UserPage({ user }) {
  const [page, setPage] = useState("home")
  const [pressed, setPressed] = useState(null)

  if (page === "tutor") return <Tutor user={user} goBack={() => setPage("home")} />
  if (page === "profile") return <Profile user={user} goBack={() => setPage("home")} />

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerGlow} />
        <div style={styles.avatar}>
          {user.first_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={styles.headerText}>
          <span style={styles.greeting}>Привет, {user.first_name} 👋</span>
          <span style={styles.subtitle}>Чем займёмся сегодня?</span>
        </div>
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            style={{
              ...styles.card,
              ...(pressed === item.id ? styles.cardPressed : {}),
              borderColor: pressed === item.id ? item.color : "rgba(255,255,255,0.07)",
            }}
            onPointerDown={() => setPressed(item.id)}
            onPointerUp={() => { setPressed(null); setPage(item.id) }}
            onPointerLeave={() => setPressed(null)}
          >
            <div style={{ ...styles.iconWrap, background: item.glow }}>
              <span style={styles.icon}>{item.icon}</span>
            </div>
            <div style={styles.cardBody}>
              <span style={styles.cardLabel}>{item.label}</span>
              <span style={styles.cardDesc}>{item.desc}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={styles.arrow}>
              <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>

      {/* Bottom badge */}
      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        Math Tutor · powered by AI
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0f1e",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 32px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "28px 20px 24px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 600,
    color: "#fff",
    flexShrink: 0,
    boxShadow: "0 0 0 3px rgba(99,102,241,0.25)",
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 600,
    color: "#f1f5f9",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "20px 16px 0",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "transform 0.12s ease, border-color 0.12s ease",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
  },
  cardPressed: {
    transform: "scale(0.97)",
    background: "rgba(255,255,255,0.07)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f1f5f9",
    letterSpacing: "-0.2px",
  },
  cardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  arrow: {
    flexShrink: 0,
  },
  badge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 28,
    fontSize: 12,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.3px",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    display: "inline-block",
  },
}