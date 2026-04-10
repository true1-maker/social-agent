// ============================================================
// run-agent.js — AGENT BRAIN (Netlify Function)
// Flow: Topic → AI Content → Image → Format → Post → Log
// ============================================================

const { generateContent } = require("../services/ai");
const { generateImage } = require("../services/image");
const { formatFacebook, formatInstagram, formatTwitter, formatLinkedIn } = require("../utils/formatter");
const { postToFacebook } = require("../platforms/facebook");
const { postToInstagram } = require("../platforms/instagram");
const { postToTwitter } = require("../platforms/twitter");
const { postToLinkedIn } = require("../platforms/linkedin");

// ── Topic Pool ──────────────────────────────────────────────
const TOPICS = [
  "Morning productivity habits that actually work",
  "Why most people fail at learning new skills",
  "The power of saying NO to grow faster",
  "How to build focus in a distracted world",
  "Simple money habits for beginners",
  "Why consistency beats motivation every time",
  "The mindset shift that changes everything",
  "How to turn failures into stepping stones",
  "Digital detox: why you need it now",
  "The 1% improvement rule explained",
];

// ── Anti-Repeat Memory (in-memory for now, Firestore optional) ──
let usedTopics = [];

function pickTopic() {
  const available = TOPICS.filter((t) => !usedTopics.includes(t));
  if (available.length === 0) usedTopics = []; // reset after full cycle
  const topic = available[Math.floor(Math.random() * available.length)];
  usedTopics.push(topic);
  if (usedTopics.length > 7) usedTopics.shift(); // keep last 7
  return topic;
}

// ── Logger ──────────────────────────────────────────────────
function log(platform, status, detail = "") {
  console.log(`[${new Date().toISOString()}] [${platform}] ${status} ${detail}`);
}

// ── Main Handler ─────────────────────────────────────────────
exports.handler = async (event, context) => {
  const results = {};

  try {
    // ── STEP 1: Pick Topic ───────────────────────────────────
    const topic = pickTopic();
    log("AGENT", "🎯 Topic selected:", topic);

    // ── STEP 2: Generate Master Content (Gemini) ─────────────
    const masterContent = await generateContent(topic);
    log("AI", "✅ Content generated");

    // ── STEP 3: Generate Image (Pollinations) ────────────────
    const imageUrl = await generateImage(topic);
    log("IMAGE", "✅ Image generated:", imageUrl);

    // ── STEP 4 + 5: Format & Post to each platform ───────────

    // — Facebook —
    try {
      const fbContent = formatFacebook(masterContent);
      const fbResult = await postToFacebook(fbContent, imageUrl);
      results.facebook = { status: "success", id: fbResult.id };
      log("FACEBOOK", "✅ Posted", fbResult.id);
    } catch (err) {
      results.facebook = { status: "error", error: err.message };
      log("FACEBOOK", "❌ Failed", err.message);
    }

    // — Instagram —
    try {
      const igContent = formatInstagram(masterContent);
      const igResult = await postToInstagram(igContent, imageUrl);
      results.instagram = { status: "success", id: igResult.id };
      log("INSTAGRAM", "✅ Posted", igResult.id);
    } catch (err) {
      results.instagram = { status: "error", error: err.message };
      log("INSTAGRAM", "❌ Failed", err.message);
    }

    // — Twitter —
    try {
      const twContent = formatTwitter(masterContent);
      const twResult = await postToTwitter(twContent);
      results.twitter = { status: "success", id: twResult.id };
      log("TWITTER", "✅ Posted", twResult.id);
    } catch (err) {
      results.twitter = { status: "error", error: err.message };
      log("TWITTER", "❌ Failed", err.message);
    }

    // — LinkedIn (optional, comment out if not ready) —
    try {
      const liContent = formatLinkedIn(masterContent);
      const liResult = await postToLinkedIn(liContent, imageUrl);
      results.linkedin = { status: "success", id: liResult.id };
      log("LINKEDIN", "✅ Posted", liResult.id);
    } catch (err) {
      results.linkedin = { status: "error", error: err.message };
      log("LINKEDIN", "❌ Failed", err.message);
    }

    // ── STEP 6: Return summary log ───────────────────────────
    return {
      statusCode: 200,
      body: JSON.stringify({
        topic,
        imageUrl,
        results,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (err) {
    log("AGENT", "💀 Fatal error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
        
