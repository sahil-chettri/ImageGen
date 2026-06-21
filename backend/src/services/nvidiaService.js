const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // already in most express setups; or use axios

const NVIDIA_API_URL = 'https://ai.api.nvidia.com/v1/cv/nvidia/esrgan';

async function enhanceImage(inputImageBuffer, mimeType = 'image/png') {
  const base64Image = inputImageBuffer.toString('base64');

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      input: [`data:${mimeType};base64,${base64Image}`],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA API error ${response.status}: ${err}`);
  }

  const data = await response.json();

  // NVIDIA returns base64 output image
  const outputBase64 = data.output?.[0];
  if (!outputBase64) throw new Error('No output from NVIDIA API');

  // Strip data URI prefix if present
  const base64Data = outputBase64.replace(/^data:image\/\w+;base64,/, '');
  const outputBuffer = Buffer.from(base64Data, 'base64');

  // Save to generated/
  const filename = `enhanced_${Date.now()}.png`;
  const outputPath = path.join(__dirname, '../../generated', filename);
  fs.writeFileSync(outputPath, outputBuffer);

  return `${process.env.BACKEND_URL}/generated/${filename}`;
}

module.exports = { enhanceImage };