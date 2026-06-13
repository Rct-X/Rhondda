///manual EMAILS////
const failed = [
  "stephenprice.plumber@googlemail.com",
  "shop@purpleshoots.co.uk",
  "fairytalesbabywear@hotmail.com",
  "gemsfades@gmail.com",
  "enquiries@freindsofanimalswales.org.uk",
  "Support@rctx.co.uk"
];

failed.forEach(email => {
  fetch("/.netlify/functions/send-claim-email", {
    method: "POST",
    body: JSON.stringify({
      name: "Business Owner",
      email,
      businessName: "Your Business",
      slug: "your-slug"
    })
  });
});
