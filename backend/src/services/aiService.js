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

/* ── Stability AI: single upscale pass (internal helper) ────────────────── */
/**
 * Runs ONE creative upscale pass via Stability AI v2beta.
 * Used directly for 2× and 4×, and called twice for 8× (chained).
 *
 * Endpoint : POST https://api.stability.ai/v2beta/stable-image/upscale/creative
 * Flow     : async — submit job → poll every 3 s → download when ready
 * Cost     : 25 Stability platform credits per call
 *
 * @param {string}  apiKey
 * @param {string}  imagePath   - absolute path to source image on disk
 * @param {string}  originalname
 * @param {number}  [creativity=0.35]  - 0–1, how much new detail to invent
 * @param {string}  [suffix]    - appended to saved filename for traceability
 * @returns {{ filename: string, arrayBuffer: ArrayBuffer }}
 */
async function runOneUpscalePass(apiKey, imagePath, originalname, creativity = 0.35, suffix = '') {
  let imageBuffer = fs.readFileSync(imagePath);

  // Stability AI hard limit: 10 MiB payload — compress if needed
  const MAX_BYTES = 8 * 1024 * 1024; // 8 MB safe threshold
  if (imageBuffer.byteLength > MAX_BYTES) {
    console.log(`[Stability] Image is ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)} MB — compressing before upload...`);
    try {
      const sharp = (await import('sharp')).default;
      imageBuffer = await sharp(imageBuffer)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      console.log(`[Stability] Compressed to ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
    } catch (sharpErr) {
      console.warn('[Stability] sharp not available:', sharpErr.message);
      throw new Error('Image is too large for Stability AI (>8 MB). Run: npm install sharp');
    }
  }

  const ext      = path.extname(originalname || imagePath).toLowerCase();
  const mimeType = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg'
                 : ext === '.webp'                     ? 'image/webp'
                 : 'image/png';

  const formData = new FormData();
  formData.append('image',         new Blob([imageBuffer], { type: mimeType }), 'image' + (ext || '.png'));
  formData.append('prompt',        'ultra sharp, photorealistic, 8k resolution, fine detail, masterpiece quality, lossless');
  formData.append('output_format', 'png');
  formData.append('creativity',    String(creativity));

  console.log(`[Stability] Submitting upscale pass (creativity=${creativity})…`);

  const submitRes = await fetch(
    'https://api.stability.ai/v2beta/stable-image/upscale/creative',
    {
      method:  'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        Accept:        'application/json',
      },
      body: formData,
    }
  );

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error('Stability upscale submit error ' + submitRes.status + ': ' + errText);
  }

  const { id } = await submitRes.json();
  if (!id) throw new Error('Stability creative upscale did not return a job ID');
  console.log('[Stability] Job ID:', id, '— polling…');

  // Poll for up to 180 s (8× needs two passes so give each pass more headroom)
  const pollUrl = 'https://api.stability.ai/v2beta/stable-image/upscale/creative/result/' + id;
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));

    const pollRes = await fetch(pollUrl, {
      headers: {
        Authorization: 'Bearer ' + apiKey,
        Accept:        'image/*',
      },
    });

    if (pollRes.status === 202) {
      console.log('[Stability] Still processing…');
      continue;
    }

    if (!pollRes.ok) {
      const errText = await pollRes.text();
      throw new Error('Stability poll error ' + pollRes.status + ': ' + errText);
    }

    // 200 — image ready
    const arrayBuffer = await pollRes.arrayBuffer();
    const filename    = `enhanced-stability${suffix}-` + Date.now() + '.png';
    fs.writeFileSync(path.join(generatedDir, filename), Buffer.from(arrayBuffer));
    console.log('[Stability] Pass saved:', filename);
    return { filename, arrayBuffer };
  }

  throw new Error('Stability upscale pass timed out after 180 seconds');
}

/* ── Stability AI: image enhancement / upscale ──────────────────────────── */
/**
 * Public enhancement function supporting 2×, 4×, and 8× upscaling.
 *
 *  2× → 1 pass, creativity 0.30  → ~1080p HD
 *  4× → 1 pass, creativity 0.35  → ~2K / 2048px
 *  8× → 2 chained passes (4× then 2×), creativity 0.45 / 0.30 → true ~8K
 *
 * The 8× pipeline:
 *   Pass 1: source image → 4× upscale (creativity 0.45 for maximum detail recovery)
 *   Pass 2: 4× result   → 2× upscale (creativity 0.30 to refine without over-generating)
 *   Result: ~8× total resolution increase
 *
 * @param {object} params
 * @param {{ path: string, originalname?: string }} params.imageFile
 * @param {number} [params.scaleFactor=4]   — 2 | 4 | 8
 */
async function enhanceWithStability({ imageFile, scaleFactor = 4 }) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is not set in .env');

  const scale = Number(scaleFactor) || 4;
  console.log(`[Stability] enhanceWithStability | scale: ${scale}×`);

  /* ── 8× : two-pass chained upscale ─────────────────────────────────── */
  if (scale >= 8) {
    console.log('[Stability] 8K mode: running Pass 1 (4× creative, creativity=0.45)…');

    // Pass 1: 4× with higher creativity to recover maximum detail from source
    const pass1 = await runOneUpscalePass(
      STABILITY_API_KEY,
      imageFile.path,
      imageFile.originalname || imageFile.path,
      0.45,
      '-8k-pass1'
    );

    console.log('[Stability] 8K mode: running Pass 2 (2× refinement, creativity=0.30)…');

    // Pass 2: another upscale pass on the 4× result to push to ~8K
    const pass1Path = path.join(generatedDir, pass1.filename);
    const pass2 = await runOneUpscalePass(
      STABILITY_API_KEY,
      pass1Path,
      pass1.filename,
      0.30,
      '-8k-pass2'
    );

    // Clean up the intermediate pass-1 file to save disk space
    try { fs.unlinkSync(pass1Path); } catch { /* non-fatal */ }

    console.log('[Stability] 8K two-pass complete:', pass2.filename);
    return {
      imageUrl: BASE_URL + '/generated/' + pass2.filename,
      provider: 'stability-enhance-8k',
      width:    7680,
      height:   4320,
    };
  }

  /* ── 4× or 2× : single pass ────────────────────────────────────────── */
  // Higher creativity for 4× to generate more fine detail
  const creativity = scale >= 4 ? 0.35 : 0.30;
  console.log(`[Stability] Single-pass ${scale}× (creativity=${creativity})…`);

  const pass = await runOneUpscalePass(
    STABILITY_API_KEY,
    imageFile.path,
    imageFile.originalname || imageFile.path,
    creativity,
    scale >= 4 ? '-4x' : '-2x'
  );

  const outputDim = scale >= 4 ? 4096 : 2048;
  return {
    imageUrl: BASE_URL + '/generated/' + pass.filename,
    provider: 'stability-enhance-creative',
    width:    outputDim,
    height:   outputDim,
  };
}

/* ── Replicate (Real-ESRGAN): image enhancement fallback ────────────────── */
/**
 * Fallback HD upscaler using Replicate's Real-ESRGAN model.
 * Supports 2× and 4× (Replicate model does not support 8× in one call;
 * for 8× we chain two calls automatically).
 *
 * Set REPLICATE_API_KEY in your .env to enable this fallback.
 */
async function enhanceWithReplicate({ imageFile, scaleFactor = 4 }) {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
  if (!REPLICATE_API_KEY) throw new Error('REPLICATE_API_KEY is not set in .env');

  const scale = Number(scaleFactor) || 4;

  // Replicate Real-ESRGAN max is 4× per call; for 8× we chain 4×→2×
  const firstScale  = scale >= 8 ? 4 : scale;
  const needSecond  = scale >= 8;

  console.log(`[Replicate] Enhancing image (${firstScale}× Real-ESRGAN)…`);

  async function replicateCall(imageBuffer, upscale) {
    const base64  = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64}`;

    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method:  'POST',
      headers: {
        Authorization:  `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        input:   { image: dataUri, scale: upscale, face_enhance: false },
      }),
    });

    if (!createRes.ok) throw new Error(`Replicate create error ${createRes.status}: ${await createRes.text()}`);

    const prediction = await createRes.json();
    const pollUrl    = prediction.urls?.get;
    if (!pollUrl) throw new Error('Replicate did not return a polling URL');

    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(pollUrl, { headers: { Authorization: `Token ${REPLICATE_API_KEY}` } });
      const result  = await pollRes.json();

      if (result.status === 'succeeded') {
        const imgResponse = await fetch(result.output);
        if (!imgResponse.ok) throw new Error('Failed to download enhanced image from Replicate');
        return Buffer.from(await imgResponse.arrayBuffer());
      }

      if (result.status === 'failed') throw new Error(`Replicate prediction failed: ${result.error}`);
      console.log(`[Replicate] Status: ${result.status}…`);
    }

    throw new Error('Replicate enhancement timed out after 90 seconds');
  }

  // First pass
  let buffer = fs.readFileSync(imageFile.path);
  buffer = await replicateCall(buffer, firstScale);

  // Second pass for 8×
  if (needSecond) {
    console.log('[Replicate] 8K mode: running second pass (2×)…');
    buffer = await replicateCall(buffer, 2);
  }

  const filename = `enhanced-replicate-${scale}x-${Date.now()}.png`;
  fs.writeFileSync(path.join(generatedDir, filename), buffer);
  console.log(`[Replicate] Enhanced image saved: ${filename}`);

  return {
    imageUrl: `${BASE_URL}/generated/${filename}`,
    provider: scale >= 8 ? 'replicate-esrgan-8k' : 'replicate-esrgan',
    width:    scale >= 8 ? 7680 : scale >= 4 ? 4096 : 2048,
    height:   scale >= 8 ? 4320 : scale >= 4 ? 4096 : 2048,
  };
}

/* ── Mock: image enhancement ─────────────────────────────────────────────── */
async function enhanceWithMock({ imageFile, scaleFactor = 4 }) {
  const scale = Number(scaleFactor) || 4;
  console.log(`[Mock] Simulating image enhancement (${scale}×)…`);
  await new Promise(r => setTimeout(r, scale >= 8 ? 3000 : 1500));
  const filename = path.basename(imageFile.path);
  return {
    imageUrl: `${BASE_URL}/uploads/${filename}`,
    provider: scale >= 8 ? 'mock-enhance-8k' : 'mock-enhance',
    width:    scale >= 8 ? 7680 : scale >= 4 ? 4096 : 2048,
    height:   scale >= 8 ? 4320 : scale >= 4 ? 4096 : 2048,
  };
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
async function inpaintWithPollinationsFallback({ imageFile, maskFile, prompt, ratio }) {
  console.log('[Inpainting] Pollinations fallback: generating fill content...');

  const fillResult = await generateWithPollinations({ prompt, ratio: ratio || '1:1', style: 'Photorealistic' });
  const fillPath   = path.join(generatedDir, path.basename(new URL(fillResult.imageUrl).pathname));

  try {
    const sharp = (await import('sharp')).default;

    const origMeta        = await sharp(imageFile.path).metadata();
    const { width, height } = origMeta;

    const [origRGBA, fillRGBA, maskGrey] = await Promise.all([
      sharp(imageFile.path).resize(width, height).ensureAlpha().raw().toBuffer(),
      sharp(fillPath).resize(width, height, { fit: 'cover' }).ensureAlpha().raw().toBuffer(),
      sharp(maskFile.path).resize(width, height, { fit: 'fill' }).greyscale().raw().toBuffer(),
    ]);

    const composite = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const m = maskGrey[i] / 255;
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
    console.warn('[Inpainting] sharp not available, returning fill image:', sharpErr.message);
    return { imageUrl: fillResult.imageUrl, provider: 'pollinations-fill-only' };
  }
}

/* ── Mock: text / image-to-image ─────────────────────────────────────────── */
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

/**
 * Enhance / upscale an image to HD, 2K, or 8K.
 *
 * Scale factor guide:
 *   2  → single pass → ~1080p HD   (1 credit)
 *   4  → single pass → ~2K / 4096px (1 credit)
 *   8  → TWO chained passes → ~8K / 7680px (2 credits, ~60–80 s)
 *
 * Provider priority:
 *   stability  → Stability AI creative upscaler (uses STABILITY_API_KEY)
 *   other      → Replicate Real-ESRGAN          (needs REPLICATE_API_KEY)
 *   mock       → returns original image unchanged (for development)
 *
 * If Stability is set but fails (e.g. quota), auto-falls back to Replicate.
 *
 * @param {object} params
 * @param {{ path: string, originalname?: string }} params.imageFile
 * @param {number} [params.scaleFactor=4]   — 2 | 4 | 8
 */
export async function enhanceImage(params) {
  const provider    = process.env.AI_PROVIDER || 'pollinations';
  const scaleFactor = Number(params.scaleFactor) || 4;

  console.log(`[AI] Enhancement | Provider: ${provider} | Scale: ${scaleFactor}×`);

  if (provider === 'mock') {
    return enhanceWithMock({ ...params, scaleFactor });
  }

  if (provider === 'stability') {
    try {
      return await enhanceWithStability({ ...params, scaleFactor });
    } catch (stabilityErr) {
      console.warn('[AI] Stability enhance failed:', stabilityErr.message);

      if (process.env.REPLICATE_API_KEY) {
        console.log('[AI] Falling back to Replicate Real-ESRGAN…');
        return enhanceWithReplicate({ ...params, scaleFactor });
      }

      throw stabilityErr;
    }
  }

  // pollinations or any other provider — use Replicate
  if (process.env.REPLICATE_API_KEY) {
    return enhanceWithReplicate({ ...params, scaleFactor });
  }

  throw new Error(
    'Image enhancement requires either AI_PROVIDER=stability (with STABILITY_API_KEY) ' +
    'or REPLICATE_API_KEY set in your .env file.'
  );
}