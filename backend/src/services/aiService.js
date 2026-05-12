import fs   from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(__dirname, '../../generated');
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const cache    = new Map();

const stylePrompts = {
  'Photorealistic': 'photorealistic, 8k, ultra detailed, professional photography',
  'Anime':          'anime style, vibrant colors, detailed illustration',
  'Oil Painting':   'oil painting style, textured brushstrokes, artistic',
  'Sketch':         'pencil sketch, detailed linework, artistic drawing',
  '3D Render':      '3D render, octane render, highly detailed, studio lighting',
  'Cinematic':      'cinematic lighting, film grain, dramatic shadows, movie still',
  'Neon':           'neon lights, cyberpunk, glowing neon colors, futuristic city night',
  'Watercolor':     'watercolor painting, soft colors, artistic brushstrokes',
  'Oil Paint':      'oil painting, thick brushstrokes, textured canvas, classical art',
};

const styleModelMap = {
  'Photorealistic': 'flux-realism',
  'Anime':          'flux-anime',
  'Oil Painting':   'flux',
  'Sketch':         'flux',
  '3D Render':      'flux',
  'None':           'flux',
};

const dimensions = {
  '1:1':  { width: 512,  height: 512  },
  '16:9': { width: 768,  height: 432  },
  '9:16': { width: 432,  height: 768  },
  '4:3':  { width: 640,  height: 480  },
  '3:2':  { width: 768,  height: 512  },
};

/* ── Stability AI: text-to-image ─────────────────────────────────────────── */
async function generateWithStability({ prompt, negativePrompt = '', ratio, style }) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is not set in .env');

  const enhancedPrompt = style && stylePrompts[style] ? `${prompt}, ${stylePrompts[style]}` : prompt;
  const { width, height } = dimensions[ratio] || dimensions['1:1'];

  console.log(`[Stability] Generating | ${width}x${height} | style: ${style}`);

  const formData = new FormData();
  formData.append('prompt',        enhancedPrompt);
  formData.append('output_format', 'png');
  formData.append('aspect_ratio',
    ratio === '1:1'  ? '1:1'  :
    ratio === '16:9' ? '16:9' :
    ratio === '9:16' ? '9:16' :
    ratio === '4:3'  ? '4:3'  : '1:1'
  );
  if (negativePrompt) formData.append('negative_prompt', negativePrompt);

  const response = await fetch(
    'https://api.stability.ai/v2beta/stable-image/generate/core',
    { method: 'POST', headers: { Authorization: `Bearer ${STABILITY_API_KEY}`, Accept: 'image/*' }, body: formData }
  );
  if (!response.ok) throw new Error(`Stability AI error ${response.status}: ${await response.text()}`);

  const arrayBuffer = await response.arrayBuffer();
  const filename    = 'stability-' + Date.now() + '.png';
  fs.writeFileSync(path.join(generatedDir, filename), Buffer.from(arrayBuffer));
  console.log(`[Stability] Saved: ${filename}`);
  return { imageUrl: `${BASE_URL}/generated/${filename}`, provider: 'stability', width, height };
}

/* ── Stability AI: inpainting ────────────────────────────────────────────── */
async function inpaintWithStability({ imageFile, maskFile, prompt, negativePrompt = '' }) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is not set in .env');

  console.log('[Stability] Running inpainting...');

  const imageBuffer = fs.readFileSync(imageFile.path);
  const maskBuffer  = fs.readFileSync(maskFile.path);

  const formData = new FormData();
  formData.append('image',         new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
  formData.append('mask',          new Blob([maskBuffer],  { type: 'image/png' }), 'mask.png');
  formData.append('prompt',        prompt);
  formData.append('output_format', 'png');
  formData.append('grow_mask',     '5');
  if (negativePrompt) formData.append('negative_prompt', negativePrompt);

  const response = await fetch(
    'https://api.stability.ai/v2beta/stable-image/edit/inpaint',
    { method: 'POST', headers: { Authorization: `Bearer ${STABILITY_API_KEY}`, Accept: 'image/*' }, body: formData }
  );
  if (!response.ok) throw new Error(`Stability inpainting error ${response.status}: ${await response.text()}`);

  const arrayBuffer = await response.arrayBuffer();
  const filename    = 'inpaint-' + Date.now() + '.png';
  fs.writeFileSync(path.join(generatedDir, filename), Buffer.from(arrayBuffer));
  console.log(`[Stability] Inpaint saved: ${filename}`);
  return { imageUrl: `${BASE_URL}/generated/${filename}`, provider: 'stability-inpaint' };
}

