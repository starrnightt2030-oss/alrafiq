import { BookOpen, CircleDot, HandHeart, ShieldCheck, Headphones, BookMarked, Trophy, Flame, Sunrise, Sunset, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore, streakOf } from '../store.js';
import { THEMES, THEME_ORDER } from '../themes.js';
import { AZKAR } from '../data/azkar.js';
import { ar, arNum, todayKey, hijri, gregorian } from '../lib/arabic.js';
import { resolveLocation, nextPrayer, timesFor, fmtTime, countdown } from '../lib/prayer.js';
import { dueReminder } from '../lib/notify.js';
import { useNow } from '../hooks.js';
import { Pattern, Ring, Credit } from '../components/ui.jsx';
import quranMeta from '../data/quranMeta.json';
import logo from '../assets/logo.webp';

const TILES = [
  { to: '/azkar', label: 'الأذكار', Icon: BookOpen },
  { to: '/wird', label: 'الورد', Icon: CircleDot },
  { to: '/quran', label: 'المصحف', Icon: BookMarked },
  { to: '/prayer', label: 'الصلاة', Icon: Sunrise },
  { to: '/duas', label: 'الأدعية', Icon: HandHeart },
  { to: '/ruqyah', label: 'الرقية', Icon: ShieldCheck },
  { to: '/soon/stories', label: 'القصص', Icon: Headphones, soon: true },
  { to: '/soon/challenges', label: 'التحديات', Icon: Trophy, soon: true },
];

const surahOfPage = (p) => { let s = quranMeta.surahs[0]; for (const x of quranMeta.surahs) { if (x.page <= p) s = x; else break; } return s; };

export default function Home() {
  const now = useNow(1000);
  const { settings, days, points, quran, setSetting } = useStore();
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
        <div className="row" style={{ gap: 6, padding: 6, borderRadius: 999, background: 'var(--surf)', border: '1px solid var(--line)' }} role="radiogroup" aria-label="الثيم">
          {THEME_ORDER.map((id) => (
            <button key={id} role="radio" aria-checked={settings.theme === id} aria-label={'ثيم ' + THEMES[id].name} onClick={() => setSetting('theme', id)}
              style={{ width: 24, height: 24, borderRadius: '50%', padding: 0, background: `linear-gradient(135deg, ${THEMES[id].bg} 50%, ${THEMES[id].acc} 50%)`, border: '2px solid ' + (settings.theme === id ? 'var(--acc)' : 'transparent'), boxShadow: settings.theme === id ? '0 0 0 2px var(--bg)' : 'none' }} />
          ))}
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
          <div className="between xs muted"><span>{arNum(points)} نقطة</span><span>المستوى {ar(level)}</span></div>
        </div>
      </section>

      <div className="grid2">
        <a href={'#/azkar/' + suggest} className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          {suggest === 'morning' ? <Sunrise className="accent" size={24} aria-hidden="true" /> : <Sunset className="accent" size={24} aria-hidden="true" />}
          <div className="h2" style={{ marginTop: 8 }}>{AZKAR[suggest].title}</div>
          <div className="xs muted">{sug?.done ? 'أتممتها اليوم، تقبّل الله' : sug ? `توقفت عند ${ar(Math.min(sug.i + 1, sugTotal))} من ${ar(sugTotal)}` : `${ar(sugTotal)} ذكرًا`}</div>
        </a>
        <a href={'#/quran/' + quran.lastPage} className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <BookMarked className="accent" size={24} aria-hidden="true" />
          <div className="h2" style={{ marginTop: 8 }}>تابع القراءة</div>
          <div className="xs muted">سورة {s.name} · صفحة {ar(quran.lastPage)}</div>
        </a>
      </div>

      <div className="card between">
        <div className="row"><Flame className="accent" size={24} aria-hidden="true" /><div><div className="h2">{streak ? `${ar(streak)} ${streak > 10 ? 'يومًا' : 'أيام'} متتالية` : 'ابدأ سلسلتك اليوم'}</div><div className="xs muted">أتمّ أذكار الصباح أو المساء كل يوم</div></div></div>
      </div>

      <nav className="grid4" aria-label="الأقسام">
        {TILES.map(({ to, label, Icon, soon }) => (
          <a key={to} href={'#' + to} className="tile">
            {soon && <span className="soon">قريبًا</span>}
            <span className="ic"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
            <span className="l">{label}</span>
          </a>
        ))}
      </nav>

      <div className="card center">
        <div className="xs muted">آية اليوم</div>
        <div className="amiri" style={{ fontSize: 22, lineHeight: 1.9, marginTop: 6 }}>﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾</div>
        <div className="xs muted">البقرة · ١٥٢</div>
      </div>

      <Credit />
    </div>
  );
}
