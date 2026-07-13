const BRAND = {
  ink: "#12213A",
  parchment: "#F6F1E7",
  moss: "#3F6B4E",
  brass: "#B08D57",
  linen: "#EDE6D6",
};

export function roomlyFromAddress() {
  const email = process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev";
  if (email.includes("<")) return email;
  return `Roomly <${email}>`;
}

export function roomlyEmailLayout({ preheader, title, bodyHtml, ctaLabel, ctaUrl }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.parchment};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || title}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.parchment};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(18,33,58,0.08);border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 20px;background:linear-gradient(135deg,${BRAND.ink} 0%,#1a3348 100%);">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:${BRAND.parchment};letter-spacing:-0.02em;">
                Roomly
              </div>
              <div style="margin-top:6px;font-size:12px;color:rgba(246,241,231,0.7);font-style:italic;">
                matched by fit, not just filters
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:${BRAND.ink};">
                ${title}
              </h1>
              <div style="font-size:15px;line-height:1.65;color:rgba(18,33,58,0.85);">
                ${bodyHtml}
              </div>
              ${
                ctaLabel && ctaUrl
                  ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:6px;background:${BRAND.ink};">
                    <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:${BRAND.parchment};text-decoration:none;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(18,33,58,0.08);background:${BRAND.linen};">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:rgba(18,33,58,0.55);">
                You're receiving this because you have an account on Roomly.
              </p>
              <p style="margin:0;font-size:12px;color:rgba(18,33,58,0.45);">
                <a href="${baseUrl}" style="color:${BRAND.moss};text-decoration:none;">roomly.app</a>
                &nbsp;&middot;&nbsp; Find the room — and the flatmate — that actually fits
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function scoreBadgeHtml(score) {
  const color = score >= 80 ? BRAND.moss : score >= 60 ? BRAND.brass : BRAND.ink;
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${color}15;color:${color};font-size:13px;font-weight:600;">
    ${score}/100 match
  </span>`;
}
