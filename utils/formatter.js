// ============================================================
// utils/formatter.js — Platform-wise Content Formatter
// Same master content → platform-specific output
// ============================================================

// ── Helpers ──────────────────────────────────────────────────
function hashtagString(tags, prefix = "#") {
  return tags.map((t) => `${prefix}${t.replace(/\s+/g, "")}`).join(" ");
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3).trim() + "...";
}

// ── Hooks per platform (same idea, different tone/opener) ──
const FB_OPENERS = ["Did you know?", "Real talk:", "Here's something powerful:"];
const IG_OPENERS = ["🔥", "💡", "✨", "👇", "📌"];
const TW_OPENERS = ["Most people don't know this:", "Hot take:", "Unpopular truth:"];

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── FACEBOOK FORMAT ──────────────────────────────────────────
// Long text OK | Story + CTA | Full hashtags
function formatFacebook(content) {
  const opener = randomPick(FB_OPENERS);
  const tags = hashtagString(content.hashtags);

  const text = `${opener} ${content.hook}

${content.body}

👉 ${content.cta}

${tags}`;

  return {
    message: text,
    platform: "facebook",
  };
}

// ── INSTAGRAM FORMAT ─────────────────────────────────────────
// Short caption | Emoji heavy | 5-10 hashtags | Line breaks
function formatInstagram(content) {
  const emoji = randomPick(IG_OPENERS);
  const tags = hashtagString(content.hashtags);

  // Instagram likes line breaks + dots trick for "more" fold
  const caption = `${emoji} ${content.hook}
.
.
${truncate(content.body, 300)}
.
${content.cta} 👇
.
.
${tags}`;

  return {
    caption,
    platform: "instagram",
  };
}

// ── TWITTER FORMAT ───────────────────────────────────────────
// Max 280 chars | Punchy | 1-2 hashtags only
function formatTwitter(content) {
  const opener = randomPick(TW_OPENERS);

  // Keep tweet tight — hook + 1 insight + CTA + 2 tags
  const topTags = content.hashtags.slice(0, 2).map((t) => `#${t}`).join(" ");

  // Build tweet and ensure it fits 280 chars
  let tweet = `${opener}\n\n${content.hook}\n\n${content.cta}\n\n${topTags}`;

  if (tweet.length > 280) {
    // Fallback: just hook + CTA + tags
    tweet = truncate(`${content.hook}\n\n${content.cta}\n\n${topTags}`, 280);
  }

  return {
    text: tweet,
    platform: "twitter",
  };
}

// ── LINKEDIN FORMAT ──────────────────────────────────────────
// Professional tone | Value-first | No emoji overload | Long OK
function formatLinkedIn(content) {
  const tags = hashtagString(content.hashtags);

  const text = `${content.hook}

${content.body}

Key takeaway: ${content.cta}

${tags}`;

  return {
    text,
    platform: "linkedin",
  };
}

module.exports = {
  formatFacebook,
  formatInstagram,
  formatTwitter,
  formatLinkedIn,
};
    
