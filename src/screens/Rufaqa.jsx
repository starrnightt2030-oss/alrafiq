// «رفقاء الخير»: مجموعات للأهل والأصحاب — لوحة الأعضاء، ترتيب الأسبوع، الختمة الجماعية، والتشجيع
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HelpCircle, Medal, X, Settings2, Users, Plus, LogIn, Share2, Copy, RefreshCw, Crown, Flame, BookOpen, Heart, LogOut, Pencil, Check, Moon, Sun, ShieldCheck, ChevronLeft, Trophy, Send } from 'lucide-react';
import { useStore } from '../store.js';
import { TopBar, Pattern, toast } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import TileArt from '../components/TileArt.jsx';
import { ar, arNum, daysAr, todayKey } from '../lib/arabic.js';
import { go } from '../router.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';
import { createGroup, joinGroup, leaveGroup, loadGroup, takePart, donePart, newKhatma, sendCheer, renameMe, pushMe, summary, weekKey, CHEERS, JoinError, dailyQuestions, DEFAULT_DHIKR, setGroupDhikr } from '../lib/rufaqa.js';
import { WIRD } from '../data/wird.js';
import { LETTERS } from '../lib/quiz.js';

const HUES = [150, 200, 265, 330, 25, 45];
const SITE = 'https://starrnightt2030-oss.github.io/alrafiq/';
const errMsg = (e) => e instanceof JoinError ? e.message : (navigator.onLine === false ? 'مفيش إنترنت — رفقاء الخير محتاجة اتصال' : 'حصلت مشكلة في الاتصال — جرّب تاني');
const initial = (n = '') => n.trim().charAt(0) || '؟';

export default function Rufaqa({ sub, arg }) {
  const r = useStore((s) => s.rufaqa);
  const groups = r?.groups || [];
  const joinCode = sub === 'join' ? arg : null;
  const gid = sub === 'g' ? arg : null;
  if (!r?.name) return <Setup code={joinCode} />;
  if (joinCode) return <JoinScreen code={joinCode} />;
  if (gid && groups.includes(gid)) return <Group gid={gid} />;
  return <Groups groups={groups} />;
}

function Avatar({ name, hue = 150, size = 40, me }) {
  return <span className={'rq-av' + (me ? ' me' : '')} style={{ '--h': hue, width: size, height: size, fontSize: size * .44 }}>{initial(name)}</span>;
}

function Setup({ code }) {
  const setRufaqa = useStore((s) => s.setRufaqa);
  const [name, setName] = useState('');
  const [hue, setHue] = useState(HUES[0]);
  const ok = name.trim().length >= 2;
  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title="رفقاء الخير" sub="«المرء على دين خليله»" fallback="/" />
      <section className="rq-hero">
        <TileArt id="rufaqa" size={120} className="rq-hero-art" />
        <div className="col" style={{ gap: 6, position: 'relative' }}>
          <b className="ruqaa" style={{ fontSize: 30, lineHeight: 1.3 }}>اعمل الخير مع رفقائك</b>
          <span className="small" style={{ opacity: .9, lineHeight: 1.9 }}>مجموعة للعيلة أو الأصحاب: تشوفوا إنجاز بعض، تتشاركوا ختمة، وتشجّعوا بعض كل يوم.</span>
        </div>
      </section>
      <section className="card col" style={{ gap: 12 }}>
        <b className="h2">اسمك اللي هيظهر لرفقائك</b>
        <input className="q-input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: أبو يوسف" aria-label="الاسم" />
        <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
          {HUES.map((h) => <button key={h} className={'rq-hue' + (h === hue ? ' on' : '')} style={{ '--h': h }} onClick={() => setHue(h)} aria-label="لون"><Avatar name={name || 'ر'} hue={h} size={38} /></button>)}
        </div>
        <motion.button whileTap={{ scale: .97 }} className="btn q-go" disabled={!ok} onClick={() => { setRufaqa({ name: name.trim(), hue }); sound.next(); if (code) go('/rufaqa/join/' + code); }}>
          {code ? 'كمّل وانضم للمجموعة' : 'يلا نبدأ'} <ChevronLeft size={18} />
        </motion.button>
      </section>
      <Privacy />
    </div>
  );
}

function Privacy() {
  return (
    <section className="card row rq-priv" style={{ gap: 12, alignItems: 'flex-start' }}>
      <ShieldCheck size={22} className="accent" style={{ flex: 'none', marginTop: 2 }} />
      <span className="xs muted" style={{ lineHeight: 1.9 }}>خصوصيتك محفوظة: مش بنطلب إيميل ولا رقم. اللي بيظهر لرفقائك بس اسمك المختار وملخّص يومك (الأذكار، الورد، الصفحات، الصلوات، الصيام). تقدر تخرج من أي مجموعة في أي وقت.</span>
    </section>
  );
}

