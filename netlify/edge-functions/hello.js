export default async (request, context) => {
  return new Response("Edge function is working!", {
    headers: { "content-type": "text/plain" }
  });
};
