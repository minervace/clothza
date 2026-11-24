// Generates public/sitemap.xml — static routes plus any store slugs and
// product ids that exist in Supabase at build time. Falls back to the
// static routes when the database is not reachable.
import { writeFileSync } from 'node:fs';

const BASE = 'https://clothza.tech';
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const staticRoutes = ['/', '/lookbooks', '/studio', '/sell', '/about', '/privacy', '/terms'];
let dynamic = [];

if (url && key) {
  const get = async (path) => {
    try {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  };

  const [stores, products] = await Promise.all([
    get('stores?select=slug'),
    get('products?select=id&limit=500'),
  ]);

  dynamic = [
    ...stores.map(s => `/store/${s.slug}`),
    ...products.map(p => `/product/${p.id}`),
  ];
}

const all = [...new Set([...staticRoutes, ...dynamic])];
const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(route => `  <url>
    <loc>${BASE}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/product') ? '0.7' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap: ${all.length} urls`);
