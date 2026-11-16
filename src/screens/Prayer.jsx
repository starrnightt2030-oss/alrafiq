import { useState } from 'react';
import { MapPin, LocateFixed, BellRing, Compass, ChevronLeft } from 'lucide-react';
import { qiblaBearing, dirName } from '../lib/qibla.js';
import { useStore } from '../store.js';
import { CITIES, METHODS } from '../data/cities.js';
import { resolveLocation, timesFor, nextPrayer, fmtTime, countdown } from '../lib/prayer.js';
import { ar, hijri, gregorian } from '../lib/arabic.js';
import { useNow } from '../hooks.js';
import { toast } from '../components/ui.jsx';
import { locate } from '../lib/locate.js';
import { STATUS, STATUS_ORDER } from '../lib/stats.js';
import { todayKey } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';

const countries = [...new Set(CITIES.map((c) => c.country))];
const EMPTY = {};

export default function Prayer() {
  const now = useNow(1000);
  const loc = useStore((s) => s.settings.location);
  const setSetting = useStore((s) => s.setSetting);
  const [busy, setBusy] = useState(false);
  const [dayOff, setDayOff] = useState(0); // 0 اليوم، 1 أمس
  const logDate = new Date(now); logDate.setDate(logDate.getDate() - dayOff);
  const logKey = todayKey(logDate);
  const logged = useStore((s) => s.days[logKey]?.prayers) || EMPTY;
  const setPrayer = useStore((s) => s.setPrayer);
  const mark = (key, st) => { setPrayer(key, st, logKey); vibrate(12); if (logged[key] !== st) sound.tap(); };
  const place = resolveLocation(loc);
  const list = timesFor(place, now);
  const next = nextPrayer(place, now);

  const gps = async () => {
    setBusy(true);
    try {
      const l = await locate();
      setSetting('location', l);
      const p = resolveLocation(l);
      toast(`تم تحديد موقعك: ${p.country ? p.country + ' · ' : ''}${p.name}`);
    } catch (e) { toast(e.message || 'تعذّر تحديد الموقع — اختر محافظتك من القائمة'); }
    finally { setBusy(false); }
  };

  return (
    <div className="screen">
      <h1 className="title center">مواقيت الصلاة</h1>

      <section style={{ borderRadius: 28, padding: 20, background: 'var(--hero)', color: 'var(--heroText)', position: 'relative', overflow: 'hidden' }}>
        <div className="xs" style={{ opacity: .85 }}>{gregorian(now)} · {hijri(now)}</div>
        <div className="between" style={{ marginTop: 10, alignItems: 'flex-end' }}>
          <div>
            <div className="small" style={{ opacity: .9 }}>يحين أذان {next.name} بعد</div>
            <div className="ltr num" style={{ fontSize: 42, lineHeight: 1.3 }}>{ar(countdown(next.time - now))}</div>
          </div>
          <div className="center"><div className="ruqaa" style={{ fontSize: 30 }}>{next.name}</div><div className="small">{fmtTime(next.time, place.tz)}</div></div>
        </div>
        <div className="row xs" style={{ marginTop: 12, opacity: .9 }}><MapPin size={14} aria-hidden="true" />{place.country ? place.country + ' · ' : ''}{place.name}</div>
      </section>

      <a href="#/qibla" className="card row" style={{ textDecoration: 'none', color: 'var(--text)', gap: 12 }}>
        <span className="bp-ic" style={{ width: 44, height: 44, borderRadius: 14 }}><Compass size={22} /></span>
        <span className="col" style={{ flex: 1, gap: 2 }}><b>اتجاه القبلة</b><span className="xs muted">{ar(Math.round(qiblaBearing(place.lat, place.lng)))}° من الشمال — {dirName(qiblaBearing(place.lat, place.lng))}</span></span>
        <ChevronLeft size={18} className="muted" />
      </a>

      <div className="between">
        <h2 className="h2">صلواتك وسجلّك</h2>
        <div className="row" style={{ gap: 4, padding: 3, borderRadius: 12, background: 'var(--surf2)' }} role="tablist" aria-label="يوم التسجيل">
          {['اليوم', 'أمس'].map((l, i) => <button key={l} role="tab" aria-selected={dayOff === i} onClick={() => setDayOff(i)} style={{ minHeight: 34, padding: '0 14px', borderRadius: 10, border: 0, fontSize: 12, background: dayOff === i ? 'var(--surf)' : 'transparent', color: dayOff === i ? 'var(--acc)' : 'var(--muted)', fontWeight: dayOff === i ? 600 : 400 }}>{l}</button>)}
        </div>
      </div>

      <div className="col" style={{ gap: 8 }}>
        {(dayOff ? timesFor(place, logDate) : list).map((p) => {
          const isNext = !dayOff && p.key === next.key && next.time.toDateString() === now.toDateString();
          const past = dayOff || p.time < now;
          const st = logged[p.key];
          return (
            <div key={p.key} className={'card col' + (isNext ? ' hl' : '')} style={{ padding: '12px 14px', gap: 10, opacity: p.info ? .75 : 1 }}>
              <div className="between">
                <div className="row"><span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                  {isNext && <span className="xs" style={{ padding: '3px 9px', borderRadius: 999, background: 'var(--acc)', color: 'var(--onAcc)' }}>القادمة</span>}
                  {st && <span className="xs accent">✓ {STATUS[st].name}</span>}
                </div>
                <span style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(p.time, place.tz)}</span>
              </div>
              {!p.info && past && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }} role="group" aria-label={'كيف أدّيت صلاة ' + p.name}>
                  {STATUS_ORDER.map((k) => (
                    <button key={k} aria-pressed={st === k} onClick={() => mark(p.key, k)} style={{ minHeight: 38, borderRadius: 12, fontSize: 12, border: '1px solid ' + (st === k ? 'var(--acc)' : 'var(--line)'), background: st === k ? 'var(--acc)' : 'transparent', color: st === k ? 'var(--onAcc)' : 'var(--text)', fontWeight: st === k ? 600 : 400 }}>{STATUS[k].name}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="card col" style={{ gap: 12 }}>
        <div className="h2">الموقع وطريقة الحساب</div>
        <label className="col" style={{ gap: 6 }}>
          <span className="xs muted">الدولة والمحافظة / المدينة</span>
          <select className="sel" value={loc.mode === 'gps' ? 'gps' : loc.id} onChange={(e) => { if (e.target.value === 'gps') gps(); else setSetting('location', { mode: 'city', id: e.target.value }); }}>
            {loc.mode === 'gps' && <option value="gps">{'موقعي: ' + place.name}</option>}
            {countries.map((c) => (
              <optgroup key={c} label={c}>{CITIES.filter((x) => x.country === c).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
            ))}
          </select>
        </label>
        <button className="btn ghost" onClick={gps} disabled={busy}><LocateFixed size={18} />{busy ? 'جارٍ تحديد الموقع…' : 'استخدم موقعي الحالي'}</button>
        {loc.mode === 'gps' && (
          <label className="col" style={{ gap: 6 }}>
            <span className="xs muted">طريقة الحساب</span>
            <select className="sel" value={loc.method || 'Egyptian'} onChange={(e) => setSetting('location', { ...loc, method: e.target.value })}>
              {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        )}
        {loc.mode === 'gps' && <div className="xs muted" style={{ lineHeight: 1.8 }}>الإحداثيات: <span className="ltr">{loc.lat}, {loc.lng}</span>{loc.acc ? ` · الدقة نحو ${ar(loc.acc)} متر` : ''}</div>}
        <div className="xs muted">طريقة الحساب الحالية: {METHODS[place.method] || place.method}</div>
      </section>

      <a href="#/report" className="card row small" style={{ textDecoration: 'none', color: 'var(--text)' }}><BellRing size={18} className="accent" style={{ flex: 'none' }} aria-hidden="true" />اطّلع على تقييمك الأسبوعي والشهري</a>
    </div>
  );
}
