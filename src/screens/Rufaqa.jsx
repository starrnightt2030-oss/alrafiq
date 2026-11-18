// «رفقاء الخير»: مجموعات للأهل والأصحاب — لوحة الأعضاء، ترتيب الأسبوع، الختمة الجماعية، والتشجيع
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, LogIn, Share2, Copy, RefreshCw, Crown, Flame, BookOpen, Heart, LogOut, Pencil, Check, Moon, Sun, ShieldCheck, ChevronLeft, Trophy, Send } from 'lucide-react';
import { useStore } from '../store.js';
import { TopBar, Pattern, toast } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import TileArt from '../components/TileArt.jsx';
import { ar, arNum, daysAr, todayKey } from '../lib/arabic.js';
import { go } from '../router.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';
import { createGroup, joinGroup, leaveGroup, loadGroup, takePart, donePart, newKhatma, sendCheer, renameMe, pushMe, summary, weekKey, CHEERS, JoinError } from '../lib/rufaqa.js';

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
  const rows = users.map((u) => { const s = u.s || {}; return { ...u, me: u.uid === uid, week: s.wk === wk ? s.week || 0 : 0, today: s.date === tk ? s : null, streak: s.streak || 0, seen: u.at }; })
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
        {[['board', 'لوحة الرفقاء', Trophy], ['khatma', 'الختمة الجماعية', BookOpen]].map(([k, l, I]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={16} /> {l}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'board' ? (
          <motion.section key="b" className="col" style={{ gap: 10 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="xs muted">ترتيب الأسبوع (من {DAY[0]}) — النقاط: أذكار ٢٠، صفحة ٥، صلاة ١٠، صيام ٣٠، كل ١٠ تسبيحات ١</div>
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
        ) : (
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
