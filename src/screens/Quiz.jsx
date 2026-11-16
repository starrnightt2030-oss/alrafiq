// «فاستبقوا الخيرات» — مسابقة دينية بمراحل، لكل فرع ١٠ أسئلة متدرجة، فردي أو ثنائي، وفي النهاية شهادة باسم المتسابق
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ShieldCheck, ScrollText, Moon, Landmark, Star, Users, Heart, User, Swords, Crown, Clock, Lightbulb, Divide, Shuffle, Check, X, ChevronLeft, Share2, Award, RotateCcw, Play, Trophy, Sparkles } from 'lucide-react';
import { useStore } from '../store.js';
import { TopBar, Pattern } from '../components/ui.jsx';
import { sound } from '../lib/sound.js';
import { vibrate } from '../lib/haptics.js';
import { ar, arNum } from '../lib/arabic.js';
import { go } from '../router.js';
import { BRANCHES, PER_BRANCH, TIME, LETTERS, BANK_SIZE, createGame, nextQuestion, answerQuestion, advance, applyLifeline, percent, levelOf, analysis } from '../lib/quiz.js';
import { drawCertificate, shareCertificate } from '../lib/certificate.js';

const ICON = { book: BookOpen, shield: ShieldCheck, scroll: ScrollText, moon: Moon, prayer: Landmark, star: Star, users: Users, heart: Heart };
const br = (id) => BRANCHES.find((b) => b.id === id);
const EMPTY = {};
const CHEER = ['أحسنت! بارك الله فيك', 'إجابة موفّقة!', 'ما شاء الله، تبارك الرحمن', 'رائع! واصل التقدّم', 'زادك الله علمًا'];
const COMFORT = ['لا بأس، كل خطأ درسٌ جديد', 'تعلّمنا معلومة جديدة!', 'المهم أن نتعلّم — تابع', 'ستتذكرها في المرة القادمة بإذن الله'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default function Quiz() {
  const saved = useStore((s) => s.quiz.current);
  const [view, setView] = useState('intro');
  const [game, setGame] = useState(null);

  const update = (g) => { setGame(g); useStore.getState().saveQuizGame(g && g.phase !== 'final' ? g : null); };
  const start = (opts) => { const g = createGame(opts); update(g); setView('game'); sound.stage(); };
  const resume = () => { const g = saved.phase === 'reveal' ? advance(saved) : saved; setGame(g.phase === 'question' ? { ...g, resumed: Date.now() } : g); setView('game'); };

  return (
    <div className="quiz-root">
      <AnimatePresence mode="wait">
        {view === 'intro' && <Intro key="i" onDone={() => setView('setup')} />}
        {view === 'setup' && <Setup key="s" saved={saved} onStart={start} onResume={resume} />}
        {view === 'game' && game && <Game key="g" game={game} update={update} onExit={() => { setView('setup'); }} onAgain={() => { setGame(null); setView('setup'); }} />}
      </AnimatePresence>
    </div>
  );
}

// ——— المقدمة السينمائية: اسم اللعبة ← كلمتان للتحميس ← نبدأ ———
function Intro({ onDone }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    sound.intro();
    const t = [setTimeout(() => setStep(1), 2300), setTimeout(() => { setStep(2); sound.next(); }, 3500), setTimeout(() => { setStep(3); sound.stage(); vibrate(20); }, 4500), setTimeout(onDone, 5800)];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <motion.button className="quiz-intro" onClick={onDone} aria-label="تخطي المقدمة" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: .5 }}>
      <div className="qi-rays" aria-hidden="true" />
      {[...Array(18)].map((_, i) => <motion.span key={i} className="qi-mote" style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%` }} animate={{ y: [0, -40, 0], opacity: [0, .9, 0] }} transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * .2 }} />)}
      <AnimatePresence mode="wait">
        {step < 2 ? (
          <motion.div key="t" className="col center" style={{ gap: 18 }} exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
              <Trophy size={58} strokeWidth={1.4} className="accent" />
            </motion.div>
            <motion.h1 className="ruqaa qi-title" initial={{ opacity: 0, y: 30, letterSpacing: '12px', filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, letterSpacing: '0px', filter: 'blur(0px)' }} transition={{ duration: 1.3, ease: [.2, .8, .2, 1] }}>
              فاستبقوا الخيرات
            </motion.h1>
            <motion.div className="hafs" style={{ fontSize: 19, opacity: .85 }} initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? .85 : 0 }}>﴿ فَاسْتَبِقُوا الْخَيْرَاتِ ۚ أَيْنَ مَا تَكُونُوا يَأْتِ بِكُمُ اللَّهُ جَمِيعًا ﴾</motion.div>
          </motion.div>
        ) : (
          <motion.div key="w" className="col center" style={{ gap: 6 }}>
            <motion.div className="qi-word" initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>استعدّ…</motion.div>
            {step >= 3 && <motion.div className="qi-word accent" initial={{ scale: 2.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>وانطلق!</motion.div>}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="xs muted" style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 26px)' }}>اضغط للتخطي</div>
    </motion.button>
  );
}

// ——— الإعداد: النمط والأسماء والفروع ———
function Setup({ saved, onStart, onResume }) {
  const q = useStore((s) => s.quiz);
  const [mode, setMode] = useState('solo');
  const [names, setNames] = useState(() => [q.names?.[0] || '', q.names?.[1] || '']);
  const [sel, setSel] = useState(() => BRANCHES.map((b) => b.id));
  const [err, setErr] = useState('');
  const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : BRANCHES.map((b) => b.id).filter((x) => s.includes(x) || x === id));
  const need = mode === 'duo' ? 2 : 1;
  const go2 = () => {
    const n = names.slice(0, need).map((x) => x.trim());
    if (n.some((x) => !x)) { setErr(mode === 'duo' ? 'اكتب اسم المتسابقَين ليظهرا في الشهادة' : 'اكتب اسمك ليظهر في الشهادة'); vibrate([20, 40, 20]); return; }
    if (mode === 'duo' && n[0] === n[1]) { setErr('اختر اسمين مختلفين'); return; }
    if (!sel.length) { setErr('اختر فرعًا واحدًا على الأقل'); return; }
    onStart({ mode, names: n, branches: sel });
  };
  return (
    <motion.div className="screen no-nav" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <Pattern />
      <TopBar title="فاستبقوا الخيرات" sub={`${arNum(BANK_SIZE)} سؤالًا في ${ar(BRANCHES.length)} فروع`} />

      {saved && (
        <motion.button className="card hl between" onClick={onResume} initial={{ scale: .96 }} animate={{ scale: 1 }} style={{ position: 'relative', textAlign: 'start', color: 'var(--text)' }}>
          <div><div className="h2">أكمل مسابقتك</div><div className="xs muted">{saved.players.map((p) => p.name).join(' ضد ')} — المرحلة {ar(saved.stage + 1)} من {ar(saved.branches.length)}</div></div>
          <span className="btn" style={{ minHeight: 40 }}><Play size={16} /> متابعة</span>
        </motion.button>
      )}

      <section className="col" style={{ gap: 10, position: 'relative' }}>
        <div className="h2">اختر نمط اللعب</div>
        <div className="grid2">
          {[{ id: 'solo', t: 'فردي', s: 'تحدَّ نفسك واحصل على شهادتك', I: User }, { id: 'duo', t: 'ثنائي', s: 'منافسة بالتناوب: لكل متسابق سؤال', I: Swords }].map(({ id, t, s, I }) => (
            <motion.button key={id} whileTap={{ scale: .96 }} className={'card col mode-card' + (mode === id ? ' on' : '')} onClick={() => { setMode(id); sound.tap(); setErr(''); }} aria-pressed={mode === id}>
              <I size={28} className="accent" strokeWidth={1.6} /><b>{t}</b><span className="xs muted">{s}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="col" style={{ gap: 10, position: 'relative' }}>
        <div className="h2">{mode === 'duo' ? 'اسما المتسابقَين' : 'اسمك'} <span className="xs muted">(يظهر في الشهادة)</span></div>
        {[...Array(need)].map((_, i) => (
          <input key={i} className="q-input" value={names[i]} maxLength={28} placeholder={mode === 'duo' ? `اسم المتسابق ${i === 0 ? 'الأول' : 'الثاني'}` : 'اكتب اسمك هنا'} onChange={(e) => { const n = [...names]; n[i] = e.target.value; setNames(n); setErr(''); }} aria-label={mode === 'duo' ? `اسم المتسابق ${i + 1}` : 'اسمك'} />
        ))}
      </section>

      <section className="col" style={{ gap: 10, position: 'relative' }}>
        <div className="between"><div className="h2">المراحل</div><button className="xs accent link-btn" onClick={() => setSel(sel.length === BRANCHES.length ? [] : BRANCHES.map((b) => b.id))}>{sel.length === BRANCHES.length ? 'إلغاء الكل' : 'اختيار الكل'}</button></div>
        <div className="grid2">
          {BRANCHES.map((b, i) => { const I = ICON[b.icon]; const on = sel.includes(b.id); return (
            <button key={b.id} className={'branch-pick' + (on ? ' on' : '')} onClick={() => { toggle(b.id); sound.tap(); }} aria-pressed={on}>
              <span className="bp-ic"><I size={18} /></span><span style={{ flex: 1, textAlign: 'start' }}>{b.name}</span>{on && <Check size={16} />}
            </button>); })}
        </div>
        <div className="xs muted">{ar(sel.length)} {sel.length > 2 && sel.length < 11 ? 'مراحل' : 'مرحلة'} × {ar(PER_BRANCH)} أسئلة — الصعوبة تتدرج من السهل للصعب، والأسئلة تتغير في كل مرة</div>
      </section>

      {err && <motion.div className="xs" style={{ color: '#E58C7A', textAlign: 'center' }} initial={{ x: -8 }} animate={{ x: [8, -6, 4, 0] }}>{err}</motion.div>}
      <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={go2}><Sparkles size={18} /> ابدأ المسابقة</motion.button>

      {q.history.length > 0 && (
        <section className="card col" style={{ gap: 8 }}>
          <div className="between"><b>آخر المحاولات</b><span className="xs muted">أعلى نتيجة: {arNum(q.best)} نقطة</span></div>
          {q.history.slice(0, 4).map((h) => <div key={h.at} className="between xs"><span>{h.names.join(' ضد ')}</span><span className="muted">{h.mode === 'duo' ? `الفائز: ${h.winner}` : `${ar(h.pct)}٪ — ${h.level}`}</span></div>)}
        </section>
      )}
    </motion.div>
  );
}

// ——— اللعبة ———
function Game({ game, update, onExit, onAgain }) {
  const seen = useStore((s) => s.quiz.seen) || EMPTY;
  const branch = br(game.branches[game.phase === 'stageEnd' ? game.stage - 1 : game.stage]);
  const p = game.players[game.turn];

  useEffect(() => { if (game.phase === 'next' && game.mode === 'solo') update(nextQuestion(game, useStore.getState().quiz.seen)); }, [game.phase, game.qi]);
  useEffect(() => { if (game.phase === 'final' && !game.recorded) record(game, update); }, [game.phase]);

  if (game.phase === 'final' || game.phase === 'cert') return <Final game={game} onAgain={onAgain} />;
  return (
    <motion.div className="screen no-nav quiz-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Pattern height={300} />
      <Hud game={game} branch={branch} onExit={onExit} />
      <AnimatePresence mode="wait">
        {game.phase === 'stage' && <StageIntro key={'st' + game.stage} game={game} branch={branch} onGo={() => update(nextQuestion(game, seen))} />}
        {game.phase === 'next' && game.mode === 'duo' && <Turn key={'t' + game.qi} game={game} onGo={() => update(nextQuestion(game, seen))} />}
        {(game.phase === 'question' || game.phase === 'reveal') && game.current && <Question key={game.current.id + (game.resumed || '')} game={game} update={update} player={p} />}
        {(game.phase === 'question' || game.phase === 'reveal') && !game.current && <div className="card center">انتهت أسئلة هذا الفرع — <button className="accent" onClick={() => update(advance({ ...game, qi: PER_BRANCH - 1 }))}>تابع</button></div>}
        {game.phase === 'stageEnd' && <StageEnd key={'se' + game.stage} game={game} onGo={() => { update({ ...game, phase: 'stage' }); sound.stage(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function record(game, update) {
  const players = game.players.map((p) => ({ ...p, pct: percent(p) }));
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const tie = game.mode === 'duo' && sorted[0].score === sorted[1].score;
  const rec = { at: Date.now(), mode: game.mode, names: players.map((p) => p.name), pct: players[0].pct, level: levelOf(players[0].pct).title, best: sorted[0].score, winner: game.mode === 'duo' ? (tie ? 'تعادل' : sorted[0].name) : null };
  useStore.getState().finishQuiz(rec, Math.round(sorted[0].score / 10));
  update({ ...game, recorded: true });
  sound.fanfare(); vibrate([30, 60, 30, 60, 80]);
}

function Hud({ game, branch, onExit }) {
  const I = ICON[branch.icon];
  return (
    <div className="col" style={{ gap: 12, position: 'relative', zIndex: 1 }}>
      <div className="between">
        <button className="icon-btn" aria-label="خروج — تُحفظ المسابقة" onClick={onExit}><X size={20} /></button>
        <div className="center"><div className="xs muted">المرحلة {ar(game.phase === 'stageEnd' ? game.stage : game.stage + 1)} من {ar(game.branches.length)}</div><div className="row" style={{ gap: 6, justifyContent: 'center' }}><I size={16} className="accent" /><b>{branch.name}</b></div></div>
        <span style={{ width: 44 }} />
      </div>
      <div className="q-dots" aria-label={`السؤال ${game.qi + 1} من ${PER_BRANCH}`}>
        {[...Array(PER_BRANCH)].map((_, i) => <i key={i} className={i < game.qi || (i === game.qi && game.phase === 'reveal') ? 'done' : i === game.qi ? 'now' : ''} />)}
      </div>
      <div className={game.mode === 'duo' ? 'grid2' : ''}>
        {game.players.map((pl, i) => (
          <motion.div key={i} className={'q-player' + (game.mode === 'duo' && game.turn === i && game.phase !== 'stageEnd' && game.phase !== 'stage' ? ' on' : '')} layout>
            <span className="q-av">{[...pl.name][0]}</span>
            <div style={{ minWidth: 0, flex: 1 }}><div className="small" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div><div className="xs muted">{ar(pl.correct)} صحيحة{pl.streak >= 2 ? ` — 🔥${ar(pl.streak)}` : ''}</div></div>
            <motion.b key={pl.score} className="num accent" style={{ fontSize: 20 }} initial={{ scale: 1.6 }} animate={{ scale: 1 }}>{arNum(pl.score)}</motion.b>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StageIntro({ game, branch, onGo }) {
  const I = ICON[branch.icon];
  useEffect(() => { vibrate(15); }, []);
  return (
    <motion.div className="card col center stage-card" initial={{ opacity: 0, scale: .8, rotateX: 40 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}>
      <motion.div className="stage-badge" initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: .15, type: 'spring' }}><I size={40} strokeWidth={1.5} /></motion.div>
      <div className="xs accent" style={{ fontWeight: 600, letterSpacing: 1 }}>المرحلة {ar(game.stage + 1)}</div>
      <h2 className="ruqaa" style={{ fontSize: 34, margin: 0 }}>{branch.name}</h2>
      <div className="small muted">{ar(PER_BRANCH)} أسئلة تبدأ سهلة وتزداد صعوبة — {game.mode === 'duo' ? `يبدأ ${game.players[0].name}` : 'ركّز وانطلق'}</div>
      <div className="row xs muted" style={{ gap: 14, justifyContent: 'center' }}><span>⭐ سهل {ar(TIME[1])}ث</span><span>⭐⭐ متوسط {ar(TIME[2])}ث</span><span>⭐⭐⭐ صعب {ar(TIME[3])}ث</span></div>
      <motion.button whileTap={{ scale: .95 }} className="btn q-go" onClick={onGo} style={{ width: '100%' }}>ابدأ المرحلة <ChevronLeft size={18} /></motion.button>
    </motion.div>
  );
}

function Turn({ game, onGo }) {
  const p = game.players[game.turn];
  useEffect(() => { sound.next(); }, []);
  return (
    <motion.div className="card col center stage-card" initial={{ opacity: 0, x: game.turn ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: game.turn ? 80 : -80 }}>
      <motion.span className="q-av big" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>{[...p.name][0]}</motion.span>
      <div className="xs muted">الدور على</div>
      <h2 className="ruqaa" style={{ fontSize: 34, margin: 0 }}>{p.name}</h2>
      <div className="small muted">سلّم الجهاز لـ{p.name} — الجولة {ar(Math.floor(game.qi / 2) + 1)} من {ar(PER_BRANCH / 2)}</div>
      <motion.button whileTap={{ scale: .95 }} className="btn q-go" onClick={onGo} style={{ width: '100%' }}>أنا جاهز <ChevronLeft size={18} /></motion.button>
    </motion.div>
  );
}

function Question({ game, update, player }) {
  const q = game.current; const limit = TIME[q.d];
  const reveal = game.phase === 'reveal';
  const [left, setLeft] = useState(limit);
  const [locked, setLocked] = useState(null);
  const [msg] = useState(() => ({ ok: pick(CHEER), no: pick(COMFORT) }));
  const leftRef = useRef(limit);

  useEffect(() => {
    if (reveal || locked !== null) return;
    const t = setInterval(() => {
      leftRef.current -= 1; setLeft(leftRef.current);
      if (leftRef.current <= 5 && leftRef.current > 0) sound.tick();
      if (leftRef.current <= 0) { clearInterval(t); finish(-1); }
    }, 1000);
    return () => clearInterval(t);
  }, [reveal, locked]);

  const finish = (idx) => {
    const r = answerQuestion(game, idx, leftRef.current);
    useStore.getState().markQuizSeen(q.id);
    update(r.game);
    if (r.correct) { sound.correct(); vibrate(25); } else { sound.wrong(); vibrate([40, 50, 40]); }
  };
  const choose = (i) => {
    if (locked !== null || reveal || q.removed.includes(i)) return;
    setLocked(i); sound.heartbeat(); vibrate(10);
    setTimeout(() => finish(i), 1250);
  };
  const life = (kind) => { if (locked !== null || reveal || !player.life[kind]) return; sound.lifeline(); update(applyLifeline(game, kind, useStore.getState().quiz.seen)); };
  const last = game.last; const correct = reveal && last?.correct;
  const stars = '⭐'.repeat(q.d);

  return (
    <motion.div className="col" style={{ gap: 14, position: 'relative', zIndex: 1 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
      <div className="between">
        <span className="xs muted">السؤال {ar(game.qi + 1)} — {stars}</span>
        <TimerRing left={reveal ? 0 : left} limit={limit} frozen={reveal || locked !== null} />
      </div>

      <motion.div className={'card q-card' + (reveal ? (correct ? ' ok' : ' no') : '')} animate={reveal && !correct ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: .45 }}>
        <div className="q-text">{q.q}</div>
        {q.verse && <div className="hafs q-verse">{q.verse}</div>}
        {q.hint && !reveal && <motion.div className="xs accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>💡 {q.hint}</motion.div>}
      </motion.div>

      <div className="col" style={{ gap: 10 }}>
        {q.options.map((o, i) => {
          const gone = q.removed.includes(i);
          const st = reveal ? (i === q.answer ? 'ok' : i === last.idx ? 'no' : 'dim') : locked === i ? 'lock' : '';
          return (
            <motion.button key={i} className={'q-opt ' + st} disabled={gone} onClick={() => choose(i)}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: gone ? .15 : 1, x: 0, scale: st === 'ok' ? [1, 1.04, 1] : 1 }} transition={{ delay: reveal ? 0 : .08 * i + .1 }} whileTap={{ scale: .97 }}>
              <span className="q-let">{st === 'ok' ? <Check size={16} /> : st === 'no' ? <X size={16} /> : LETTERS[i]}</span>
              <span className={q.quran ? 'hafs' : ''} style={{ flex: 1, textAlign: 'start', fontSize: q.quran ? 18 : 15 }}>{o}</span>
            </motion.button>
          );
        })}
      </div>

      {!reveal && (
        <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
          {[{ k: 'fifty', I: Divide, t: 'حذف إجابتين' }, { k: 'hint', I: Lightbulb, t: 'تلميح' }, { k: 'swap', I: Shuffle, t: 'تبديل السؤال' }].map(({ k, I, t }) => (
            <button key={k} className="q-life" disabled={!player.life[k] || locked !== null || (k === 'fifty' && q.removed.length) || (k === 'hint' && q.hint)} onClick={() => life(k)} aria-label={`${t} — متبقٍ ${player.life[k]}`}>
              <I size={16} /><span>{t}</span><b className="num">{ar(player.life[k])}</b>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {reveal && (
          <motion.div className="card col q-explain" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
            {correct && <Burst />}
            <div className="between">
              <b style={{ color: correct ? '#5FC59A' : '#E58C7A' }}>{correct ? msg.ok : last.idx === -1 ? 'انتهى الوقت!' : msg.no}</b>
              {correct && <motion.b className="accent num" initial={{ scale: 0 }} animate={{ scale: 1 }}>+{ar(last.pts)}</motion.b>}
            </div>
            {!correct && <div className="small">الإجابة الصحيحة: <b className={q.quran ? 'hafs' : ''}>{q.c}</b></div>}
            {q.note && <div className="xs muted" style={{ lineHeight: 1.9 }}>📖 {q.note}</div>}
            <motion.button whileTap={{ scale: .96 }} className="btn" onClick={() => update(advance(game))}>{game.qi + 1 >= PER_BRANCH ? 'نتيجة المرحلة' : 'السؤال التالي'} <ChevronLeft size={18} /></motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimerRing({ left, limit, frozen }) {
  const r = 20, c = 2 * Math.PI * r; const v = Math.max(0, left) / limit; const danger = left <= 5 && !frozen;
  return (
    <motion.div className="q-timer" animate={danger ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ repeat: danger ? Infinity : 0, duration: 1 }} aria-label={`الوقت المتبقي ${left} ثانية`}>
      <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r={r} stroke="var(--surf2)" strokeWidth="5" fill="none" />
        <circle cx="26" cy="26" r={r} stroke={danger ? '#E58C7A' : 'var(--acc)'} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform="rotate(-90 26 26)" style={{ transition: 'stroke-dashoffset 1s linear' }} /></svg>
      <span className="num">{frozen ? <Clock size={14} /> : ar(Math.max(0, left))}</span>
    </motion.div>
  );
}

function Burst({ n = 22 }) {
  const parts = useMemo(() => [...Array(n)].map((_, i) => ({ a: (i / n) * Math.PI * 2, d: 60 + Math.random() * 70, c: ['#D9B55A', '#F0D894', '#5FC59A', '#fff'][i % 4], s: 5 + Math.random() * 6 })), [n]);
  return <div className="burst" aria-hidden="true">{parts.map((p, i) => <motion.i key={i} style={{ background: p.c, width: p.s, height: p.s }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d, opacity: 0, rotate: 180 }} transition={{ duration: .9, ease: 'easeOut' }} />)}</div>;
}

function Confetti() {
  const parts = useMemo(() => [...Array(60)].map((_, i) => ({ x: Math.random() * 100, d: Math.random() * 1.5, r: Math.random() * 720, c: ['#D9B55A', '#F0D894', '#5FC59A', '#E58C7A', '#fff'][i % 5], w: 6 + Math.random() * 6 })), []);
  return <div className="confetti" aria-hidden="true">{parts.map((p, i) => <motion.i key={i} style={{ left: p.x + '%', background: p.c, width: p.w, height: p.w * 1.6 }} initial={{ y: -40, opacity: 1, rotate: 0 }} animate={{ y: '105vh', rotate: p.r, opacity: [1, 1, 0] }} transition={{ duration: 3 + Math.random() * 2, delay: p.d, ease: 'easeIn' }} />)}</div>;
}

const starsFor = (c) => (c >= 9 ? 3 : c >= 7 ? 2 : c >= 5 ? 1 : 0);

function StageEnd({ game, onGo }) {
  const b = br(game.branches[game.stage - 1]);
  const nextB = br(game.branches[game.stage]);
  useEffect(() => { sound.stage(); }, []);
  return (
    <motion.div className="card col center stage-card" initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -30 }}>
      <div className="xs accent" style={{ fontWeight: 600 }}>انتهت مرحلة</div>
      <h2 className="ruqaa" style={{ fontSize: 30, margin: 0 }}>{b.name}</h2>
      {game.players.map((p, i) => { const s = p.per[b.id]; const st = starsFor(game.mode === 'duo' ? s.c * 2 : s.c); return (
        <div key={i} className="col center" style={{ gap: 4 }}>
          {game.mode === 'duo' && <b>{p.name}</b>}
          <div className="row" style={{ gap: 6, justifyContent: 'center' }}>{[0, 1, 2].map((k) => <motion.span key={k} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: .3 + k * .25 + i * .5, type: 'spring' }}><Star size={34} fill={k < st ? '#D9B55A' : 'none'} color="#D9B55A" strokeWidth={1.5} /></motion.span>)}</div>
          <div className="small">{ar(s.c)} من {ar(s.t)} صحيحة — {arNum(s.pts)} نقطة</div>
        </div>); })}
      <div className="small muted" style={{ lineHeight: 1.9 }}>{stageLine(game, b)}</div>
      <motion.button whileTap={{ scale: .95 }} className="btn q-go" onClick={onGo} style={{ width: '100%' }}>المرحلة التالية: {nextB.name} <ChevronLeft size={18} /></motion.button>
    </motion.div>
  );
}

function stageLine(game, b) {
  if (game.mode === 'duo') { const [a, c] = game.players.map((p) => p.score); return a === c ? 'تعادل حتى الآن — المنافسة مشتعلة!' : `يتقدّم ${game.players[a > c ? 0 : 1].name} — والفرصة ما زالت قائمة!`; }
  const s = game.players[0].per[b.id].c;
  return s >= 9 ? 'أداء مذهل! أنت من السابقين في هذا الفرع' : s >= 7 ? 'ممتاز! استمر بهذه الروح' : s >= 5 ? 'جيد — المراحل القادمة فرصتك للتألق' : `هذا الفرع يحتاج مراجعة: ${b.tip}`;
}

// ——— النتيجة النهائية والشهادة ———
function Final({ game, onAgain }) {
  const duo = game.mode === 'duo';
  const ranked = [...game.players].sort((a, b) => b.score - a.score);
  const tie = duo && ranked[0].score === ranked[1].score;
  const [cert, setCert] = useState(null);
  return (
    <motion.div className="screen no-nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Confetti />
      <Pattern />
      <TopBar title="النتيجة النهائية" sub="فاستبقوا الخيرات" fallback="/" />
      {duo && (
        <motion.div className="card col center stage-card" initial={{ scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <motion.div initial={{ y: -40, rotate: -20 }} animate={{ y: 0, rotate: 0 }} transition={{ type: 'spring', delay: .3 }}><Crown size={52} className="accent" strokeWidth={1.4} /></motion.div>
          <div className="xs muted">{tie ? 'النتيجة' : 'الفائز'}</div>
          <h2 className="ruqaa" style={{ fontSize: 36, margin: 0 }}>{tie ? 'تعادل مشرّف!' : ranked[0].name}</h2>
          <div className="grid2" style={{ width: '100%' }}>
            {game.players.map((p, i) => <div key={i} className={'q-player col' + (!tie && p === ranked[0] ? ' on' : '')} style={{ alignItems: 'center' }}><span className="q-av">{[...p.name][0]}</span><b className="small">{p.name}</b><b className="num accent" style={{ fontSize: 24 }}>{arNum(p.score)}</b><span className="xs muted">{ar(p.correct)}/{ar(p.total)} — {ar(percent(p))}٪</span></div>)}
          </div>
        </motion.div>
      )}
      {game.players.map((p, i) => <PlayerReport key={i} p={p} game={game} delay={duo ? .4 + i * .2 : .1} onCert={() => setCert(i)} rank={duo ? (tie ? 'بالتعادل' : p === ranked[0] ? 'وفاز بالمركز الأول' : 'بالمركز الثاني') : null} />)}
      <div className="grid2">
        <button className="btn soft" onClick={onAgain}><RotateCcw size={16} /> العب مجددًا</button>
        <button className="btn ghost" onClick={() => go('/')}>الرئيسية</button>
      </div>
      <AnimatePresence>{cert !== null && <CertSheet game={game} p={game.players[cert]} rank={duo ? (tie ? 'بالتعادل' : game.players[cert] === ranked[0] ? 'وفاز بالمركز الأول' : 'بالمركز الثاني') : null} onClose={() => setCert(null)} />}</AnimatePresence>
    </motion.div>
  );
}

function PlayerReport({ p, game, delay, onCert }) {
  const pct = percent(p); const lv = levelOf(pct); const { rows, strong, weak } = analysis(p, game.branches);
  return (
    <motion.section className="card col" style={{ gap: 12 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="row" style={{ gap: 14 }}>
        <BigRing pct={pct} />
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <b className="h2">{p.name}</b>
          <span className="accent" style={{ fontWeight: 700 }}>{lv.title}</span>
          <span className="xs muted">{ar(p.correct)} من {ar(p.total)} — {arNum(p.score)} نقطة</span>
        </div>
      </div>
      <div className="col" style={{ gap: 9 }}>
        {rows.map((r, i) => { const I = ICON[r.icon]; const col = r.pct >= 80 ? '#5FC59A' : r.pct < 60 ? '#E58C7A' : 'var(--acc)'; return (
          <div key={r.id} className="col" style={{ gap: 4 }}>
            <div className="between small"><span className="row" style={{ gap: 6 }}><I size={14} style={{ color: col }} />{r.name}</span><b className="num" style={{ color: col }}>{ar(r.c)}/{ar(r.t)}</b></div>
            <div className="bar"><motion.i style={{ background: col }} initial={{ width: 0 }} animate={{ width: r.pct + '%' }} transition={{ delay: delay + .3 + i * .1, duration: .7 }} /></div>
          </div>); })}
      </div>
      {strong.length > 0 && <div className="small" style={{ lineHeight: 1.9 }}><b style={{ color: '#5FC59A' }}>نقاط قوتك: </b>{strong.map((r) => r.name).join('، ')} — ما شاء الله!</div>}
      {weak.length > 0 && (
        <div className="col" style={{ gap: 6 }}>
          <b className="small" style={{ color: '#E58C7A' }}>محتاج تقوّي:</b>
          {weak.map((r) => <a key={r.id} href={r.href} className="q-tip"><span>{r.name}</span><span className="xs muted">جرّب: {r.tip}</span><ChevronLeft size={16} /></a>)}
        </div>
      )}
      <div className="xs muted" style={{ lineHeight: 1.9 }}>{lv.msg}</div>
      <motion.button whileTap={{ scale: .96 }} className="btn q-go" onClick={onCert}><Award size={18} /> استلم شهادتك</motion.button>
    </motion.section>
  );
}

function BigRing({ pct }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flex: 'none' }}>
      <svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r={r} stroke="var(--surf2)" strokeWidth="9" fill="none" />
        <motion.circle cx="48" cy="48" r={r} stroke="var(--acc)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 1.4, ease: 'easeOut' }} transform="rotate(-90 48 48)" /></svg>
      <b className="num" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 22 }}>{ar(pct)}٪</b>
    </div>
  );
}

function CertSheet({ game, p, rank, onClose }) {
  const [img, setImg] = useState(null); const cv = useRef(null); const [busy, setBusy] = useState(false); const [note, setNote] = useState('');
  useEffect(() => { let on = true; drawCertificate({ player: p, branches: game.branches, mode: game.mode, rank }).then((c) => { if (!on) return; cv.current = c; setImg(c.toDataURL('image/png')); sound.milestone(); }); return () => { on = false; }; }, []);
  const share = async () => { setBusy(true); try { const r = await shareCertificate(cv.current, p.name); setNote(r === 'downloaded' ? 'تم حفظ الشهادة في التنزيلات' : r === 'shared' ? 'تمت المشاركة' : ''); } catch { setNote('تعذّرت المشاركة — جرّب مرة أخرى'); } setBusy(false); };
  return (
    <motion.div className="cert-sheet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="col" style={{ gap: 12, width: 'min(100%, 460px)' }} initial={{ y: 60, scale: .9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()}>
        {img ? <motion.img src={img} alt={`شهادة ${p.name}`} className="cert-img" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: .8 }} /> : <div className="cert-img center" style={{ display: 'grid', placeItems: 'center' }}>جارٍ تجهيز الشهادة…</div>}
        <div className="grid2">
          <button className="btn" onClick={share} disabled={!img || busy}><Share2 size={16} /> حفظ ومشاركة</button>
          <button className="btn soft" onClick={onClose}>إغلاق</button>
        </div>
        {note && <div className="xs center" style={{ color: '#fff' }}>{note}</div>}
      </motion.div>
    </motion.div>
  );
}
