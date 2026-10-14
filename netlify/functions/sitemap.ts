import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://flintaindia.com';

const STATIC_ROUTES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/shipping', changefreq: 'monthly', priority: '0.5' },
  { path: '/returns', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.4' },
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const handler: Handler = async () => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://klzwqmphtyvwubfqhgbf.supabase.co';
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsendxbXBodHl2d3ViZnFoZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjU5NzcsImV4cCI6MjEwMzE0MTk3N30.NsZpViSPATovps_ON_wSIt0sS5ludqAL9rxovdgYfug';

  const client = createClient(supabaseUrl, supabaseKey);

  // Fetch active products & categories in parallel
  const [productsRes, categoriesRes] = await Promise.all([
    client
      .from('products')
      .select('slug, name, updated_at, product_images(public_url)')
      .eq('status', 'active'),
    client
      .from('categories')
      .select('slug, name, updated_at')
      .eq('is_active', true),
  ]);

  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];
  const now = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // 1. Static Pages
  for (const route of STATIC_ROUTES) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${now.split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // 2. Category Collections
  for (const cat of categories) {
    const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
    const lastmod = cat.updated_at ? new Date(cat.updated_at).toISOString().split('T')[0] : now.split('T')[0];
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/shop?category=${encodeURIComponent(slug)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // 3. Active Products with Google Image schema
  for (const prod of products) {
    if (!prod.slug) continue;
    const lastmod = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : now.split('T')[0];
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/products/${escapeXml(prod.slug)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';

    const images = prod.product_images || [];
    for (const img of images) {
      if (img.public_url) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${escapeXml(img.public_url)}</image:loc>\n`;
        if (prod.name) {
          xml += `      <image:title>${escapeXml(prod.name)}</image:title>\n`;
        }
        xml += '    </image:image>\n';
      }
    }

    xml += '  </url>\n';
  }

  xml += '</urlset>';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
    body: xml,
  };
};
