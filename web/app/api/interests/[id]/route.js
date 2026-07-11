import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendInterestDecisionEmail } from "@/lib/email";

export async function PATCH(req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return new Response("Forbidden", { status: 403 });
  }

  const { status } = await req.json();
  if (!["accepted", "declined"].includes(status)) {
    return new Response("Invalid status", { status: 400 });
  }

  const { data: interest } = await supabaseAdmin
    .from("interests")
    .select("id, listing_id, tenant_id, listings:listing_id(title, owner_id), tenant:tenant_id(email)")
    .eq("id", params.id)
    .single();

  if (!interest || interest.listings?.owner_id !== dbUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("interests")
    .update({ status })
    .eq("id", params.id);

  if (error) return new Response(error.message, { status: 500 });

  if (interest.tenant?.email) {
    await sendInterestDecisionEmail({
      tenantEmail: interest.tenant.email,
      listingTitle: interest.listings.title,
      status,
    });
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: interest.tenant_id,
    type: status === "accepted" ? "interest_accepted" : "interest_declined",
    payload: { interest_id: params.id },
  });

  return Response.json({ ok: true });
}
