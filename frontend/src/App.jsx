import { useState, useEffect } from 'react'
import Landing from './components/Landing'
import ModePicker from './components/ModePicker'
import TextToImage from './components/TextToImage'
import ImageToImage from './components/ImageToImage'
import Inpainting from './components/Inpainting'
import ImageEnhancement from './components/ImageEnhancement'
import Gallery from './components/Gallery'
import Pricing from './components/Pricing'
import Docs from './components/Docs'
import LoginModal from './components/LoginModal'
import { DashboardNavbar, LandingNavbar } from './components/Navbar'
import MobileTabBar from './components/MobileTabBar'
import api from './services/api'

export default function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('imagegen_token')
    if (!token) return
    api.auth.getMe()
      .then(data => { setUser(data.user); setPage('mode-picker') })
      .catch(() => localStorage.removeItem('imagegen_token'))
  }, [])

  const navigate = (p) => setPage(p)

  const handleNavLink = (link) => {
    const map = { Modes: 'mode-picker', Gallery: 'gallery', Pricing: 'pricing', Docs: 'docs' }
    if (map[link]) navigate(map[link])
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setShowLogin(false)
    navigate('mode-picker')
  }

  const handleLogout = () => {
    localStorage.removeItem('imagegen_token')
    setUser(null)
    navigate('landing')
  }

  const subPages = ['text-to-image', 'image-to-image', 'inpainting', 'enhancement']
  const isSubPage = subPages.includes(page)
  const isLanding = page === 'landing'

  return (
    <div style={{ minHeight: '100dvh', background: isLanding ? 'var(--cream)' : 'var(--bg0)', color: isLanding ? 'var(--ink)' : 'var(--text1)' }}>

      {/* Navbar */}
      {isLanding ? (
        <LandingNavbar
          onNavLink={handleNavLink}
          onGetStarted={() => setShowLogin(true)}
        />
      ) : (
        <DashboardNavbar
          user={user}
          currentPage={page}
          showBack={isSubPage}
          onBack={() => navigate('mode-picker')}
          onNavLink={handleNavLink}
          onLogoClick={() => navigate('mode-picker')}
          onLogout={handleLogout}
          onUpdateUser={setUser}
        />
      )}

      {/* Pages */}
      {page === 'landing' && (
        <Landing onGetStarted={() => setShowLogin(true)} />
      )}
      {page === 'mode-picker' && (
        <ModePicker
          onTextToImage={() => navigate('text-to-image')}
          onImageToImage={() => navigate('image-to-image')}
          onInpainting={() => navigate('inpainting')}
          onEnhancement={() => navigate('enhancement')}
        />
      )}
      {page === 'text-to-image' && (
        <TextToImage user={user} onUpdateUser={setUser} />
      )}
      {page === 'image-to-image' && (
        <ImageToImage user={user} onUpdateUser={setUser} />
      )}
      {page === 'inpainting' && (
        <Inpainting user={user} onUpdateUser={setUser} />
      )}
      {page === 'enhancement' && (
        <ImageEnhancement user={user} onUpdateUser={setUser} />
      )}
      {page === 'gallery' && (
        <Gallery user={user} />
      )}
      {page === 'pricing' && (
        <Pricing user={user} onUpdateUser={setUser} />
      )}
      {page === 'docs' && (
        <Docs />
      )}

      {/* Mobile bottom tab bar — hidden on desktop via CSS */}
      {user && (
        <MobileTabBar
          currentPage={page}
          onNavigate={navigate}
        />
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

    </div>
  )
}