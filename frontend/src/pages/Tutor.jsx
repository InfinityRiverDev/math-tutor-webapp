import { useState, useRef, useEffect } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function Tutor({ user, goBack }) {
  const [mode, setMode] = useState("menu")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const chatRef = useRef()

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages])

  const send = async () => {
    if (!input) return

    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)

    const url =
      mode === "practice"
        ? `${API}/tutor/practice`
        : `${API}/tutor/`

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      <div className="app">
        <button className="back" onClick={goBack}>←</button>

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
    <div className="chat-app">
      <button className="back" onClick={() => setMode("menu")}>←</button>

      <div className="chat" ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} className={`row ${m.role}`}>
            <div className={`bubble ${m.role}`}>
              <div dangerouslySetInnerHTML={{ __html: m.content }} />
            </div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши сообщение..."
        />
        <button onClick={send}>➤</button>
      </div>
    </div>
  )
}