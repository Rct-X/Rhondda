import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {

    const {
      name,
      email,
      businessName,
      slug
    } = JSON.parse(event.body);

    const setupUrl =
      `https://rctx.co.uk/owner-setup?b=${slug}&email=${encodeURIComponent(email)}`;

    const unsubscribeUrl =
      `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;

    // ======================================
    // IMPROVED CLAIM APPROVED EMAIL
    // ======================================

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  Your RCTX Claim Has Been Approved
</title>

<style>

body{
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

table{
  border-collapse:collapse;
}

img{
  border:0;
  display:block;
}

.wrapper{
  width:100%;
  background:#f1f5f9;
  padding:40px 16px;
}

.container{
  width:100%;
  max-width:620px;
  margin:0 auto;
  background:#ffffff;
  border-radius:28px;
  overflow:hidden;
  box-shadow:
    0 20px 60px rgba(15,23,42,.10);
}

.hero{
  background:
    linear-gradient(
      135deg,
      #0f172a 0%,
      #1e293b 100%
    );
  padding:42px 34px;
}

.logo{
  font-size:28px;
  font-weight:900;
  letter-spacing:-1px;
  color:#ffffff;
  margin:0;
}

.logo span{
  color:#3b82f6;
}

.hero-title{
  margin:28px 0 12px;
  font-size:32px;
  line-height:1.15;
  font-weight:800;
  color:#ffffff;
}

.hero-text{
  margin:0;
  font-size:15px;
  line-height:1.7;
  color:rgba(255,255,255,.82);
}

.content{
  padding:36px 34px 12px;
}

.text{
  font-size:15px;
  line-height:1.8;
  color:#475569;
  margin:0 0 18px;
}

.text strong{
  color:#0f172a;
}

.highlight{
  margin:28px 0;
  padding:24px;
  border-radius:22px;
  background:
    linear-gradient(
      180deg,
      #f8fafc 0%,
      #eff6ff 100%
    );
  border:1px solid #dbeafe;
}

.highlight-title{
  margin:0 0 16px;
  font-size:17px;
  font-weight:800;
  color:#0f172a;
}

.feature{
  margin-bottom:12px;
  font-size:14px;
  color:#334155;
}

.feature:last-child{
  margin-bottom:0;
}

.button-wrap{
  padding:10px 0 28px;
}

.btn{
  display:inline-block;
  padding:15px 28px;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1d4ed8
    );
  border-radius:999px;
  color:#ffffff !important;
  text-decoration:none;
  font-size:15px;
  font-weight:700;
}

.link-box{
  margin-top:6px;
  padding:16px;
  background:#f8fafc;
  border-radius:16px;
  border:1px solid #e2e8f0;
  word-break:break-all;
}

.link-box a{
  color:#2563eb;
  text-decoration:none;
  font-size:13px;
  line-height:1.7;
}

.footer{
  padding:28px 34px 34px;
}

.footer-inner{
  border-top:1px solid #e2e8f0;
  padding-top:22px;
}

.footer-text{
  margin:0 0 10px;
  font-size:13px;
  line-height:1.7;
  color:#64748b;
}

.footer-small{
  margin-top:18px;
  font-size:11px;
  line-height:1.7;
  color:#94a3b8;
}

.footer-small a{
  color:#64748b;
}

@media screen and (max-width:600px){

  .wrapper{
    padding:20px 10px;
  }

  .hero{
    padding:34px 24px;
  }

  .content{
    padding:28px 24px 8px;
  }

  .footer{
    padding:24px;
  }

  .hero-title{
    font-size:26px;
  }

}

</style>

</head>

<body>

<div class="wrapper">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
  >
    <tr>
      <td align="center">

        <table
          class="container"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
        >

          <!-- HERO -->
          <tr>
            <td class="hero">

              <h1 class="logo">
                RCT<span>X</span>
              </h1>

              <h2 class="hero-title">
                Your Claim Has Been Approved 🎉
              </h2>

              <p class="hero-text">
                Your business is now officially connected
                to your RCTX owner account.
              </p>

            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td class="content">

              <p class="text">
                Hi <strong>{{name}}</strong>,
              </p>

              <p class="text">
                Great news — your ownership claim for
                <strong>{{businessName}}</strong>
                has now been approved.
              </p>

              <p class="text">
                You can now finish setting up your owner
                account and start managing your business
                listing directly from your dashboard.
              </p>

              <!-- FEATURES -->
              <div class="highlight">

                <h3 class="highlight-title">
                  Once set up, you’ll be able to:
                </h3>

                <div class="feature">
                  ✅ Upload your logo and business photos
                </div>

                <div class="feature">
                  ✅ Edit contact information and description
                </div>

                <div class="feature">
                  ✅ Add website and social links
                </div>

                <div class="feature">
                  ✅ Update opening hours and services
                </div>

                <div class="feature">
                  ✅ Keep your listing fresh and professional
                </div>

              </div>

              <!-- BUTTON -->
              <div class="button-wrap">

                <a
                  href="{{setupUrl}}"
                  target="_blank"
                  class="btn"
                >
                  Set Up Owner Account
                </a>

              </div>

              <!-- LINK -->
              <div class="link-box">

                <a
                  href="{{setupUrl}}"
                  target="_blank"
                >
                  {{setupUrl}}
                </a>

              </div>

              <p
                class="text"
                style="margin-top:26px;"
              >
                If you need help with anything,
                simply reply to this email and
                we’ll help you get set up.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer">

              <div class="footer-inner">

                <p class="footer-text">
                  — <strong>The RCTX Local Network Team</strong>
                </p>

                <p class="footer-text">
                  support@rctx.co.uk
                </p>

                <p class="footer-small">
                  You received this operational email
                  because your business ownership claim
                  was approved on RCTX Local Network.
                  <br><br>

                  © 2026 RCTX Web Design & Local Network.
                  All rights reserved.
                  <br>

                  <a href="{{unsubscribeUrl}}">
                    Unsubscribe
                  </a>

                </p>

              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>

</body>
</html>
`;

    // ======================================
    // REPLACE VARIABLES
    // ======================================

    const finalHtml = htmlTemplate
      .replace(/{{name}}/g, name || "Business Owner")
      .replace(/{{businessName}}/g, businessName || "Your Business")
      .replace(/{{setupUrl}}/g, setupUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    // ======================================
    // SEND EMAIL
    // ======================================

    await resend.emails.send({
      from: "RCTX Directory <support@rctx.co.uk>",
      to: email,
      subject: "Your RCTX Business Claim Has Been Approved 🎉",
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