function Groups({ groups }) {
  const me = useStore((s) => s.rufaqa);
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState(null);
  const [edit, setEdit] = useState(false);
  const [nm, setNm] = useState(me.name);

  const refresh = useCallback(() => {
    if (!groups.length) { setList([]); return; }
    Promise.all(groups.map((g) => loadGroup(g).catch(() => ({ err: true, gid: g })))).then(setList);
  }, [groups.join()]); // eslint-disable-line
  useEffect(refresh, [refresh]);

  const submit = async () => {
    setBusy(true);
    try {
      const g = mode === 'create' ? await createGroup(val.trim()) : await joinGroup(val);
      sound.milestone(); vibrate([20, 40, 60]); toast(mode === 'create' ? 'اتعملت المجموعة — ابعت الكود لرفقائك' : 'أهلاً بيك في المجموعة 💚');
      setMode(null); setVal(''); go('/rufaqa/g/' + g);
    } catch (e) { toast(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title="رفقاء الخير" sub="«المرء على دين خليله»" fallback="/" />
      <section className="card row" style={{ gap: 12 }}>
        <Avatar name={me.name} hue={me.hue} size={48} me />
        {edit ? (
          <div className="row" style={{ flex: 1, gap: 8 }}>
            <input className="inp" style={{ flex: 1, minWidth: 0 }} value={nm} maxLength={20} onChange={(e) => setNm(e.target.value)} aria-label="الاسم" />
            <button className="btn" style={{ minHeight: 44, padding: '0 14px' }} disabled={nm.trim().length < 2} onClick={() => { renameMe(nm.trim()).catch(() => {}); useStore.getState().setRufaqa({ name: nm.trim() }); setEdit(false); }}><Check size={18} /></button>
          </div>
        ) : (
          <div className="col" style={{ flex: 1, gap: 2 }}>
            <b className="h2">{me.name}</b>
            <span className="xs muted">نقاطك الأسبوع ده: {arNum(summary().week)}</span>
          </div>
        )}
        {!edit && <button className="icon-btn" onClick={() => { setNm(me.name); setEdit(true); }} aria-label="تعديل الاسم"><Pencil size={17} /></button>}
      </section>

      <div className="row" style={{ gap: 10 }}>
        <motion.button whileTap={{ scale: .97 }} className="btn q-go" style={{ flex: 1, whiteSpace: 'nowrap', fontSize: 15, padding: '0 12px' }} onClick={() => { setMode('create'); setVal(''); }}><Plus size={18} /> مجموعة جديدة</motion.button>
        <motion.button whileTap={{ scale: .97 }} className="btn soft" style={{ flex: 1, minHeight: 54 }} onClick={() => { setMode('join'); setVal(''); }}><LogIn size={18} /> انضم بكود</motion.button>
      </div>

      {list === null && groups.length > 0 && <div className="rq-skel" />}
      {list?.map((x, i) => x?.err ? (
        <section key={x.gid} className="card between"><span className="small muted">تعذّر تحميل مجموعة — اتأكد من الإنترنت</span><button className="icon-btn" onClick={refresh} aria-label="إعادة"><RefreshCw size={17} /></button></section>
      ) : x && (
        <motion.button key={x.group.id} className="rq-gcard" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} onClick={() => go('/rufaqa/g/' + x.group.id)}>
          <div className="between" style={{ width: '100%' }}>
            <b className="h2">{x.group.name}</b>
            <span className="xs muted">{arNum(x.group.members.length)} {x.group.members.length > 10 ? 'عضو' : 'أعضاء'}</span>
          </div>
          <div className="rq-stack">{x.users.slice(0, 6).map((u) => <Avatar key={u.uid} name={u.name} hue={u.hue} size={32} me={u.uid === x.uid} />)}</div>
          <div className="xs muted row" style={{ gap: 6 }}><BookOpen size={13} /> الختمة {arNum(x.group.khatma?.n || 1)}: {arNum(Object.values(x.group.khatma?.parts || {}).filter((p) => p.done).length)} من ٣٠ جزء{x.cheers.length ? <> · <Heart size={13} className="rq-heart" /> {arNum(x.cheers.length)} تشجيع</> : null}</div>
        </motion.button>
      ))}
      {list?.length === 0 && (
        <section className="card col center" style={{ gap: 8, padding: 26 }}>
          <Users size={34} className="accent" style={{ margin: '0 auto' }} />
          <b className="h2">لسه مفيش مجموعات</b>
          <span className="xs muted" style={{ lineHeight: 1.9 }}>اعمل مجموعة وابعت الكود لأهلك أو أصحابك، أو ادخل بكود حد بعتهولك.</span>
        </section>
      )}
      <Privacy />

      <AnimatePresence>{mode && <Sheet onClose={() => setMode(null)} label={mode === 'create' ? 'مجموعة جديدة' : 'انضم لمجموعة'}>
        <div className="col" style={{ gap: 12, paddingBottom: 10 }}>
          <b className="h2">{mode === 'create' ? 'مجموعة جديدة' : 'انضم لمجموعة'}</b>
          {mode === 'create' ? (
            <>
              <input className="q-input" autoFocus value={val} maxLength={30} onChange={(e) => setVal(e.target.value)} placeholder="اسم المجموعة — مثلاً: عيلة الدولي" aria-label="اسم المجموعة" />
              <div className="chips">{['العيلة', 'أصحاب الجامعة', 'شلة المسجد', 'زملاء الشغل'].map((s) => <button key={s} className="chip" onClick={() => setVal(s)}>{s}</button>)}</div>
            </>
          ) : (
            <input className="q-input rq-code-in" autoFocus value={val} maxLength={6} onChange={(e) => setVal(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="الكود (٦ حروف)" dir="ltr" aria-label="كود المجموعة" />
          )}
          <button className="btn q-go" disabled={busy || (mode === 'create' ? val.trim().length < 2 : val.length !== 6)} onClick={submit}>{busy ? 'لحظة…' : mode === 'create' ? 'اعمل المجموعة' : 'انضم'}</button>
        </div>
      </Sheet>}</AnimatePresence>
    </div>
  );
}

function JoinScreen({ code }) {
  const groups = useStore((s) => s.rufaqa.groups);
  const [state, setState] = useState('joining');
  useEffect(() => {
    let dead = false;
    joinGroup(code).then((g) => { if (dead) return; sound.milestone(); toast('أهلاً بيك في المجموعة 💚'); location.replace('#/rufaqa/g/' + g); })
      .catch((e) => { if (!dead) setState(errMsg(e)); });
    return () => { dead = true; };
  }, [code]);
  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title="رفقاء الخير" fallback="/rufaqa" />
      <section className="card col center" style={{ gap: 12, padding: 28 }}>
        <div style={{ margin: '0 auto' }}><TileArt id="rufaqa" size={90} /></div>
        {state === 'joining' ? <b className="h2">بندخّلك المجموعة… <span dir="ltr">{code}</span></b> : (<>
          <b className="h2">{state}</b>
          <button className="btn soft" onClick={() => go('/rufaqa')}>رجوع لمجموعاتي{groups?.length ? ` (${ar(groups.length)})` : ''}</button>
        </>)}
      </section>
    </div>
  );
}

const JUZ = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
const DAY = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function Group({ gid }) {
  const me = useStore((s) => s.rufaqa);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState('board');
  const [cheerTo, setCheerTo] = useState(null);
  const [busy, setBusy] = useState(null);
  const [more, setMore] = useState(false);

  const load = useCallback(async (push) => {
    try { if (push) await pushMe().catch(() => {}); const d = await loadGroup(gid); if (!d) { useStore.getState().removeRufaqaGroup(gid); toast('المجموعة دي اتحذفت'); go('/rufaqa'); return; } setData(d); setErr(false); }
    catch { setErr(true); }
  }, [gid]);
  useEffect(() => { load(true); const t = setInterval(() => document.visibilityState === 'visible' && load(), 45000); return () => clearInterval(t); }, [load]);

  if (!data) return (
    <div className="screen no-nav"><Pattern /><TopBar title="رفقاء الخير" fallback="/rufaqa" />
      {err ? <section className="card col center" style={{ gap: 10 }}><b className="h2">{errMsg()}</b><button className="btn soft" onClick={() => load(true)}><RefreshCw size={16} /> حاول تاني</button></section> : <div className="rq-skel" style={{ height: 260 }} />}
    </div>
  );

  const { group: g, users, cheers, uid } = data;
  const wk = weekKey(); const tk = todayKey();
  const rows = users.map((u) => { const s = u.s || {}; const wv = s.wk === wk; return { ...u, me: u.uid === uid, wv, wkD: wv ? s.wkD || 0 : 0, wkP: wv ? s.wkP || 0 : 0, wkQ: wv ? s.wkQ || 0 : 0, week: wv ? s.week || 0 : 0, today: s.date === tk ? s : null, streak: s.streak || 0, seen: u.at }; })
    .sort((a, b) => b.week - a.week);
  const maxW = Math.max(1, ...rows.map((x) => x.week));
  const parts = g.khatma?.parts || {};
  const doneN = Object.values(parts).filter((p) => p.done).length;
  const link = SITE + '#/rufaqa/join/' + g.code;
  const inviteText = `انضم لمجموعتي «${g.name}» في رفقاء الخير على تطبيق الرفيق 💚\nنشجّع بعض على الأذكار والورد والختمة.\nالكود: ${g.code}\n${link}`;

  const invite = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) { const { Share } = await import('@capacitor/share'); await Share.share({ title: 'رفقاء الخير', text: inviteText }); return; }
    } catch { /* */ }
    if (navigator.share) { try { await navigator.share({ title: 'رفقاء الخير', text: inviteText }); return; } catch (e) { if (e?.name === 'AbortError') return; } }
    copy(inviteText);
  };
  const copy = (t) => { navigator.clipboard?.writeText(t).then(() => toast('اتنسخ ✓')).catch(() => toast(t)); };

  const part = async (n) => {
    const p = parts[n]; setBusy(n);
    try {
      if (p?.uid === uid && !p.done) {
        if (confirm(`خلّصت الجزء ${ar(n)}؟ (إلغاء = تسيبه لحد تاني)`)) { await donePart(gid, n); sound.milestone(); vibrate([20, 40, 60]); toast('تقبّل الله — جزء ' + ar(n) + ' ✓'); }
        else await takePart(gid, n);
      } else if (p?.uid === uid && p.done) await donePart(gid, n, false);
      else if (!p) { await takePart(gid, n); sound.tap(); vibrate(10); toast('الجزء ' + ar(n) + ' معاك — ربنا يعينك'); }
      else toast(`الجزء ده مع ${p.name}${p.done ? ' وخلّصه ✓' : ''}`);
      await load();
    } catch (e) { toast(errMsg(e)); } finally { setBusy(null); }
  };
  const finish = async () => { if (!confirm('نبدأ ختمة جديدة؟ الأجزاء هتتصفّر.')) return; try { await newKhatma(gid, g.khatma?.n || 1); sound.milestone(); toast('ما شاء الله! ختمة جديدة بإذن الله'); load(); } catch (e) { toast(errMsg(e)); } };
  const cheer = async (t) => { const to = cheerTo; setCheerTo(null); try { await sendCheer(gid, to.uid, t); sound.next(); vibrate(12); toast('وصل تشجيعك لـ ' + to.name + ' 💚'); } catch (e) { toast(errMsg(e)); } };
  const leave = async () => { if (!confirm(`متأكد إنك عايز تخرج من «${g.name}»؟`)) return; try { await leaveGroup(gid); toast('خرجت من المجموعة'); go('/rufaqa'); } catch (e) { toast(errMsg(e)); } };

  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title={g.name} sub={`${arNum(users.length)} ${users.length > 10 ? 'رفيق' : 'رفقاء'} · الكود ${g.code}`} fallback="/rufaqa"
        right={<button className="icon-btn" onClick={() => load(true)} aria-label="تحديث"><RefreshCw size={18} /></button>} />

      <section className="rq-invite">
        <div className="col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <span className="xs" style={{ opacity: .85 }}>كود المجموعة</span>
          <b className="rq-code" dir="ltr">{g.code}</b>
        </div>
        <button className="rq-ib" onClick={() => copy(g.code)} aria-label="نسخ الكود"><Copy size={18} /></button>
        <motion.button whileTap={{ scale: .95 }} className="rq-ib main" onClick={invite}><Share2 size={18} /> ادعُ رفقاءك</motion.button>
      </section>

      {cheers.length > 0 && (
        <section className="rq-cheers">
          <div className="row small" style={{ gap: 6, fontWeight: 700 }}><Heart size={16} className="rq-heart" /> تشجيع وصلك</div>
          {cheers.slice(0, more ? 15 : 3).map((c) => (
            <div key={c.id} className="rq-cheer"><b>{c.fromName}:</b> {c.text} <span className="xs muted">{ago(c.at)}</span></div>
          ))}
          {cheers.length > 3 && <button className="link-btn" onClick={() => setMore(!more)}>{more ? 'أقل' : 'كل التشجيعات'}</button>}
        </section>
      )}

      <div className="rq-tabs" role="tablist">
        {[['board', 'الرفقاء', Users], ['dhikr', 'الذكر الجماعي', Sparkles], ['quiz', 'أسئلة اليوم', HelpCircle], ['honor', 'لوحة الشرف', Trophy], ['khatma', 'الختمة', BookOpen]].map(([k, l, I]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={16} /> {l}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'board' && (
          <motion.section key="b" className="col" style={{ gap: 10 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="xs muted">ترتيب الأسبوع (من {DAY[0]}) — النقاط: أذكار ٢٠، صفحة ٥، صلاة ١٠، صيام ٣٠، إجابة صحيحة ١٠، كل ١٠ تسبيحات ١</div>
            {rows.map((u, i) => (
              <motion.div key={u.uid} className={'rq-mem' + (u.me ? ' me' : '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className={'rq-rank r' + (i + 1)}>{i === 0 && u.week ? <Crown size={15} /> : ar(i + 1)}</span>
                  <Avatar name={u.name} hue={u.hue} size={42} me={u.me} />
                  <div className="col" style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <div className="between"><b className="small">{u.name}{u.me ? ' (أنت)' : ''}</b><b className="small accent">{arNum(u.week)}</b></div>
                    <div className="rq-bar"><i style={{ width: `${(u.week / maxW) * 100}%`, '--h': u.hue ?? 150 }} /></div>
                  </div>
                </div>
                <div className="rq-today">
                  {u.today ? (<>
                    <Chip on={u.today.azkar >= 1} icon={<Sun size={12} />}>{u.today.azkar === 2 ? 'الصباح والمساء' : u.today.azkar ? 'أذكار' : 'الأذكار'}</Chip>
                    <Chip on={u.today.prayers > 0}>{ar(u.today.prayers)}/٥ صلوات</Chip>
                    <Chip on={u.today.pages > 0} icon={<BookOpen size={12} />}>{ar(u.today.pages)} صفحة</Chip>
                    <Chip on={u.today.wird > 0}>{arNum(u.today.wird)} تسبيحة</Chip>
                    {u.today.fasted && <Chip on icon={<Moon size={12} />}>صايم</Chip>}
                  </>) : <span className="xs muted">لسه مسجّلش حاجة النهارده</span>}
                  {u.streak > 1 && <span className="rq-streak"><Flame size={12} /> {daysAr(u.streak)}</span>}
                </div>
                {!u.me && <button className="rq-cheer-btn" onClick={() => setCheerTo(u)}><Heart size={14} /> شجّع {u.name}</button>}
              </motion.div>
            ))}
            <button className="btn ghost" style={{ marginTop: 6, color: 'var(--danger, #D9534F)' }} onClick={leave}><LogOut size={16} /> اخرج من المجموعة</button>
          </motion.section>
        )}
        {tab === 'dhikr' && <DhikrTab key="d" g={g} gid={gid} rows={rows} reload={load} />}
        {tab === 'quiz' && <QuizTab key="q" rows={rows} reload={() => load(true)} />}
        {tab === 'honor' && <HonorTab key="h" rows={rows} />}
        {tab === 'khatma' && (
          <motion.section key="k" className="col" style={{ gap: 12 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <section className="card col" style={{ gap: 8 }}>
              <div className="between"><b className="h2">الختمة رقم {arNum(g.khatma?.n || 1)}</b><b className="accent">{arNum(doneN)} / ٣٠</b></div>
              <div className="rq-kbar"><i style={{ width: `${(doneN / 30) * 100}%` }} /></div>
              <span className="xs muted" style={{ lineHeight: 1.8 }}>اضغط على جزء فاضي تحجزه، واضغط عليه تاني لما تخلّصه. كل جزء مع رفيق واحد.</span>
            </section>
            <div className="rq-juz">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
                const p = parts[n]; const mine = p?.uid === uid; const u = p && users.find((x) => x.uid === p.uid);
                return (
                  <motion.button key={n} whileTap={{ scale: .92 }} disabled={busy === n} className={'rq-j' + (p ? ' taken' : '') + (p?.done ? ' done' : '') + (mine ? ' mine' : '')} style={{ '--h': u?.hue ?? 150 }} onClick={() => part(n)}>
                    <b>{ar(n)}</b>
                    <span>{p ? (p.done ? '✓ ' : '') + (mine ? 'أنت' : p.name) : 'فاضي'}</span>
                  </motion.button>
                );
              })}
            </div>
            {doneN === 30 && <motion.button initial={{ scale: .9 }} animate={{ scale: 1 }} className="btn q-go" onClick={finish}><Trophy size={18} /> ختمنا القرآن! ابدأوا ختمة جديدة</motion.button>}
            {Object.entries(parts).filter(([, p]) => p.uid === uid && !p.done).map(([n]) => (
              <button key={n} className="btn soft" onClick={() => go('/quran/' + JUZ[n - 1])}><BookOpen size={16} /> اقرأ الجزء {ar(n)} (من صفحة {ar(JUZ[n - 1])})</button>
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>{cheerTo && <Sheet onClose={() => setCheerTo(null)} label={'شجّع ' + cheerTo.name}>
        <div className="col" style={{ gap: 8, paddingBottom: 10 }}>
          <b className="h2">شجّع {cheerTo.name}</b>
          {CHEERS.map((t) => <button key={t} className="rq-pre" onClick={() => cheer(t)}><Send size={15} className="accent" /> {t}</button>)}
        </div>
      </Sheet>}</AnimatePresence>
    </div>
  );
}

function Chip({ on, icon, children }) { return <span className={'rq-chip' + (on ? ' on' : '')}>{icon}{children}</span>; }

function ago(t) {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return 'دلوقتي'; if (m < 60) return `من ${ar(m)} د`;
  const h = Math.round(m / 60); if (h < 24) return `من ${ar(h)} س`;
  return `من ${daysAr(Math.round(h / 24))}`;
}

const pct = (a, b) => Math.min(100, b ? (a / b) * 100 : 0);
const tabAnim = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

// الذكر الجماعي اليومي: مجموع المجموعة لكل ذكر مقابل هدف مشترك
function DhikrTab({ g, gid, rows, reload }) {
  const list = (g.dhikr?.length ? g.dhikr : DEFAULT_DHIKR).filter((d) => WIRD.find((w) => w.id === d.id));
  const [edit, setEdit] = useState(false);
  return (
    <motion.section className="col" style={{ gap: 12 }} {...tabAnim}>
      <div className="between"><span className="xs muted" style={{ lineHeight: 1.8 }}>هدف المجموعة النهارده — كل تسبيحة منك بتتحسب للكل 💚</span>
        <button className="link-btn" onClick={() => setEdit(true)}><Settings2 size={13} style={{ verticalAlign: -2 }} /> الأهداف</button></div>
      {list.map((d, i) => {
        const w = WIRD.find((x) => x.id === d.id);
        const by = rows.map((u) => ({ ...u, n: u.today?.w?.[d.id] || 0 })).filter((u) => u.n > 0).sort((a, b) => b.n - a.n);
        const total = by.reduce((a, u) => a + u.n, 0); const done = total >= d.goal;
        return (
          <motion.div key={d.id} className={'rq-dh' + (done ? ' done' : '')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}>
            <div className="between" style={{ gap: 8 }}>
              <b className="amiri" style={{ fontSize: 19, lineHeight: 1.6 }}>{w.short}</b>
              {done ? <span className="rq-done-tag">✓ اكتمل الهدف</span> : <span className="xs muted">باقي {arNum(d.goal - total)}</span>}
            </div>
            <div className="rq-dh-bar"><i style={{ width: pct(total, d.goal) + '%' }} />
              {by.length > 0 && <div className="rq-dh-seg">{by.map((u) => <span key={u.uid} style={{ width: pct(u.n, Math.max(d.goal, total)) + '%', '--h': u.hue ?? 150 }} title={u.name} />)}</div>}
            </div>
            <div className="between">
              <b className="small"><span className="accent">{arNum(total)}</span> <span className="muted">/ {arNum(d.goal)}</span></b>
              <div className="rq-stack">{by.slice(0, 5).map((u) => <Avatar key={u.uid} name={u.name} hue={u.hue} size={24} me={u.me} />)}</div>
            </div>
            {by.length > 0 && <div className="xs muted">{by.slice(0, 3).map((u) => `${u.me ? 'أنت' : u.name} ${arNum(u.n)}`).join(' · ')}</div>}
            <button className="btn soft" style={{ minHeight: 40 }} onClick={() => go('/wird/' + d.id)}><Sparkles size={15} /> شارك بتسبيحك</button>
          </motion.div>
        );
      })}
      <AnimatePresence>{edit && <DhikrEdit list={list} onClose={() => setEdit(false)} onSave={async (l) => { setEdit(false); try { await setGroupDhikr(gid, l); toast('اتحدّثت أهداف المجموعة'); reload(); } catch (e) { toast(errMsg(e)); } }} />}</AnimatePresence>
    </motion.section>
  );
}

const GOALS = [100, 300, 500, 1000, 3000];
function DhikrEdit({ list, onClose, onSave }) {
  const [sel, setSel] = useState(list);
  const has = (id) => sel.find((d) => d.id === id);
  const toggle = (id) => setSel(has(id) ? sel.filter((d) => d.id !== id) : sel.length >= 4 ? sel : [...sel, { id, goal: 1000 }]);
  return (
    <Sheet onClose={onClose} label="أهداف الذكر الجماعي">
      <div className="col" style={{ gap: 12, paddingBottom: 10 }}>
        <b className="h2">أهداف الذكر الجماعي</b>
        <span className="xs muted">اختار لحد ٤ أذكار، وحدّد هدف المجموعة لكل واحد في اليوم.</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{WIRD.filter((w) => !w.long).map((w) => <button key={w.id} className={'chip' + (has(w.id) ? ' on' : '')} onClick={() => toggle(w.id)}>{w.short}</button>)}</div>
        {sel.map((d) => (
          <div key={d.id} className="col" style={{ gap: 6 }}>
            <b className="small">{WIRD.find((w) => w.id === d.id)?.short}</b>
            <div className="chips">{GOALS.map((n) => <button key={n} className={'chip' + (d.goal === n ? ' on' : '')} onClick={() => setSel(sel.map((x) => x.id === d.id ? { ...x, goal: n } : x))}>{arNum(n)}</button>)}</div>
          </div>
        ))}
        <button className="btn q-go" disabled={!sel.length} onClick={() => onSave(sel)}>حفظ الأهداف</button>
      </div>
    </Sheet>
  );
}

// ٣ أسئلة اليوم: نفس الأسئلة للكل، كل إجابة صح بـ١٠ نقاط في ترتيب الأسبوع
function QuizTab({ rows, reload }) {
  const date = todayKey();
  const [qs, setQs] = useState(null);
  const ans = useStore((s) => s.dailyQ?.[date]) || [];
  const answerDaily = useStore((s) => s.answerDaily);
  useEffect(() => { dailyQuestions(date).then(setQs); }, [date]);
  const answered = ans.filter(Boolean).length;
  const pick = (i, c) => {
    if (ans[i]) return; const ok = c === qs[i].answer;
    answerDaily(date, i, c, ok);
    if (ok) { sound.correct(); vibrate([15, 30, 15]); } else { sound.wrong(); vibrate(40); }
    if (answered + 1 === 3) setTimeout(() => { pushMe().then(reload).catch(() => {}); }, 400);
  };
  const board = rows.filter((u) => u.today?.qa).sort((a, b) => (b.today.q - a.today.q) || (b.today.qa - a.today.qa));
  if (!qs) return <div className="rq-skel" />;
  return (
    <motion.section className="col" style={{ gap: 12 }} {...tabAnim}>
      <div className="rq-qhead">
        <HelpCircle size={22} />
        <div className="col" style={{ flex: 1, gap: 2 }}><b>أسئلة اليوم</b><span className="xs" style={{ opacity: .85 }}>٣ أسئلة جديدة كل يوم — كل إجابة صح بـ١٠ نقاط</span></div>
        <b className="rq-qscore">{ar(ans.filter((x) => x?.ok).length)}/٣</b>
      </div>
      {qs.map((q, i) => {
        const a = ans[i];
        return (
          <motion.div key={q.id} className="rq-q" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08 }}>
            <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
              <span className="rq-qn">{ar(i + 1)}</span>
              <b className="small" style={{ lineHeight: 1.9, flex: 1 }}>{q.q}</b>
            </div>
            <div className="col" style={{ gap: 6 }}>
              {q.options.map((o, j) => {
                const st = a ? (j === q.answer ? ' ok' : j === a.c ? ' bad' : ' dim') : '';
                return <button key={j} className={'rq-opt' + st} disabled={!!a} onClick={() => pick(i, j)}><span>{LETTERS[j]}</span>{o}</button>;
              })}
            </div>
            {a && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={'xs rq-note' + (a.ok ? ' ok' : '')}>{a.ok ? '✓ إجابة صحيحة — +١٠ نقاط. ' : '✗ الإجابة الصحيحة: ' + q.options[q.answer] + '. '}{q.note}</motion.div>}
          </motion.div>
        );
      })}
      <section className="card col" style={{ gap: 8 }}>
        <b className="h2 row" style={{ gap: 6 }}><Medal size={18} className="accent" /> نتيجة المجموعة النهارده</b>
        {board.length ? board.map((u, i) => (
          <div key={u.uid} className="row" style={{ gap: 10 }}>
            <span className={'rq-rank r' + (i + 1)}>{ar(i + 1)}</span>
            <Avatar name={u.name} hue={u.hue} size={30} me={u.me} />
            <b className="small" style={{ flex: 1 }}>{u.me ? 'أنت' : u.name}</b>
            <span className="small"><b className="accent">{ar(u.today.q)}</b> صح من {ar(u.today.qa)}</span>
          </div>
        )) : <span className="xs muted">لسه محدش جاوب النهارده — كن الأول!</span>}
      </section>
    </motion.section>
  );
}

// لوحة الشرف: أبطال الأسبوع في كل مجال + تنافس الذكر
const HONORS = [
  { k: 'week', t: 'نجم الأسبوع', d: 'أعلى نقاط', icon: '👑', c: '#E8BE5C', f: (n) => `${arNum(n)} نقطة` },
  { k: 'wkD', t: 'بطل الذكر', d: 'أكتر تسبيح', icon: '📿', c: '#1FA36A', f: (n) => `${arNum(n)} ذكر` },
  { k: 'wkP', t: 'رفيق القرآن', d: 'أكتر صفحات', icon: '📖', c: '#2F7BEA', f: (n) => `${arNum(n)} صفحة` },
  { k: 'wkQ', t: 'فارس الأسئلة', d: 'أكتر إجابات صح', icon: '🧠', c: '#8B5CF6', f: (n) => `${arNum(n)} إجابة` },
  { k: 'streak', t: 'صاحب السلسلة', d: 'أطول مواظبة', icon: '🔥', c: '#F07A2A', f: (n) => daysAr(n) },
];
function HonorTab({ rows }) {
  const [span, setSpan] = useState('week');
  const dz = rows.map((u) => ({ ...u, dz: span === 'week' ? u.wkD : (u.today?.wird || 0) })).sort((a, b) => b.dz - a.dz);
  const top = dz[0]?.dz || 1;
  return (
    <motion.section className="col" style={{ gap: 12 }} {...tabAnim}>
      <div className="rq-honor-grid">
        {HONORS.map((h, i) => {
          const best = [...rows].sort((a, b) => (b[h.k] || 0) - (a[h.k] || 0))[0]; const v = best?.[h.k] || 0;
          return (
            <motion.div key={h.k} className={'rq-honor' + (i === 0 ? ' big' : '')} style={{ '--c': h.c }} initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .07 }}>
              <span className="rq-honor-ic">{h.icon}</span>
              <b className="small">{h.t}</b>
              {v > 0 ? (<>
                <Avatar name={best.name} hue={best.hue} size={i === 0 ? 54 : 40} me={best.me} />
                <b className={i === 0 ? 'h2' : 'small'}>{best.me ? 'أنت' : best.name}</b>
                <span className="xs" style={{ color: h.c, fontWeight: 700 }}>{h.f(v)}</span>
              </>) : <span className="xs muted" style={{ marginTop: 8 }}>{h.d} — لسه محدش</span>}
            </motion.div>
          );
        })}
      </div>
      <section className="card col" style={{ gap: 10 }}>
        <div className="between"><b className="h2 row" style={{ gap: 6 }}>📿 تنافس الذكر</b>
          <div className="rq-seg">{[['today', 'النهارده'], ['week', 'الأسبوع']].map(([k, l]) => <button key={k} className={span === k ? 'on' : ''} onClick={() => setSpan(k)}>{l}</button>)}</div></div>
        {dz.map((u, i) => (
          <div key={u.uid} className="row" style={{ gap: 10 }}>
            <span className={'rq-rank r' + (i + 1)}>{i === 0 && u.dz ? <Crown size={14} /> : ar(i + 1)}</span>
            <Avatar name={u.name} hue={u.hue} size={32} me={u.me} />
            <div className="col" style={{ flex: 1, gap: 4, minWidth: 0 }}>
              <div className="between"><b className="small">{u.me ? 'أنت' : u.name}</b><b className="small accent">{arNum(u.dz)}</b></div>
              <div className="rq-bar"><i style={{ width: pct(u.dz, top) + '%', '--h': u.hue ?? 150 }} /></div>
            </div>
          </div>
        ))}
      </section>
      <div className="xs muted center">لوحة الشرف بتتجدد كل سبت — «وفي ذلك فليتنافس المتنافسون»</div>
    </motion.section>
  );
}
