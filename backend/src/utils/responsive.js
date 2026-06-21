// ============================================================
// ImageGen — Mobile Responsive Helpers
// frontend/src/utils/responsive.js
//
// Usage:
//   import { useIsMobile, genLayout, modeGrid } from './utils/responsive'
//
//   const isMobile = useIsMobile()
//   <div style={genLayout(isMobile)}>...</div>
// ============================================================

import { useState, useEffect } from 'react'

// ── Hook ──────────────────────────────────────────────────────
/** Returns true when viewport width ≤ 768px */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= breakpoint
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

/** Returns true when viewport width ≤ 480px (small phone) */
export function useIsSmallPhone() {
  return useIsMobile(480)
}

// ── Layout Helpers ─────────────────────────────────────────────

/** Two-column desktop → single-column mobile layout for gen pages */
export const genLayout = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
  gap: isMobile ? 12 : 20,
  padding: isMobile ? 12 : 20,
  alignItems: 'start',
})

/** 2×2 mode-picker grid, stacks to 1-col on very small phones */
export const modeGrid = (isSmall) => ({
  display: 'grid',
  gridTemplateColumns: isSmall ? '1fr' : 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  padding: 16,
})

/** 3-column pricing → 1-column on mobile */
export const pricingGrid = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
  gap: 20,
  padding: 20,
  maxWidth: isMobile ? 360 : 'none',
  margin: isMobile ? '0 auto' : undefined,
})

/** Docs sidebar + content → stacked on mobile */
export const docsLayout = (isMobile) => ({
  display: isMobile ? 'block' : 'grid',
  gridTemplateColumns: isMobile ? undefined : '240px 1fr',
})

/** Horizontal chip/scroll row — works everywhere */
export const chipRow = {
  display: 'flex',
  gap: 6,
  overflowX: 'auto',
  paddingBottom: 4,
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
  scrollSnapType: 'x mandatory',
}

/** Individual chip */
export const chip = (active, activeStyle = {}) => ({
  flexShrink: 0,
  scrollSnapAlign: 'start',
  fontSize: 13,
  padding: '6px 12px',
  borderRadius: 999,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  ...(active ? activeStyle : {}),
})

/** Scale buttons (2×/4×/8×) — always 3-col */
export const scaleGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
}

/** Gallery grid — auto-fill responsive */
export const galleryGrid = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile
    ? 'repeat(2, minmax(0, 1fr))'
    : 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: isMobile ? 8 : 12,
  padding: isMobile ? '0 12px 32px' : '0 20px 32px',
})

// ── Component Style Objects ────────────────────────────────────

/** Sticky navbar — handles safe-area insets */
export const navbarStyle = (extraStyles = {}) => ({
  height: 60,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  flexWrap: 'nowrap',
  ...extraStyles,
})

/** Nav links center section */
export const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'clamp(4px, 2vw, 24px)',
  flex: 1,
  justifyContent: 'center',
  overflow: 'hidden',
}

/** Upload / drop zone */
export const uploadBox = (isMobile) => ({
  width: '100%',
  minHeight: isMobile ? 140 : 220,
  borderRadius: 12,
  border: '2px dashed',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  padding: 16,
  textAlign: 'center',
})

/** Image output box — always 1:1 */
export const outputImageWrap = {
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/** Modal overlay */
export const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
}

/** Modal box */
export const modalBox = (maxWidth = 560) => ({
  width: '100%',
  maxWidth,
  maxHeight: '90dvh',
  borderRadius: 16,
  overflowY: 'auto',
  padding: 20,
  position: 'relative',
})

/** Primary full-width button */
export const btnPrimary = {
  width: '100%',
  minHeight: 44,
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 8,
  cursor: 'pointer',
  border: 'none',
}

/** Before/After comparison row */
export const beforeAfterGrid = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
  gap: 8,
})

// ── Docs sidebar helpers ────────────────────────────────────────

export const docsSidebar = (isMobile) =>
  isMobile
    ? {
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '10px 12px',
        scrollbarWidth: 'none',
        borderBottom: '1px solid',
        position: 'static',
      }
    : {
        position: 'sticky',
        top: 60,
        height: 'calc(100dvh - 60px)',
        overflowY: 'auto',
        padding: '20px 16px',
        borderRight: '1px solid',
        width: 240,
        flexShrink: 0,
      }

export const docsSidebarItem = (active, isMobile) =>
  isMobile
    ? {
        flexShrink: 0,
        fontSize: 13,
        padding: '6px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        minHeight: 36,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        borderBottom: active ? '2px solid orange' : '2px solid transparent',
        fontWeight: active ? 600 : 400,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        cursor: 'pointer',
        minHeight: 44,
        borderLeft: active ? '3px solid orange' : '3px solid transparent',
        fontWeight: active ? 600 : 400,
      }