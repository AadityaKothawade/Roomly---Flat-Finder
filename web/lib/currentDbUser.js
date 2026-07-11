import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "./supabaseAdmin";

// Returns the Supabase `users` row for the signed-in Clerk user.
// If no row exists yet (first time this user has ever been seen by the app),
// it's created right here — no Clerk webhook required. This is simpler than
// webhook-based sync for local dev / demos, at the cost of the row only
// being created on first authenticated request rather than immediately at
// signup. Good enough since every real user action goes through this first.
export async function currentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single();

  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({ clerk_id: userId, email, name })
    .select()
    .single();

  if (error) {
    console.error("Failed to auto-create db user:", error.message);
    return null;
  }

  return created;
}
