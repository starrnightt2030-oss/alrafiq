// الحفظ الذكي بالصوت: حفظ بالترديد، وتسميع، ومراجعة يومية مُجدولة، واختبار تكيّفي، وتحديد مستوى، وتقارير وشهادات.
// كل تسميع يُحدّث نموذج ذاكرة لكل آية (lib/memory.js)، ومنه تُبنى خطة المراجعة والمستوى والتقارير.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Brain, Target, BarChart3, Award, BookOpen, RotateCcw, Search, Gauge, Volume2, CheckCircle2, XCircle, CalendarClock, Square, Settings2 } from 'lucide-react';
import { useStore } from '../store.js';
import { useQuran } from '../lib/quran.js';
import { RECITERS, reciterOf, srcOf } from '../lib/recite.js';
import { micReady, hear, warmMic, micLog } from '../lib/listen.js';
import { ayahWords, align, score } from '../lib/match.js';
import { review, gradeOf, recall, keyOf, overview, surahStrength, label, weakest, forecast, dailyPlan, pickTest, GRADE, SURAHS } from '../lib/memory.js';
import { surahPages, isMem, firstMemorize } from '../lib/hifz.js';
import { ar } from '../lib/arabic.js';
import { TopBar, Ring } from '../components/ui.jsx';
import Cert from '../components/Cert.jsx';
import { go } from '../router.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (t) => t.replace(/[ \s]*[٠-٩]+\s*$/, '');
const pct = (x) => ar(Math.round(x * 100)) + '٪';
const sname = (s) => SURAHS[s - 1].name;

// نص كل سورة: { [s]: [{ a, t }] } من بيانات المصحف المحمّلة
function useAyat() {
  const { data, error } = useQuran();
  const by = useMemo(() => { if (!data) return null; const o = {}; for (const pg of data.pages) for (const x of pg) (o[x.s] ||= []).push({ a: x.a, t: clean(x.t), j: x.j }); for (const k in o) o[k].sort((p, q) => p.a - q.a); return o; }, [data]);
  return { by, error };
}
// تشغيل آية بصوت القارئ المختار (من الجهاز لو محمّلة، أو من الإنترنت)
function playAyah(rid, s, a, run, my) {
  return new Promise(async (res) => {
    try {
      const src = await srcOf(reciterOf(rid).folder, s, a);
      if (run.n !== my) return res(0);
      const au = new Audio(src); run.cur = au;
      au.onended = () => res(au.duration || 3); au.onerror = () => res(0);
      au.play().catch(() => res(0));
    } catch (e) { res(0); }
  });
}
const Pill = ({ c, children }) => <span className="xs" style={{ padding: '2px 10px', borderRadius: 999, background: c + '22', color: c, fontWeight: 700 }}>{children}</span>;

