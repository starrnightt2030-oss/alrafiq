import { BookOpen, CircleDot, HandHeart, ShieldCheck, Headphones, BookMarked, Trophy, Flame, Sunrise, Sunset, BellRing, ChartColumn, CheckCircle2, GraduationCap, MessageCircleHeart, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, streakOf } from '../store.js';
import { THEMES, THEME_ORDER } from '../themes.js';
import { AZKAR } from '../data/azkar.js';
import { ar, arNum, todayKey, hijri, gregorian, daysAr } from '../lib/arabic.js';
import { resolveLocation, nextPrayer, timesFor, fmtTime, countdown } from '../lib/prayer.js';
import { dueReminder } from '../lib/notify.js';
import { useNow } from '../hooks.js';
import { Pattern, Ring, Credit } from '../components/ui.jsx';
import quranMeta from '../data/quranMeta.json';
import logo from '../assets/logo.webp';
import { STATUS, STATUS_ORDER } from '../lib/stats.js';
import { useChallengeWatcher } from './Challenges.jsx';
import { vibrate } from '../lib/haptics.js';
import TileArt from '../components/TileArt.jsx';
import { hijriParts, sunnahOf, ramadanDays } from '../lib/fasting.js';
import { earnedCount } from '../lib/badges.js';
import { dueReviews, memorizedCount } from '../lib/hifz.js';
import { STORY } from '../data/stories/index.js';
import { qiblaBearing } from '../lib/qibla.js';
import { useState, useEffect } from 'react';
import { sound } from '../lib/sound.js';
import { ArrowLeftRight, Check, RotateCcw, Play } from 'lucide-react';

// المربعات: كل قسم بتدرّج ألوان خاص ورسمة معبّرة، و«wide» للمربعات العريضة
export const TILES = {
  azkar: { to: '/azkar', label: 'الأذكار', sub: 'حصن المسلم كاملًا', c: ['#1E9E74', '#0B5E46'] },
  quran: { to: '/quran', label: 'المصحف الشريف', sub: 'قراءة بخط المصحف المعتمد', c: ['#2F5FD0', '#172E78'], wide: true },
  wird: { to: '/wird', label: 'الورد اليومي', sub: 'تسبيح واستغفار', c: ['#16A2B0', '#0B5A6E'] },
  hifz: { to: '/hifz', label: 'الحفظ', sub: 'متابعة ومراجعة', c: ['#8A55D6', '#4A2A8C'] },
  quiz: { to: '/quiz', label: 'فاستبقوا الخيرات', sub: 'مسابقة بمراحل وشهادة', c: ['#D99A2B', '#8A4B0E'], wide: true },
  stories: { to: '/stories', label: 'القصص', sub: 'سيرة وصحابة وأنبياء', c: ['#E0743A', '#8C2E16'] },
  duas: { to: '/duas', label: 'الأدعية', sub: 'من القرآن والسنة', c: ['#D6588A', '#7E1F4A'] },
  ruqyah: { to: '/ruqyah', label: 'الرقية', sub: 'الرقية الشرعية', c: ['#3C7FD8', '#163E80'] },
  challenges: { to: '/challenges', label: 'التحديات', sub: 'أوسمة ونقاط', c: ['#E2533E', '#8E1E1E'] },
  report: { to: '/report', label: 'تقييمي', sub: 'أسبوعي وشهري', c: ['#5B6BE0', '#2C2F86'] },
  qibla: { to: '/qibla', label: 'القبلة', sub: 'بوصلة حيّة', c: ['#4A4A52', '#16161C'] },
  prayer: { to: '/prayer', label: 'مواقيت الصلاة', sub: 'وسجلّ صلواتك', c: ['#2A9D8F', '#145A52'] },
  badges: { to: '/badges', label: 'أوسمتي', sub: 'الإنجازات والدرجات', c: ['#C98E1E', '#6B3F05'] },
  rufaqa: { to: '/rufaqa', label: 'رفقاء الخير', sub: 'مجموعات العيلة والأصحاب', c: ['#E0507A', '#7A1E46'], wide: true },
  library: { to: '/library', label: 'المكتبة الإسلامية', sub: 'أمهات كتب التراث', c: ['#8C5A1F', '#3E260C'] },
  manasik: { to: '/manasik', label: 'دليل العمرة والحج', sub: 'خطوة بخطوة بالأدعية', c: ['#3A3A3A', '#141414'] },
  asmaa: { to: '/asmaa', label: 'أسماء الله الحسنى', sub: 'الـ٩٩ اسمًا ومعانيها', c: ['#2B8C8C', '#0F4C52'] },
  nawawi: { to: '/nawawi', label: 'الأربعون النووية', sub: 'بالتخريج والفوائد', c: ['#B5793A', '#5E3510'] },
  zakat: { to: '/zakat', label: 'حاسبة الزكاة', sub: 'المال والذهب والتجارة', c: ['#3E9B5A', '#17502A'] },
  fasting: { to: '/fasting', label: 'الصيام ورمضان', sub: 'السنن والإمساكية والختمة', c: ['#7A3FB0', '#3A1460'] },
};
export const TILE_ORDER = ['azkar', 'quran', 'wird', 'hifz', 'quiz', 'stories', 'rufaqa', 'duas', 'ruqyah', 'challenges', 'report', 'qibla', 'prayer', 'fasting', 'library', 'asmaa', 'nawawi', 'manasik', 'zakat', 'badges'];

