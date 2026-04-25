import { useState } from "react"
import { API } from "../App"

// Секретные ключи трёх админов
const ADMIN_KEYS = {
  1991833177: "MathDestroy2024!",
  808603029:  "TutorWipeX#Secure",
  1114949712: "StudyBot-Reset99",
}

export default function SelfDestruct({ user, goBack }) {
  const [keys, setKeys] = useState({ key1: "", key2: "", key3: "" })
  const [step, setStep] = useState(0) // 0 - предупреждение, 1 - ввод ключей, 2 - подтверждение
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Получаем список ID админов
  const adminIds = Object.keys(ADMIN_KEYS).map(Number)
  
  // Свой ключ текущего админа
  const myKey = ADMIN_KEYS[user?.id]

  const allKeysValid = () => {
    const adminEntries = Object.entries(ADMIN_KEYS)
    const keyValues = Object.values(keys)
    
    if (keyValues.length < 3) return false
    
    // Проверяем, что каждый введённый ключ совпадает с одним из секретных
    const validKeys = adminEntries.map(([id, secret]) => secret)
    const enteredKeys = [...keyValues]
    
    let matched = 0
    const usedKeys = new Set()
    
    for (const entered of enteredKeys) {
      for (const valid of validKeys) {
        if (entered === valid && !usedKeys.has(valid)) {
          matched++
          usedKeys.add(valid)
          break
        }
      }
    }
    
    return matched === 3
  }

  const handleDestruct = async () => {
    if (!allKeysValid()) {
      setError("❌ Не все ключи верны. Проверьте ввод.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API}/admin/self-destruct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: user.id,
          keys: [keys.key1, keys.key2, keys.key3]
        })
      })

      const data = await res.json()

      if (data.success) {
        setResult(data)
        setStep(3) // Показываем результат
      } else {
        setError(data.error || "❌ Ошибка при удалении")
      }
    } catch (e) {
      setError("❌ Ошибка соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  // Экран 0: Предупреждение
  if (step === 0) {
    return (
      <div style={s.root}>
        <Header goBack={goBack} />
        
        <div style={s.body}>
          {/* Карточка предупреждения */}
          <div style={s.warningCard}>
            <div style={s.warningIcon}>⚠️</div>
            <div style={s.warningTitle}>САМОЛИКВИДАЦИЯ</div>
            <div style={s.warningText}>
              Эта операция <b>ПОЛНОСТЬЮ УНИЧТОЖИТ</b> базу данных бота.
              <br /><br />
              Будут удалены:
              <br />• Все пользователи и их данные
              <br />• Все тарифы и подписки
              <br />• Все промокоды и платежи
              <br />• Все лекции и предметы
              <br />• Все сообщения чатов
              <br />• Вся статистика и XP
              <br />• Все настройки групп
              <br /><br />
              <b style={{ color: "#ef4444" }}>Это действие НЕОБРАТИМО!</b>
            </div>
            <div style={s.keyNotice}>
              🔑 Для активации потребуются <b>секретные ключи всех трёх администраторов</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button style={s.cancelBtn} onClick={goBack}>
              ❌ Отмена
            </button>
            <button style={s.continueBtn} onClick={() => setStep(1)}>
              ⚠️ Я понимаю последствия
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Экран 1: Ввод ключей
  if (step === 1) {
    return (
      <div style={s.root}>
        <Header goBack={goBack} />
        
        <div style={s.body}>
          <div style={s.keysCard}>
            <div style={s.keysTitle}>
              🔐 Введите секретные ключи всех администраторов
            </div>
            <div style={s.keysSubtitle}>
              Ваш ключ: <code style={s.myKeyCode}>{myKey}</code>
            </div>

            <div style={s.keysList}>
              <KeyInput
                label="Ключ администратора 1"
                value={keys.key1}
                onChange={(v) => setKeys(prev => ({ ...prev, key1: v }))}
                placeholder="Введите первый ключ..."
              />
              <KeyInput
                label="Ключ администратора 2"
                value={keys.key2}
                onChange={(v) => setKeys(prev => ({ ...prev, key2: v }))}
                placeholder="Введите второй ключ..."
              />
              <KeyInput
                label="Ключ администратора 3"
                value={keys.key3}
                onChange={(v) => setKeys(prev => ({ ...prev, key3: v }))}
                placeholder="Введите третий ключ..."
              />
            </div>

            {error && (
              <div style={s.errorBox}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button style={s.cancelBtn} onClick={goBack}>
                ❌ Отмена
              </button>
              <button 
                style={{
                  ...s.destructBtn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
                onClick={() => setStep(2)}
                disabled={loading || !keys.key1 || !keys.key2 || !keys.key3}
              >
                {loading ? "⏳ Проверка..." : "⚠️ Подтвердить ключи"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Экран 2: Финальное подтверждение
  if (step === 2) {
    return (
      <div style={s.root}>
        <Header goBack={goBack} />
        
        <div style={s.body}>
          <div style={s.finalCard}>
            <div style={s.finalIcon}>💀</div>
            <div style={s.finalTitle}>ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ</div>
            <div style={s.finalText}>
              Вы собираетесь <b>навсегда удалить ВСЕ данные бота</b>.
              <br /><br />
              После подтверждения:
              <br />• База данных будет полностью очищена
              <br />• Восстановить данные будет <b>НЕВОЗМОЖНО</b>
              <br />• Бот продолжит работать, но с чистого листа
            </div>

            {error && (
              <div style={s.errorBox}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button style={s.cancelBtn} onClick={goBack}>
                ❌ Отмена
              </button>
              <button 
                style={{
                  ...s.finalDestructBtn,
                  opacity: loading ? 0.6 : 1,
                }}
                onClick={handleDestruct}
                disabled={loading}
              >
                {loading ? "⏳ Удаление..." : "💀 УНИЧТОЖИТЬ БАЗУ ДАННЫХ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Экран 3: Результат
  if (step === 3 && result) {
    return (
      <div style={s.root}>
        <Header goBack={goBack} />
        
        <div style={s.body}>
          <div style={s.resultCard}>
            <div style={s.resultIcon}>{result.success ? "✅" : "❌"}</div>
            <div style={s.resultTitle}>
              {result.success ? "БАЗА ДАННЫХ УНИЧТОЖЕНА" : "ОШИБКА"}
            </div>
            <div style={s.resultText}>
              {result.success ? (
                <>
                  <div style={s.statRow}>
                    <span>Коллекций удалено:</span>
                    <b>{result.collections_deleted}</b>
                  </div>
                  <div style={s.statRow}>
                    <span>Документов удалено:</span>
                    <b>{result.documents_deleted}</b>
                  </div>
                </>
              ) : (
                result.error || "Неизвестная ошибка"
              )}
            </div>
            <button style={s.backToMainBtn} onClick={goBack}>
              ⬅️ Назад в админ-панель
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function KeyInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)

  return (
    <div style={ki.wrapper}>
      <label style={ki.label}>{label}</label>
      <div style={ki.inputRow}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={ki.input}
        />
        <button 
          style={ki.showBtn}
          onClick={() => setShow(!show)}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  )
}

const ki = {
  wrapper: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 },
  inputRow: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    fontFamily: "monospace",
    letterSpacing: "1px",
  },
  showBtn: {
    width: 44,
    height: 44,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 18,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}

function Header({ goBack }) {
  return (
    <div style={s.header}>
      <div style={s.headerGlow} />
      <button style={s.backBtn} onClick={goBack}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div>
        <span style={s.headerTitle}>⚠️ САМОЛИКВИДАЦИЯ</span>
        <span style={s.headerSub}>Полное удаление базы данных</span>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 18px", background: "linear-gradient(160deg, #1a0a0a 0%, #0a0f1e 100%)", borderBottom: "1px solid rgba(239,68,68,0.2)" },
  headerGlow: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)", pointerEvents: "none" },
  backBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: "#ef4444" },
  headerSub: { fontSize: 12, color: "rgba(239,68,68,0.6)" },
  body: { display: "flex", flexDirection: "column", gap: 14, padding: "20px 16px" },
  
  warningCard: { background: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  warningIcon: { fontSize: 60, lineHeight: 1 },
  warningTitle: { fontSize: 22, fontWeight: 800, color: "#ef4444", letterSpacing: "2px", textTransform: "uppercase" },
  warningText: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, textAlign: "center" },
  keyNotice: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "center", width: "100%" },
  
  keysCard: { background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.2)", borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 },
  keysTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", textAlign: "center" },
  keysSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  keysList: { display: "flex", flexDirection: "column", gap: 8 },
  myKeyCode: { background: "rgba(239,68,68,0.15)", padding: "4px 8px", borderRadius: 6, color: "#ef4444", fontSize: 13 },
  
  finalCard: { background: "rgba(239,68,68,0.1)", border: "3px solid rgba(239,68,68,0.5)", borderRadius: 24, padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  finalIcon: { fontSize: 70, lineHeight: 1 },
  finalTitle: { fontSize: 20, fontWeight: 800, color: "#ef4444", letterSpacing: "3px" },
  finalText: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, textAlign: "center" },
  
  resultCard: { background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.3)", borderRadius: 24, padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  resultIcon: { fontSize: 60, lineHeight: 1 },
  resultTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", textAlign: "center" },
  resultText: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, textAlign: "center", width: "100%" },
  statRow: { display: "flex", justifyContent: "space-between", width: "100%", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  
  cancelBtn: { flex: 1, padding: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "#f1f5f9", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  continueBtn: { flex: 1, padding: "14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 14, color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  destructBtn: { flex: 1, padding: "14px", background: "linear-gradient(135deg, #dc2626, #991b1b)", border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" },
  finalDestructBtn: { flex: 1, padding: "16px", background: "linear-gradient(135deg, #dc2626, #7f1d1d)", border: "3px solid #ef4444", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: "1px", boxShadow: "0 0 30px rgba(239,68,68,0.5)" },
  backToMainBtn: { padding: "14px 32px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, color: "#f1f5f9", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  errorBox: { padding: "12px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#ef4444", fontSize: 13, textAlign: "center" },
}