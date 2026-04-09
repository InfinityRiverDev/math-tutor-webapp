import { useState, useEffect } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function Education({ user, goBack }) {
  const [view, setView] = useState("menu") // menu | schedule | lectures | subject

  if (view === "schedule") return <Schedule user={user} goBack={() => setView("menu")} />
  if (view === "lectures")  return <Lectures user={user} goBack={() => setView("menu")} />

  return (
    <div style={s.root}>
      <Header title="📚 Образование" sub="Расписание и лекции" onBack={goBack} />
      <div style={s.body}>
        <NavCard icon="📆" title="Расписание" desc="Текущая неделя" color="#0ea5e9" glow="rgba(14,165,233,0.15)" onClick={() => setView("schedule")} />
        <NavCard icon="📖" title="Лекции" desc="PDF-материалы по предметам" color="#6366f1" glow="rgba(99,102,241,0.15)" onClick={() => setView("lectures")} />
      </div>
    </div>
  )
}

// ── Расписание ──────────────────────────────────────────────────

function Schedule({ user, goBack }) {
  const [days, setDays] = useState({})
  const [weekNum, setWeekNum] = useState(null)
  const [targetDate, setTargetDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [dateInput, setDateInput] = useState("")
  const [showDateInput, setShowDateInput] = useState(false)

  useEffect(() => { loadSchedule(targetDate) }, [])

  const loadSchedule = async (date) => {
    setLoading(true)
    try {
      const iso = date.toISOString().split("T")[0]
      const res = await fetch(`${API}/schedule?user_id=${user.id}&date=${iso}`)
      const data = await res.json()
      setDays(data.days ?? {})
      setWeekNum(data.week_num)
    } catch {
      setDays({})
    } finally {
      setLoading(false)
    }
  }

  const navigate = (delta) => {
    const d = new Date(targetDate)
    d.setDate(d.getDate() + delta)
    setTargetDate(d)
    loadSchedule(d)
  }

  const goToday = () => {
    const d = new Date()
    setTargetDate(d)
    loadSchedule(d)
  }

  const handleDateInput = () => {
    const parts = dateInput.split(".")
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      if (!isNaN(d)) { setTargetDate(d); loadSchedule(d); setShowDateInput(false); setDateInput("") }
    }
  }

  const DAYS_RU = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"]
  const dayNum = targetDate.getDay() === 0 ? 7 : targetDate.getDay() // 1=пн..7=вс
  const lessons = days[dayNum] ?? []
  const isToday = new Date().toDateString() === targetDate.toDateString()
  const dateStr = targetDate.toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "numeric" })

  return (
    <div style={s.root}>
      <Header title="📆 Расписание" sub={weekNum ? `Неделя №${weekNum}` : ""} onBack={goBack} />

      {/* Навигация по дням */}
      <div style={sched.nav}>
        <button style={sched.navBtn} onClick={() => navigate(-1)}>◀️</button>
        <div style={sched.navCenter} onClick={() => setShowDateInput(v => !v)}>
          <div style={sched.navDay}>{DAYS_RU[targetDate.getDay()]}</div>
          <div style={sched.navDate}>{dateStr} {isToday ? "📍" : ""}</div>
        </div>
        <button style={sched.navBtn} onClick={() => navigate(1)}>▶️</button>
      </div>

      {!isToday && (
        <button style={sched.todayBtn} onClick={goToday}>Сегодня</button>
      )}

      {showDateInput && (
        <div style={sched.dateInputRow}>
          <input
            value={dateInput} onChange={e => setDateInput(e.target.value)}
            placeholder="ДД.ММ.ГГГГ" style={sched.dateInput}
          />
          <button style={sched.dateInputBtn} onClick={handleDateInput}>→</button>
        </div>
      )}

      <div style={{ padding: "0 16px 24px" }}>
        {loading ? (
          <div style={sched.loading}><Spinner /></div>
        ) : lessons.length === 0 ? (
          <div style={sched.empty}>📭 Занятий нет</div>
        ) : (
          lessons.map((lesson, i) => (
            <div key={i} style={sched.card}>
              <div style={sched.cardTime}>{lesson._time_start}–{lesson._time_end}</div>
              <div style={sched.cardBody}>
                <div style={sched.cardSlot}>{lesson._slot_num} пара {lesson.idk_lesson_abbr ? `· ${lesson.idk_lesson_abbr}` : ""}</div>
                <div style={sched.cardSubj}>{lesson.id_discipline_name}</div>
                {lesson.id_e_fio && <div style={sched.cardMeta}>👤 {lesson.id_e_fio}</div>}
                {lesson.id_premises_name && <div style={sched.cardMeta}>🚪 {lesson.id_premises_name}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Лекции ──────────────────────────────────────────────────────

function Lectures({ user, goBack }) {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/lectures/subjects`).then(r => r.json()).then(d => {
      setSubjects(d.subjects ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const openSubject = async (subj) => {
    setSelectedSubject(subj)
    const res = await fetch(`${API}/lectures/by-subject/${subj._id}`)
    const d = await res.json()
    setLectures(d.lectures ?? [])
  }

  const downloadLecture = async (lec) => {
    window.Telegram?.WebApp?.openLink(`${API}/lectures/file/${lec._id}`)
  }

  if (selectedSubject) return (
    <div style={s.root}>
      <Header title={selectedSubject.name} sub="Список лекций" onBack={() => setSelectedSubject(null)} />
      <div style={s.body}>
        {lectures.length === 0
          ? <div style={sched.empty}>📭 Лекций пока нет</div>
          : lectures.map(lec => (
            <button key={lec._id} style={lect.card} onClick={() => downloadLecture(lec)}>
              <span style={lect.icon}>📄</span>
              <span style={lect.name}>{lec.title}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v9M4 7l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))
        }
      </div>
    </div>
  )

  return (
    <div style={s.root}>
      <Header title="📖 Лекции" sub="Выберите предмет" onBack={goBack} />
      <div style={s.body}>
        {loading ? <div style={sched.loading}><Spinner /></div>
          : subjects.length === 0
          ? <div style={sched.empty}>📭 Предметов пока нет</div>
          : subjects.map(subj => (
            <NavCard key={subj._id} icon="📘" title={subj.name} desc="Нажмите чтобы открыть" color="#6366f1" glow="rgba(99,102,241,0.15)" onClick={() => openSubject(subj)} />
          ))
        }
      </div>
    </div>
  )
}

// ── Переиспользуемые компоненты ─────────────────────────────────

function NavCard({ icon, title, desc, color, glow, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button style={{
      ...s.navCard,
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
        <span style={s.cardLabel}>{title}</span>
        <span style={s.cardDesc}>{desc}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function Header({ title, sub, onBack }) {
  return (
    <div style={s.header}>
      <button style={s.backBtn} onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={s.headerInfo}>
        <span style={s.headerTitle}>{title}</span>
        {sub && <span style={s.headerSub}>{sub}</span>}
      </div>
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.08)", borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
}

const sched = {
  nav: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  navBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, fontSize: 16, padding: "8px 12px", cursor: "pointer",
  },
  navCenter: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    cursor: "pointer",
  },
  navDay: { fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  navDate: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  todayBtn: {
    margin: "8px 16px 0", padding: "8px",
    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 10, color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  dateInputRow: { display: "flex", gap: 8, padding: "8px 16px 0" },
  dateInput: {
    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "9px 12px", color: "#f1f5f9", fontSize: 14, outline: "none",
  },
  dateInputBtn: {
    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
    color: "#818cf8", borderRadius: 10, padding: "9px 14px", fontSize: 16, cursor: "pointer",
  },
  card: {
    display: "flex", gap: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "14px 16px",
    marginTop: 10,
  },
  cardTime: { fontSize: 12, color: "#6366f1", fontWeight: 700, minWidth: 70, paddingTop: 2 },
  cardBody: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  cardSlot: { fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" },
  cardSubj: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  cardMeta: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  loading: { display: "flex", justifyContent: "center", paddingTop: 40 },
  empty: { textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "50px 0", fontSize: 15 },
}

const lect = {
  card: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "14px 16px", cursor: "pointer", width: "100%", textAlign: "left",
  },
  icon: { fontSize: 22, flexShrink: 0 },
  name: { flex: 1, fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
}

const s = {
  root: {
    minHeight: "100vh", background: "#0a0f1e",
    display: "flex", flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 12,
    padding: "20px 20px 18px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  body: { display: "flex", flexDirection: "column", gap: 10, padding: "16px 16px" },
  navCard: {
    display: "flex", alignItems: "center", gap: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "14px 16px",
    cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box",
    transition: "transform 0.12s ease, border-color 0.12s ease, background 0.12s ease",
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
}