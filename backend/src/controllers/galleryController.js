import { generations } from '../db.js';

/** GET /api/v1/gallery */
export function getGallery(req, res) {
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
  const type  = req.query.type; // optional filter: 'text-to-image' | 'image-to-image'

  let items = [...generations.values()]
    .filter(g => g.userId === req.user.id)
    .filter(g => type ? g.type === type : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = items.length;
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);

  res.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** GET /api/v1/gallery/:id */
export function getGalleryItem(req, res) {
  const gen = generations.get(req.params.id);
  if (!gen || gen.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  res.json({ success: true, generation: gen });
}

/** DELETE /api/v1/gallery/:id */
export function deleteGalleryItem(req, res) {
  const gen = generations.get(req.params.id);
  if (!gen || gen.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  generations.delete(req.params.id);
  res.json({ success: true, message: 'Generation deleted' });
}