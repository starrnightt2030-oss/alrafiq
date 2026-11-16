import { useState } from 'react';
import { MapPin, LocateFixed, BellRing } from 'lucide-react';
import { useStore } from '../store.js';
import { CITIES, METHODS } from '../data/cities.js';
import { resolveLocation, timesFor, nextPrayer, fmtTime, countdown } from '../lib/prayer.js';
import { ar, hijri, gregorian } from '../lib/arabic.js';
import { useNow } from '../hooks.js';
import { toast } from '../components/ui.jsx';

const countries = [...new Set(CITIES.map((c) => c.country))];

export default function Prayer() {
  const now = useNow(1000);
  const loc = useStore((s) => s.settings.location);
  const setSetting = useStore((s) => s.setSetting);
  const [busy, setBusy] = useState(false);
  const place = resolveLocation(loc);
  const list = timesFor(place, now);
  const next = nextPrayer(place, now);

  const gps = () => {
    if (!navigator.geolocation) return toast('الموقع غير مدعوم على هذا الجهاز');
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); setSetting('location', { mode: 'gps', lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4), method: loc.method || 'Egyptian' }); toast('تم تحديد موقعك'); },
      () => { setBusy(false); toast('لم نتمكن من تحديد موقعك — اختر مدينتك من القائمة'); },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 3600000 }
    );
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

      <div className="col" style={{ gap: 8 }}>
        {list.map((p) => {
          const isNext = p.key === next.key && next.time.toDateString() === now.toDateString();
          const past = p.time < now;
          return (
            <div key={p.key} className={'card between' + (isNext ? ' hl' : '')} style={{ padding: '14px 16px', opacity: past && !isNext ? .72 : 1 }}>
              <div className="row"><span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>{isNext && <span className="xs" style={{ padding: '3px 9px', borderRadius: 999, background: 'var(--acc)', color: 'var(--onAcc)' }}>القادمة</span>}</div>
              <span style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(p.time, place.tz)}</span>
            </div>
          );
        })}
      </div>

      <section className="card col" style={{ gap: 12 }}>
        <div className="h2">الموقع وطريقة الحساب</div>
        <label className="col" style={{ gap: 6 }}>
          <span className="xs muted">الدولة والمحافظة / المدينة</span>
          <select className="sel" value={loc.mode === 'gps' ? 'gps' : loc.id} onChange={(e) => { if (e.target.value === 'gps') gps(); else setSetting('location', { mode: 'city', id: e.target.value }); }}>
            {loc.mode === 'gps' && <option value="gps">موقعي الحالي</option>}
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
        <div className="xs muted">طريقة الحساب الحالية: {METHODS[place.method] || place.method}</div>
      </section>

      <div className="card row xs muted" style={{ lineHeight: 1.8 }}><BellRing size={18} className="accent" style={{ flex: 'none' }} aria-hidden="true" />تسجيل الصلوات وتقييم الالتزام بمواعيدها في المرحلة القادمة بإذن الله.</div>
    </div>
  );
}