// ======================= جلسة: حفظ / تسميع / مراجعة =======================
function Session({ mode, s, from, to, by }) {
  const { mem, memAyah, memLog, memCert, hifz, updateHifz, rufaqa } = useStore();
  const P = mem.prefs, PASS = P.strict || 0.9;
  const list = (by[s] || []).filter((x) => x.a >= from && x.a <= to);
  const hidden = mode !== 'learn';
  const [i, setI] = useState(-1), [hits, setHits] = useState({}), [heard, setHeard] = useState(''), [note, setNote] = useState(null), [turn, setTurn] = useState(false), [res, setRes] = useState([]), [fin, setFin] = useState(false), [mic, setMic] = useState('unk'), [manual, setManual] = useState(null), [cert, setCert] = useState(null);
  const run = useRef({ n: 0, cur: null, ear: null, man: null });
  const alive = (my) => run.current.n === my;
  const stop = () => { run.current.n++; try { run.current.cur?.pause(); } catch (e) {} run.current.ear?.stop(); run.current.man?.(null); setTurn(false); };
  useEffect(() => { micReady().then((m) => { setMic(m); if (m === 'ok') warmMic(); }); return stop; }, []);
  const listenAyah = async (x, my) => {
    const words = ayahWords(x.t); const ctx = { all: '' }; let best = words.map(() => false);
    setHeard(''); setHits((h) => ({ ...h, [x.a]: best }));
    for (let round = 0; round < 3 && alive(my); round++) {
      const ear = hear({ waitMs: round ? 4000 : 8000, maxMs: 9000 + words.length * 800, onText: (t) => { const txt = (ctx.all + ' ' + t).trim(); setHeard(txt); const h = align(words, txt); setHits((o) => ({ ...o, [x.a]: h })); if (score(h) >= 0.97) ear.stop(); } });
      run.current.ear = ear; const t = await ear.promise; run.current.ear = null;
      if (!t) break;
      ctx.all = (ctx.all + ' ' + t).trim(); best = align(words, ctx.all);
      if (score(best) >= 0.97) break;
    }
    setHits((o) => ({ ...o, [x.a]: best }));
    return { acc: score(best), missed: best.map((h, j) => (h ? -1 : j)).filter((j) => j >= 0), said: !!ctx.all, words };
  };
  // بدون مايك: تقييم ذاتي بزرّين
  const askManual = () => new Promise((r) => { run.current.man = r; setManual(true); });
  const record = (x, acc, tries, missed) => {
    const k = keyOf(s, x.a), g0 = gradeOf(acc, tries), g = mode === 'learn' ? Math.min(g0, 2) : g0;
    memAyah(k, review(useStore.getState().mem.ayat[k], g, missed));
    return g;
  };
  const begin = async () => {
    stop(); const my = ++run.current.n; const out = []; setRes([]); setFin(false);
    const useMic = mic === 'ok' || (mic === 'unk' && (await Promise.race([micReady(), wait(1500).then(() => 'unk')])) === 'ok');
    for (let q = 0; q < list.length; q++) {
      const x = list[q]; if (!alive(my)) return;
      setI(q); setNote(null); setHits((h) => ({ ...h, [x.a]: null }));
      let acc = 0, tries = 0, missed = [];
      const reps = mode === 'learn' ? P.reps || 1 : 1;
      for (let rep = 0; rep < reps; rep++) {
        for (tries = 1; tries <= (mode === 'learn' ? 3 : 2); tries++) {
          if (!alive(my)) return;
          if (mode === 'learn') { setTurn(false); await playAyah(P.reciter, s, x.a, run.current, my); if (!alive(my)) return; }
          setTurn(true);
          if (!useMic) { const ok = await askManual(); setManual(null); if (ok === null || !alive(my)) return; acc = ok ? 1 : 0.5; break; }
          const r = await listenAyah(x, my); if (!alive(my)) return;
          acc = r.acc; missed = r.missed; setTurn(false);
          if (acc >= PASS) { setNote({ ok: true, t: acc >= 0.98 ? 'أحسنت، تلاوة متقنة' : 'أحسنت' }); await wait(700); break; }
          const ms = r.words.filter((_, j) => missed.includes(j)).slice(0, 4).join(' ');
          if (tries < (mode === 'learn' ? 3 : 2)) { setNote({ ok: false, t: !r.said ? 'لم أسمعك — اقرأ بصوت أوضح' : ms ? `انتبه إلى: «${ms}» — أعد الآية` : 'أعد الآية من أولها' }); await wait(1500); setNote(null); setHits((h) => ({ ...h, [x.a]: null })); }
        }
        if (acc < PASS) break;
      }
      const ok = acc >= PASS; tries = Math.min(tries, 3);
      if (!ok && hidden) { setNote({ ok: false, t: 'استمع للآية صحيحة' }); setHits((h) => ({ ...h, [x.a]: ayahWords(x.t).map(() => true) })); await playAyah(P.reciter, s, x.a, run.current, my); }
      const g = record(x, acc, tries, missed);
      out.push({ a: x.a, acc, ok, g }); setRes([...out]);
      if (!alive(my)) return;
      await wait(400);
    }
    setTurn(false); setI(-1); setFin(true);
    const avg = out.reduce((t, x) => t + x.acc, 0) / Math.max(1, out.length), all = out.every((x) => x.ok);
    memLog('sessions', { mode, s, from, to, acc: avg, n: out.length, ok: out.filter((x) => x.ok).length, pts: out.filter((x) => x.ok).length * 2 });
    // تسميع السورة كاملة بلا أخطاء: شهادة، وتُضاف صفحاتها للمحفوظ في متابعة الصفحات
    if (hidden && all && from === 1 && to === SURAHS[s - 1].ayahs) {
      const id = 'surah-' + s, c = { id, kind: 'surah', title: 'شهادة حفظ', name: P.name || rufaqa.name || 'القارئ', verb: 'أتمّ حفظ وتسميع', main: 'سورة ' + sname(s), sub: `${ar(to)} آية • دقة التسميع ${pct(avg)}`, grade: avg >= 0.97 ? 'ممتاز' : avg >= 0.93 ? 'جيد جدًا' : 'جيد', at: Date.now() };
      memCert(c); setCert(c);
      const r = surahPages(s), upd = {}; for (let p = r.from; p <= r.to; p++) if (!isMem(hifz.pages[p])) upd[p] = firstMemorize(); if (Object.keys(upd).length) updateHifz(upd);
    }
  };
  const x = list[i];
  const title = { learn: 'حفظ بالترديد', recite: 'تسميع', review: 'مراجعة' }[mode];
  return (
    <div className="screen no-nav">
      <TopBar title={`${title}: سورة ${sname(s)}`} sub={`الآيات ${ar(from)}–${ar(to)}${mode === 'learn' ? ` • تكرار ${ar(P.reps || 1)}` : ''}`} fallback="/hafiz" />
      {cert && <Cert c={cert} onClose={() => setCert(null)} />}
      {mic !== 'ok' && mic !== 'unk' && <div className="card small" style={{ lineHeight: 1.8, borderColor: '#E2A92B' }}>المايك غير متاح على هذا الجهاز — سيُطلب منك تقييم نفسك بعد كل آية.</div>}
      {!fin && i < 0 && <button className="btn" style={{ minHeight: 56, fontSize: 16 }} onClick={begin}><Mic size={20} /> ابدأ {mode === 'learn' ? 'الحفظ' : 'التسميع'}</button>}
      {i >= 0 && <div className="row" style={{ gap: 3 }}>{list.map((_, k) => <span key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < i ? (res[k]?.ok ? 'var(--acc)' : '#E0507A') : k === i ? '#E2A92B' : 'var(--line)' }} />)}</div>}
      {(i >= 0 || fin) && <section className="card col" style={{ gap: 6 }}>
        {list.map((y) => { const h = hits[y.a], cur = x && x.a === y.a, r = res.find((z) => z.a === y.a), show = !hidden || r || (h && h.some(Boolean));
          return (
            <div key={y.a} style={{ padding: '4px 8px', borderRadius: 12, background: cur ? 'color-mix(in srgb, var(--acc) 10%, transparent)' : 'transparent', opacity: !cur && i >= 0 && !r ? 0.55 : 1 }}>
              <span className="mushaf" style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 23, lineHeight: 2.1 }}>
                {ayahWords(y.t).map((w, j) => { const on = h?.[j]; return <span key={j} style={{ color: on ? 'var(--acc)' : 'inherit', background: on ? 'color-mix(in srgb, var(--acc) 14%, transparent)' : 'transparent', borderRadius: 6, filter: show || on ? 'none' : 'blur(6px)', transition: 'all .2s' }}>{w} </span>; })}
                <span className="accent" style={{ fontSize: 17 }}>﴿{ar(y.a)}﴾</span>
              </span>
              {r && <span style={{ marginInlineStart: 6 }}><Pill c={r.ok ? '#1FA36A' : '#E0507A'}>{GRADE[r.g]}</Pill></span>}
            </div>
          ); })}
      </section>}
      {turn && !manual && <div className="card center" style={{ borderColor: '#E2A92B' }}><motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ display: 'inline-flex' }}><Mic size={22} className="accent" /></motion.span><div className="small" style={{ fontWeight: 700 }}>{hidden ? 'اقرأ الآية من حفظك…' : 'ردّد الآية…'}</div>{heard && <div className="small muted">«{heard}»</div>}</div>}
      {manual && <div className="card col" style={{ gap: 8 }}><div className="small" style={{ fontWeight: 700 }}>اقرأ الآية ثم قيّم نفسك:</div><div className="grid2"><button className="btn" onClick={() => run.current.man?.(true)}>قرأتها صحيحة</button><button className="btn soft" onClick={() => run.current.man?.(false)}>أخطأت فيها</button></div></div>}
      {note && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card center small" style={{ fontWeight: 700, color: note.ok ? '#1FA36A' : '#C2410C', borderColor: note.ok ? '#1FA36A' : '#E0507A' }}>{note.t}</motion.div>}
      {i >= 0 && <button className="btn ghost" onClick={() => { stop(); setI(-1); }}><Square size={16} /> إيقاف</button>}
      {fin && <section className="card col" style={{ gap: 6 }}>
        <div className="h2">النتيجة</div>
        <div className="row"><span style={{ flex: 1 }}>الآيات الصحيحة</span><b>{ar(res.filter((r) => r.ok).length)} من {ar(res.length)}</b></div>
        <div className="row"><span style={{ flex: 1 }}>متوسط الدقة</span><b>{pct(res.reduce((t, r) => t + r.acc, 0) / Math.max(1, res.length))}</b></div>
        {res.some((r) => !r.ok) && <div className="small" style={{ color: '#C2410C' }}>تحتاج مراجعة: الآيات {res.filter((r) => !r.ok).map((r) => ar(r.a)).join('، ')} — ستعود إليك في خطة المراجعة قريبًا.</div>}
        <div className="grid2" style={{ marginTop: 6 }}><button className="btn" onClick={begin}>أعد الجلسة</button><button className="btn soft" onClick={() => go('/hafiz')}>لوحة الحفظ</button></div>
      </section>}
    </div>
  );
}

