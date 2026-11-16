// شاشة القبلة: بوصلة حيّة تدور مع الجهاز، وتتوهّج عند مواجهة الكعبة
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, LocateFixed, Compass, Smartphone } from 'lucide-react';
import { useStore } from '../store.js';
import { TopBar, Pattern, toast } from '../components/ui.jsx';
import { resolveLocation } from '../lib/prayer.js';
import { qiblaBearing, distanceKm, dirName, watchHeading, needsPermission, askCompass } from '../lib/qibla.js';
import { locate } from '../lib/locate.js';
import { ar, arNum } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';

const TOL = 4;

export default function Qibla() {
  const loc = useStore((s) => s.settings.location);
  const setSetting = useStore((s) => s.setSetting);
  const place = resolveLocation(loc);
  const bearing = qiblaBearing(place.lat, place.lng);
  const km = Math.round(distanceKm(place.lat, place.lng));
  const [heading, setHeading] = useState(null);
  const [state, setState] = useState('wait');
  const [run, setRun] = useState(0);
  const [busy, setBusy] = useState(false);
  const smooth = useRef(null); const aligned = useRef(false);

  const start = () => {
    const w = watchHeading((h) => {
      // تنعيم القراءة لتفادي الارتعاش مع مراعاة الالتفاف عند ٣٦٠
      const p = smooth.current; if (p == null) smooth.current = h; else { const d = ((h - p + 540) % 360) - 180; smooth.current = (p + d * 0.25 + 360) % 360; }
      setHeading(smooth.current);
    });
    // بعض المتصفحات (آيفون) تحتاج إذنًا صريحًا؛ نطلبه فقط لو لم تصل أي قراءة
    const t = setTimeout(() => { if (!w.got()) setState(needsPermission() && !run ? 'ask' : 'none'); }, 2000);
    return () => { clearTimeout(t); w.stop(); };
  };
  useEffect(() => start(), [run]);

  const diff = heading == null ? null : ((bearing - heading + 540) % 360) - 180;
  const ok = diff != null && Math.abs(diff) <= TOL;
  useEffect(() => {
    if (ok && !aligned.current) { aligned.current = true; vibrate([30, 40, 60]); sound.correct(); }
    if (diff != null && Math.abs(diff) > TOL + 4) aligned.current = false;
  }, [ok, diff]);

  const allow = async () => { if (await askCompass()) { setState('wait'); setRun((r) => r + 1); } else { setState('none'); toast('اسمح بالوصول للحساسات من إعدادات المتصفح'); } };
  const gps = async () => {
    setBusy(true);
    try { const l = await locate(); setSetting('location', l); const p = resolveLocation(l); toast('تم تحديث موقعك: ' + p.name); }
    catch (e) { toast(e.message || 'تعذّر تحديد الموقع'); } finally { setBusy(false); }
  };

  const rot = heading == null ? 0 : -heading;
  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title="اتجاه القبلة" sub={`${place.name} — ${arNum(km)} كم عن مكة المكرمة`} fallback="/prayer" />

      <div className={'qibla' + (ok ? ' ok' : '')}>
        <motion.div className="qibla-dial" animate={{ rotate: rot }} transition={{ type: 'tween', duration: .15 }}>
          {[...Array(72)].map((_, i) => <i key={i} className={i % 18 === 0 ? 'big' : i % 2 ? '' : 'mid'} style={{ transform: `rotate(${i * 5}deg)` }} />)}
          {[['ش', 0], ['ق', 90], ['ج', 180], ['غ', 270]].map(([l, a]) => <b key={l} style={{ transform: `rotate(${a}deg) translateY(-118px) rotate(${-a}deg)` }} className={l === 'ش' ? 'n' : ''}>{l}</b>)}
          <div className="qibla-arrow" style={{ transform: `rotate(${bearing}deg)` }}>
            <span className="qa-line" />
            <span className="qa-kaaba" style={{ transform: `rotate(${-bearing - rot}deg)` }}><svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><path d="M8 13l12-6 12 6v17l-12 5-12-5z" fill="#111" stroke="#D9B55A" strokeWidth="1.6" /><path d="M8 17l12 5 12-5" stroke="#D9B55A" strokeWidth="2.4" fill="none" /></svg></span>
          </div>
        </motion.div>
        <div className="qibla-top" aria-hidden="true" />
        <div className="qibla-center num">{heading == null ? '—' : ar(Math.round(heading)) + '°'}</div>
      </div>

      <motion.div className="card center col" style={{ gap: 6 }} animate={{ borderColor: ok ? '#5FC59A' : 'var(--line)' }}>
        {state === 'ask' && heading == null ? (
          <><div className="small">محتاجين إذنك علشان نقرأ بوصلة الموبايل</div><button className="btn" onClick={allow}><Compass size={18} /> تفعيل البوصلة</button></>
        ) : state === 'none' && heading == null ? (
          <><div className="h2">الجهاز ده مفيهوش بوصلة متاحة</div>
            <div className="small muted" style={{ lineHeight: 1.9 }}>القبلة عندك على زاوية <b className="accent">{ar(Math.round(bearing))}°</b> من الشمال باتجاه {dirName(bearing)}. افتح الصفحة من الموبايل أو استخدم أي بوصلة واتجه للزاوية دي.</div></>
        ) : ok ? (
          <><div className="h2" style={{ color: '#5FC59A' }}>أنت الآن في اتجاه القبلة</div><div className="small muted">تقبّل الله صلاتك</div></>
        ) : (
          <><div className="h2">{diff == null ? 'جارٍ قراءة البوصلة…' : diff > 0 ? `لفّ يمينك ${ar(Math.round(Math.abs(diff)))}°` : `لفّ شمالك ${ar(Math.round(Math.abs(diff)))}°`}</div>
            <div className="small muted">القبلة على {ar(Math.round(bearing))}° من الشمال ({dirName(bearing)})</div></>
        )}
      </motion.div>

      <div className="card col" style={{ gap: 10 }}>
        <div className="row small"><Smartphone size={18} className="accent" style={{ flex: "none" }} />خلّي الموبايل مسطّح وبعيد عن المعادن والمغناطيس. لو الاتجاه مش مظبوط حرّك الموبايل على شكل رقم ٨ في الهوا كام مرة.</div>
        <div className="between"><span className="row small"><MapPin size={16} className="accent" />{place.country ? place.country + ' — ' : ''}{place.name}</span>
          <button className="btn soft" style={{ minHeight: 40 }} onClick={gps} disabled={busy}><LocateFixed size={16} /> {busy ? 'جارٍ…' : 'موقعي'}</button></div>
      </div>
    </div>
  );
}
