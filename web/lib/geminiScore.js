import { GoogleGenerativeAI } from "@google/generative-ai";
import { ruleBasedScore } from "./ruleBasedScore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildPrompt(listing, tenantProfile) {
  return `Given this room listing: ${JSON.stringify({
    location: listing.location,
    rent: listing.rent,
    available_from: listing.available_from,
    room_type: listing.room_type,
    furnishing_status: listing.furnishing_status,
  })}

And this tenant profile: ${JSON.stringify({
    preferred_location: tenantProfile.preferred_location,
    budget_min: tenantProfile.budget_min,
    budget_max: tenantProfile.budget_max,
    move_in_date: tenantProfile.move_in_date,
  })}

Compute a compatibility score from 0 to 100 based on budget and location match.
Respond with ONLY valid JSON in this exact shape, no markdown fences, no extra text:
{ "score": number, "explanation": string }`;
}

// Calls Gemini to score a tenant/listing pair. On any failure (network,
// timeout, malformed JSON, out-of-range score) it falls back to a
// deterministic rule-based score so the app never breaks.
export async function getCompatibilityScore(listing, tenantProfile) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = buildPrompt(listing, tenantProfile);

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error("LLM timeout")), 8000)),
    ]);

    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json\s*|^```\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.score !== "number" ||
      parsed.score < 0 ||
      parsed.score > 100 ||
      typeof parsed.explanation !== "string"
    ) {
      throw new Error("Malformed LLM response");
    }

    return {
      score: Math.round(parsed.score),
      explanation: parsed.explanation,
      source: "llm",
    };
  } catch (err) {
    console.error("Gemini scoring failed, using fallback:", err.message);
    return ruleBasedScore(listing, tenantProfile);
  }
}
