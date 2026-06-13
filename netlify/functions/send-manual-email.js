// /.netlify/functions/manualResend.js

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async () => {

  try {

    const html = `PASTE YOUR FULL HTML HERE`;

    const response = await resend.emails.send({

      from: "RCTX Directory <support@rctx.co.uk>",

      to: "stephenprice.plumber@googlemail.com",

      subject: "We've added Stephen Price Building & Plumbing Service to RCTX 👋",

      html

    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        response
      })
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };

  }

};
