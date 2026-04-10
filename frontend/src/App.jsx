import { useEffect, useState } from "react"
import MainPage from "./pages/MainPage"
import "./App.css"

// ─── Глобальные константы — меняйте здесь ────────────────────────
export const API = "https://math-tutor-webapp.onrender.com"

// Telegram user_id менеджера презентаций
export const MANAGER_ID = 858414038

// Telegram user_id менеджера распечаток
export const PRINT_MANAGER_ID = 1991833177

// Telegram user_id администраторов бота
export const ADMIN_IDS = [1991833177, 808603029, 1114949712]
// ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]               = useState(null)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe.user)
    } else {
      setUser({ id: 123, first_name: "TestUser", username: "test" })
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, username: user.username || "" })
    }).catch(() => {})
    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    if (!user) return
    try {
      const r = await fetch(`${API}/billing/status?user_id=${user.id}`)
      const d = await r.json()
      setSubscription(d)
    } catch {
      setSubscription({ active: false, balance: 0 })
    }
  }

  if (!user) return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1e",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16
    }}>
      <div style={{
        width: 36, height: 36,
        border: "2.5px solid rgba(255,255,255,0.08)",
        borderTop: "2.5px solid #6366f1",
        borderRadius: "50%", animation: "spin 0.8s linear infinite"
      }} />
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontFamily: "system-ui" }}>
        Загрузка...
      </span>
    </div>
  )

  return (
    <div className="app">
      <MainPage
        user={user}
        subscription={subscription}
        reloadSub={loadSubscription}
      />
    </div>
  )
}