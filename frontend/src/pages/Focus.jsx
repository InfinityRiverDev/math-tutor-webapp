import { useState, useEffect, useRef } from "react"
import { API } from "../App"

export default function Focus({ goBack }) {
  const [view, setView] = useState("menu") // menu | pomodoro | music

  if (view === "pomodoro") return <Pomodoro goBack={() => setView("menu")} />
  if (view === "music")    return <Music    goBack={() => setView("menu")} />

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={s.headerTitle}>🎯 Фокус</div>
          <div style={s.headerSub}>Помодоро и музыка</div>
        </div>
      </div>
      <div style={s.body}>
        <NavCard icon="🍅" title="Таймер Помодоро" desc="25 мин работы · 5 мин отдыха"
          color="#ef4444" glow="rgba(239,68,68,0.15)" onClick={() => setView("pomodoro")} />
        <NavCard icon="🎵" title="Музыка" desc="Поиск и скачивание треков через бота"
          color="#8b5cf6" glow="rgba(139,92,246,0.15)" onClick={() => setView("music")} />
      </div>
    </div>
  )
}

// ── Помодоро ────────────────────────────────────────────────────

const PRESETS = [
  { label: "25/5",  work: 25*60, shortBreak: 5*60,  longBreak: 15*60, cycles: 4 },
  { label: "50/10", work: 50*60, shortBreak: 10*60, longBreak: 20*60, cycles: 4 },
  { label: "15/3",  work: 15*60, shortBreak: 3*60,  longBreak: 10*60, cycles: 4 },
]

