import { body, validationResult } from 'express-validator';
import pool                       from '../db.js';
import { generateImage, transformImage } from '../services/aiService.js';

const VALID_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:2'];
const VALID_STYLES = ['Photorealistic', 'Anime', 'Oil Painting', 'Oil Paint', 'Sketch', '3D Render', 'Cinematic', 'Neon', 'Watercolor'];

const CREDIT_COST  = 1;

/* ── Validators ─────────────────────────────────────────────────────────── */
export const textGenValidators = [
  body('prompt').trim().notEmpty().withMessage('Prompt is required').isLength({ max: 1000 }),
  body('negativePrompt').optional().isString().isLength({ max: 500 }),
  body('ratio').optional().isIn(VALID_RATIOS).withMessage(`ratio must be one of: ${VALID_RATIOS.join(', ')}`),
  body('style').optional().isIn(VALID_STYLES).withMessage(`style must be one of: ${VALID_STYLES.join(', ')}`),
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
async function deductCredits(userId) {
  const { rows } = await pool.query(
    `UPDATE users SET credits = credits - $1
     WHERE id = $2 AND credits >= $1
     RETURNING credits`,
    [CREDIT_COST, userId]
  );

  if (!rows.length) {
    const user = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user.rows.length)
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    throw Object.assign(new Error('Insufficient credits'), { statusCode: 402 });
  }

  return rows[0].credits;
}

async function saveGeneration(data) {
  const { rows } = await pool.query(
    `INSERT INTO generations
       (user_id, type, prompt, negative_prompt, ratio, style, image_url, source_image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.userId,
      data.type,
      data.prompt,
      data.negativePrompt  || '',
      data.ratio           || '1:1',
      data.style           || 'Photorealistic',
      data.imageUrl        || null,
      data.sourceImageUrl  || null,
    ]
  );
  return rows[0];
}

/* ── Controllers ─────────────────────────────────────────────────────────── */

/** POST /api/v1/generate/text */
export async function textToImage(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const creditsRemaining = await deductCredits(req.user.id);
    const { prompt, negativePrompt = '', ratio = '1:1', style = 'Photorealistic' } = req.body;

    const result = await generateImage({ prompt, negativePrompt, ratio, style });

    const generation = await saveGeneration({
      userId: req.user.id,
      type:   'text-to-image',
      prompt, negativePrompt, ratio, style,
      ...result,
    });

    return res.status(201).json({ success: true, generation, creditsRemaining });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/generate/image (multipart) */
export async function imageToImage(req, res, next) {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'Image file is required' });

    const creditsRemaining = await deductCredits(req.user.id);
    const { prompt = 'Transform this image', negativePrompt = '', ratio = '1:1', style = 'Photorealistic' } = req.body;
    const sourceImageUrl = `/uploads/${req.file.filename}`;

    const result = await transformImage({ prompt, negativePrompt, ratio, style, uploadedImageUrl: sourceImageUrl });

    const generation = await saveGeneration({
      userId: req.user.id,
      type:   'image-to-image',
      prompt, negativePrompt, ratio, style,
      sourceImageUrl,
      ...result,
    });

    return res.status(201).json({ success: true, generation, creditsRemaining });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/generate/:id */
export async function getGeneration(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM generations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Generation not found' });

    res.json({ success: true, generation: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}