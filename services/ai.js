// ============================================================
// services/ai.js — Gemini Text Generator
// Generates: hook, body, CTA, hashtags
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Prompt Builder ───────────────────────────────────────────
function buildPrompt(topic) {
  return `
You are a viral social media content creator. Generate content about: "${topic}"

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "hook": "One powerful opening line that stops the scroll (max 15 words)",
  "body": "2-3 short paragraphs with value, insight, or story. Keep it human, not robotic.",
  "cta": "One clear call-to-action (e.g., Save this. Share with a friend. Drop a comment.)",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["word1", "word2", "word3"]
}

Rules:
- hook must be PUNCHY and emotional
- body should have practical value
- hashtags should be relevant and popular
- NO quotes around the whole JSON
- NO triple backticks
`;
}

// ── Main Generator ───────────────────────────────────────────
async function generateContent(topic) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(topic) }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text;

  // Clean and parse JSON
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const content = JSON.parse(cleaned);

  // Validate required fields
  if (!content.hook || !content.body || !content.cta || !content.hashtags) {
    throw new Error("Gemini returned incomplete content structure");
  }

  return content;
}

module.exports = { generateContent };

