import { useEffect, useState } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function Profile({ user, goBack }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetch(`${API}/user/${user.id}`)
      .then(res => res.json())
      .then(data => setProfile(data.user))
  }, [user.id])

  if (!profile) return <div className="app">Загрузка...</div>

  return (
    <div className="app">
      <button className="back" onClick={goBack}>←</button>

      <h2>👤 Профиль</h2>

      <div className="profile">
        <p>📝 {profile.first_name} {profile.last_name}</p>
        <p>🏛 {profile.institute}</p>
        <p>📚 {profile.group_number}</p>
        <p>🔑 {profile.knrtu_login}</p>
        <p>📅 {profile.registered_at}</p>
      </div>
    </div>
  )
}