// ======================= اختيار السورة والمقطع =======================
function Pick({ mode, by }) {
  const { mem } = useStore();
  const [q, setQ] = useState(''), [s, setS] = useState(null), [from, setFrom] = useState(1), [to, setTo] = useState(1);
  const strip = (x) => x.replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');
  const list = useMemo(() => { const k = strip(q.trim()); return k ? SURAHS.filter((x) => strip(x.name).includes(k)) : [...SURAHS].reverse(); }, [q]);
  const choose = (n) => { const N = SURAHS[n - 1].ayahs; setS(n); setFrom(1); setTo(mode === 'learn' ? Math.min(N, 10) : Math.min(N, 30)); };
  const title = mode === 'learn' ? 'احفظ بالترديد' : 'سمّع من حفظك';
  if (s) { const N = SURAHS[s - 1].ayahs, st = surahStrength(mem.ayat, s);
    return (
      <div className="screen no-nav">
        <TopBar title={title} sub={'سورة ' + sname(s)} fallback="/hafiz" />
        <section className="card col" style={{ gap: 12 }}>
          <div className="row"><span className="amiri" style={{ flex: 1, fontSize: 22, fontWeight: 700 }}>سورة {sname(s)}</span><span className="xs muted">{ar(N)} آية</span></div>
          {st.seen > 0 && <div className="small">قوة الحفظ: <b style={{ color: label(st.strength)[1] }}>{label(st.strength)[0]}</b> • غُطّي {pct(st.cover)} من السورة</div>}
          <div className="grid2">
            <label className="col xs muted" style={{ gap: 4 }}>من الآية<input type="number" min={1} max={N} value={from} onChange={(e) => { const v = Math.max(1, Math.min(N, +e.target.value || 1)); setFrom(v); if (to < v) setTo(v); }} className="card" style={{ padding: 10, fontSize: 18 }} /></label>
            <label className="col xs muted" style={{ gap: 4 }}>إلى الآية<input type="number" min={from} max={N} value={to} onChange={(e) => setTo(Math.max(from, Math.min(N, +e.target.value || from)))} className="card" style={{ padding: 10, fontSize: 18 }} /></label>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{[[1, N, 'السورة كاملة'], [from, Math.min(N, from + 4), '٥ آيات'], [from, Math.min(N, from + 9), '١٠ آيات']].map(([a, b, l]) => <button key={l} className="chip" onClick={() => { setFrom(a); setTo(b); }}>{l}</button>)}</div>
          {to - from > 40 && <div className="xs muted">نصيحة: المقاطع الأقصر (١٠–٢٠ آية) أفضل للتركيز.</div>}
          <button className="btn" style={{ minHeight: 52 }} onClick={() => go(`/hafiz/${mode}/${s}/${from}-${to}`)}><Mic size={18} /> ابدأ</button>
          <button className="btn ghost" onClick={() => setS(null)}>سورة أخرى</button>
        </section>
      </div>
    ); }
  return (
    <div className="screen no-nav">
      <TopBar title={title} sub="اختر السورة" fallback="/hafiz" />
      <label className="card row" style={{ padding: '0 14px', minHeight: 46 }}><Search size={18} className="muted" aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم السورة" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 44 }} /></label>
      {list.map((x) => { const st = surahStrength(mem.ayat, x.n);
        return (
          <button key={x.n} onClick={() => choose(x.n)} className="card row" style={{ padding: '10px 14px', textAlign: 'right' }}>
            <span className="xs muted" style={{ width: 26 }}>{ar(x.n)}</span>
            <span className="amiri" style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>سورة {x.name}</span>
            {st.seen > 0 && <Pill c={label(st.strength)[1]}>{label(st.strength)[0]}</Pill>}
            <span className="xs muted">{ar(x.ayahs)} آية</span>
          </button>
        ); })}
    </div>
  );
}

