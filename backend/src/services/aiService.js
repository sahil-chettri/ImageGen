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
async function runOneUpscalePass(apiKey, imagePath, originalname, creativity = 0.35, suffix = '') {
  let imageBuffer = fs.readFileSync(imagePath);

  const MAX_BYTES  = 8 * 1024 * 1024;
  const MAX_PIXELS = 1_048_576;

  try {
    const sharp = (await import('sharp')).default;
    const meta  = await sharp(imageBuffer).metadata();
    const totalPixels = (meta.width || 0) * (meta.height || 0);

    const needsPixelResize = totalPixels > MAX_PIXELS;
    const needsSizeResize  = imageBuffer.byteLength > MAX_BYTES;

    if (needsPixelResize || needsSizeResize) {
      if (needsPixelResize) {
        console.log(`[Stability] Image is ${meta.width}×${meta.height} (${totalPixels.toLocaleString()} px) — exceeds 1,048,576 px limit. Resizing…`);
      }
      if (needsSizeResize) {
        console.log(`[Stability] Image is ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)} MB — exceeds 8 MB limit. Compressing…`);
      }

      imageBuffer = await sharp(imageBuffer)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: false })
        .jpeg({ quality: 88 })
        .toBuffer();

      const newMeta = await sharp(imageBuffer).metadata();
      console.log(`[Stability] Resized to ${newMeta.width}×${newMeta.height}, ${(imageBuffer.byteLength / 1024).toFixed(0)} KB`);
    }
  } catch (sharpErr) {
    console.warn('[Stability] sharp not available — cannot validate/resize image:', sharpErr.message);
    throw new Error('sharp is required for image enhancement. Run: npm install sharp');
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
      headers: { Authorization: 'Bearer ' + apiKey, Accept: 'application/json' },
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

  const pollUrl = 'https://api.stability.ai/v2beta/stable-image/upscale/creative/result/' + id;
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));

    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: 'Bearer ' + apiKey, Accept: 'image/*' },
    });

    if (pollRes.status === 202) { console.log('[Stability] Still processing…'); continue; }

    if (!pollRes.ok) {
      const errText = await pollRes.text();
      throw new Error('Stability poll error ' + pollRes.status + ': ' + errText);
    }

    const arrayBuffer = await pollRes.arrayBuffer();
    const filename    = `enhanced-stability${suffix}-` + Date.now() + '.png';
    fs.writeFileSync(path.join(generatedDir, filename), Buffer.from(arrayBuffer));
    console.log('[Stability] Pass saved:', filename);
    return { filename, arrayBuffer };
  }

  throw new Error('Stability upscale pass timed out after 180 seconds');
}

/* ── Stability AI: image enhancement / upscale ──────────────────────────── */
async function enhanceWithStability({ imageFile, scaleFactor = 4 }) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is not set in .env');

  const scale = Number(scaleFactor) || 4;
  console.log(`[Stability] enhanceWithStability | scale: ${scale}×`);

  if (scale >= 8) {
    const pass1 = await runOneUpscalePass(STABILITY_API_KEY, imageFile.path, imageFile.originalname || imageFile.path, 0.45, '-8k-pass1');
    const pass1Path = path.join(generatedDir, pass1.filename);
    const pass2 = await runOneUpscalePass(STABILITY_API_KEY, pass1Path, pass1.filename, 0.30, '-8k-pass2');
    try { fs.unlinkSync(pass1Path); } catch { /* non-fatal */ }
    return { imageUrl: BASE_URL + '/generated/' + pass2.filename, provider: 'stability-enhance-8k', width: 7680, height: 4320 };
  }

  const creativity = scale >= 4 ? 0.35 : 0.30;
  const pass       = await runOneUpscalePass(STABILITY_API_KEY, imageFile.path, imageFile.originalname || imageFile.path, creativity, scale >= 4 ? '-4x' : '-2x');
  const outputDim  = scale >= 4 ? 4096 : 2048;
  return { imageUrl: BASE_URL + '/generated/' + pass.filename, provider: 'stability-enhance-creative', width: outputDim, height: outputDim };
}

