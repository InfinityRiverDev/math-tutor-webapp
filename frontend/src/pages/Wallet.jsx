import { useState, useEffect } from "react"

const API = "https://math-tutor-webapp.onrender.com"

export default function Wallet({ user, goBack, subscription, reloadSubscription }) {
  const [plans, setPlans] = useState([])
  const [balance, setBalance] = useState(subscription?.balance ?? 0)
  const [view, setView] = useState("main") // main | topup | plans | promo
  const [topupAmount, setTopupAmount] = useState("")
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [promoCode, setPromoCode] = useState("")
  const [promoResult, setPromoResult] = useState(null) // { discount_percent, code } | { error }
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadPlans()
    loadBalance()
  }, [])

  const loadBalance = async () => {
    try {
      const res = await fetch(`${API}/billing/status?user_id=${user.id}`)
      const data = await res.json()
      setBalance(data.balance ?? 0)
    } catch {}
  }

  const loadPlans = async () => {
    try {
      const res = await fetch(`${API}/billing/plans`)
      const data = await res.json()
      setPlans(data.plans ?? [])
    } catch {}
  }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount)
    if (!amount || amount < 10) { showToast("Минимум 10₽", false); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/billing/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount })
      })
      const data = await res.json()
      if (data.payment_url) {
        window.Telegram?.WebApp?.openLink(data.payment_url)
        showToast("Ссылка на оплату открыта!")
        setView("main")
        setTopupAmount("")
      } else {
        showToast("Ошибка создания платежа", false)
      }
    } catch {
      showToast("Ошибка соединения", false)
    } finally {
      setLoading(false)
    }
  }

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/billing/promo/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.valid) {
        setPromoResult({ discount_percent: data.discount_percent, code: promoCode.trim().toUpperCase() })
        showToast(`Промокод применён! Скидка ${data.discount_percent}%`)
      } else {
        setPromoResult({ error: "Промокод недействителен" })
      }
    } catch {
      setPromoResult({ error: "Ошибка проверки" })
    } finally {
      setLoading(false)
    }
  }

  const buyPlan = async (plan) => {
    const discount = promoResult?.discount_percent ?? 0
    const finalPrice = Math.round(plan.price * (1 - discount / 100) * 100) / 100

    if (balance < finalPrice) {
      showToast(`Недостаточно средств. Нужно ${finalPrice}₽`, false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          plan_id: plan._id,
          promo_code: promoResult?.code ?? null
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`✅ Тариф «${plan.name}» активирован!`)
        setBalance(b => b - finalPrice)
        setPromoResult(null)
        setPromoCode("")
        setView("main")
        await reloadSubscription()
      } else {
        showToast(data.error ?? "Ошибка активации", false)
      }
    } catch {
      showToast("Ошибка соединения", false)
    } finally {
      setLoading(false)
    }
  }

  const sub = subscription
  const hasActiveSub = sub?.active === true

  // ─── Views ───

  if (view === "topup") return (
    <div style={s.root}>
      <Header title="Пополнение" sub="Введите сумму" onBack={() => setView("main")} color="rgba(16,185,129,0.2)" />
      <div style={s.body}>
        <div style={s.inputBlock}>
          <label style={s.label}>Сумма в рублях</label>
          <div style={s.amountWrap}>
            <input
              type="number" inputMode="numeric"
              value={topupAmount}
              onChange={e => setTopupAmount(e.target.value)}
              placeholder="200"
              style={s.amountInput}
            />
            <span style={s.amountCurrency}>₽</span>
          </div>
          <div style={s.hint}>Минимум 10₽ · Зачислится автоматически после оплаты</div>
        </div>
        <div style={s.quickAmounts}>
          {[100, 200, 500, 1000].map(a => (
            <button key={a} style={s.quickBtn} onClick={() => setTopupAmount(String(a))}>
              {a}₽
            </button>
          ))}
        </div>
        <button
          style={{ ...s.primaryBtn, opacity: loading || !topupAmount ? 0.5 : 1 }}
          disabled={loading || !topupAmount}
          onClick={handleTopup}
        >
          {loading ? "Создаю платёж..." : "Перейти к оплате →"}
        </button>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  )

  if (view === "plans") return (
    <div style={s.root}>
      <Header title="Тарифы" sub="Выберите план" onBack={() => setView("main")} color="rgba(99,102,241,0.2)" />
      <div style={s.body}>
        {/* Промокод */}
        <div style={s.promoBlock}>
          <div style={s.promoRow}>
            <input
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="ПРОМОКОД"
              style={s.promoInput}
            />
            <button style={s.promoApplyBtn} onClick={applyPromo} disabled={loading}>
              Применить
            </button>
          </div>
          {promoResult && (
            <div style={{ ...s.promoStatus, color: promoResult.error ? "#ef4444" : "#10b981" }}>
              {promoResult.error ? `❌ ${promoResult.error}` : `✅ Скидка ${promoResult.discount_percent}% применена`}
            </div>
          )}
        </div>

        {/* Список тарифов */}
        {plans.length === 0 && (
          <div style={s.empty}>Тарифы не найдены</div>
        )}
        {plans.map(plan => {
          const discount = promoResult?.discount_percent ?? 0
          const finalPrice = Math.round(plan.price * (1 - discount / 100) * 100) / 100
          const notEnough = balance < finalPrice
          return (
            <div key={plan._id} style={s.planCard}>
              <div style={s.planHeader}>
                <span style={s.planName}>📦 {plan.name}</span>
                <div style={s.planPriceBlock}>
                  {discount > 0 && <span style={s.planOldPrice}>{plan.price}₽</span>}
                  <span style={s.planPrice}>{finalPrice}₽</span>
                </div>
              </div>
              {plan.description ? <div style={s.planDesc}>{plan.description}</div> : null}
              <div style={s.planMeta}>📅 {plan.duration_days} дней</div>
              {notEnough && (
                <div style={s.planNotEnough}>⚠️ Недостаточно средств (на балансе {balance.toFixed(0)}₽)</div>
              )}
              <button
                style={{ ...s.primaryBtn, marginTop: 12, opacity: loading || notEnough ? 0.4 : 1 }}
                disabled={loading || notEnough}
                onClick={() => buyPlan(plan)}
              >
                {loading ? "Обработка..." : `Активировать за ${finalPrice}₽`}
              </button>
            </div>
          )
        })}
      </div>
      {toast && <Toast {...toast} />}
    </div>
  )

  // ─── Main view ───
  return (
    <div style={s.root}>
      <Header title="Кошелёк" sub="Баланс и подписка" onBack={goBack} color="rgba(245,158,11,0.2)" />
      <div style={s.body}>

        {/* Баланс */}
        <div style={s.balanceCard}>
          <div style={s.balanceGlow} />
          <div style={s.balanceLabel}>Баланс</div>
          <div style={s.balanceValue}>{balance.toFixed(2)}₽</div>
          <button style={s.topupBtn} onClick={() => setView("topup")}>➕ Пополнить</button>
        </div>

        {/* Подписка */}
        <div style={s.subCard}>
          {hasActiveSub ? (
            <>
              <div style={s.subActive}>
                <span style={s.subDot} />
                <span style={s.subPlanName}>Тариф: {sub.plan_name}</span>
              </div>
              <div style={s.subExpires}>
                ⏳ До {new Date(sub.expires_at).toLocaleDateString("ru")}
                {" · "}
                {Math.max(0, Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000))} дн.
              </div>
            </>
          ) : (
            <div style={s.subInactive}>
              🔴 Тариф не активен · купите для полного доступа
            </div>
          )}
        </div>

        {/* Кнопки */}
        <button style={s.primaryBtn} onClick={() => setView("plans")}>
          📦 {hasActiveSub ? "Продлить тариф" : "Купить тариф"}
        </button>

        <button style={s.secondaryBtn} onClick={() => {
          showToast("Для вывода средств обратитесь к администратору @admin_username")
        }}>
          📤 Вывод средств
        </button>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  )
}

