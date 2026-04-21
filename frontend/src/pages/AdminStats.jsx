import { useState, useEffect } from "react"
import { API } from "../App"

export default function AdminStats({ goBack, user }) {
  const [tab,     setTab]     = useState("overview") // overview | users | finance | activity | search
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Поиск пользователей
  const [searchQuery,   setSearchQuery]   = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching,     setSearching]     = useState(false)
  const [selectedUser,  setSelectedUser]  = useState(null)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, finRes, actRes, plansRes] = await Promise.all([
        fetch(`${API}/admin/stats/users`),
        fetch(`${API}/admin/stats/finance`),
        fetch(`${API}/admin/stats/activity`),
        fetch(`${API}/admin/plans`),
      ])
      const [u, f, a, p] = await Promise.all([
        usersRes.json(), finRes.json(), actRes.json(), plansRes.json(),
      ])
      setStats({ users: u, finance: f, activity: a, plans: p.plans ?? [] })
    } catch (e) {
      setError("Ошибка загрузки статистики")
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(`${API}/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      setSearchResults(data.users ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearchKey = (e) => {
    if (e.key === "Enter") searchUsers()
  }

  const TABS = [
    { id: "overview", label: "📊 Обзор" },
    { id: "finance",  label: "💰 Финансы" },
    { id: "activity", label: "📈 Активность" },
    { id: "search",   label: "🔍 Поиск" },
  ]

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
          <span style={s.headerTitle}>📊 Статистика</span>
          <span style={s.headerSub}>Панель администратора</span>
        </div>
        <button style={s.refreshBtn} onClick={loadStats} title="Обновить">
          🔄
        </button>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.center}>
          <div style={s.spinner} />
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Загрузка...</span>
        </div>
      ) : error ? (
        <div style={s.errBox}>
          <div style={{ color: "#ef4444" }}>❌ {error}</div>
          <button style={s.retryBtn} onClick={loadStats}>Повторить</button>
        </div>
      ) : (
        <div style={s.body}>
          {tab === "overview" && <OverviewTab stats={stats} />}
          {tab === "finance"  && <FinanceTab  stats={stats} />}
          {tab === "activity" && <ActivityTab stats={stats} />}
          {tab === "search"   && (
            <SearchTab
              query={searchQuery}
              setQuery={setSearchQuery}
              onSearch={searchUsers}
              onKey={handleSearchKey}
              results={searchResults}
              searching={searching}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Обзор ─────────────────────────────────────────────────────────

function OverviewTab({ stats }) {
  const u = stats.users
  const f = stats.finance

  const rows = [
    { label: "Всего пользователей", value: u.total ?? 0,       icon: "👥", color: "#6366f1" },
    { label: "С подпиской",          value: u.with_sub ?? 0,    icon: "✅", color: "#10b981" },
    { label: "Без подписки",          value: u.no_sub ?? 0,     icon: "🔴", color: "#ef4444" },
    { label: "Новых сегодня",         value: u.new_today ?? 0,  icon: "🆕", color: "#f59e0b" },
    { label: "Новых за неделю",       value: u.new_week ?? 0,   icon: "📅", color: "#0ea5e9" },
    { label: "Новых за месяц",        value: u.new_month ?? 0,  icon: "📆", color: "#8b5cf6" },
  ]

  return (
    <>
      <SectionTitle>👥 Пользователи</SectionTitle>
      <div style={o.grid}>
        {rows.map(r => (
          <div key={r.label} style={{ ...o.card, borderColor: r.color + "44" }}>
            <span style={{ fontSize: 22 }}>{r.icon}</span>
            <span style={{ ...o.val, color: r.color }}>{r.value}</span>
            <span style={o.lbl}>{r.label}</span>
          </div>
        ))}
      </div>

      <SectionTitle>💳 Доходы (итого)</SectionTitle>
      <div style={o.bigCard}>
        <div style={o.bigRow}>
          <span style={o.bigLabel}>💰 Всего</span>
          <span style={{ ...o.bigVal, color: "#f59e0b" }}>{(f.total_revenue ?? 0).toFixed(2)}₽</span>
        </div>
        <div style={o.bigRow}>
          <span style={o.bigLabel}>📅 За месяц</span>
          <span style={o.bigVal}>{(f.month_revenue ?? 0).toFixed(2)}₽</span>
        </div>
        <div style={o.bigRow}>
          <span style={o.bigLabel}>📆 Сегодня</span>
          <span style={o.bigVal}>{(f.today_revenue ?? 0).toFixed(2)}₽</span>
        </div>
        <div style={o.bigRow}>
          <span style={o.bigLabel}>📊 Платежей всего</span>
          <span style={o.bigVal}>{f.payment_count ?? 0}</span>
        </div>
        <div style={o.bigRow}>
          <span style={o.bigLabel}>✅ Активных подписок</span>
          <span style={{ ...o.bigVal, color: "#10b981" }}>{f.active_subs ?? 0}</span>
        </div>
      </div>
    </>
  )
}

// ── Финансы ─────────────────────────────────────────────────────

function FinanceTab({ stats }) {
  const f = stats.finance

  return (
    <>
      <SectionTitle>💳 Разбивка по типам оплаты</SectionTitle>
      <div style={s.body}>
        {[
          { key: "rub",    icon: "₽",    label: "Рублёвые (ЮКасса)", color: "#6366f1" },
          { key: "stars",  icon: "⭐",   label: "Telegram Stars",      color: "#f59e0b" },
          { key: "crypto", icon: "₮",    label: "Криптовалюта (USDT)", color: "#10b981" },
        ].map(t => (
          <div key={t.key} style={{ ...o.bigCard, borderColor: t.color + "44" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{t.label}</span>
            </div>
            <div style={o.bigRow}>
              <span style={o.bigLabel}>Сумма (₽)</span>
              <span style={{ ...o.bigVal, color: t.color }}>
                {((f.by_type?.[t.key]?.total ?? 0)).toFixed(2)}₽
              </span>
            </div>
            <div style={o.bigRow}>
              <span style={o.bigLabel}>Платежей</span>
              <span style={o.bigVal}>{f.by_type?.[t.key]?.count ?? 0}</span>
            </div>
          </div>
        ))}

        <SectionTitle>📦 Продажи по тарифам</SectionTitle>
        {Object.entries(f.plan_sales ?? {}).length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
            Нет данных
          </div>
        )}
        {Object.entries(f.plan_sales ?? {}).map(([name, data]) => (
          <div key={name} style={o.bigRow}>
            <span style={o.bigLabel}>📦 {name}</span>
            <span style={o.bigVal}>{data.count} шт.</span>
          </div>
        ))}

        <SectionTitle>🎟 Промокоды</SectionTitle>
        {(f.promo_stats ?? []).length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
            Промокодов нет
          </div>
        )}
        {(f.promo_stats ?? []).map((p, i) => (
          <div key={i} style={{ ...o.bigCard, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#818cf8", letterSpacing: 1 }}>{p.code}</span>
              <span style={{ fontSize: 12, color: p.active ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                {p.active ? "✅ Активен" : "❌ Деактивирован"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
              Скидка: {p.discount}% · Использований: {p.uses}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Активность ────────────────────────────────────────────────────

function ActivityTab({ stats }) {
  const a = stats.activity ?? {}
  const maxTotal = Math.max(...Object.values(a).map(v => v.total ?? 0), 1)

  return (
    <>
      <SectionTitle>📊 Активность по разделам</SectionTitle>
      {Object.entries(a).map(([key, data]) => (
        <div key={key} style={ac.row}>
          <div style={ac.rowTop}>
            <span style={ac.label}>{data.label}</span>
            <span style={ac.total}>{data.total ?? 0} всего</span>
          </div>
          <div style={ac.barBg}>
            <div style={{
              ...ac.barFill,
              width: `${Math.round(100 * (data.total ?? 0) / maxTotal)}%`,
            }} />
          </div>
          <div style={ac.meta}>
            <span>Сегодня: <b>{data.today ?? 0}</b></span>
            <span>Месяц: <b>{data.month ?? 0}</b></span>
          </div>
        </div>
      ))}
    </>
  )
}

// ── Поиск пользователей ──────────────────────────────────────────

function SearchTab({ query, setQuery, onSearch, onKey, results, searching, selectedUser, setSelectedUser }) {
  if (selectedUser) {
    return <UserDetail user={selectedUser} goBack={() => setSelectedUser(null)} />
  }

  return (
    <>
      <SectionTitle>🔍 Поиск пользователей</SectionTitle>
      <div style={sr.searchBox}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="ID, имя или группа..."
          style={sr.input}
        />
        <button style={sr.btn} onClick={onSearch} disabled={searching}>
          {searching ? "⏳" : "🔍"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4, marginBottom: 8 }}>
        Введите ID (числовой), имя или номер группы
      </div>

      {searching && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.4)" }}>
          Ищу...
        </div>
      )}

      {!searching && results.length === 0 && query && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.3)" }}>
          Пользователи не найдены
        </div>
      )}

      {results.map(u => (
        <button key={u.user_id} style={sr.userCard} onClick={() => setSelectedUser(u)}>
          <div style={sr.userAvatar}>
            {(u.first_name?.[0] || "?").toUpperCase()}
          </div>
          <div style={sr.userInfo}>
            <div style={sr.userName}>
              {u.first_name} {u.last_name}
              {u.username ? <span style={sr.username}> @{u.username}</span> : null}
            </div>
            <div style={sr.userMeta}>ID: {u.user_id} · Группа: {u.group_number || "—"}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ))}
    </>
  )
}

function UserDetail({ user: u, goBack }) {
  return (
    <div>
      <button style={{ ...s.backBtn, margin: "0 0 14px" }} onClick={goBack}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ marginLeft: 6, fontSize: 14 }}>Назад</span>
      </button>

      <div style={ud.card}>
        <div style={ud.avatar}>{(u.first_name?.[0] || "?").toUpperCase()}</div>
        <div style={ud.name}>{u.first_name} {u.last_name}</div>
        {u.username && <div style={ud.username}>@{u.username}</div>}
      </div>

      {[
        { icon: "🆔", label: "Telegram ID",      value: u.user_id },
        { icon: "🏛",  label: "Институт",          value: u.institute || "—" },
        { icon: "📚",  label: "Группа",             value: u.group_number || "—" },
        { icon: "🔑",  label: "Логин КНИТУ",        value: u.knrtu_login || "—" },
        { icon: "📅",  label: "Регистрация",         value: u.registered_at?.slice(0,10) || "—" },
        { icon: "⭐",  label: "XP",                  value: u.xp ?? 0 },
        { icon: "🚫",  label: "Бан",                 value: u.banned ? "Да" : "Нет" },
      ].map(r => (
        <div key={r.label} style={ud.row}>
          <span style={ud.rowIcon}>{r.icon}</span>
          <span style={ud.rowLabel}>{r.label}</span>
          <span style={ud.rowVal}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Утилиты ───────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)",
      textTransform: "uppercase", letterSpacing: "0.5px",
      marginTop: 16, marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

// ── Стили ─────────────────────────────────────────────────────────

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12,
            padding: "20px 20px 18px", background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)" },
  headerGlow: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" },
  backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
             borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
             display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  refreshBtn: { marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "7px 10px", cursor: "pointer", fontSize: 16 },
  headerInfo: { display: "flex", flexDirection: "column", gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  tabs: { display: "flex", gap: 6, padding: "12px 14px", overflowX: "auto",
          borderBottom: "1px solid rgba(255,255,255,0.05)" },
  tab: { padding: "8px 14px", background: "rgba(255,255,255,0.04)",
         border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20,
         color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
         flexShrink: 0 },
  tabActive: { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.3)", color: "#818cf8", fontWeight: 600 },
  body: { display: "flex", flexDirection: "column", gap: 10, padding: "16px" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 14, padding: "60px 0" },
  spinner: { width: 32, height: 32, border: "2.5px solid rgba(255,255,255,0.08)",
             borderTop: "2.5px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errBox: { margin: 16, padding: "16px", background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14,
            display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" },
  retryBtn: { padding: "8px 16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" },
}

const o = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid",
          borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  val: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  lbl: { fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.3 },
  bigCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
             borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 8 },
  bigRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  bigLabel: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  bigVal: { fontSize: 14, fontWeight: 700, color: "#f1f5f9" },
}

const ac = {
  row: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
         borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  total: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  barBg: { height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 3, transition: "width 0.5s" },
  meta: { display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.35)" },
}

const sr = {
  searchBox: { display: "flex", gap: 8 },
  input: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
           borderRadius: 12, padding: "11px 14px", color: "#f1f5f9", fontSize: 14.5, outline: "none", fontFamily: "inherit" },
  btn: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
         borderRadius: 12, padding: "11px 16px", fontSize: 16, cursor: "pointer" },
  userCard: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px",
              cursor: "pointer", width: "100%", boxSizing: "border-box", textAlign: "left" },
  userAvatar: { width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  username: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 400 },
  userMeta: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 },
}

const ud = {
  card: { background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 6, marginBottom: 14 },
  avatar: { width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#fff" },
  name: { fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  username: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  row: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)",
         border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", marginBottom: 6 },
  rowIcon: { fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.4)" },
  rowVal: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
}