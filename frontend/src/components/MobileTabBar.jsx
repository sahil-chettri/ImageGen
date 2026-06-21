/**
 * MobileTabBar.jsx
 * 
 * Bottom tab bar for mobile (≤767px). Mirrors the Navbar links.
 * Desktop: invisible (CSS display:none above 767px).
 * 
 * USAGE — drop into App.jsx inside your authenticated shell:
 * 
 *   import MobileTabBar from './components/MobileTabBar';
 *   
 *   // Inside your render, after <DashboardNavbar ...>:
 *   <MobileTabBar currentPage={page} onNavigate={navigate} />
 * 
 * Props:
 *   currentPage  (string) — current App state, e.g. "mode-picker", "gallery"
 *   onNavigate   (fn)     — same navigate() you pass to Navbar
 */

const TABS = [
  {
    label: 'Modes',
    icon: '✦',
    pages: ['mode-picker', 'text-to-image', 'image-to-image', 'inpainting', 'enhancement'],
    target: 'mode-picker',
  },
  {
    label: 'Gallery',
    icon: '⊞',
    pages: ['gallery'],
    target: 'gallery',
  },
  {
    label: 'Pricing',
    icon: '◈',
    pages: ['pricing'],
    target: 'pricing',
  },
  {
    label: 'Docs',
    icon: '≡',
    pages: ['docs'],
    target: 'docs',
  },
];

export default function MobileTabBar({ currentPage, onNavigate }) {
  return (
    <nav className="imagegen-tab-bar" aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = tab.pages.includes(currentPage);
        return (
          <button
            key={tab.label}
            className={`imagegen-tab-bar__item${isActive ? ' imagegen-tab-bar__item--active' : ''}`}
            onClick={() => onNavigate(tab.target)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
          >
            <span className="imagegen-tab-bar__icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="imagegen-tab-bar__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}