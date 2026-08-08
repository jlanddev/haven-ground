// Reads app/properties/propertiesData.js and emits an idempotent SQL seed that
// upserts every current property into the `properties` table as jsonb. Running
// it produces haven-properties-seed.sql for you to paste into Supabase. The live
// site stays identical because each row's `data` is the exact same object.
import { readFile, writeFile } from 'fs/promises';

const src = await readFile(new URL('./app/properties/propertiesData.js', import.meta.url), 'utf8');
// Load the ESM export via a data: URL so it works regardless of package type.
const code = src.replace(/export\s+const\s+properties/, 'export const properties');
const mod = await import('data:text/javascript,' + encodeURIComponent(code));
const properties = mod.properties || [];

const esc = (s) => String(s).replace(/'/g, "''");
const lines = [
  '-- Auto-generated from app/properties/propertiesData.js. Safe to re-run.',
  '-- Upserts every current listing so the live site is identical after the swap.',
  '',
];

properties.forEach((p, i) => {
  const slug = p.slug;
  if (!slug) return;
  const title = p.title || '';
  const status = p.status || 'Available';
  const featured = !!p.featured;
  const sort = i;
  const json = esc(JSON.stringify(p));
  lines.push(
    `insert into properties (slug, title, status, featured, published, sort_order, data)\n` +
    `values ('${esc(slug)}', '${esc(title)}', '${esc(status)}', ${featured}, true, ${sort}, '${json}'::jsonb)\n` +
    `on conflict (slug) do update set title=excluded.title, status=excluded.status, ` +
    `featured=excluded.featured, sort_order=excluded.sort_order, data=excluded.data;`
  );
  lines.push('');
});

await writeFile(new URL('./haven-properties-seed.sql', import.meta.url), lines.join('\n'));
console.log(`Wrote haven-properties-seed.sql with ${properties.length} properties.`);