// ======================= الاختبار الذكي (تكيّفي) / تحديد المستوى =======================
// كل سؤال: القارئ يقرأ آية والمختبَر يُكمل التي بعدها (أو يقرأ آية برقمها في المستوى الأصعب).
// الصعوبة تتكيّف: إجابتان صحيحتان متتاليتان ترفعان المستوى، والخطأ يخفضه.
function Quiz({ kind, by }) {
  const { mem, memAyah, memMany, memLog, memCert, rufaqa, hifz, updateHifz } = useStore();
  const P = mem.prefs, PASS = Math.min(P.strict || 0.9, 0.88);
  const SCOPES = [['جزء عمّ', 78, 114], ['جزء تبارك', 67, 77], ['جزء قد سمع', 58, 66], ['الأجزاء ٢٦–٣٠', 46, 114], ['القرآن كاملًا (عينة)', 1, 114]];
  const [scope, setScope] = useState(null);
  const items = useMemo(() => {
    if (kind === 'test') return pickTest(mem.ayat, 12);
    if (!scope) return [];
    // تحديد المستوى: من كل سورة في النطاق آية أو آيتان (من أولها وآخرها للسور الطويلة)
    const out = []; const step = scope[2] - scope[1] > 60 ? 3 : 1;
    for (let s = scope[2]; s >= scope[1]; s -= step) { const N = SURAHS[s - 1].ayahs; if (N < 2) continue; out.push({ s, a: 2 + Math.floor(Math.random() * Math.min(N - 1, N > 20 ? 10 : N - 1)) }); if (N > 20) out.push({ s, a: N - Math.floor(Math.random() * 6) }); }
    return out;
  }, [scope]);
  const [i, setI] = useState(-1), [lv, setLv] = useState(1), [hits, setHits] = useState(null), [heard, setHeard] = useState(''), [note, setNote] = useState(null), [turn, setTurn] = useState(false), [res, setRes] = useState([]), [fin, setFin] = useState(false), [cert, setCert] = useState(null), [applied, setApplied] = useState(false);
  const run = useRef({ n: 0, cur: null, ear: null, skip: null });
  const alive = (my) => run.current.n === my;
  useEffect(() => { micReady().then((m) => m === 'ok' && warmMic()); return () => { run.current.n++; try { run.current.cur?.pause(); } catch (e) {} run.current.ear?.stop(); }; }, []);
  const begin = async () => {
    const my = ++run.current.n; const out = []; let level = 1, streak = 0; setRes([]); setFin(false);
    const m = await Promise.race([micReady(), wait(3000).then(() => 'unk')]);
    if (m !== 'ok') { setNote({ ok: false, t: 'الاختبار يحتاج المايك — اسمح للتطبيق باستخدامه ثم أعد المحاولة' }); return; }
    for (let q = 0; q < items.length; q++) {
      if (!alive(my)) return;
      const it = items[q], ayat = by[it.s]; const x = ayat[it.a - 1], prev = ayat[it.a - 2]; const words = ayahWords(x.t);
      const qk = kind === 'test' && level === 3 ? 'start' : 'next';
      setI(q); setLv(level); setHits(words.map(() => false)); setHeard(''); setNote(null); setTurn(false);
      if (qk === 'next') await playAyah(P.reciter, it.s, prev.a, run.current, my);
      if (!alive(my)) return;
      setTurn(true);
      const ctx = { all: '' }; let best = words.map(() => false);
      for (let round = 0; round < 2 && alive(my); round++) {
        const skipP = new Promise((r) => { run.current.skip = r; });
        const ear = hear({ waitMs: round ? 4000 : 9000, maxMs: 10000 + words.length * 800, onText: (t) => { const txt = (ctx.all + ' ' + t).trim(); setHeard(txt); const h = align(words, txt); setHits(h); if (score(h) >= 0.97) ear.stop(); } });
        run.current.ear = ear; const t = await Promise.race([ear.promise, skipP.then(() => { ear.stop(); return null; })]); run.current.ear = null;
        if (t === null) { ctx.skip = true; break; }
        if (!t) break; ctx.all = (ctx.all + ' ' + t).trim(); best = align(words, ctx.all); if (score(best) >= 0.97) break;
      }
      if (!alive(my)) return;
      setTurn(false);
      const acc = ctx.skip ? 0 : score(best), ok = acc >= PASS;
      setHits(words.map(() => true));
      if (kind === 'test') { const k = keyOf(it.s, it.a); memAyah(k, review(useStore.getState().mem.ayat[k], gradeOf(acc, 1), best.map((h, j) => (h ? -1 : j)).filter((j) => j >= 0))); }
      out.push({ ...it, ok, acc, level }); setRes([...out]);
      if (ok) { setNote({ ok: true, t: 'أحسنت، بارك الله فيك' }); streak++; if (kind === 'test' && streak >= 2 && level < 3) { level++; streak = 0; } await wait(900); }
      else { setNote({ ok: false, t: ctx.skip ? 'تم التخطّي' : 'استمع للآية صحيحة' }); streak = 0; if (kind === 'test' && level > 1) level--; if (!ctx.skip) await playAyah(P.reciter, it.s, it.a, run.current, my); }
    }
    if (!alive(my)) return;
    setI(-1); setFin(true);
    const W = out.reduce((t, r) => t + r.level, 0), got = out.reduce((t, r) => t + (r.ok ? r.level : 0), 0), sc = W ? got / W : 0;
    memLog('tests', { kind, n: out.length, ok: out.filter((r) => r.ok).length, score: sc, pts: out.filter((r) => r.ok).length * 3 });
    if (kind === 'test' && sc >= 0.8) { const per = {}; out.forEach((r) => { per[r.s] = per[r.s] || [0, 0]; per[r.s][1]++; if (r.ok) per[r.s][0]++; });
      const c = { id: 'test-' + Date.now(), kind: 'test', title: 'شهادة اختبار الحفظ', name: P.name || rufaqa.name || 'القارئ', verb: 'اجتاز الاختبار الذكي في حفظ', main: `${ar(Object.keys(per).length)} ${Object.keys(per).length > 2 ? 'سور' : 'سورة'} من القرآن الكريم`, sub: `النتيجة ${pct(sc)}`, lines: Object.entries(per).slice(0, 10).map(([s, [a, b]]) => ['سورة ' + sname(+s), `${ar(a)} من ${ar(b)}`, a === b ? '#1F7A55' : '#B8892B']), grade: sc >= 0.95 ? 'ممتاز' : sc >= 0.88 ? 'جيد جدًا' : 'جيد', at: Date.now() };
      memCert(c); setCert(c); }
  };
  // اعتماد نتيجة تحديد المستوى: السور المحفوظة تُضاف لنموذج الذاكرة (والجزئية بثبات أقل لتظهر في المراجعة قريبًا)
  const known = useMemo(() => { const per = {}; res.forEach((r) => { per[r.s] = per[r.s] || [0, 0]; per[r.s][1]++; if (r.ok) per[r.s][0]++; }); return per; }, [res]);
  const apply = () => {
    const upd = {}, pages = {}, now = Date.now();
    for (const [s0, [a, b]] of Object.entries(known)) { const s = +s0; if (!a) continue; const full = a === b; const N = SURAHS[s - 1].ayahs;
      for (let k = 1; k <= N; k++) { const key = keyOf(s, k); if (mem.ayat[key]) continue; const S = full ? 6 : 1.2; upd[key] = { S, D: full ? 4.5 : 6.5, last: now - S * 0.5 * 86400000, due: now + (full ? 2 + (k % 5) : 1) * 86400000, n: 0, lapses: 0, acc: [], w: {}, first: now, est: true }; }
      if (full) { const r = surahPages(s); for (let p = r.from; p <= r.to; p++) if (!isMem(hifz.pages[p])) pages[p] = firstMemorize(); } }
    memMany(upd); if (Object.keys(pages).length) updateHifz(pages); setApplied(true);
  };
  const it = items[i], x = it && by[it.s][it.a - 1], prev = it && by[it.s][it.a - 2];
  if (kind === 'placement' && !scope) return (
    <div className="screen no-nav">
      <TopBar title="تحديد المستوى" sub="اختبار سريع لمعرفة ما تحفظه" fallback="/hafiz" />
      <div className="card small" style={{ lineHeight: 1.9 }}>يقرأ القارئ آية من كل سورة، وتُكمل أنت الآية التي بعدها من حفظك. إن لم تكن تحفظ سورة اضغط «لا أحفظها». في النهاية تعرف مستواك ويُبنى لك جدول مراجعة تلقائيًا.</div>
      {SCOPES.map((sc) => <button key={sc[0]} className="card row" style={{ padding: 14, textAlign: 'right' }} onClick={() => setScope(sc)}><Gauge size={20} className="accent" /><span style={{ flex: 1, fontWeight: 700 }}>{sc[0]}</span><span className="xs muted">من {sname(sc[1])} إلى {sname(sc[2])}</span></button>)}
    </div>
  );
  if (kind === 'test' && items.length < 4) return (
    <div className="screen no-nav"><TopBar title="الاختبار الذكي" fallback="/hafiz" /><div className="card small" style={{ lineHeight: 1.9 }}>يحتاج الاختبار إلى آيات محفوظة في سجلك. سمّع بعض السور أو أجرِ «تحديد المستوى» أولًا.</div><button className="btn" onClick={() => go('/hafiz/placement')}>تحديد المستوى</button></div>
  );
  const okN = res.filter((r) => r.ok).length;
  return (
    <div className="screen no-nav">
      <TopBar title={kind === 'test' ? 'الاختبار الذكي' : 'تحديد المستوى: ' + scope[0]} sub={`${ar(items.length)} سؤالًا`} fallback="/hafiz" />
      {cert && <Cert c={cert} onClose={() => setCert(null)} />}
      {!fin && i < 0 && <button className="btn" style={{ minHeight: 56, fontSize: 16 }} onClick={begin}><Mic size={20} /> ابدأ</button>}
      {i >= 0 && <div className="row" style={{ gap: 3 }}>{items.map((_, k) => <span key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < i ? (res[k]?.ok ? 'var(--acc)' : '#E0507A') : k === i ? '#E2A92B' : 'var(--line)' }} />)}</div>}
      {it && <>
        <div className="between"><span className="small" style={{ fontWeight: 700 }}>سورة {sname(it.s)}</span>{kind === 'test' && <Pill c={['', '#1FA36A', '#2F7BEA', '#8B5CF6'][lv]}>المستوى {ar(lv)}</Pill>}</div>
        {lv < 3 || kind !== 'test' ? <section className="card center" style={{ background: 'var(--surf2)' }}><div className="xs muted">يقرأ القارئ الآية {ar(prev.a)}</div><div style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 22, lineHeight: 2 }}>{prev.t} <span className="accent">﴿{ar(prev.a)}﴾</span></div></section>
          : <section className="card center" style={{ background: 'var(--surf2)' }}><div style={{ fontWeight: 700 }}>اقرأ الآية رقم {ar(it.a)} من سورة {sname(it.s)}</div></section>}
        <section className="card center" style={{ borderStyle: 'dashed', borderColor: 'var(--acc)' }}>
          <div className="small accent" style={{ fontWeight: 700 }}>{turn ? 'أكمل من حفظك…' : `الآية ${ar(it.a)}`}</div>
          <div style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 22, lineHeight: 2 }}>{ayahWords(x.t).map((w, j) => <span key={j} style={{ color: hits?.[j] ? 'var(--acc)' : 'inherit', filter: hits?.[j] || (kind === 'test' && lv === 1 && j === 0) ? 'none' : 'blur(6px)', transition: 'all .2s' }}>{w} </span>)}</div>
          {heard && <div className="xs muted">«{heard}»</div>}
        </section>
        {turn && <button className="btn ghost" onClick={() => run.current.skip?.()}>{kind === 'placement' ? 'لا أحفظ هذه السورة' : 'تخطَّ'}</button>}
      </>}
      {note && <div className="card center small" style={{ fontWeight: 700, color: note.ok ? '#1FA36A' : '#C2410C' }}>{note.t}</div>}
      {fin && <section className="card col" style={{ gap: 8 }}>
        <div className="h2">النتيجة: {ar(okN)} من {ar(res.length)}</div>
        {kind === 'test' && (() => { const W = res.reduce((t, r) => t + r.level, 0), sc = W ? res.reduce((t, r) => t + (r.ok ? r.level : 0), 0) / W : 0; return <div className="small">الدرجة الموزونة بالصعوبة: <b style={{ color: label(sc)[1] }}>{pct(sc)}</b> — {sc >= 0.9 ? 'حفظ متقن' : sc >= 0.75 ? 'حفظ جيد يحتاج تثبيتًا' : 'يحتاج مراجعة مركّزة'}</div>; })()}
        {kind === 'placement' && <>
          {Object.entries(known).map(([s, [a, b]]) => <div key={s} className="row small"><span className="amiri" style={{ flex: 1, fontSize: 17 }}>سورة {sname(+s)}</span><Pill c={a === b ? '#1FA36A' : a ? '#E2A92B' : '#E0507A'}>{a === b ? 'محفوظة' : a ? 'جزئيًا' : 'غير محفوظة'}</Pill></div>)}
          {!applied ? <button className="btn" onClick={apply}>اعتمد النتيجة وابنِ جدول المراجعة</button> : <div className="small accent" style={{ fontWeight: 700 }}>تم — أُضيفت السور المحفوظة إلى خطتك.</div>}
        </>}
        {kind === 'test' && res.some((r) => !r.ok) && <div className="small" style={{ color: '#C2410C', lineHeight: 1.8 }}>آيات تحتاج مراجعة: {res.filter((r) => !r.ok).map((r) => `${sname(r.s)} ${ar(r.a)}`).join('، ')}</div>}
        <button className="btn soft" onClick={() => go('/hafiz')}>لوحة الحفظ</button>
      </section>}
    </div>
  );
}

