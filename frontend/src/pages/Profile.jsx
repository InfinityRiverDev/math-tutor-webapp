export default function Profile({ user, goBack }) {
  return (
    <div style={{ padding: 20 }}>
      <button onClick={goBack}>⬅️ Назад</button>

      <h2>👤 Профиль</h2>

      <p>Имя: {user.first_name}</p>
      <p>ID: {user.id}</p>
      <p>Username: {user.username}</p>
    </div>
  )
}