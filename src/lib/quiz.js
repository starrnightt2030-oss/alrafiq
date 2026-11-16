// محرك «فاستبقوا الخيرات»: تدرّج تكيّفي في الصعوبة، ومنع التكرار بين المحاولات، والنقاط والوقت، والوسائل المساعدة
import { BANK, BRANCHES } from '../data/quiz/bank.js';
import GEN from '../data/quiz/quranGen.json';

export { BRANCHES };
export const PER_BRANCH = 10;
// منحنى الصعوبة الأساسي داخل كل مرحلة: يبدأ سهلًا ويصعد تدريجيًّا
const CURVE = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
export const TIME = { 1: 30, 2: 40, 3: 50 };
const LETTERS = ['أ', 'ب', 'ج', 'د'];
export { LETTERS };

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// تجهيز البنك: كل سؤال بمعرّف ثابت حتى نتتبّع ما رآه المتسابق
export const POOL = {};
for (const b of BRANCHES) {
  POOL[b.id] = (BANK[b.id] || []).map((r, i) => ({ id: `${b.id}-${i}`, branch: b.id, d: r[0], q: r[1], c: r[2], w: [r[3], r[4], r[5]], note: r[6] }));
}
POOL.quran = POOL.quran.concat(GEN.map((g) => ({ id: g.id, branch: 'quran', d: g.d, q: g.q, verse: g.verse, c: g.c, w: g.w, note: g.note, quran: !!g.quran })));
export const BANK_SIZE = Object.values(POOL).reduce((n, a) => n + a.length, 0);

function materialize(raw) {
  const options = shuffle([raw.c, ...raw.w]);
  return { ...raw, options, answer: options.indexOf(raw.c), removed: [] };
}

// اختيار السؤال: الصعوبة المستهدفة أولًا، ثم ما لم يره المتسابق من قبل، ثم الأقدم رؤية
export function pickQuestion(branch, target, usedIds, seen) {
  const all = POOL[branch].filter((q) => !usedIds.includes(q.id));
  for (const d of [target, target - 1, target + 1, target - 2, target + 2]) {
    const tier = all.filter((q) => q.d === d);
    if (!tier.length) continue;
    const fresh = tier.filter((q) => !seen[q.id]);
    const pool = fresh.length ? fresh : [...tier].sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0)).slice(0, Math.max(3, Math.ceil(tier.length / 3)));
    return materialize(pool[Math.floor(Math.random() * pool.length)]);
  }
  return null;
}

const blankStats = (branches) => Object.fromEntries(branches.map((b) => [b, { c: 0, t: 0, pts: 0 }]));

export function createGame({ mode, names, branches }) {
  const players = names.map((name, i) => ({ name: name.trim() || (mode === 'duo' ? `المتسابق ${i + 1}` : 'المتسابق'), score: 0, correct: 0, total: 0, streak: 0, mod: 0, per: blankStats(branches), life: { fifty: mode === 'duo' ? 1 : 2, hint: mode === 'duo' ? 1 : 2, swap: 1 } }));
  return { v: 1, id: Date.now(), mode, branches, players, stage: 0, qi: 0, turn: 0, used: [], current: null, phase: 'stage', startedAt: Date.now() };
}

export function nextQuestion(game, seen) {
  const branch = game.branches[game.stage];
  const p = game.players[game.turn];
  // في المسابقة الثنائية يأخذ المتسابقان نفس الصعوبة في كل جولة حتى تكون المنافسة عادلة
  const target = game.mode === 'duo' ? CURVE[game.qi - (game.qi % 2)] : Math.min(3, Math.max(1, CURVE[game.qi] + p.mod));
  const q = pickQuestion(branch, target, game.used, seen);
  return { ...game, current: q, used: q ? [...game.used, q.id] : game.used, phase: 'question' };
}

