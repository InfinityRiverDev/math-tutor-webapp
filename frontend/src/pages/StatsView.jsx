import { useState, useEffect } from "react"
import { API } from "../App"

export default function StatsView({ goBack, user }) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        // Загружаем баланс/подписку и профиль параллельно
        const [statusRes, profileRes] = await Promise.all([
          fetch(`${API}/billing/status?user_id=${user.id}`),
          fetch(`${API}/user/${user.id}`),
        ])
        const status  = await statusRes.json()
        const profile = await profileRes.json()
        setStats({ status, profile: profile.user })
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const sub = stats?.status
  const xp  = stats?.profile?.xp ?? 0

  // Уровни XP
  const LEVELS = [
    [0,    "🌱 Новичок"],
    [50,   "📘 Студент"],
    [150,  "✏️ Практик"],
    [300,  "🧮 Математик"],
    [600,  "🎓 Знаток"],
    [1000, "🏆 Профессор"],
    [2000, "🌟 Легенда"],
  ]
  let levelName = LEVELS[0][1], levelIdx = 0, nextThreshold = 50
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i][0]) { levelName = LEVELS[i][1]; levelIdx = i; nextThreshold = LEVELS[i+1]?.[0] ?? null }
  }
  const xpToNext = nextThreshold ? nextThreshold - xp : 0
  const barFilled = nextThreshold
    ? Math.min(8, Math.round(8 * (xp - LEVELS[levelIdx][0]) / (nextThreshold - LEVELS[levelIdx][0])))
    : 8
  const bar = "🟦".repeat(barFilled) + "⬜".repeat(8 - barFilled)

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.headerGlow} />
        <button style={s.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>📊 Статистика</span>
          <span style={s.headerSub}>Твои достижения</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:32, height:32, border:"2.5px solid rgba(255,255,255,0.08)", borderTop:"2.5px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        </div>
      ) : !stats ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"60px 16px" }}>
          ❌ Не удалось загрузить статистику
        </div>
      ) : (
        <div style={s.body}>
          {/* XP карточка */}
          <div style={s.xpCard}>
            <div style={s.xpGlow} />
            <div style={s.xpLabel}>Уровень</div>
            <div style={s.xpLevel}>{levelName}</div>
            <div style={s.xpBar}>{bar}</div>
            <div style={s.xpRow}>
              <span style={s.xpValue}>⭐ {xp} XP</span>
              {xpToNext > 0 && <span style={s.xpNext}>до следующего: {xpToNext} XP</span>}
              {!nextThreshold && <span style={s.xpNext}>🌟 Максимальный уровень!</span>}
            </div>
          </div>

          {/* Подписка */}
          <div style={s.card}>
            <div style={s.cardTitle}>💳 Подписка</div>
            {sub?.active ? (
              <>
                <div style={s.cardRow}>
                  <span style={s.cardLabel}>Тариф</span>
                  <span style={{ ...s.cardVal, color:"#10b981" }}>{sub.plan_name}</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardLabel}>Истекает</span>
                  <span style={s.cardVal}>{new Date(sub.expires_at).toLocaleDateString("ru")}</span>
                </div>
                <div style={s.cardRow}>
                  <span style={s.cardLabel}>Осталось</span>
                  <span style={s.cardVal}>{sub.days_left} дней</span>
                </div>
              </>
            ) : (
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>🔴 Нет активной подписки</div>
            )}
          </div>

          {/* Баланс */}
          <div style={s.card}>
            <div style={s.cardTitle}>💰 Кошелёк</div>
            <div style={s.cardRow}>
              <span style={s.cardLabel}>Баланс</span>
              <span style={{ ...s.cardVal, color:"#f59e0b", fontWeight:700 }}>{(sub?.balance ?? 0).toFixed(2)}₽</span>
            </div>
          </div>

          {/* Профиль */}
          <div style={s.card}>
            <div style={s.cardTitle}>👤 Профиль</div>
            {[
              { label:"Группа",    val: stats.profile?.group_number || "—" },
              { label:"Институт",  val: stats.profile?.institute    || "—" },
              { label:"Логин",     val: stats.profile?.knrtu_login  || "—" },
            ].map(r => (
              <div key={r.label} style={s.cardRow}>
                <span style={s.cardLabel}>{r.label}</span>
                <span style={s.cardVal}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* О системе XP */}
          <div style={{ background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.7 }}>
              <b style={{color:"#818cf8"}}>Как зарабатывать XP:</b><br/>
              🎓 Вопрос репетитору +5 XP<br/>
              ✍️ Практика +10 XP<br/>
              📖 Лекция +4 XP<br/>
              📍 Отметка на паре +15 XP<br/>
              💳 Пополнение кошелька +10 XP
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  headerGlow: { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,0.2) 0%,transparent 70%)", pointerEvents:"none" },
  backBtn: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  headerInfo: { display:"flex", flexDirection:"column", gap:2 },
  headerTitle: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  headerSub: { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body: { display:"flex", flexDirection:"column", gap:12, padding:"16px" },
  xpCard: { position:"relative", overflow:"hidden", background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(99,102,241,0.06))", border:"1px solid rgba(99,102,241,0.3)", borderRadius:20, padding:"22px 20px", display:"flex", flexDirection:"column", gap:8 },
  xpGlow: { position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)", pointerEvents:"none" },
  xpLabel: { fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.5px" },
  xpLevel: { fontSize:22, fontWeight:700, color:"#f1f5f9" },
  xpBar: { fontSize:16, letterSpacing:2 },
  xpRow: { display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:4 },
  xpValue: { fontSize:18, fontWeight:800, color:"#818cf8" },
  xpNext: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  card: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"16px", display:"flex", flexDirection:"column", gap:10 },
  cardTitle: { fontSize:14, fontWeight:700, color:"#f1f5f9", paddingBottom:6, borderBottom:"1px solid rgba(255,255,255,0.06)" },
  cardRow: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  cardLabel: { fontSize:13, color:"rgba(255,255,255,0.4)" },
  cardVal: { fontSize:13, fontWeight:600, color:"#f1f5f9" },
}