function Pomodoro({ goBack }) {
  const [preset,       setPreset]       = useState(0)
  const [phase,        setPhase]        = useState("idle")   // idle | work | shortBreak | longBreak | done
  const [timeLeft,     setTimeLeft]     = useState(PRESETS[0].work)
  const [cycle,        setCycle]        = useState(0)        // завершённых рабочих циклов
  const [totalCycles,  setTotalCycles]  = useState(4)
  const [running,      setRunning]      = useState(false)
  const intervalRef = useRef(null)

  const cfg = PRESETS[preset]

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (running && timeLeft === 0) {
      handlePhaseEnd()
    }
    return () => clearInterval(intervalRef.current)
  }, [running, timeLeft])

  const handlePhaseEnd = () => {
    clearInterval(intervalRef.current)
    if (phase === "work") {
      const newCycle = cycle + 1
      setCycle(newCycle)
      if (newCycle >= totalCycles) {
        setPhase("longBreak")
        setTimeLeft(cfg.longBreak)
      } else {
        setPhase("shortBreak")
        setTimeLeft(cfg.shortBreak)
      }
    } else if (phase === "shortBreak") {
      setPhase("work")
      setTimeLeft(cfg.work)
    } else if (phase === "longBreak") {
      setPhase("done")
      setRunning(false)
      setCycle(0)
    }
  }

  const start = () => { setPhase("work"); setTimeLeft(cfg.work); setRunning(true); setCycle(0) }
  const pause = () => setRunning(false)
  const resume = () => setRunning(true)
  const stop = () => { setRunning(false); setPhase("idle"); setTimeLeft(cfg.work); setCycle(0); clearInterval(intervalRef.current) }
  const skipBreak = () => { setPhase("work"); setTimeLeft(cfg.work) }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`

  const progress = phase === "work"        ? 1 - timeLeft / cfg.work
                 : phase === "shortBreak"  ? 1 - timeLeft / cfg.shortBreak
                 : phase === "longBreak"   ? 1 - timeLeft / cfg.longBreak
                 : 0

  const phaseColor = phase === "work" ? "#ef4444" : phase === "done" ? "#10b981" : "#3b82f6"
  const phaseLabel = phase === "idle"        ? "Готов к работе"
                   : phase === "work"        ? "🎯 Рабочий интервал"
                   : phase === "shortBreak"  ? "☕ Короткий перерыв"
                   : phase === "longBreak"   ? "🛋 Длинный перерыв"
                   : "✅ Сессия завершена!"

  const circumference = 2 * Math.PI * 54
  const strokeDash    = circumference * (1 - progress)

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={s.headerTitle}>🍅 Помодоро</div>
          <div style={s.headerSub}>{phaseLabel}</div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px 24px", gap:24 }}>
        {/* Круговой таймер */}
        <div style={{ position:"relative", width:140, height:140 }}>
          <svg width="140" height="140" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
            <circle cx="70" cy="70" r="54" fill="none" stroke={phaseColor} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={strokeDash}
              strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s linear" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28, fontWeight:800, color:"#f1f5f9", fontFamily:"monospace" }}>{fmt(timeLeft)}</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>
              {phase === "work" ? `цикл ${cycle+1}/${totalCycles}` : phase}
            </span>
          </div>
        </div>

        {/* Пресеты (только в idle) */}
        {phase === "idle" && (
          <div style={{ display:"flex", gap:8 }}>
            {PRESETS.map((p, i) => (
              <button key={i} style={{
                padding:"8px 16px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                background: preset === i ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)",
                border: preset === i ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: preset === i ? "#ef4444" : "rgba(255,255,255,0.6)",
              }} onClick={() => { setPreset(i); setTimeLeft(PRESETS[i].work) }}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Кнопки управления */}
        <div style={{ display:"flex", gap:12 }}>
          {phase === "idle" && (
            <button style={{ ...pb.btn, background:"linear-gradient(135deg,#ef4444,#dc2626)" }} onClick={start}>
              ▶ Старт
            </button>
          )}
          {(phase === "work" || phase === "shortBreak" || phase === "longBreak") && running && (
            <button style={{ ...pb.btn, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)" }} onClick={pause}>
              ⏸ Пауза
            </button>
          )}
          {(phase === "work" || phase === "shortBreak" || phase === "longBreak") && !running && (
            <button style={{ ...pb.btn, background:"linear-gradient(135deg,#ef4444,#dc2626)" }} onClick={resume}>
              ▶ Продолжить
            </button>
          )}
          {(phase === "shortBreak" || phase === "longBreak") && (
            <button style={{ ...pb.btn, background:"rgba(59,130,246,0.2)", border:"1px solid rgba(59,130,246,0.3)", color:"#60a5fa" }} onClick={skipBreak}>
              ⏭ Пропустить
            </button>
          )}
          {phase !== "idle" && (
            <button style={{ ...pb.btn, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444" }} onClick={stop}>
              ⏹ Стоп
            </button>
          )}
          {phase === "done" && (
            <button style={{ ...pb.btn, background:"linear-gradient(135deg,#ef4444,#dc2626)" }} onClick={start}>
              🔄 Новый сеанс
            </button>
          )}
        </div>

        {/* Прогресс циклов */}
        {phase !== "idle" && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {Array.from({length: totalCycles}).map((_, i) => (
              <div key={i} style={{
                width:10, height:10, borderRadius:"50%",
                background: i < cycle ? "#10b981" : i === cycle && phase === "work" ? "#ef4444" : "rgba(255,255,255,0.15)"
              }} />
            ))}
          </div>
        )}

        {/* Советы */}
        {phase === "work" && (
          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:14, padding:"12px 16px", width:"100%", boxSizing:"border-box" }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
              💡 <b style={{color:"#f1f5f9"}}>Совет:</b> Уберите телефон, закройте соцсети. Сосредоточьтесь на одной задаче.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Музыка ──────────────────────────────────────────────────────

function Music({ goBack }) {
  const [query,   setQuery]   = useState("")
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null) // {ok, message}

  // Музыка работает через бота — миниапп отправляет запрос,
  // бот скачивает трек и присылает пользователю в Telegram
  const search = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch(`${API}/music/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      })
      const d = await r.json()
      setResult(d)
    } catch {
      setResult({ ok: false, message: "Ошибка соединения" })
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter") search()
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={s.headerTitle}>🎵 Музыка</div>
          <div style={s.headerSub}>Поиск треков через бота</div>
        </div>
      </div>
      <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:14, padding:"14px 16px" }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
            🎧 Введи название трека или исполнителя. Бот скачает и пришлёт аудиофайл прямо в Telegram.
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Например: Imagine Dragons Believer"
            style={{
              flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:14, padding:"13px 16px", color:"#f1f5f9", fontSize:15, outline:"none",
              fontFamily:"inherit"
            }}
          />
          <button
            onClick={search}
            disabled={!query.trim() || loading}
            style={{
              padding:"13px 18px", background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",
              border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:700,
              cursor: !query.trim() || loading ? "not-allowed" : "pointer",
              opacity: !query.trim() || loading ? 0.5 : 1,
              flexShrink:0
            }}
          >
            {loading ? "⏳" : "🔍"}
          </button>
        </div>

        {result && (
          <div style={{
            background: result.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${result.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius:14, padding:"14px 16px",
            color: result.ok ? "#10b981" : "#ef4444",
            fontSize:14, fontWeight:600,
          }}>
            {result.ok ? "✅ " : "❌ "}{result.message}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Популярные запросы</div>
          {["Скриптонит незабудка", "MACAN Jet", "Coldplay Yellow", "Imagine Dragons Believer"].map(q => (
            <button key={q} style={{
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:12, padding:"11px 16px", color:"rgba(255,255,255,0.6)",
              fontSize:14, cursor:"pointer", textAlign:"left"
            }} onClick={() => setQuery(q)}>
              🎵 {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Компоненты ──────────────────────────────────────────────────

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
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:3 }}>
        <span style={{ fontSize:16, fontWeight:600, color:"#f1f5f9" }}>{title}</span>
        <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>{desc}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

const pb = {
  btn: {
    padding:"12px 20px", borderRadius:12, fontSize:15, fontWeight:700,
    cursor:"pointer", border:"none", color:"#fff",
    boxShadow:"0 4px 16px rgba(0,0,0,0.3)",
  }
}

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  backBtn: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  headerTitle: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  headerSub: { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body: { display:"flex", flexDirection:"column", gap:12, padding:"20px 16px" },
  navCard: { display:"flex", alignItems:"center", gap:16, border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, padding:"18px 16px", cursor:"pointer", transition:"transform 0.12s,border-color 0.12s,background 0.12s", textAlign:"left", width:"100%", boxSizing:"border-box" },
  iconWrap: { width:56, height:56, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
}