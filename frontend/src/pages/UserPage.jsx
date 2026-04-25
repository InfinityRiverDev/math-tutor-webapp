import { useState, useEffect } from "react"
import { API } from "../App"
import Tutor      from "./Tutor"
import Profile    from "./Profile"
import Wallet     from "./Wallet"
import Education  from "./Education"
import Focus      from "./Focus"
import OrderChat  from "./OrderChat"
import StatsView  from "./StatsView"
import ArtGen from "./ArtGen"

const PRESENTATION_TEMPLATES = [
  { id: "minimalism", name: "Минимализм",  desc: "Чистый и аккуратный стиль",     emoji: "⬜", color: "rgba(148,163,184,0.2)", image: "/templates/collage_1.jpg" },
  { id: "corporate",  name: "Корпоратив",  desc: "Строгий деловой стиль",         emoji: "🏢", color: "rgba(59,130,246,0.2)",  image: "/templates/collage_2.jpg"  },
  { id: "creative",   name: "Креатив",     desc: "Яркие цвета и нестандартность", emoji: "🎨", color: "rgba(245,158,11,0.2)",  image: "/templates/collage_3.jpg"   },
  { id: "dark",       name: "Тёмная тема", desc: "Элегантный тёмный дизайн",      emoji: "🌑", color: "rgba(30,30,50,0.8)",    image: "/templates/collage_4.jpg"       }
]

// Прямо здесь, без импорта из App
const MANAGER_ID_LOCAL       = 858414038
const PRINT_MANAGER_ID_LOCAL = 1991833177

const CHAT_CONFIGS = {
  presentation: { 
    managerId: MANAGER_ID_LOCAL,       
    icon: "🎞️", 
    label: "Презентации" 
  },
  print: { 
    managerId: PRINT_MANAGER_ID_LOCAL, 
    icon: "🖨️", 
    label: "Распечатка"  
  },
}

const ITEMS = [
  { id:"tutor",     icon:"🎓", label:"ИИ-репетитор", desc:"Задай вопрос — получи ответ",  color:"#6366f1", locked:true  },
  { id:"education", icon:"📚", label:"Образование",   desc:"Лекции, расписание, Desmos",   color:"#0ea5e9", locked:true  },
  { id:"focus",     icon:"🎯", label:"Фокус",         desc:"Помодоро, музыка, To-Do",      color:"#f59e0b", locked:true  },
  { id:"artgen",    icon:"🎨", label:"AI-рисование",  desc:"Генерация картинок",           color:"#ec4899", locked:true  }, // ← ДОБАВЬ
  { id:"services",  icon:"📝", label:"Услуги",        desc:"Мои заказы и чаты",            color:"#10b981", locked:false },
  { id:"wallet",    icon:"💼", label:"Кошелёк",       desc:"Баланс и тарифы",              color:"#f59e0b", locked:false },
  { id:"profile",   icon:"👤", label:"Профиль",       desc:"Данные и подписка",            color:"#ec4899", locked:false },
  { id:"stats",     icon:"📊", label:"Статистика",    desc:"Активность и достижения",      color:"#10b981", locked:false },
]