/* ── ModelsLab: free ESRGAN upscaling ───────────────────────────────────── */
async function enhanceWithModelsLab({ imageFile, scaleFactor = 4 }) {
  const API_KEY = process.env.MODELSLAB_API_KEY;
  if (!API_KEY) throw new Error('MODELSLAB_API_KEY not set in .env');

  const imageBuffer = imageFile.buffer
    ? imageFile.buffer
    : fs.readFileSync(imageFile.path);

  const mimeType = imageFile.mimetype || 'image/png';
  const form     = new FormData();
  form.append('key',  API_KEY);
  form.append('file', new Blob([imageBuffer], { type: mimeType }), 'image.png');

  console.log('[ModelsLab] Uploading image…');
  const uploadRes  = await fetch('https://modelslab.com/api/v1/realtime/upload', {
    method: 'POST', body: form,
  });
  const uploadData = await uploadRes.json();
  console.log('[ModelsLab] Upload response:', JSON.stringify(uploadData));

  const imageUrl = uploadData?.link;
  if (!imageUrl) throw new Error('ModelsLab upload failed: ' + JSON.stringify(uploadData));

  console.log(`[ModelsLab] Running ESRGAN ${scaleFactor}×…`);
  const enhRes  = await fetch('https://modelslab.com/api/v6/image_editing/super_resolution', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key:          API_KEY,
      url:          imageUrl,
      scale:        scaleFactor,
      face_enhance: false,
    }),
  });
  const enhData = await enhRes.json();
  console.log('[ModelsLab] Enhance response:', JSON.stringify(enhData));

  let outputUrl = enhData?.output?.[0];

  // Async job — poll until done
  if (!outputUrl && enhData?.id) {
    console.log('[ModelsLab] Async job, polling id:', enhData.id);
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes  = await fetch('https://modelslab.com/api/v6/image_editing/fetch/' + enhData.id, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: API_KEY }),
      });
      const pollData = await pollRes.json();
      console.log('[ModelsLab] Poll status:', pollData?.status);
      if (pollData?.status === 'success') { outputUrl = pollData.output?.[0]; break; }
      if (pollData?.status === 'error')   throw new Error('ModelsLab job failed: ' + JSON.stringify(pollData));
    }
  }

  if (!outputUrl) throw new Error('ModelsLab returned no output: ' + JSON.stringify(enhData));

  const imgRes   = await fetch(outputUrl);
  const buffer   = Buffer.from(await imgRes.arrayBuffer());
  const filename = `enhanced-modelslab-${scaleFactor}x-${Date.now()}.png`;
  fs.writeFileSync(path.join(generatedDir, filename), buffer);
  console.log(`[ModelsLab] Saved: ${filename}`);

  return {
    imageUrl: `${BASE_URL}/generated/${filename}`,
    provider: 'modelslab-esrgan',
    width:    scaleFactor >= 4 ? 4096 : 2048,
    height:   scaleFactor >= 4 ? 4096 : 2048,
  };
}

/* ── Mock: image enhancement ─────────────────────────────────────────────── */
async function enhanceWithMock({ imageFile, scaleFactor = 4 }) {
  const scale = Number(scaleFactor) || 4;
  console.log(`[Mock] Simulating image enhancement (${scale}×)…`);
  await new Promise(r => setTimeout(r, scale >= 8 ? 3000 : 1500));

  const filename = imageFile.path
    ? path.basename(imageFile.path)
    : `mock-enhance-${Date.now()}.png`;

  return {
    imageUrl: imageFile.path
      ? `${BASE_URL}/uploads/${filename}`
      : `https://picsum.photos/2048/2048?random=${Date.now()}`,
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
 * Enhance / upscale an image using ModelsLab free ESRGAN.
 * Falls back to mock if MODELSLAB_API_KEY is not set.
 */
export async function enhanceImage(params) {
  const scaleFactor = Number(params.scaleFactor) || 4;
  console.log(`[AI] Enhancement | ModelsLab ESRGAN | Scale: ${scaleFactor}×`);

  if (process.env.MODELSLAB_API_KEY) {
    return enhanceWithModelsLab({ ...params, scaleFactor });
  }

  console.warn('[AI] No MODELSLAB_API_KEY — using mock');
  return enhanceWithMock({ ...params, scaleFactor });
}