import { supabaseAdmin } from "./supabaseAdmin";
import { getCompatibilityScore } from "./geminiScore";

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
