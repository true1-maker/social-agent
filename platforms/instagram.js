// ============================================================
// platforms/instagram.js — Instagram Graph API Adapter
// Flow: Create Container → Publish Container (2-step)
// Required env: IG_ACCOUNT_ID, IG_ACCESS_TOKEN
// ============================================================

const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN; // Same long-lived token as FB usually
const BASE = `https://graph.facebook.com/v19.0`;

// ── STEP 1: Create media container ──────────────────────────
async function createMediaContainer(caption, imageUrl) {
  const endpoint = `${BASE}/${IG_ACCOUNT_ID}/media`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,   // Must be publicly accessible URL ✅ (Pollinations works)
      caption: caption,
      access_token: ACCESS_TOKEN,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`IG Container Error: ${data.error.message}`);
  }

  return data.id; // container_id
}

// ── STEP 2: Publish container ────────────────────────────────
async function publishContainer(containerId) {
  const endpoint = `${BASE}/${IG_ACCOUNT_ID}/media_publish`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: ACCESS_TOKEN,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`IG Publish Error: ${data.error.message}`);
  }

  return data.id; // published media id
}

// ── Wait helper (Instagram needs ~5s between create & publish) ─
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main: Create + Publish ───────────────────────────────────
async function postToInstagram(content, imageUrl) {
  if (!IG_ACCOUNT_ID || !ACCESS_TOKEN) {
    throw new Error("IG_ACCOUNT_ID or IG_ACCESS_TOKEN not set");
  }

  // Step 1
  const containerId = await createMediaContainer(content.caption, imageUrl);

  // Wait for Instagram to process the image (important!)
  await sleep(5000);

  // Step 2
  const mediaId = await publishContainer(containerId);

  return { id: mediaId };
}

module.exports = { postToInstagram };

// ──────────────────────────────────────────────────────────────
// 📋 SETUP NOTES:
// 1. You need a Facebook Page linked to an Instagram Business Account
// 2. Go to: developers.facebook.com → Create App → Instagram Basic Display
// 3. Get long-lived token (60 day) using:
//    GET /oauth/access_token?grant_type=fb_exchange_token&...
// 4. Set IG_ACCOUNT_ID = your Instagram Business Account ID
//    (find at: graph.facebook.com/me/accounts → instagram_business_account)
// ──────────────────────────────────────────────────────────────

