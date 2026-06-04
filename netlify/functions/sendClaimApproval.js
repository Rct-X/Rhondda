import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    const { name, email, businessName, slug } = JSON.parse(event.body);

    const setupUrl = `https://rctx.co.uk/owner-setup?b=${slug}&email=${email}`;
    const unsubscribeUrl = `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;

    // Full HTML Email Template
    let htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Your RCTX Business Claim Has Been Approved</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <!--[if mso]>
    <style type="text/css">
      body, table, td, p, a, li {
        font-family: Arial, Helvetica, sans-serif !important;
      }
    </style>
    <![endif]-->

    <style type="text/css">
      body, table, td, a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }

      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }

      img {
        -ms-interpolation-mode: bicubic;
      }

      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }

      table {
        border-collapse: collapse !important;
      }

      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }

      .btn:hover {
        background-color: #020617 !important;
      }

      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 20px 16px 24px !important;
        }

        .mobile-padding {
          padding: 12px 12px !important;
        }
      }
    </style>
  </head>

  <body style="background-color: #f3f4f6; margin: 0 !important; padding: 0 !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f3f4f6;">
      <tr>
        <td class="mobile-padding" align="center" style="padding: 24px 12px;">

          <!--[if mso]>
          <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
              <td align="center" valign="top" width="600">
          <![endif]-->

          <table class="container" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; padding: 24px 20px 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);">

            <!-- Heading -->
            <tr>
              <td align="left" style="font-size: 22px; font-weight: 700; line-height: 1.3; color: #111827; padding-bottom: 12px;">
                Welcome to RCTX 🎉
              </td>
            </tr>

            <!-- Salutation -->
            <tr>
              <td align="left" style="font-size: 15px; line-height: 1.6; color: #374151; padding-bottom: 12px;">
                Hi <strong style="font-weight: 600; color: #111827;">{{name}}</strong>,
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td align="left" style="font-size: 15px; line-height: 1.6; color: #374151; padding-bottom: 12px;">
                Great news — your claim for
                <strong style="font-weight: 600; color: #111827;">{{businessName}}</strong>
                has been approved and your listing is now officially part of the RCTX Directory.
              </td>
            </tr>

            <tr>
              <td align="left" style="font-size: 15px; line-height: 1.6; color: #374151; padding-bottom: 22px;">
                Thank you for joining our growing community of local businesses.
                We're excited to have you on board.
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="left" style="padding-bottom: 18px;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center" bgcolor="#111827" style="border-radius: 999px;">
                      <a
                        class="btn"
                        href="{{setupUrl}}"
                        target="_blank"
                        style="display: inline-block; padding: 10px 20px; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none; border-radius: 999px; line-height: 100%;"
                      >
                        Set Up Your Owner Account
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Fallback URL -->
            <tr>
              <td align="left" style="font-size: 14px; line-height: 1.5; color: #374151; padding-bottom: 22px;">
                Or copy and paste this link into your browser:<br>
                <a
                  href="{{setupUrl}}"
                  target="_blank"
                  style="color: #2563eb; text-decoration: underline; word-break: break-all;"
                >
                  {{setupUrl}}
                </a>
              </td>
            </tr>

            <!-- Features -->
            <tr>
              <td align="left" style="font-size: 15px; line-height: 1.6; color: #374151; padding-bottom: 10px;">
                Once your account is set up, you’ll be able to:
              </td>
            </tr>

            <tr>
              <td align="left" style="padding-bottom: 22px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">

                  <tr>
                    <td valign="top" width="20" style="font-size: 14px; color: #374151; line-height: 1.6;">•</td>
                    <td style="font-size: 14px; color: #374151; line-height: 1.6;">Add your business logo</td>
                  </tr>

                  <tr>
                    <td valign="top" width="20" style="font-size: 14px; color: #374151; line-height: 1.6;">•</td>
                    <td style="font-size: 14px; color: #374151; line-height: 1.6;">Upload up to 3 photos</td>
                  </tr>

                  <tr>
                    <td valign="top" width="20" style="font-size: 14px; color: #374151; line-height: 1.6;">•</td>
                    <td style="font-size: 14px; color: #374151; line-height: 1.6;">Update your business details</td>
                  </tr>

                  <tr>
                    <td valign="top" width="20" style="font-size: 14px; color: #374151; line-height: 1.6;">•</td>
                    <td style="font-size: 14px; color: #374151; line-height: 1.6;">Manage opening hours</td>
                  </tr>

                  <tr>
                    <td valign="top" width="20" style="font-size: 14px; color: #374151; line-height: 1.6;">•</td>
                    <td style="font-size: 14px; color: #374151; line-height: 1.6;">Add your website and social links</td>
                  </tr>

                  <tr>
                    <td valign="top" width="20" style="font-size: 14px; color: #374151; line-height: 1.6;">•</td>
                    <td style="font-size: 14px; color: #374151; line-height: 1.6;">Keep your listing looking fresh and professional</td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- Support -->
            <tr>
              <td align="left" style="font-size: 15px; line-height: 1.6; color: #374151; padding-bottom: 18px;">
                If you need any help at all, just reply to this email — we’re here to support you.
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="left" style="border-top: 1px solid #e5e7eb; padding-top: 18px; font-size: 13px; line-height: 1.6; color: #6b7280;">

                — <strong style="font-weight: 600; color: #111827;">The RCTX Directory Team</strong><br>

                <a
                  href="mailto:support@rctx.co.uk"
                  style="color: #6b7280; text-decoration: none;"
                >
                  support@rctx.co.uk
                </a>

                <p style="margin: 16px 0 0 0; font-size: 11px; line-height: 1.4; color: #9ca3af;">
                  You received this mandatory operational email because your business claim was approved.<br>
                  © 2026 RCTX Directory. All rights reserved.
                  <a
                    href="{{unsubscribeUrl}}"
                    style="color: #6b7280; text-decoration: underline;"
                  >
                    Unsubscribe
                  </a>
                </p>

              </td>
            </tr>

          </table>

          <!--[if mso]>
              </td>
            </tr>
          </table>
          <![endif]-->

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
      .replace(/{{setupUrl}}/g, setupUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    // Send email
    await resend.emails.send({
      from: "RCTX Directory <support@rctx.co.uk>",
      to: email,
      subject: "Your RCTX Business Claim Has Been Approved",
      html: finalHtml
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email sent"
      })
    };

  } catch (err) {
    console.error("EMAIL ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
}