// ======================= التقرير =======================
function Report({ by }) {
  const { mem } = useStore();
  const now = Date.now(), ov = overview(mem.ayat, now), fc = forecast(mem.ayat, 7, now), weak = weakest(mem.ayat, 8, now);
  const juz = useMemo(() => { const out = Array.from({ length: 30 }, () => [0, 0]); for (const [k, m] of Object.entries(mem.ayat)) { const [s, a] = k.split(':').map(Number); const j = by?.[s]?.[a - 1]?.j || SURAHS[s - 1].juz || 30; out[j - 1][0] += recall(m, now); out[j - 1][1]++; } return out; }, [mem.ayat, by]);
  const words = useMemo(() => { const c = []; for (const [k, m] of Object.entries(mem.ayat)) for (const [j, n] of Object.entries(m.w || {})) { const [s, a] = k.split(':').map(Number); const t = by?.[s]?.[a - 1]?.t; if (t) c.push({ w: ayahWords(t)[+j], n, s, a }); } return c.sort((p, q) => q.n - p.n).slice(0, 8); }, [mem.ayat, by]);
  const ses = [...(mem.sessions || []), ...(mem.tests || []).map((t) => ({ ...t, acc: t.score }))].sort((a, b) => a.at - b.at).slice(-20);
  const maxF = Math.max(1, ...fc);
  return (
    <div className="screen no-nav">
      <TopBar title="تقرير الحفظ" sub={'المستوى: ' + ov.level} fallback="/hafiz" />
      <section className="grid2">
        {[['آيات متقنة', ar(ov.strong)], ['تحتاج مراجعة', ar(ov.weak)], ['ما يعادل', ar(ov.juzEq.toFixed(1).replace('.', '٫')) + ' جزء'], ['متوسط التذكّر', pct(ov.avg)]].map(([l, v]) => <div key={l} className="card center"><div className="xs muted">{l}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div></div>)}
      </section>
      <section className="card"><div className="h2">قوة الحفظ في الأجزاء</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 6 }}>
          {[...juz].map(([sum, n], j) => ({ j: j + 1, r: n ? sum / n : -1 })).reverse().map(({ j, r }) => <div key={j} title={r < 0 ? '' : pct(r)} style={{ height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, background: r < 0 ? 'var(--surf2)' : label(r)[1], color: r < 0 ? 'var(--muted)' : '#fff' }}>{ar(j)}</div>)}
        </div>
        <div className="row xs muted" style={{ gap: 10, marginTop: 8, flexWrap: 'wrap' }}>{[0.95, 0.8, 0.6, 0.3].map((r) => <span key={r} className="row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: label(r)[1] }} />{label(r)[0]}</span>)}</div>
      </section>
      <section className="card col" style={{ gap: 8 }}><div className="h2">السور</div>
        {ov.surahs.length === 0 && <div className="small muted">لا توجد بيانات بعد — ابدأ بالتسميع أو تحديد المستوى.</div>}
        {ov.surahs.map((s) => { const st = surahStrength(mem.ayat, s, now); return <div key={s} className="col" style={{ gap: 3 }}><div className="row small"><span className="amiri" style={{ flex: 1, fontSize: 17 }}>سورة {sname(s)}</span><span style={{ color: label(st.strength)[1], fontWeight: 700 }}>{label(st.strength)[0]} • {pct(st.strength)}</span></div><div style={{ height: 6, borderRadius: 3, background: 'var(--surf2)' }}><div style={{ width: st.cover * 100 + '%', height: '100%', borderRadius: 3, background: label(st.strength)[1] }} /></div></div>; })}
      </section>
      <section className="card"><div className="h2">المراجعة في الأيام القادمة</div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 6, height: 90, marginTop: 10 }}>{fc.map((n, d) => <div key={d} className="col center" style={{ flex: 1, gap: 2 }}><span className="xs">{ar(n)}</span><div style={{ width: '100%', height: (n / maxF) * 60 + 2, borderRadius: 6, background: 'var(--acc)', opacity: d ? 0.6 : 1 }} /><span className="xs muted">{d ? new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(new Date(now + d * 86400000)) : 'اليوم'}</span></div>)}</div>
      </section>
      {ses.length > 1 && <section className="card"><div className="h2">تطوّر الدقة</div>
        <svg viewBox="0 0 300 80" style={{ width: '100%', height: 90, marginTop: 8 }} aria-label="تطوّر الدقة في آخر الجلسات"><polyline fill="none" stroke="var(--acc)" strokeWidth="3" strokeLinejoin="round" points={ses.map((x, k) => `${(k / (ses.length - 1)) * 290 + 5},${75 - (x.acc || 0) * 70}`).join(' ')} />{ses.map((x, k) => <circle key={k} cx={(k / (ses.length - 1)) * 290 + 5} cy={75 - (x.acc || 0) * 70} r="3.5" fill="var(--acc)" />)}</svg>
      </section>}
      {weak.length > 0 && <section className="card col" style={{ gap: 8 }}><div className="h2">أضعف الآيات</div>
        {weak.map((w) => <button key={w.k} className="row" style={{ textAlign: 'right', padding: '8px 10px', borderRadius: 12, background: 'var(--surf2)', border: 0 }} onClick={() => go(`/hafiz/review/${w.s}/${Math.max(1, w.a - 1)}-${Math.min(SURAHS[w.s - 1].ayahs, w.a + 1)}`)}><span style={{ flex: 1 }} className="small">سورة {sname(w.s)} — الآية {ar(w.a)}</span><Pill c={label(w.r)[1]}>{pct(w.r)}</Pill></button>)}
      </section>}
      {words.length > 0 && <section className="card col" style={{ gap: 6 }}><div className="h2">كلمات يتكرر فيها الخطأ</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{words.map((w, k) => <span key={k} className="chip" style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 18 }}>{w.w} <span className="xs muted">({sname(w.s)} {ar(w.a)} • {ar(w.n)}×)</span></span>)}</div>
      </section>}
    </div>
  );
}

