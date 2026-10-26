import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(express.json({ limit: '12mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowed.length && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(here, 'public')));

async function printify(pathname, options = {}) {
  if (!TOKEN || !SHOP_ID) throw new Error('Printify is not configured. Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID on the server.');
  const response = await fetch(`https://api.printify.com/v1${pathname}`, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Printify API returned ${response.status}: ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : {};
}

app.get('/api/health', (_req, res) => res.json({ ok: true, configured: Boolean(TOKEN && SHOP_ID) }));
app.get('/api/products', async (_req, res) => {
  try {
    const data = await printify(`/shops/${encodeURIComponent(SHOP_ID)}/products.json?page=1&limit=50`);
    const products = (data.data || []).map(p => ({
      id: p.id, title: p.title, description: p.description || '',
      images: (p.images || []).map(i => ({ src: i.src, variant_ids: i.variant_ids || [] })),
      variants: (p.variants || []).filter(v => v.is_enabled).map(v => ({ id: v.id, title: v.title, sku: v.sku, price: v.price }))
    }));
    res.json({ products, next_page: data.next_page || null });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// Uploads finished artwork to the Printify media library. This does NOT place an order.
app.post('/api/artwork', async (req, res) => {
  try {
    const { fileName, dataUrl } = req.body || {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ error: 'Provide a PNG data URL exported by the editor.' });
    }
    const base64 = dataUrl.split(',')[1];
    if (!base64 || base64.length > 10_000_000) return res.status(413).json({ error: 'Artwork is empty or too large (max about 7.5 MB).' });
    const result = await printify('/uploads/images.json', { method: 'POST', body: JSON.stringify({ file_name: String(fileName || 'crinlo-custom-design.png').slice(0, 120), contents: base64 }) });
    res.json({ id: result.id, preview_url: result.preview_url, file_name: result.file_name });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Crinlo Printify customiser listening on ${PORT}`));

// TEMPORARY: remove after reading the shop ID
app.get('/api/_shops', async (_req, res) => {
  try {
    const r = await fetch('https://api.printify.com/v1/shops.json', { headers: { Authorization: `Bearer ${TOKEN}` } });
    res.status(r.status).type('json').send(await r.text());
  } catch (e) { res.status(502).json({ error: e.message }); }
});
