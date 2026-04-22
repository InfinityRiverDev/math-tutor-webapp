import { useState } from "react"

export default function Focus({ goBack }) {
  const [view, setView] = useState("menu")

  if (view === "pomodoro") return <PomodoroView goBack={() => setView("menu")} />
  if (view === "todo")     return <TodoView     goBack={() => setView("menu")} />
  if (view === "music")    return <MusicView    goBack={() => setView("menu")} />

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.hinfo}>
          <span style={s.htitle}>🎯 Фокус</span>
          <span style={s.hsub}>Продуктивность и отдых</span>
        </div>
      </div>
      <div style={s.body}>
        <NavCard icon="🍅" title="Помодоро" desc="Таймер для продуктивной работы" color="#ef4444" glow="rgba(239,68,68,0.15)" onClick={() => setView("pomodoro")} />
        <NavCard icon="✅" title="To-Do список" desc="Управление задачами" color="#10b981" glow="rgba(16,185,129,0.15)" onClick={() => setView("todo")} />
        <NavCard icon="🎧" title="Музыка" desc="Поиск и скачивание треков" color="#8b5cf6" glow="rgba(139,92,246,0.15)" onClick={() => setView("music")} />
      </div>
    </div>
  )
}

function NavCard({ icon, title, desc, color, glow, onClick }) {
  const [p, setP] = useState(false)
  return (
    <button style={{ ...nc.card, borderColor: p ? color : "rgba(255,255,255,0.07)", background: p ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)", transform: p ? "scale(0.97)" : "scale(1)" }}
      onPointerDown={() => setP(true)} onPointerUp={() => { setP(false); onClick() }} onPointerLeave={() => setP(false)}>
      <div style={{ ...nc.icon, background: glow }}><span style={{ fontSize: 22 }}>{icon}</span></div>
      <div style={nc.body}><span style={nc.title}>{title}</span><span style={nc.desc}>{desc}</span></div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  )
}

// ── Помодоро ──────────────────────────────────────────────────────

function PomodoroView({ goBack }) {
  const [mode,     setMode]     = useState("idle")   // idle | work | break
  const [seconds,  setSeconds]  = useState(25 * 60)
  const [cycles,   setCycles]   = useState(0)
  const [workMin,  setWorkMin]  = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [timer,    setTimer]    = useState(null)

  const start = () => {
    if (timer) return
    setMode("work")
    setSeconds(workMin * 60)
    const t = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(t)
          setTimer(null)
          setCycles(c => c + 1)
          setMode("break")
          setSeconds(breakMin * 60)
          setTimeout(() => startBreakTimer(), 100)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimer(t)
  }

  const startBreakTimer = () => {
    const t = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(t)
          setTimer(null)
          setMode("idle")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimer(t)
  }

  const stop = () => {
    if (timer) { clearInterval(timer); setTimer(null) }
    setMode("idle"); setSeconds(workMin * 60)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0")
  const ss = String(seconds % 60).padStart(2, "0")
  const color = mode === "work" ? "#ef4444" : mode === "break" ? "#10b981" : "#6366f1"

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={goBack}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <div style={s.hinfo}><span style={s.htitle}>🍅 Помодоро</span><span style={s.hsub}>Циклов: {cycles}</span></div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px", gap:28 }}>
        <div style={{ width:200, height:200, borderRadius:"50%", border: `6px solid ${color}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background: color + "14" }}>
          <div style={{ fontSize:48, fontWeight:800, color:"#f1f5f9", letterSpacing:-2 }}>{mm}:{ss}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:4 }}>
            {mode === "idle" ? "Готов" : mode === "work" ? "🍅 Работа" : "☕ Перерыв"}
          </div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          {mode === "idle"
            ? <button style={{ ...pom.btn, background: color }} onClick={start}>▶ Старт</button>
            : <button style={{ ...pom.btn, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)" }} onClick={stop}>⏹ Стоп</button>
          }
        </div>
        <div style={{ display:"flex", gap:16, fontSize:13, color:"rgba(255,255,255,0.4)" }}>
          <div>Работа: <b style={{color:"#f1f5f9"}}>{workMin} мин</b></div>
          <div>Перерыв: <b style={{color:"#f1f5f9"}}>{breakMin} мин</b></div>
        </div>
      </div>
    </div>
  )
}

const pom = {
  btn: { padding:"14px 32px", border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }
}

// ── To-Do ─────────────────────────────────────────────────────────

function TodoView({ goBack }) {
  const [tasks,   setTasks]   = useState([])
  const [input,   setInput]   = useState("")
  const [priority, setPriority] = useState(2)

  const add = () => {
    if (!input.trim()) return
    setTasks(prev => [...prev, { id: Date.now(), text: input.trim(), done: false, priority }])
    setInput("")
  }

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove = (id) => setTasks(prev => prev.filter(t => t.id !== id))

  const PRIO = { 1: { label:"🟢", color:"#10b981" }, 2: { label:"🟡", color:"#f59e0b" }, 3: { label:"🔴", color:"#ef4444" } }
  const sorted = [...tasks].sort((a,b) => b.priority - a.priority)
  const done = tasks.filter(t => t.done).length

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={goBack}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <div style={s.hinfo}><span style={s.htitle}>✅ To-Do</span><span style={s.hsub}>{done}/{tasks.length} выполнено</span></div>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Новая задача..." style={td.input} />
          <button style={{ ...td.pBtn, background: PRIO[priority].color + "22", borderColor: PRIO[priority].color + "66" }}
            onClick={() => setPriority(p => p % 3 + 1)}>{PRIO[priority].label}</button>
          <button style={td.addBtn} onClick={add}>+</button>
        </div>
        {sorted.length === 0 && <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"40px 0" }}>Задач пока нет</div>}
        {sorted.map(t => (
          <div key={t.id} style={{ ...td.task, opacity: t.done ? 0.5 : 1 }}>
            <button style={{ ...td.check, borderColor: t.done ? "#10b981" : "rgba(255,255,255,0.3)", background: t.done ? "#10b981" : "transparent" }} onClick={() => toggle(t.id)}>
              {t.done && "✓"}
            </button>
            <span style={{ flex:1, fontSize:14, color:"#f1f5f9", textDecoration: t.done ? "line-through" : "none", textDecorationColor:"rgba(255,255,255,0.3)" }}>{t.text}</span>
            <span style={{ fontSize:14 }}>{PRIO[t.priority].label}</span>
            <button style={td.del} onClick={() => remove(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const td = {
  input:  { flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 14px", color:"#f1f5f9", fontSize:14, outline:"none", fontFamily:"inherit" },
  pBtn:   { width:42, height:42, border:"1px solid", borderRadius:12, cursor:"pointer", fontSize:16, flexShrink:0 },
  addBtn: { width:42, height:42, background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:12, color:"#818cf8", fontSize:22, cursor:"pointer", flexShrink:0 },
  task:   { display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", marginBottom:8 },
  check:  { width:22, height:22, borderRadius:6, border:"1.5px solid", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#fff" },
  del:    { background:"transparent", border:"none", color:"rgba(255,255,255,0.3)", fontSize:14, cursor:"pointer", padding:4 },
}

// ── Музыка ────────────────────────────────────────────────────────

function MusicView({ goBack }) {
  const [query,   setQuery]   = useState("")
  const [status,  setStatus]  = useState(null)
  const [loading, setLoading] = useState(false)
  const API_URL = "https://math-tutor-webapp.onrender.com"

  const search = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setStatus(null)
    try {
      const res  = await fetch(`${API_URL}/music/search`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), user_id: 0 })
      })
      const data = await res.json()
      setStatus(data.ok ? { ok: true,  msg: data.message } : { ok: false, msg: data.message })
    } catch {
      setStatus({ ok: false, msg: "Ошибка соединения" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={goBack}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <div style={s.hinfo}><span style={s.htitle}>🎧 Музыка</span><span style={s.hsub}>Поиск треков</span></div>
      </div>
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:14, padding:"14px 16px", fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.55 }}>
          🎵 Введите название трека или исполнителя — бот найдёт и отправит аудио в Telegram
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Исполнитель — Название трека"
            style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", color:"#f1f5f9", fontSize:14.5, outline:"none", fontFamily:"inherit" }} />
          <button style={{ width:48, height:48, background:"linear-gradient(135deg,#8b5cf6,#6366f1)", border:"none", borderRadius:12, color:"#fff", fontSize:20, cursor:"pointer", flexShrink:0 }} onClick={search}>
            {loading ? "⏳" : "🔍"}
          </button>
        </div>
        {status && (
          <div style={{ background: status.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${status.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius:12, padding:"12px 14px", fontSize:14, color: status.ok ? "#10b981" : "#ef4444" }}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Стили ─────────────────────────────────────────────────────────

const s = {
  root:   { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  back:   { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  hinfo:  { display:"flex", flexDirection:"column", gap:2 },
  htitle: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  hsub:   { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body:   { display:"flex", flexDirection:"column", gap:10, padding:"16px" },
}

const nc = {
  card:  { display:"flex", alignItems:"center", gap:14, border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left", width:"100%", boxSizing:"border-box", transition:"transform 0.12s,border-color 0.12s,background 0.12s" },
  icon:  { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  body:  { flex:1, display:"flex", flexDirection:"column", gap:2 },
  title: { fontSize:15, fontWeight:600, color:"#f1f5f9" },
  desc:  { fontSize:12, color:"rgba(255,255,255,0.4)" },
}