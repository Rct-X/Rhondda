import { Resend } from "resend";
import admin from "firebase-admin";

// ======================================
// FIREBASE INIT
// ======================================

if (!admin.apps.length) {

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.RN_FIREBASE_PROJECT_ID,
      clientEmail: process.env.RN_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.RN_FIREBASE_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      )
    })
  });

}

const db = admin.firestore();

// ======================================
// RESEND
// ======================================

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function handler(event) {

  let logRef = null;

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
      `https://rctx.co.uk/directory/${categorySlug}/${townSlug}/${slug}`;

    const unsubscribeUrl =
      `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;

    // ======================================
    // SAFE-HOUR SCHEDULING
    // ======================================

    const now = new Date();
    const hour = now.getHours();

    let scheduledAt = null;

    if (hour < 9 || hour >= 20) {

      const sendTime = new Date();

      sendTime.setHours(9, 0, 0, 0);

      if (hour >= 20) {
        sendTime.setDate(
          sendTime.getDate() + 1
        );
      }

      scheduledAt =
        sendTime.toISOString();
    }

    // ======================================
    // CREATE FIRESTORE LOG
    // ======================================

    logRef = await db
      .collection("emailLogs")
      .add({

        type: "business-added",

        status: scheduledAt
          ? "scheduled"
          : "sending",

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),

        recipient: email,

        name: name || "",

        businessName:
          businessName || "",

        slug: slug || "",

        townSlug:
          townSlug || "",

        categorySlug:
          categorySlug || "",

        listingUrl,

        scheduledAt:
          scheduledAt || null

      });

    // ======================================
    // EMAIL TEMPLATE
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
  We've Added Your Business to RCTX
</title>

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
  background:#f1f5f9;
  padding:32px 14px;
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
      #0f172a,
      #1e293b
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
  color:#3b82f6;
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
  color:rgba(255,255,255,.82);
}

.hero-small{
  margin-top:16px !important;
  font-size:13px !important;
  color:rgba(255,255,255,.66) !important;
}

.content{
  padding:34px 28px 30px;
}

.greeting{
  font-size:16px;
  color:#334155;
  margin:0 0 20px;
}

.text{
  font-size:16px;
  line-height:1.8;
  color:#475569;
  margin:0 0 18px;
}

.text strong{
  color:#0f172a;
}

.highlight-box{
  background:
    linear-gradient(
      135deg,
      rgba(37,99,235,.08),
      rgba(59,130,246,.04)
    );

  border:1px solid rgba(37,99,235,.12);

  border-radius:18px;

  padding:22px;

  margin:30px 0;
}

.highlight-box h3{
  margin:0 0 12px;
  font-size:18px;
  color:#0f172a;
}

.highlight-box p{
  margin:0;
  font-size:15px;
  line-height:1.8;
  color:#475569;
}

.button-wrap{
  text-align:center;
  padding:12px 0 30px;
}

.button{
  display:inline-block;

  padding:16px 28px;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1d4ed8
    );

  color:#ffffff !important;

  text-decoration:none;

  border-radius:999px;

  font-size:15px;
  font-weight:700;

  box-shadow:
    0 10px 25px rgba(37,99,235,.28);
}

.link-box{
  background:#f8fafc;
  border:1px solid #e2e8f0;
  border-radius:16px;
  padding:16px;
  margin-top:12px;
  word-break:break-word;
}

.link-box a{
  color:#2563eb;
  font-size:14px;
  text-decoration:none;
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

      <p class="hero-small">
        Supporting local businesses across
        Rhondda Cynon Taf & the South Wales Valleys
      </p>

      <h1>
        We've Added Your Business 👋
      </h1>

      <p>
        Sorry to drop in unannounced —
        we’ve added your business to the
        RCTX Directory to help more local
        people discover trusted businesses
        across the Valleys.
      </p>

    </div>

    <!-- CONTENT -->
    <div class="content">

      <p class="greeting">
        Hi <strong>{{name}}</strong>,
      </p>

      <p class="text">

        We recently added
        <strong>{{businessName}}</strong>
        to the RCTX Directory —
        a growing local platform helping
        people across Rhondda Cynon Taf
        discover trusted local trades,
        shops and services nearby.

      </p>

      <p class="text">

        The listing is completely free
        and gives local customers another
        place to discover your business online.

      </p>

      <p class="text">

        We know business owners are busy,
        so we’ve already created the page
        to save you the hassle.

      </p>

      <!-- CLAIM BOX -->
      <div class="highlight-box">

        <h3>
          Want Control Of The Listing?
        </h3>

        <p>

          You can claim ownership of the
          page in under a minute using the
          <strong>
            "Claim this business"
          </strong>
          button directly on the listing.

          <br><br>

          Once claimed, you’ll be able to
          upload photos, edit details,
          add social links and keep the
          page updated yourself.

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

      <!-- LINK -->
      <div class="link-box">

        <a
          href="{{listingUrl}}"
          target="_blank"
        >
          {{listingUrl}}
        </a>

      </div>

      <p
        class="text"
        style="margin-top:28px;"
      >

        If anything needs changing,
        or you'd rather we update the
        listing for you, just reply to
        this email and we'll sort it.

      </p>

      <p class="text">

        Thanks for supporting local 👍

      </p>

    </div>

    <!-- FOOTER -->
    <div class="footer">

      <p>
        <strong>RCTX Directory</strong><br>
        Helping local businesses get found online.
      </p>

      <p>
        Email:
        <a href="mailto:support@rctx.co.uk">
          support@rctx.co.uk
        </a>
      </p>

      <p class="small">
        You received this email because
        your business was added to the
        RCTX Directory.
      </p>

      <p class="small">
        © 2026 RCTX Directory.
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

    const resendResponse =
      await resend.emails.send({

        from:
          "RCTX Directory <support@rctx.co.uk>",

        to: email,

        subject:
          `We've added ${businessName} to RCTX 👋`,

        html: finalHtml,

        ...(scheduledAt && {
          scheduled_at: scheduledAt
        })

      });

    // ======================================
    // UPDATE SUCCESS LOG
    // ======================================

    await logRef.update({

      status: scheduledAt
        ? "scheduled"
        : "sent",

      resendId:
        resendResponse.data?.id || null,

      resendResponse,

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()

    });

    return {

      statusCode: 200,

      body: JSON.stringify({

        success: true,

        message:
          scheduledAt
            ? "Email scheduled"
            : "Email sent",

        logId: logRef.id

      })

    };

  } catch (err) {

    console.error(
      "EMAIL ERROR:",
      err
    );

    // ======================================
    // UPDATE FAILED LOG
    // ======================================

    if (logRef) {

      await logRef.update({

        status: "failed",

        error: err.message,

        errorStack:
          err.stack || null,

        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()

      });

    } else {

      // If logging failed before logRef existed
      try {

        await db
          .collection("emailLogs")
          .add({

            type: "business-added",

            status: "failed",

            error: err.message,

            errorStack:
              err.stack || null,

            createdAt:
              admin.firestore.FieldValue.serverTimestamp()

          });

      } catch (firestoreErr) {

        console.error(
          "FIRESTORE LOG ERROR:",
          firestoreErr
        );

      }

    }

    return {

      statusCode: 500,

      body: JSON.stringify({

        success: false,

        error: err.message

      })

    };

  }

}
