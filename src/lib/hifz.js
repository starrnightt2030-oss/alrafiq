// منطق متابعة الحفظ: خطة يومية + مراجعة بالتكرار المتباعد (كل صفحة لها موعد مراجعة يتباعد كلما أتقنتها)
import { todayKey } from './arabic.js';
import { SURAHS, JUZ, TOTAL_PAGES } from './quran.js';

export const addDaysKey = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return todayKey(d); };

// نطاق صفحات كل جزء
export const JUZ_RANGES = JUZ.map((j, i) => ({ juz: j.juz, from: j.page, to: i < JUZ.length - 1 ? JUZ[i + 1].page - (JUZ[i + 1].page > j.page ? 1 : 0) : TOTAL_PAGES }));

// نطاق صفحات كل سورة
export const surahPages = (n) => {
  const s = SURAHS[n - 1], next = SURAHS[n];
  const to = next ? Math.max(s.page, next.page - 1) : TOTAL_PAGES;
  return { from: s.page, to };
};

export const isMem = (pg) => !!pg && pg.s === 'm';

// الصفحات الجديدة التالية حسب الخطة
export function nextNew(hifz, count) {
  const out = [];
  const dir = hifz.plan.dir === 'fwd' ? 1 : -1;
  for (let p = dir > 0 ? 1 : TOTAL_PAGES; p >= 1 && p <= TOTAL_PAGES && out.length < count; p += dir) if (!isMem(hifz.pages[p])) out.push(p);
  return out;
}

export function dueReviews(hifz, limit = 10) {
  const t = todayKey();
  return Object.entries(hifz.pages).filter(([, v]) => isMem(v) && v.due <= t).sort((a, b) => a[1].due.localeCompare(b[1].due)).slice(0, limit).map(([p]) => +p);
}

export function memorizedCount(hifz) { return Object.values(hifz.pages).filter(isMem).length; }

export function juzProgress(hifz) {
  return JUZ_RANGES.map((r) => { let m = 0; for (let p = r.from; p <= r.to; p++) if (isMem(hifz.pages[p])) m++; return { ...r, m, total: r.to - r.from + 1, pct: m / (r.to - r.from + 1) }; });
}

// تقييم المراجعة: again | good | easy
export function schedule(pg, rating) {
  let ease = pg?.ease ?? 2.3, iv = pg?.iv ?? 1;
  if (rating === 'again') { ease = Math.max(1.3, ease - 0.2); iv = 1; }
  else if (rating === 'good') iv = Math.max(2, Math.round(iv * ease));
  else { ease = Math.min(3, ease + 0.1); iv = Math.max(4, Math.round(iv * ease * 1.3)); }
  return { s: 'm', ease, iv, due: addDaysKey(iv), reps: (pg?.reps || 0) + 1, at: pg?.at || todayKey() };
}
export const firstMemorize = () => ({ s: 'm', ease: 2.3, iv: 1, due: addDaysKey(1), reps: 0, at: todayKey() });

export const surahOf = (p) => { let s = SURAHS[0]; for (const x of SURAHS) { if (x.page <= p) s = x; else break; } return s; };
