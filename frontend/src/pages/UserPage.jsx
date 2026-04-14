import { useState, useEffect } from "react"
import { API, MANAGER_ID, PRINT_MANAGER_ID, MANAGER_IDS } from "../App"
import Tutor     from "./Tutor"
import Profile   from "./Profile"
import Wallet    from "./Wallet"
import Education from "./Education"
import Focus     from "./Focus"
import OrderChat from "./OrderChat"
import StatsView from "./StatsView"

// Шаблоны презентаций (фото из папки бота)
const PRESENTATION_TEMPLATES = [
  {
    id: "minimalism",
    name: "Минимализм",
    desc: "Чистый и аккуратный стиль",
    emoji: "⬜",
    // Используем публичные картинки-заглушки т.к. фото из бота недоступны напрямую
    // Замените на реальные URL после загрузки на CDN
    img: null,
  },
  { id: "corporate",  name: "Корпоратив",  desc: "Строгий деловой стиль",        emoji: "🏢",  img: null },
  { id: "creative",   name: "Креатив",     desc: "Яркие цвета и нестандартность", emoji: "🎨",  img: null },
  { id: "dark",       name: "Тёмная тема", desc: "Элегантный тёмный дизайн",     emoji: "🌑",  img: null },
  { id: "gradient",   name: "Градиент",    desc: "Плавные переходы цветов",       emoji: "🌈",  img: null },
]

const CHAT_CONFIGS = {
  presentation: { managerId: MANAGER_ID,       icon: "🎞️", label: "Презентации" },
  print:        { managerId: PRINT_MANAGER_ID, icon: "🖨️", label: "Распечатка"  },
}

const ITEMS = [
  { id:"tutor",     icon:"🎓", label:"ИИ-репетитор", desc:"Задай вопрос — получи ответ",  color:"#6366f1", locked:true  },
  { id:"education", icon:"📚", label:"Образование",   desc:"Лекции и расписание",           color:"#0ea5e9", locked:true  },
  { id:"focus",     icon:"🎯", label:"Фокус",         desc:"Помодоро и музыка",             color:"#f59e0b", locked:true  },
  { id:"services",  icon:"📝", label:"Услуги",        desc:"Мои заказы и чаты",             color:"#10b981", locked:false },
  { id:"wallet",    icon:"💼", label:"Кошелёк",       desc:"Баланс и тарифы",               color:"#f59e0b", locked:false },
  { id:"profile",   icon:"👤", label:"Профиль",       desc:"Данные и подписка",             color:"#ec4899", locked:false },
]