// تسجيل الإجابة: idx = رقم الاختيار أو -1 عند انتهاء الوقت
export function answerQuestion(game, idx, timeLeft) {
  const q = game.current; const correct = idx === q.answer;
  const limit = TIME[q.d];
  const pts = correct ? q.d * 10 + Math.round((Math.max(0, timeLeft) / limit) * 10) : 0;
  const players = game.players.map((p, i) => {
    if (i !== game.turn) return p;
    const per = { ...p.per, [q.branch]: { c: p.per[q.branch].c + (correct ? 1 : 0), t: p.per[q.branch].t + 1, pts: p.per[q.branch].pts + pts } };
    const streak = correct ? p.streak + 1 : 0;
    // التكيّف: إجابتان صحيحتان متتاليتان ترفعان الصعوبة، والخطأ يخفّضها خطوة
    const mod = correct ? (streak >= 2 ? Math.min(1, p.mod + 1) : p.mod) : Math.max(-1, p.mod - 1);
    return { ...p, score: p.score + pts, correct: p.correct + (correct ? 1 : 0), total: p.total + 1, streak, mod, per };
  });
  return { game: { ...game, players, phase: 'reveal', last: { idx, correct, pts } }, correct, pts };
}

// الانتقال بعد الشرح: سؤال جديد، أو نهاية المرحلة، أو نهاية اللعبة
export function advance(game) {
  const qi = game.qi + 1;
  const turn = game.mode === 'duo' ? (game.turn + 1) % game.players.length : 0;
  if (qi >= PER_BRANCH) {
    const stage = game.stage + 1;
    if (stage >= game.branches.length) return { ...game, qi, phase: 'final', current: null };
    return { ...game, stage, qi: 0, turn: 0, phase: 'stageEnd', current: null, players: game.players.map((p) => ({ ...p, mod: 0, streak: 0 })) };
  }
  return { ...game, qi, turn, phase: 'next' };
}

export function applyLifeline(game, kind, seen = {}) {
  const p = game.players[game.turn];
  if (!p.life[kind]) return game;
  const players = game.players.map((x, i) => (i === game.turn ? { ...x, life: { ...x.life, [kind]: x.life[kind] - 1 } } : x));
  const q = game.current;
  if (kind === 'fifty') {
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer);
    const removed = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    return { ...game, players, current: { ...q, removed } };
  }
  if (kind === 'hint') {
    const first = q.c.split(/\s+/)[0];
    const hint = q.c.split(/\s+/).length > 1 ? `تبدأ الإجابة بكلمة «${first}»` : `أول حرف في الإجابة: «${[...q.c.replace(/[^ء-ي0-9٠-٩]/g, '')][0] || first[0]}»`;
    return { ...game, players, current: { ...q, hint } };
  }
  // تبديل السؤال بآخر من نفس الصعوبة دون احتساب
  const alt = pickQuestion(q.branch, q.d, game.used, seen);
  if (!alt) return game;
  return { ...game, players, current: alt, used: [...game.used, alt.id] };
}

export function percent(p) { return p.total ? Math.round((p.correct / p.total) * 100) : 0; }

export const LEVELS = [
  { min: 90, title: 'من السابقين بالخيرات', msg: 'ما شاء الله! مستوى متفوّق يدل على علم وحرص. واصل وكن معلّمًا لغيرك؛ «خيركم من تعلّم القرآن وعلّمه».' },
  { min: 75, title: 'متميّز', msg: 'أداء رائع! أنت قريب جدًّا من القمة، وقليل من المراجعة يضعك في صفوف المتفوّقين.' },
  { min: 60, title: 'متقدّم', msg: 'مستوى جيد جدًّا. ركّز على الفروع التي تحتاج تقوية وستلمس الفرق سريعًا.' },
  { min: 45, title: 'مجتهد', msg: 'بداية طيبة وهمّة عالية. «من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة».' },
  { min: 0, title: 'في أول الطريق', msg: 'كل عالم كان في أول الطريق يومًا. ابدأ بالأقسام المقترحة وعد للمسابقة؛ ستندهش من تقدّمك.' },
];
export const levelOf = (pct) => LEVELS.find((l) => pct >= l.min);

export function analysis(p, branches) {
  const rows = branches.map((b) => { const s = p.per[b]; const br = BRANCHES.find((x) => x.id === b); return { ...br, c: s.c, t: s.t, pct: s.t ? Math.round((s.c / s.t) * 100) : 0 }; });
  return { rows, strong: rows.filter((r) => r.pct >= 80), weak: rows.filter((r) => r.pct < 60).sort((a, b) => a.pct - b.pct) };
}
