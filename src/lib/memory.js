// محرّك الحفظ الذكي: نموذج ذاكرة لكل آية (مستوحى من خوارزمية FSRS للتكرار المتباعد)
// لكل آية: ثبات S (عدد الأيام اللي تفضل فيها الآية في الذاكرة باحتمال ٩٠٪)، وصعوبة D (١–١٠)، وآخر مراجعة، وعدد المرات والأخطاء،
// والكلمات اللي بيتغلط فيها. كل تسميع بالصوت بيتحوّل لتقييم (نسي / صعب / تمام / سهل) والنموذج بيتحدّث،
// ومنه بنطلع: موعد المراجعة الجاية، وقوة كل سورة وجزء، والمستوى العام، وخطة اليوم.
import meta from '../data/quranMeta.json';

const DAY = 86400000;
export const SURAHS = meta.surahs;
export const keyOf = (s, a) => s + ':' + a;
export const parseKey = (k) => { const [s, a] = k.split(':').map(Number); return { s, a }; };

// احتمال إن الآية لسه في الذاكرة بعد t يوم من آخر مراجعة
export const recall = (m, now = Date.now()) => (m ? Math.exp((Math.log(0.9) * Math.max(0, now - m.last)) / DAY / Math.max(0.2, m.S)) : 0);

// التقييم من نتيجة التسميع: الدقة (نسبة الكلمات الصح) وعدد المحاولات
export function gradeOf(acc, tries = 1) {
  if (acc < 0.75) return 0; // نسي
  if (tries > 1 || acc < 0.9) return 1; // صعب
  if (acc < 0.98) return 2; // تمام
  return 3; // سهل
}
export const GRADE = ['نسيتها', 'صعبة', 'تمام', 'متقنة'];

// تحديث نموذج الآية بعد تسميع (missed: أرقام الكلمات اللي اتنست أو اتقالت غلط)
export function review(m, g, missed = [], now = Date.now()) {
  if (!m) {
    // أول مرة: الثبات المبدئي حسب التقييم
    const S0 = [0.4, 1, 2.5, 5][g], D0 = [7, 6, 5, 4][g];
    return { S: S0, D: D0, last: now, due: now + S0 * DAY, n: 1, lapses: g === 0 ? 1 : 0, acc: [g >= 2 ? 1 : g ? 0.85 : 0.5], w: bump({}, missed), first: now };
  }
  const R = recall(m, now);
  let S, D = m.D;
  if (g === 0) { S = Math.max(0.3, m.S * 0.35); D = Math.min(10, D + 1.2); }
  else {
    const mult = [0, 0.55, 1, 1.45][g];
    // كل ما الآية كانت قريبة تتنسي ونجحت، كل ما الثبات يزيد أكتر (أثر الاسترجاع الصعب)
    const gain = 1 + 4.2 * ((11 - D) / 10) * Math.pow(m.S, -0.18) * (Math.exp((1 - R) * 1.4) - 1 + 0.25) * mult;
    S = Math.min(365, m.S * Math.max(1.05, gain));
    D = Math.max(1, Math.min(10, D + [0, 0.4, -0.15, -0.5][g]));
  }
  return { ...m, S, D, last: now, due: now + S * DAY, n: m.n + 1, lapses: m.lapses + (g === 0 ? 1 : 0), acc: [...(m.acc || []), g >= 2 ? 1 : g ? 0.85 : 0.5].slice(-8), w: bump(m.w || {}, missed) };
}
const bump = (w, missed) => { const o = { ...w }; missed.forEach((i) => { o[i] = (o[i] || 0) + 1; }); return o; };

