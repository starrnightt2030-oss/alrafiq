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

// بترجع لكل كلمة في الآية: اتقالت ولا لأ، بالترتيب، مع شوية تسامح لو الطفل نط كلمة أو المحرّك زوّد كلمة
export function align(words, heard) {
  const T = words.map(norm), H = heard.split(/\s+/).map(norm).filter(Boolean);
  const hit = T.map(() => false);
  let j = 0;
  for (let i = 0; i < T.length; i++) {
    if (!T[i]) { hit[i] = true; continue; }
    // بندوّر في الكلمات اللي جاية (مع تسامح لو المحرّك زوّد كلمة أو قسم كلمة لاتنين أو لزق كلمتين)
    for (let k = j; k < Math.min(H.length, j + 5); k++) {
      if (same(T[i], H[k])) { hit[i] = true; j = k + 1; break; }
      if (k + 1 < H.length && same(T[i], H[k] + H[k + 1])) { hit[i] = true; j = k + 2; break; }
      if (i + 1 < T.length && T[i + 1] && same(T[i] + T[i + 1], H[k])) { hit[i] = hit[i + 1] = true; i++; j = k + 1; break; }
    }
  }
  return hit;
}
export const score = (hit) => (hit.length ? hit.filter(Boolean).length / hit.length : 0);
