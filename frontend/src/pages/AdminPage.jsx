import { useState, useEffect } from "react"
import { API, ADMIN_IDS, MANAGER_IDS, MANAGER_ID, PRINT_MANAGER_ID } from "../App"
import Tutor      from "./Tutor"
import Education  from "./Education"
import Focus      from "./Focus"
import Profile    from "./Profile"
import Wallet     from "./Wallet"
import OrderChat  from "./OrderChat"
import StatsView  from "./StatsView"
import SelfDestruct from "./SelfDestruct"



const MANAGER_CFG = {
  [MANAGER_ID]:       { label: "Презентации", chatType: "presentation" },
  [PRINT_MANAGER_ID]: { label: "Распечатка",  chatType: "print"        },
}
const CHAT_CONFIGS = {
  presentation: { managerId: MANAGER_ID,       icon: "🎞️", label: "Презентации" },
  print:        { managerId: PRINT_MANAGER_ID, icon: "🖨️", label: "Распечатка"  },
}
const USER_TILES = [
  { id:"tutor",      icon:"🎓", label:"Репетитор", color:"#6366f1" },
  { id:"education",  icon:"📚", label:"Учёба",     color:"#0ea5e9" },
  { id:"focus",      icon:"🎯", label:"Фокус",     color:"#f59e0b" },
  { id:"wallet",     icon:"💼", label:"Кошелёк",   color:"#f59e0b" },
  { id:"profile",    icon:"👤", label:"Профиль",   color:"#ec4899" },
  { id:"stats_user", icon:"📊", label:"Стат-ка",   color:"#10b981" },
  { id:"self_destruct", icon:"⚠️", label:"Самоликв.", color:"#ef4444" }
]
const TEMPLATES = [
  { id:"minimalism", name:"Минимализм",  desc:"Чистый и аккуратный стиль",    emoji:"⬜", color:"rgba(148,163,184,0.2)" },
  { id:"corporate",  name:"Корпоратив",  desc:"Строгий деловой стиль",        emoji:"🏢", color:"rgba(59,130,246,0.2)"  },
  { id:"creative",   name:"Креатив",     desc:"Яркие цвета и нестандартность",emoji:"🎨", color:"rgba(245,158,11,0.2)"  },
  { id:"dark",       name:"Тёмная тема", desc:"Элегантный тёмный дизайн",     emoji:"🌑", color:"rgba(20,20,40,0.9)"    },
  { id:"gradient",   name:"Градиент",    desc:"Плавные переходы цветов",      emoji:"🌈", color:"linear-gradient(135deg,rgba(99,102,241,0.3),rgba(236,72,153,0.3))" },
]

