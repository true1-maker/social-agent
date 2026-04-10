// ============================================================
// platforms/twitter.js — Twitter/X API v2 Adapter
// Required env: TW_API_KEY, TW_API_SECRET,
//               TW_ACCESS_TOKEN, TW_ACCESS_TOKEN_SECRET
// ============================================================

// Twitter v2 requires OAuth 1.0a User Context for posting
// We use the oauth-1.0a + crypto approach (no heavy library needed)

const crypto = require("crypto");

const TW_API_KEY = process.env.TW_API_KEY;
const TW_API_SECRET = process.env.TW_API_SECRET;
const TW_ACCESS_TOKEN = process.env.TW_ACCESS_TOKEN;
const TW_ACCESS_TOKEN_SECRET = process.env.TW_ACCESS_TOKEN_SECRET;

const TWEET_URL = "https://api.twitter.com/2/tweets";

// ── OAuth 1.0a Signature Builder ─────────────────────────────
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join("&");

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function buildOAuthHeader(method, url, bodyParams = {}) {
  const oauthParams = {
    oauth_consumer_key: TW_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TW_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  // Include body params in signature if any (for form-encoded)
  const allParams = { ...oauthParams, ...bodyParams };

  const signature = generateOAuthSignature(
    method,
    url,
    allParams,
    TW_API_SECRET,
    TW_ACCESS_TOKEN_SECRET
  );

  oauthParams.oauth_signature = signature;

  const headerValue =
    "OAuth " +
    Object.keys(oauthParams)
      .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
      .join(", ");

  return headerValue;
}

// ── Post a tweet ─────────────────────────────────────────────
async function postToTwitter(content) {
  if (!TW_API_KEY || !TW_API_SECRET || !TW_ACCESS_TOKEN || !TW_ACCESS_TOKEN_SECRET) {
    throw new Error("Twitter API credentials not set in environment");
  }

  const body = JSON.stringify({ text: content.text });
  const authHeader = buildOAuthHeader("POST", TWEET_URL);

  const response = await fetch(TWEET_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await response.json();

  if (data.errors || data.error) {
    const msg = data.errors?.[0]?.message || data.error || "Unknown Twitter error";
    throw new Error(`Twitter API error: ${msg}`);
  }

  return { id: data.data?.id };
}

module.exports = { postToTwitter };

// ──────────────────────────────────────────────────────────────
// 📋 SETUP NOTES:
// 1. Go to: developer.twitter.com → Create Project + App
// 2. Enable "Read and Write" permissions (not just Read)
// 3. Generate: API Key, API Secret, Access Token, Access Token Secret
// 4. Free tier allows 500 tweets/month (more than enough for daily)
// 5. Add all 4 values to Netlify environment variables
// ──────────────────────────────────────────────────────────────
      