export default function UserPage({ user, subscription, reloadSub }) {
  const [page,     setPage]     = useState("home")
  const [pressed,  setPressed]  = useState(null)
  const [flash,    setFlash]    = useState(null)
  const [chatType, setChatType] = useState(null)
  const [prefill,  setPrefill]  = useState(null)

  const hasSub = subscription?.active === true

  const handleCard = (item) => {
    if (item.locked && !hasSub) {
      setFlash(item.id)
      setTimeout(() => setFlash(null), 600)
      return
    }
    setPage(item.id)
  }

  const openChat = (type, msg = null) => {
    setChatType(type)
    setPrefill(msg)
    setPage("order_chat")
  }

  if (page === "tutor")     return <Tutor     user={user} goBack={() => setPage("home")} />
  if (page === "profile")   return <Profile   user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")    return <Wallet    user={user} goBack={() => setPage("home")} subscription={subscription} reloadSubscription={reloadSub} />
  if (page === "education") return <Education user={user} goBack={() => setPage("home")} />
  if (page === "focus")     return <Focus     goBack={() => setPage("home")} />
  if (page === "stats")     return <StatsView goBack={() => setPage("home")} />
  if (page === "services")  return <ServicesPage user={user} goBack={() => setPage("home")} onOpenChat={openChat} />

  if (page === "order_chat") {
    const cfg = CHAT_CONFIGS[chatType] ?? CHAT_CONFIGS.presentation
    return (
      <OrderChat
        user={user}
        managerId={cfg.managerId}
        chatLabel={cfg.label}
        chatIcon={cfg.icon}
        prefill={prefill}
        goBack={() => { setPage("services"); setPrefill(null) }}
      />
    )
  }

  // Если это менеджер — показываем вкладку «Заказы» вместо обычного меню
  const isManager = MANAGER_IDS.includes(user.id)

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.hglow} />
        <div style={s.avatar}>{user.first_name?.[0]?.toUpperCase() ?? "?"}</div>
        <div style={s.htxt}>
          <span style={s.greet}>Привет, {user.first_name} 👋</span>
          <span style={s.sub}>{hasSub ? `✅ ${subscription.plan_name}` : "🔒 Нет тарифа"}</span>
        </div>
      </div>

      {!hasSub && (
        <div style={s.banner} onClick={() => setPage("wallet")}>
          <div style={s.bannerGlow} />
          <div style={s.bannerL}>
            <span style={{ fontSize:24 }}>🔒</span>
            <div>
              <div style={s.bannerTitle}>Нет активного тарифа</div>
              <div style={s.bannerDesc}>Доступны Услуги, Кошелёк, Профиль</div>
            </div>
          </div>
          <div style={s.bannerBtn}>Купить →</div>
        </div>
      )}

      <div style={s.grid}>
        {ITEMS.map(item => {
          const locked   = item.locked && !hasSub
          const flashing = flash === item.id
          return (
            <button key={item.id} style={{
              ...s.card,
              opacity:     locked ? 0.52 : 1,
              borderColor: flashing ? "#ef4444" : pressed === item.id ? item.color : "rgba(255,255,255,0.07)",
              background:  flashing ? "rgba(239,68,68,0.08)" : pressed === item.id ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              transform:   pressed === item.id ? "scale(0.97)" : "scale(1)",
            }}
              onPointerDown={() => setPressed(item.id)}
              onPointerUp={() => { setPressed(null); handleCard(item) }}
              onPointerLeave={() => setPressed(null)}
            >
              <div style={{ ...s.iw, background: item.color + "28" }}>
                <span style={{ fontSize:22 }}>{locked ? "🔒" : item.icon}</span>
              </div>
              <div style={s.cb}>
                <span style={s.cl}>{item.label}</span>
                <span style={s.cd}>{locked ? "Требуется подписка" : item.desc}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )
        })}

        {/* Статистика — для всех */}
        <button style={{ ...s.card, background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}
          onPointerDown={() => setPressed("stats")}
          onPointerUp={() => { setPressed(null); setPage("stats") }}
          onPointerLeave={() => setPressed(null)}
        >
          <div style={{ ...s.iw, background:"rgba(16,185,129,0.18)" }}>
            <span style={{ fontSize:22 }}>📊</span>
          </div>
          <div style={s.cb}>
            <span style={s.cl}>Статистика</span>
            <span style={s.cd}>Активность и достижения</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={s.badge}><span style={s.dot} />Math Tutor · powered by AI</div>
    </div>
  )
}

// ── ServicesPage — услуги + шаблоны презентаций ──────────────────