/* ── Pollinations: text-to-image ─────────────────────────────────────────── */
async function generateWithPollinations({ prompt, ratio, style }) {
  const { width, height } = dimensions[ratio] || dimensions['1:1'];

  const cacheKey = `${prompt}-${ratio}-${style}`;
  if (cache.has(cacheKey)) {
    console.log('[Pollinations] Cache hit!');
    return cache.get(cacheKey);
  }

  const seed           = Math.floor(Math.random() * 1_000_000);
  const model          = styleModelMap[style] || 'flux';
  const enhancedPrompt = style && stylePrompts[style] ? `${prompt}, ${stylePrompts[style]}` : prompt;
  const encoded        = encodeURIComponent(enhancedPrompt);
  const url            = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}`;

  console.log(`[Pollinations] Model: ${model} | Size: ${width}x${height}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error('Pollinations failed: ' + response.status);

  const arrayBuffer = await response.arrayBuffer();
  const filename    = 'pollinations-' + Date.now() + '.png';
  const filePath    = path.join(generatedDir, filename);
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  const result = { imageUrl: `${BASE_URL}/generated/${filename}`, provider: 'pollinations', width, height };
  cache.set(cacheKey, result);
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  return result;
}

/* ── Pollinations: inpainting fallback ───────────────────────────────────── */
/**
 * True inpainting requires a dedicated model.
 * Strategy for Pollinations (free tier):
 *   1. Generate the fill content as a text-to-image with Pollinations.
 *   2. Composite it onto the original image using the B&W mask with sharp.
 *   3. If sharp is unavailable, return just the generated fill image.
 */
async function inpaintWithPollinationsFallback({ imageFile, maskFile, prompt, ratio }) {
  console.log('[Inpainting] Pollinations fallback: generating fill content...');

  // Step 1: generate fill region
  const fillResult = await generateWithPollinations({ prompt, ratio: ratio || '1:1', style: 'Photorealistic' });
  const fillPath   = path.join(generatedDir, path.basename(new URL(fillResult.imageUrl).pathname));

  // Step 2: try to composite with sharp
  try {
    const sharp = (await import('sharp')).default;

    const origMeta    = await sharp(imageFile.path).metadata();
    const { width, height } = origMeta;

    // Resize both fill and mask to original image dimensions
    const [origRGBA, fillRGBA, maskGrey] = await Promise.all([
      sharp(imageFile.path).resize(width, height).ensureAlpha().raw().toBuffer(),
      sharp(fillPath).resize(width, height, { fit: 'cover' }).ensureAlpha().raw().toBuffer(),
      sharp(maskFile.path).resize(width, height, { fit: 'fill' }).greyscale().raw().toBuffer(),
    ]);

    // Pixel-level composite: where mask=white (255) use fill, else use original
    const composite = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const m = maskGrey[i] / 255; // 0 = keep original, 1 = use fill
      composite[i * 4]     = Math.round(origRGBA[i * 4]     * (1 - m) + fillRGBA[i * 4]     * m);
      composite[i * 4 + 1] = Math.round(origRGBA[i * 4 + 1] * (1 - m) + fillRGBA[i * 4 + 1] * m);
      composite[i * 4 + 2] = Math.round(origRGBA[i * 4 + 2] * (1 - m) + fillRGBA[i * 4 + 2] * m);
      composite[i * 4 + 3] = 255;
    }

    const filename = 'inpaint-' + Date.now() + '.png';
    const outPath  = path.join(generatedDir, filename);
    await sharp(composite, { raw: { width, height, channels: 4 } }).png().toFile(outPath);

    console.log(`[Inpainting] Composite saved: ${filename}`);
    return { imageUrl: `${BASE_URL}/generated/${filename}`, provider: 'pollinations+composite' };

  } catch (sharpErr) {
    // sharp not installed — return the generated fill image as-is
    console.warn('[Inpainting] sharp not available, returning fill image:', sharpErr.message);
    console.warn('[Inpainting] Run: npm install sharp   to enable proper compositing.');
    return { imageUrl: fillResult.imageUrl, provider: 'pollinations-fill-only' };
  }
}

/* ── Mock ─────────────────────────────────────────────────────────────────── */
async function generateWithMock({ ratio }) {
  const { width, height } = dimensions[ratio] || dimensions['1:1'];
  await new Promise(r => setTimeout(r, 1500));
  const seed = Math.floor(Math.random() * 1000);
  return { imageUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`, provider: 'mock', width, height };
}

/* ── Public exports ──────────────────────────────────────────────────────── */
export async function generateImage(params) {
  const provider = process.env.AI_PROVIDER || 'pollinations';
  console.log(`[AI] Provider: ${provider}`);
  if (provider === 'stability')    return generateWithStability(params);
  if (provider === 'pollinations') return generateWithPollinations(params);
  return generateWithMock(params);
}

export async function transformImage(params) {
  return generateImage({
    ...params,
    prompt: `${params.prompt}, inspired by uploaded image style`,
  });
}

export async function inpaintImage(params) {
  const provider = process.env.AI_PROVIDER || 'pollinations';
  console.log(`[AI] Inpainting with provider: ${provider}`);

  if (provider === 'stability') return inpaintWithStability(params);
  if (provider === 'mock')      return generateWithMock(params);
  return inpaintWithPollinationsFallback(params);
}