function Header({ title, sub, onBack, color }) {
  return (
    <div style={{ ...headerS.wrap, "--glow": color }}>
      <div style={{ ...headerS.glow, background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
      <button style={headerS.back} onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={headerS.info}>
        <span style={headerS.title}>{title}</span>
        <span style={headerS.sub}>{sub}</span>
      </div>
    </div>
  )
}

function Toast({ msg, ok }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: 16, right: 16,
      background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius: 14, padding: "13px 16px",
      color: ok ? "#10b981" : "#ef4444",
      fontSize: 14, fontWeight: 600,
      zIndex: 999, backdropFilter: "blur(12px)",
      animation: "fadeIn 0.2s ease",
    }}>
      {msg}
    </div>
  )
}

const headerS = {
  wrap: {
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 12,
    padding: "20px 20px 18px",
    background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  glow: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: "50%",
    pointerEvents: "none",
  },
  back: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  info: { display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
}

const s = {
  root: {
    minHeight: "100vh", background: "#0a0f1e",
    display: "flex", flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  body: { display: "flex", flexDirection: "column", gap: 14, padding: "20px 16px" },
  balanceCard: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 20, padding: "22px 20px",
    display: "flex", flexDirection: "column", gap: 6,
  },
  balanceGlow: {
    position: "absolute", top: -30, right: -30,
    width: 120, height: 120, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  balanceValue: { fontSize: 42, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px", lineHeight: 1 },
  topupBtn: {
    alignSelf: "flex-start", marginTop: 8,
    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b", borderRadius: 10, padding: "7px 14px",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  subCard: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "16px",
    display: "flex", flexDirection: "column", gap: 6,
  },
  subActive: { display: "flex", alignItems: "center", gap: 8 },
  subDot: { width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 },
  subPlanName: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  subExpires: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  subInactive: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  primaryBtn: {
    width: "100%", padding: "15px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none", borderRadius: 14,
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "opacity 0.15s",
    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
  },
  secondaryBtn: {
    width: "100%", padding: "14px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, color: "rgba(255,255,255,0.6)",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  inputBlock: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  amountWrap: { position: "relative" },
  amountInput: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
    padding: "14px 44px 14px 16px", color: "#f1f5f9",
    fontSize: 28, fontWeight: 700, outline: "none",
    boxSizing: "border-box", letterSpacing: "-0.5px",
  },
  amountCurrency: {
    position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
    fontSize: 22, color: "rgba(255,255,255,0.3)", fontWeight: 700,
  },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
  quickAmounts: { display: "flex", gap: 8 },
  quickBtn: {
    flex: 1, padding: "10px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f1f5f9", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  promoBlock: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "14px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  promoRow: { display: "flex", gap: 8 },
  promoInput: {
    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px", color: "#f1f5f9",
    fontSize: 14, fontWeight: 700, letterSpacing: "1px", outline: "none",
  },
  promoApplyBtn: {
    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
    color: "#818cf8", borderRadius: 10, padding: "10px 14px",
    fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  promoStatus: { fontSize: 13, fontWeight: 600 },
  planCard: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: "18px",
  },
  planHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  planName: { fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  planPriceBlock: { display: "flex", alignItems: "center", gap: 6 },
  planOldPrice: { fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "line-through" },
  planPrice: { fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  planDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 },
  planMeta: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  planNotEnough: { fontSize: 12, color: "#f59e0b", marginTop: 6 },
  empty: { textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "40px 0" },
}