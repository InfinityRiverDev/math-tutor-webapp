import { useState } from "react"

const MANAGER_ID = 1991833177

const PRESENTATION_TEMPLATES = [
  { id: "minimalism", name: "Минимализм", desc: "Чистый стиль, много пространства", emoji: "⬜" },
  { id: "corporate",  name: "Корпоратив",  desc: "Строгий деловой стиль",           emoji: "🏢" },
  { id: "creative",   name: "Креатив",     desc: "Яркие цвета, нестандартные формы", emoji: "🎨" },
  { id: "dark",       name: "Тёмная тема", desc: "Элегантный тёмный фон",           emoji: "🌑" },
  { id: "gradient",   name: "Градиент",    desc: "Плавные переходы цветов",         emoji: "🌈" },
]

export default function Services({ goBack, user, goToChat }) {
  const [showTemplates, setShowTemplates] = useState(false)

  const handleOrderTemplate = (template) => {
    goToChat(MANAGER_ID, `Хочу заказать презентацию по шаблону "${template.name}"`)
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>📝 Услуги</span>
          <span style={s.headerSub}>Распечатка и заказы</span>
        </div>
      </div>

      <div style={s.body}>
        {/* Распечатка */}
        <div style={{ ...s.card, background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" }}>
          <div style={s.cardTop}>
            <span style={s.cardIcon}>🖨️</span>
            <div>
              <div style={s.cardTitle}>Распечатка</div>
              <div style={s.cardDesc}>1 страница — 10₽ · Забрать в ДАС №6</div>
            </div>
          </div>
          <a href="https://t.me/infinityriver" target="_blank" rel="noreferrer" style={{ ...s.cardBtn, borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}>
            Написать менеджеру →
          </a>
        </div>

        {/* Презентации */}
        <div style={{ ...s.card, background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.2)" }}>
          <div style={s.cardTop}>
            <span style={s.cardIcon}>🎞️</span>
            <div>
              <div style={s.cardTitle}>Презентации</div>
              <div style={s.cardDesc}>От 250₽ · Срок: 1 день · Выберите шаблон</div>
            </div>
          </div>
          <button
            style={{ ...s.cardBtn, borderColor: "rgba(99,102,241,0.3)", color: "#818cf8", cursor: "pointer", background: "transparent", width: "100%", textAlign: "center" }}
            onClick={() => setShowTemplates(v => !v)}
          >
            {showTemplates ? "Скрыть шаблоны ↑" : "Выбрать шаблон →"}
          </button>

          {showTemplates && (
            <div style={s.templates}>
              {PRESENTATION_TEMPLATES.map(t => (
                <button key={t.id} style={s.templateCard} onClick={() => handleOrderTemplate(t)}>
                  <span style={s.templateEmoji}>{t.emoji}</span>
                  <div style={s.templateInfo}>
                    <div style={s.templateName}>{t.name}</div>
                    <div style={s.templateDesc}>{t.desc}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "system-ui" },
  header: {
    display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 18px",
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
  body: { padding: "16px", display: "flex", flexDirection: "column", gap: 12 },
  card: { borderRadius: 18, padding: "18px", border: "1px solid rgba(255,255,255,0.07)" },
  cardTop: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 },
  cardIcon: { fontSize: 28, flexShrink: 0 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 },
  cardBtn: {
    display: "block", textAlign: "center",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "11px", color: "#f1f5f9",
    fontSize: 14, fontWeight: 600, textDecoration: "none",
  },
  templates: { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 },
  templateCard: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "12px 14px", cursor: "pointer",
    textAlign: "left", width: "100%",
    transition: "background 0.15s",
  },
  templateEmoji: { fontSize: 22, flexShrink: 0 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  templateDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
}