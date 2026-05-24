const T = {
  bg:     "#f5f0e8",
  card:   "#fff",
  border: "#e8e0d0",
  accent: "#d07a2a",
  accentD:"rgba(208,122,42,0.10)",
  accentB:"rgba(208,122,42,0.30)",
  text:   "#2a1f12",
  muted:  "#7a6a55",
  faint:  "#a89880",
};

const PLANS = [
  {
    name:     "Free",
    price:    "₹0",
    period:   "forever",
    credits:  10,
    color:    T.muted,
    bg:       T.card,
    border:   T.border,
    badge:    null,
    features: [
      "10 credits on signup",
      "Text to Image (512×512)",
      "Image to Image",
      "Standard quality",
      "Gallery (last 20 images)",
      "Community support",
    ],
    cta: "Get Started Free",
    ctaBg: T.accentD,
    ctaColor: T.accent,
    ctaBorder: T.accentB,
  },
  {
    name:     "Pro",
    price:    "₹299",
    period:   "/ month",
    credits:  500,
    color:    "#fff",
    bg:       "linear-gradient(135deg, #d07a2a 0%, #e09050 100%)",
    border:   "transparent",
    badge:    "Most Popular",
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
    cta: "Start Pro",
    ctaBg: "rgba(255,255,255,0.20)",
    ctaColor: "#fff",
    ctaBorder: "rgba(255,255,255,0.40)",
  },
  {
    name:     "Ultra",
    price:    "₹799",
    period:   "/ month",
    credits:  2000,
    color:    "#fff",
    bg:       "linear-gradient(135deg, #7e22ce 0%, #be185d 100%)",
    border:   "transparent",
    badge:    "8K Ready",
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
    cta: "Go Ultra",
    ctaBg: "rgba(255,255,255,0.20)",
    ctaColor: "#fff",
    ctaBorder: "rgba(255,255,255,0.40)",
  },
];

const CHECK = (color="#16a34a") => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
);

function PlanCard({ plan }) {
  const isGradient = plan.bg.startsWith("linear");
  return (
    <div style={{
      borderRadius:20, overflow:"hidden", position:"relative",
      background: plan.bg,
      border: `2px solid ${plan.border}`,
      boxShadow: isGradient ? "0 12px 40px rgba(0,0,0,0.18)" : "0 4px 20px rgba(42,31,18,0.08)",
      display:"flex", flexDirection:"column",
      transition:"transform .2s, box-shadow .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=isGradient?"0 20px 60px rgba(0,0,0,0.25)":"0 12px 40px rgba(42,31,18,0.14)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=isGradient?"0 12px 40px rgba(0,0,0,0.18)":"0 4px 20px rgba(42,31,18,0.08)"; }}
    >
      {plan.badge && (
        <div style={{ position:"absolute", top:16, right:16, fontSize:10, fontWeight:800, background:"rgba(255,255,255,0.20)", color: isGradient ? "#fff" : T.accent, padding:"3px 10px", borderRadius:99, border:`1px solid ${isGradient?"rgba(255,255,255,0.35)":T.accentB}`, letterSpacing:"0.5px" }}>
          {plan.badge}
        </div>
      )}

      <div style={{ padding:"28px 28px 20px" }}>
        <div style={{ fontSize:13, fontWeight:700, color: isGradient ? "rgba(255,255,255,0.75)" : T.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px" }}>{plan.name}</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:4 }}>
          <span style={{ fontSize:36, fontWeight:800, color: isGradient ? "#fff" : T.text, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{plan.price}</span>
          <span style={{ fontSize:13, color: isGradient ? "rgba(255,255,255,0.7)" : T.muted, marginBottom:4 }}>{plan.period}</span>
        </div>
        <div style={{ fontSize:12, color: isGradient ? "rgba(255,255,255,0.65)" : T.faint, marginBottom:20 }}>
          {plan.credits} credits included
        </div>

        <button style={{ width:"100%", padding:"11px", borderRadius:12, border:`1.5px solid ${plan.ctaBorder}`, background:plan.ctaBg, color:plan.ctaColor, fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.opacity="0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity="1"; }}
        >
          {plan.cta}
        </button>
      </div>

      <div style={{ height:1, background: isGradient ? "rgba(255,255,255,0.15)" : T.border }} />

      <div style={{ padding:"20px 28px 28px", flex:1 }}>
        <div style={{ fontSize:11, fontWeight:700, color: isGradient ? "rgba(255,255,255,0.55)" : T.faint, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:12 }}>What's included</div>
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {plan.features.map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:8 }}>
              {CHECK(isGradient ? "rgba(255,255,255,0.9)" : "#16a34a")}
              <span style={{ fontSize:13, color: isGradient ? "rgba(255,255,255,0.88)" : T.muted }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ textAlign:"center", padding:"52px 40px 40px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:T.accentD, border:`1px solid ${T.accentB}`, borderRadius:99, padding:"5px 16px", fontSize:12, fontWeight:600, color:T.accent, marginBottom:18 }}>
          ✦ Simple Pricing
        </div>
        <h1 style={{ margin:"0 0 12px", fontSize:40, fontWeight:800, fontFamily:"'Playfair Display',serif", color:T.text, letterSpacing:"-1px" }}>
          Choose your plan
        </h1>
        <p style={{ margin:0, fontSize:16, color:T.muted, maxWidth:480, marginLeft:"auto", marginRight:"auto", lineHeight:1.6 }}>
          Start free, upgrade when you need more power. No hidden fees, cancel anytime.
        </p>
      </div>

      {/* Plans */}
      <div style={{ padding:"0 40px 60px", maxWidth:1000, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 }}>
          {PLANS.map(p => <PlanCard key={p.name} plan={p} />)}
        </div>

        {/* Credit costs table */}
        <div style={{ marginTop:48, background:T.card, border:`1px solid ${T.border}`, borderRadius:20, overflow:"hidden" }}>
          <div style={{ padding:"20px 28px", borderBottom:`1px solid ${T.border}` }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, fontFamily:"'Playfair Display',serif", color:T.text }}>Credit Usage</h3>
            <p style={{ margin:"4px 0 0", fontSize:13, color:T.muted }}>How many credits each operation costs</p>
          </div>
          <div style={{ padding:"8px 0" }}>
            {[
              { op:"Text to Image",          cost:"1 credit",  icon:"✨" },
              { op:"Image to Image",          cost:"1 credit",  icon:"🔄" },
              { op:"Inpainting",              cost:"1 credit",  icon:"🎨" },
              { op:"Enhancement 2× (HD)",     cost:"1 credit",  icon:"⬆️" },
              { op:"Enhancement 4× (2K)",     cost:"1 credit",  icon:"🔍" },
              { op:"Enhancement 8× (8K)",     cost:"2 credits", icon:"🚀" },
            ].map((row, i) => (
              <div key={row.op} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 28px", background: i%2===0 ? "transparent" : T.bg }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:16 }}>{row.icon}</span>
                  <span style={{ fontSize:13, color:T.text, fontWeight:500 }}>{row.op}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:T.accent, background:T.accentD, padding:"3px 12px", borderRadius:99, border:`1px solid ${T.accentB}` }}>{row.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop:40, textAlign:"center" }}>
          <p style={{ fontSize:14, color:T.muted }}>
            Questions? Contact us at <span style={{ color:T.accent, fontWeight:600 }}>support@imagegen.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
}