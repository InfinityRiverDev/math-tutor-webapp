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
      // 🔥 fallback для разработки
      setUser({
        id: 123,
        first_name: "TestUser",
        username: "test"
      })
    }
  }, [])

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Math Tutor 🚀</h1>
      <p>Привет, {user.first_name}</p>

      <MainPage user={user} />
    </div>
  )
}

export default App