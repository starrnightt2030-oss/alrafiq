import { useMemo, useState } from 'react';
import { Sunrise, Sunset, Moon, AlarmClock, HandHeart, ShieldCheck, CircleDot, ChevronLeft, Search, DoorOpen, Droplets, Megaphone, Landmark, PersonStanding, Compass, Shirt, House, Utensils, Heart, Car, CloudRain, Smile, Users, Star, RefreshCcw, HeartPulse, Flower2 } from 'lucide-react';
import { HISN_GROUPS, HISN_COUNT } from '../data/hisn.js';
import { useStore } from '../store.js';
import { AZKAR } from '../data/azkar.js';
import { RUQYAH } from '../data/ruqyah.js';
import { ar, todayKey, azkarAr } from '../lib/arabic.js';
import { Ring } from '../components/ui.jsx';

const HICONS = { door: DoorOpen, drop: Droplets, megaphone: Megaphone, mosque: Landmark, prayer: PersonStanding, compass: Compass, shirt: Shirt, home: House, utensils: Utensils, heart: Heart, car: Car, cloud: CloudRain, smile: Smile, users: Users, shield: ShieldCheck, star: Star, refresh: RefreshCcw, 'heart-pulse': HeartPulse, flower: Flower2 };
const strip = (s) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

const SESSIONS = [
  { ...AZKAR.morning, Icon: Sunrise },
  { ...AZKAR.evening, Icon: Sunset },
  { ...AZKAR.prayer, Icon: HandHeart },
  { ...AZKAR.sleep, Icon: Moon },
  { ...AZKAR.waking, Icon: AlarmClock },
];

export default function AzkarIndex() {
  const days = useStore((s) => s.days);
  const d = days[todayKey()]?.azkar || {};
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const k = strip(q.trim()); if (!k) return HISN_GROUPS;
    return HISN_GROUPS.map((g) => ({ ...g, cats: g.cats.filter((c) => strip(c.title + ' ' + c.items.map((i) => i.title + ' ' + i.text).join(' ')).includes(k)) })).filter((g) => g.cats.length);
  }, [q]);
  return (
    <div className="screen">
      <h1 className="title center">حصن المسلم</h1>
      <label className="card row" style={{ padding: '0 14px', minHeight: 48 }}>
        <Search size={18} className="muted" aria-hidden="true" /><span className="sr">ابحث في الأذكار</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: سفر، مطر، طعام، مريض، مسجد…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 46 }} />
      </label>
      {!q && <h2 className="h2">أذكار اليوم والليلة</h2>}
      {!q && SESSIONS.map(({ id, title, hint, items, Icon, repeatable }) => {
        const st = d[id]; const n = items.length;
        const v = st?.done ? 1 : st ? st.i / n : 0;
        return (
          <a key={id} href={'#/azkar/' + id} className="card row" style={{ textDecoration: 'none', color: 'var(--text)', gap: 14 }}>
            <Ring size={66} stroke={8} value={v} label={`${title}: ${Math.round(v * 100)}٪`}><Icon size={22} className="accent" aria-hidden="true" /></Ring>
            <div style={{ flex: 1 }}>
              <div className="h2">{title}</div>
              <div className="xs muted">{hint} · {azkarAr(n)}</div>
              <div className="xs accent" style={{ marginTop: 4 }}>{st?.done ? (repeatable ? 'قرأتها اليوم ✓ — تُكرَّر بعد كل صلاة' : 'أتممتها اليوم ✓') : st ? `توقفت عند ${ar(Math.min(st.i + 1, n))}` : 'لم تبدأ بعد'}</div>
            </div>
            <ChevronLeft size={20} className="muted" aria-hidden="true" />
          </a>
        );
      })}
      {groups.map((g) => (
        <section key={g.id} className="col" style={{ gap: 10 }}>
          <h2 className="h2">{g.title}</h2>
          <div className="grid2">
            {g.cats.map((c) => { const I = HICONS[c.icon] || Star; const st = d['hisn-' + c.id]; return (
              <a key={c.id} href={'#/hisn/' + c.id} className="card col" style={{ textDecoration: 'none', color: 'var(--text)', gap: 8, padding: 14, minHeight: 104, justifyContent: 'space-between' }}>
                <span className="between"><span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surf2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I size={19} className="accent" aria-hidden="true" /></span>{st?.done && <span className="xs accent">✓</span>}</span>
                <span><span className="small" style={{ fontWeight: 600, lineHeight: 1.5, display: 'block' }}>{c.title}</span><span className="xs muted">{azkarAr(c.items.length)}</span></span>
              </a>
            ); })}
          </div>
        </section>
      ))}
      {q && !groups.length && <div className="card center small muted">لا نتائج — جرّب كلمة أخرى.</div>}
      {!q && <div className="xs muted center">{ar(HISN_COUNT)} ذكرًا في المناسبات، بالإضافة إلى أذكار اليوم والليلة</div>}

      <div className="grid2">
        <a href="#/ruqyah" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <ShieldCheck size={24} className="accent" aria-hidden="true" />
          <div className="h2" style={{ marginTop: 8 }}>الرقية الشرعية</div>
          <div className="xs muted">{ar(RUQYAH.items.length)} موضعًا من القرآن والسنة</div>
        </a>
        <a href="#/wird" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <CircleDot size={24} className="accent" aria-hidden="true" />
          <div className="h2" style={{ marginTop: 8 }}>الورد اليومي</div>
          <div className="xs muted">السبحة والأوسمة</div>
        </a>
      </div>
      <a href="#/duas" className="card row" style={{ textDecoration: 'none', color: 'var(--text)' }}>
        <HandHeart size={24} className="accent" aria-hidden="true" />
        <div style={{ flex: 1 }}><div className="h2">الأدعية</div><div className="xs muted">أدعية القرآن الكريم وأدعية تفريج الكرب من السنة</div></div>
        <ChevronLeft size={20} className="muted" aria-hidden="true" />
      </a>
    </div>
  );
}
