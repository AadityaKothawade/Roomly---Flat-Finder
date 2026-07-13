import { GoogleGenerativeAI } from "@google/generative-ai";
import { ruleBasedScore } from "./ruleBasedScore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SCORING_SYSTEM = `You are Roomly's compatibility scoring engine for flatmate and room matching in India.

Your job: score how well a room listing fits a tenant's preferences on a 0–100 scale.

Scoring rubric (use all factors; weights are approximate):
- Budget fit (40%): Is rent within budget_min–budget_max? Penalize proportionally if outside range.
- Location fit (35%): Does listing location match or overlap preferred_location (area, neighbourhood, city)?
- Move-in timing (15%): How well does available_from align with move_in_date? Same month = strong; months apart = weaker.
- Room details (10%): room_type and furnishing_status — only adjust if tenant notes mention preferences; otherwise neutral.

Score guide:
- 90–100: Excellent fit — budget, location, and timing all align well.
- 70–89: Good fit — minor trade-offs worth mentioning.
- 50–69: Moderate fit — meaningful gaps in budget, location, or timing.
- 30–49: Weak fit — several mismatches.
- 0–29: Poor fit — major incompatibilities.

Write the explanation in 1–2 friendly, specific sentences a tenant would understand. Mention what matches and what doesn't. No markdown.`;

function buildPrompt(listing, tenantProfile) {
  const listingData = {
    location: listing.location,
    rent_inr: listing.rent,
    available_from: listing.available_from,
    room_type: listing.room_type,
    furnishing_status: listing.furnishing_status,
    title: listing.title || null,
  };

  const tenantData = {
    preferred_location: tenantProfile.preferred_location,
    budget_min_inr: tenantProfile.budget_min,
    budget_max_inr: tenantProfile.budget_max,
    move_in_date: tenantProfile.move_in_date,
    notes: tenantProfile.notes || null,
  };

  return `${SCORING_SYSTEM}

LISTING:
${JSON.stringify(listingData, null, 2)}

TENANT PROFILE:
${JSON.stringify(tenantData, null, 2)}

Respond with ONLY valid JSON in this exact shape:
{ "score": <integer 0-100>, "explanation": "<string>" }`;
}

function parseGeminiJson(text) {
  const cleaned = text
    .replace(/```(?:json)?\n?/gi, "")
    .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/m, "$1")
    .trim();

  return JSON.parse(cleaned);
}

export async function getCompatibilityScore(listing, tenantProfile) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      throw new Error("Missing Gemini API key");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildPrompt(listing, tenantProfile);

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError) {
      console.error("Gemini API error:", apiError);
      throw new Error(`Gemini API error: ${apiError.message || "Unknown"}`);
    }

    const text = result.response.text();
    let parsed;

    try {
      parsed = parseGeminiJson(text);
    } catch (parseError) {
      console.error("Invalid JSON from Gemini:", text);
      throw new Error("Invalid JSON response from AI");
    }

    const score = Math.round(Number(parsed.score));
    const explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim() : "";

    if (Number.isNaN(score) || score < 0 || score > 100 || !explanation) {
      throw new Error("Malformed LLM response: " + text);
    }

    return {
      score,
      explanation,
      source: "llm",
    };
  } catch (err) {
    console.error("Gemini scoring failed, using fallback:", err.message);
    return ruleBasedScore(listing, tenantProfile);
  }
}