export default function UserPage({ user, subscription, reloadSub, startParams }) {
  const getInitialPage = () => {
    if (startParams?.desmos)   return "education"
    if (startParams?.openchat) return "order_chat"  // ← сразу в чат
    if (startParams?.page)     return startParams.page
    return "home"
  }

  const [page,     setPage]     = useState(getInitialPage())
  const [chatType, setChatType] = useState(startParams?.openchat || null)  // ← из URL
  const [prefill,  setPrefill]  = useState(
    startParams?.template
      ? `Хочу заказать презентацию по шаблону «${startParams.template}»`
      : null
  )
  const [pressed, setPressed] = useState(null)  // ← ДОБАВЬ
  const [flash,   setFlash]   = useState(null)  // ← ДОБАВЬ

  const hasSub = subscription?.active === true

  const handleCard = (item) => {
    if (item.locked && !hasSub) {
      setFlash(item.id); setTimeout(() => setFlash(null), 600)
      return
    }
    setPage(item.id)
  }

  const openChat = (type, msg = null) => {
    console.log("🟢 openChat called:", { type, msg })
    setChatType(type)
    setPrefill(msg)
    setPage("order_chat")
  }

  // Рендер страниц
  if (page === "tutor")
    return <Tutor user={user} goBack={() => setPage("home")} />
  if (page === "profile")
    return <Profile user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")
    return <Wallet user={user} goBack={() => setPage("home")} subscription={subscription} reloadSubscription={reloadSub} />
  if (page === "education")
    return <Education user={user} goBack={() => setPage("home")} initialView={startParams?.desmos ? "desmos" : null} initialDesmos={startParams?.desmos} />
  if (page === "focus")
    return <Focus goBack={() => setPage("home")} user={user} />
  if (page === "stats")
    return <StatsView goBack={() => setPage("home")} user={user} />
  if (page === "services")
    return <ServicesPage user={user} goBack={() => setPage("home")} onOpenChat={openChat} />
  if (page === "artgen")
  return <ArtGen goBack={() => setPage("home")} />

  // ✅ ИСПРАВЛЕНО: передаём КОНКРЕТНЫЙ managerId
  if (page === "order_chat" && chatType) {
    const cfg = CHAT_CONFIGS[chatType]
    console.log("🟢 Rendering OrderChat with cfg:", cfg)
    
    if (!cfg || !cfg.managerId) {
      console.error("❌ No config for chatType:", chatType)
      return (
        <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "system-ui" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px", background: "linear-gradient(160deg,#131929,#0a0f1e)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={() => { setChatType(null); setPage("services") }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600 }}>Ошибка: чат не найден</span>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Не удалось открыть чат. Попробуйте позже.
          </div>
        </div>
      )
    }
    
    // ✅ Передаём managerId ПРЯМО из конфига
    return (
      <OrderChat
        user={user}
        managerId={cfg.managerId}     // ← ГАРАНТИРОВАННО число
        chatLabel={cfg.label}
        chatIcon={cfg.icon}
        prefill={prefill}
        isManager={false}
        targetUserId={null}
        goBack={() => { 
          console.log("🟢 Going back from chat")
          setPage("services"); 
          setPrefill(null); 
          setChatType(null) 
        }}
      />
    )
  }

  // Главный экран
  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.hglow} />
        <div style={s.avatar}>{user.first_name?.[0]?.toUpperCase() ?? "?"}</div>
        <div style={s.htxt}>
          <span style={s.greet}>Привет, {user.first_name} 👋</span>
          <span style={s.hsub}>{hasSub ? `✅ ${subscription.plan_name}` : "🔒 Нет тарифа"}</span>
        </div>
      </div>

      {!hasSub && (
        <div style={s.banner} onClick={() => setPage("wallet")}>
          <div style={s.bannerGlow} />
          <div style={s.bannerL}>
            <span style={{ fontSize:24 }}>🔒</span>
            <div>
              <div style={s.bannerTitle}>Нет активного тарифа</div>
              <div style={s.bannerDesc}>Доступны Услуги, Кошелёк, Профиль, Статистика</div>
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
      </div>

      <div style={s.badge}><span style={s.dot} />Math Tutor · powered by AI</div>
    </div>
  )
}

// ── Страница Услуг ────────────────────────────────────────────────

function ServicesPage({ user, goBack, onOpenChat }) {
  const [view,    setView]    = useState("main")
  const [chats,   setChats]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const results = await Promise.all(
        Object.entries(CHAT_CONFIGS).map(async ([type, cfg]) => {
          if (!cfg?.managerId) return { type, cfg, lastMsg: null }
          try {
            const r = await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${cfg.managerId}`)
            if (!r.ok) return { type, cfg, lastMsg: null }
            const d = await r.json()
            const msgs = d.messages ?? []
            return { type, cfg, lastMsg: msgs[msgs.length - 1] ?? null }
          } catch {
            return { type, cfg, lastMsg: null }
          }
        })
      )
      setChats(results)
      setLoading(false)
    }
    load()
  }, [])

  if (view === "templates") return (
    <PresentationTemplates
      goBack={() => setView("main")}
      onSelect={(name) => onOpenChat("presentation", `Хочу заказать презентацию: шаблон "${name}"`)}
    />
  )

  return (
    <div style={sv.root}>
      <div style={sv.header}>
        <button style={sv.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={sv.title}>📝 Услуги</div>
          <div style={sv.sub}>Мои заказы с менеджерами</div>
        </div>
      </div>

      <div style={sv.body}>
        <div style={sv.info}>
          Здесь ваши чаты с менеджерами. Выберите услугу и напишите — ответят в ближайшее время.
        </div>

        {/* Презентации */}
        <div style={{ ...sv.card, borderColor: "rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.08)" }}>
          <div style={sv.cardTop}>
            <span style={{ fontSize: 28 }}>🎞️</span>
            <div>
              <div style={sv.cardTitle}>Презентации</div>
              <div style={sv.cardDesc}>От 250₽ · Срок: 1 день</div>
              {!loading && chats.find(c => c.type === "presentation")?.lastMsg && (
                <div style={sv.lastMsg}>
                  💬 {chats.find(c => c.type === "presentation").lastMsg.text?.slice(0, 45) ?? "Файл"}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...sv.btn, flex: 1, color: "#818cf8", borderColor: "rgba(99,102,241,0.3)" }}
              onClick={() => setView("templates")}>
              📋 Шаблоны
            </button>
            <button style={{ ...sv.btn, flex: 1, color: "#818cf8", borderColor: "rgba(99,102,241,0.3)" }}
              onClick={() => {
                console.log("🟢 Opening presentation chat")
                onOpenChat("presentation")
              }}>
              💬 Написать
            </button>
          </div>
        </div>

        {/* Распечатка */}
        <div style={{ ...sv.card, borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.08)" }}>
          <div style={sv.cardTop}>
            <span style={{ fontSize: 28 }}>🖨️</span>
            <div>
              <div style={sv.cardTitle}>Распечатка</div>
              <div style={sv.cardDesc}>10₽/стр · Забрать в ДАС №6</div>
              {!loading && chats.find(c => c.type === "print")?.lastMsg && (
                <div style={sv.lastMsg}>
                  💬 {chats.find(c => c.type === "print").lastMsg.text?.slice(0, 45) ?? "Файл"}
                </div>
              )}
            </div>
          </div>
          <button style={{ ...sv.btn, color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
            onClick={() => {
              console.log("🟢 Opening print chat")
              onOpenChat("print")
            }}>
            💬 Написать менеджеру
          </button>
        </div>
      </div>
    </div>
  )
}

function PresentationTemplates({ goBack, onSelect }) {
  const [selected, setSelected] = useState(null)

  return (
    <div style={sv.root}>
      <div style={sv.header}>
        <button style={sv.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={sv.title}>🎞️ Шаблоны</div>
          <div style={sv.sub}>Выберите стиль презентации</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...sv.info, marginBottom: 4 }}>
          Нажмите на шаблон чтобы увидеть пример — затем заказывайте.
        </div>

        {PRESENTATION_TEMPLATES.map(tmpl => (
          <div key={tmpl.id} style={pt.wrapper}>
            {/* Карточка шаблона */}
            <button style={pt.card} onClick={() => setSelected(selected?.id === tmpl.id ? null : tmpl)}>
              {/* Превью — фото если есть, иначе заглушка */}
              <div style={{ ...pt.preview, background: tmpl.color, position: "relative", overflow: "hidden" }}>
                {tmpl.image
                  ? <img src={tmpl.image} alt={tmpl.name} style={pt.previewImg} onError={e => e.target.style.display = "none"} />
                  : <span style={{ fontSize: 34 }}>{tmpl.emoji}</span>
                }
              </div>
              <div style={pt.info}>
                <div style={pt.name}>{tmpl.name}</div>
                <div style={pt.desc}>{tmpl.desc}</div>
                <div style={pt.price}>от 250₽ · 1 день</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ transform: selected?.id === tmpl.id ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink:0 }}>
                <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Раскрывающийся блок с большим превью */}
            {selected?.id === tmpl.id && (
              <div style={pt.expanded}>
                {tmpl.image && (
                  <img src={tmpl.image} alt={tmpl.name} style={pt.bigImg} />
                )}
                <button style={pt.orderBtn} onClick={() => onSelect(tmpl.name)}>
                  💬 Заказать этот шаблон →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
const s = {
  root:   { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", padding:"0 0 32px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:14, padding:"28px 20px 22px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  hglow:  { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)", pointerEvents:"none" },
  avatar: { width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:600, color:"#fff", flexShrink:0, boxShadow:"0 0 0 3px rgba(99,102,241,0.25)" },
  htxt:   { display:"flex", flexDirection:"column", gap:3 },
  greet:  { fontSize:18, fontWeight:600, color:"#f1f5f9", letterSpacing:"-0.3px" },
  hsub:   { fontSize:12, color:"rgba(255,255,255,0.4)" },
  banner: { margin:"14px 16px 0", background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.05))", border:"1px solid rgba(99,102,241,0.25)", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", position:"relative", overflow:"hidden" },
  bannerGlow: { position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)", pointerEvents:"none" },
  bannerL:    { display:"flex", alignItems:"center", gap:12 },
  bannerTitle:{ fontSize:14, fontWeight:600, color:"#f1f5f9" },
  bannerDesc: { fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 },
  bannerBtn:  { background:"rgba(99,102,241,0.2)", border:"1px solid rgba(99,102,241,0.4)", color:"#818cf8", fontSize:13, fontWeight:600, padding:"6px 12px", borderRadius:10, flexShrink:0 },
  grid: { display:"flex", flexDirection:"column", gap:10, padding:"16px 16px 0" },
  card: { display:"flex", alignItems:"center", gap:14, border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left", width:"100%", boxSizing:"border-box", transition:"transform 0.12s,border-color 0.15s,background 0.15s,opacity 0.2s" },
  iw:   { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  cb:   { flex:1, display:"flex", flexDirection:"column", gap:2 },
  cl:   { fontSize:15, fontWeight:600, color:"#f1f5f9", letterSpacing:"-0.2px" },
  cd:   { fontSize:12, color:"rgba(255,255,255,0.4)" },
  badge:{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:28, fontSize:12, color:"rgba(255,255,255,0.2)" },
  dot:  { width:6, height:6, borderRadius:"50%", background:"#10b981", display:"inline-block" },
}

const sv = {
  root:  { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header:{ display:"flex", alignItems:"center", gap:12, padding:"20px 20px 18px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  back:  { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f1f5f9", padding:"7px 9px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  title: { fontSize:18, fontWeight:600, color:"#f1f5f9" },
  sub:   { fontSize:12, color:"rgba(255,255,255,0.35)" },
  body:  { display:"flex", flexDirection:"column", gap:12, padding:"16px" },
  info:  { background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:12, padding:"12px 14px", fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.55 },
  card:  { borderRadius:16, padding:"16px", border:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", gap:12 },
  cardTop: { display:"flex", gap:14, alignItems:"flex-start" },
  cardTitle:{ fontSize:16, fontWeight:700, color:"#f1f5f9" },
  cardDesc: { fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:2 },
  lastMsg:  { fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:5, fontStyle:"italic" },
  btn:   { padding:"11px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#f1f5f9", fontSize:14, fontWeight:600, cursor:"pointer" },
}

const pt = {
  // старые стили оставь, добавь новые:
  wrapper:    { display:"flex", flexDirection:"column", gap:0 },
  card:       { display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px", cursor:"pointer", textAlign:"left", width:"100%", boxSizing:"border-box" },
  preview:    { width:72, height:72, borderRadius:12, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  previewImg: { width:"100%", height:"100%", objectFit:"cover" },
  info:       { flex:1, display:"flex", flexDirection:"column", gap:3 },
  name:       { fontSize:15, fontWeight:700, color:"#f1f5f9" },
  desc:       { fontSize:12, color:"rgba(255,255,255,0.4)" },
  price:      { fontSize:12, color:"#818cf8", marginTop:2 },
  expanded:   { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderTop:"none", borderRadius:"0 0 16px 16px", padding:14, display:"flex", flexDirection:"column", gap:12 },
  bigImg:     { width:"100%", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)" },
  orderBtn:   { padding:"12px", background:"linear-gradient(135deg,#6366f1,#4f46e5)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
}