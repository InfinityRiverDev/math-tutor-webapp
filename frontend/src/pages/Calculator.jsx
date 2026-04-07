import { useState } from "react"

export default function Calculator({ goBack }) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")

  const solve = async () => {
    const res = await fetch("http://localhost:8000/calculator/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: input })
    })

    const data = await res.json()
    setResult(data.result)
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={goBack}>⬅️ Назад</button>

      <h2>🧮 Калькулятор</h2>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Введите задачу"
      />

      <button onClick={solve}>Решить</button>

      <div
        style={{ marginTop: 20 }}
        dangerouslySetInnerHTML={{ __html: result }}
      />
    </div>
  )
}