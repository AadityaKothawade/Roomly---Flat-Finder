import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTopMatchesEmail } from "@/lib/email";
import { getTopMatchesForTenant } from "@/lib/topMatches";

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

  return Response.json(data || null);
}

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
  // them so both browsing and the top-matches email below use fresh scores.
  await supabaseAdmin.from("compatibility_scores").delete().eq("tenant_id", dbUser.id);

  // Compute top 3 matches against currently open listings and email them.
  // Wrapped so a scoring/email failure never breaks the profile save itself.
  try {
    const topMatches = await getTopMatchesForTenant(dbUser.id, data);
    if (dbUser.email) {
      await sendTopMatchesEmail({
        tenantEmail: dbUser.email,
        tenantName: dbUser.name,
        matches: topMatches,
      });
    }
  } catch (err) {
    console.error("Failed to compute/send top matches:", err.message);
  }

  return Response.json(data);
}

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