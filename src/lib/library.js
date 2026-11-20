// تحميل كتب المكتبة وحفظها على الجهاز (Cache Storage) عشان تتقري من غير نت
import { LIB_SRC } from '../data/library.js';

const CACHE = 'rf-library-v1';
const mem = {};
const url = (id) => LIB_SRC + id + '.json';

export async function isSaved(id) {
  try { const c = await caches.open(CACHE); return !!(await c.match(url(id))); } catch { return false; }
}
export async function savedList(ids) {
  const out = []; for (const id of ids) if (await isSaved(id)) out.push(id); return out;
}
export async function removeBook(id) {
  delete mem[id]; try { const c = await caches.open(CACHE); await c.delete(url(id)); } catch { /* */ }
}
// onProgress(0..1)
export async function loadBook(id, onProgress) {
  if (mem[id]) return mem[id];
  let c = null;
  try { c = await caches.open(CACHE); const hit = await c.match(url(id)); if (hit) return (mem[id] = await hit.json()); } catch { /* */ }
  const r = await fetch(url(id), { cache: 'no-store' });
  if (!r.ok) throw new Error('http ' + r.status);
  const total = +r.headers.get('content-length') || 0;
  let text;
  if (r.body && total && onProgress) {
    const rd = r.body.getReader(); const parts = []; let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onProgress(Math.min(1, got / total)); }
    const all = new Uint8Array(got); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
    text = new TextDecoder().decode(all);
  } else text = await r.text();
  const data = JSON.parse(text);
  try { if (c) await c.put(url(id), new Response(text, { headers: { 'content-type': 'application/json' } })); } catch { /* */ }
  return (mem[id] = data);
}
