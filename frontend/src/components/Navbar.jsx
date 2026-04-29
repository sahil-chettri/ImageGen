import { useNavigate } from 'react-router-dom'

const LogoIcon = () => (
  <div className="navbar-logo-icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
    </svg>
  </div>
)

const Icon = ({ path, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={path} />
  </svg>
)

/* ── Landing Navbar ── */
export function LandingNavbar({ onSignIn }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <LogoIcon />
        <span className="navbar-logo-text">ImageGen</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {['Features', 'Pricing', 'Gallery', 'Docs'].map(l => (
          <span key={l} style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color .18s' }}
            onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            {l}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn-ghost" onClick={onSignIn} style={{ padding: '7px 18px', fontSize: 12 }}>Sign in</button>
        <button className="btn-primary" onClick={onSignIn} style={{ padding: '7px 18px', fontSize: 12 }}>Get started</button>
      </div>
    </nav>
  )
}

/* ── Dashboard Navbar ── */
export function DashboardNavbar({ active, setActive }) {
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', path: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { label: 'Generate',  path: 'M12 2l3 7h7l-6 5 2 7-6-4-6 4 2-7-6-5h7z' },
    { label: 'Gallery',   path: 'M3 3h18v18H3zM8.5 8.5m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0M21 15l-5-5L5 21' },
    { label: 'Buy Credits', path: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v4m0 4h.01' },
    { label: 'Profile',   path: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  ]

  return (
    <nav style={{ display: 'flex', alignItems: 'center', height: 52, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="navbar-logo" style={{ padding: '0 18px', borderRight: '1px solid var(--border)', height: '100%', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <LogoIcon />
        <span className="navbar-logo-text" style={{ fontSize: 15 }}>ImageGen</span>
      </div>

      <div className="dash-tabs">
        {navItems.map(n => (
          <button key={n.label} className={`dash-tab${active === n.label ? ' active' : ''}`} onClick={() => setActive(n.label)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={n.path}/></svg>
            {n.label}
          </button>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, paddingRight: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, border: '1px solid var(--accent-border)', background: 'var(--accent-dim)', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
          120 credits
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>U</div>
      </div>
    </nav>
  )
}

export default DashboardNavbar