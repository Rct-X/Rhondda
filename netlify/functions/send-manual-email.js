import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event, context) {
  try {
    const data = await resend.emails.send({
      from: 'RCTX SUPPORT <support@rctx.co.uk>',
      to: 'lee0472@live.co.uk',
      subject: 'Updated Link to Your RCTX Listing',
      html: `
        <p>Hi Lee,</p>
        <p>Just a quick update — when your listing was first added, RCTX didn’t yet have a “Driving Schools” category, so the system placed it under “Other” and sent the wrong link.</p>
        <p>I’ve now added the correct category and updated your listing.</p>
        <p>Here’s your correct link:<br>
        <a href="https://rctx.co.uk/directory/driving-lessons/tylorstown/lee-williams-driving-school">
        https://rctx.co.uk/directory/driving-lessons/tylorstown/lee-williams-driving-school
        </a></p>
        <p>Sorry for the mix‑up — RCTX is still growing and I really appreciate your patience.</p>
        <p>Thanks again,<br>Eddy<br>RCTX Directory</p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
}
