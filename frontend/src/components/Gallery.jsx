import { useState, useEffect } from 'react'
import api from '../services/api'

const FILTERS = ['All', 'Text→Image', 'Image→Image', 'Inpainting', 'Enhancement']
const TYPE_MAP = {
  'Text→Image': 'text-to-image',
  'Image→Image': 'image-to-image',
  'Inpainting': 'inpainting',
  'Enhancement': 'enhancement',
}
const PER_PAGE = 12

export default function Gallery({ user }) {
  const [images, setImages] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    fetchGallery()
  }, [filter, page])

  const fetchGallery = async () => {
    setLoading(true)
    try {
      const params = { page, limit: PER_PAGE }
      if (filter !== 'All') params.type = TYPE_MAP[filter]
      const data = await api.gallery.list(params)
      setImages(data.generations || [])
      setTotal(data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1); fetchGallery()
  }

  const handleFilterChange = (f) => { setFilter(f); setPage(1) }

  const filtered = search.trim()
    ? images.filter(img => img.prompt?.toLowerCase().includes(search.toLowerCase()))
    : images

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="gallery-page">
      <h2 className="gallery-title">My Gallery</h2>

      {/* Controls */}
      <div className="gallery-controls">
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 160, display: 'flex' }}>
          <input
            className="gallery-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by prompt..."
          />
        </form>

        <div className="gallery-filter">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => handleFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
          <span className="spinner" style={{ display: 'inline-block', marginBottom: 8 }} />
          <p style={{ fontSize: 13 }}>Loading...</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.length === 0 ? (
            <div className="gallery-empty">
              No images found.{filter !== 'All' && ` Try clearing the filter.`}
            </div>
          ) : (
            filtered.map(img => (
              <div
                key={img.id}
                className="gallery-card"
                onClick={() => setLightbox(img)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setLightbox(img)}
              >
                <img
                  src={img.image_url}
                  alt={img.prompt || 'Generated image'}
                  loading="lazy"
                />
                <div className="gallery-card-overlay">
                  <p className="gallery-card-prompt">{img.prompt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
            return (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            )
          })}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-box" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img
              src={lightbox.image_url}
              alt={lightbox.prompt || 'Generated'}
              className="lightbox-img"
            />
            <div className="lightbox-meta">
              {lightbox.prompt && (
                <p className="lightbox-prompt">{lightbox.prompt}</p>
              )}
              <div className="lightbox-badges">
                {lightbox.type && <span className="meta-badge">{lightbox.type}</span>}
                {lightbox.style && <span className="meta-badge">{lightbox.style}</span>}
                {lightbox.ratio && <span className="meta-badge">{lightbox.ratio}</span>}
                {lightbox.created_at && (
                  <span className="meta-badge">
                    {new Date(lightbox.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                className="btn-download"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = lightbox.image_url
                  a.download = `imagegen-${lightbox.id}.png`
                  a.click()
                }}
              >
                ⬇ Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}