import { getStore } from "@netlify/blobs";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});

export default async (request) => {
  const store = getStore("afanluxe-products");
  if (request.method === "GET") {
    try {
      const saved = await store.get("catalog", { type: "json", consistency: "strong" });
      return json({ products: Array.isArray(saved) ? saved : [] });
    } catch (error) {
      return json({ error: "Could not read product catalog" }, 500);
    }
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const expected = process.env.AFANLUXE_ADMIN_PASSWORD;
  const supplied = request.headers.get("x-admin-password") || "";
  if (!expected || supplied !== expected) return json({ error: "Unauthorized" }, 401);
  try {
    const body = await request.json();
    const products = body?.products;
    if (!Array.isArray(products) || products.length > 300) return json({ error: "Invalid product list" }, 400);
    let totalBytes = 0;
    for (const p of products) {
      if (!p || typeof p.name !== "string" || typeof p.image !== "string" || !p.image.startsWith("data:image/")) {
        return json({ error: "Invalid product information" }, 400);
      }
      totalBytes += p.image.length;
      if (p.image.length > 2_500_000) return json({ error: "A product photo is too large" }, 413);
    }
    if (totalBytes > 5_000_000) return json({ error: "Product photos total is too large. Remove some photos or use smaller images." }, 413);
    await store.setJSON("catalog", products);
    return json({ ok: true, count: products.length });
  } catch (error) {
    return json({ error: "Could not save products" }, 500);
  }
};