function ServicesPage({ user, goBack, onOpenChat }) {
  const [view,     setView]     = useState("main") // main | presentation_templates
  const [chats,    setChats]    = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const results = await Promise.all(
        Object.entries(CHAT_CONFIGS).map(async ([type, cfg]) => {
          try {
            const r    = await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${cfg.managerId}`)
            const d    = await r.json()
            const msgs = d.messages ?? []
            return { type, cfg, msgs, lastMsg: msgs[msgs.length - 1] ?? null }
          } catch {
            return { type, cfg, msgs: [], lastMsg: null }
          }
        })
      )
      setChats(results)
      setLoading(false)
    }
    load()
  }, [])

  if (view === "presentation_templates") return (
    <PresentationTemplates
      goBack={() => setView("main")}
      onSelect={(templateName) => {
        onOpenChat("presentation", `Хочу заказать презентацию по шаблону "${templateName}"`)
      }}
    />
  )

  return (
    <div style={sv.root}>
      <div style={sv.header}>
        <button style={sv.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={sv.headerInfo}>
          <span style={sv.headerTitle}>📝 Услуги</span>
          <span style={sv.headerSub}>Мои заказы и чаты</span>
        </div>
      </div>

      <div style={sv.body}>
        <div style={sv.infoCard}>
          <div style={sv.infoTitle}>Как это работает?</div>
          <div style={sv.infoText}>Выберите услугу → опишите заказ → менеджер ответит в ближайшее время.</div>
        </div>

        {/* Карточка Презентации */}
        <div style={{ ...sv.serviceCard, background:"rgba(99,102,241,0.1)", borderColor:"rgba(99,102,241,0.2)" }}>
          <div style={sv.serviceTop}>
            <span style={sv.serviceIcon}>🎞️</span>
            <div>
              <div style={sv.serviceTitle}>Презентации</div>
              <div style={sv.serviceDesc}>От 250₽ · Срок: 1 день</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ ...sv.serviceBtn, flex:1, borderColor:"rgba(99,102,241,0.3)", color:"#818cf8" }}
              onClick={() => setView("presentation_templates")}>
              📋 Выбрать шаблон
            </button>
            <button style={{ ...sv.serviceBtn, flex:1, borderColor:"rgba(99,102,241,0.3)", color:"#818cf8" }}
              onClick={() => onOpenChat("presentation")}>
              💬 Написать
            </button>
          </div>
          {/* Последнее сообщение */}
          {!loading && chats.find(c => c.type === "presentation")?.lastMsg && (
            <div style={sv.lastMsg}>
              💬 {chats.find(c => c.type === "presentation").lastMsg.text?.slice(0,50) ?? "Файл"}
            </div>
          )}
        </div>

        {/* Карточка Распечатка */}
        <div style={{ ...sv.serviceCard, background:"rgba(16,185,129,0.1)", borderColor:"rgba(16,185,129,0.2)" }}>
          <div style={sv.serviceTop}>
            <span style={sv.serviceIcon}>🖨️</span>
            <div>
              <div style={sv.serviceTitle}>Распечатка</div>
              <div style={sv.serviceDesc}>1 страница — 10₽ · Забрать в ДАС №6</div>
            </div>
          </div>
          <button style={{ ...sv.serviceBtn, borderColor:"rgba(16,185,129,0.3)", color:"#10b981" }}
            onClick={() => onOpenChat("print")}>
            💬 Написать менеджеру
          </button>
          {!loading && chats.find(c => c.type === "print")?.lastMsg && (
            <div style={sv.lastMsg}>
              💬 {chats.find(c => c.type === "print").lastMsg.text?.slice(0,50) ?? "Файл"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Шаблоны презентаций ─────────────────────────────────────────

function PresentationTemplates({ goBack, onSelect }) {
  return (
    <div style={sv.root}>
      <div style={sv.header}>
        <button style={sv.backBtn} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={sv.headerInfo}>
          <span style={sv.headerTitle}>🎞️ Шаблоны</span>
          <span style={sv.headerSub}>Выберите стиль презентации</span>
        </div>
      </div>

      <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={sv.infoCard}>
          <div style={sv.infoText}>Нажмите на шаблон — откроется чат с менеджером, где уже будет указан выбранный стиль.</div>
        </div>

        {PRESENTATION_TEMPLATES.map(tmpl => (
          <button key={tmpl.id} style={pt.card} onClick={() => onSelect(tmpl.name)}>
            {/* Превью */}
            <div style={{ ...pt.preview, background: pt.colors[tmpl.id] ?? "rgba(99,102,241,0.15)" }}>
              <span style={{ fontSize:36 }}>{tmpl.emoji}</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:6, fontWeight:600 }}>
                {tmpl.name.toUpperCase()}
              </span>
            </div>
            {/* Инфо */}
            <div style={pt.info}>
              <div style={pt.name}>{tmpl.name}</div>
              <div style={pt.desc}>{tmpl.desc}</div>
              <div style={pt.price}>от 250₽ · 1 день</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// Styles

const pt = {
  card: {
    display:"flex", alignItems:"center", gap:14,
    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
    borderRadius:16, padding:"14px", cursor:"pointer", textAlign:"left",
    width:"100%", boxSizing:"border-box",
  },
  preview: {
    width:70, height:70, borderRadius:12, flexShrink:0,
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
  },
  colors: {
    minimalism: "rgba(148,163,184,0.2)",
    corporate:  "rgba(59,130,246,0.2)",
    creative:   "rgba(245,158,11,0.2)",
    dark:       "rgba(30,30,50,0.8)",
    gradient:   "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(236,72,153,0.3))",
  },
  info: { flex:1, display:"flex", flexDirection:"column", gap:3 },
  name: { fontSize:15, fontWeight:700, color:"#f1f5f9" },
  desc: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  price:{ fontSize:12, color:"#818cf8", marginTop:2 },
}

const sv = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  backBtn: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  headerInfo: { display:"flex", flexDirection:"column", gap:2 },
  headerTitle: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  headerSub: { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body: { display:"flex", flexDirection:"column", gap:12, padding:"16px" },
  infoCard: { background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:14, padding:"14px 16px" },
  infoTitle: { fontSize:13, fontWeight:600, color:"#818cf8", marginBottom:6 },
  infoText: { fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.55 },
  serviceCard: { borderRadius:18, padding:"18px", border:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", gap:12 },
  serviceTop: { display:"flex", gap:14, alignItems:"flex-start" },
  serviceIcon: { fontSize:28, flexShrink:0 },
  serviceTitle: { fontSize:16, fontWeight:700, color:"#f1f5f9" },
  serviceDesc: { fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:3 },
  serviceBtn: { padding:"11px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#f1f5f9", fontSize:14, fontWeight:600, cursor:"pointer" },
  lastMsg: { fontSize:12, color:"rgba(255,255,255,0.35)", paddingTop:4, borderTop:"1px solid rgba(255,255,255,0.05)" },
}

const s = {
  root: { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", padding:"0 0 32px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:14, padding:"28px 20px 22px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  hglow: { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)", pointerEvents:"none" },
  avatar: { width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:600, color:"#fff", flexShrink:0, boxShadow:"0 0 0 3px rgba(99,102,241,0.25)" },
  htxt: { display:"flex", flexDirection:"column", gap:3 },
  greet: { fontSize:18, fontWeight:600, color:"#f1f5f9", letterSpacing:"-0.3px" },
  sub: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  banner: { margin:"14px 16px 0", background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.05))", border:"1px solid rgba(99,102,241,0.25)", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", position:"relative", overflow:"hidden" },
  bannerGlow: { position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)", pointerEvents:"none" },
  bannerL: { display:"flex", alignItems:"center", gap:12 },
  bannerTitle: { fontSize:14, fontWeight:600, color:"#f1f5f9" },
  bannerDesc: { fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 },
  bannerBtn: { background:"rgba(99,102,241,0.2)", border:"1px solid rgba(99,102,241,0.4)", color:"#818cf8", fontSize:13, fontWeight:600, padding:"6px 12px", borderRadius:10, flexShrink:0 },
  grid: { display:"flex", flexDirection:"column", gap:10, padding:"16px 16px 0" },
  card: { display:"flex", alignItems:"center", gap:14, border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left", width:"100%", boxSizing:"border-box", transition:"transform 0.12s,border-color 0.15s,background 0.15s,opacity 0.2s" },
  iw: { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  cb: { flex:1, display:"flex", flexDirection:"column", gap:2 },
  cl: { fontSize:15, fontWeight:600, color:"#f1f5f9", letterSpacing:"-0.2px" },
  cd: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  badge: { display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:28, fontSize:12, color:"rgba(255,255,255,0.2)" },
  dot: { width:6, height:6, borderRadius:"50%", background:"#10b981", display:"inline-block" },
}