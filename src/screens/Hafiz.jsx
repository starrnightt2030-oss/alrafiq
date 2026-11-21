// الحفظ الذكي بالصوت: حفظ بالترديد، وتسميع، ومراجعة يومية مُجدولة، واختبار تكيّفي، وتحديد مستوى، وتقارير وشهادات.
// كل تسميع يُحدّث نموذج ذاكرة لكل آية (lib/memory.js)، ومنه تُبنى خطة المراجعة والمستوى والتقارير.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Brain, Target, BarChart3, Award, BookOpen, RotateCcw, Search, Gauge, Volume2, CheckCircle2, XCircle, CalendarClock, Square, Settings2 } from 'lucide-react';
import { useStore } from '../store.js';
import { useQuran } from '../lib/quran.js';
import { RECITERS, reciterOf, srcOf } from '../lib/recite.js';
import { voiceEnd } from '../lib/voiceEnd.js';
import { micReady, hear, warmMic, micLog } from '../lib/listen.js';
import { ayahWords, align, score } from '../lib/match.js';
import { review, gradeOf, recall, keyOf, overview, surahStrength, label, weakest, forecast, dailyPlan, pickTest, GRADE, SURAHS } from '../lib/memory.js';
import { surahPages, isMem, firstMemorize } from '../lib/hifz.js';
import { ar } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { TopBar, Ring } from '../components/ui.jsx';
import Cert from '../components/Cert.jsx';
import { go } from '../router.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sfxSoft = () => { try { vibrate([30]); } catch (e) {} };
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
// near(): بتتنادي قبل آخر الآية بلحظة، عشان المايك يبدأ يجهز والشيخ لسه بيخلّص، فيبقى جاهز أول ما يسكت
const LEAD = 0.5;
// بيخلّص أول ما صوت الشيخ نفسه يخلص (مش لما الملف يخلص بالسكوت اللي في آخره) — شوف voiceEnd.js
function playAyah(rid, s, a, run, my, near) {
  return new Promise(async (res) => {
    let fired = false, done = false, t1 = null, t2 = null;
    const fire = () => { if (fired) return; fired = true; try { near?.(); } catch (e) {} };
    const end = (au, d) => { if (done) return; done = true; clearTimeout(t1); clearTimeout(t2); fire(); res(d); };
    try {
      const src = await srcOf(reciterOf(rid).folder, s, a);
      if (run.n !== my) return res(0);
      const au = new Audio(src); au.preload = 'auto'; run.cur = au;
      let ve = null; // آخر لحظة فيها صوت الشيخ
      const plan = () => {
        if (done || ve == null || au.paused) return;
        const left = (ve - au.currentTime) / (au.playbackRate || 1) * 1000;
        clearTimeout(t1); clearTimeout(t2);
        if (near) t1 = setTimeout(fire, Math.max(0, left - LEAD * 1000));
        // الشيخ سكت: دورك على طول، وباقي الملف (سكوت/صدى) بيتقفل بهدوء
        t2 = setTimeout(() => { if (done) return; try { au.pause(); } catch (e) {} end(au, ve); }, Math.max(0, left));
      };
      voiceEnd(src).then((v) => { if (v && v > 0.5 && (!au.duration || v < au.duration - 0.15)) { ve = v; plan(); } });
      au.onplaying = plan; au.onseeked = plan;
      au.ontimeupdate = () => { if (near && au.duration && au.duration - au.currentTime <= LEAD) fire(); };
      au.onended = () => end(au, au.duration || 3); au.onerror = () => end(au, 0);
      au.play().catch(() => end(au, 0));
    } catch (e) { fire(); res(0); }
  });
}
// إشارة «دورك» لما الشيخ يخلّص: اهتزازة خفيفة
const yourTurn = () => vibrate([18, 40, 18]);
// بعد ما آخر كلمة في الآية تتقال، لو المستخدم سكت المدة دي نعتبره خلّص (من غير ما نستنى المحرّك يقفل لوحده)
const DONE_MS = 900;
// سماع آية واحدة: السماع الأول ممكن يبدأ «مكتوم» قبل آخر صوت الشيخ (lead)، ويفتح أول ما الشيخ يسكت.
// بيرجع كلمات الآية واللي اتقال صح منها والكلام المسموع
async function listenFor({ words, my, alive, lead, rounds = 3, setPhase, setHeard, setHit, waitFirst = 8000, holder }) {
  const ctx = { all: '', skip: false }; let best = words.map(() => false);
  setHeard(''); setHit(best);
  const mk = (round, muted) => {
    let open = !muted, doneT = null;
    const ear = hear({
      muted, waitMs: round ? 4500 : waitFirst, maxMs: 10000 + words.length * 900,
      onReady: () => { if (open && alive(my)) setPhase('live'); },
      rank: (t) => score(align(words, ctx.all + ' ' + t)),
      onText: (t) => {
        const txt = (ctx.all + ' ' + t).trim(); setHeard(txt);
        const h = align(words, txt); setHit(h);
        clearTimeout(doneT);
        if (score(h) >= 0.97) ear.stop();
        else if (h[h.length - 1] && score(h) >= 0.5) doneT = setTimeout(() => ear.stop(), DONE_MS); // وصل لآخر الآية وسكت
      },
    });
    return { ear, open: () => { if (open) return; open = true; ear.unmute(); } };
  };
  let first = null;
  if (lead) {
    await lead(() => { if (!first && alive(my)) first = mk(0, true); });
    if (!alive(my)) { first?.ear.stop(); return null; }
  }
  for (let round = 0; round < rounds && alive(my); round++) {
    let e;
    if (round === 0 && first) { e = first; e.open(); setPhase('live'); yourTurn(); }
    else { e = mk(round, false); setPhase(round || lead ? 'live' : 'prep'); if (!round) yourTurn(); }
    holder.ear = e.ear;
    const skipP = new Promise((r) => { holder.skip = r; });
    const t = await Promise.race([e.ear.promise, skipP.then(() => { e.ear.stop(); return null; })]);
    holder.ear = null; holder.skip = null;
    if (t === null) { ctx.skip = true; break; }
    if (!t) break;
    ctx.all = (ctx.all + ' ' + t).trim(); best = align(words, ctx.all);
    if (score(best) >= 0.97 || (best[best.length - 1] && score(best) >= 0.5)) break; // قرأ الآية لآخرها: نقيّم على طول
  }
  setPhase(null); setHit(best);
  return { acc: ctx.skip ? 0 : score(best), hit: best, missed: best.map((h, j) => (h ? -1 : j)).filter((j) => j >= 0), said: !!ctx.all, skip: ctx.skip, heard: ctx.all, words };
}
// دقة التصحيح: القيم القديمة (٠٫٨٥/٠٫٩/٠٫٩٥) بتتحوّل للجديدة الأكثر تسامحًا مع نطق المحرّك
export const passOf = (v) => ({ 0.85: 0.75, 0.9: 0.85, 0.95: 0.92 })[v] || v || 0.85;
// لوحة المايك: بتقول للمستخدم إمتى يسمع وإمتى يتكلم، وبتكتب كلامه قدامه أول بأول
function MicCue({ phase, heard, hint }) {
  if (!phase) return null;
  const live = phase === 'live', words = (heard || '').split(/\s+/).filter(Boolean);
  const C = live ? '#1FA36A' : phase === 'prep' ? '#E2A92B' : '#2F7BEA';
  return (
    <section className="card col" style={{ gap: 10, alignItems: 'center', borderColor: C, borderWidth: 2, background: `color-mix(in srgb, ${C} 6%, var(--surf))` }} aria-live="polite">
      <div style={{ position: 'relative', width: 84, height: 84, display: 'grid', placeItems: 'center' }}>
        {live && [0, 1].map((k) => <motion.span key={k} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${C}` }} animate={{ scale: [1, 1.6], opacity: [0.7, 0] }} transition={{ repeat: Infinity, duration: 1.4, delay: k * 0.7 }} />)}
        <motion.span animate={live ? { scale: [1, 1.08, 1] } : phase === 'prep' ? { opacity: [1, 0.5, 1] } : {}} transition={{ repeat: Infinity, duration: live ? 1 : 0.8 }}
          style={{ width: 72, height: 72, borderRadius: '50%', background: C, display: 'grid', placeItems: 'center', boxShadow: `0 8px 24px ${C}66` }}>
          {phase === 'sheikh' ? <Volume2 size={32} color="#fff" /> : <Mic size={32} color="#fff" />}
        </motion.span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 17, color: C }}>{phase === 'sheikh' ? 'استمع للشيخ…' : phase === 'prep' ? 'لحظة… المايك بيفتح' : '🎙️ ابدأ التلاوة الآن'}</div>
      {live && hint && !words.length && <div className="xs muted">{hint}</div>}
      {(live || words.length > 0) && phase !== 'sheikh' && <div className="card" style={{ width: '100%', minHeight: 54, background: 'var(--surf2)', padding: '10px 12px', textAlign: 'center', fontSize: 19, lineHeight: 1.9, fontFamily: "'KFGQPC Hafs', Amiri, serif" }}>
        {words.length ? words.map((w, k) => <motion.span key={k + w} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>{w} </motion.span>) : <span className="xs muted" style={{ fontFamily: 'inherit' }}>كلامك هيظهر هنا وأنت بتقرأ…</span>}
      </div>}
    </section>
  );
}
// كلمة من الآية: أخضر لو اتقالت صح، أحمر بخط تحت لو غلط أو ناقصة، ومخفية لو لسه ماتقالتش في التسميع
const RED = '#DC2626';
function Word({ w, on, bad, show }) {
  const vis = show || on || bad;
  return <span style={{ color: bad ? RED : on ? 'var(--acc)' : 'inherit', background: bad ? 'rgba(220,38,38,.13)' : on ? 'color-mix(in srgb, var(--acc) 14%, transparent)' : 'transparent', textDecoration: bad ? `underline wavy ${RED}` : 'none', textUnderlineOffset: 6, borderRadius: 6, filter: vis ? 'none' : 'blur(6px)', transition: 'all .2s', fontWeight: bad ? 700 : 'inherit' }}>{w} </span>;
}
const Pill = ({ c, children }) => <span className="xs" style={{ padding: '2px 10px', borderRadius: 999, background: c + '22', color: c, fontWeight: 700 }}>{children}</span>;

// ======================= جلسة: حفظ / تسميع / مراجعة =======================
function Session({ mode, s, from, to, by }) {
  const { mem, memAyah, memLog, memCert, hifz, updateHifz, rufaqa } = useStore();
  const P = mem.prefs, PASS = passOf(P.strict);
  const list = (by[s] || []).filter((x) => x.a >= from && x.a <= to);
  const hidden = mode !== 'learn';
  const [i, setI] = useState(-1), [hits, setHits] = useState({}), [bad, setBad] = useState({}), [reveal, setReveal] = useState(null), [heard, setHeard] = useState(''), [note, setNote] = useState(null), [turn, setTurn] = useState(false), [res, setRes] = useState([]), [fin, setFin] = useState(false), [mic, setMic] = useState('unk'), [manual, setManual] = useState(null), [cert, setCert] = useState(null), [phase, setPhase] = useState(null);
  const run = useRef({ n: 0, cur: null, ear: null, man: null });
  const alive = (my) => run.current.n === my;
  const stop = () => { run.current.n++; try { run.current.cur?.pause(); } catch (e) {} run.current.ear?.stop(); run.current.man?.(null); setTurn(false); setPhase(null); };
  useEffect(() => { micReady().then((m) => { setMic(m); if (m === 'ok') warmMic(); }); return stop; }, []);
  const listenAyah = (x, my, lead) => listenFor({ words: ayahWords(x.t), my, alive, lead, rounds: 3, setPhase, setHeard, holder: run.current,
    setHit: (h) => setHits((o) => ({ ...o, [x.a]: h })) });
  // الشيخ يقرأ الآية (والكلمات الغلط متعلّمة بالأحمر قدامك)
  const sheikh = async (x, my, near) => { setTurn(false); setPhase('sheikh'); await playAyah(P.reciter, s, x.a, run.current, my, near); };
  // بدون مايك: تقييم ذاتي بزرّين
  const askManual = () => new Promise((r) => { run.current.man = r; setManual(true); });
  const record = (x, acc, tries, missed) => {
    const k = keyOf(s, x.a), g0 = gradeOf(acc, tries), g = mode === 'learn' ? Math.min(g0, 2) : g0;
    memAyah(k, review(useStore.getState().mem.ayat[k], g, missed));
    return g;
  };
  const begin = async () => {
    stop(); const my = ++run.current.n; const out = []; setRes([]); setFin(false); setBad({}); setReveal(null);
    const useMic = mic === 'ok' || (mic === 'unk' && (await Promise.race([micReady(), wait(1500).then(() => 'unk')])) === 'ok');
    const maxT = mode === 'learn' ? 3 : 2;
    for (let q = 0; q < list.length; q++) {
      const x = list[q]; if (!alive(my)) return;
      setI(q); setNote(null); setHits((h) => ({ ...h, [x.a]: null })); setBad((b) => ({ ...b, [x.a]: null })); setReveal(null);
      let acc = 0, tries = 0, missed = [], corrected = false;
      const reps = mode === 'learn' ? P.reps || 1 : 1;
      for (let rep = 0; rep < reps; rep++) {
        for (tries = 1; tries <= maxT; tries++) {
          if (!alive(my)) return;
          // في الحفظ: الشيخ يقرأ الآية أولًا، والمايك يجهز قبل ما يخلّص بلحظة ويفتح أول ما يسكت
          const lead = mode === 'learn' ? async (early) => { setHeard(''); await sheikh(x, my, useMic ? early : null); } : null; // الأخطاء بتفضل بالأحمر قدامك وانت بتعيد
          if (!useMic) { if (lead) await lead(); if (!alive(my)) return; setTurn(true); const ok = await askManual(); setManual(null); if (ok === null || !alive(my)) return; acc = ok ? 1 : 0.5; break; }
          setTurn(true);
          const r = await listenAyah(x, my, lead); if (!r || !alive(my)) return;
          acc = r.acc; missed = r.missed; setTurn(false);
          if (acc >= PASS) { setBad((b) => ({ ...b, [x.a]: null })); setNote({ ok: true, t: acc >= 0.98 ? 'أحسنت، تلاوة متقنة' : 'أحسنت' }); await wait(600); break; }
          // خطأ: الكلمات الغلط أو الناقصة تتعلّم بالأحمر، والشيخ يعيد الآية صحيحة
          const ms = r.words.filter((_, j) => missed.includes(j)).slice(0, 5).join(' ');
          setBad((b) => ({ ...b, [x.a]: r.words.map((_, j) => missed.includes(j)) }));
          setNote({ ok: false, t: !r.said ? 'لم أسمعك — استمع للشيخ ثم اقرأ بصوت أوضح' : ms ? `أخطأت أو نسيت: «${ms}» — استمع للشيخ وأعد الآية` : 'استمع للشيخ وأعد الآية', miss: ms });
          if (hidden) {
            setReveal(x.a); await wait(500); await sheikh(x, my); if (!alive(my)) return; corrected = true;
            if (tries < maxT) { setNote({ ok: false, t: ms ? `الآن أعد الآية من حفظك — انتبه لـ«${ms}»` : 'الآن أعد الآية من حفظك', miss: ms }); await wait(700); setReveal(null); setBad((b) => ({ ...b, [x.a]: null })); setHits((h) => ({ ...h, [x.a]: null })); }
          } else if (tries < maxT) await wait(900); // في الحفظ: الشيخ هيعيدها في المحاولة الجاية والأحمر قدامك
        }
        if (acc < PASS) break;
      }
      const ok = acc >= PASS; tries = Math.min(tries, 3);
      if (!ok && hidden) { setReveal(x.a); if (!corrected) { setNote({ ok: false, t: 'استمع للآية صحيحة' }); await sheikh(x, my); } }
      setPhase(null); setNote(null); const g = record(x, acc, tries, missed);
      out.push({ a: x.a, acc, ok, g }); setRes([...out]);
      if (!alive(my)) return;
      await wait(350);
    }
    setTurn(false); setI(-1); setFin(true); setReveal(null);
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
  useEffect(() => { if (x) document.getElementById('ay-' + x.a)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [i]);
  const title = { learn: 'حفظ بالترديد', recite: 'تسميع', review: 'مراجعة' }[mode];
  return (
    <div className="screen no-nav">
      <TopBar title={`${title}: سورة ${sname(s)}`} sub={`الآيات ${ar(from)}–${ar(to)}${mode === 'learn' ? ` • تكرار ${ar(P.reps || 1)}` : ''}`} fallback="/hafiz" />
      {cert && <Cert c={cert} onClose={() => setCert(null)} />}
      {mic !== 'ok' && mic !== 'unk' && <div className="card small" style={{ lineHeight: 1.8, borderColor: '#E2A92B' }}>المايك غير متاح على هذا الجهاز — سيُطلب منك تقييم نفسك بعد كل آية.</div>}
      {!fin && i < 0 && <button className="btn" style={{ minHeight: 56, fontSize: 16 }} onClick={begin}><Mic size={20} /> ابدأ {mode === 'learn' ? 'الحفظ' : 'التسميع'}</button>}
      {i >= 0 && <div className="row" style={{ gap: 3 }}>{list.map((_, k) => <span key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < i ? (res[k]?.ok ? 'var(--acc)' : '#E0507A') : k === i ? '#E2A92B' : 'var(--line)' }} />)}</div>}
      {(i >= 0 || fin) && <section className="card col" style={{ gap: 6 }}>
        {list.map((y) => { const h = hits[y.a], e = bad[y.a], cur = x && x.a === y.a, r = res.find((z) => z.a === y.a), show = !hidden || r || reveal === y.a;
          return (
            <div key={y.a} id={'ay-' + y.a} style={{ padding: '4px 8px', borderRadius: 12, background: cur ? 'color-mix(in srgb, var(--acc) 10%, transparent)' : 'transparent', opacity: !cur && i >= 0 && !r ? 0.55 : 1 }}>
              <span className="mushaf" style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 23, lineHeight: 2.1 }}>
                {ayahWords(y.t).map((w, j) => <Word key={j} w={w} on={h?.[j]} bad={e?.[j]} show={show} />)}
                <span className="accent" style={{ fontSize: 17 }}>﴿{ar(y.a)}﴾</span>
              </span>
              {r && <span style={{ marginInlineStart: 6 }}><Pill c={r.ok ? '#1FA36A' : '#E0507A'}>{GRADE[r.g]}</Pill></span>}
            </div>
          ); })}
      </section>}
      {!manual && phase && <div style={{ position: 'sticky', bottom: 10, zIndex: 5 }}><MicCue phase={phase} heard={heard} hint={hidden ? 'اقرأ الآية من حفظك' : 'ردّد الآية كما سمعتها من الشيخ'} /></div>}
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

// ======================= نطاق الاختبار: سورة / سور / جزء / كل المحفوظ =======================
const juzOf = (by, s, a) => by[s]?.[a - 1]?.j || 0;
// كل آيات النطاق: [{ s, a }]
function scopeAyat(sc, by, ayat) {
  if (sc.all) return Object.keys(ayat).map((k) => { const [s, a] = k.split(':').map(Number); return { s, a }; });
  const out = [];
  if (sc.surahs) for (const s of sc.surahs) for (let a = 1; a <= SURAHS[s - 1].ayahs; a++) out.push({ s, a });
  if (sc.juz) { const J = new Set(sc.juz); for (let s = 1; s <= 114; s++) for (const x of by[s] || []) if (J.has(x.j)) out.push({ s, a: x.a }); }
  return out;
}
function ScopePick({ kind, onPick }) {
  const { mem } = useStore();
  const [tab, setTab] = useState(kind === 'test' ? 'all' : 'juz'), [sel, setSel] = useState([]), [q, setQ] = useState(''), [n, setN] = useState(10);
  const memSurahs = useMemo(() => new Set(Object.keys(mem.ayat).map((k) => +k.split(':')[0])), [mem.ayat]);
  const strip = (x) => x.replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');
  const list = useMemo(() => { const k = strip(q.trim()); let L = k ? SURAHS.filter((x) => strip(x.name).includes(k)) : [...SURAHS].reverse(); if (!k) L = [...L.filter((x) => memSurahs.has(x.n)), ...L.filter((x) => !memSurahs.has(x.n))]; return L; }, [q, memSurahs]);
  const tog = (v) => setSel((o) => (o.includes(v) ? o.filter((x) => x !== v) : [...o, v]));
  const tabs = [...(kind === 'test' ? [['all', 'كل محفوظي']] : []), ['surah', 'سورة أو أكثر'], ['juz', 'جزء أو أكثر']];
  const label = tab === 'all' ? 'كل محفوظك' : tab === 'surah' ? (sel.length === 1 ? 'سورة ' + sname(sel[0]) : `${ar(sel.length)} سور`) : (sel.length === 1 ? 'الجزء ' + ar(sel[0]) : `${ar(sel.length)} أجزاء`);
  const ready = tab === 'all' ? Object.keys(mem.ayat).length >= 4 : sel.length > 0;
  const go_ = () => onPick({ label, n, all: tab === 'all' || undefined, surahs: tab === 'surah' ? [...sel].sort((a, b) => a - b) : undefined, juz: tab === 'juz' ? [...sel].sort((a, b) => a - b) : undefined });
  return (
    <>
      <div className="card small" style={{ lineHeight: 1.9 }}>{kind === 'test' ? 'اختر ما تريد أن تُختبر فيه: كل محفوظك، أو سورة معيّنة (أو عدة سور)، أو جزءًا معيّنًا. يقرأ القارئ آية وتُكمل أنت التي بعدها، والأسئلة تصعب كلما أصبت.' : 'اختر ما تريد تحديد مستواك فيه: سورة معيّنة أو أكثر، أو جزءًا أو أكثر. يقرأ القارئ آية وتُكمل التي بعدها من حفظك، وإن لم تحفظ السورة اضغط «لا أحفظها».'}</div>
      <div className="row" style={{ gap: 6 }}>{tabs.map(([k, l]) => <button key={k} className={'chip' + (tab === k ? ' on' : '')} style={{ flex: 1, minHeight: 42 }} onClick={() => { setTab(k); setSel([]); }}>{l}</button>)}</div>
      {tab === 'all' && <div className="card small" style={{ lineHeight: 1.9 }}>{Object.keys(mem.ayat).length >= 4 ? `في سجلك ${ar(memSurahs.size)} سورة — الأسئلة تركّز على الآيات الأضعف عندك.` : 'لا توجد آيات محفوظة في سجلك بعد. اختر سورة أو جزءًا، أو أجرِ «تحديد المستوى» أولًا.'}</div>}
      {tab === 'juz' && <section className="card"><div className="xs muted" style={{ marginBottom: 8 }}>اختر جزءًا أو أكثر</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 6 }}>{Array.from({ length: 30 }, (_, k) => 30 - k).map((j) => <button key={j} className={'chip' + (sel.includes(j) ? ' on' : '')} style={{ minHeight: 42, padding: 0 }} onClick={() => tog(j)}>{ar(j)}</button>)}</div>
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>{[['عمّ', [30]], ['تبارك', [29]], ['آخر جزأين', [29, 30]], ['آخر ٥ أجزاء', [26, 27, 28, 29, 30]]].map(([l, v]) => <button key={l} className="chip" onClick={() => setSel(v)}>{l}</button>)}</div></section>}
      {tab === 'surah' && <>
        <label className="card row" style={{ padding: '0 14px', minHeight: 46 }}><Search size={18} className="muted" aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم السورة" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 44 }} /></label>
        {sel.length > 0 && <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{sel.map((v) => <button key={v} className="chip on" onClick={() => tog(v)}>{sname(v)} ✕</button>)}</div>}
        <section className="card col" style={{ gap: 4, maxHeight: 330, overflowY: 'auto', padding: 8 }}>
          {list.map((x) => { const on = sel.includes(x.n); return <button key={x.n} onClick={() => tog(x.n)} className="row" style={{ padding: '9px 10px', borderRadius: 12, border: 0, textAlign: 'right', background: on ? 'color-mix(in srgb, var(--acc) 14%, transparent)' : 'transparent' }}>
            {on ? <CheckCircle2 size={20} className="accent" /> : <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--line)' }} />}
            <span className="amiri" style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>سورة {x.name}</span>{memSurahs.has(x.n) && <Pill c="#1FA36A">في سجلك</Pill>}<span className="xs muted">{ar(x.ayahs)} آية</span></button>; })}
        </section></>}
      {/* تحديد المستوى بيسأل سؤال من كل سورة على الأقل، فعدد الأسئلة بيتحدد لوحده */}
      {kind === 'test' ? <div className="row" style={{ gap: 6 }}><span className="xs muted">عدد الأسئلة</span>{[5, 10, 15, 20].map((v) => <button key={v} className={'chip' + (n === v ? ' on' : '')} style={{ flex: 1 }} onClick={() => setN(v)}>{ar(v)}</button>)}</div>
        : ready && <div className="xs muted center" style={{ lineHeight: 1.8 }}>هيكون فيه سؤال على الأقل من كل سورة، عشان نعرف مستواك فيها كلها.</div>}
      <button className="btn" style={{ minHeight: 54, fontSize: 16 }} disabled={!ready} onClick={go_}><Mic size={20} /> {ready ? `ابدأ: ${label}` : 'اختر النطاق أولًا'}</button>
    </>
  );
}

// ======================= الاختبار الذكي (تكيّفي) / تحديد المستوى =======================
// كل سؤال: القارئ يقرأ آية والمختبَر يُكمل التي بعدها (أو يقرأ آية برقمها في المستوى الأصعب).
// الصعوبة تتكيّف: إجابتان صحيحتان متتاليتان ترفعان المستوى، والخطأ يخفضه.
function Quiz({ kind, by }) {
  const { mem, memAyah, memMany, memLog, memCert, rufaqa, hifz, updateHifz } = useStore();
  const P = mem.prefs, PASS = Math.min(passOf(P.strict), 0.85);
  const [scope, setScope] = useState(null);
  const pool = useMemo(() => (scope ? scopeAyat(scope, by, mem.ayat).filter((x) => x.a > 1) : []), [scope]);
  const items = useMemo(() => {
    if (!scope) return [];
    const now = Date.now(), n = scope.n || 10;
    if (kind === 'test') {
      // اختيار موزون: الآيات الأضعف في سجلك فرصتها أكبر، والآيات اللي مش في سجلك فرصتها متوسطة
      const P0 = pool.map((x) => { const m = mem.ayat[keyOf(x.s, x.a)]; return { ...x, w: m ? 0.15 + (1 - recall(m, now)) : 0.5 }; });
      const out = [];
      while (out.length < n && P0.length) { const sum = P0.reduce((t, x) => t + x.w, 0); let r = Math.random() * sum, k = 0; while (r > P0[k].w && k < P0.length - 1) { r -= P0[k].w; k++; } out.push(P0[k]); P0.splice(k, 1); }
      return out;
    }
    // تحديد المستوى: لو سور كتير، آية أو آيتين من كل سورة؛ لو سورة أو اتنين، أسئلة موزّعة على السورة كلها
    const groups = {}; pool.forEach((x) => (groups[x.s] ||= []).push(x));
    const G = Object.keys(groups).map(Number).sort((a, b) => b - a), out = [];
    if (G.length * 2 <= n) {
      const per = Math.max(1, Math.floor(n / G.length));
      for (const s of G) { const L = groups[s], k = Math.min(per, L.length); for (let q = 0; q < k; q++) { const lo = Math.floor((q * L.length) / k), hi = Math.floor(((q + 1) * L.length) / k); out.push(L[lo + Math.floor(Math.random() * Math.max(1, hi - lo))]); } }
    } else {
      const step = G.length > 45 ? 3 : 1;
      for (let g = 0; g < G.length; g += step) { const L = groups[G[g]]; out.push(L[Math.floor(Math.random() * Math.min(L.length, 10))]); if (L.length > 20) out.push(L[L.length - 1 - Math.floor(Math.random() * 6)]); }
    }
    return out;
  }, [scope]);
  const [i, setI] = useState(-1), [lv, setLv] = useState(1), [hits, setHits] = useState(null), [heard, setHeard] = useState(''), [note, setNote] = useState(null), [turn, setTurn] = useState(false), [res, setRes] = useState([]), [fin, setFin] = useState(false), [cert, setCert] = useState(null), [applied, setApplied] = useState(false), [phase, setPhase] = useState(null), [bad, setBad] = useState(null), [rev, setRev] = useState(false);
  const run = useRef({ n: 0, cur: null, ear: null, skip: null });
  const alive = (my) => run.current.n === my;
  useEffect(() => { micReady().then((m) => m === 'ok' && warmMic()); return () => { run.current.n++; try { run.current.cur?.pause(); } catch (e) {} run.current.ear?.stop(); }; }, []);
  const begin = async () => {
    const my = ++run.current.n; const out = []; let level = 1, streak = 0; setRes([]); setFin(false);
    const m = await Promise.race([micReady(), wait(3000).then(() => 'unk')]);
    if (m !== 'ok') { setNote({ ok: false, t: 'الاختبار يحتاج المايك — اسمح للتطبيق باستخدامه ثم أعد المحاولة' }); return; }
    const skipped = new Set();
    for (let q = 0; q < items.length; q++) {
      if (!alive(my)) return;
      const it = items[q], ayat = by[it.s]; const x = ayat[it.a - 1], prev = ayat[it.a - 2]; const words = ayahWords(x.t);
      const qk = kind === 'test' && level === 3 ? 'start' : 'next';
      // في تحديد المستوى: لو قال «لا أحفظ هذه السورة» نعدّي باقي أسئلتها
      if (kind === 'placement' && skipped.has(it.s)) { out.push({ ...it, ok: false, acc: 0, level, skip: true }); setRes([...out]); continue; }
      setI(q); setLv(level); setHits(words.map(() => false)); setBad(null); setRev(false); setHeard(''); setNote(null); setTurn(false);
      // الشيخ يقرأ الآية السابقة، والمايك يجهز قبل ما يخلّص بلحظة ويفتح أول ما يسكت
      // لو الإجابة غلط: «حاول مرة تانية» (من غير ما نكشف الصح) لحد ٣ محاولات، وبعد التالتة الشيخ يقرأ الآية الصحيحة والسؤال مايتحسبش
      const TRIES = 3;
      let r = null, tries = 0;
      for (tries = 1; tries <= TRIES; tries++) {
        const lead = tries === 1 && qk === 'next' ? async (early) => { setPhase('sheikh'); await playAyah(P.reciter, it.s, prev.a, run.current, my, early); setTurn(true); } : null;
        if (!lead) setTurn(true);
        r = await listenFor({ words, my, alive, lead, rounds: 2, waitFirst: 9000, setPhase, setHeard, setHit: setHits, holder: run.current });
        if (!r || !alive(my)) return;
        setTurn(false); setPhase(null);
        if (r.skip || r.acc >= PASS || tries === TRIES) break;
        // غلط: نخبّي اللي اتلوّن ونطلب محاولة تانية
        setHits(words.map(() => false)); sfxSoft();
        setNote({ ok: false, t: !r.said ? `لم أسمعك — حاول مرة تانية بصوت أوضح (المحاولة ${ar(tries + 1)} من ${ar(TRIES)})` : `القراءة فيها خطأ — حاول مرة تانية (المحاولة ${ar(tries + 1)} من ${ar(TRIES)})` });
        await wait(1300); setNote(null); setHeard('');
      }
      if (r.skip && kind === 'placement') skipped.add(it.s);
      const acc = r.acc, ok = !r.skip && acc >= PASS, best = r.hit;
      if (kind === 'test') { const k = keyOf(it.s, it.a); memAyah(k, review(useStore.getState().mem.ayat[k], gradeOf(ok ? acc : Math.min(acc, PASS - 0.01), Math.min(tries, 3)), r.missed)); }
      out.push({ ...it, ok, acc: ok ? acc : 0, level, tries }); setRes([...out]);
      setRev(true);
      if (ok) { setBad(r.missed.length ? words.map((_, j) => r.missed.includes(j)) : null); setNote({ ok: true, t: tries > 1 ? `أحسنت — صحيحة من المحاولة ${['', 'الأولى', 'الثانية', 'الثالثة'][tries]}` : r.missed.length ? `أحسنت — وانتبه للكلمات المعلّمة بالأحمر` : 'أحسنت، بارك الله فيك' }); streak++; if (kind === 'test' && streak >= 2 && level < 3) { level++; streak = 0; } await wait(r.missed.length || tries > 1 ? 1800 : 900); }
      else {
        streak = 0; if (kind === 'test' && level > 1) level--;
        if (r.skip) { setHits(words.map(() => true)); setNote({ ok: false, t: 'تم التخطّي' }); await wait(700); }
        else {
          // بعد ٣ محاولات: الكلمات الغلط بالأحمر، والشيخ يقرأ الآية الصحيحة، والسؤال مايتحسبش
          const ms = words.filter((_, j) => r.missed.includes(j)).slice(0, 5).join(' ');
          setBad(words.map((_, j) => r.missed.includes(j)));
          setNote({ ok: false, t: `${ms ? `أخطأت أو نسيت: «${ms}» — ` : ''}استمع للآية الصحيحة من الشيخ (السؤال ده مش هيتحسب)` });
          await wait(400); setPhase('sheikh'); await playAyah(P.reciter, it.s, it.a, run.current, my); setPhase(null); await wait(600);
        }
      }
    }
    if (!alive(my)) return;
    setI(-1); setFin(true);
    const W = out.reduce((t, r) => t + r.level, 0), got = out.reduce((t, r) => t + (r.ok ? r.level : 0), 0), sc = W ? got / W : 0;
    memLog('tests', { kind, n: out.length, ok: out.filter((r) => r.ok).length, score: sc, pts: out.filter((r) => r.ok).length * 3 });
    if (kind === 'test' && sc >= 0.8) { const per = {}; out.forEach((r) => { per[r.s] = per[r.s] || [0, 0]; per[r.s][1]++; if (r.ok) per[r.s][0]++; });
      const c = { id: 'test-' + Date.now(), kind: 'test', title: 'شهادة اختبار الحفظ', name: P.name || rufaqa.name || 'القارئ', verb: 'اجتاز الاختبار الذكي في حفظ', main: scope.all ? `${ar(Object.keys(per).length)} ${Object.keys(per).length > 2 ? 'سور' : 'سورة'} من القرآن الكريم` : scope.label.replace('كل محفوظك', 'محفوظه'), sub: `النتيجة ${pct(sc)}`, lines: Object.entries(per).slice(0, 10).map(([s, [a, b]]) => ['سورة ' + sname(+s), `${ar(a)} من ${ar(b)}`, a === b ? '#1F7A55' : '#B8892B']), grade: sc >= 0.95 ? 'ممتاز' : sc >= 0.88 ? 'جيد جدًا' : 'جيد', at: Date.now() };
      memCert(c); setCert(c); }
  };
  // اعتماد نتيجة تحديد المستوى: السور المحفوظة تُضاف لنموذج الذاكرة (والجزئية بثبات أقل لتظهر في المراجعة قريبًا)
  const known = useMemo(() => { const per = {}; res.forEach((r) => { per[r.s] = per[r.s] || [0, 0]; per[r.s][1]++; if (r.ok) per[r.s][0]++; }); return per; }, [res]);
  const apply = () => {
    const upd = {}, pages = {}, now = Date.now();
    const inScope = {}; scopeAyat(scope, by, mem.ayat).forEach((x) => (inScope[x.s] ||= []).push(x.a));
    for (const [s0, [a, b]] of Object.entries(known)) { const s = +s0; if (!a) continue; const full = a === b; const N = SURAHS[s - 1].ayahs; const A = inScope[s] || [];
      for (const k of A) { const key = keyOf(s, k); if (mem.ayat[key]) continue; const S = full ? 6 : 1.2; upd[key] = { S, D: full ? 4.5 : 6.5, last: now - S * 0.5 * 86400000, due: now + (full ? 2 + (k % 5) : 1) * 86400000, n: 0, lapses: 0, acc: [], w: {}, first: now, est: true }; }
      if (full && A.length === N) { const r = surahPages(s); for (let p = r.from; p <= r.to; p++) if (!isMem(hifz.pages[p])) pages[p] = firstMemorize(); } }
    memMany(upd); if (Object.keys(pages).length) updateHifz(pages); setApplied(true);
  };
  const it = items[i], x = it && by[it.s][it.a - 1], prev = it && by[it.s][it.a - 2];
  if (!scope) return (
    <div className="screen no-nav">
      <TopBar title={kind === 'test' ? 'الاختبار الذكي' : 'تحديد المستوى'} sub="اختر نطاق الاختبار" fallback="/hafiz" />
      <ScopePick kind={kind} onPick={setScope} />
    </div>
  );
  const okN = res.filter((r) => r.ok).length;
  return (
    <div className="screen no-nav">
      <TopBar title={(kind === 'test' ? 'الاختبار الذكي: ' : 'تحديد المستوى: ') + scope.label} sub={`${ar(items.length)} سؤالًا`} fallback="/hafiz" />
      {cert && <Cert c={cert} onClose={() => setCert(null)} />}
      {!fin && i < 0 && <><button className="btn" style={{ minHeight: 56, fontSize: 16 }} onClick={begin}><Mic size={20} /> ابدأ</button><button className="btn ghost" onClick={() => setScope(null)}>غيّر النطاق</button></>}
      {i >= 0 && <div className="row" style={{ gap: 3 }}>{items.map((_, k) => <span key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < i ? (res[k]?.ok ? 'var(--acc)' : '#E0507A') : k === i ? '#E2A92B' : 'var(--line)' }} />)}</div>}
      {it && <>
        <div className="between"><span className="small" style={{ fontWeight: 700 }}>سورة {sname(it.s)}</span>{kind === 'test' && <Pill c={['', '#1FA36A', '#2F7BEA', '#8B5CF6'][lv]}>المستوى {ar(lv)}</Pill>}</div>
        {lv < 3 || kind !== 'test' ? <section className="card center" style={{ background: 'var(--surf2)' }}><div className="xs muted">يقرأ القارئ الآية {ar(prev.a)}</div><div style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 22, lineHeight: 2 }}>{prev.t} <span className="accent">﴿{ar(prev.a)}﴾</span></div></section>
          : <section className="card center" style={{ background: 'var(--surf2)' }}><div style={{ fontWeight: 700 }}>اقرأ الآية رقم {ar(it.a)} من سورة {sname(it.s)}</div></section>}
        <section className="card center" style={{ borderStyle: 'dashed', borderColor: 'var(--acc)' }}>
          <div className="small accent" style={{ fontWeight: 700 }}>{turn ? 'أكمل من حفظك…' : `الآية ${ar(it.a)}`}</div>
          <div style={{ fontFamily: "'KFGQPC Hafs', Amiri, serif", fontSize: 22, lineHeight: 2 }}>{ayahWords(x.t).map((w, j) => <Word key={j} w={w} on={hits?.[j]} bad={bad?.[j]} show={rev || (kind === 'test' && lv === 1 && j === 0)} />)}</div>
        </section>
        <MicCue phase={phase} heard={heard} hint="أكمل الآية التالية من حفظك" />
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
        {kind === 'test' && <button className="btn" onClick={() => { setFin(false); setRes([]); setScope({ ...scope }); }}>اختبار جديد في نفس النطاق</button>}
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
    ['/hafiz/test', Brain, 'الاختبار الذكي', 'في سورة أو جزء أو كل محفوظك'],
    ['/hafiz/placement', Gauge, 'تحديد المستوى', 'في سورة أو جزء تختاره'],
    ['/hafiz/report', BarChart3, 'التقرير', 'قوة الحفظ والأخطاء والتوقعات'],
    ['/hafiz/certs', Award, 'شهاداتي', `${ar((mem.certs || []).length)} شهادة`],
  ];
  return (
    <div className="screen no-nav">
      <TopBar title="الحفظ الذكي" sub="احفظ وسمّع واختبر بصوتك" fallback="/" right={<button className="icon-btn" aria-label="إعدادات" onClick={() => setOpt(!opt)}><Settings2 size={19} /></button>} />
      <AnimatePresence>{opt && <motion.section initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card col" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 6 }}><span className="xs muted">القارئ</span><select value={mem.prefs.reciter} onChange={(e) => memPrefs({ reciter: e.target.value })} className="card" style={{ padding: 10 }}>{RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.style}</option>)}</select></div>
        <div className="col" style={{ gap: 6 }}><span className="xs muted">تكرار كل آية عند الحفظ</span><div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 6 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={'chip' + ((mem.prefs.reps || 1) === n ? ' on' : '')} onClick={() => memPrefs({ reps: n })}>{ar(n)}</button>)}</div></div>
        <div className="col" style={{ gap: 6 }}><span className="xs muted">دقة التصحيح</span><div className="grid2" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>{[[0.75, 'متساهل'], [0.85, 'متوسط'], [0.92, 'صارم']].map(([v, l]) => <button key={v} className={'chip' + (passOf(mem.prefs.strict) === v ? ' on' : '')} onClick={() => memPrefs({ strict: v })}>{l}</button>)}</div><span className="xs muted" style={{ lineHeight: 1.7 }}>لو المايك مش بيلقط كلامك كويس اختار «متساهل».</span></div>
        <button className="btn ghost" onClick={() => { const l = micLog.slice(-8).join('\n'); alert(l || 'لا توجد سجلات بعد'); }}>سجل المايك (للدعم الفني)</button>
      </motion.section>}</AnimatePresence>
      {!mem.prefs.intro && <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card col" style={{ gap: 10, borderColor: 'var(--acc)', borderWidth: 2 }}>
        <div className="row" style={{ gap: 8 }}><Brain size={24} className="accent" /><b style={{ fontSize: 17 }}>أهلًا بك في الحفظ الذكي</b></div>
        {[[Gauge, 'حدّد مستواك', 'في سورة أو جزء، ليعرف الرفيق ما تحفظه'], [BookOpen, 'احفظ بالترديد', 'الشيخ يقرأ الآية، وأول ما يخلص تردّد بصوتك وكلامك يظهر قدامك'], [Mic, 'سمّع من حفظك', 'الآيات مخفية وتظهر كلمة كلمة مع قراءتك'], [CalendarClock, 'راجع يوميًا', 'الرفيق يحسب ميعاد مراجعة كل آية ويجهّز لك خطة اليوم']].map(([I, t, d], k) =>
          <div key={t} className="row" style={{ gap: 10, alignItems: 'flex-start' }}><span style={{ width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--acc) 14%, transparent)', flexShrink: 0 }}><I size={17} className="accent" /></span><span className="col" style={{ gap: 2 }}><b className="small">{ar(k + 1)}. {t}</b><span className="xs muted" style={{ lineHeight: 1.7 }}>{d}</span></span></div>)}
        <div className="grid2"><button className="btn" onClick={() => { memPrefs({ intro: 1 }); go('/hafiz/placement'); }}>ابدأ بتحديد المستوى</button><button className="btn soft" onClick={() => memPrefs({ intro: 1 })}>فهمت</button></div>
      </motion.section>}
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
