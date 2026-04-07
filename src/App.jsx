import { useEffect, useState } from "react"

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg) {
      tg.ready()
      tg.expand()

      const tgUser = tg.initDataUnsafe?.user
      console.log("TG USER:", tgUser)

      if (tgUser) {
        setUser(tgUser)
      }
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