const surahOfPage = (p) => { let s = quranMeta.surahs[0]; for (const x of quranMeta.surahs) { if (x.page <= p) s = x; else break; } return s; };

export default function Home() {
  const now = useNow(1000);
  const { settings, days, points, quran, setSetting, setPrayer } = useStore();
  const ch = useChallengeWatcher();
  const unread = useStore((x) => x.inbox.filter((m) => !m.read).length);
  const d = days[todayKey()] || { azkar: {}, wird: {} };
  const place = resolveLocation(settings.location);
  const next = nextPrayer(place, now);
  const times = timesFor(place, now).filter((p) => !p.info);
  const wirdTotal = Object.values(d.wird).reduce((a, b) => a + b, 0);
  const azDone = ['morning', 'evening'].filter((k) => d.azkar[k]?.done).length;
  const goal = settings.wirdGoal;
  const progress = (azDone / 2) * 0.5 + Math.min(1, wirdTotal / goal) * 0.5;
  const streak = streakOf(days);
  const level = 1 + Math.floor(points / 500);
  const due = dueReminder(now);
  const hour = now.getHours();
  const suggest = hour >= 12 ? 'evening' : 'morning';
  const sug = d.azkar[suggest];
  const sugTotal = AZKAR[suggest].items.length;
  const s = surahOfPage(quran.lastPage);
  const ask = [...times].reverse().find((p) => p.time < now && !d.prayers?.[p.key]);

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <Pattern />
      <header className="between" style={{ alignItems: 'flex-start', position: 'relative' }}>
        <div className="col" style={{ gap: 2 }}>
          <div className="small muted">السلام عليكم ورحمة الله</div>
          <div className="row" style={{ gap: 10, margin: '4px 0' }}>
            <img src={logo} alt="" width="46" height="46" style={{ borderRadius: 13, boxShadow: '0 6px 18px -8px rgba(0,0,0,.5)' }} />
            <span className="amiri accent" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>الرفيق</span>
          </div>
          <div className="xs muted">{gregorian(now)}</div>
          <div className="xs muted">{hijri(now)}</div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 8 }}>
        <div className="row" style={{ gap: 8 }}>
        <a href="#/qibla" className="icon-btn" aria-label="اتجاه القبلة"><Compass size={20} /></a>
        <InboxPill unread={unread} />
        </div>
        <div className="row" style={{ gap: 6, padding: 6, borderRadius: 999, background: 'var(--surf)', border: '1px solid var(--line)' }} role="radiogroup" aria-label="الثيم">
          {THEME_ORDER.map((id) => (
            <button key={id} role="radio" aria-checked={settings.theme === id} aria-label={'ثيم ' + THEMES[id].name} onClick={() => setSetting('theme', id)}
              style={{ width: 24, height: 24, borderRadius: '50%', padding: 0, background: `linear-gradient(135deg, ${THEMES[id].bg} 50%, ${THEMES[id].acc} 50%)`, border: '2px solid ' + (settings.theme === id ? 'var(--acc)' : 'transparent'), boxShadow: settings.theme === id ? '0 0 0 2px var(--bg)' : 'none' }} />
          ))}
        </div>
        </div>
      </header>

      {due && (
        <motion.a href={'#/azkar/' + due} className="card hl row" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ textDecoration: 'none', color: 'var(--text)', position: 'relative' }}>
          <BellRing size={22} className="accent" aria-hidden="true" />
          <div style={{ flex: 1 }}><div className="h2">حان وقت {AZKAR[due].title}</div><div className="xs muted">اضغط للبدء الآن</div></div>
        </motion.a>
      )}

      <a href="#/prayer" style={{ position: 'relative', borderRadius: 28, padding: 20, background: 'var(--hero)', color: 'var(--heroText)', textDecoration: 'none', overflow: 'hidden', boxShadow: '0 18px 40px -18px rgba(0,0,0,.45)' }}>
        <svg aria-hidden="true" width="180" height="180" viewBox="0 0 100 100" style={{ position: 'absolute', left: -40, top: -40, opacity: .16 }}>
          <path d="M50 4l11 23 25-4-14 21 14 21-25-4-11 23-11-23-25 4 14-21L14 23l25 4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="between" style={{ position: 'relative' }}>
          <div className="col" style={{ gap: 3 }}>
            <div className="xs" style={{ opacity: .85 }}>الصلاة القادمة · {place.name}</div>
            <div style={{ fontSize: 30, fontWeight: 600 }}>{next.name}</div>
            <div className="small" style={{ opacity: .9 }}>{fmtTime(next.time, place.tz)}</div>
          </div>
          <div className="center" style={{ padding: '10px 14px', borderRadius: 18, background: 'rgba(255,255,255,.12)' }}>
            <div className="ltr num" style={{ fontSize: 27 }}>{ar(countdown(next.time - now))}</div>
            <div className="xs" style={{ opacity: .85 }}>متبقٍّ</div>
          </div>
        </div>
        <div style={{ position: 'relative', marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 4 }}>
          {times.map((p) => (
            <div key={p.key} className="center" style={{ padding: '7px 0', borderRadius: 12, background: p.key === next.key ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.07)' }}>
              <div className="xs" style={{ opacity: .85 }}>{p.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{fmtTime(p.time, place.tz).replace(/\s?[صم]$/, '')}</div>
            </div>
          ))}
        </div>
      </a>

      {ask && (
        <motion.section key={ask.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card col" style={{ gap: 10 }} aria-label="تسجيل الصلاة">
          <div className="row"><CheckCircle2 size={20} className="accent" aria-hidden="true" /><span className="h2">هل صلّيت {ask.name}؟</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
            {STATUS_ORDER.map((k) => <button key={k} onClick={() => { setPrayer(ask.key, k); vibrate(12); }} style={{ minHeight: 40, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--text)', fontSize: 12 }}>{STATUS[k].name}</button>)}
          </div>
        </motion.section>
      )}

      <section className="card row" style={{ gap: 14 }} aria-label="إنجاز اليوم">
        <Ring value={progress} label={`إنجاز اليوم ${Math.round(progress * 100)}٪`}>
          <span className="num" style={{ fontSize: 23 }}>{ar(Math.round(progress * 100))}٪</span>
          <span className="xs muted">إنجاز اليوم</span>
        </Ring>
        <div className="col" style={{ flex: 1, gap: 9 }}>
          <div className="col" style={{ gap: 4 }}>
            <div className="between small"><span>الأذكار</span><span className="muted">{ar(azDone)} من ٢</span></div>
            <div className="bar"><i style={{ width: azDone * 50 + '%' }} /></div>
          </div>
          <div className="col" style={{ gap: 4 }}>
            <div className="between small"><span>الورد اليومي</span><span className="muted">{arNum(wirdTotal)} من {arNum(goal)}</span></div>
            <div className="bar"><i style={{ width: Math.min(100, (wirdTotal / goal) * 100) + '%' }} /></div>
          </div>
          <div className="between xs muted"><span><Flame size={12} className="accent" style={{ verticalAlign: -2 }} /> {streak ? `سلسلة ${daysAr(streak)}` : 'ابدأ سلسلتك'}</span><span>{arNum(points)} نقطة — المستوى {ar(level)}</span></div>
        </div>
      </section>

      <Continue suggest={suggest} sug={sug} sugTotal={sugTotal} s={s} lastPage={quran.lastPage} ch={ch} />

      <Tiles d={d} wirdTotal={wirdTotal} goal={goal} azDone={azDone} lastPage={quran.lastPage} surah={s.name} ch={ch} streak={streak} place={place} next={next} />

      <div className="card center">
        <div className="xs muted">آية اليوم</div>
        <div className="amiri" style={{ fontSize: 22, lineHeight: 1.9, marginTop: 6 }}>﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾</div>
        <div className="xs muted">البقرة · ١٥٢</div>
      </div>

      <Credit />
    </div>
  );
}

function Continue({ suggest, sug, sugTotal, s, lastPage, ch }) {
  const st = useStore((x) => x.stories);
  const story = st.last && STORY[st.last];
  const items = [
    { href: '#/azkar/' + suggest, art: 'azkar', c: TILES.azkar.c, t: AZKAR[suggest].title, sub: sug?.done ? 'تمت اليوم ✓' : sug ? `وقفت عند ${ar(Math.min(sug.i + 1, sugTotal))} من ${ar(sugTotal)}` : `${ar(sugTotal)} ذكرًا` },
    { href: '#/quran/' + lastPage, art: 'quran', c: TILES.quran.c, t: 'كمّل القراءة', sub: `${s.name} — ص ${ar(lastPage)}` },
    story && { href: '#/story/' + story.id, art: 'stories', c: TILES.stories.c, t: story.title, sub: `سمعت ${ar(Math.round((st.pos[story.id] || 0) * 100))}٪` },
    ch.c && ch.started && !ch.done && { href: '#/challenges', art: 'challenges', c: TILES.challenges.c, t: 'تحديك', sub: `${ar(Math.round(ch.pct * 100))}٪ — ${ch.c.badge}` },
  ].filter(Boolean);
  return (
    <section className="col" style={{ gap: 8 }} aria-label="كمّل من حيث وقفت">
      <div className="h2" style={{ fontSize: 15 }}>كمّل من حيث وقفت</div>
      <div className="cont-strip">
        {items.map((it, i) => (
          <motion.a key={it.href} href={it.href} className="cont" style={{ '--g1': it.c[0], '--g2': it.c[1] }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} whileTap={{ scale: .96 }}>
            <span className="cont-art"><TileArt id={it.art} size={38} /></span>
            <span className="col" style={{ minWidth: 0, gap: 1 }}><b className="small cont-t">{it.t}</b><span className="xs" style={{ opacity: .85 }}>{it.sub}</span></span>
            
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function fastStatus() {
  const now = new Date(); const h = hijriParts(now);
  if (h.m === 9) return `رمضان — اليوم ${ar(h.d)}`;
  const s = sunnahOf(new Date(now.getTime() + 864e5));
  if (s && !s.haram) return `بكرة: ${s.name}`;
  const r = ramadanDays(now); if (r.length) { const n = Math.ceil((r[0] - now) / 864e5); if (n > 0) return `رمضان بعد ${daysAr(n)}`; }
  return null;
}

function Tiles({ d, wirdTotal, goal, azDone, lastPage, surah, ch, streak, place, next }) {
  const saved = useStore((x) => x.settings.tiles);
  const setSetting = useStore((x) => x.setSetting);
  const hifz = useStore((x) => x.hifz);
  const best = useStore((x) => x.quiz.best);
  const rq = useStore((x) => x.rufaqa);
  const order = [...(saved || []).filter((k) => TILES[k]), ...TILE_ORDER.filter((k) => !(saved || []).includes(k))];
  const [edit, setEdit] = useState(false);
  const [pick, setPick] = useState(null);
  const due = dueReviews(hifz, 99).length, mem = memorizedCount(hifz);
  const prays = Object.keys(d.prayers || {}).length;
  const status = {
    azkar: azDone === 2 ? 'الصباح والمساء ✓' : azDone ? 'أذكار واحدة ✓' : 'ابدأ أذكارك',
    quran: `${surah} — صفحة ${ar(lastPage)}`,
    wird: `${arNum(wirdTotal)} من ${arNum(goal)}`,
    hifz: due ? `${ar(due)} للمراجعة` : mem ? `${arNum(mem)} صفحة محفوظة` : 'ابدأ خطتك',
    quiz: best ? `أعلى نتيجة ${arNum(best)} نقطة` : 'العب وحدك أو نافس صديقك',
    challenges: ch.c ? (ch.started ? `${ar(Math.round(ch.pct * 100))}٪ من التحدي` : 'تحدٍّ جديد') : 'كل التحديات ✓',
    report: streak ? `سلسلة ${daysAr(streak)}` : null,
    qibla: `${ar(Math.round(qiblaBearing(place.lat, place.lng)))}°`,
    prayer: `${ar(prays)} من ٥ مسجّلة`,
    fasting: fastStatus(),
    nawawi: (useStore.getState().nawawi || []).length ? `حفظت ${ar(useStore.getState().nawawi.length)} من ٤٢` : null,
    badges: `${arNum(earnedCount(useStore.getState()))} وسام مكتسب`,
    rufaqa: rq?.groups?.length ? `${ar(rq.groups.length)} ${rq.groups.length > 1 ? 'مجموعات' : 'مجموعة'} — شوف رفقاءك` : 'اعمل مجموعة وادعُ أهلك',
  };
  const tap = (k, e) => {
    if (!edit) { sound.tap(); return; }
    e.preventDefault();
    if (!pick) { setPick(k); vibrate(10); return; }
    if (pick !== k) { const o = [...order]; const a = o.indexOf(pick), b = o.indexOf(k); [o[a], o[b]] = [o[b], o[a]]; setSetting('tiles', o); vibrate([10, 30, 10]); sound.next(); }
    setPick(null);
  };
  return (
    <section className="col" style={{ gap: 10 }} aria-label="الأقسام">
      <div className="between">
        <div className="h2" style={{ fontSize: 15 }}>الأقسام</div>
        <div className="row" style={{ gap: 6 }}>
          {edit && <button className="link-btn" onClick={() => { setSetting('tiles', null); setPick(null); }}><RotateCcw size={13} style={{ verticalAlign: -2 }} /> الترتيب الأصلي</button>}
          <button className="link-btn" onClick={() => { setEdit(!edit); setPick(null); }} aria-pressed={edit}>{edit ? <><Check size={14} style={{ verticalAlign: -2 }} /> تم</> : <><ArrowLeftRight size={13} style={{ verticalAlign: -2 }} /> ترتيب</>}</button>
        </div>
      </div>
      {edit && <div className="xs muted">اضغط على قسم، ثم على القسم اللي عايز تبدّله مكانه</div>}
      <motion.nav className={'bento' + (edit ? ' editing' : '')} layout>
        {order.map((k, i) => { const t = TILES[k]; return (
          <motion.a key={k} layout href={'#' + t.to} onClick={(e) => tap(k, e)} className={'btile' + (t.wide ? ' wide' : '') + (pick === k ? ' picked' : '')}
            style={{ '--g1': t.c[0], '--g2': t.c[1] }} initial={{ opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(i, 8) * 0.045, type: 'spring', stiffness: 260, damping: 24 }} whileTap={{ scale: .95 }}>
            <span className="bt-pat" aria-hidden="true" />
            <span className="bt-shine" aria-hidden="true" />
            <TileArt id={k} size={t.wide ? 112 : 84} className="bt-art" />
            <span className="bt-text">
              <b className="bt-title">{t.label}</b>
              <span className="bt-sub">{t.sub}</span>
            </span>
            {status[k] && <span className="bt-chip">{status[k]}</span>}
          </motion.a>
        ); })}
      </motion.nav>
    </section>
  );
}

// زر رسائل الرفيق: أحمر نابض دائمًا، بجملة محبّة تتبدّل
const LOVE = ['رسالة بحب من الرفيق', 'الرفيق فاكرك دايمًا', 'كلمة حلوة مستنياك', 'افتح قلبك للرفيق'];
function InboxPill({ unread }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % LOVE.length), 3500); return () => clearInterval(t); }, []);
  const text = unread ? `عندك ${unread > 2 && unread < 11 ? ar(unread) + ' رسائل' : unread === 1 ? 'رسالة' : unread === 2 ? 'رسالتين' : ar(unread) + ' رسالة'} بحب 💌` : LOVE[i];
  return (
    <motion.a href="#/inbox" className="love-pill" aria-label={unread ? `رسائل الرفيق — ${unread} جديدة` : 'رسائل الرفيق'} animate={{ scale: [1, 1.05, 1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
      <span className="love-ring" aria-hidden="true" />
      <motion.span className="love-ic" animate={{ scale: [1, 1.25, 1, 1.18, 1], rotate: [0, -8, 0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}><MessageCircleHeart size={18} /></motion.span>
      <AnimatePresence mode="wait"><motion.span key={text} className="love-t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }}>{text}</motion.span></AnimatePresence>
      {unread > 0 && <span className="love-badge">{ar(unread)}</span>}
    </motion.a>
  );
}
