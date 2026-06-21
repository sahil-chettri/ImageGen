import { useState, useRef } from 'react'
import { useIsMobile } from '../utils/responsive'

const SECTIONS = [
  { id: 'getting-started', label: '🚀 Getting Started' },
  { id: 'text-to-image', label: '✦ Text to Image' },
  { id: 'image-to-image', label: '🔄 Image to Image' },
  { id: 'inpainting', label: '🖌️ Inpainting' },
  { id: 'enhancement', label: '⬆️ Enhancement' },
  { id: 'credits', label: '💳 Credits' },
  { id: 'api-reference', label: '📡 API Reference' },
]

export default function Docs() {
  const isMobile = useIsMobile()
  const [active, setActive] = useState('getting-started')
  const contentRef = useRef()

  const scrollTo = (id) => {
    setActive(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="docs-layout">
      {/* Sidebar */}
      <nav
        className="docs-sidebar"
        aria-label="Docs navigation"
      >
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`docs-sidebar-item${active === s.id ? ' active' : ''}`}
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="docs-content" ref={contentRef}>

        <section id="getting-started" className="docs-section">
          <h2>Getting Started</h2>
          <p>ImageGen is an AI image studio. Sign up to get 10 free credits, then pick any of the four AI modes.</p>
          <h3>Quick Start</h3>
          <ol style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>Click <strong style={{ color: 'var(--text1)' }}>Get Started</strong> and create an account.</li>
            <li style={{ marginBottom: 8 }}>Verify your email with the 6-digit OTP sent to your inbox.</li>
            <li style={{ marginBottom: 8 }}>You receive <strong style={{ color: 'var(--accent)' }}>10 free credits</strong> immediately.</li>
            <li style={{ marginBottom: 8 }}>Choose a mode from the Mode Picker and start generating.</li>
          </ol>
          <h3>Connectivity Note</h3>
          <p>If you're in India, <code style={{ background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>api.stability.ai</code> may be blocked by your ISP. Use ProtonVPN or Cloudflare WARP, or set <code style={{ background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>AI_PROVIDER=pollinations</code> in your backend .env.</p>
        </section>

        <section id="text-to-image" className="docs-section">
          <h2>Text to Image</h2>
          <p>Type a description and the AI generates a high-quality image matching your prompt.</p>
          <h3>Steps</h3>
          <ol style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>Select a <strong style={{ color: 'var(--text1)' }}>style</strong> from the chip row (e.g. Photorealistic, Anime, Cinematic).</li>
            <li style={{ marginBottom: 8 }}>Enter your <strong style={{ color: 'var(--text1)' }}>prompt</strong>. Be descriptive — mention subject, lighting, mood.</li>
            <li style={{ marginBottom: 8 }}>Optionally add a <strong style={{ color: 'var(--text1)' }}>negative prompt</strong> to exclude things.</li>
            <li style={{ marginBottom: 8 }}>Choose an <strong style={{ color: 'var(--text1)' }}>aspect ratio</strong>: 1:1, 16:9, or 9:16.</li>
            <li style={{ marginBottom: 8 }}>Optionally use the <strong style={{ color: 'var(--accent)' }}>Prompt Optimizer</strong> (RAG) to improve your prompt.</li>
            <li style={{ marginBottom: 8 }}>Click <strong style={{ color: 'var(--text1)' }}>Generate Image</strong>. Costs 1 credit.</li>
          </ol>
          <h3>Prompt Tips</h3>
          <pre className="docs-code">{`Good:  "A majestic red fox in a snowy forest at golden hour,
        cinematic lighting, bokeh, 4k DSLR"

Poor:  "fox"`}</pre>
        </section>

        <section id="image-to-image" className="docs-section">
          <h2>Image to Image</h2>
          <p>Upload a source image and describe how to transform it. The AI preserves the composition while applying your changes.</p>
          <h3>Steps</h3>
          <ol style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>Choose a <strong style={{ color: 'var(--text1)' }}>style template</strong>.</li>
            <li style={{ marginBottom: 8 }}>Upload your <strong style={{ color: 'var(--text1)' }}>source image</strong> (tap or drag & drop).</li>
            <li style={{ marginBottom: 8 }}>Enter a <strong style={{ color: 'var(--text1)' }}>transformation prompt</strong>.</li>
            <li style={{ marginBottom: 8 }}>Set aspect ratio and click <strong style={{ color: 'var(--text1)' }}>Transform Image</strong>. Costs 1 credit.</li>
          </ol>
          <p>The before/after comparison will appear in the right panel after generation.</p>
        </section>

        <section id="inpainting" className="docs-section">
          <h2>Inpainting</h2>
          <p>Paint a white mask over part of your image and the AI fills that region with new content based on your prompt.</p>
          <h3>Steps</h3>
          <ol style={{ paddingLeft: 20, color: 'var(--text2)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>Upload a source image.</li>
            <li style={{ marginBottom: 8 }}>Use your mouse or finger to paint a white mask over the area to change.</li>
            <li style={{ marginBottom: 8 }}>Adjust brush size with the slider. Use Undo or Clear to fix mistakes.</li>
            <li style={{ marginBottom: 8 }}>Enter a prompt describing what to fill in the masked area.</li>
            <li style={{ marginBottom: 8 }}>Click <strong style={{ color: 'var(--text1)' }}>Generate Inpainting</strong>. Costs 1 credit.</li>
          </ol>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            💡 Touch drawing works on mobile. The canvas tracks both mouse and touch events.
          </p>
        </section>

        <section id="enhancement" className="docs-section">
          <h2>Image Enhancement</h2>
          <p>Upscale any image to HD, 2K, or 8K Ultra HD using AI-powered ESRGAN upscaling.</p>

          <table className="docs-table">
            <thead>
              <tr>
                <th>Scale</th><th>Output</th><th>Time</th><th>Credits</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>2×</td><td>~1080p HD</td><td>~30s</td><td>1</td></tr>
              <tr><td>4×</td><td>~4096px 2K</td><td>~45s</td><td>1</td></tr>
              <tr><td>8×</td><td>~7680px 8K</td><td>~60–80s</td><td>2</td></tr>
            </tbody>
          </table>

          <h3>Notes</h3>
          <ul>
            <li>Images larger than 8 MB are auto-compressed before sending to the AI.</li>
            <li>8K runs two chained AI passes (4×→2×).</li>
            <li>Download filename includes the quality label (HD / 2K / 8K).</li>
          </ul>
        </section>

        <section id="credits" className="docs-section">
          <h2>Credits</h2>
          <p>Credits are deducted atomically — your balance can never go below zero.</p>
          <table className="docs-table">
            <thead><tr><th>Plan</th><th>Credits</th><th>Price</th></tr></thead>
            <tbody>
              <tr><td>Free</td><td>10 on signup</td><td>₹0</td></tr>
              <tr><td>Pro</td><td>500 / month</td><td>₹299/mo</td></tr>
              <tr><td>Ultra</td><td>2000 / month</td><td>₹799/mo</td></tr>
            </tbody>
          </table>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 12 }}>
            Payment gateway integration is planned. Contact support for manual credit top-ups.
          </p>
        </section>

        <section id="api-reference" className="docs-section">
          <h2>API Reference</h2>
          <p>Base URL: <code style={{ background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>http://localhost:5000/api/v1</code></p>

          <h3>Auth</h3>
          <pre className="docs-code">{`POST /auth/register    { name, email, password }
POST /auth/login       { email, password }
POST /auth/verify-otp  { email, otp }
POST /auth/resend-otp  { email }
GET  /auth/me          → { user }   (requires Bearer token)`}</pre>

          <h3>Generate</h3>
          <pre className="docs-code">{`POST /generate/text    { prompt, negativePrompt, ratio, style }
POST /generate/image   multipart: image + prompt fields
POST /generate/inpaint multipart: image + mask + prompt fields
POST /generate/enhance multipart: image + scaleFactor (2|4|8)
GET  /generate/:id     → { generation }`}</pre>

          <h3>Gallery</h3>
          <pre className="docs-code">{`GET    /gallery        ?page=1&limit=12&type=text-to-image
GET    /gallery/:id
DELETE /gallery/:id`}</pre>

          <h3>Credits</h3>
          <pre className="docs-code">{`GET  /credits
GET  /credits/plans
POST /credits/purchase  { plan: "pro" | "ultra" }`}</pre>

          <h3>RAG</h3>
          <pre className="docs-code">{`POST /rag/optimize     { prompt }
POST /rag/search       { query }
POST /rag/suggest
POST /rag/feedback     { promptId, quality }
POST /rag/upload-doc   multipart: file (PDF/TXT)
POST /rag/ask          { question }`}</pre>

          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 12 }}>
            All authenticated endpoints require the header:<br />
            <code style={{ background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>Authorization: Bearer &lt;your_jwt_token&gt;</code>
          </p>
        </section>

      </div>
    </div>
  )
}