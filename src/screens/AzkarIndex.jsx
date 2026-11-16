import { Sunrise, Sunset, ChevronLeft } from 'lucide-react';
import { useStore } from '../store.js';
import { AZKAR } from '../data/azkar.js';
import { ar, todayKey } from '../lib/arabic.js';
import { Ring } from '../components/ui.jsx';

export default function AzkarIndex() {
  const days = useStore((s) => s.days);
  const d = days[todayKey()]?.azkar || {};
  const rows = [{ ...AZKAR.morning, Icon: Sunrise }, { ...AZKAR.evening, Icon: Sunset }];
  return (
    <div className="screen">
      <h1 className="title center">الأذكار</h1>
      {rows.map(({ id, title, hint, items, Icon }) => {
        const st = d[id]; const n = items.length;
        const v = st?.done ? 1 : st ? st.i / n : 0;
        return (
          <a key={id} href={'#/azkar/' + id} className="card row" style={{ textDecoration: 'none', color: 'var(--text)', gap: 14 }}>
            <Ring size={72} stroke={8} value={v} label={`${title}: ${Math.round(v * 100)}٪`}><Icon size={24} className="accent" aria-hidden="true" /></Ring>
            <div style={{ flex: 1 }}>
              <div className="h2">{title}</div>
              <div className="xs muted">{hint} · {ar(n)} ذكرًا</div>
              <div className="xs accent" style={{ marginTop: 4 }}>{st?.done ? 'أتممتها اليوم ✓' : st ? `توقفت عند ${ar(st.i + 1)}` : 'لم تبدأ بعد'}</div>
            </div>
            <ChevronLeft size={20} className="muted" aria-hidden="true" />
          </a>
        );
      })}
      <a href="#/wird" className="card row" style={{ textDecoration: 'none', color: 'var(--text)' }}>
        <div style={{ flex: 1 }}><div className="h2">الورد اليومي والسبحة</div><div className="xs muted">الاستغفار والتسبيح والحوقلة والصلاة على النبي ﷺ وغيرها</div></div>
        <ChevronLeft size={20} className="muted" aria-hidden="true" />
      </a>
      <div className="card xs muted" style={{ lineHeight: 1.9 }}>
        <b className="accent">قريبًا: </b>أذكار النوم، والاستيقاظ، وبعد الصلاة، والأدعية القرآنية، والرقية الشرعية.
      </div>
    </div>
  );
}
