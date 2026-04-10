// ============================================================
// services/image.js — Image Generator (Pollinations, FREE)
// Returns a direct image URL — no API key needed
// ============================================================

// ── Prompt styles for variety ────────────────────────────────
const STYLES = [
  "cinematic photography, golden hour, soft bokeh",
  "minimalist flat design, bold colors, clean lines",
  "motivational poster style, dark background, neon text",
  "editorial magazine photo, professional lighting",
  "illustrated infographic style, vibrant colors",
];

function randomStyle() {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}

// ── Build image prompt from topic ───────────────────────────
function buildImagePrompt(topic) {
  const style = randomStyle();
  // Keep clean — no text in image (avoids garbled AI text)
  return `${topic}, ${style}, no text, no words, high quality, 4k`;
}

// ── Generate image URL ───────────────────────────────────────
// Pollinations returns a direct image URL — perfect for API uploads
async function generateImage(topic) {
  const prompt = encodeURIComponent(buildImagePrompt(topic));

  // Width/Height optimized for social: 1080x1080 (square) for IG/FB
  const width = 1080;
  const height = 1080;
  const seed = Math.floor(Math.random() * 99999);

  const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  // Verify the URL is reachable (optional — skip if slow)
  // const check = await fetch(imageUrl, { method: "HEAD" });
  // if (!check.ok) throw new Error("Pollinations image generation failed");

  return imageUrl;
}

// ── Get image as base64 (needed for some APIs like Instagram) ──
async function getImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Failed to fetch image from Pollinations");

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

module.exports = { generateImage, getImageAsBase64 };

