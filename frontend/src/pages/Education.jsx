import { useState, useEffect, useRef } from "react"
import { API } from "../App"

export default function Education({ user, goBack }) {
  const [view, setView] = useState("menu")

  if (view === "schedule") return <Schedule user={user} goBack={() => setView("menu")} />
  if (view === "lectures") return <Lectures goBack={() => setView("menu")} />

  return (
    <div style={s.root}>
      <Hdr title="📚 Образование" sub="Расписание и лекции" onBack={goBack} />
      <div style={s.body}>
        <NavCard icon="📆" title="Расписание" desc="По дням, листание вперёд-назад"
          color="#0ea5e9" glow="rgba(14,165,233,0.15)" onClick={() => setView("schedule")} />
        <NavCard icon="📖" title="Лекции" desc="PDF-материалы по предметам"
          color="#6366f1" glow="rgba(99,102,241,0.15)" onClick={() => setView("lectures")} />
      </div>
    </div>
  )
}

// ── Расписание ────────────────────────────────────────────────────

function Schedule({ user, goBack }) {
  const [days,          setDays]          = useState({})
  const [weekNum,       setWeekNum]       = useState(null)
  const [targetDate,    setTargetDate]    = useState(new Date())
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [showDateInput, setShowDateInput] = useState(false)
  const [dateInput,     setDateInput]     = useState("")

  // Свайп
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Горизонтальный свайп должен быть больше вертикального
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) navigate(1)   // свайп влево → следующий день
      else        navigate(-1)  // свайп вправо → предыдущий день
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  useEffect(() => { load(new Date()) }, [])

  const load = async (d) => {
    setLoading(true)
    setError(null)
    try {
      const iso = d.toISOString().split("T")[0]
      const r   = await fetch(`${API}/schedule?user_id=${user.id}&date=${iso}`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      if (!data.ok) {
        setError(data.error || "Не удалось загрузить расписание")
        setDays({})
      } else {
        setDays(data.days ?? {})
        setWeekNum(data.week_num)
      }
    } catch (e) {
      setError(`Ошибка соединения: ${e.message}`)
      setDays({})
    } finally {
      setLoading(false)
    }
  }

  const navigate = (delta) => {
    const d = new Date(targetDate)
    d.setDate(d.getDate() + delta)
    setTargetDate(d)
    load(d)
  }

  const goToday = () => {
    const d = new Date()
    setTargetDate(d)
    load(d)
  }

  const applyDateInput = () => {
    const p = dateInput.split(".")
    if (p.length === 3) {
      const d = new Date(`${p[2]}-${p[1]}-${p[0]}`)
      if (!isNaN(d)) {
        setTargetDate(d)
        load(d)
        setShowDateInput(false)
        setDateInput("")
      }
    }
  }

  const DAYS_RU = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"]
  const dayOfWeek = targetDate.getDay()
  const isoWeekday = dayOfWeek === 0 ? 7 : dayOfWeek
  const lessons    = days[String(isoWeekday)] ?? []
  const isToday    = new Date().toDateString() === targetDate.toDateString()
  const dateStr    = targetDate.toLocaleDateString("ru", {day:"2-digit", month:"2-digit", year:"numeric"})

  return (
    <div
      style={s.root}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Hdr title="📆 Расписание" sub={weekNum ? `Неделя №${weekNum}` : ""} onBack={goBack} />

      {/* Навигация */}
      <div style={sc.nav}>
        <button style={sc.navBtn} onClick={() => navigate(-1)}>◀️</button>
        <div style={sc.navCenter} onClick={() => setShowDateInput(v => !v)}>
          <div style={sc.navDay}>{DAYS_RU[dayOfWeek]}{isToday ? " 📍" : ""}</div>
          <div style={sc.navDate}>{dateStr}</div>
        </div>
        <button style={sc.navBtn} onClick={() => navigate(1)}>▶️</button>
      </div>

      {!isToday && (
        <button style={sc.todayBtn} onClick={goToday}>📍 Сегодня</button>
      )}

      {showDateInput && (
        <div style={sc.dateRow}>
          <input value={dateInput} onChange={e => setDateInput(e.target.value)}
            placeholder="ДД.ММ.ГГГГ" style={sc.dateInp} />
          <button style={sc.dateBtn} onClick={applyDateInput}>→</button>
        </div>
      )}

      {/* Подсказка свайпа */}
      <div style={sc.swipeHint}>← свайп для смены дня →</div>

      <div style={{ padding:"0 16px 32px" }}>
        {loading && <div style={sc.center}><Spinner /></div>}

        {!loading && error && (
          <div style={sc.errCard}>
            <div style={sc.errTitle}>⚠️ Не удалось загрузить</div>
            <div style={sc.errText}>{error}</div>
            <button style={sc.retryBtn} onClick={() => load(targetDate)}>Повторить</button>
          </div>
        )}

        {!loading && !error && lessons.length === 0 && (
          <div style={sc.empty}>📭 Занятий нет</div>
        )}

        {!loading && !error && lessons.map((lesson, i) => (
          <div key={i} style={sc.card}>
            <div style={sc.cardLeft}>
              <div style={sc.cardEmoji}>{lesson._emoji || "📌"}</div>
              <div style={sc.cardTime}>{lesson._time_start}<br/>{lesson._time_end}</div>
            </div>
            <div style={sc.cardBody}>
              <div style={sc.cardPara}>
                {lesson._slot_num} пара
                {lesson.idk_lesson_abbr ? ` · ${lesson.idk_lesson_abbr}` : ""}
              </div>
              <div style={sc.cardSubj}>{lesson.id_discipline_name || "—"}</div>
              {lesson.id_e_fio && <div style={sc.cardMeta}>👤 {lesson.id_e_fio}</div>}
              {lesson.id_premises_name && <div style={sc.cardMeta}>🚪 {lesson.id_premises_name}</div>}
              {lesson.note && <div style={sc.cardMeta}>📎 {lesson.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Лекции ────────────────────────────────────────────────────────

function Lectures({ goBack }) {
  const [subjects, setSubjects]       = useState([])
  const [selSubj,  setSelSubj]        = useState(null)
  const [lectures, setLectures]       = useState([])
  const [loading,  setLoading]        = useState(true)
  const [lectLoad, setLectLoad]       = useState(false)
  const [error,    setError]          = useState(null)

  useEffect(() => {
    fetch(`${API}/lectures/subjects`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setSubjects(d.subjects ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const openSubject = async (subj) => {
    setSelSubj(subj)
    setLectLoad(true)
    try {
      const r = await fetch(`${API}/lectures/by-subject/${subj._id}`)
      const d = await r.json()
      setLectures(d.lectures ?? [])
    } catch {
      setLectures([])
    } finally {
      setLectLoad(false)
    }
  }

  const openLecture = (lec) => {
    const url = `${API}/lectures/file/${lec._id}`
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url)
    } else {
      window.open(url, "_blank")
    }
  }

  if (selSubj) return (
    <div style={s.root}>
      <Hdr title={selSubj.name} sub="Список лекций" onBack={() => setSelSubj(null)} />
      <div style={s.body}>
        {lectLoad && <div style={{display:"flex",justifyContent:"center",padding:"30px"}}><Spinner /></div>}
        {!lectLoad && lectures.length === 0 && <div style={sc.empty}>📭 Лекций пока нет</div>}
        {!lectLoad && lectures.map(lec => (
          <button key={lec._id} style={lc.card} onClick={() => openLecture(lec)}>
            <span style={{ fontSize:22, flexShrink:0 }}>📄</span>
            <span style={lc.name}>{lec.title}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v9M4 7l4 4 4-4" stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={s.root}>
      <Hdr title="📖 Лекции" sub="Выберите предмет" onBack={goBack} />
      <div style={s.body}>
        {loading && <div style={{display:"flex",justifyContent:"center",padding:"30px"}}><Spinner /></div>}
        {!loading && error && <div style={sc.errCard}><div style={sc.errText}>❌ {error}</div></div>}
        {!loading && !error && subjects.length === 0 && <div style={sc.empty}>📭 Предметов пока нет</div>}
        {!loading && !error && subjects.map(subj => (
          <NavCard key={subj._id} icon="📘" title={subj.name} desc="Нажмите чтобы открыть"
            color="#6366f1" glow="rgba(99,102,241,0.15)" onClick={() => openSubject(subj)} />
        ))}
      </div>
    </div>
  )
}

// ── Общие компоненты ──────────────────────────────────────────────

function NavCard({ icon, title, desc, color, glow, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button style={{
      ...s.navCard,
      borderColor: pressed ? color : "rgba(255,255,255,0.07)",
      transform:   pressed ? "scale(0.97)" : "scale(1)",
      background:  pressed ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
    }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick() }}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{ ...s.iconWrap, background: glow }}>
        <span style={{ fontSize:22 }}>{icon}</span>
      </div>
      <div style={s.cardBody}>
        <span style={s.cardLabel}>{title}</span>
        <span style={s.cardDesc}>{desc}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function Hdr({ title, sub, onBack }) {
  return (
    <div style={s.header}>
      <button style={s.backBtn} onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={s.hinfo}>
        <span style={s.htitle}>{title}</span>
        {sub && <span style={s.hsub}>{sub}</span>}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width:28, height:28,
      border:"2.5px solid rgba(255,255,255,0.08)",
      borderTop:"2.5px solid #6366f1",
      borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
  )
}

// ── Стили ─────────────────────────────────────────────────────────

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column",
          fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:12,
            padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)",
            borderBottom:"1px solid rgba(255,255,255,0.05)" },
  backBtn: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)",
             borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer",
             display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  hinfo: { display:"flex", flexDirection:"column", gap:2 },
  htitle: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  hsub:   { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body: { display:"flex", flexDirection:"column", gap:10, padding:"16px" },
  navCard: { display:"flex", alignItems:"center", gap:14, border:"1px solid rgba(255,255,255,0.07)",
             borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left",
             width:"100%", boxSizing:"border-box",
             transition:"transform 0.12s,border-color 0.12s,background 0.12s" },
  iconWrap: { width:44, height:44, borderRadius:12, display:"flex",
              alignItems:"center", justifyContent:"center", flexShrink:0 },
  cardBody: { flex:1, display:"flex", flexDirection:"column", gap:2 },
  cardLabel: { fontSize:15, fontWeight:600, color:"#f1f5f9" },
  cardDesc:  { fontSize:12, color:"rgba(255,255,255,0.4)" },
}

const sc = {
  nav: { display:"flex", alignItems:"center", gap:8, padding:"14px 16px",
         borderBottom:"1px solid rgba(255,255,255,0.05)" },
  navBtn: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:10, fontSize:16, padding:"8px 12px", cursor:"pointer" },
  navCenter: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" },
  navDay:  { fontSize:15, fontWeight:700, color:"#f1f5f9" },
  navDate: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  todayBtn: { margin:"8px 16px 0", padding:"8px",
              background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)",
              borderRadius:10, color:"#818cf8", fontSize:13, fontWeight:600, cursor:"pointer" },
  dateRow: { display:"flex", gap:8, padding:"10px 16px 0" },
  dateInp: { flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
             borderRadius:10, padding:"9px 12px", color:"#f1f5f9", fontSize:14, outline:"none" },
  dateBtn: { background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)",
             color:"#818cf8", borderRadius:10, padding:"9px 14px", fontSize:16, cursor:"pointer" },
  swipeHint: { textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.15)",
               padding:"6px 16px 0", letterSpacing:"0.3px" },
  card: { display:"flex", gap:12, background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"14px 16px", marginTop:10 },
  cardLeft: { display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:44 },
  cardEmoji: { fontSize:20 },
  cardTime: { fontSize:11, color:"#6366f1", fontWeight:700, textAlign:"center", lineHeight:1.3 },
  cardBody: { flex:1, display:"flex", flexDirection:"column", gap:4 },
  cardPara: { fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.5px" },
  cardSubj: { fontSize:15, fontWeight:600, color:"#f1f5f9" },
  cardMeta: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  errCard: { marginTop:16, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
             borderRadius:14, padding:"16px" },
  errTitle: { fontSize:14, fontWeight:600, color:"#ef4444", marginBottom:6 },
  errText:  { fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.5 },
  retryBtn: { marginTop:12, padding:"9px 16px", background:"rgba(239,68,68,0.15)",
              border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, color:"#ef4444",
              fontSize:13, fontWeight:600, cursor:"pointer" },
  center: { display:"flex", justifyContent:"center", paddingTop:40 },
  empty:  { textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"50px 0", fontSize:15 },
}

const lc = {
  card: { display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 16px",
          cursor:"pointer", width:"100%", textAlign:"left", boxSizing:"border-box" },
  name: { flex:1, fontSize:14, fontWeight:600, color:"#f1f5f9" },
}