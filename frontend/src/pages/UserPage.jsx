import { useState } from "react"
import Tutor from "./Tutor"
import Profile from "./Profile"

export default function UserPage({ user }) {
  const [page, setPage] = useState("home")

  if (page === "tutor") return <Tutor user={user} goBack={() => setPage("home")} />
  if (page === "profile") return <Profile user={user} goBack={() => setPage("home")} />

  return (
    <div className="app">
      <h1 className="title">Math Tutor 🚀</h1>

      <div className="grid">
        <div className="card" onClick={() => setPage("tutor")}>
          🎓 ИИ-репетитор
        </div>

        <div className="card">
          📚 Образование
        </div>

        <div className="card">
          📝 Услуги
        </div>

        <div className="card">
          🎯 Фокус
        </div>

        <div className="card" onClick={() => setPage("profile")}>
          👤 Профиль
        </div>
      </div>
    </div>
  )
}