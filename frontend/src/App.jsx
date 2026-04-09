import { useEffect, useState } from "react"
import MainPage from "./pages/MainPage"
import "./App.css"

const API = "https://math-tutor-webapp.onrender.com"

export default function App() {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null) // { active, plan_name, expires_at, balance }

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg && tg.initDataUnsafe?.user) {
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe.user)
    } else {
      setUser({ id: 123, first_name: "TestUser", username: "test" })
    }
  }, [])

  // Регистрация
  useEffect(() => {
    if (!user) return
    fetch(`${API}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, username: user.username || "" })
    })
  }, [user])

  // Загрузка подписки и баланса
  useEffect(() => {
    if (!user) return
    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    try {
      const res = await fetch(`${API}/billing/status?user_id=${user.id}`)
      const data = await res.json()
      setSubscription(data)
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
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontFamily: "system-ui" }}>
        Загрузка...
      </span>
    </div>
  )

  return (
    <div className="app">
      <MainPage user={user} subscription={subscription} reloadSubscription={loadSubscription} />
    </div>
  )
}