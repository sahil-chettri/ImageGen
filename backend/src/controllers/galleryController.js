import pool from '../db.js';

export async function getGallery(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const type  = req.query.type;
    const offset = (page - 1) * limit;

    const conditions = ['user_id = $1'];
    const params     = [req.user.id];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM generations WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM generations WHERE ${where}`, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    res.json({ success: true, data: dataResult.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getGalleryItem(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM generations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, generation: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function deleteGalleryItem(req, res) {
  try {
    const { rows } = await pool.query(
      'DELETE FROM generations WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Generation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
