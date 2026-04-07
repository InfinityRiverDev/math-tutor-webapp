import { useState } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function Tutor({ user, goBack }) {
  const [mode, setMode] = useState("menu")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])

  const send = async () => {
    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)

    const url =
      mode === "practice"
        ? `${API}/tutor/practice`
        : `${API}/tutor/`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input,
        user_id: user.id
      })
    })

    const data = await res.json()

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.answer }
    ])

    setInput("")
  }

  if (mode === "menu") {
    return (
      <div className="container">
        <button onClick={goBack}>⬅️ Назад</button>

        <h2>🎓 ИИ</h2>

        <div className="grid">
          <div className="card" onClick={() => setMode("chat")}>
            🎓 Репетитор
          </div>

          <div className="card" onClick={() => setMode("practice")}>
            ✍️ Практика
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <button onClick={() => setMode("menu")}>⬅️ Назад</button>

      <h2>{mode === "practice" ? "✍️ Практика" : "🎓 Репетитор"}</h2>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "msg user" : "msg bot"}>
            <div dangerouslySetInnerHTML={{ __html: m.content }} />
          </div>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Напиши..."
      />

      <button onClick={send}>Отправить</button>
    </div>
  )
}