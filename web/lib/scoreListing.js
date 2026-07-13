import { supabaseAdmin } from "./supabaseAdmin";
import { getCompatibilityScore } from "./geminiScore";
import { ruleBasedScore } from "./ruleBasedScore";

// Returns the cached score for (tenantDbId, listing), computing + caching it
// via Gemini (with rule-based fallback) on first lookup. Never recomputes.
export async function getOrComputeScore(tenantDbId, listing, tenantProfile) {
  const { data: existing } = await supabaseAdmin
    .from("compatibility_scores")
    .select("*")
    .eq("tenant_id", tenantDbId)
    .eq("listing_id", listing.id)
    .single();

  if (existing) return existing;

  const result = await getCompatibilityScore(listing, tenantProfile);

  const { data: saved } = await supabaseAdmin
    .from("compatibility_scores")
    .insert({
      tenant_id: tenantDbId,
      listing_id: listing.id,
      score: result.score,
      explanation: result.explanation,
      source: result.source,
    })
    .select()
    .single();

  return saved || { ...result, listing_id: listing.id, tenant_id: tenantDbId };
}

// Fast path for browse pages: one DB query + instant rule-based estimates
// for listings not yet scored. Avoids blocking on Gemini for every row.
export async function getScoresForListings(tenantDbId, listings, tenantProfile) {
  if (!listings?.length) return [];

  const listingIds = listings.map((l) => l.id);
  const { data: cached } = await supabaseAdmin
    .from("compatibility_scores")
    .select("*")
    .eq("tenant_id", tenantDbId)
    .in("listing_id", listingIds);

  const byListingId = Object.fromEntries((cached || []).map((s) => [s.listing_id, s]));

  return listings.map((listing) => ({
    listing,
    score: byListingId[listing.id] || ruleBasedScore(listing, tenantProfile),
  }));
}
