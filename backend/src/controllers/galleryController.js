import pool from "../db.js";

/**
 * GET /api/v1/gallery
 * Returns all generations for the logged-in user, newest first.
 */
export async function getGallery(req, res, next) {
  try {
    const userId = req.user.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT
         id,
         user_id,
         type,
         prompt,
         image_url,
         style,
         ratio,
         provider,
         created_at
       FROM generations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Count total for pagination
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM generations WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countRows[0]?.total || 0);

    return res.json({
      success: true,
      generations: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/gallery/:id
 * Deletes a generation owned by the logged-in user.
 */
export async function deleteGeneration(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM generations WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: "Image not found." });
    }

    return res.json({ success: true, message: "Image deleted." });
  } catch (err) {
    next(err);
  }
}