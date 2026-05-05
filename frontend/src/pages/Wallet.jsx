import { useState, useEffect } from "react"
import { API } from "../App"

export default function Wallet({ user, goBack, subscription, reloadSubscription }) {
  const [plans,         setPlans]         = useState([])
  const [balance,       setBalance]       = useState(subscription?.balance ?? 0)
  const [view,          setView]          = useState("main")  // main | topup | topup_method | plans | promo
  const [topupAmount,   setTopupAmount]   = useState("")
  const [topupMethod,   setTopupMethod]   = useState("rub")   // rub | stars | crypto
  const [promoCode,     setPromoCode]     = useState("")
  const [promoResult,   setPromoResult]   = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [toast,         setToast]         = useState(null)

  useEffect(() => {
    loadPlans()
    loadBalance()
    checkTrial()
  }, [])

  const loadBalance = async () => {
    try {
      const res  = await fetch(`${API}/billing/status?user_id=${user.id}`)
      const data = await res.json()
      setBalance(data.balance ?? 0)
    } catch {}
  }

  const loadPlans = async () => {
    try {
      const res  = await fetch(`${API}/billing/plans`)
      const data = await res.json()
      setPlans(data.plans ?? [])
    } catch {}
  }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Пробный период ──────────────────────────────────────────────



  // ── Пополнение рублями (ЮКасса) ─────────────────────────────────

  const handleTopupRub = async () => {
    const amount = parseFloat(topupAmount)
    if (!amount || amount < 10) { showToast("Минимум 10₽", false); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/billing/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount })
      })
      const data = await res.json()
      if (data.payment_url) {
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(data.payment_url)
        } else {
          window.open(data.payment_url, "_blank")
        }
        showToast("Ссылка на оплату открыта!")
        setView("main"); setTopupAmount("")
      } else {
        showToast(data.error ?? "Ошибка создания платежа", false)
      }
    } catch {
      showToast("Ошибка соединения", false)
    } finally {
      setLoading(false)
    }
  }

  // ── Пополнение Stars ────────────────────────────────────────────

