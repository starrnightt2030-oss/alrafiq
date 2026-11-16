// تحميل نص المصحف (رواية حفص — بيانات مجمع الملك فهد، الإصدار 18) مرة واحدة وتجميعه حسب الصفحات
import { useEffect, useState } from 'react';
import meta from '../data/quranMeta.json';

export const TOTAL_PAGES = 604;
export const SURAHS = meta.surahs;
export const JUZ = meta.juz;

let cache = null, pending = null;
async function load() {
  if (cache) return cache;
  if (!pending) {
    pending = fetch(new URL('quran/hafs-v18.json', document.baseURI)).then((r) => { if (!r.ok) throw new Error('تعذّر تحميل المصحف'); return r.json(); }).then((d) => {
      const pages = Array.from({ length: TOTAL_PAGES + 1 }, () => []);
      for (const a of d.ayahs) pages[a[2]].push({ s: a[0], a: a[1], p: a[2], ls: a[3], le: a[4], j: a[5], t: a[6], e: a[7] });
      cache = { pages };
      return cache;
    }).catch((e) => { pending = null; throw e; });
  }
  return pending;
}

export function useQuran() {
  const [state, set] = useState({ data: cache, error: null });
  useEffect(() => { if (!cache) load().then((data) => set({ data, error: null })).catch((error) => set({ data: null, error })); }, []);
  return state;
}

export const surahAt = (page) => { let s = SURAHS[0]; for (const x of SURAHS) { if (x.page <= page) s = x; else break; } return s; };
export const juzAt = (page) => { let j = JUZ[0]; for (const x of JUZ) { if (x.page <= page) j = x; else break; } return j; };

// يبني عناصر الصفحة: عنوان سورة، بسملة، وكتل نصّية — مع عدد الأسطر التقريبي لكل عنصر
export function pageBlocks(ayahs) {
  const out = []; let block = null;
  for (const x of ayahs) {
    if (x.a === 1) {
      block = null;
      const s = SURAHS[x.s - 1];
      out.push({ type: 'head', name: s.name, n: s.n, lines: 1 });
      if (x.s !== 1 && x.s !== 9) out.push({ type: 'basmala', lines: 1 });
    }
    if (!block) { block = { type: 'text', ayahs: [], ls: x.ls, le: x.le }; out.push(block); }
    block.ayahs.push(x); block.le = x.le;
  }
  for (const b of out) if (b.type === 'text') b.lines = b.le - b.ls + 1;
  return out;
}
