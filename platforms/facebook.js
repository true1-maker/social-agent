// ============================================================
// platforms/facebook.js — Facebook Graph API Adapter
// Docs: https://developers.facebook.com/docs/graph-api
// Required env: FB_PAGE_ID, FB_ACCESS_TOKEN
// ============================================================

const PAGE_ID = process.env.FB_PAGE_ID;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const BASE = `https://graph.facebook.com/v19.0`;

// ── Post image + caption to Facebook Page ───────────────────
async function postToFacebook(content, imageUrl) {
  if (!PAGE_ID || !ACCESS_TOKEN) {
    throw new Error("FB_PAGE_ID or FB_ACCESS_TOKEN not set");
  }

  // Use /photos endpoint — posts image + caption in one call
  const endpoint = `${BASE}/${PAGE_ID}/photos`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,           // Pollinations URL works here ✅
      caption: content.message,
      access_token: ACCESS_TOKEN,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message}`);
  }

  // Returns { id: "page_post_id", post_id: "..." }
  return { id: data.post_id || data.id };
}

// ── Post text-only (no image) ────────────────────────────────
async function postTextToFacebook(message) {
  const endpoint = `${BASE}/${PAGE_ID}/feed`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: ACCESS_TOKEN,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}

module.exports = { postToFacebook, postTextToFacebook };
