import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev";

// Notifies the owner whenever a tenant expresses interest, regardless of
// score. The framing/subject changes for a strong match (score > 80) vs a
// regular one, but the email always goes out — the app's job is to make sure
// owners never miss an interested tenant.
export async function sendInterestEmail({ ownerEmail, tenantName, listingTitle, score }) {
  const isStrongMatch = typeof score === "number" && score > 80;
  const scoreLine =
    typeof score === "number"
      ? `<p>Compatibility score: <strong>${score}/100</strong></p>`
      : "";

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: isStrongMatch
        ? `Strong match (${score}/100) for "${listingTitle}"`
        : `New interest in "${listingTitle}"`,
      html: `<p><strong>${tenantName}</strong> just expressed interest in your listing "<strong>${listingTitle}</strong>".</p>
             ${scoreLine}
             <p>Log in to review and respond.</p>`,
    });
    if (error) console.error("Resend returned an error sending interest email:", error.message || error);
  } catch (err) {
    console.error("Failed to send interest email:", err.message);
  }
}

export async function sendInterestDecisionEmail({ tenantEmail, listingTitle, status }) {
  const verb = status === "accepted" ? "accepted" : "declined";
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: tenantEmail,
      subject: `Your interest in "${listingTitle}" was ${verb}`,
      html:
        status === "accepted"
          ? `<p>Good news — the owner <strong>accepted</strong> your interest in "${listingTitle}". You can now chat with them in the app.</p>`
          : `<p>The owner <strong>declined</strong> your interest in "${listingTitle}". Keep browsing — there are more listings waiting for you.</p>`,
    });
    if (error) console.error("Resend returned an error sending decision email:", error.message || error);
  } catch (err) {
    console.error("Failed to send interest-decision email:", err.message);
  }
}
