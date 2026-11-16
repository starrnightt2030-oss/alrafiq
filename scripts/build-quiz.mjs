// يولّد أسئلة قرآنية دقيقة من نص مجمع الملك فهد: «أكمل الآية»، «في أي سورة؟»، «عدد الآيات»، «السورة التالية»
// الصعوبة: جزء عمّ والفاتحة سهل، والسور المشهورة متوسط، والباقي صعب.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'public/quran/hafs-v18.json'), 'utf8'));
const { surahs, ayahs } = raw;

let seed = 20261116;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const arN = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const ayatAr = (n) => n >= 3 && n <= 10 ? `${arN(n)} آيات` : `${arN(n)} آية`;
const noNum = (t) => t.replace(/\s*[\u0660-\u0669]+\s*$/, '').replace(/\u06E9/g, '').trim();
const words = (t) => noNum(t).split(/\s+/);
const plainName = (n) => surahs[n - 1].name.replace(/[ً-ْ]/g, '');
const MID = new Set([1, 18, 36, 55, 56, 67, 12, 19, 2]);
const diffOf = (s, a) => (s === 1 || s >= 78) ? 1 : (MID.has(s) || s >= 67 || (s === 2 && (a <= 5 || a >= 255 && a <= 257 || a >= 284))) ? 2 : 3;

const out = [];
const seen = new Set();
const add = (q) => { const key = q.q + q.c; if (seen.has(key)) return; seen.add(key); out.push(q); };

// فهارس لمنع الأسئلة الملتبسة: نص مكرّر في أكثر من سورة، أو بداية آية لها أكثر من تكملة
const textSurahs = {};
for (const a of ayahs) (textSurahs[noNum(a[6])] ||= new Set()).add(a[0]);
const plainW = (t) => words(t).map((x) => x.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''));
const continuations = (headPlain) => {
  const n = headPlain.length; const res = new Set();
  for (const b of ayahs) { const pw = plainW(b[6]); if (pw.length > n && pw.slice(0, n).join(' ') === headPlain.join(' ')) res.add(pw.slice(n).join(' ')); }
  return res;
};

// ١) أكمل الآية
const byS = {};
for (const a of ayahs) (byS[a[0]] ||= []).push(a);
const pool = ayahs.filter((a) => { const n = words(a[6]).length; return n >= 6 && n <= 14; });
for (const target of [1, 2, 3]) {
  const cands = shuffle(pool.filter((a) => diffOf(a[0], a[1]) === target));
  let made = 0;
  for (const a of cands) {
    if (made >= (target === 1 ? 90 : target === 2 ? 70 : 70)) break;
    const w = words(a[6]); const cut = Math.max(3, Math.floor(w.length / 2));
    const head = w.slice(0, cut).join(' '), tail = w.slice(cut).join(' ');
    // مشتّتات: نهايات آيات أخرى من نفس السورة أو السور المجاورة بطول قريب
    const near = ayahs.filter((b) => Math.abs(b[0] - a[0]) <= 2 && !(b[0] === a[0] && b[1] === a[1]));
    const len = w.length - cut;
    const conts = continuations(plainW(a[6]).slice(0, cut));
    if (conts.size > 1) continue; // بداية مشتركة بين أكثر من آية
    const tails = shuffle(near).map((b) => words(b[6])).filter((ww) => Math.abs(ww.length - len - Math.floor(ww.length / 2)) <= 1 || ww.length >= len + 2)
      .map((ww) => ww.slice(ww.length - len).join(' '))
      .filter((t) => t && t !== tail && !t.startsWith(tail) && !tail.startsWith(t) && !conts.has(t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')));
    const uniq = [...new Set(tails)].slice(0, 3);
    if (uniq.length < 3) continue;
    add({ d: target, kind: 'complete', q: 'أكمل الآية الكريمة:', verse: head + ' …', c: tail, w: uniq, note: `سورة ${plainName(a[0])}، الآية ${arN(a[1])}.`, quran: true });
    made++;
  }
}

// ٢) في أي سورة وردت هذه الآية؟
for (const target of [1, 2, 3]) {
  const cands = shuffle(ayahs.filter((a) => diffOf(a[0], a[1]) === target && words(a[6]).length >= 4 && words(a[6]).length <= 12));
  let made = 0;
  for (const a of cands) {
    if (made >= 45) break;
    if (textSurahs[noNum(a[6])].size > 1) continue; // الآية مكررة في أكثر من سورة
    const others = shuffle(surahs.filter((s) => s.n !== a[0] && Math.abs(s.n - a[0]) <= (target === 1 ? 12 : 25))).slice(0, 3);
    if (others.length < 3) continue;
    add({ d: target, kind: 'surah', q: 'في أي سورة وردت هذه الآية؟', verse: noNum(a[6]), c: plainName(a[0]), w: others.map((s) => plainName(s.n)), note: `وردت في سورة ${plainName(a[0])}، الآية ${arN(a[1])}.`, quran: true });
    made++;
  }
}

// ٣) عدد الآيات
const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
for (const s of surahs) {
  const d = s.n === 1 || s.n >= 103 ? 1 : s.n >= 78 || MID.has(s.n) ? 2 : 3;
  const n = s.ayahs;
  const deltas = shuffle(n < 10 ? [1, 2, 3, -1, -2] : n < 50 ? [2, 3, 5, -2, -3, -5] : [5, 10, 15, -5, -10, -7]);
  const opts = [...new Set(deltas.map((x) => n + x).filter((x) => x > 2 && x !== n))].slice(0, 3);
  if (opts.length < 3) continue;
  add({ d, kind: 'count', q: `كم عدد آيات سورة ${plainName(s.n)}؟`, c: ayatAr(n), w: opts.map((x) => ayatAr(x)), note: `سورة ${plainName(s.n)} عدد آياتها ${ayatAr(n)}.` });
}

// ٤) السورة التالية في ترتيب المصحف
for (const s of surahs.slice(0, 113)) {
  const d = s.n >= 77 || s.n <= 2 ? 1 : s.n >= 50 || s.n <= 5 ? 2 : 3;
  const nx = surahs[s.n];
  const others = shuffle(surahs.filter((x) => x.n !== nx.n && x.n !== s.n && Math.abs(x.n - s.n) <= 6)).slice(0, 3);
  if (others.length < 3) continue;
  add({ d, kind: 'next', q: `ما السورة التي تلي سورة ${plainName(s.n)} في ترتيب المصحف؟`, c: plainName(nx.n), w: others.map((x) => plainName(x.n)), note: `بعد سورة ${plainName(s.n)} تأتي سورة ${plainName(nx.n)} (رقم ${ar(nx.n)}).` });
}

out.forEach((q, i) => { q.id = 'qg' + i; });
writeFileSync(join(root, 'src/data/quiz/quranGen.json'), JSON.stringify(out));
const by = [1, 2, 3].map((d) => out.filter((q) => q.d === d).length);
console.log('✓ quiz quran questions:', out.length, 'by difficulty', by.join('/'));
