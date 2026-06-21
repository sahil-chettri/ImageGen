import { useState, useEffect } from "react";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const T = {
  bg:        "#f5f0e8",
  card:      "#fff",
  border:    "#e8e0d0",
  accent:    "#d07a2a",
  accentD:   "rgba(208,122,42,0.10)",
  accentB:   "rgba(208,122,42,0.30)",
  text:      "#2a1f12",
  muted:     "#7a6a55",
  faint:     "#a89880",
  input:     "#faf8f4",
  successBg: "#f0fdf4",
  successBd: "#bbf7d0",
  successTx: "#16a34a",
  errorBg:   "#fff5f5",
  errorBd:   "#fecaca",
  errorTx:   "#dc2626",
};

function getToken() { return localStorage.getItem("imagegen_token") || ""; }

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PLANS = [
  {
    key:      "free",
    name:     "FREE",
    price:    "₹0",
    period:   "forever",
    credits:  "10 credits included",
    badge:    null,
    badgeBg:  null,
    bg:       T.card,
    border:   T.border,
    btnBg:    "transparent",
    btnBorder: T.accent,
    btnColor:  T.accent,
    btnText:  "Get Started Free",
    features: [
      "10 credits on signup",
      "Text to Image (512×512)",
      "Image to Image",
      "Inpainting",
      "Gallery (last 20 images)",
      "Community support",
    ],
  },
  {
    key:      "pro",
    name:     "PRO",
    price:    "₹299",
    period:   "/ month",
    credits:  "500 credits included",
    badge:    "Most Popular",
    badgeBg:  "rgba(255,255,255,0.25)",
    bg:       "linear-gradient(135deg, #d07a2a 0%, #e09050 100%)",
    border:   "transparent",
    btnBg:    "#fff",
    btnBorder:"transparent",
    btnColor:  "#d07a2a",
    btnText:  "Start Pro",
    features: [
      "500 credits / month",
      "Text to Image (up to 4K)",
      "Image to Image",
      "Inpainting",
      "HD Enhancement (2× & 4×)",
      "Priority generation",
      "Unlimited gallery",
      "Email support",
    ],
  },
  {
    key:      "ultra",
    name:     "ULTRA",
    price:    "₹799",
    period:   "/ month",
    credits:  "2000 credits included",
    badge:    "8K Ready",
    badgeBg:  "rgba(255,255,255,0.20)",
    bg:       "linear-gradient(135deg, #7c3aed 0%, #be185d 100%)",
    border:   "transparent",
    btnBg:    "#fff",
    btnBorder:"transparent",
    btnColor:  "#7c3aed",
    btnText:  "Go Ultra",
    features: [
      "2000 credits / month",
      "Everything in Pro",
      "8K Ultra HD Enhancement",
      "Batch processing",
      "API access",
      "Fastest generation",
      "Dedicated support",
      "Early feature access",
    ],
  },
];

const CREDIT_USAGE = [
  { op: "Text to Image",         cost: "1 credit" },
  { op: "Image to Image",        cost: "1 credit" },
  { op: "Inpainting",            cost: "1 credit" },
  { op: "Enhancement 2× (HD)",   cost: "1 credit" },
  { op: "Enhancement 4× (2K)",   cost: "1 credit" },
];

