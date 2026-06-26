import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {

  try {

    const {
      name,
      email,
      businessName,
      slug,
      townSlug,
      categorySlug
    } = JSON.parse(event.body);

    // ======================================
    // URLS
    // ======================================

    const listingUrl =
      `https://rctx.co.uk/local/${categorySlug}/${townSlug}/${slug}`;

    const unsubscribeUrl =
      `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;

    // ======================================
    // EMAIL TEMPLATE
    // ======================================

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Your RCTX Listing Is Live</title>

<style>

body{
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.wrapper{
  width:100%;
  padding:32px 14px;
  background:#f1f5f9;
  box-sizing:border-box;
}

.container{
  max-width:620px;
  margin:auto;
  background:#ffffff;
  border-radius:24px;
  overflow:hidden;
  box-shadow:
    0 20px 50px rgba(15,23,42,.08);
}

.hero{
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1d4ed8
    );

  padding:42px 28px;
  text-align:center;
}

.logo{
  font-size:34px;
  font-weight:900;
  letter-spacing:-1px;
  color:#ffffff;
  margin-bottom:10px;
}

.logo span{
  color:#bfdbfe;
}

.hero h1{
  margin:0;
  font-size:30px;
  line-height:1.15;
  color:#ffffff;
  font-weight:800;
}

.hero p{
  margin:14px 0 0;
  font-size:16px;
  line-height:1.7;
  color:rgba(255,255,255,.88);
}

.content{
  padding:34px 28px 30px;
}

.greeting{
  margin:0 0 22px;
  font-size:16px;
  color:#334155;
}

.text{
  margin:0 0 18px;
  font-size:16px;
  line-height:1.8;
  color:#475569;
}

.success-box{
  background:
    linear-gradient(
      135deg,
      rgba(34,197,94,.08),
      rgba(22,163,74,.05)
    );

  border:1px solid rgba(34,197,94,.12);

  border-radius:18px;

  padding:20px;
  margin:28px 0;
}

.success-box h3{
  margin:0 0 10px;
  font-size:18px;
  color:#0f172a;
}

.success-box p{
  margin:0;
  font-size:15px;
  line-height:1.7;
  color:#475569;
}

.button-wrap{
  text-align:center;
  padding:8px 0 28px;
}

.button{
  display:inline-block;

  padding:16px 28px;

  background:
    linear-gradient(
      135deg,
      #0f172a,
      #1e293b
    );

  color:#ffffff !important;

  text-decoration:none;

  border-radius:999px;

  font-size:15px;
  font-weight:700;

  box-shadow:
    0 10px 25px rgba(15,23,42,.22);
}

.link-box{
  margin-top:10px;

  padding:16px;

  background:#f8fafc;

  border:1px solid #e2e8f0;

  border-radius:16px;

  word-break:break-word;
}

.link-box a{
  color:#2563eb;
  text-decoration:none;
  font-size:14px;
}

.footer{
  border-top:1px solid #e2e8f0;
  padding:24px 28px 28px;
}

.footer p{
  margin:0 0 12px;
  font-size:13px;
  line-height:1.7;
  color:#64748b;
}

.footer a{
  color:#64748b;
}

.small{
  font-size:11px !important;
  color:#94a3b8 !important;
}

@media screen and (max-width:600px){

  .wrapper{
    padding:14px;
  }

  .hero{
    padding:34px 22px;
  }

  .hero h1{
    font-size:24px;
  }

  .content{
    padding:28px 20px 24px;
  }

  .footer{
    padding:22px 20px 24px;
  }

  .button{
    display:block;
    width:100%;
    box-sizing:border-box;
  }

}

</style>

</head>

<body>

<div class="wrapper">

  <div class="container">

    <!-- HERO -->
    <div class="hero">

      <div class="logo">
        RCT<span>X</span>
      </div>

      <h1>
        Your Listing Is Now Live 🎉
      </h1>

      <p>
        Your business has been approved
        and is now visible on the
        RCTX Local Network.
      </p>

    </div>

    <!-- CONTENT -->
    <div class="content">

      <p class="greeting">
        Hi <strong>{{name}}</strong>,
      </p>

      <p class="text">
        Great news —
        <strong>{{businessName}}</strong>
        has officially been approved
        and published on the
        RCTX Network.
      </p>

      <p class="text">
        Local customers can now discover
        your business, view your details,
        and contact you directly through
        your listing.
      </p>

      <div class="success-box">

        <h3>
          Take Ownership Of Your Listing
        </h3>

        <p>
          You can manage and update your
          business profile anytime by
          clicking the
          <strong>
            "Claim this business"
          </strong>
          button on your listing page.
        </p>

      </div>

      <!-- BUTTON -->
      <div class="button-wrap">

        <a
          href="{{listingUrl}}"
          target="_blank"
          class="button"
        >
          View Your Listing
        </a>

      </div>

      <!-- URL -->
      <div class="link-box">

        <a
          href="{{listingUrl}}"
          target="_blank"
        >
          {{listingUrl}}
        </a>

      </div>

      <p class="text" style="margin-top:28px;">
        If you need any updates, edits,
        or support with your listing,
        simply reply to this email and
        we'll help you out.
      </p>

    </div>

    <!-- FOOTER -->
    <div class="footer">

      <p>
        <strong>RCTX Local Network</strong><br>
        Helping local businesses grow online.
      </p>

      <p>
        Email:
        <a href="mailto:support@rctx.co.uk">
          support@rctx.co.uk
        </a>
      </p>

      <p class="small">
        You received this email because
        your business listing was approved
        on the RCTX Local Network.
      </p>

      <p class="small">
        © 2026 RCTX Web Design & Local Network.
        All rights reserved.
      </p>

      <p class="small">
        <a href="{{unsubscribeUrl}}">
          Unsubscribe
        </a>
      </p>

    </div>

  </div>

</div>

</body>
</html>
`;

    // ======================================
    // REPLACE VARIABLES
    // ======================================

    const finalHtml = htmlTemplate

      .replace(
        /{{name}}/g,
        name || "Business Owner"
      )

      .replace(
        /{{businessName}}/g,
        businessName || "Your Business"
      )

      .replace(
        /{{listingUrl}}/g,
        listingUrl
      )

      .replace(
        /{{unsubscribeUrl}}/g,
        unsubscribeUrl
      );

    // ======================================
    // SEND EMAIL
    // ======================================

    await resend.emails.send({

      from:
        "RCTX Local <support@rctx.co.uk>",

      to: email,

      subject:
        "Your RCTX Listing Is Now Live 🎉",

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

    console.error(
      "EMAIL ERROR:",
      err
    );

    return {

      statusCode: 500,

      body: JSON.stringify({
        success: false,
        error: err.message
      })

    };

  }

}
