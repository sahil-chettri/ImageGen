import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(__dirname, '../../generated');
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

// FIX: Base URL used to build full image URLs the browser can load
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const cache = new Map();

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

// ── Stability AI ─────────────────────────────────────────────────────────────
async function generateWithStability({ prompt, negativePrompt = '', ratio, style }) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is not set in .env');

  const enhancedPrompt = style && stylePrompts[style]
    ? `${prompt}, ${stylePrompts[style]}`
    : prompt;

  const { width, height } = dimensions[ratio] || dimensions['1:1'];

  console.log(`[Stability] Generating | ${width}x${height} | style: ${style}`);

  const formData = new FormData();
  formData.append('prompt', enhancedPrompt);
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
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: 'image/*',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stability AI error ${response.status}: ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const filename = 'stability-' + Date.now() + '.png';
  const filePath = path.join(generatedDir, filename);
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  console.log(`[Stability] Image saved: ${filename}`);

  // FIX: Return full URL so browser can load it from the backend server
  return { imageUrl: `${BASE_URL}/generated/${filename}`, provider: 'stability', width, height };
}

// ── Pollinations (free fallback) ─────────────────────────────────────────────
async function generateWithPollinations({ prompt, ratio, style }) {
  const { width, height } = dimensions[ratio] || dimensions['1:1'];

  const cacheKey = `${prompt}-${ratio}-${style}`;
  if (cache.has(cacheKey)) {
    console.log('[Pollinations] Cache hit!');
    return cache.get(cacheKey);
  }

  const seed = Math.floor(Math.random() * 1000000);
  const model = styleModelMap[style] || 'flux';
  const enhancedPrompt = style && stylePrompts[style]
    ? `${prompt}, ${stylePrompts[style]}`
    : prompt;

  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}`;

  console.log(`[Pollinations] Model: ${model} | Size: ${width}x${height}`);

  const response = await fetch(pollinationsUrl);
  if (!response.ok) throw new Error('Pollinations failed: ' + response.status);

  const arrayBuffer = await response.arrayBuffer();
  const filename = 'pollinations-' + Date.now() + '.png';
  const filePath = path.join(generatedDir, filename);
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  // FIX: Return full URL so browser can load it from the backend server
  const result = { imageUrl: `${BASE_URL}/generated/${filename}`, provider: 'pollinations', width, height };
  cache.set(cacheKey, result);
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  return result;
}

// ── Mock ─────────────────────────────────────────────────────────────────────
async function generateWithMock({ ratio }) {
  const { width, height } = dimensions[ratio] || dimensions['1:1'];
  await new Promise(r => setTimeout(r, 1500));
  const seed = Math.floor(Math.random() * 1000);
  return {
    imageUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    provider: 'mock', width, height,
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────
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