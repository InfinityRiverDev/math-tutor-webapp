import { useState, useEffect, useRef } from "react"

const DESMOS_API = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=be1bb259e5704c13b10e7a935fd34c2f"

const CALCULATORS = [
  {
    id: "graphing",
    icon: "📈",
    title: "Графический калькулятор",
    desc: "Строй графики функций",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.15)",
    init: (elt) => window.Desmos.GraphingCalculator(elt, { keypad: true }),
  },
  {
    id: "scientific",
    icon: "🔬",
    title: "Научный калькулятор",
    desc: "Тригонометрия, логарифмы и др.",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.15)",
    init: (elt) => window.Desmos.ScientificCalculator(elt, { keypad: true }),
  },
  {
    id: "arithmetic",
    icon: "🔢",
    title: "Арифметический",
    desc: "Базовые вычисления",
    color: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    init: (elt) => window.Desmos.FourFunctionCalculator(elt, { keypad: true }),
  },
  {
    id: "geometry",
    icon: "📐",
    title: "Геометрия",
    desc: "Геометрические инструменты",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
    init: (elt) => window.Desmos.Geometry(elt),
  },
  {
    id: "3d",
    icon: "🌐",
    title: "3D калькулятор",
    desc: "Трёхмерные графики",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.15)",
    init: (elt) => window.Desmos.Graphing3D(elt),
  },
]

export default function Desmos({ goBack, initialCalc }) {
  const [view, setView] = useState(initialCalc ?? "menu")

  const selected = CALCULATORS.find(c => c.id === view)

  if (view !== "menu" && selected) {
    return (
      <CalcView
        calc={selected}
        goBack={() => setView("menu")}
      />
    )
  }

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
          <span style={s.headerTitle}>📊 Desmos</span>
          <span style={s.headerSub}>Математические инструменты</span>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.infoCard}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
            Профессиональные математические инструменты Desmos — графики, вычисления и геометрия прямо в приложении.
          </span>
        </div>

        {CALCULATORS.map(calc => (
          <NavCard
            key={calc.id}
            icon={calc.icon}
            title={calc.title}
            desc={calc.desc}
            color={calc.color}
            glow={calc.glow}
            onClick={() => setView(calc.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Экран конкретного калькулятора ────────────────────────────────

function CalcView({ calc, goBack }) {
  const containerRef = useRef(null)
  const calcInstanceRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const tryInit = () => {
      if (!containerRef.current) return
      if (window.Desmos) {
        initCalc()
      } else {
        // Загружаем API
        if (!document.querySelector(`script[src*="desmos.com"]`)) {
          const script = document.createElement("script")
          script.src = DESMOS_API
          script.async = true
          script.onload = initCalc
          script.onerror = () => setError("Не удалось загрузить Desmos API. Проверьте соединение.")
          document.head.appendChild(script)
        } else {
          // Уже загружается — ждём
          const interval = setInterval(() => {
            if (window.Desmos) { clearInterval(interval); initCalc() }
          }, 100)
          return () => clearInterval(interval)
        }
      }
    }

    const initCalc = () => {
      if (!containerRef.current) return
      try {
        if (calcInstanceRef.current) {
          calcInstanceRef.current.destroy?.()
        }
        calcInstanceRef.current = calc.init(containerRef.current)
        setLoaded(true)
      } catch (e) {
        setError(`Ошибка инициализации: ${e.message}`)
      }
    }

    tryInit()

    return () => {
      calcInstanceRef.current?.destroy?.()
    }
  }, [calc.id])

  return (
    <div style={cv.root}>
      <div style={cv.header}>
        <button style={cv.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ ...cv.iconWrap, background: calc.glow }}>
          <span style={{ fontSize: 18 }}>{calc.icon}</span>
        </div>
        <div style={cv.headerInfo}>
          <span style={cv.title}>{calc.title}</span>
          <span style={cv.sub}>Desmos · {loaded ? "готов" : "загрузка..."}</span>
        </div>
      </div>

      {error && (
        <div style={cv.errBox}>
          <div style={{ color: "#ef4444", fontSize: 14 }}>⚠️ {error}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 }}>
            Попробуйте открыть в браузере: desmos.com
          </div>
        </div>
      )}

      {!loaded && !error && (
        <div style={cv.loader}>
          <div style={cv.spinner} />
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Загружаю Desmos...</span>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          ...cv.calcContainer,
          opacity: loaded ? 1 : 0,
          pointerEvents: loaded ? "all" : "none",
        }}
      />
    </div>
  )
}

function NavCard({ icon, title, desc, color, glow, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      style={{
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
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

const s = {
  root: {
    minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12,
    padding: "20px 20px 18px", background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none",
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  body: { display: "flex", flexDirection: "column", gap: 10, padding: "16px" },
  infoCard: {
    background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 14, padding: "14px 16px", marginBottom: 4,
  },
  navCard: {
    display: "flex", alignItems: "center", gap: 14,
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px",
    cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box",
    transition: "transform 0.12s, border-color 0.12s, background 0.12s",
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
}

const cv = {
  root: {
    display: "flex", flexDirection: "column", height: "100vh",
    background: "#0a0f1e", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
    background: "rgba(13,19,35,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  back: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 1 },
  title: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  sub: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  calcContainer: {
    flex: 1, width: "100%", transition: "opacity 0.3s",
  },
  loader: {
    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  spinner: {
    width: 32, height: 32, border: "2.5px solid rgba(255,255,255,0.08)",
    borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  errBox: {
    margin: "16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 14, padding: "14px 16px",
  },
}