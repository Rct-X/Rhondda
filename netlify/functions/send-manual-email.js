///manual EMAILS////
const Resend = require("resend").Resend;
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  try {
    const { email, name, businessName, slug } = JSON.parse(event.body);

    const result = await resend.emails.send({
      from: "RCTX <support@rctx.co.uk>",
      to: email,
      subject: `Manual retry for ${businessName}`,
      html: `<p>Hello ${name}, this is a manual retry for ${businessName} (${slug}).</p>`
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
