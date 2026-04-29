import { v4 as uuid }               from 'uuid';
import { body, validationResult }   from 'express-validator';
import { users, generations }       from '../db.js';
import { generateImage, transformImage } from '../services/aiService.js';

const VALID_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:2'];
const VALID_STYLES = ['Photorealistic', 'Anime', 'Oil Painting', 'Sketch', '3D Render'];
const CREDIT_COST  = 1;

/* ── Validators ─────────────────────────────────────────────────────────── */
export const textGenValidators = [
  body('prompt').trim().notEmpty().withMessage('Prompt is required').isLength({ max: 1000 }),
  body('negativePrompt').optional().isString().isLength({ max: 500 }),
  body('ratio').optional().isIn(VALID_RATIOS).withMessage(`ratio must be one of: ${VALID_RATIOS.join(', ')}`),
  body('style').optional().isIn(VALID_STYLES).withMessage(`style must be one of: ${VALID_STYLES.join(', ')}`),
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function deductCredits(userId) {
  const user = users.get(userId);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  if (user.credits < CREDIT_COST) {
    throw Object.assign(new Error('Insufficient credits'), { statusCode: 402 });
  }
  user.credits -= CREDIT_COST;
  users.set(userId, user);
  return user.credits;
}

function saveGeneration(data) {
  const gen = { id: uuid(), createdAt: new Date().toISOString(), ...data };
  generations.set(gen.id, gen);
  return gen;
}

/* ── Controllers ─────────────────────────────────────────────────────────── */

/** POST /api/v1/generate/text */
export async function textToImage(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const creditsRemaining = deductCredits(req.user.id);

    const { prompt, negativePrompt = '', ratio = '1:1', style = 'Photorealistic' } = req.body;

    const result = await generateImage({ prompt, negativePrompt, ratio, style });

    const generation = saveGeneration({
      userId:   req.user.id,
      type:     'text-to-image',
      prompt,
      negativePrompt,
      ratio,
      style,
      ...result,
    });

    return res.status(201).json({ success: true, generation, creditsRemaining });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/generate/image  (multipart) */
export async function imageToImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const creditsRemaining = deductCredits(req.user.id);

    const {
      prompt        = 'Transform this image',
      negativePrompt = '',
      ratio          = '1:1',
      style          = 'Photorealistic',
    } = req.body;

    const uploadedImageUrl = `/uploads/${req.file.filename}`;

    const result = await transformImage({ prompt, negativePrompt, ratio, style, uploadedImageUrl });

    const generation = saveGeneration({
      userId:   req.user.id,
      type:     'image-to-image',
      prompt,
      negativePrompt,
      ratio,
      style,
      sourceImageUrl: uploadedImageUrl,
      ...result,
    });

    return res.status(201).json({ success: true, generation, creditsRemaining });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/generate/:id */
export function getGeneration(req, res) {
  const gen = generations.get(req.params.id);
  if (!gen || gen.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Generation not found' });
  }
  res.json({ success: true, generation: gen });
}