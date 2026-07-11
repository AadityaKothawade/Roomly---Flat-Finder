import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrComputeScore } from "@/lib/scoreListing";

// Returns the cached compatibility score for (current tenant, listing_id),
// computing and caching it via Gemini (with rule-based fallback) if it
// doesn't exist yet. Scores are never recomputed once stored.
export async function POST(req) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "tenant") {
    return new Response("Forbidden", { status: 403 });
  }

  const { listing_id } = await req.json();
  if (!listing_id) return new Response("Missing listing_id", { status: 400 });

  const [{ data: listing }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("listings").select("*").eq("id", listing_id).single(),
    supabaseAdmin.from("tenant_profiles").select("*").eq("tenant_id", dbUser.id).single(),
  ]);

  if (!listing || !profile) {
    return new Response("Listing or tenant profile not found", { status: 404 });
  }

  const score = await getOrComputeScore(dbUser.id, listing, profile);
  return Response.json(score);
}
