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

export async function getCompatibilityScore(listing, tenantProfile) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      throw new Error("Missing Gemini API key");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = buildPrompt(listing, tenantProfile);

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError) {
      console.error("Gemini API error:", apiError);
      throw new Error(`Gemini API error: ${apiError.message || "Unknown"}`);
    }

    const response = await result.response;
    const text = response.text();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Invalid JSON from Gemini:", cleaned);
      throw new Error("Invalid JSON response from AI");
    }

    if (
      typeof parsed.score !== "number" ||
      parsed.score < 0 ||
      parsed.score > 100 ||
      typeof parsed.explanation !== "string"
    ) {
      throw new Error("Malformed LLM response: " + cleaned);
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