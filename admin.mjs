const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const expected = process.env.AFANLUXE_ADMIN_PASSWORD;
  if (!expected) return json({ error: "Admin password has not been configured in Netlify yet" }, 503);
  try {
    const { password } = await request.json();
    return password === expected ? json({ ok: true }) : json({ error: "Wrong password" }, 401);
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
};
