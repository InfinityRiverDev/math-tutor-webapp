import { useState } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function AdminPage({ user }) {
  const [userCount, setUserCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [lectureModal, setLectureModal] = useState(false)

  const fetchUserCount = async () => {
    setLoadingCount(true)
    try {
      const res = await fetch(`${API}/admin/users/count`)
      const data = await res.json()
      setUserCount(data.count ?? data.total ?? "—")
    } catch {
      setUserCount("Ошибка")
    } finally {
      setLoadingCount(false)
    }
  }

  const actions = [
    {
      icon: "👥",
      label: "Кол-во пользователей",
      desc: "Статистика регистраций",
      color: "#6366f1",
      glow: "rgba(99,102,241,0.15)",
      onClick: fetchUserCount,
    },
    {
      icon: "📝",
      label: "Добавить лекцию",
      desc: "Загрузить новый материал",
      color: "#0ea5e9",
      glow: "rgba(14,165,233,0.15)",
      onClick: () => setLectureModal(true),
    },
  ]

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.adminBadge}>⚙️</div>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>Админ-панель</span>
          <span style={s.headerSub}>@{user.username || user.first_name}</span>
        </div>
        <div style={s.adminTag}>ADMIN</div>
      </div>

      {/* Stats card */}
      {userCount !== null && (
        <div style={s.statsCard}>
          <div style={s.statsGlow} />
          <span style={s.statsLabel}>Всего пользователей</span>
          <span style={s.statsValue}>{userCount}</span>
          <span style={s.statsHint}>за всё время</span>
        </div>
      )}

      {/* Actions */}
      <div style={s.body}>
        <span style={s.sectionTitle}>Действия</span>
        {actions.map((a, i) => (
          <ActionCard key={i} {...a} />
        ))}
      </div>

      {/* Lecture modal placeholder */}
      {lectureModal && (
        <div style={s.overlay} onClick={() => setLectureModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 8px", fontSize: 18 }}>📝 Добавить лекцию</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 20px" }}>Функция в разработке</p>
            <button style={s.modalBtn} onClick={() => setLectureModal(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({ icon, label, desc, color, glow, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      style={{
        ...s.card,
        borderColor: pressed ? color : "rgba(255,255,255,0.07)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        background: pressed ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick() }}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{ ...s.iconWrap, background: glow }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={s.cardBody}>
        <span style={s.cardLabel}>{label}</span>
        <span style={s.cardDesc}>{desc}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0f1e",
    display: "flex", flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 12,
    padding: "24px 20px 20px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute", top: -60, right: -40,
    width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  adminBadge: {
    width: 48, height: 48, borderRadius: "50%",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, flexShrink: 0,
    boxShadow: "0 0 0 3px rgba(245,158,11,0.25)",
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  adminTag: {
    background: "rgba(245,158,11,0.15)",
    border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b",
    fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    padding: "4px 8px", borderRadius: 6,
  },
  statsCard: {
    position: "relative", overflow: "hidden",
    margin: "20px 16px 0",
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 18, padding: "20px 20px",
    display: "flex", flexDirection: "column", gap: 4,
  },
  statsGlow: {
    position: "absolute", top: -30, right: -30,
    width: 100, height: 100, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  statsLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  statsValue: { fontSize: 40, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px", lineHeight: 1 },
  statsHint: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  body: { display: "flex", flexDirection: "column", gap: 10, padding: "24px 16px 0" },
  sectionTitle: { fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 },
  card: {
    display: "flex", alignItems: "center", gap: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "14px 16px",
    cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box",
    transition: "transform 0.12s ease, border-color 0.12s ease, background 0.12s ease",
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "#131929",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px 20px 0 0",
    padding: "28px 24px 40px",
    width: "100%", maxWidth: 480,
  },
  modalBtn: {
    width: "100%", padding: "14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, color: "#f1f5f9",
    fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
}