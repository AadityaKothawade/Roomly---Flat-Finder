import { Webhook } from "svix";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Clerk Dashboard -> Webhooks -> add endpoint -> POST https://<your-domain>/api/webhooks/clerk
// Subscribe to: user.created, user.updated, user.deleted
export async function POST(req) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Clerk webhook verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
    // role is set later during onboarding via /api/set-role, defaults to null here
    await supabaseAdmin
      .from("users")
      .upsert(
        { clerk_id: data.id, email, name },
        { onConflict: "clerk_id" }
      );
  }

  if (type === "user.deleted") {
    await supabaseAdmin.from("users").delete().eq("clerk_id", data.id);
  }

  return new Response("ok", { status: 200 });
}
