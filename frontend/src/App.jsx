import { useEffect, useState } from "react"
import MainPage from "./pages/MainPage"

function App() {
  const [user, setUser] = useState(null)

  

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg && tg.initDataUnsafe?.user) {
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe.user)
    } else {
      console.log("⚠️ FALLBACK USER")
      // fallback
      setUser({
        id: 123,
        first_name: "TestUser",
        username: "test"
      })
    }
  }, [])

  // 🔥 регистрация пользователя
  useEffect(() => {
    if (!user) return

    fetch("https://math-tutor-webapp.onrender.com/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id,
        username: user.username || ""
      })
    })
  }, [user])

  if (!user) return <div>Загрузка...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>Math Tutor 🚀</h1>
      <p>Привет, {user.first_name}</p>

      <MainPage user={user} />
    </div>
  )
}

export default App