// ======================= الشهادات =======================
function Certs() {
  const { mem, memPrefs, rufaqa } = useStore();
  const [open, setOpen] = useState(null), [name, setName] = useState(mem.prefs.name || rufaqa.name || '');
  const list = [...(mem.certs || [])].sort((a, b) => b.at - a.at);
  return (
    <div className="screen no-nav">
      <TopBar title="شهاداتي" sub={`${ar(list.length)} شهادة`} fallback="/hafiz" />
      {open && <Cert c={{ ...open, name: mem.prefs.name || open.name }} onClose={() => setOpen(null)} />}
      <section className="card col" style={{ gap: 6 }}><span className="xs muted">الاسم الذي يُكتب على الشهادات</span><div className="row"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" className="card" style={{ flex: 1, padding: 10 }} /><button className="btn" onClick={() => memPrefs({ name: name.trim() })}>حفظ</button></div></section>
      {list.length === 0 && <div className="card small muted" style={{ lineHeight: 1.9 }}>تحصل على شهادة عند تسميع سورة كاملة دون أخطاء، أو عند اجتياز الاختبار الذكي بنسبة ٨٠٪ فأكثر.</div>}
      {list.map((c) => <button key={c.id} className="card row" style={{ padding: 14, textAlign: 'right' }} onClick={() => setOpen(c)}><Award size={24} style={{ color: '#B8892B' }} /><span className="col" style={{ flex: 1, gap: 2 }}><b>{c.title}</b><span className="small amiri" style={{ fontSize: 16 }}>{c.main}</span></span><span className="xs muted">{new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(new Date(c.at))}</span></button>)}
    </div>
  );
}

