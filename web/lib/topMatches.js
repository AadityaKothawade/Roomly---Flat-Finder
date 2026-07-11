import { supabaseAdmin } from "./supabaseAdmin";
import { getOrComputeScore } from "./scoreListing";

// Scores a tenant's preferences against currently-open listings and returns
// the top 3 matches. Reuses the same cached scoring path as the browse page
// (Gemini first, rule-based fallback), so this doesn't duplicate any logic.
const MAX_LISTINGS_TO_SCORE = 20; // bounds how much work happens per profile save

export async function getTopMatchesForTenant(tenantDbId, tenantProfile) {
  const { data: listings } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("is_filled", false)
    .order("created_at", { ascending: false })
    .limit(MAX_LISTINGS_TO_SCORE);

  if (!listings || listings.length === 0) return [];

  const scored = await Promise.all(
    listings.map(async (listing) => ({
      listing,
      score: await getOrComputeScore(tenantDbId, listing, tenantProfile),
    }))
  );

  scored.sort((a, b) => b.score.score - a.score.score);
  return scored.slice(0, 3);
}