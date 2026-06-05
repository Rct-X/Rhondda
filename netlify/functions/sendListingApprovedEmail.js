import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    // MUST include townSlug + categorySlug
    const { name, email, businessName, slug, townSlug, categorySlug } = JSON.parse(event.body);

    // Correct URL to the LIVE LISTING
    const listingUrl = `https://rctx.co.uk/directory/${categorySlug}/${townSlug}/${slug}`;
    const unsubscribeUrl = `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;

    // Full HTML Email Template
    let htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Your RCTX Listing Is Now Live</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
      .btn:hover { background-color: #020617 !important; }
      @media screen and (max-width: 600px) {
        .container { width: 100% !important; max-width: 100% !important; padding: 20px 16px 24px !important; }
        .mobile-padding { padding: 12px 12px !important; }
      }
    </style>
  </head>

  <body style="background-color: #f3f4f6; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <table width="100%" style="background-color: #f3f4f6;">
      <tr>
        <td class="mobile-padding" align="center" style="padding: 24px 12px;">

          <table class="container" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; padding: 24px 20px 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);">

            <tr>
              <td style="font-size: 22px; font-weight: 700; color: #111827; padding-bottom: 12px;">
                Your Listing Is Now Live 🎉
              </td>
            </tr>

            <tr>
              <td style="font-size: 15px; color: #374151; padding-bottom: 12px;">
                Hi <strong>{{name}}</strong>,
              </td>
            </tr>

            <tr>
              <td style="font-size: 15px; color: #374151; padding-bottom: 12px;">
                Great news — your business,
                <strong>{{businessName}}</strong>,
                has been approved and is now live on the RCTX Directory.
              </td>
            </tr>

            <tr>
              <td style="font-size: 15px; color: #374151; padding-bottom: 22px;">
                You can view your listing using the button below.  
                From there, you can click <strong>"Claim this business"</strong> to take ownership.
              </td>
            </tr>

            <tr>
              <td style="padding-bottom: 18px;">
                <table role="presentation">
                  <tr>
                    <td align="center" bgcolor="#111827" style="border-radius: 999px;">
                      <a href="{{listingUrl}}" target="_blank"
                        style="display: inline-block; padding: 10px 20px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 999px;">
                        View Your Listing
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="font-size: 14px; color: #374151; padding-bottom: 22px;">
                Or copy and paste this link:<br>
                <a href="{{listingUrl}}" target="_blank" style="color: #2563eb; word-break: break-all;">
                  {{listingUrl}}
                </a>
              </td>
            </tr>

            <tr>
              <td style="font-size: 15px; color: #374151; padding-bottom: 18px;">
                If you need any help at all, just reply to this email — we’re here to support you.
              </td>
            </tr>

            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 18px; font-size: 13px; color: #6b7280;">
                — <strong>The RCTX Directory Team</strong><br>
                <a href="mailto:support@rctx.co.uk" style="color: #6b7280;">support@rctx.co.uk</a>

                <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">
                  You received this email because your business listing was approved.<br>
                  © 2026 RCTX Directory. All rights reserved.
                  <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
`;

    // Replace placeholders
    const finalHtml = htmlTemplate
      .replace(/{{name}}/g, name || "Business Owner")
      .replace(/{{businessName}}/g, businessName || "Your Business")
      .replace(/{{listingUrl}}/g, listingUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    // Send email
    await resend.emails.send({
      from: "RCTX Directory <support@rctx.co.uk>",
      to: email,
      subject: "Your RCTX Listing Is Now Live 🎉",
      html: finalHtml
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email sent" })
    };

  } catch (err) {
    console.error("EMAIL ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
}