export default function Pricing({ user, onCreditsUpdate }) {
  const [paying,  setPaying]  = useState(null); // plan key being processed
  const [toast,   setToast]   = useState(null); // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const handlePlanClick = async (plan) => {
    if (plan.key === "free") return; // no payment needed

    const token = getToken();
    if (!token) {
      showToast("error", "Please log in to purchase a plan.");
      return;
    }

    setPaying(plan.key);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      // Create order on backend
      const orderRes = await fetch(`${VITE_API_URL}/payment/create-order`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan: plan.key }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) throw new Error(orderData.message || "Order creation failed.");

      // Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const options = {
          key:         orderData.keyId,
          amount:      orderData.amount,
          currency:    orderData.currency,
          name:        "ImageGen",
          description: plan.name + " Plan",
          image:       "/logo.png",
          order_id:    orderData.orderId,
          prefill: {
            name:  user?.name  || "",
            email: user?.email || "",
          },
          theme: { color: plan.key === "ultra" ? "#7c3aed" : "#d07a2a" },
          handler: async (response) => {
            try {
              // Verify payment on backend
              const verifyRes = await fetch(`${VITE_API_URL}/payment/verify`, {
                method:  "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body:    JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  plan:                plan.key,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.message || "Verification failed.");

              showToast("success", `🎉 Payment successful! ${plan.key === "pro" ? "500" : "2000"} credits added to your account.`);

              // Notify parent to refresh credits
              if (onCreditsUpdate) onCreditsUpdate(verifyData.credits, verifyData.plan);

              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          reject(new Error(resp.error?.description || "Payment failed."));
        });
        rzp.open();
      });

    } catch (err) {
      if (err.message !== "Payment cancelled.") {
        showToast("error", err.message || "Payment failed. Please try again.");
      }
    } finally {
      setPaying(null);
    }
  };

  const isPaid = (key) => key !== "free";
  const isCurrent = (key) => user?.plan === key;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text, overflowY:"auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes toast-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          padding:"14px 24px", borderRadius:14, zIndex:9999,
          background: toast.type === "success" ? T.successBg : T.errorBg,
          border: `1.5px solid ${toast.type === "success" ? T.successBd : T.errorBd}`,
          color: toast.type === "success" ? T.successTx : T.errorTx,
          fontSize:14, fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
          animation:"toast-in 0.3s ease", maxWidth:480, textAlign:"center",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"60px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:T.accentD, border:`1px solid ${T.accentB}`, borderRadius:99, padding:"5px 16px", fontSize:12, fontWeight:700, color:T.accent, marginBottom:20 }}>
            ✦ Simple Pricing
          </div>
          <h1 style={{ margin:"0 0 16px", fontSize:42, fontWeight:800, fontFamily:"'Playfair Display',serif", color:T.text }}>Choose your plan</h1>
          <p style={{ margin:0, fontSize:16, color:T.muted, maxWidth:480, marginInline:"auto", lineHeight:1.7 }}>
            Start free, upgrade when you need more power. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:24, marginBottom:60 }}>
          {PLANS.map(plan => {
            const active  = paying === plan.key;
            const current = isCurrent(plan.key);
            const cardIsPaid = isPaid(plan.key);
            const isLight = plan.key === "free";

            return (
              <div
                key={plan.key}
                style={{
                  borderRadius:24, padding:"32px 28px",
                  background: plan.bg,
                  border: `2px solid ${plan.border || T.border}`,
                  boxShadow: isLight ? "0 4px 24px rgba(42,31,18,0.07)" : "0 8px 40px rgba(42,31,18,0.18)",
                  position:"relative", overflow:"hidden",
                  transform: plan.key === "pro" ? "scale(1.03)" : "none",
                }}
              >
                {/* Glow */}
                {!isLight && (
                  <div style={{ position:"absolute", top:-60, right:-60, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div style={{ position:"absolute", top:20, right:20, background:plan.badgeBg, border:"1px solid rgba(255,255,255,0.3)", borderRadius:99, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#fff" }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan name */}
                <div style={{ fontSize:12, fontWeight:800, letterSpacing:"1.5px", color: isLight ? T.muted : "rgba(255,255,255,0.75)", marginBottom:8 }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom:4 }}>
                  <span style={{ fontSize:40, fontWeight:800, fontFamily:"'Playfair Display',serif", color: isLight ? T.text : "#fff" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize:14, color: isLight ? T.muted : "rgba(255,255,255,0.75)", marginLeft:4 }}>
                    {plan.period}
                  </span>
                </div>
                <div style={{ fontSize:13, color: isLight ? T.faint : "rgba(255,255,255,0.70)", marginBottom:24 }}>
                  {plan.credits}
                </div>

                {/* CTA button */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={active || current || plan.key === "free"}
                  style={{
                    width:"100%", padding:"13px", borderRadius:14,
                    background: current ? (isLight ? T.accentD : "rgba(255,255,255,0.15)") : plan.btnBg,
                    border: `2px solid ${plan.btnBorder || "transparent"}`,
                    color: current ? (isLight ? T.accent : "#fff") : plan.btnColor,
                    fontSize:15, fontWeight:700, cursor: (active || current || plan.key === "free") ? "default" : "pointer",
                    fontFamily:"'DM Sans',sans-serif",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    transition:"all .2s", marginBottom:24,
                    opacity: active ? 0.8 : 1,
                  }}
                >
                  {active ? (
                    <>
                      <span style={{ width:16, height:16, border:"2.5px solid rgba(0,0,0,0.2)", borderTopColor: plan.btnColor, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                      Processing…
                    </>
                  ) : current ? (
                    "✓ Current Plan"
                  ) : (
                    plan.btnText
                  )}
                </button>

                {/* Features */}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px", textTransform:"uppercase", color: isLight ? T.muted : "rgba(255,255,255,0.60)", marginBottom:12 }}>
                  What's included
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"flex-start", gap:9, fontSize:13, color: isLight ? T.muted : "rgba(255,255,255,0.85)", lineHeight:1.5 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isLight ? T.accent : "#fff"} strokeWidth="2.5" style={{ flexShrink:0, marginTop:1 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Credit usage table */}
        <div style={{ background:T.card, borderRadius:20, border:`1.5px solid ${T.border}`, overflow:"hidden", marginBottom:40 }}>
          <div style={{ padding:"24px 32px", borderBottom:`1px solid ${T.border}` }}>
            <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, fontFamily:"'Playfair Display',serif", color:T.text }}>Credit Usage</h2>
            <p style={{ margin:0, fontSize:13, color:T.muted }}>How many credits each operation costs</p>
          </div>
          <div>
            {CREDIT_USAGE.map((row, i) => (
              <div key={row.op} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 32px", background: i%2===0 ? T.card : T.input, borderBottom: i < CREDIT_USAGE.length-1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize:14, color:T.text, fontWeight:500 }}>{row.op}</span>
                <span style={{ fontSize:13, fontWeight:700, color:T.accent, background:T.accentD, border:`1px solid ${T.accentB}`, padding:"3px 12px", borderRadius:99 }}>{row.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Razorpay badge */}
        <div style={{ textAlign:"center", fontSize:12, color:T.faint, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Payments secured by Razorpay · SSL encrypted
        </div>
      </div>
    </div>
  );
}