// Замените функцию handleTopupStars на эту:
const handleTopupStars = async () => {
    const stars = parseInt(topupAmount)
    if (!stars || stars < 1) { showToast("Введите количество звёзд", false); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/billing/topup-stars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, stars })
      })
      const data = await res.json()
      
      if (data.invoice_url) {
        // Пробуем разные способы открытия
        if (window.Telegram?.WebApp?.openInvoice) {
          // Правильный вызов openInvoice — передаём URL
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            if (status === "paid") {
              showToast(`✅ Оплачено ${stars} ⭐ — баланс пополнен!`)
              loadBalance()
              setView("main")
              setTopupAmount("")
            } else if (status === "cancelled") {
              showToast("Оплата отменена", false)
            } else if (status === "failed") {
              showToast("Ошибка оплаты", false)
            }
          })
        } else if (window.Telegram?.WebApp?.openLink) {
          // Fallback: открываем как обычную ссылку
          window.Telegram.WebApp.openLink(data.invoice_url)
          showToast("Откройте ссылку для оплаты Stars")
          setView("main")
          setTopupAmount("")
        } else {
          // Для браузера
          window.open(data.invoice_url, "_blank")
          showToast("Откройте ссылку для оплаты Stars")
          setView("main")
          setTopupAmount("")
        }
      } else {
        showToast(data.error ?? "Ошибка создания инвойса Stars", false)
      }
    } catch (e) {
      console.error("Stars error:", e)
      showToast("Ошибка соединения", false)
    } finally {
      setLoading(false)
    }
  }
  // ── Пополнение Crypto ───────────────────────────────────────────

  const handleTopupCrypto = async () => {
    const amount = parseFloat(topupAmount)
    if (!amount || amount < 0.5) { showToast("Минимум 0.5 USDT", false); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/billing/topup-crypto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount_usdt: amount })
      })
      const data = await res.json()
      if (data.pay_url) {
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(data.pay_url)
        } else {
          window.open(data.pay_url, "_blank")
        }
        showToast("Ссылка CryptoBot открыта! После оплаты баланс пополнится.")
        setView("main"); setTopupAmount("")
      } else {
        showToast(data.error ?? "Ошибка создания крипто-инвойса", false)
      }
    } catch {
      showToast("Ошибка соединения", false)
    } finally {
      setLoading(false)
    }
  }

  // ── Промокод ───────────────────────────────────────────────────

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setLoading(true)
    try {
      const res  = await fetch(`${API}/billing/promo/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.valid) {
        setPromoResult({ discount_percent: data.discount_percent, code: promoCode.trim().toUpperCase() })
        showToast(`✅ Промокод применён! Скидка ${data.discount_percent}%`)
      } else {
        setPromoResult({ error: "Промокод недействителен" })
      }
    } catch {
      setPromoResult({ error: "Ошибка проверки" })
    } finally {
      setLoading(false)
    }
  }

  // ── Купить тариф ───────────────────────────────────────────────

  const buyPlan = async (plan) => {
    const discount    = promoResult?.discount_percent ?? 0
    const finalPrice  = Math.round(plan.price * (1 - discount / 100) * 100) / 100
    if (balance < finalPrice) { showToast(`Недостаточно средств. Нужно ${finalPrice}₽`, false); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, plan_id: plan._id, promo_code: promoResult?.code ?? null })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`✅ Тариф «${plan.name}» активирован!`)
        setBalance(b => b - finalPrice)
        setPromoResult(null); setPromoCode(""); setView("main")
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

  const sub         = subscription
  const hasActiveSub = sub?.active === true

  // ── Выбор метода пополнения ────────────────────────────────────

  if (view === "topup_method") return (
    <div style={s.root}>
      <Header title="Пополнение" sub="Выберите метод" onBack={() => setView("main")} color="rgba(16,185,129,0.2)" />
      <div style={s.body}>
        <MethodCard
          icon="💳"
          title="Банковская карта"
          desc="Visa / MasterCard / МИР · ЮКасса"
          color="#6366f1"
          onClick={() => { setTopupMethod("rub"); setView("topup") }}
        />
        <MethodCard
          icon="⭐"
          title="Telegram Stars"
          desc={`1 ⭐ = ${parseFloat(import.meta.env?.VITE_STARS_RATE ?? 1.75).toFixed(2)}₽`}
          color="#f59e0b"
          onClick={() => { setTopupMethod("stars"); setView("topup") }}
        />
        <MethodCard
          icon="₮"
          title="USDT (Crypto)"
          desc="Оплата через CryptoBot"
          color="#10b981"
          onClick={() => { setTopupMethod("crypto"); setView("topup") }}
        />
      </div>
      {toast && <Toast {...toast} />}
    </div>
  )

  if (view === "topup") {
    const isStars  = topupMethod === "stars"
    const isCrypto = topupMethod === "crypto"
    const onPay    = isStars ? handleTopupStars : isCrypto ? handleTopupCrypto : handleTopupRub
    const currency = isStars ? "⭐" : isCrypto ? "USDT" : "₽"
    const placeholder = isStars ? "100" : isCrypto ? "5.00" : "200"
    const minLabel    = isStars ? "Мин. 1 ⭐" : isCrypto ? "Мин. 0.5 USDT" : "Мин. 10₽"
    const QUICK       = isStars ? [50, 100, 200, 500] : isCrypto ? [1, 2, 5, 10] : [100, 200, 500, 1000]

    return (
      <div style={s.root}>
        <Header
          title="Пополнение"
          sub={isStars ? "Telegram Stars" : isCrypto ? "USDT Crypto" : "Банковская карта"}
          onBack={() => setView("topup_method")}
          color={isStars ? "rgba(245,158,11,0.2)" : isCrypto ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}
        />
        <div style={s.body}>
          <div style={s.inputBlock}>
            <label style={s.label}>
              {isStars ? "Количество Stars" : isCrypto ? "Сумма в USDT" : "Сумма в рублях"}
            </label>
            <div style={s.amountWrap}>
              <input
                type="number" inputMode="numeric"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                placeholder={placeholder}
                style={s.amountInput}
              />
              <span style={s.amountCurrency}>{currency}</span>
            </div>
            <div style={s.hint}>{minLabel} · Зачислится автоматически после оплаты</div>
          </div>
          <div style={s.quickAmounts}>
            {QUICK.map(a => (
              <button key={a} style={s.quickBtn} onClick={() => setTopupAmount(String(a))}>
                {a}{currency}
              </button>
            ))}
          </div>
          <button
            style={{ ...s.primaryBtn, opacity: loading || !topupAmount ? 0.5 : 1 }}
            disabled={loading || !topupAmount}
            onClick={onPay}
          >
            {loading ? "Обработка..." : `Оплатить ${topupAmount || ""}${currency} →`}
          </button>
        </div>
        {toast && <Toast {...toast} />}
      </div>
    )
  }

  if (view === "plans") return (
    <div style={s.root}>
      <Header title="Тарифы" sub="Выберите план" onBack={() => setView("main")} color="rgba(99,102,241,0.2)" />
      <div style={s.body}>
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
              {promoResult.error ? `❌ ${promoResult.error}` : `✅ Скидка ${promoResult.discount_percent}%`}
            </div>
          )}
        </div>

        {plans.length === 0 && <div style={s.empty}>Тарифы не найдены</div>}
        {plans.map(plan => {
          const discount   = promoResult?.discount_percent ?? 0
          const finalPrice = Math.round(plan.price * (1 - discount / 100) * 100) / 100
          const notEnough  = balance < finalPrice
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
                <div style={s.planNotEnough}>⚠️ Недостаточно средств (баланс {balance.toFixed(0)}₽)</div>
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

  // ── Главный экран ───────────────────────────────────────────────

  return (
    <div style={s.root}>
      <Header title="Кошелёк" sub="Баланс и подписка" onBack={goBack} color="rgba(245,158,11,0.2)" />
      <div style={s.body}>

        {/* Баланс */}
        <div style={s.balanceCard}>
          <div style={s.balanceGlow} />
          <div style={s.balanceLabel}>Баланс</div>
          <div style={s.balanceValue}>{balance.toFixed(2)}₽</div>
          <button style={s.topupBtn} onClick={() => setView("topup_method")}>➕ Пополнить</button>
        </div>

        {/* Подписка */}
        <div style={s.subCard}>
          {hasActiveSub ? (
            <>
              <div style={s.subActive}>
                <span style={s.subDot} />
                <span style={s.subPlanName}>{sub.plan_name}</span>
              </div>
              <div style={s.subExpires}>
                ⏳ До {new Date(sub.expires_at).toLocaleDateString("ru")}
                {" · "}
                {Math.max(0, Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000))} дн.
              </div>
            </>
          ) : (
            <div style={s.subInactive}>🔴 Тариф не активен</div>
          )}
        </div>


        <button style={s.primaryBtn} onClick={() => setView("plans")}>
          📦 {hasActiveSub ? "Продлить / сменить тариф" : "Купить тариф"}
        </button>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  )
}

function MethodCard({ icon, title, desc, color, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      style={{
        display: "flex", alignItems: "center", gap: 14,
        border: `1px solid ${pressed ? color : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16, padding: "16px",
        cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box",
        background: pressed ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        transition: "transform 0.12s, background 0.12s, border-color 0.12s",
        transform: pressed ? "scale(0.97)" : "scale(1)",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick() }}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: color + "20",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{desc}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function Header({ title, sub, onBack, color }) {
  return (
    <div style={{ ...hS.wrap }}>
      <div style={{ ...hS.glow, background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
      <button style={hS.back} onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={hS.info}>
        <span style={hS.title}>{title}</span>
        <span style={hS.sub}>{sub}</span>
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

const hS = {
  wrap: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12,
          padding: "20px 20px 18px", background: "linear-gradient(160deg, #131929 0%, #0a0f1e 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)" },
  glow: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%", pointerEvents: "none" },
  back: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, color: "#f1f5f9", padding: "7px 9px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { display: "flex", flexDirection: "column", gap: 2 },
  title: { fontSize: 18, fontWeight: 600, color: "#f1f5f9" },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
}

const s = {
  root: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  body: { display: "flex", flexDirection: "column", gap: 14, padding: "20px 16px" },
  balanceCard: { position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
    border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "22px 20px",
    display: "flex", flexDirection: "column", gap: 6 },
  balanceGlow: { position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%",
                 background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)", pointerEvents: "none" },
  balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  balanceValue: { fontSize: 42, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px", lineHeight: 1 },
  topupBtn: { alignSelf: "flex-start", marginTop: 8,
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b", borderRadius: 10, padding: "7px 14px",
              fontSize: 13, fontWeight: 600, cursor: "pointer" },
  subCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
             borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 6 },
  subActive: { display: "flex", alignItems: "center", gap: 8 },
  subDot: { width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 },
  subPlanName: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  subExpires: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  subInactive: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  trialCard: { position: "relative", overflow: "hidden",
               background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))",
               border: "1px solid rgba(16,185,129,0.25)", borderRadius: 18, padding: "18px" },
  trialGlow: { position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%",
               background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)", pointerEvents: "none" },
  trialTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  trialDesc: { fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 },
  trialBtn: { width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none", borderRadius: 12, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(16,185,129,0.3)" },
  primaryBtn: { width: "100%", padding: "15px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none", borderRadius: 14, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)", transition: "opacity 0.15s" },
  inputBlock: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  amountWrap: { position: "relative" },
  amountInput: { width: "100%", background: "rgba(255,255,255,0.05)",
                 border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
                 padding: "14px 44px 14px 16px", color: "#f1f5f9",
                 fontSize: 28, fontWeight: 700, outline: "none", boxSizing: "border-box", letterSpacing: "-0.5px" },
  amountCurrency: { position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                    fontSize: 22, color: "rgba(255,255,255,0.3)", fontWeight: 700 },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
  quickAmounts: { display: "flex", gap: 8 },
  quickBtn: { flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
              color: "#f1f5f9", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  promoBlock: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: "14px", display: "flex", flexDirection: "column", gap: 8 },
  promoRow: { display: "flex", gap: 8 },
  promoInput: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 14px", color: "#f1f5f9",
                fontSize: 14, fontWeight: 700, letterSpacing: "1px", outline: "none", fontFamily: "inherit" },
  promoApplyBtn: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                   color: "#818cf8", borderRadius: 10, padding: "10px 14px",
                   fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  promoStatus: { fontSize: 13, fontWeight: 600 },
  planCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px" },
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