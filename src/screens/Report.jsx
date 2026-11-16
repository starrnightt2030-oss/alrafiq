import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStore } from '../store.js';
import { rangeKeys, summarize, grade, weekly, insights, dayName, dayShort, FARD } from '../lib/stats.js';
import { ar, arNum, daysAr, pagesAr } from '../lib/arabic.js';
import { TopBar, Ring } from '../components/ui.jsx';

const PERIODS = [{ n: 7, l: 'أسبوع' }, { n: 30, l: 'شهر' }, { n: 90, l: '٣ أشهر' }];
const COLORS = { jamaah: 'var(--acc)', ontime: 'color-mix(in srgb, var(--acc) 70%, var(--surf))', late: '#E3A14A', qada: '#B8707A' };

export default function Report() {
  const [pi, setPi] = useState(0);
  const { days, settings, firstDay, hifz } = useStore();
  const n = PERIODS[pi].n;
  const cur = useMemo(() => summarize(days, rangeKeys(n, 0, firstDay), settings.wirdGoal), [days, n, firstDay, settings.wirdGoal]);
  const prev = useMemo(() => summarize(days, rangeKeys(n, n, firstDay), settings.wirdGoal), [days, n, firstDay, settings.wirdGoal]);
  const delta = prev.n ? cur.score - prev.score : null;
  const notes = insights(cur);
  const bars = n === 7 ? cur.daily : weekly(cur.daily);
  const onTimeCount = cur.counts.ontime + cur.counts.jamaah;
  const hz = cur.daily.reduce((a, d) => { const l = hifz.log[d.k]; return l ? { n: a.n + l.new, r: a.r + l.rev } : a; }, { n: 0, r: 0 });

  return (
    <div className="screen no-nav">
      <TopBar title="تقييمي" sub={cur.n ? `آخر ${daysAr(cur.n)}` : ''} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 4, padding: 4, borderRadius: 16, background: 'var(--surf2)' }} role="tablist">
        {PERIODS.map((p, i) => <button key={p.n} role="tab" aria-selected={pi === i} onClick={() => setPi(i)} style={{ minHeight: 40, borderRadius: 12, border: 0, background: pi === i ? 'var(--surf)' : 'transparent', color: pi === i ? 'var(--acc)' : 'var(--muted)', fontWeight: pi === i ? 600 : 400, fontSize: 13 }}>{p.l}</button>)}
      </div>

      <motion.section key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="row" style={{ gap: 16, padding: 18, borderRadius: 26, background: 'var(--hero)', color: 'var(--heroText)' }}>
        <Ring size={104} value={cur.score / 100} label={`التقييم ${cur.score} من ١٠٠`}>
          <span className="num" style={{ fontSize: 30, color: 'var(--heroText)' }}>{ar(cur.score)}</span>
          <span className="xs" style={{ opacity: .85 }}>من ١٠٠</span>
        </Ring>
        <div className="col" style={{ gap: 4 }}>
          <span className="xs" style={{ opacity: .85 }}>تقييمك العام</span>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{grade(cur.score)}</span>
          {delta === null ? <span className="xs" style={{ opacity: .85 }}>ستظهر المقارنة بعد مرور فترة كاملة</span> : (
            <span className="row xs" style={{ gap: 4 }}>
              {delta > 0 ? <TrendingUp size={15} aria-hidden="true" /> : delta < 0 ? <TrendingDown size={15} aria-hidden="true" /> : <Minus size={15} aria-hidden="true" />}
              {delta > 0 ? `تقدّمت ${ar(delta)} نقطة عن الفترة السابقة` : delta < 0 ? `تراجعت ${ar(-delta)} نقطة عن الفترة السابقة` : 'على نفس مستوى الفترة السابقة'}
            </span>
          )}
        </div>
      </motion.section>

      <div className="grid2">
        {[
          ['الصلاة', cur.prayerRate, `${ar(onTimeCount)} في وقتها من ${ar(cur.n * 5)}`],
          ['الأذكار', cur.azkarRate, `صباح ${ar(cur.am)} · مساء ${ar(cur.pm)}`],
          ['الورد', cur.wirdRate, `${arNum(cur.wird)} ذكر`],
          ['القرآن', cur.quranRate, `${ar(cur.pages)} صفحة`],
        ].map(([t, v, s]) => (
          <div key={t} className="card col" style={{ gap: 6 }}>
            <div className="between"><span className="h2">{t}</span><span className="num accent" style={{ fontSize: 18 }}>{ar(Math.round((v || 0) * 100))}٪</span></div>
            <div className="bar"><i style={{ width: Math.round((v || 0) * 100) + '%' }} /></div>
            <span className="xs muted">{s}</span>
          </div>
        ))}
      </div>

      <a href="#/hifz" className="card between" style={{ textDecoration: 'none', color: 'var(--text)' }}>
        <span className="h2">حفظ القرآن</span>
        <span className="small muted">حفظ جديد: {hz.n ? pagesAr(hz.n) : 'لا شيء'} · مراجعة: {ar(hz.r)}</span>
      </a>

      <section className="card">
        <div className="between"><h2 className="h2">{n === 7 ? 'الصلوات يومًا بيوم' : 'الدرجة أسبوعًا بأسبوع'}</h2></div>
        <div style={{ marginTop: 14, height: 150, display: 'grid', gridTemplateColumns: `repeat(${Math.max(bars.length, 1)}, minmax(0,1fr))`, gap: n === 7 ? 10 : 6, alignItems: 'end' }}>
          {bars.map((d) => (
            <div key={d.k} className="col" style={{ alignItems: 'center', gap: 6 }}>
              {n === 7 ? (
                <div style={{ width: '100%', height: 120, display: 'flex', flexDirection: 'column-reverse', gap: 2 }} role="img" aria-label={`${dayName(d.k)}: ${Object.keys(d.prayers).length} صلوات مسجّلة`}>
                  {FARD.map((p) => { const st = d.prayers[p.key]; return <div key={p.key} style={{ height: 22, borderRadius: 5, background: st ? COLORS[st] : 'var(--surf2)' }} />; })}
                </div>
              ) : (
                <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'flex-end' }} role="img" aria-label={`أسبوع ${d.k}: ${d.score}٪`}>
                  <div style={{ width: '100%', height: Math.max(4, d.score * 1.2), borderRadius: 6, background: 'var(--acc)' }} />
                </div>
              )}
              <span className="xs muted" style={{ fontSize: 10 }}>{n === 7 ? dayShort(d.k) : ar(+d.k.slice(8)) + '/' + ar(+d.k.slice(5, 7))}</span>
            </div>
          ))}
        </div>
        {n === 7 && (
          <div className="row xs" style={{ marginTop: 10, gap: 12, flexWrap: 'wrap', color: 'var(--muted)' }}>
            {[['jamaah', 'جماعة'], ['ontime', 'في وقتها'], ['late', 'متأخرة'], ['qada', 'قضاء']].map(([k, l]) => <span key={k} className="row" style={{ gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[k] }} />{l}</span>)}
            <span className="row" style={{ gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surf2)', border: '1px solid var(--line)' }} />لم تُسجَّل</span>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="h2">انتظام كل صلاة في وقتها</h2>
        <div className="col" style={{ gap: 10, marginTop: 12 }}>
          {FARD.map((p) => { const r = cur.n ? cur.perPrayer[p.key].on / cur.n : 0; return (
            <div key={p.key} className="col" style={{ gap: 4 }}>
              <div className="between small"><span>{p.name}</span><span className="muted">{ar(cur.perPrayer[p.key].on)} من {ar(cur.n)}</span></div>
              <div className="bar"><i style={{ width: r * 100 + '%' }} /></div>
            </div>
          ); })}
        </div>
      </section>

      {n === 7 && (
        <section className="card">
          <h2 className="h2">الأذكار</h2>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: `52px repeat(${cur.daily.length}, minmax(0,1fr))`, gap: 6, alignItems: 'center' }} className="xs muted">
            <span />
            {cur.daily.map((d) => <span key={d.k} className="center" style={{ fontSize: 10 }}>{dayShort(d.k)}</span>)}
            <span>الصباح</span>{cur.daily.map((d) => <span key={d.k} style={{ height: 24, borderRadius: 7, background: d.am ? 'var(--acc)' : 'var(--surf2)' }} />)}
            <span>المساء</span>{cur.daily.map((d) => <span key={d.k} style={{ height: 24, borderRadius: 7, background: d.pm ? 'var(--acc)' : 'var(--surf2)' }} />)}
          </div>
        </section>
      )}

      <section className="card col" style={{ gap: 10 }}>
        <h2 className="h2">ملاحظات الرفيق</h2>
        {notes.map((x, i) => (
          <div key={i} className="row small" style={{ alignItems: 'flex-start', lineHeight: 1.8 }}>
            <span style={{ flex: 'none', width: 8, height: 8, marginTop: 9, borderRadius: '50%', background: x.good ? 'var(--acc)' : '#E3A14A' }} />{ar(x.t)}
          </div>
        ))}
      </section>
    </div>
  );
}