// ===== التقارير =====
export const ayahCount = (s) => SURAHS[s - 1].ayahs;
// قوة السورة: متوسط احتمال التذكّر لآياتها اللي اتسمّعت، ونسبة اللي اتغطّى منها
export function surahStrength(ayat, s, now = Date.now()) {
  const n = ayahCount(s); let sum = 0, seen = 0;
  for (let a = 1; a <= n; a++) { const m = ayat[keyOf(s, a)]; if (m) { seen++; sum += recall(m, now); } }
  return { n, seen, cover: seen / n, strength: seen ? sum / seen : 0, score: (sum / n) };
}
export const label = (r) => (r >= 0.9 ? ['متقن', '#1FA36A'] : r >= 0.75 ? ['جيد', '#2F7BEA'] : r >= 0.5 ? ['يحتاج مراجعة', '#E2A92B'] : ['ضعيف', '#E0507A']);
export function overview(ayat, now = Date.now()) {
  const keys = Object.keys(ayat), surahs = {};
  let strong = 0, weakN = 0, totalR = 0, words = 0;
  for (const k of keys) {
    const m = ayat[k], r = recall(m, now); totalR += r; if (r >= 0.85) strong++; else weakN++;
    const { s } = parseKey(k); surahs[s] = true;
  }
  // المستوى: بعدد الآيات المتقنة (٦٢٣٦ آية في المصحف)
  const pct = strong / 6236;
  const level = strong === 0 ? 'لم تبدأ' : pct >= 0.9 ? 'حافظ متقن' : pct >= 0.5 ? 'متقدّم' : pct >= 0.15 ? 'متوسط' : strong >= 30 ? 'مبتدئ متقدّم' : 'مبتدئ';
  return { tracked: keys.length, strong, weak: weakN, avg: keys.length ? totalR / keys.length : 0, surahs: Object.keys(surahs).map(Number).sort((a, b) => a - b), level, pct, juzEq: strong / (6236 / 30) };
}
// أضعف الآيات (للمراجعة المركّزة)
export function weakest(ayat, n = 10, now = Date.now()) {
  return Object.entries(ayat).map(([k, m]) => ({ k, ...parseKey(k), r: recall(m, now), m })).sort((a, b) => a.r - b.r).slice(0, n);
}
// توقّع المراجعة: عدد الآيات المستحقة في كل يوم من الأسبوع الجاي
export function forecast(ayat, days = 7, now = Date.now()) {
  const out = Array(days).fill(0);
  for (const m of Object.values(ayat)) { const d = Math.floor((m.due - now) / DAY); out[Math.max(0, Math.min(days - 1, d))] += d < days ? 1 : 0; }
  return out;
}

// ===== خطة اليوم الذكية =====
// الآيات المستحقة مترتّبة من الأضعف، ومتجمّعة في مقاطع متتالية (أسهل في المراجعة من آيات متفرّقة)
export function dailyPlan(ayat, { maxAyat = 40 } = {}, now = Date.now()) {
  const due = Object.entries(ayat).filter(([, m]) => m.due <= now + DAY / 4).map(([k, m]) => ({ ...parseKey(k), r: recall(m, now) }));
  due.sort((a, b) => a.s - b.s || a.a - b.a);
  const segs = [];
  for (const x of due) { const l = segs[segs.length - 1]; if (l && l.s === x.s && x.a - l.to <= 2) { l.to = x.a; l.r = Math.min(l.r, x.r); l.n++; } else segs.push({ s: x.s, from: x.a, to: x.a, r: x.r, n: 1 }); }
  segs.sort((a, b) => a.r - b.r);
  const out = []; let c = 0;
  for (const g of segs) { if (c >= maxAyat) break; out.push(g); c += g.to - g.from + 1; }
  return { segs: out, total: due.length };
}

// ===== الاختبار الذكي: اختيار الأسئلة =====
// بنختار من الآيات المحفوظة بوزن أكبر للأضعف، مع شوية عشوائية، ومن غير تكرار
export function pickTest(ayat, n = 12, now = Date.now()) {
  const pool = Object.entries(ayat).map(([k, m]) => ({ ...parseKey(k), w: 0.15 + (1 - recall(m, now)) })).filter((x) => x.a > 1);
  const out = [];
  while (out.length < n && pool.length) {
    const sum = pool.reduce((t, x) => t + x.w, 0); let r = Math.random() * sum, i = 0;
    while (r > pool[i].w && i < pool.length - 1) { r -= pool[i].w; i++; }
    out.push(pool[i]); pool.splice(i, 1);
  }
  return out;
}
