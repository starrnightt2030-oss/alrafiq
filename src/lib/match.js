// مقارنة كلام القارئ بكلمات الآية: من غير تشكيل، ومع تسامح في الحروف المتشابهة والرسم العثماني
// لأن محرّك التعرّف على الكلام مش هيطلع الكلام بالظبط زي المصحف
const DIAC = /[ؐ-ًؚ-ٟۖ-ۭـ]/g;
export const norm = (w) => w
  .replace(/ٰ/g, 'ا') // الألف الخنجرية: ٱلرَّحۡمَٰن ← الرحمان
  .replace(DIAC, '')
  .replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '')
  .replace(/[^ء-ي]/g, '');

const lev = (a, b) => {
  const m = a.length, n = b.length; if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
};
const sim = (a, b) => (a && b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);
// «ال» والواو والفاء في الأول ممكن المحرّك يلزقهم أو يفصلهم
const strip = (w) => w.replace(/^(و|ف)?(ال)?/, '');
// «هيكل» الكلمة بالنطق: حروف المد جوه الكلمة بتتشال، والحرف المشدّد اللي اتكتب مرتين بيبقى مرة،
// والحروف اللي بتتنطق قريب من بعض (أو المحرّك بيخلط بينها) بتبقى حرف واحد، والتنوين/الألف في الآخر بيتشال.
// كده «الصلوه» و«الصلاه» و«الصلات» تبقى نفس الكلمة، و«رحيما» زي «رحيم».
const SND = { ث: 'س', ص: 'س', ذ: 'ز', ظ: 'ز', ض: 'د', ط: 'ت', ح: 'ه', ع: 'ا', ق: 'ك', غ: 'خ' };
const skel = (w) => {
  let x = w.replace(/[اوي]+$/, '').replace(/(.)[اوي]+/g, '$1').replace(/./g, (c) => SND[c] || c).replace(/(.)\1+/g, '$1');
  return x || w;
};
export const same = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const sa = strip(a), sb = strip(b);
  const t = sa.length <= 2 ? 0.5 : sa.length <= 3 ? 0.62 : 0.6;
  if (sim(sa, sb) >= t || (a.length <= 3 && sim(a, b) >= 0.62)) return true;
  const ka = skel(sa), kb = skel(sb);
  return ka.length >= 2 && sim(ka, kb) >= (ka.length <= 3 ? 0.66 : 0.6);
};

// كلمات الآية للعرض: علامات الوقف اللي لوحدها بتتلزق في الكلمة اللي قبلها
export const ayahWords = (ayah) => ayah.split(/\s+/).filter(Boolean).reduce((a, w) => { if (!norm(w) && a.length) a[a.length - 1] += ' ' + w; else a.push(w); return a; }, []);

// ذاكرة صغيرة لنتائج same: الكلام الجزئي بيتكرر كتير وهو بيتكتب، فمانحسبش نفس المقارنة مرتين
const memo = new Map();
const eq = (a, b) => {
  const k = a + '|' + b; let v = memo.get(k);
  if (v === undefined) { v = same(a, b); if (memo.size > 6000) memo.clear(); memo.set(k, v); }
  return v;
};
// لزق/تقسيم كلمتين: لازم تطابق أقوى (من غير «الهيكل» المتسامح)، عشان «الله» لوحدها ماتتحسبش «الله أحد»
const eq2 = (a, b) => a === b || (Math.abs(a.length - b.length) <= 2 && sim(strip(a), strip(b)) >= 0.8);

// بترجع لكل كلمة في الآية: اتقالت صح ولا لأ.
// محاذاة مثالية (برمجة ديناميكية) بين كلمات الآية والكلام المسموع بدل البحث الجشع:
// بتلاقي أحسن توافق للآية كلها مرة واحدة، فكلمة زيادة أو ناقصة أو كلمة غلط في النص مابتبوّظش باقي الآية.
// وبتتسامح لو المحرّك قسم كلمة لاتنين أو لزق كلمتين في كلمة.
export function align(words, heard) {
  const T = words.map(norm), H = heard.split(/\s+/).map(norm).filter(Boolean);
  const n = T.length, m = H.length;
  const hit = T.map((t) => !t);
  if (!m) return hit;
  // S[i][j] = أحسن درجة لأول i كلمة من الآية مع أول j كلمة مسموعة. W[i][j] = الخطوة اللي جابتها
  const S = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const W = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  const X = -0.05; // كلمة مسموعة زيادة: عقوبة صغيرة عشان نفضّل المحاذاة المضغوطة
  for (let j = 1; j <= m; j++) { S[0][j] = S[0][j - 1] + X; W[0][j] = 2; }
  for (let i = 1; i <= n; i++) {
    const t = T[i - 1];
    S[i][0] = S[i - 1][0] + (t ? 0 : 1); W[i][0] = 1;
    for (let j = 1; j <= m; j++) {
      let b = S[i - 1][j] + (t ? 0 : 1), w = 1; // كلمة من الآية ماتقالتش (أو علامة وقف)
      const c2 = S[i][j - 1] + X; if (c2 > b) { b = c2; w = 2; }
      if (t) {
        if (eq(t, H[j - 1])) { const c = S[i - 1][j - 1] + 1 + (t === H[j - 1] ? 0.05 : 0); if (c > b) { b = c; w = 3; } }
        if (j >= 2 && eq2(t, H[j - 2] + H[j - 1])) { const c = S[i - 1][j - 2] + 1; if (c > b) { b = c; w = 4; } }
        const u = i >= 2 ? T[i - 2] : '';
        if (u && eq2(u + t, H[j - 1])) { const c = S[i - 2][j - 1] + 2; if (c > b) { b = c; w = 5; } }
      }
      S[i][j] = b; W[i][j] = w;
    }
  }
  // نرجع من الآخر لنعرف أنهي كلمات اتقالت
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const w = i && j ? W[i][j] : i ? 1 : 2;
    if (w === 1) i--;
    else if (w === 2) j--;
    else if (w === 3) { hit[i - 1] = true; i--; j--; }
    else if (w === 4) { hit[i - 1] = true; i--; j -= 2; }
    else { hit[i - 1] = hit[i - 2] = true; i -= 2; j--; }
  }
  return hit;
}
export const score = (hit) => (hit.length ? hit.filter(Boolean).length / hit.length : 0);
