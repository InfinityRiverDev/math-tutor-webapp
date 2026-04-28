import { useState } from "react"

import { API } from "../App"

export default function Calculator({ goBack }) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [solved, setSolved] = useState(false)

  const solve = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setSolved(false)
    try {
      const res = await fetch(`${API}/calculator/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input })
      })
      const data = await res.json()
      setResult(data.result)
      setSolved(true)
    } catch {
      setResult("<span style='color:#ef4444'>Ошибка соединения. Попробуй ещё раз.</span>")
      setSolved(true)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      solve()
    }
  }

  const clear = () => {
    setInput("")
    setResult("")
    setSolved(false)
  }

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
          <span style={s.headerTitle}>🧮 Калькулятор</span>
          <span style={s.headerSub}>Реши любую задачу</span>
        </div>
      </div>

      <div style={s.body}>
        {/* Input */}
        <div style={s.inputBlock}>
          <label style={s.inputLabel}>Условие задачи</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Например: найти производную x² + 3x − 5"
            rows={4}
            style={s.textarea}
          />
          <div style={s.inputHint}>Нажми Enter или кнопку ниже</div>
        </div>

        {/* Buttons */}
        <div style={s.btns}>
          <button
            onClick={solve}
            disabled={!input.trim() || loading}
            style={{
              ...s.solveBtn,
              opacity: (!input.trim() || loading) ? 0.5 : 1,
              cursor: (!input.trim() || loading) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={s.btnLoading}>
                <span style={s.spinner} />
                Решаю...
              </span>
            ) : "Решить →"}
          </button>
          {(input || result) && (
            <button onClick={clear} style={s.clearBtn}>✕ Очистить</button>
          )}
        </div>

        {/* Result */}
        {solved && result && (
          <div style={s.resultBlock}>
            <div style={s.resultHeader}>
              <span style={s.resultBadge}>✅ Решение</span>
            </div>
            <div
              style={s.resultContent}
              dangerouslySetInnerHTML={{ __html: result }}
            />
          </div>
        )}
      </div>
    </div>
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
    padding: "20px 20px 18px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  backBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9",
    padding: "7px 9px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  body: { display: "flex", flexDirection: "column", gap: 16, padding: "20px 16px" },
  inputBlock: { display: "flex", flexDirection: "column", gap: 8 },
  inputLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  textarea: {
    background: "rgba(255,255,255,0.05)",
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "14px 16px",
    fontFamily: "inherit", fontSize: 15,
    resize: "none", outline: "none",
    lineHeight: 1.55,
    transition: "border-color 0.2s",
  },
  inputHint: { fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "right" },
  btns: { display: "flex", gap: 10 },
  solveBtn: {
    flex: 1, padding: "14px 0",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none", borderRadius: 14,
    color: "#fff", fontSize: 16, fontWeight: 700,
    letterSpacing: "-0.2px",
    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
    transition: "opacity 0.15s",
  },
  btnLoading: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: {
    width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  clearBtn: {
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, color: "rgba(255,255,255,0.5)",
    fontSize: 14, cursor: "pointer",
    whiteSpace: "nowrap",
  },
  resultBlock: {
    background: "rgba(16,185,129,0.07)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 18, padding: "16px 18px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  resultHeader: { display: "flex", alignItems: "center" },
  resultBadge: {
    fontSize: 12, fontWeight: 700, color: "#10b981",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  resultContent: {
    color: "#e2e8f0", fontSize: 15, lineHeight: 1.65,
  },
}