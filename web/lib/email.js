import { Resend } from "resend";
import { roomlyEmailLayout, roomlyFromAddress, scoreBadgeHtml } from "./emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = roomlyFromAddress();

function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export async function sendInterestEmail({ ownerEmail, tenantName, listingTitle, score, explanation }) {
  const isStrongMatch = typeof score === "number" && score >= 80;
  const scoreBlock =
    typeof score === "number"
      ? `<p style="margin:16px 0;">${scoreBadgeHtml(score)}</p>${
          explanation
            ? `<p style="margin:0 0 16px;padding:12px 16px;background:#EDE6D6;border-radius:6px;font-size:14px;color:rgba(18,33,58,0.75);">${explanation}</p>`
            : ""
        }`
      : "";

  const bodyHtml = `
    <p>Hi there,</p>
    <p><strong>${tenantName}</strong> just expressed interest in your listing <strong>"${listingTitle}"</strong>.</p>
    ${scoreBlock}
    <p>${
      isStrongMatch
        ? "This looks like a strong match based on their preferences — worth reviewing soon."
        : "Review their profile and compatibility details to decide whether to accept or decline."
    }</p>
    <p style="margin-top:20px;color:rgba(18,33,58,0.6);font-size:14px;">
      Log in to your owner dashboard to respond. Accepted tenants can chat with you directly in Roomly.
    </p>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: isStrongMatch
        ? `Strong match (${score}/100) — ${tenantName} is interested in "${listingTitle}"`
        : `New interest in "${listingTitle}" from ${tenantName}`,
      html: roomlyEmailLayout({
        preheader: `${tenantName} wants to connect about "${listingTitle}"`,
        title: isStrongMatch ? "You have a strong match!" : "Someone's interested in your room",
        bodyHtml,
        ctaLabel: "Review in Roomly",
        ctaUrl: appUrl("/owner/dashboard"),
      }),
    });
    if (error) console.error("Resend error (interest email):", error.message || error);
  } catch (err) {
    console.error("Failed to send interest email:", err.message);
  }
}

export async function sendInterestDecisionEmail({ tenantEmail, tenantName, listingTitle, status }) {
  const accepted = status === "accepted";
  const greeting = tenantName ? `Hi ${tenantName},` : "Hi there,";

  const bodyHtml = accepted
    ? `
      <p>${greeting}</p>
      <p>Great news — the owner <strong>accepted</strong> your interest in <strong>"${listingTitle}"</strong>.</p>
      <p>You can now chat with them directly in Roomly to ask questions, arrange a viewing, and discuss move-in details.</p>
      <p style="margin-top:20px;color:rgba(18,33,58,0.6);font-size:14px;">
        Tip: Introduce yourself and mention your move-in timeline to get the conversation started.
      </p>`
    : `
      <p>${greeting}</p>
      <p>The owner wasn't able to move forward with your interest in <strong>"${listingTitle}"</strong> this time.</p>
      <p>Don't worry — Roomly scores every listing against your preferences, so there are more matches waiting for you.</p>
      <p style="margin-top:20px;color:rgba(18,33,58,0.6);font-size:14px;">
        Update your preferences anytime to refresh your compatibility scores across all listings.
      </p>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: tenantEmail,
      subject: accepted
        ? `You're in! "${listingTitle}" accepted your interest`
        : `Update on "${listingTitle}" — keep browsing on Roomly`,
      html: roomlyEmailLayout({
        preheader: accepted
          ? `Start chatting about "${listingTitle}" on Roomly`
          : `Your interest in "${listingTitle}" wasn't accepted — more matches await`,
        title: accepted ? "Your interest was accepted" : "Thanks for your interest",
        bodyHtml,
        ctaLabel: accepted ? "Open chat" : "Browse more rooms",
        ctaUrl: accepted ? appUrl("/listings") : appUrl("/listings"),
      }),
    });
    if (error) console.error("Resend error (decision email):", error.message || error);
  } catch (err) {
    console.error("Failed to send interest-decision email:", err.message);
  }
}

export async function sendTopMatchesEmail({ tenantEmail, tenantName, matches }) {
  if (!matches || matches.length === 0) return;

  const greeting = tenantName ? `Hi ${tenantName},` : "Hi there,";

  const matchCards = matches
    .map(({ listing, score }) => {
      const estimated = score.source === "fallback" ? ' <span style="color:rgba(18,33,58,0.45);font-size:12px;">(estimated)</span>' : "";
      return `
        <div style="margin-bottom:16px;padding:16px;background:#EDE6D6;border-radius:6px;border:1px solid rgba(18,33,58,0.06);">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:600;color:#12213A;margin-bottom:6px;">
            ${listing.title}
          </div>
          <div style="font-size:14px;color:rgba(18,33,58,0.7);margin-bottom:10px;">
            ${listing.location} &middot; &#8377;${Number(listing.rent).toLocaleString("en-IN")}/mo
          </div>
          <div style="margin-bottom:10px;">${scoreBadgeHtml(score.score)}${estimated}</div>
          ${
            score.explanation
              ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:rgba(18,33,58,0.65);">${score.explanation}</p>`
              : ""
          }
          <a href="${appUrl(`/listings/${listing.id}`)}" style="font-size:14px;font-weight:600;color:#3F6B4E;text-decoration:none;">
            View listing &rarr;
          </a>
        </div>`;
    })
    .join("");

  const bodyHtml = `
    <p>${greeting}</p>
    <p>We saved your preferences and scored every open listing. Here ${
      matches.length === 1 ? "is your top match" : `are your top ${matches.length} matches`
    }:</p>
    ${matchCards}
    <p style="margin-top:8px;font-size:14px;color:rgba(18,33,58,0.65);">
      Express interest on any listing to connect with the owner. Strong matches (80+) get priority attention.
    </p>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: tenantEmail,
      subject: `Your top ${matches.length} room match${matches.length === 1 ? "" : "es"} on Roomly`,
      html: roomlyEmailLayout({
        preheader: `${matches.length} listing${matches.length === 1 ? "" : "s"} scored against your preferences`,
        title: matches.length === 1 ? "We found a great match for you" : "Your personalised room matches",
        bodyHtml,
        ctaLabel: "See all listings",
        ctaUrl: appUrl("/listings"),
      }),
    });
    if (error) console.error("Resend error (top-matches email):", error.message || error);
  } catch (err) {
    console.error("Failed to send top-matches email:", err.message);
  }
}
