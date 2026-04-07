import { useState } from "react"

export default function Tutor({ goBack }) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")

  const ask = async () => {
    const res = await fetch("https://math-tutor-webapp.onrender.com/tutor/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: input, history: [] })
    })

    const data = await res.json()
    setResult(data.answer)
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={goBack}>⬅️ Назад</button>

      <h2>🎓 Репетитор</h2>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Задай вопрос"
      />

      <button onClick={ask}>Спросить</button>

      <div
        style={{ marginTop: 20 }}
        dangerouslySetInnerHTML={{ __html: result }}
      />
    </div>
  )
}