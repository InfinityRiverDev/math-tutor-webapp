import { useState } from "react"
import Calculator from "./Calculator"
import Tutor from "./Tutor"
import Profile from "./Profile"

export default function UserPage({ user }) {
  const [page, setPage] = useState("home")

  if (page === "calculator") return <Calculator goBack={() => setPage("home")} />
  if (page === "tutor") return <Tutor goBack={() => setPage("home")} />
  if (page === "profile") return <Profile user={user} goBack={() => setPage("home")} />

  return (
    <div>
      <h2>👤 Пользователь</h2>

      <button onClick={() => setPage("calculator")}>🧮 Калькулятор</button>
      <button onClick={() => setPage("tutor")}>🎓 Репетитор</button>
      <button onClick={() => setPage("profile")}>👤 Профиль</button>
    </div>
  )
}