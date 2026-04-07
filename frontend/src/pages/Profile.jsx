import { useEffect, useState } from "react"

export default function Profile({ user, goBack }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetch(`https://your-backend.onrender.com/user/${user.id}`)
      .then(res => res.json())
      .then(data => setProfile(data.user))
  }, [user.id])

  if (!profile) return <div>Загрузка профиля...</div>

  return (
    <div style={{ padding: 20 }}>
      <button onClick={goBack}>⬅️ Назад</button>

      <h2>👤 Профиль</h2>

      <div style={{ marginTop: 20 }}>
        <p><b>ID:</b> {profile.user_id}</p>
        <p><b>Username:</b> {profile.username}</p>
        <p><b>XP:</b> {profile.xp}</p>
        <p><b>Подписка:</b> {profile.subscription ? "Да" : "Нет"}</p>
      </div>
    </div>
  )
}