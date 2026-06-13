const Resend = require("resend").Resend;
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  try {
    const {
      name,
      email,
      businessName,
      slug,
      townSlug,
      categorySlug
    } = JSON.parse(event.body);

    const listingUrl = `https://rctx.co.uk/directory/${categorySlug}/${townSlug}/${slug}`;
    const unsubscribeUrl = `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(email)}`;

    // Load your full HTML template here (same as original)
    const htmlTemplate = `YOUR FULL TEMPLATE HERE`;

    const finalHtml = htmlTemplate
      .replace(/{{name}}/g, name || "Business Owner")
      .replace(/{{businessName}}/g, businessName || "Your Business")
      .replace(/{{listingUrl}}/g, listingUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const result = await resend.emails.send({
      from: "RCTX Directory <support@rctx.co.uk>",
      to: email,
      subject: `We've added ${businessName} to RCTX 👋`,
      html: finalHtml
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
