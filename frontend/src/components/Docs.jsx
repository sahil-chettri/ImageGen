import { useState } from "react";

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
  input:  "#faf8f4",
  code:   "#1e1e1e",
  codeBg: "#f0ebe3",
};

const SECTIONS = [
  { id:"getting-started", label:"Getting Started",   icon:"🚀" },
  { id:"text-to-image",   label:"Text to Image",     icon:"✨" },
  { id:"image-to-image",  label:"Image to Image",    icon:"🔄" },
  { id:"inpainting",      label:"Inpainting",        icon:"🎨" },
  { id:"enhancement",     label:"Image Enhancement", icon:"⬆️" },
  { id:"credits",         label:"Credits & Billing", icon:"💳" },
  { id:"api",             label:"API Reference",     icon:"⚡" },
];

function Code({ children }) {
  return (
    <pre style={{ background:T.codeBg, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px", fontSize:12.5, color:T.code, overflowX:"auto", fontFamily:"'JetBrains Mono', 'Fira Code', monospace", lineHeight:1.6, margin:"12px 0" }}>
      <code>{children}</code>
    </pre>
  );
}

function Badge({ children, color="#d07a2a", bg="rgba(208,122,42,0.10)" }) {
  return <span style={{ fontSize:10.5, fontWeight:700, background:bg, color, padding:"2px 9px", borderRadius:99, border:`1px solid ${color}40` }}>{children}</span>;
}

function Section({ id, title, icon, children }) {
  return (
    <div id={id} style={{ marginBottom:48 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, fontFamily:"'Playfair Display',serif", color:T.text }}>{title}</h2>
      </div>
      <div style={{ color:T.muted, fontSize:14, lineHeight:1.8 }}>{children}</div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div style={{ display:"flex", gap:14, marginBottom:16 }}>
      <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg, ${T.accent}, #e09050)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:800, flexShrink:0, marginTop:2 }}>{n}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <div style={{ background:T.accentD, border:`1.5px solid ${T.accentB}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:T.accent, marginTop:12, display:"flex", gap:8, alignItems:"flex-start" }}>
      <span style={{ flexShrink:0 }}>💡</span>
      <span>{children}</span>
    </div>
  );
}

export default function Docs() {
  const [active, setActive] = useState("getting-started");

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  return (
    <div style={{ height:"100%", display:"flex", overflow:"hidden", background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box}`}</style>

      {/* Sidebar */}
      <div style={{ width:240, borderRight:`1px solid ${T.border}`, background:T.card, overflowY:"auto", flexShrink:0, padding:"24px 0" }}>
        <div style={{ padding:"0 20px 16px", borderBottom:`1px solid ${T.border}`, marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.faint, textTransform:"uppercase", letterSpacing:"0.8px" }}>Documentation</div>
        </div>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 20px", background:active===s.id ? T.accentD : "none", border:"none", borderLeft:`3px solid ${active===s.id ? T.accent : "transparent"}`, cursor:"pointer", fontSize:13, color:active===s.id ? T.accent : T.muted, fontWeight:active===s.id ? 600 : 400, textAlign:"left", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"36px 48px 60px" }}>
        <div style={{ maxWidth:720 }}>

          <Section id="getting-started" title="Getting Started" icon="🚀">
            <p>Welcome to <strong style={{color:T.text}}>ImageGen</strong> — your AI-powered image studio. Here's how to get up and running in minutes.</p>
            <Step n={1} title="Create an account">Sign up using the Get Started button on the landing page. You'll receive <strong>10 free credits</strong> on signup — no credit card required.</Step>
            <Step n={2} title="Choose a mode">From the Mode Picker, choose one of four AI tools: Text to Image, Image to Image, Inpainting, or Image Enhancement.</Step>
            <Step n={3} title="Generate your first image">Enter a prompt, pick your settings, and click Generate. Your image will appear in seconds and be saved to your Gallery.</Step>
            <Tip>Start with a detailed prompt for best results. Instead of "a dog", try "a golden retriever puppy sitting in a sunlit meadow, photorealistic, 8k".</Tip>
          </Section>

          <div style={{ height:1, background:T.border, margin:"0 0 48px" }} />

          <Section id="text-to-image" title="Text to Image" icon="✨">
            <p>Generate stunning images from text descriptions using state-of-the-art AI models.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"12px 0" }}>
              <Badge>1 credit per image</Badge>
              <Badge color="#0369a1" bg="#f0f9ff">Stability AI</Badge>
              <Badge color="#6d28d9" bg="#f5f3ff">Pollinations</Badge>
            </div>
            <Step n={1} title="Write your prompt">Describe what you want to see. Be specific about subject, style, lighting, and mood.</Step>
            <Step n={2} title="Add a negative prompt (optional)">Tell the AI what to avoid — e.g. "blurry, low quality, extra limbs".</Step>
            <Step n={3} title="Choose style and aspect ratio">Pick from presets like Photorealistic, Anime, Cinematic, or Oil Painting. Select 1:1, 16:9, or 9:16.</Step>
            <Tip>Use the <strong>Optimize Prompt</strong> button to let AI enhance your prompt automatically for better results.</Tip>
            <h4 style={{ color:T.text, marginTop:20, marginBottom:8 }}>Example prompts</h4>
            <Code>{`"A majestic snow-capped mountain at golden hour, 
 dramatic clouds, cinematic lighting, 8k photo"

"Anime girl in a cyberpunk city, neon lights, 
 rain reflection, studio ghibli style"`}</Code>
          </Section>

          <div style={{ height:1, background:T.border, margin:"0 0 48px" }} />

          <Section id="image-to-image" title="Image to Image" icon="🔄">
            <p>Transform any existing image into a new style while preserving its structure and composition.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"12px 0" }}>
              <Badge>1 credit per transform</Badge>
              <Badge color="#6d28d9" bg="#f5f3ff">Style Templates</Badge>
            </div>
            <Step n={1} title="Upload a source image">Drag and drop or click to upload a JPG, PNG, or WEBP file (max 5MB).</Step>
            <Step n={2} title="Pick a style template">Choose from Anime, Cinematic, Cyberpunk, Pixar 3D, Oil Paint, DSLR Pro, Glow, or Sci-Fi.</Step>
            <Step n={3} title="Write a transformation prompt">Describe how you want the image transformed. The AI will use your source image as a guide.</Step>
            <Tip>For best results, use images with a clear subject. Portrait photos and landscapes work especially well.</Tip>
          </Section>

          <div style={{ height:1, background:T.border, margin:"0 0 48px" }} />

          <Section id="inpainting" title="Inpainting" icon="🎨">
            <p>Surgically edit specific parts of an image — change, remove, or add elements with AI.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"12px 0" }}>
              <Badge>1 credit per edit</Badge>
              <Badge color="#15803d" bg="#f0fdf4">Mask Editor</Badge>
            </div>
            <Step n={1} title="Upload your image">Upload the image you want to edit.</Step>
            <Step n={2} title="Paint the mask">Use the brush tool to paint over the area you want to change. Painted areas = areas the AI will edit.</Step>
            <Step n={3} title="Describe the replacement">Enter a prompt describing what should appear in the masked area.</Step>
            <Tip>Use a larger brush for rough edits and a smaller brush for precise changes. You can adjust brush size and undo mistakes.</Tip>
          </Section>

          <div style={{ height:1, background:T.border, margin:"0 0 48px" }} />

          <Section id="enhancement" title="Image Enhancement" icon="⬆️">
            <p>Upscale any image to HD, 2K, or 8K Ultra HD using Real-ESRGAN AI neural networks.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"12px 0" }}>
              <Badge>1 credit (2× & 4×)</Badge>
              <Badge color="#7e22ce" bg="#fdf4ff">2 credits (8K)</Badge>
              <Badge color="#c2410c" bg="#fff7ed">ESRGAN Model</Badge>
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", margin:"16px 0" }}>
              {[
                { scale:"2×", label:"HD",        px:"~1080p",  credits:"1 credit",  time:"10–20s" },
                { scale:"4×", label:"2K",        px:"~2048px", credits:"1 credit",  time:"15–30s" },
                { scale:"8×", label:"8K Ultra",  px:"~7680px", credits:"2 credits", time:"60–80s" },
              ].map((r,i) => (
                <div key={r.scale} style={{ display:"flex", gap:16, padding:"11px 16px", background:i%2===0?"transparent":T.bg, fontSize:13 }}>
                  <span style={{ fontWeight:700, color:T.accent, width:28 }}>{r.scale}</span>
                  <span style={{ color:T.text, width:80 }}>{r.label}</span>
                  <span style={{ color:T.muted, flex:1 }}>{r.px}</span>
                  <span style={{ color:T.muted, width:80 }}>{r.credits}</span>
                  <span style={{ color:T.faint }}>{r.time}</span>
                </div>
              ))}
            </div>
            <Tip>8K mode runs two AI passes. Keep your input image under 1024×1024px for maximum output quality and speed.</Tip>
          </Section>

          <div style={{ height:1, background:T.border, margin:"0 0 48px" }} />

          <Section id="credits" title="Credits & Billing" icon="💳">
            <p>Credits are the currency of ImageGen. Each AI operation costs a small number of credits.</p>
            <Step n={1} title="Free credits">Every new account receives 10 free credits. No credit card required.</Step>
            <Step n={2} title="Buy more credits">Purchase credit packs or subscribe to a monthly plan from the Pricing page.</Step>
            <Step n={3} title="Check your balance">Your current credit balance is always shown in the top-right user menu.</Step>
            <Tip>Credits never expire on paid plans. Free credits expire after 30 days of inactivity.</Tip>
          </Section>

          <div style={{ height:1, background:T.border, margin:"0 0 48px" }} />

          <Section id="api" title="API Reference" icon="⚡">
            <p>ImageGen provides a RESTful API so you can integrate AI image generation into your own apps.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"12px 0" }}>
              <Badge>Bearer Auth</Badge>
              <Badge color="#0369a1" bg="#f0f9ff">JSON + multipart</Badge>
            </div>
            <h4 style={{ color:T.text, marginTop:16, marginBottom:8 }}>Base URL</h4>
            <Code>{`http://localhost:5000/api/v1`}</Code>
            <h4 style={{ color:T.text, marginTop:20, marginBottom:8 }}>Authentication</h4>
            <Code>{`Authorization: Bearer <your_jwt_token>`}</Code>
            <h4 style={{ color:T.text, marginTop:20, marginBottom:8 }}>Generate image from text</h4>
            <Code>{`POST /generate/text
Content-Type: application/json

{
  "prompt": "a golden retriever in a forest",
  "ratio": "1:1",
  "style": "Photorealistic"
}`}</Code>
            <h4 style={{ color:T.text, marginTop:20, marginBottom:8 }}>Enhance an image</h4>
            <Code>{`POST /generate/enhance
Content-Type: multipart/form-data

image: <file>
scaleFactor: 4   // 2 | 4 | 8`}</Code>
            <Tip>Full API documentation with all endpoints, request/response schemas, and error codes coming soon.</Tip>
          </Section>

        </div>
      </div>
    </div>
  );
}