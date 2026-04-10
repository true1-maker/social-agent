// ============================================================
// platforms/linkedin.js — LinkedIn API Adapter
// Required env: LI_ACCESS_TOKEN, LI_PERSON_URN
// ============================================================

// LinkedIn API v2 for personal profiles OR organization pages
// Getting approval is harder — read setup notes below

const ACCESS_TOKEN = process.env.LI_ACCESS_TOKEN;
const PERSON_URN = process.env.LI_PERSON_URN; // format: "urn:li:person:XXXXXXXX"
// For company pages use: "urn:li:organization:XXXXXXXX"

const BASE = "https://api.linkedin.com/v2";

// ── Upload image to LinkedIn (required before posting) ───────
async function uploadImage(imageUrl) {
  // Step 1: Register upload
  const registerRes = await fetch(`${BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: PERSON_URN,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }),
  });

  const registerData = await registerRes.json();
  if (registerData.message) throw new Error(`LI Upload Register: ${registerData.message}`);

  const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Upload the image binary
  const imgRes = await fetch(imageUrl);
  const imgBuffer = await imgRes.arrayBuffer();

  await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "image/jpeg",
    },
    body: imgBuffer,
  });

  return asset; // e.g. "urn:li:digitalmediaAsset:XXXXX"
}

// ── Post to LinkedIn ─────────────────────────────────────────
async function postToLinkedIn(content, imageUrl) {
  if (!ACCESS_TOKEN || !PERSON_URN) {
    throw new Error("LI_ACCESS_TOKEN or LI_PERSON_URN not set");
  }

  let shareMediaCategory = "NONE";
  let media = [];

  // Upload image if provided
  if (imageUrl) {
    try {
      const asset = await uploadImage(imageUrl);
      shareMediaCategory = "IMAGE";
      media = [
        {
          status: "READY",
          description: { text: content.text.slice(0, 200) },
          media: asset,
          title: { text: "Post Image" },
        },
      ];
    } catch (err) {
      console.warn("LinkedIn image upload failed, posting text only:", err.message);
    }
  }

  // Post the share
  const shareRes = await fetch(`${BASE}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: PERSON_URN,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content.text },
          shareMediaCategory,
          media,
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  const shareData = await shareRes.json();
  if (shareData.message) throw new Error(`LinkedIn post error: ${shareData.message}`);

  return { id: shareData.id };
}

module.exports = { postToLinkedIn };

// ──────────────────────────────────────────────────────────────
// 📋 SETUP NOTES (LinkedIn is the hardest):
// 1. Go to: linkedin.com/developers → Create App
// 2. Request products: "Share on LinkedIn" + "Sign In with LinkedIn"
// 3. Get OAuth 2.0 token with scopes: w_member_social, r_liteprofile
// 4. Get your Person URN:
//    GET https://api.linkedin.com/v2/me → use "id" field
//    URN = "urn:li:person:{id}"
// 5. Access token expires in 60 days — need refresh logic for long-term
//
// ⚠️ LinkedIn review can take days — skip this platform initially
// ──────────────────────────────────────────────────────────────
  
