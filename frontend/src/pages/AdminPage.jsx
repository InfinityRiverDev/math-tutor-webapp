import React, { useState, useEffect, useRef } from "react"
import { API, ADMIN_IDS, MANAGER_ID, PRINT_MANAGER_ID, MANAGER_IDS } from "../App"
import Tutor     from "./Tutor"
import Profile   from "./Profile"
import Wallet    from "./Wallet"
import Education from "./Education"
import Services  from "./Services"
import Focus     from "./Focus"
import OrderChat from "./OrderChat"
import StatsView from "./StatsView"

export default function AdminPage({ user, subscription, reloadSub }) {
  const [page,       setPage]       = useState("admin")
  const [chatTarget, setChatTarget] = useState(null)

  const goToChat = (managerId, prefill) => {
    setChatTarget({ managerId, prefill })
    setPage("orderchat")
  }

  if (page === "tutor")     return <Tutor     user={user} goBack={() => setPage("admin")} />
  if (page === "profile")   return <Profile   user={user} goBack={() => setPage("admin")} subscription={subscription} />
  if (page === "wallet")    return <Wallet    user={user} goBack={() => setPage("admin")} subscription={subscription} reloadSubscription={reloadSub} />
  if (page === "education") return <Education user={user} goBack={() => setPage("admin")} />
  if (page === "services")  return <Services  user={user} goBack={() => setPage("admin")} onOrder={goToChat} />
  if (page === "focus")     return <Focus     goBack={() => setPage("admin")} />
  if (page === "stats")     return <StatsView user={user} goBack={() => setPage("admin")} />
  if (page === "orderchat" && chatTarget) return (
    <OrderChat
      user={user}
      managerId={chatTarget.managerId}
      prefill={chatTarget.prefill}
      goBack={() => { setPage("admin"); setChatTarget(null) }}
    />
  )

  // Менеджер — пользователи у которых есть вкладка «Заказы»
  const isManager = MANAGER_IDS.includes(user.id)

  return <AdminHome user={user} setPage={setPage} isManager={isManager} />
}

