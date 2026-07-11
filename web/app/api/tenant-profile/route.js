import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET: fetch the current tenant's profile, if one exists — used to prefill
// the profile form so returning users see (and can edit) what they saved.
export async function GET() {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "tenant") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from("tenant_profiles")
    .select("*")
    .eq("tenant_id", dbUser.id)
    .single();

  // No profile yet is a normal state, not an error — return null, not 404.
  return Response.json(data || null);
}

// POST: create or update the tenant's profile (upsert on tenant_id).
export async function POST(req) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "tenant") {
    return new Response("Forbidden", { status: 403 });
  }

  const { preferred_location, budget_min, budget_max, move_in_date, notes } = await req.json();

  if (!preferred_location || !budget_min || !budget_max || !move_in_date) {
    return new Response("Missing required fields", { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("tenant_profiles")
    .upsert(
      { tenant_id: dbUser.id, preferred_location, budget_min, budget_max, move_in_date, notes },
      { onConflict: "tenant_id" }
    )
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });

  // Preferences changed, so any previously cached scores are stale — clear
  // them so browsing recomputes fresh scores against the new preferences.
  await supabaseAdmin.from("compatibility_scores").delete().eq("tenant_id", dbUser.id);

  return Response.json(data);
}

// DELETE: clear the tenant's saved preferences entirely.
export async function DELETE() {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "tenant") {
    return new Response("Forbidden", { status: 403 });
  }

  await supabaseAdmin.from("compatibility_scores").delete().eq("tenant_id", dbUser.id);
  const { error } = await supabaseAdmin.from("tenant_profiles").delete().eq("tenant_id", dbUser.id);
  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true });
}
