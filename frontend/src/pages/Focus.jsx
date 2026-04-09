export default function Focus({ goBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px", background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={goBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>🎯 Фокус</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Музыка и таймер</div>
        </div>
      </div>
      <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 15 }}>
        🚧 Раздел в разработке
      </div>
    </div>
  )
}