function AdminHome({ user, setPage, isManager }) {
  const baseTabs = [
    { id:"stats",     label:"📊 Стат."    },
    { id:"plans",     label:"📦 Тарифы"   },
    { id:"promos",    label:"🎟 Промо"    },
    { id:"lectures",  label:"📖 Лекции"   },
    { id:"broadcast", label:"📢 Рассылка" },
  ]
  // Вкладка «Заказы» — для обоих менеджеров (презентации и распечатки)
  const tabs = isManager
    ? [...baseTabs, { id:"orders", label:"📦 Заказы" }]
    : baseTabs

  const [activeTab, setActiveTab] = useState(isManager ? "orders" : "stats")

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.adminBadge}>⚙️</div>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>Админ-панель</span>
          <span style={s.headerSub}>@{user.username || user.first_name}</span>
        </div>
        <div style={s.adminTag}>ADMIN</div>
      </div>

      {/* Быстрый доступ */}
      <div style={s.userAccessBlock}>
        <div style={s.userAccessTitle}>Разделы пользователя</div>
        <div style={s.userAccessRow}>
          {[
            { id:"tutor",     icon:"🎓", label:"Репетитор" },
            { id:"education", icon:"📚", label:"Учёба"     },
            { id:"focus",     icon:"🎯", label:"Фокус"     },
            { id:"services",  icon:"📝", label:"Услуги"    },
            { id:"wallet",    icon:"💼", label:"Кошелёк"   },
            { id:"profile",   icon:"👤", label:"Профиль"   },
            { id:"stats",     icon:"📊", label:"Стат-ка"   },
          ].map(item => (
            <button key={item.id} style={s.userAccessBtn} onClick={() => setPage(item.id)}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={s.userAccessLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={s.tabs}>
        {tabs.map(t => (
          <button key={t.id}
            style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.tabContent}>
        {activeTab === "stats"     && <StatsTab />}
        {activeTab === "plans"     && <PlansTab />}
        {activeTab === "promos"    && <PromosTab />}
        {activeTab === "lectures"  && <LecturesTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
        {activeTab === "orders"    && <OrdersTab user={user} />}
      </div>
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────────

function StatsTab() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/admin/users/count`)
      const data = await res.json()
      setStats(data)
    } catch { setStats({ error: true }) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div style={tab.section}>
      {loading ? <Spinner /> : stats && !stats.error ? (
        <div style={tab.statsCard}>
          <div style={tab.statsGlow} />
          <div style={tab.statsLabel}>Всего пользователей</div>
          <div style={tab.statsValue}>{stats.count ?? "—"}</div>
          <div style={tab.statsHint}>за всё время</div>
        </div>
      ) : stats?.error ? (
        <div style={tab.empty}>❌ Ошибка загрузки</div>
      ) : null}
      <button style={tab.btn} onClick={load}>🔄 Обновить</button>
    </div>
  )
}

// ── Plans ─────────────────────────────────────────────────────────

function PlansTab() {
  const [plans,    setPlans]    = useState([])
  const [view,     setView]     = useState("list")
  const [editPlan, setEditPlan] = useState(null)
  const [form,     setForm]     = useState({ name:"", price:"", duration_days:"", description:"" })
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState(null)

  const showMsg = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3500) }

  const load = async () => {
    try { const r=await fetch(`${API}/billing/plans`); const d=await r.json(); setPlans(d.plans??[]) } catch {}
  }
  useEffect(()=>{load()},[])

  const openCreate = () => { setForm({name:"",price:"",duration_days:"",description:""}); setView("create") }
  const openEdit   = (p) => { setEditPlan(p); setForm({name:p.name,price:String(p.price),duration_days:String(p.duration_days),description:p.description??""}); setView("edit") }

  const save = async () => {
    if (!form.name||!form.price||!form.duration_days){showMsg("Заполни все поля",false);return}
    setLoading(true)
    try {
      const body={...form,price:parseFloat(form.price),duration_days:parseInt(form.duration_days)}
      const url=view==="create"?`${API}/admin/plans`:`${API}/admin/plans/${editPlan._id}`
      const method=view==="create"?"POST":"PUT"
      const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      const d=await r.json()
      if(d.success||d.plan_id){showMsg(view==="create"?"✅ Создан!":"✅ Обновлён!");setView("list");load()}
      else showMsg(d.error??"Ошибка",false)
    } catch{showMsg("Ошибка соединения",false)}
    finally{setLoading(false)}
  }

  const deletePlan = async (id) => {
    if(!window.confirm("Удалить тариф?"))return
    try{await fetch(`${API}/admin/plans/${id}`,{method:"DELETE"});showMsg("🗑 Удалено");load()}
    catch{showMsg("Ошибка",false)}
  }

  if(view!=="list") return (
    <div style={tab.section}>
      <div style={tab.formTitle}>{view==="create"?"➕ Новый тариф":"✏️ Редактировать"}</div>
      {[{key:"name",label:"Название"},{key:"price",label:"Цена (₽)",type:"number"},{key:"duration_days",label:"Срок (дней)",type:"number"},{key:"description",label:"Описание"}].map(f=>(
        <div key={f.key} style={tab.fieldWrap}>
          <label style={tab.fieldLabel}>{f.label}</label>
          <input type={f.type??"text"} value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))} style={tab.input}/>
        </div>
      ))}
      <div style={tab.btnRow}>
        <button style={tab.btn} onClick={()=>setView("list")}>← Назад</button>
        <button style={tab.btnPrimary} onClick={save} disabled={loading}>{loading?"...":"Сохранить"}</button>
      </div>
      {msg&&<div style={{...tab.msg,color:msg.ok?"#10b981":"#ef4444"}}>{msg.m}</div>}
    </div>
  )

  return (
    <div style={tab.section}>
      <button style={tab.btnPrimary} onClick={openCreate}>➕ Создать тариф</button>
      {plans.length===0&&<div style={tab.empty}>Тарифов пока нет</div>}
      {plans.map(p=>(
        <div key={p._id} style={tab.itemCard}>
          <div style={tab.itemMain} onClick={()=>openEdit(p)}>
            <span style={tab.itemName}>{p.name}</span>
            <span style={tab.itemSub}>{p.price}₽ · {p.duration_days} дней</span>
          </div>
          <div style={tab.itemActions}>
            <button style={tab.iconBtn} onClick={()=>openEdit(p)}>✏️</button>
            <button style={tab.iconBtnDanger} onClick={()=>deletePlan(p._id)}>🗑</button>
          </div>
        </div>
      ))}
      {msg&&<div style={{...tab.msg,color:msg.ok?"#10b981":"#ef4444"}}>{msg.m}</div>}
    </div>
  )
}

// ── Promos ────────────────────────────────────────────────────────

function PromosTab() {
  const [promos,   setPromos]   = useState([])
  const [creating, setCreating] = useState(false)
  const [form,     setForm]     = useState({code:"",discount_percent:"",max_uses:""})
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState(null)

  const showMsg=(m,ok=true)=>{setMsg({m,ok});setTimeout(()=>setMsg(null),3500)}

  const load=async()=>{try{const r=await fetch(`${API}/admin/promos`);const d=await r.json();setPromos(d.promos??[])}catch{}}
  useEffect(()=>{load()},[])

  const create=async()=>{
    if(!form.code||!form.discount_percent){showMsg("Введи код и скидку",false);return}
    setLoading(true)
    try{
      const r=await fetch(`${API}/admin/promos`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:form.code.toUpperCase(),discount_percent:parseInt(form.discount_percent),max_uses:parseInt(form.max_uses)||0})})
      const d=await r.json()
      if(d.success||d.promo_id){showMsg("✅ Промокод создан!");setForm({code:"",discount_percent:"",max_uses:""});setCreating(false);load()}
      else showMsg(d.error??"Ошибка",false)
    }catch{showMsg("Ошибка соединения",false)}
    finally{setLoading(false)}
  }

  const deletePromo=async(id)=>{
    if(!window.confirm("Удалить промокод?"))return
    try{await fetch(`${API}/admin/promos/${id}`,{method:"DELETE"});showMsg("🗑 Удалено");load()}catch{showMsg("Ошибка",false)}
  }

  return (
    <div style={tab.section}>
      {!creating?(
        <button style={tab.btnPrimary} onClick={()=>setCreating(true)}>➕ Создать промокод</button>
      ):(
        <div style={tab.formCard}>
          <div style={tab.formTitle}>🎟 Новый промокод</div>
          {[{key:"code",label:"Код"},{key:"discount_percent",label:"Скидка %",type:"number"},{key:"max_uses",label:"Макс. исп. (0=∞)",type:"number"}].map(f=>(
            <div key={f.key} style={tab.fieldWrap}>
              <label style={tab.fieldLabel}>{f.label}</label>
              <input type={f.type??"text"} value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))} style={tab.input}/>
            </div>
          ))}
          <div style={tab.btnRow}>
            <button style={tab.btn} onClick={()=>setCreating(false)}>Отмена</button>
            <button style={tab.btnPrimary} onClick={create} disabled={loading}>{loading?"...":"Создать"}</button>
          </div>
        </div>
      )}
      {promos.length===0&&!creating&&<div style={tab.empty}>Промокодов пока нет</div>}
      {promos.map(p=>(
        <div key={p._id} style={tab.itemCard}>
          <div style={tab.itemMain}>
            <span style={{...tab.itemName,fontFamily:"monospace"}}>{p.code}</span>
            <span style={tab.itemSub}>{p.discount_percent}% · {p.max_uses>0?`${p.uses_count}/${p.max_uses}`:`${p.uses_count} исп.`}{!p.active?" · ❌":""}</span>
          </div>
          <button style={tab.iconBtnDanger} onClick={()=>deletePromo(p._id)}>🗑</button>
        </div>
      ))}
      {msg&&<div style={{...tab.msg,color:msg.ok?"#10b981":"#ef4444"}}>{msg.m}</div>}
    </div>
  )
}

// ── Lectures ──────────────────────────────────────────────────────

function LecturesTab() {
  const [subjects,setSubjects]=useState([])
  const [sel,setSel]=useState(null)
  const [lectures,setLectures]=useState([])
  const [newName,setNewName]=useState("")
  const [adding,setAdding]=useState(false)
  const [msg,setMsg]=useState(null)
  const showMsg=(m,ok=true)=>{setMsg({m,ok});setTimeout(()=>setMsg(null),3500)}
  const loadSubj=async()=>{try{const r=await fetch(`${API}/lectures/subjects`);const d=await r.json();setSubjects(d.subjects??[])}catch{}}
  const loadLec=async(id)=>{try{const r=await fetch(`${API}/lectures/by-subject/${id}`);const d=await r.json();setLectures(d.lectures??[])}catch{}}
  useEffect(()=>{loadSubj()},[])
  const addSubj=async()=>{
    if(!newName.trim())return
    try{const r=await fetch(`${API}/admin/lectures/subjects`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName.trim()})});const d=await r.json();if(d.success||d.subject_id){showMsg("✅ Предмет добавлен!");setNewName("");setAdding(false);loadSubj()}else showMsg(d.error??"Ошибка",false)}catch{showMsg("Ошибка",false)}
  }
  const delSubj=async(id)=>{if(!window.confirm("Удалить предмет?"))return;try{await fetch(`${API}/admin/lectures/subjects/${id}`,{method:"DELETE"});showMsg("🗑");loadSubj()}catch{}}
  const delLec=async(id)=>{try{await fetch(`${API}/admin/lectures/${id}`,{method:"DELETE"});showMsg("🗑 Лекция удалена");loadLec(sel._id)}catch{}}

  if(sel) return (
    <div style={tab.section}>
      <button style={tab.btn} onClick={()=>setSel(null)}>← К предметам</button>
      <div style={tab.sectionLabel}>{sel.name}</div>
      <div style={tab.hint}>📌 Загрузка PDF — через бота /admin</div>
      {lectures.length===0&&<div style={tab.empty}>Лекций пока нет</div>}
      {lectures.map(l=>(<div key={l._id} style={tab.itemCard}><span style={{...tab.itemName,flex:1}}>📄 {l.title}</span><button style={tab.iconBtnDanger} onClick={()=>delLec(l._id)}>🗑</button></div>))}
      {msg&&<div style={{...tab.msg,color:msg.ok?"#10b981":"#ef4444"}}>{msg.m}</div>}
    </div>
  )

  return (
    <div style={tab.section}>
      {!adding?(<button style={tab.btnPrimary} onClick={()=>setAdding(true)}>➕ Добавить предмет</button>):(
        <div style={tab.formCard}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Название предмета" style={tab.input}/>
          <div style={tab.btnRow}><button style={tab.btn} onClick={()=>setAdding(false)}>Отмена</button><button style={tab.btnPrimary} onClick={addSubj}>Добавить</button></div>
        </div>
      )}
      {subjects.length===0&&!adding&&<div style={tab.empty}>Предметов пока нет</div>}
      {subjects.map(subj=>(<div key={subj._id} style={tab.itemCard}><div style={tab.itemMain} onClick={()=>{setSel(subj);loadLec(subj._id)}}><span style={tab.itemName}>📘 {subj.name}</span></div><button style={tab.iconBtnDanger} onClick={()=>delSubj(subj._id)}>🗑</button></div>))}
      {msg&&<div style={{...tab.msg,color:msg.ok?"#10b981":"#ef4444"}}>{msg.m}</div>}
    </div>
  )
}

// ── Broadcast ─────────────────────────────────────────────────────

function BroadcastTab() {
  const [text,setText]=useState("")
  const [loading,setLoading]=useState(false)
  const [result,setResult]=useState(null)
  const send=async()=>{
    if(!text.trim())return
    setLoading(true)
    try{
      const r=await fetch(`${API}/admin/broadcast`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})})
      const d=await r.json()
      setResult(d)
      if(d.success)setText("")
    }catch{setResult({error:"Ошибка соединения"})}
    finally{setLoading(false)}
  }
  return (
    <div style={tab.section}>
      <div style={tab.sectionLabel}>Текст рассылки</div>
      <div style={tab.hint}>HTML: &lt;b&gt;жирный&lt;/b&gt; &lt;i&gt;курсив&lt;/i&gt; &lt;code&gt;код&lt;/code&gt;</div>
      <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"10px 14px",fontSize:12,color:"rgba(255,255,255,0.5)"}}>
        ⚠️ Убедитесь что TOKEN задан в .env на Render
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Введите текст..." rows={6} style={tab.textarea}/>
      <button style={{...tab.btnPrimary,opacity:loading||!text.trim()?0.5:1}} disabled={loading||!text.trim()} onClick={send}>
        {loading?"Отправляю...":"📢 Отправить всем"}
      </button>
      {result&&<div style={{...tab.msg,color:result.error?"#ef4444":"#10b981"}}>{result.error?`❌ ${result.error}`:`✅ Отправлено: ${result.sent} · Ошибки: ${result.failed}`}</div>}
    </div>
  )
}

// ── Orders ────────────────────────────────────────────────────────

function OrdersTab({ user }) {
  const [chats,setChats]=useState([])
  const [loading,setLoading]=useState(true)
  const [sel,setSel]=useState(null)

  const load=async()=>{
    setLoading(true)
    try{
      const r=await fetch(`${API}/billing/chat/orders?manager_id=${user.id}`)
      const d=await r.json()
      const list=await Promise.all((d.chats??[]).map(async chat=>{
        try{const r2=await fetch(`${API}/billing/chat/user-info?user_id=${chat.user_id}`);const info=await r2.json();return{...chat,name:info.name,group:info.group}}
        catch{return{...chat,name:`User ${chat.user_id}`}}
      }))
      setChats(list)
    }catch{}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[])

  if(sel) return <ManagerChat user={user} targetUserId={sel.user_id} targetName={sel.name} goBack={()=>{setSel(null);load()}}/>

  return (
    <div style={tab.section}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={tab.sectionLabel}>Заказы ({chats.length})</div>
        <button style={tab.btn} onClick={load}>🔄</button>
      </div>
      {loading?<Spinner/>:chats.length===0?<div style={tab.empty}>📭 Заказов пока нет</div>:chats.map(chat=>(
        <button key={chat.user_id} style={{...tab.itemCard,cursor:"pointer",width:"100%",textAlign:"left"}} onClick={()=>setSel(chat)}>
          <div style={tab.itemMain}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={tab.itemName}>{chat.name||`User ${chat.user_id}`}</span>
              {chat.unread>0&&<span style={os.badge}>{chat.unread}</span>}
            </div>
            <span style={tab.itemSub}>{chat.last_msg?(chat.last_msg.length>42?chat.last_msg.slice(0,42)+"…":chat.last_msg):"Нет сообщений"}{chat.group?` · ${chat.group}`:""}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      ))}
    </div>
  )
}

// ── ManagerChat ───────────────────────────────────────────────────

function ManagerChat({ user, targetUserId, targetName, goBack }) {
  const [messages,setMessages]=useState([])
  const [input,setInput]=useState("")
  const [sending,setSending]=useState(false)
  const [uploading,setUploading]=useState(false)
  const chatRef=useRef(); const pollRef=useRef(); const fileRef=useRef()

  useEffect(()=>{loadMessages();pollRef.current=setInterval(loadMessages,4000);return()=>clearInterval(pollRef.current)},[])
  useEffect(()=>{chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:"smooth"})},[messages])

  const loadMessages=async()=>{try{const r=await fetch(`${API}/billing/chat/messages?user_a=${user.id}&user_b=${targetUserId}`);const d=await r.json();setMessages(d.messages??[])}catch{}}
  const send=async()=>{const text=input.trim();if(!text||sending)return;setSending(true);setInput("");try{await fetch(`${API}/billing/chat/send`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({from_id:user.id,to_id:targetUserId,text})});await loadMessages()}catch{}finally{setSending(false)}}
  const handleKey=(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}
  const handleFile=async(e)=>{
    const file=e.target.files[0];if(!file)return
    if(!file.name.endsWith(".pptx")){alert("Только .pptx");return}
    setUploading(true)
    try{
      const fd=new FormData();fd.append("file",file);fd.append("from_id",String(user.id));fd.append("to_id",String(targetUserId))
      const r=await fetch(`${API}/billing/chat/send-file`,{method:"POST",body:fd});const d=await r.json()
      if(d.success)await loadMessages();else alert("Ошибка: "+(d.error||""))
    }catch{alert("Ошибка соединения")}finally{setUploading(false);e.target.value=""}
  }

  return (
    <div style={mc.root}>
      <div style={mc.header}>
        <button style={mc.back} onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={mc.avatar}>👤</div>
        <div style={mc.hinfo}>
          <div style={mc.hname}>{targetName}</div>
          <div style={mc.hstatus}><span style={mc.dot}/>заказчик</div>
        </div>
      </div>
      <div style={mc.chat} ref={chatRef}>
        {messages.length===0&&<div style={mc.empty}><div style={{fontSize:38,marginBottom:8}}>💬</div><div style={mc.emptyT}>Диалог пустой</div></div>}
        {messages.map(msg=>{const isMe=msg.from_id===user.id;return(
          <div key={msg._id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:8}}>
            {!isMe&&<div style={mc.msgAvatar}>👤</div>}
            <div style={isMe?mc.bubbleMe:mc.bubbleThem}>
              {msg.text&&<div>{msg.text}</div>}
              {msg.file_id&&<div style={mc.fileMsg}>📎 <span style={mc.fileName}>{msg.file_name||"Файл.pptx"}</span><span style={mc.fileHint}>(скачать через бот)</span></div>}
              <div style={mc.time}>{msg.created_at?.slice(11,16)}</div>
            </div>
          </div>
        )})}
      </div>
      <div style={mc.inputArea}>
        <input ref={fileRef} type="file" accept=".pptx" style={{display:"none"}} onChange={handleFile}/>
        <button style={{...mc.attachBtn,opacity:uploading?0.5:1}} onClick={()=>fileRef.current?.click()} disabled={uploading}>{uploading?"⏳":"📎"}</button>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Написать сообщение..." rows={1} style={mc.textarea}/>
        <button style={{...mc.sendBtn,opacity:!input.trim()||sending?0.4:1}} disabled={!input.trim()||sending} onClick={send}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7L8 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )
}

function Spinner(){return(<div style={{display:"flex",justifyContent:"center",padding:"24px 0"}}><div style={{width:28,height:28,border:"2.5px solid rgba(255,255,255,0.08)",borderTop:"2.5px solid #6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>)}

// Styles
const s={root:{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},header:{position:"relative",overflow:"hidden",display:"flex",alignItems:"center",gap:12,padding:"24px 20px 20px",background:"linear-gradient(160deg,#131929 0%,#0a0f1e 100%)",borderBottom:"1px solid rgba(255,255,255,0.05)"},headerGlow:{position:"absolute",top:-60,right:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,158,11,0.15) 0%,transparent 70%)",pointerEvents:"none"},adminBadge:{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#d97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:"0 0 0 3px rgba(245,158,11,0.25)"},headerInfo:{display:"flex",flexDirection:"column",gap:2,flex:1},headerTitle:{fontSize:18,fontWeight:700,color:"#f1f5f9"},headerSub:{fontSize:12,color:"rgba(255,255,255,0.35)"},adminTag:{background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",fontSize:10,fontWeight:700,letterSpacing:"1px",padding:"4px 8px",borderRadius:6},userAccessBlock:{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"},userAccessTitle:{fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10},userAccessRow:{display:"flex",gap:8,flexWrap:"wrap"},userAccessBtn:{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 12px",cursor:"pointer",minWidth:60},userAccessLabel:{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:600},tabs:{display:"flex",overflowX:"auto",gap:6,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",scrollbarWidth:"none"},tab:{whiteSpace:"nowrap",padding:"8px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,color:"rgba(255,255,255,0.5)",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"},tabActive:{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.35)",color:"#818cf8"},tabContent:{flex:1,overflowY:"auto"}}
const tab={section:{display:"flex",flexDirection:"column",gap:10,padding:"16px"},statsCard:{position:"relative",overflow:"hidden",background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))",border:"1px solid rgba(99,102,241,0.25)",borderRadius:18,padding:"20px",display:"flex",flexDirection:"column",gap:4},statsGlow:{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)",pointerEvents:"none"},statsLabel:{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.5px"},statsValue:{fontSize:40,fontWeight:800,color:"#f1f5f9",letterSpacing:"-1px",lineHeight:1},statsHint:{fontSize:12,color:"rgba(255,255,255,0.3)"},btn:{padding:"11px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"rgba(255,255,255,0.7)",fontSize:14,fontWeight:600,cursor:"pointer"},btnPrimary:{padding:"12px 16px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,0.3)"},btnRow:{display:"flex",gap:8},formCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px",display:"flex",flexDirection:"column",gap:10},formTitle:{fontSize:15,fontWeight:700,color:"#f1f5f9"},fieldWrap:{display:"flex",flexDirection:"column",gap:5},fieldLabel:{fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.5px"},input:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px",color:"#f1f5f9",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"},textarea:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",color:"#f1f5f9",fontSize:14,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.5,width:"100%",boxSizing:"border-box"},itemCard:{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px"},itemMain:{flex:1,display:"flex",flexDirection:"column",gap:3},itemName:{fontSize:14,fontWeight:600,color:"#f1f5f9"},itemSub:{fontSize:12,color:"rgba(255,255,255,0.4)"},itemActions:{display:"flex",gap:6},iconBtn:{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:8,padding:"6px 8px",fontSize:14,cursor:"pointer"},iconBtnDanger:{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"6px 8px",fontSize:14,cursor:"pointer"},sectionLabel:{fontSize:13,fontWeight:700,color:"#f1f5f9"},hint:{fontSize:12,color:"rgba(255,255,255,0.3)"},msg:{fontSize:13,fontWeight:600,padding:"10px 0"},empty:{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:"24px 0",fontSize:14}}
const os={badge:{background:"#ef4444",color:"#fff",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}
const mc={root:{height:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},header:{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"rgba(13,19,35,0.97)",borderBottom:"1px solid rgba(255,255,255,0.06)"},back:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#f1f5f9",padding:"7px 9px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},avatar:{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0},hinfo:{flex:1},hname:{fontSize:15,fontWeight:600,color:"#f1f5f9"},hstatus:{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"rgba(255,255,255,0.4)"},dot:{width:6,height:6,borderRadius:"50%",background:"#10b981",display:"inline-block"},chat:{flex:1,overflowY:"auto",padding:"16px 14px"},empty:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",textAlign:"center",padding:"40px 24px"},emptyT:{fontSize:17,fontWeight:600,color:"#f1f5f9"},msgAvatar:{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#475569,#334155)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginRight:8,alignSelf:"flex-end",marginBottom:2},bubbleMe:{maxWidth:"78%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",borderRadius:"18px 18px 4px 18px",padding:"10px 14px",fontSize:14.5,lineHeight:1.55,boxShadow:"0 4px 20px rgba(99,102,241,0.3)"},bubbleThem:{maxWidth:"78%",background:"rgba(255,255,255,0.06)",color:"#e2e8f0",borderRadius:"18px 18px 18px 4px",border:"1px solid rgba(255,255,255,0.08)",padding:"10px 14px",fontSize:14.5,lineHeight:1.55},fileMsg:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"},fileName:{fontWeight:600,color:"#818cf8"},fileHint:{fontSize:11,color:"rgba(255,255,255,0.4)"},time:{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4,textAlign:"right"},inputArea:{background:"rgba(13,19,35,0.98)",padding:"10px 12px",display:"flex",alignItems:"flex-end",gap:8,borderTop:"1px solid rgba(255,255,255,0.05)"},attachBtn:{width:42,height:42,borderRadius:"50%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0},textarea:{flex:1,background:"rgba(255,255,255,0.06)",color:"#f1f5f9",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"10px 14px",minHeight:40,maxHeight:110,fontFamily:"inherit",fontSize:14.5,resize:"none",outline:"none",lineHeight:1.45,boxSizing:"border-box"},sendBtn:{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",color:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,boxShadow:"0 4px 16px rgba(99,102,241,0.45)",transition:"opacity 0.15s"}}