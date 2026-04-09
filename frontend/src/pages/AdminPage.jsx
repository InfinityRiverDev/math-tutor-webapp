import { useState, useEffect } from "react"
import Tutor from "./Tutor"
import Profile from "./Profile"
import Wallet from "./Wallet"
import Education from "./Education"
import Services from "./Services"
import Focus from "./Focus"

const API = "https://math-tutor-webapp.onrender.com"

export default function AdminPage({ user, subscription, reloadSubscription }) {
  const [page, setPage] = useState("admin") // admin | tutor | profile | wallet | education | services | focus

  // Полный доступ к юзер-разделам
  if (page === "tutor")     return <Tutor user={user} goBack={() => setPage("admin")} />
  if (page === "profile")   return <Profile user={user} goBack={() => setPage("admin")} subscription={subscription} />
  if (page === "wallet")    return <Wallet user={user} goBack={() => setPage("admin")} subscription={subscription} reloadSubscription={reloadSubscription} />
  if (page === "education") return <Education user={user} goBack={() => setPage("admin")} />
  if (page === "services")  return <Services goBack={() => setPage("admin")} />
  if (page === "focus")     return <Focus goBack={() => setPage("admin")} />

  return <AdminHome user={user} setPage={setPage} />
}

function AdminHome({ user, setPage }) {
  const [activeTab, setActiveTab] = useState("stats") // stats | plans | promos | lectures | broadcast

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.adminBadge}>⚙️</div>
        <div style={s.headerInfo}>
          <span style={s.headerTitle}>Админ-панель</span>
          <span style={s.headerSub}>@{user.username || user.first_name}</span>
        </div>
        <div style={s.adminTag}>ADMIN</div>
      </div>

      {/* Быстрый доступ к пользовательским разделам */}
      <div style={s.userAccessBlock}>
        <div style={s.userAccessTitle}>Пользовательские разделы</div>
        <div style={s.userAccessRow}>
          {[
            { id: "tutor",     icon: "🎓", label: "Репетитор" },
            { id: "education", icon: "📚", label: "Учёба" },
            { id: "focus",     icon: "🎯", label: "Фокус" },
            { id: "services",  icon: "📝", label: "Услуги" },
            { id: "wallet",    icon: "💼", label: "Кошелёк" },
            { id: "profile",   icon: "👤", label: "Профиль" },
          ].map(item => (
            <button key={item.id} style={s.userAccessBtn} onClick={() => setPage(item.id)}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={s.userAccessLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Табы */}
      <div style={s.tabs}>
        {[
          { id: "stats",     label: "📊 Стат." },
          { id: "plans",     label: "📦 Тарифы" },
          { id: "promos",    label: "🎟 Промо" },
          { id: "lectures",  label: "📖 Лекции" },
          { id: "broadcast", label: "📢 Рассылка" },
        ].map(t => (
          <button key={t.id} style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент таба */}
      <div style={s.tabContent}>
        {activeTab === "stats"     && <StatsTab />}
        {activeTab === "plans"     && <PlansTab />}
        {activeTab === "promos"    && <PromosTab />}
        {activeTab === "lectures"  && <LecturesTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
      </div>
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/admin/users/count`)
      const data = await res.json()
      setStats(data)
    } catch { setStats({ error: true }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={tab.section}>
      {loading ? <Spinner /> : stats ? (
        <div style={tab.statsCard}>
          <div style={tab.statsGlow} />
          <div style={tab.statsLabel}>Всего пользователей</div>
          <div style={tab.statsValue}>{stats.count ?? stats.total ?? "—"}</div>
          <div style={tab.statsHint}>за всё время</div>
        </div>
      ) : null}
      <button style={tab.btn} onClick={load}>🔄 Обновить</button>
    </div>
  )
}

// ── Plans ─────────────────────────────────────────────────────

function PlansTab() {
  const [plans, setPlans] = useState([])
  const [view, setView] = useState("list") // list | create | edit
  const [editPlan, setEditPlan] = useState(null)
  const [form, setForm] = useState({ name: "", price: "", duration_days: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    const res = await fetch(`${API}/billing/plans`)
    const d = await res.json()
    setPlans(d.plans ?? [])
  }
  useEffect(() => { load() }, [])

  const showMsg = (m, ok = true) => { setMsg({ m, ok }); setTimeout(() => setMsg(null), 3000) }

  const openCreate = () => { setForm({ name: "", price: "", duration_days: "", description: "" }); setView("create") }
  const openEdit = (plan) => { setEditPlan(plan); setForm({ name: plan.name, price: String(plan.price), duration_days: String(plan.duration_days), description: plan.description ?? "" }); setView("edit") }

  const save = async () => {
    if (!form.name || !form.price || !form.duration_days) { showMsg("Заполни все поля", false); return }
    setLoading(true)
    try {
      const body = { ...form, price: parseFloat(form.price), duration_days: parseInt(form.duration_days) }
      const url = view === "create" ? `${API}/admin/plans` : `${API}/admin/plans/${editPlan._id}`
      const method = view === "create" ? "POST" : "PUT"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const d = await res.json()
      if (d.success || d._id || d.plan_id) {
        showMsg(view === "create" ? "Тариф создан!" : "Тариф обновлён!")
        setView("list"); load()
      } else { showMsg("Ошибка", false) }
    } catch { showMsg("Ошибка", false) }
    finally { setLoading(false) }
  }

  const deletePlan = async (id) => {
    await fetch(`${API}/admin/plans/${id}`, { method: "DELETE" })
    load()
  }

  if (view !== "list") return (
    <div style={tab.section}>
      <div style={tab.formTitle}>{view === "create" ? "➕ Новый тариф" : "✏️ Редактировать"}</div>
      {[
        { key: "name", label: "Название" },
        { key: "price", label: "Цена (₽)", type: "number" },
        { key: "duration_days", label: "Срок (дней)", type: "number" },
        { key: "description", label: "Описание (необязательно)" },
      ].map(f => (
        <div key={f.key} style={tab.fieldWrap}>
          <label style={tab.fieldLabel}>{f.label}</label>
          <input
            type={f.type ?? "text"} value={form[f.key]}
            onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
            style={tab.input}
          />
        </div>
      ))}
      <div style={tab.btnRow}>
        <button style={tab.btn} onClick={() => setView("list")}>← Назад</button>
        <button style={tab.btnPrimary} onClick={save} disabled={loading}>{loading ? "..." : "Сохранить"}</button>
      </div>
      {msg && <div style={{ ...tab.msg, color: msg.ok ? "#10b981" : "#ef4444" }}>{msg.m}</div>}
    </div>
  )

  return (
    <div style={tab.section}>
      <button style={tab.btnPrimary} onClick={openCreate}>➕ Создать тариф</button>
      {plans.map(p => (
        <div key={p._id} style={tab.itemCard}>
          <div style={tab.itemMain}>
            <span style={tab.itemName}>{p.name}</span>
            <span style={tab.itemSub}>{p.price}₽ · {p.duration_days} дней</span>
          </div>
          <div style={tab.itemActions}>
            <button style={tab.iconBtn} onClick={() => openEdit(p)}>✏️</button>
            <button style={tab.iconBtnDanger} onClick={() => deletePlan(p._id)}>🗑</button>
          </div>
        </div>
      ))}
      {msg && <div style={{ ...tab.msg, color: msg.ok ? "#10b981" : "#ef4444" }}>{msg.m}</div>}
    </div>
  )
}

// ── Promos ────────────────────────────────────────────────────

function PromosTab() {
  const [promos, setPromos] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: "", discount_percent: "", max_uses: "" })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const showMsg = (m, ok = true) => { setMsg({ m, ok }); setTimeout(() => setMsg(null), 3000) }

  const load = async () => {
    const res = await fetch(`${API}/admin/promos`)
    const d = await res.json()
    setPromos(d.promos ?? [])
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.code || !form.discount_percent) { showMsg("Введи код и скидку", false); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/admin/promos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.code.toUpperCase(), discount_percent: parseInt(form.discount_percent), max_uses: parseInt(form.max_uses) || 0 })
      })
      const d = await res.json()
      if (d.success || d.promo_id) {
        showMsg("Промокод создан!")
        setForm({ code: "", discount_percent: "", max_uses: "" })
        setCreating(false); load()
      } else showMsg("Ошибка", false)
    } catch { showMsg("Ошибка", false) }
    finally { setLoading(false) }
  }

  const deletePromo = async (id) => {
    await fetch(`${API}/admin/promos/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div style={tab.section}>
      {!creating
        ? <button style={tab.btnPrimary} onClick={() => setCreating(true)}>➕ Создать промокод</button>
        : (
          <div style={tab.formCard}>
            <div style={tab.formTitle}>🎟 Новый промокод</div>
            {[
              { key: "code", label: "Код (ПРОПИСНЫМИ)" },
              { key: "discount_percent", label: "Скидка %", type: "number" },
              { key: "max_uses", label: "Макс. использований (0 = ∞)", type: "number" },
            ].map(f => (
              <div key={f.key} style={tab.fieldWrap}>
                <label style={tab.fieldLabel}>{f.label}</label>
                <input type={f.type ?? "text"} value={form[f.key]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  style={tab.input}
                />
              </div>
            ))}
            <div style={tab.btnRow}>
              <button style={tab.btn} onClick={() => setCreating(false)}>Отмена</button>
              <button style={tab.btnPrimary} onClick={create} disabled={loading}>{loading ? "..." : "Создать"}</button>
            </div>
          </div>
        )
      }

      {promos.map(p => (
        <div key={p._id} style={tab.itemCard}>
          <div style={tab.itemMain}>
            <span style={{ ...tab.itemName, fontFamily: "monospace" }}>{p.code}</span>
            <span style={tab.itemSub}>
              {p.discount_percent}% скидка ·{" "}
              {p.max_uses > 0 ? `${p.uses_count}/${p.max_uses} исп.` : `${p.uses_count} исп. (∞)`}
              {!p.active ? " · НЕАКТИВЕН" : ""}
            </span>
          </div>
          <button style={tab.iconBtnDanger} onClick={() => deletePromo(p._id)}>🗑</button>
        </div>
      ))}
      {msg && <div style={{ ...tab.msg, color: msg.ok ? "#10b981" : "#ef4444" }}>{msg.m}</div>}
    </div>
  )
}

// ── Lectures ──────────────────────────────────────────────────

function LecturesTab() {
  const [subjects, setSubjects] = useState([])
  const [selectedSubj, setSelectedSubj] = useState(null)
  const [lectures, setLectures] = useState([])
  const [newSubjName, setNewSubjName] = useState("")
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState(null)

  const showMsg = (m, ok = true) => { setMsg({ m, ok }); setTimeout(() => setMsg(null), 3000) }

  const loadSubjects = async () => {
    const res = await fetch(`${API}/lectures/subjects`)
    const d = await res.json()
    setSubjects(d.subjects ?? [])
  }

  const loadLectures = async (subjId) => {
    const res = await fetch(`${API}/lectures/by-subject/${subjId}`)
    const d = await res.json()
    setLectures(d.lectures ?? [])
  }

  useEffect(() => { loadSubjects() }, [])

  const addSubject = async () => {
    if (!newSubjName.trim()) return
    const res = await fetch(`${API}/admin/lectures/subjects`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubjName.trim() })
    })
    const d = await res.json()
    if (d.success || d.subject_id) { showMsg("Предмет добавлен!"); setNewSubjName(""); setAdding(false); loadSubjects() }
    else showMsg("Ошибка", false)
  }

  const deleteSubject = async (id) => {
    await fetch(`${API}/admin/lectures/subjects/${id}`, { method: "DELETE" })
    loadSubjects()
  }

  const deleteLecture = async (id) => {
    await fetch(`${API}/admin/lectures/${id}`, { method: "DELETE" })
    loadLectures(selectedSubj._id)
  }

  if (selectedSubj) return (
    <div style={tab.section}>
      <button style={tab.btn} onClick={() => setSelectedSubj(null)}>← К предметам</button>
      <div style={tab.sectionLabel}>{selectedSubj.name}</div>
      <div style={tab.hint}>Загрузка PDF через бот (команда /admin)</div>
      {lectures.map(lec => (
        <div key={lec._id} style={tab.itemCard}>
          <span style={{ ...tab.itemName, flex: 1 }}>📄 {lec.title}</span>
          <button style={tab.iconBtnDanger} onClick={() => deleteLecture(lec._id)}>🗑</button>
        </div>
      ))}
      {lectures.length === 0 && <div style={tab.empty}>Лекций пока нет</div>}
      {msg && <div style={{ ...tab.msg, color: msg.ok ? "#10b981" : "#ef4444" }}>{msg.m}</div>}
    </div>
  )

  return (
    <div style={tab.section}>
      {!adding
        ? <button style={tab.btnPrimary} onClick={() => setAdding(true)}>➕ Добавить предмет</button>
        : (
          <div style={tab.formCard}>
            <input value={newSubjName} onChange={e => setNewSubjName(e.target.value)}
              placeholder="Название предмета" style={tab.input} />
            <div style={tab.btnRow}>
              <button style={tab.btn} onClick={() => setAdding(false)}>Отмена</button>
              <button style={tab.btnPrimary} onClick={addSubject}>Добавить</button>
            </div>
          </div>
        )
      }
      {subjects.map(subj => (
        <div key={subj._id} style={tab.itemCard}>
          <div style={tab.itemMain} onClick={() => { setSelectedSubj(subj); loadLectures(subj._id) }}>
            <span style={tab.itemName}>📘 {subj.name}</span>
          </div>
          <button style={tab.iconBtnDanger} onClick={() => deleteSubject(subj._id)}>🗑</button>
        </div>
      ))}
      {msg && <div style={{ ...tab.msg, color: msg.ok ? "#10b981" : "#ef4444" }}>{msg.m}</div>}
    </div>
  )
}

// ── Broadcast ─────────────────────────────────────────────────

function BroadcastTab() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const send = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/admin/broadcast`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      const d = await res.json()
      setResult(d)
      if (d.success) setText("")
    } catch { setResult({ error: "Ошибка соединения" }) }
    finally { setLoading(false) }
  }

  return (
    <div style={tab.section}>
      <div style={tab.sectionLabel}>Текст рассылки</div>
      <div style={tab.hint}>Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;code&gt;код&lt;/code&gt;</div>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Введите текст сообщения..."
        rows={6} style={tab.textarea}
      />
      <button style={{ ...tab.btnPrimary, opacity: loading || !text.trim() ? 0.5 : 1 }}
        disabled={loading || !text.trim()} onClick={send}>
        {loading ? "Отправляю..." : "📢 Отправить всем"}
      </button>
      {result && (
        <div style={{ ...tab.msg, color: result.error ? "#ef4444" : "#10b981" }}>
          {result.error
            ? `❌ ${result.error}`
            : `✅ Отправлено: ${result.sent} · Ошибки: ${result.failed}`
          }
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
    <div style={{ width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.08)", borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
}

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: {
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 12,
    padding: "24px 20px 20px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerGlow: {
    position: "absolute", top: -60, right: -40,
    width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  adminBadge: {
    width: 48, height: 48, borderRadius: "50%",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, flexShrink: 0,
    boxShadow: "0 0 0 3px rgba(245,158,11,0.25)",
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  adminTag: {
    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    padding: "4px 8px", borderRadius: 6,
  },
  userAccessBlock: { padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  userAccessTitle: { fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 },
  userAccessRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  userAccessBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "10px 12px", cursor: "pointer", minWidth: 60,
  },
  userAccessLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 },
  tabs: {
    display: "flex", overflowX: "auto", gap: 6,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    scrollbarWidth: "none",
  },
  tab: {
    whiteSpace: "nowrap", padding: "8px 14px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)",
    color: "#818cf8",
  },
  tabContent: { flex: 1, overflowY: "auto" },
}

const tab = {
  section: { display: "flex", flexDirection: "column", gap: 10, padding: "16px" },
  statsCard: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
    border: "1px solid rgba(99,102,241,0.25)", borderRadius: 18,
    padding: "20px", display: "flex", flexDirection: "column", gap: 4,
  },
  statsGlow: {
    position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)", pointerEvents: "none",
  },
  statsLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  statsValue: { fontSize: 40, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px", lineHeight: 1 },
  statsHint: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  btn: {
    padding: "11px 16px", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
    color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  btnPrimary: {
    padding: "12px 16px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none",
    borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
  },
  btnRow: { display: "flex", gap: 8 },
  formCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "14px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  formTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 12px", color: "#f1f5f9",
    fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  },
  textarea: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "12px 14px", color: "#f1f5f9",
    fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5,
    width: "100%", boxSizing: "border-box",
  },
  itemCard: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "12px 14px",
  },
  itemMain: { flex: 1, display: "flex", flexDirection: "column", gap: 3, cursor: "pointer" },
  itemName: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  itemSub: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  itemActions: { display: "flex", gap: 6 },
  iconBtn: {
    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8, padding: "6px 8px", fontSize: 14, cursor: "pointer",
  },
  iconBtnDanger: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8, padding: "6px 8px", fontSize: 14, cursor: "pointer",
  },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: "#f1f5f9" },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  msg: { fontSize: 13, fontWeight: 600, padding: "10px 0" },
  empty: { textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "20px 0", fontSize: 14 },
}