// ======================= لوحة الحفظ =======================
function Dashboard() {
  const { mem, memPrefs } = useStore();
  const [opt, setOpt] = useState(false);
  const now = Date.now(), ov = overview(mem.ayat, now), plan = dailyPlan(mem.ayat, { maxAyat: 40 }, now);
  const last = [...(mem.sessions || [])].reverse()[0];
  const tiles = [
    ['/hafiz/pick/learn', BookOpen, 'احفظ بالترديد', 'القارئ يقرأ وتردّد بصوتك'],
    ['/hafiz/pick/recite', Mic, 'سمّع من حفظك', 'الآيات مخفية وتظهر مع قراءتك'],
    ['/hafiz/test', Brain, 'الاختبار الذكي', 'أسئلة تتكيّف مع مستواك'],
    ['/hafiz/placement', Gauge, 'تحديد المستوى', 'اعرف ما تحفظه في دقائق'],
    ['/hafiz/report', BarChart3, 'التقرير', 'قوة الحفظ والأخطاء والتوقعات'],
    ['/hafiz/certs', Award, 'شهاداتي', `${ar((mem.certs || []).length)} شهادة`],
  ];
  return (
    <div className="screen no-nav">
      <TopBar title="الحفظ الذكي" sub="احفظ وسمّع واختبر بصوتك" fallback="/hifz" right={<button className="icon-btn" aria-label="إعدادات" onClick={() => setOpt(!opt)}><Settings2 size={19} /></button>} />
      <AnimatePresence>{opt && <motion.section initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card col" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 6 }}><span className="xs muted">القارئ</span><select value={mem.prefs.reciter} onChange={(e) => memPrefs({ reciter: e.target.value })} className="card" style={{ padding: 10 }}>{RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.style}</option>)}</select></div>
        <div className="col" style={{ gap: 6 }}><span className="xs muted">تكرار كل آية عند الحفظ</span><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 6 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={'chip' + ((mem.prefs.reps || 1) === n ? ' on' : '')} onClick={() => memPrefs({ reps: n })}>{ar(n)}</button>)}</div></div>
        <div className="col" style={{ gap: 6 }}><span className="xs muted">دقة التصحيح</span><div className="grid2" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>{[[0.85, 'متساهل'], [0.9, 'متوسط'], [0.95, 'صارم']].map(([v, l]) => <button key={v} className={'chip' + ((mem.prefs.strict || 0.9) === v ? ' on' : '')} onClick={() => memPrefs({ strict: v })}>{l}</button>)}</div></div>
        <button className="btn ghost" onClick={() => { const l = micLog.slice(-8).join('\n'); alert(l || 'لا توجد سجلات بعد'); }}>سجل المايك (للدعم الفني)</button>
      </motion.section>}</AnimatePresence>
      <section className="row" style={{ gap: 16, padding: 18, borderRadius: 26, background: 'var(--hero)', color: 'var(--heroText)' }}>
        <Ring size={100} value={ov.avg} label={`متوسط التذكّر ${Math.round(ov.avg * 100)}٪`}><span className="num" style={{ fontSize: 22, color: 'var(--heroText)' }}>{pct(ov.avg)}</span><span className="xs" style={{ opacity: .85 }}>التذكّر</span></Ring>
        <div className="col" style={{ gap: 4 }}>
          <span className="xs" style={{ opacity: .85 }}>مستواك</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{ov.level}</span>
          <span className="xs" style={{ opacity: .9 }}>{ar(ov.strong)} آية متقنة • ≈ {ar(ov.juzEq.toFixed(1).replace('.0', '').replace('.', '٫'))} جزء</span>
          {last && <span className="xs" style={{ opacity: .85 }}>آخر جلسة: سورة {sname(last.s)} • دقة {pct(last.acc)}</span>}
        </div>
      </section>
      <div className="between"><h2 className="h2">مراجعة اليوم</h2><span className="row xs muted"><CalendarClock size={15} /> {ar(plan.total)} آية مستحقة</span></div>
      <section className="card col" style={{ gap: 8 }}>
        {ov.tracked === 0 ? <div className="small muted" style={{ lineHeight: 1.9 }}>ابدأ بـ«تحديد المستوى» ليعرف الرفيق ما تحفظه ويبني لك خطة مراجعة يومية تلقائيًا.</div>
          : plan.segs.length === 0 ? <div className="small accent" style={{ fontWeight: 700 }}>لا مراجعة مستحقة الآن — أحسنت. احفظ جديدًا أو اختبر نفسك.</div>
          : plan.segs.map((g) => <button key={g.s + '-' + g.from} className="row" style={{ textAlign: 'right', padding: '10px 12px', borderRadius: 14, background: 'var(--surf2)', border: 0 }} onClick={() => go(`/hafiz/review/${g.s}/${g.from}-${g.to}`)}>
            <RotateCcw size={17} className="accent" /><span style={{ flex: 1 }}><b className="small">سورة {sname(g.s)}</b> <span className="xs muted">· الآيات {ar(g.from)}{g.to > g.from ? '–' + ar(g.to) : ''}</span></span><Pill c={label(g.r)[1]}>{pct(g.r)}</Pill></button>)}
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {tiles.map(([to, I, t, d]) => <motion.button key={to} whileTap={{ scale: 0.97 }} className="card col" style={{ gap: 6, textAlign: 'right', padding: 14 }} onClick={() => go(to)}><I size={24} className="accent" /><b>{t}</b><span className="xs muted" style={{ lineHeight: 1.6 }}>{d}</span></motion.button>)}
      </div>
      <section className="card small muted" style={{ lineHeight: 1.9 }}><Target size={16} className="accent" style={{ verticalAlign: 'middle' }} /> كيف يعمل: كل آية تسمّعها يُقاس فيها مدى ثباتها في حفظك، فتعود إليك الآيات الضعيفة قريبًا، وتتباعد الآيات المتقنة أسابيع ثم شهورًا.</section>
    </div>
  );
}

export default function Hafiz({ sub, arg, arg2 }) {
  const { by, error } = useAyat();
  if (!sub) return <Dashboard />;
  if (sub === 'report') return <Report by={by} />;
  if (sub === 'certs') return <Certs />;
  if (sub === 'pick') return <Pick mode={arg === 'recite' ? 'recite' : 'learn'} by={by} />;
  if (!by) return <div className="screen no-nav"><TopBar title="الحفظ الذكي" fallback="/hafiz" /><div className="card center small">{error ? 'تعذّر تحميل المصحف' : 'جارٍ تحميل المصحف…'}</div></div>;
  if (sub === 'test') return <Quiz key="t" kind="test" by={by} />;
  if (sub === 'placement') return <Quiz key="p" kind="placement" by={by} />;
  if (['learn', 'recite', 'review'].includes(sub) && SURAHS[+arg - 1]) {
    const s = +arg, N = SURAHS[s - 1].ayahs; const [f, t] = (arg2 || `1-${N}`).split('-').map(Number);
    return <Session key={sub + s + arg2} mode={sub} s={s} from={Math.max(1, f || 1)} to={Math.min(N, t || N)} by={by} />;
  }
  return <Dashboard />;
}
