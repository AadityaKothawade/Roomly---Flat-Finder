import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev";

export async function sendInterestEmail({ ownerEmail, tenantName, listingTitle, score }) {
  const isStrongMatch = typeof score === "number" && score > 80;
  const scoreLine = typeof score === "number" ? `<p>Compatibility score: <strong>${score}/100</strong></p>` : "";
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: isStrongMatch ? `Strong match (${score}/100) for "${listingTitle}"` : `New interest in "${listingTitle}"`,
      html: `<p><strong>${tenantName}</strong> just expressed interest in your listing "<strong>${listingTitle}</strong>".</p>${scoreLine}<p>Log in to review and respond.</p>`,
    });
    if (error) console.error("Resend error (interest email):", error.message || error);
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
    if (error) console.error("Resend error (decision email):", error.message || error);
  } catch (err) {
    console.error("Failed to send interest-decision email:", err.message);
  }
}

// Emails the tenant their top 3 AI-matched listings whenever they save their
// preferences. Uses whatever base URL is configured so the "view listing"
// links actually work in both local dev and production.
export async function sendTopMatchesEmail({ tenantEmail, tenantName, matches }) {
  if (!matches || matches.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const rows = matches
    .map(
      ({ listing, score }) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #eee;">
            <strong>${listing.title}</strong><br/>
            ${listing.location} &middot; &#8377;${listing.rent}/mo<br/>
            <span style="color:#3F6B4E;">${score.score}/100 match</span>${
              score.source === "fallback" ? " (estimated)" : ""
            }<br/>
            <a href="${baseUrl}/listings/${listing.id}">View listing &rarr;</a>
          </td>
        </tr>`
    )
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: tenantEmail,
      subject: `Your top ${matches.length} room match${matches.length === 1 ? "" : "es"} on Roomly`,
      html: `
        <p>Hi ${tenantName || "there"},</p>
        <p>Based on your saved preferences, here ${matches.length === 1 ? "is your top match" : "are your top matches"} on Roomly:</p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="margin-top:18px;"><a href="${baseUrl}/listings">Log in to Roomly to see all listings &rarr;</a></p>
      `,
    });
    if (error) console.error("Resend error (top-matches email):", error.message || error);
  } catch (err) {
    console.error("Failed to send top-matches email:", err.message);
  }
}