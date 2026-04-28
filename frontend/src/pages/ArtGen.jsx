import { useState } from "react"

import { API } from "../App"

export default function ArtGen({ goBack }) {
  const [prompt,  setPrompt]  = useState("")
  const [loading, setLoading] = useState(false)
  const [imgUrl,  setImgUrl]  = useState(null)
  const [error,   setError]   = useState(null)

  const generate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setImgUrl(null)
    setError(null)
    try {
      const res = await fetch(`${API}/art/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() })
      })
      const data = await res.json()
      if (data.url) setImgUrl(data.url)
      else setError(data.error || "Ошибка генерации")
    } catch {
      setError("Ошибка соединения")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.headerGlow} />
        <button style={s.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.hinfo}>
          <span style={s.htitle}>🎨 Генерация картинок</span>
          <span style={s.hsub}>Yandex ART · ИИ-рисование</span>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.infoCard}>
          <span style={s.infoText}>
            Опиши что хочешь нарисовать — ИИ создаст картинку за 15-30 секунд
          </span>
        </div>

        <div style={s.examples}>
          {["закат над горами, аниме стиль", "уютная библиотека со свечами", "космический кот в скафандре"].map(ex => (
            <button key={ex} style={s.exBtn} onClick={() => setPrompt(ex)}>
              {ex}
            </button>
          ))}
        </div>

        <div style={s.inputBlock}>
          <label style={s.label}>Описание</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Например: лисица в зимнем лесу, акварель..."
            rows={4}
            style={s.textarea}
          />
          <div style={s.charCount}>{prompt.length}/500</div>
        </div>

        <button
          onClick={generate}
          disabled={!prompt.trim() || loading}
          style={{ ...s.btn, opacity: (!prompt.trim() || loading) ? 0.5 : 1 }}
        >
          {loading
            ? <span style={s.btnInner}><span style={s.spinner} /> Генерирую... (~30 сек)</span>
            : "🎨 Создать картинку"
          }
        </button>

        {error && (
          <div style={s.errorBox}>❌ {error}</div>
        )}

        {imgUrl && (
          <div style={s.resultBox}>
            <div style={s.resultHeader}>
              <span style={s.resultBadge}>✅ Готово!</span>
            </div>
            <img
              src={imgUrl}
              alt="generated"
              style={s.img}
              onLoad={() => {}}
            />
            <div style={s.prompt}>«{prompt}»</div>
            <a href={imgUrl} download="art.png" style={s.downloadBtn}>
              ⬇️ Скачать
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  root:    { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header:  { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  headerGlow: { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(236,72,153,0.2) 0%,transparent 70%)", pointerEvents:"none" },
  back:    { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  hinfo:   { display:"flex", flexDirection:"column", gap:2 },
  htitle:  { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  hsub:    { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body:    { display:"flex", flexDirection:"column", gap:14, padding:16 },
  infoCard:{ background:"rgba(236,72,153,0.07)", border:"1px solid rgba(236,72,153,0.15)", borderRadius:14, padding:"12px 14px" },
  infoText:{ fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.55 },
  examples:{ display:"flex", flexDirection:"column", gap:6 },
  exBtn:   { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"9px 12px", color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer", textAlign:"left" },
  inputBlock:{ display:"flex", flexDirection:"column", gap:6 },
  label:   { fontSize:12, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.5px" },
  textarea:{ background:"rgba(255,255,255,0.05)", color:"#f1f5f9", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px", fontFamily:"inherit", fontSize:15, resize:"none", outline:"none", lineHeight:1.55 },
  charCount:{ fontSize:11, color:"rgba(255,255,255,0.2)", textAlign:"right" },
  btn:     { padding:"14px", background:"linear-gradient(135deg,#ec4899,#8b5cf6)", border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 20px rgba(236,72,153,0.3)" },
  btnInner:{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
  spinner: { width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" },
  errorBox:{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 14px", color:"#ef4444", fontSize:14 },
  resultBox:{ display:"flex", flexDirection:"column", gap:12, alignItems:"center" },
  resultHeader:{ width:"100%", display:"flex", alignItems:"center" },
  resultBadge:{ fontSize:12, fontWeight:700, color:"#10b981", textTransform:"uppercase", letterSpacing:"0.5px" },
  img:     { width:"100%", borderRadius:18, border:"1px solid rgba(255,255,255,0.08)" },
  prompt:  { fontSize:13, color:"rgba(255,255,255,0.3)", fontStyle:"italic", textAlign:"center" },
  downloadBtn:{ display:"block", width:"100%", textAlign:"center", padding:"12px", background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:12, color:"#10b981", fontSize:14, fontWeight:600, textDecoration:"none" },
}