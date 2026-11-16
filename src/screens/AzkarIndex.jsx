import { Sunrise, Sunset, Moon, AlarmClock, HandHeart, ShieldCheck, CircleDot, ChevronLeft } from 'lucide-react';
import { useStore } from '../store.js';
import { AZKAR } from '../data/azkar.js';
import { RUQYAH } from '../data/ruqyah.js';
import { ar, todayKey } from '../lib/arabic.js';
import { Ring } from '../components/ui.jsx';

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
  return (
    <div className="screen">
      <h1 className="title center">الأذكار</h1>
      {SESSIONS.map(({ id, title, hint, items, Icon, repeatable }) => {
        const st = d[id]; const n = items.length;
        const v = st?.done ? 1 : st ? st.i / n : 0;
        return (
          <a key={id} href={'#/azkar/' + id} className="card row" style={{ textDecoration: 'none', color: 'var(--text)', gap: 14 }}>
            <Ring size={66} stroke={8} value={v} label={`${title}: ${Math.round(v * 100)}٪`}><Icon size={22} className="accent" aria-hidden="true" /></Ring>
            <div style={{ flex: 1 }}>
              <div className="h2">{title}</div>
              <div className="xs muted">{hint} · {ar(n)} {n > 10 ? 'ذكرًا' : 'أذكار'}</div>
              <div className="xs accent" style={{ marginTop: 4 }}>{st?.done ? (repeatable ? 'قرأتها اليوم ✓ — تُكرَّر بعد كل صلاة' : 'أتممتها اليوم ✓') : st ? `توقفت عند ${ar(Math.min(st.i + 1, n))}` : 'لم تبدأ بعد'}</div>
            </div>
            <ChevronLeft size={20} className="muted" aria-hidden="true" />
          </a>
        );
      })}
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