export default function AdminPage({ user, subscription, reloadSub, startParams }) {
  const isAdmin   = ADMIN_IDS.includes(user.id)
  const isManager = MANAGER_IDS.includes(user.id)
  const [page,       setPage]       = useState("home")
  const [activeTab,  setActiveTab]  = useState(isManager ? "orders" : "stats")
  const [chatType,   setChatType]   = useState(null)
  const [chatTarget, setChatTarget] = useState(null)
  const [svcView,    setSvcView]    = useState("main")

  // ── Юзерские разделы ────────────────────────────────────────────
  if (page === "tutor")
    return <Tutor user={user} goBack={() => setPage("home")} />
  if (page === "education")
    return <Education user={user} goBack={() => setPage("home")}
      initialView={startParams?.desmos ? "desmos" : null}
      initialDesmos={startParams?.desmos} />
  if (page === "focus")
    return <Focus goBack={() => setPage("home")} user={user} />  // ← передаём user
  if (page === "profile")
    return <Profile user={user} goBack={() => setPage("home")} subscription={subscription} />
  if (page === "wallet")
    return <Wallet user={user} goBack={() => setPage("home")} subscription={subscription} reloadSubscription={reloadSub} />
  if (page === "stats_user")
    return <StatsView goBack={() => setPage("home")} user={user} />
  if (page === "self_destruct")
    return <SelfDestruct user={user} goBack={() => setPage("home")} />
  if (page === "user_chat") {
    const cfg = CHAT_CONFIGS[chatType] ?? CHAT_CONFIGS.presentation
    return <OrderChat user={user} managerId={cfg.managerId}
      chatLabel={cfg.label} chatIcon={cfg.icon}
      goBack={() => { setChatType(null); setPage("home") }} />
  }
  if (page === "mgr_chat" && chatTarget) {
    return <OrderChat user={user} managerId={user.id}
      isManager={true} targetUserId={chatTarget.user_id}
      chatLabel={chatTarget.name || `User ${chatTarget.user_id}`} chatIcon="👤"
      goBack={() => { setChatTarget(null); setPage("home") }} />
  }

  // ── Главный экран ───────────────────────────────────────────────
  const TABS = [
    ...(isAdmin   ? [{ id:"stats",  label:"📊 Стат." }]    : []),
    { id:"plans",    label:"📦 Тарифы" },
    { id:"promos",   label:"🎟 Промо" },
    { id:"lectures", label:"📖 Лекции" },
    ...(isManager ? [{ id:"orders",  label:"📋 Заказы" }]  : []),
    { id:"broadcast",label:"📢 Рассылка" },
  ]

  return (
    <div style={s.root}>
      {/* Шапка */}
      <div style={s.header}>
        <div style={s.hglow} />
        <div style={s.avatar}>⚙️</div>
        <div style={s.hinfo}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={s.htitle}>Админ-панель</span>
            <span style={s.badge}>ADMIN</span>
          </div>
          <span style={s.hsub}>@{user.username || user.first_name}</span>
        </div>
      </div>

      {/* Плитки — пользовательские разделы */}
      <div style={s.secLabel}>РАЗДЕЛЫ ПОЛЬЗОВАТЕЛЯ</div>
      <div style={s.grid}>
        {USER_TILES.map(tile => (
          <button key={tile.id} style={s.tile} onClick={() => setPage(tile.id)}>
            <div style={{ ...s.tileIco, background: tile.color + "22" }}>
              <span style={{ fontSize:22 }}>{tile.icon}</span>
            </div>
            <span style={s.tileLabel}>{tile.label}</span>
          </button>
        ))}
      </div>

      {/* Вкладки управления */}
      <div style={s.tabsRow}>
        {TABS.map(tab => (
          <button key={tab.id}
            style={{ ...s.tab, ...(activeTab === tab.id ? s.tabOn : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >{tab.label}</button>
        ))}
      </div>

      {/* Контент */}
      <div style={s.content}>
        {activeTab === "stats"     && <TabStats />}
        {activeTab === "plans"     && <TabPlans />}
        {activeTab === "promos"    && <TabPromos />}
        {activeTab === "lectures"  && <TabLectures />}
        {activeTab === "broadcast" && <TabBroadcast />}
        {activeTab === "orders" && isManager && (
          <TabOrders managerId={user.id}
            onOpen={(chat) => { setChatTarget(chat); setPage("mgr_chat") }} />
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// ВКЛАДКА: Статистика
// ════════════════════════════════════════
function TabStats() {
  const [d, setD] = useState(null)
  const [l, setL] = useState(true)
  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/stats/users`).then(r=>r.json()),
      fetch(`${API}/admin/stats/finance`).then(r=>r.json()),
    ]).then(([u,f]) => { setD({u,f}); setL(false) }).catch(()=>setL(false))
  }, [])
  if (l) return <Spin />
  if (!d) return <Empty>Ошибка загрузки статистики</Empty>
  const {u,f} = d
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {[
        ["👥","Всего пользователей", u.total??0,       "#6366f1"],
        ["✅","С подпиской",          u.with_sub??0,    "#10b981"],
        ["🔴","Без подписки",         u.no_sub??0,      "#ef4444"],
        ["🆕","Новых сегодня",        u.new_today??0,   "#f59e0b"],
        ["📅","Новых за неделю",      u.new_week??0,    "#0ea5e9"],
        ["📆","Новых за месяц",       u.new_month??0,   "#8b5cf6"],
      ].map(([ic,lb,vl,cl]) => <SR key={lb} icon={ic} label={lb} val={vl} color={cl} />)}
      <div style={st.div} />
      {[
        ["💰","Доход всего",           `${(f.total_revenue??0).toFixed(0)}₽`,  "#f59e0b"],
        ["📅","За месяц",              `${(f.month_revenue??0).toFixed(0)}₽`,  "#f59e0b"],
        ["📆","Сегодня",               `${(f.today_revenue??0).toFixed(0)}₽`,  "#f59e0b"],
        ["📊","Платежей всего",         f.payment_count??0,                    "#6366f1"],
        ["✅","Активных подписок",      f.active_subs??0,                      "#10b981"],
      ].map(([ic,lb,vl,cl]) => <SR key={lb} icon={ic} label={lb} val={vl} color={cl} />)}
      <div style={st.div} />
      {[
        ["💳","Рублями (ЮКасса)",  `${(f.by_type?.rub?.total??0).toFixed(0)}₽`,    "#6366f1"],
        ["⭐","Telegram Stars",   `${(f.by_type?.stars?.total??0).toFixed(0)}₽`,   "#f59e0b"],
        ["₮", "Крипто (USDT)",    `${(f.by_type?.crypto?.total??0).toFixed(0)}₽`,  "#10b981"],
      ].map(([ic,lb,vl,cl]) => <SR key={lb} icon={ic} label={lb} val={vl} color={cl} />)}
    </div>
  )
}
function SR({ icon,label,val,color }) {
  return (
    <div style={st.row}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={st.rl}>{label}</span>
      <span style={{ ...st.rv, color }}>{val}</span>
    </div>
  )
}
const st = {
  row: { display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 12px" },
  rl:  { flex:1, fontSize:13, color:"rgba(255,255,255,0.5)" },
  rv:  { fontSize:14, fontWeight:700 },
  div: { height:1, background:"rgba(255,255,255,0.06)" },
}

// ════════════════════════════════════════
// ВКЛАДКА: Тарифы
// ════════════════════════════════════════
function TabPlans() {
  const [plans, setPlans]   = useState([])
  const [load,  setLoad]    = useState(true)
  const [form,  setForm]    = useState(false)
  const [inp,   setInp]     = useState({name:"",price:"",days:"",desc:""})
  const [toast, setToast]   = useState(null)
  const showT = (m,ok=true) => { setToast({m,ok}); setTimeout(()=>setToast(null),3000) }
  const reload = () => fetch(`${API}/admin/plans`).then(r=>r.json()).then(d=>{ setPlans(d.plans??[]); setLoad(false) }).catch(()=>setLoad(false))
  useEffect(()=>{ reload() },[])
  const create = async () => {
    if (!inp.name||!inp.price||!inp.days) { showT("Заполните все поля",false); return }
    const r = await fetch(`${API}/admin/plans`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:inp.name,price:+inp.price,duration_days:+inp.days,description:inp.desc})})
    const d = await r.json()
    if (d.success) { showT("✅ Тариф создан!"); setForm(false); setInp({name:"",price:"",days:"",desc:""}); reload() }
    else showT("Ошибка",false)
  }
  const del = async (id) => { await fetch(`${API}/admin/plans/${id}`,{method:"DELETE"}); showT("🗑 Удалён"); reload() }
  if (load) return <Spin />
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <Btn onClick={()=>setForm(true)}>+ Создать тариф</Btn>
      {form && <Form inp={inp} setInp={setInp} fields={[{k:"name",p:"Название"},{k:"price",p:"Цена ₽",t:"number"},{k:"days",p:"Дней",t:"number"},{k:"desc",p:"Описание (не обяз.)"}]} onSave={create} onCancel={()=>setForm(false)} />}
      {plans.length===0 && <Empty>Тарифов нет</Empty>}
      {plans.map(p=>(
        <div key={p._id} style={c.card}>
          <div style={{flex:1}}><div style={c.name}>📦 {p.name}</div><div style={c.meta}>{p.price}₽ · {p.duration_days} дней</div>{p.description&&<div style={c.desc}>{p.description}</div>}</div>
          <DelBtn onClick={()=>del(p._id)} />
        </div>
      ))}
      {toast&&<T m={toast.m} ok={toast.ok} />}
    </div>
  )
}

// ════════════════════════════════════════
// ВКЛАДКА: Промокоды
// ════════════════════════════════════════
function TabPromos() {
  const [promos,setPromos] = useState([])
  const [load,  setLoad]   = useState(true)
  const [form,  setForm]   = useState(false)
  const [inp,   setInp]    = useState({code:"",discount:"",maxUses:""})
  const [toast, setToast]  = useState(null)
  const showT = (m,ok=true) => { setToast({m,ok}); setTimeout(()=>setToast(null),3000) }
  const reload = () => fetch(`${API}/admin/promos`).then(r=>r.json()).then(d=>{ setPromos(d.promos??[]); setLoad(false) }).catch(()=>setLoad(false))
  useEffect(()=>{ reload() },[])
  const create = async () => {
    if (!inp.code||!inp.discount) { showT("Введите код и скидку",false); return }
    const r = await fetch(`${API}/admin/promos`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:inp.code.toUpperCase(),discount_percent:+inp.discount,max_uses:+inp.maxUses||0})})
    const d = await r.json()
    if (d.success) { showT("✅ Промокод создан!"); setForm(false); setInp({code:"",discount:"",maxUses:""}); reload() }
    else showT("Ошибка",false)
  }
  const del = async (id) => { await fetch(`${API}/admin/promos/${id}`,{method:"DELETE"}); showT("🗑 Удалён"); reload() }
  if (load) return <Spin />
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <Btn onClick={()=>setForm(true)}>+ Создать промокод</Btn>
      {form && <Form inp={inp} setInp={setInp} fields={[{k:"code",p:"КОД (пр. SALE50)"},{k:"discount",p:"Скидка %",t:"number"},{k:"maxUses",p:"Макс. использований (0=∞)",t:"number"}]} onSave={create} onCancel={()=>setForm(false)} />}
      {promos.length===0 && <Empty>Промокодов нет</Empty>}
      {promos.map(p=>(
        <div key={p._id} style={c.card}>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:"#818cf8",letterSpacing:1}}>{p.code}</div>
            <div style={c.meta}>{p.discount_percent}% · {p.uses_count}/{p.max_uses||"∞"} исп. · <span style={{color:p.active?"#10b981":"#ef4444"}}>{p.active?"✅":"❌"}</span></div>
          </div>
          <DelBtn onClick={()=>del(p._id)} />
        </div>
      ))}
      {toast&&<T m={toast.m} ok={toast.ok} />}
    </div>
  )
}

// ════════════════════════════════════════
// ВКЛАДКА: Лекции
// ════════════════════════════════════════
function TabLectures() {
  const [subjs, setSubjs] = useState([])
  const [load,  setLoad]  = useState(true)
  const [newS,  setNewS]  = useState("")
  const [toast, setToast] = useState(null)
  const showT = (m,ok=true) => { setToast({m,ok}); setTimeout(()=>setToast(null),3000) }
  const reload = () => fetch(`${API}/admin/lectures/subjects`).then(r=>r.json()).then(d=>{ setSubjs(d.subjects??[]); setLoad(false) }).catch(()=>setLoad(false))
  useEffect(()=>{ reload() },[])
  const add = async () => {
    if (!newS.trim()) return
    const r = await fetch(`${API}/admin/lectures/subjects`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newS.trim()})})
    const d = await r.json()
    if (d.success) { showT("✅ Предмет добавлен!"); setNewS(""); reload() }
    else showT("Ошибка",false)
  }
  const del = async (id) => { await fetch(`${API}/admin/lectures/subjects/${id}`,{method:"DELETE"}); showT("🗑 Удалён"); reload() }
  if (load) return <Spin />
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.55 }}>Лекции загружаются через Telegram-бота (команда Добавить лекцию). Здесь — управление предметами.</div>
      <div style={{ display:"flex", gap:8 }}>
        <input value={newS} onChange={e=>setNewS(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Название предмета..." style={fi.inp} />
        <button style={fi.add} onClick={add}>+</button>
      </div>
      {subjs.length===0 && <Empty>Предметов нет</Empty>}
      {subjs.map(s=>(
        <div key={s._id} style={c.card}>
          <span style={{fontSize:18}}>📘</span>
          <span style={{flex:1,fontSize:14,fontWeight:600,color:"#f1f5f9"}}>{s.name}</span>
          <DelBtn onClick={()=>del(s._id)} />
        </div>
      ))}
      {toast&&<T m={toast.m} ok={toast.ok} />}
    </div>
  )
}

// ════════════════════════════════════════
// ВКЛАДКА: Рассылка
// ════════════════════════════════════════
function TabBroadcast() {
  const [text, setText]   = useState("")
  const [load, setLoad]   = useState(false)
  const [res,  setRes]    = useState(null)
  const send = async () => {
    if (!text.trim()) return
    setLoad(true); setRes(null)
    try {
      const r = await fetch(`${API}/admin/broadcast`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})})
      setRes(await r.json())
    } catch { setRes({success:false,error:"Ошибка соединения"}) }
    finally { setLoad(false) }
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Текст рассылки (поддерживается HTML-форматирование)..." rows={5}
        style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 14px", color:"#f1f5f9", fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.55 }} />
      <Btn onClick={send} disabled={load||!text.trim()} opacity={load||!text.trim()?0.5:1}>
        {load?"Отправляю...":"📢 Отправить всем"}
      </Btn>
      {res && (
        <div style={{ background:res.success?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${res.success?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`, borderRadius:12, padding:"12px 14px", fontSize:13, color:res.success?"#10b981":"#ef4444" }}>
          {res.success ? `✅ Отправлено: ${res.sent}, ошибок: ${res.failed}, всего: ${res.total}` : `❌ ${res.error}`}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// ВКЛАДКА: Заказы (менеджер)
// ════════════════════════════════════════
function TabOrders({ managerId, onOpen }) {
  const [chats, setChats] = useState([])
  const [load,  setLoad]  = useState(true)
  const [cache, setCache] = useState({})
  const loadChats = async () => {
    try {
      const r = await fetch(`${API}/billing/chat/orders?manager_id=${managerId}`)
      const d = await r.json()
      const list = d.chats ?? []
      setChats(list)
      const unk = list.map(c=>c.user_id).filter(id=>!cache[id])
      if (unk.length) {
        const infos = await Promise.all(unk.map(id=>fetch(`${API}/billing/chat/user-info?user_id=${id}`).then(r=>r.json()).then(d=>({id,...d})).catch(()=>({id,name:`User ${id}`,group:""}))))
        setCache(prev=>{ const u={...prev}; infos.forEach(i=>{u[i.id]=i}); return u })
      }
    } catch {} finally { setLoad(false) }
  }
  useEffect(()=>{ loadChats(); const t=setInterval(loadChats,8000); return()=>clearInterval(t) },[])
  if (load) return <Spin />
  if (chats.length===0) return <Empty>Заказов пока нет. Когда пользователи напишут — появятся здесь.</Empty>
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {chats.map(chat=>{
        const info=cache[chat.user_id]
        const name=info?.name||`User ${chat.user_id}`
        return (
          <button key={chat.user_id} style={oc.card} onClick={()=>onOpen({...chat,name})}>
            <div style={oc.av}>{name[0]?.toUpperCase()??"?"}</div>
            <div style={oc.inf}>
              <div style={oc.nm}>{name}{info?.group&&<span style={oc.gr}> · {info.group}</span>}</div>
              <div style={oc.ls}>{chat.last_msg?.slice(0,52)??"Нет сообщений"}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
              {chat.unread>0&&<div style={oc.bd}>{chat.unread}</div>}
              <div style={oc.tm}>{chat.last_time?.slice(11,16)??""}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
const oc={card:{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"12px 14px",cursor:"pointer",width:"100%",textAlign:"left",boxSizing:"border-box"},av:{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",flexShrink:0},inf:{flex:1,overflow:"hidden"},nm:{fontSize:14,fontWeight:600,color:"#f1f5f9"},gr:{fontSize:12,color:"rgba(255,255,255,0.35)",fontWeight:400},ls:{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},tm:{fontSize:11,color:"rgba(255,255,255,0.25)"},bd:{background:"#6366f1",borderRadius:10,padding:"2px 7px",fontSize:11,fontWeight:700,color:"#fff"}}

// ════════════════════════════════════════
// Услуги (юзерская сторона)
// ════════════════════════════════════════
function UserServicesPage({ user, goBack }) {
  const [view, setView]  = useState("main")
  const [ct,   setCt]    = useState(null)
  if (view==="chat") { const cfg=CHAT_CONFIGS[ct]??CHAT_CONFIGS.presentation; return <OrderChat user={user} managerId={cfg.managerId} chatLabel={cfg.label} chatIcon={cfg.icon} goBack={()=>setView("main")} /> }
  if (view==="tmpl") return (
    <div style={sv.root}>
      <Hdr title="🎞️ Шаблоны" sub="Выберите стиль" onBack={()=>setView("main")} />
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {TEMPLATES.map(t=>(
          <button key={t.id} style={{display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px",cursor:"pointer",textAlign:"left",width:"100%",boxSizing:"border-box"}}
            onClick={()=>{setCt("presentation");setView("chat")}}>
            <div style={{width:64,height:64,borderRadius:12,flexShrink:0,background:t.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:30}}>{t.emoji}</span></div>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{t.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3}}>{t.desc}</div><div style={{fontSize:12,color:"#818cf8",marginTop:4}}>от 250₽ · 1 день</div></div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <div style={sv.root}>
      <Hdr title="📝 Услуги" sub="Мои заказы" onBack={goBack} />
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:12,padding:"12px 14px",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.55}}>Выберите услугу и напишите — менеджер ответит в ближайшее время.</div>
        <div style={{...sv.svc,borderColor:"rgba(99,102,241,0.25)",background:"rgba(99,102,241,0.08)"}}>
          <div style={sv.top}><span style={{fontSize:28}}>🎞️</span><div><div style={sv.tt}>Презентации</div><div style={sv.td}>От 250₽ · Срок: 1 день</div></div></div>
          <div style={{display:"flex",gap:8}}>
            <button style={{...sv.btn,flex:1,color:"#818cf8",borderColor:"rgba(99,102,241,0.3)"}} onClick={()=>setView("tmpl")}>📋 Шаблоны</button>
            <button style={{...sv.btn,flex:1,color:"#818cf8",borderColor:"rgba(99,102,241,0.3)"}} onClick={()=>{setCt("presentation");setView("chat")}}>💬 Написать</button>
          </div>
        </div>
        <div style={{...sv.svc,borderColor:"rgba(16,185,129,0.25)",background:"rgba(16,185,129,0.08)"}}>
          <div style={sv.top}><span style={{fontSize:28}}>🖨️</span><div><div style={sv.tt}>Распечатка</div><div style={sv.td}>10₽/стр · ДАС №6</div></div></div>
          <button style={{...sv.btn,color:"#10b981",borderColor:"rgba(16,185,129,0.3)"}} onClick={()=>{setCt("print");setView("chat")}}>💬 Написать менеджеру</button>
        </div>
      </div>
    </div>
  )
}
const sv={root:{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},svc:{borderRadius:16,padding:"16px",border:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",gap:12},top:{display:"flex",gap:14,alignItems:"flex-start"},tt:{fontSize:16,fontWeight:700,color:"#f1f5f9"},td:{fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:2},btn:{padding:"11px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#f1f5f9",fontSize:14,fontWeight:600,cursor:"pointer"}}

// ════════════════════════════════════════
// Переиспользуемые UI
// ════════════════════════════════════════
function Hdr({ title, sub, onBack }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 20px 18px",background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <button onClick={onBack} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#f1f5f9",padding:"7px 9px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div><div style={{fontSize:18,fontWeight:600,color:"#f1f5f9"}}>{title}</div>{sub&&<div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{sub}</div>}</div>
    </div>
  )
}
function Btn({ children, onClick, disabled, opacity=1 }) {
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:14,color:"#fff",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",opacity,boxShadow:"0 4px 16px rgba(99,102,241,0.3)"}}>{children}</button>
}
function DelBtn({ onClick }) {
  return <button onClick={onClick} style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"8px 10px",fontSize:16,cursor:"pointer",flexShrink:0}}>🗑</button>
}
function Form({ inp, setInp, fields, onSave, onCancel }) {
  return (
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
      {fields.map(f=>(
        <input key={f.k} type={f.t||"text"} value={inp[f.k]} placeholder={f.p}
          onChange={e=>setInp(p=>({...p,[f.k]:e.target.value}))}
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 14px",color:"#f1f5f9",fontSize:14,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}} />
      ))}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSave} style={{flex:1,padding:"11px",background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:10,color:"#818cf8",fontSize:14,fontWeight:600,cursor:"pointer"}}>✅ Сохранить</button>
        <button onClick={onCancel} style={{flex:1,padding:"11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer"}}>Отмена</button>
      </div>
    </div>
  )
}
function Spin() { return <div style={{display:"flex",justifyContent:"center",padding:"30px 0"}}><div style={{width:28,height:28,border:"2.5px solid rgba(255,255,255,0.08)",borderTop:"2.5px solid #6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} /></div> }
function Empty({ children }) { return <div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:"24px 0",fontSize:13,lineHeight:1.6}}>{children}</div> }
function T({ m, ok }) { return <div style={{position:"fixed",bottom:24,left:16,right:16,background:ok?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",border:`1px solid ${ok?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:14,padding:"12px 16px",color:ok?"#10b981":"#ef4444",fontSize:14,fontWeight:600,zIndex:999,backdropFilter:"blur(12px)",animation:"fadeIn 0.2s ease"}}>{m}</div> }

const c={card:{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px"},name:{fontSize:15,fontWeight:700,color:"#f1f5f9"},meta:{fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:3},desc:{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:4}}
const fi={inp:{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"11px 14px",color:"#f1f5f9",fontSize:14,outline:"none",fontFamily:"inherit"},add:{width:44,height:44,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:12,color:"#818cf8",fontSize:22,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}

const s = {
  root:      { minHeight:"100vh", background:"#0a0f1e", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom:32 },
  header:    { position:"relative", overflow:"hidden", display:"flex", alignItems:"center", gap:14, padding:"24px 20px 20px", background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  hglow:     { position:"absolute", top:-60, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(245,158,11,0.18) 0%,transparent 70%)", pointerEvents:"none" },
  avatar:    { width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0, boxShadow:"0 0 0 3px rgba(245,158,11,0.22)" },
  hinfo:     { display:"flex", flexDirection:"column", gap:4 },
  htitle:    { fontSize:18, fontWeight:700, color:"#f1f5f9" },
  badge:     { background:"rgba(245,158,11,0.2)", border:"1px solid rgba(245,158,11,0.5)", color:"#f59e0b", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, letterSpacing:1 },
  hsub:      { fontSize:12, color:"rgba(255,255,255,0.4)" },
  secLabel:  { fontSize:11, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.8px", padding:"14px 20px 8px" },
  grid:      { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, padding:"0 14px 8px" },
  tile:      { display:"flex", flexDirection:"column", alignItems:"center", gap:5, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"10px 4px", cursor:"pointer" },
  tileIco:   { width:46, height:46, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" },
  tileLabel: { fontSize:10, color:"rgba(255,255,255,0.65)", fontWeight:500, textAlign:"center", lineHeight:1.2 },
  tabsRow:   { display:"flex", gap:6, padding:"8px 14px 10px", overflowX:"auto", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  tab:       { padding:"7px 13px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, color:"rgba(255,255,255,0.5)", fontSize:12.5, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },
  tabOn:     { background:"rgba(99,102,241,0.15)", borderColor:"rgba(99,102,241,0.35)", color:"#818cf8", fontWeight:600 },
  content:   { padding:"14px 14px 0", display:"flex", flexDirection:"column", gap:10 },
}