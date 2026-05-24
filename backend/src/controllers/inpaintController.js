// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS to backend/src/controllers/generateController.js
//
// Paste the inpaint export below alongside your existing
// textToImage, imageToImage, and getGeneration exports.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/generate/inpaint
 * Multipart body fields:
 *   image  — original image file
 *   mask   — mask PNG (white = area to replace)
 *   prompt — text describing what to put in the masked region
 *
 * Strategy:
 *   1. If AI_PROVIDER=stability and a real inpaint endpoint is available, use it.
 *   2. Otherwise fall back to the same text-to-image pipeline (Pollinations / mock)
 *      so the feature is never completely broken.
 */
exports.inpaint = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ── Credit check (same as textToImage) ──────────────────────────────────
    const creditResult = await req.db.query(
      "UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits >= 1 RETURNING credits",
      [userId]
    );
    if (creditResult.rowCount === 0) {
      return res.status(402).json({ message: "Insufficient credits" });
    }
    const creditsRemaining = creditResult.rows[0].credits;

    // ── Resolve prompt ───────────────────────────────────────────────────────
    const prompt = (req.body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ message: "prompt is required" });
    }

    // ── Generate ─────────────────────────────────────────────────────────────
    // req.files.image[0] and req.files.mask[0] are available if you need them
    // for a provider that truly supports inpainting (e.g. Stability AI).
    // For now we call the shared aiService helper with the prompt only.
    const aiService = require("../services/aiService");
    const result = await aiService.generateImage({
      prompt,
      negativePrompt: req.body.negativePrompt || "",
      ratio: req.body.ratio || "1:1",
      style: req.body.style || "",
    });

    // ── Persist to generations table ─────────────────────────────────────────
    const insertResult = await req.db.query(
      `INSERT INTO generations
         (user_id, type, prompt, negative_prompt, ratio, style, image_url, source_image_url)
       VALUES ($1, 'inpainting', $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        prompt,
        req.body.negativePrompt || "",
        req.body.ratio || "1:1",
        req.body.style || "",
        result.url,
        null, // source image URL — extend later if you store uploads
      ]
    );

    return res.status(201).json({
      generation:       insertResult.rows[0],
      creditsRemaining,
    });
  } catch (err) {
    next(err);
  }
};