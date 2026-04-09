import { useEffect, useState } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function Profile({ user, goBack, subscription }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetch(`${API}/user/${user.id}`)
      .then(res => res.json())
      .then(data => setProfile(data.user))
  }, [user.id])

  if (!profile) return (
    <div style={s.root}>
      <div style={s.loader}>
        <div style={s.loaderSpinner} />
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Загрузка...</span>
      </div>
    </div>
  )

  const hasActiveSub = subscription?.active === true
  const sub = subscription

  const fields = [
    { icon: "📝", label: "Имя", value: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "—" },
    { icon: "🏛", label: "Институт", value: profile.institute || "—" },
    { icon: "📚", label: "Группа", value: profile.group_number || "—" },
    { icon: "🔑", label: "Логин КНИТУ", value: profile.knrtu_login || "—" },
    { icon: "📅", label: "Дата регистрации", value: profile.registered_at?.split("T")[0] || "—" },
  ]

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <button style={s.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>Профиль</span>
          <span style={s.headerSub}>Личные данные</span>
        </div>
      </div>

      {/* Avatar */}
      <div style={s.avatarBlock}>
        <div style={s.avatarRing}>
          <div style={s.avatar}>{profile.first_name?.[0]?.toUpperCase() ?? "?"}</div>
        </div>
        <span style={s.avatarName}>{`${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.first_name}</span>
        <span style={s.avatarGroup}>{profile.group_number ? `Группа ${profile.group_number}` : "Студент"}</span>
      </div>

      {/* Подписка */}
      <div style={{ padding: "0 16px 4px" }}>
        <div style={{
          ...s.subCard,
          borderColor: hasActiveSub ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)",
          background: hasActiveSub ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.03)",
        }}>
          {hasActiveSub ? (
            <>
              <div style={s.subRow}>
                <span style={s.subDot} />
                <span style={s.subText}>Тариф: <b>{sub.plan_name}</b></span>
              </div>
              <div style={s.subExpires}>
                ⏳ До {new Date(sub.expires_at).toLocaleDateString("ru")}
                {" · "}
                {Math.max(0, Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000))} дн.
              </div>
            </>
          ) : (
            <div style={s.subInactive}>🔴 Нет активного тарифа</div>
          )}
        </div>
      </div>

      {/* Поля */}
      <div style={s.fields}>
        {fields.map((f, i) => (
          <div key={i} style={s.field}>
            <span style={s.fieldIcon}>{f.icon}</span>
            <div style={s.fieldBody}>
              <span style={s.fieldLabel}>{f.label}</span>
              <span style={s.fieldValue}>{f.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  loader: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, minHeight: "100vh" },
  loaderSpinner: { width: 32, height: 32, border: "2.5px solid rgba(255,255,255,0.08)", borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: {
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 12,
    padding: "20px 20px 18px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)", pointerEvents: "none" },
  backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  avatarBlock: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 6 },
  avatarRing: { padding: 3, borderRadius: "50%", background: "linear-gradient(135deg, #ec4899, #6366f1)", marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "#fff", border: "3px solid #0a0f1e" },
  avatarName: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" },
  avatarGroup: { fontSize: 13, color: "rgba(255,255,255,0.35)" },
  subCard: { borderRadius: 14, border: "1px solid", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5, marginBottom: 4 },
  subRow: { display: "flex", alignItems: "center", gap: 8 },
  subDot: { width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 },
  subText: { fontSize: 14, color: "#f1f5f9" },
  subExpires: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  subInactive: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  fields: { display: "flex", flexDirection: "column", gap: 2, padding: "12px 16px" },
  field: { display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" },
  fieldIcon: { fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" },
  fieldBody: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  fieldLabel: { fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" },
  fieldValue: { fontSize: 15, color: "#f1f5f9", fontWeight: 500 },
}