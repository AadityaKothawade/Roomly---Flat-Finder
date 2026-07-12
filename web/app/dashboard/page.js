import { redirect } from "next/navigation";
import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";


// A single, stable landing spot after sign-in. Routes each person to the
// right place instead of dropping everyone on the same generic page —
// this is the fix for "confusing to navigate": one predictable entry point
// that branches by role/setup-state, rather than users having to guess
// where to go next.
export const dynamic = "force-dynamic";

export default async function DashboardRedirect() {
  const dbUser = await currentDbUser();

  if (!dbUser) redirect("/sign-in");
  if (!dbUser.role) redirect("/onboarding");

  if (dbUser.role === "owner") redirect("/owner/dashboard");

  if (dbUser.role === "tenant") {
    const { data: profile } = await supabaseAdmin
      .from("tenant_profiles")
      .select("id")
      .eq("tenant_id", dbUser.id)
      .single();
    redirect(profile ? "/listings" : "/tenant/profile");
  }

  redirect("/listings");
}
