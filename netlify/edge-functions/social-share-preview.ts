import type { Context } from "@netlify/edge-functions";

const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "pinterest",
  "applebot",
  "googlebot",
  "bingbot",
  "discordbot",
  "skypeuripreview",
  "vkshare",
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

export default async function (request: Request, context: Context) {
  const userAgent = request.headers.get("user-agent");

  // Pass directly through for normal human browser navigation (zero latency impact)
  if (!isBot(userAgent)) {
    return context.next();
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Match /products/:slug or /product/:slug
  if (pathParts.length < 2 || (pathParts[0] !== "products" && pathParts[0] !== "product")) {
    return context.next();
  }

  const slug = pathParts[1];

  try {
    const supabaseUrl =
      Netlify.env.get("VITE_SUPABASE_URL") ||
      Netlify.env.get("SUPABASE_URL") ||
      "https://klzwqmphtyvwubfqhgbf.supabase.co";
    const supabaseKey =
      Netlify.env.get("VITE_SUPABASE_ANON_KEY") ||
      Netlify.env.get("SUPABASE_ANON_KEY") ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug";

    const apiUrl = `${supabaseUrl}/rest/v1/products?slug=eq.${encodeURIComponent(
      slug
    )}&select=name,short_description,description,category,product_images(public_url,is_primary)&limit=1`;

    const res = await fetch(apiUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      return context.next();
    }

    const products = await res.json();
    if (!products || products.length === 0) {
      return context.next();
    }

    const product = products[0];
    const title = `${product.name} — FLINT Maison`;
    const rawDesc =
      product.short_description ||
      product.description ||
      "FLINT High fashion editorial archive. Minimalist organic textiles and precision tailoring.";
    const description = rawDesc.replace(/\s+/g, " ").trim().slice(0, 200);

    let imageUrl =
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop";

    if (product.product_images && product.product_images.length > 0) {
      const primary = product.product_images.find(
        (img: { is_primary?: boolean }) => img.is_primary
      );
      imageUrl = primary?.public_url || product.product_images[0].public_url || imageUrl;
    }

    const response = await context.next();
    const html = await response.text();

    const escapeAttr = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const updatedHtml = html
      .replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(title)}</title>`)
      .replace(
        /<meta property="og:title" content=".*?" \/>/i,
        `<meta property="og:title" content="${escapeAttr(title)}" />`
      )
      .replace(
        /<meta property="og:description" content=".*?" \/>/i,
        `<meta property="og:description" content="${escapeAttr(description)}" />`
      )
      .replace(
        /<meta property="og:image" content=".*?" \/>/i,
        `<meta property="og:image" content="${escapeAttr(imageUrl)}" />`
      )
      .replace(
        /<meta property="og:url" content=".*?" \/>/i,
        `<meta property="og:url" content="${escapeAttr(url.href)}" />`
      )
      .replace(
        /<meta name="twitter:title" content=".*?" \/>/i,
        `<meta name="twitter:title" content="${escapeAttr(title)}" />`
      )
      .replace(
        /<meta name="twitter:description" content=".*?" \/>/i,
        `<meta name="twitter:description" content="${escapeAttr(description)}" />`
      )
      .replace(
        /<meta name="twitter:image" content=".*?" \/>/i,
        `<meta name="twitter:image" content="${escapeAttr(imageUrl)}" />`
      );

    return new Response(updatedHtml, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[social-share-preview] Edge error:", err);
    return context.next();
  }
}
