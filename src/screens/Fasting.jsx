// الصيام ورمضان: تسجيل الصيام، أيام السنن القادمة بفضلها، تقويم الشهر، ووضع رمضان (الإمساكية، عدّاد الإفطار، الختمة، العشر الأواخر)
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Check, CalendarDays, BookOpen, Sparkles, ChevronLeft, ChevronRight, Bell, Utensils, Star } from 'lucide-react';
import { useStore } from '../store.js';
import { TopBar, Pattern, toast } from '../components/ui.jsx';
import TileArt from '../components/TileArt.jsx';
import { useNow } from '../hooks.js';
import { ar, arNum, todayKey, daysAr } from '../lib/arabic.js';
import { fmtTime, countdown, resolveLocation } from '../lib/prayer.js';
import { hijriParts, HMONTHS, sunnahOf, upcoming, ramadanDays, imsakiya, khatmaPortion, addDays } from '../lib/fasting.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';
import { pagesAr } from '../lib/arabic.js';

const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const dShort = (d) => new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(d);
const hShort = (d) => { const h = hijriParts(d); return `${ar(h.d)} ${HMONTHS[h.m - 1]}`; };
const TAG = { arafah: '#E2A92B', ashura: '#E0507A', tasua: '#E0507A', white: '#2F7BEA', monthu: '#1FA36A', shawwal: '#8B5CF6', dhul: '#E2A92B', muharram: '#F07A2A' };

export default function Fasting() {
  const now = useNow(1000);
  const loc = useStore((s) => s.settings.location);
  const fasts = useStore((s) => s.fasts) || {};
  const toggleFast = useStore((s) => s.toggleFast);
  const khatma = useStore((s) => s.settings.khatma) || 1;
  const setSetting = useStore((s) => s.setSetting);
  const place = resolveLocation(loc);
  const h = hijriParts(now);
  const inRamadan = h.m === 9;
  const rDays = useMemo(() => ramadanDays(now), [todayKey(now)]); // eslint-disable-line
  const table = useMemo(() => imsakiya(loc, rDays), [rDays, loc]);
  const tk = todayKey(now); const today = sunnahOf(now);
  const fasted = !!fasts[tk];
  const next = useMemo(() => upcoming(10, addDays(now, 1)), [tk]); // eslint-disable-line
  const [showTable, setShowTable] = useState(false);
  const toRamadan = rDays.length ? Math.ceil((rDays[0] - now) / 864e5) : null;
  const rIdx = inRamadan ? h.d : 0;
  const row = table[rIdx - 1];

  const mark = () => { toggleFast(tk, today?.k || 'nafl'); if (!fasted) { sound.milestone(); vibrate([20, 40, 60]); toast('تقبّل الله صيامك — +٢٠ نقطة'); } else vibrate(8); };

  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title="الصيام ورمضان" sub={`${ar(h.d)} ${HMONTHS[h.m - 1]} ${ar(h.y)} هـ`} fallback="/" />

      {inRamadan && row ? <RamadanHero now={now} row={row} day={rIdx} total={table.length} tz={place.tz} /> : <CountdownHero days={toRamadan} first={rDays[0]} />}

      <motion.section className={'card col fs-today' + (fasted ? ' on' : '')} style={{ gap: 10 }} layout>
        <div className="row" style={{ gap: 12 }}>
          <TileArt id="fasting" size={64} />
          <div className="col" style={{ flex: 1, gap: 2 }}>
            <b className="h2">{today?.haram ? today.name : today ? `النهارده: ${today.name}` : 'صيام تطوّع'}</b>
            <span className="xs muted" style={{ lineHeight: 1.8 }}>{today?.fadl || (today?.fard ? 'فرض على كل مسلم بالغ قادر' : today?.haram ? 'لا يجوز الصيام في هذا اليوم' : '«من صام يومًا في سبيل الله باعد الله وجهه عن النار سبعين خريفًا» — متفق عليه')}</span>
          </div>
        </div>
        {!today?.haram && <motion.button whileTap={{ scale: .97 }} className={'btn ' + (fasted ? 'soft' : 'q-go')} onClick={mark}>{fasted ? <><Check size={18} /> صايم النهارده — تقبّل الله</> : <><Moon size={18} /> صايم النهارده؟ سجّل صيامك</>}</motion.button>}
      </motion.section>

      {(inRamadan || (toRamadan !== null && toRamadan <= 60)) && <Khatma inRamadan={inRamadan} day={rIdx} total={table.length || 30} times={khatma} setTimes={(t) => setSetting('khatma', t)} />}
      {inRamadan && rIdx >= 20 && <LastTen day={rIdx} />}

      {table.length > 0 && (
        <section className="card col" style={{ gap: 10 }}>
          <button className="between" style={{ background: 'none', border: 0, color: 'var(--text)', font: 'inherit', padding: 0 }} onClick={() => setShowTable(!showTable)}>
            <span className="row h2"><CalendarDays size={18} className="accent" /> إمساكية رمضان {ar(hijriParts(table[0].date).y)} — {place.name}</span>
            <span className="xs accent">{showTable ? 'إخفاء' : 'عرض'}</span>
          </button>
          <AnimatePresence>{showTable && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div className="fs-table" role="table">
                <div className="fs-tr fs-th" role="row"><span>اليوم</span><span>التاريخ</span><span>الإمساك</span><span>الفجر</span><span>المغرب</span></div>
                {table.map((r) => (
                  <div key={r.n} role="row" className={'fs-tr' + (r.n === rIdx ? ' now' : '') + (fasts[todayKey(r.date)] ? ' done' : '')}>
                    <span><b>{ar(r.n)}</b> {WD[r.date.getDay()].replace('ال', '')}</span><span>{dShort(r.date)}</span><span className="num">{fmtTime(r.imsak, place.tz)}</span><span className="num">{fmtTime(r.fajr, place.tz)}</span><span className="num">{fmtTime(r.maghrib, place.tz)}</span>
                  </div>
                ))}
              </div>
              <div className="xs muted" style={{ marginTop: 8 }}>الإمساك قبل الفجر بعشر دقائق للاحتياط، والصيام يبدأ بأذان الفجر.</div>
            </motion.div>
          )}</AnimatePresence>
        </section>
      )}

      <section className="col" style={{ gap: 10 }}>
        <div className="h2 row"><Sparkles size={18} className="accent" /> أيام صيام مستحبة قادمة</div>
        {next.map((x, i) => (
          <motion.div key={x.key} className="fs-next" style={{ '--c': TAG[x.k] || 'var(--acc)' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}>
            <div className="fs-date"><b>{ar(x.date.getDate())}</b><span>{WD[x.date.getDay()]}</span></div>
            <div className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <b className="small">{x.name}{x.big ? ' ⭐' : ''}</b>
              <span className="xs muted">{x.count > 1 ? `من ${hShort(x.date)} لـ ${hShort(x.end)} (${daysAr(x.count)})` : hShort(x.date)} — {inDays(x.date, now)}</span>
              {x.big && <span className="xs" style={{ color: 'var(--c)' }}>{x.fadl}</span>}
            </div>
          </motion.div>
        ))}
        <div className="xs muted row" style={{ gap: 6 }}><Bell size={13} /> الرفيق هيفكّرك بالليل قبل كل يوم صيام مستحب.</div>
      </section>

      <MonthCal fasts={fasts} now={now} />

      <section className="card col" style={{ gap: 8 }}>
        <div className="row h2"><Utensils size={18} className="accent" /> دعاء الإفطار</div>
        <div className="amiri" style={{ fontSize: 21, lineHeight: 2, textAlign: 'center' }}>ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ</div>
        <div className="xs muted center">رواه أبو داود — وحسّنه الألباني. و«للصائم عند فطره دعوة ما تُرد» فاغتنمها.</div>
      </section>
    </div>
  );
}

const inDays = (d, now) => { const n = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5); return n === 1 ? 'بكرة' : n === 2 ? 'بعد بكرة' : `بعد ${daysAr(n)}`; };

function CountdownHero({ days, first }) {
  return (
    <section className="fs-hero">
      <TileArt id="fasting" size={120} className="fs-hero-art" />
      <div className="col" style={{ gap: 4, position: 'relative' }}>
        <span className="small" style={{ opacity: .85 }}>باقي على رمضان</span>
        <b className="ruqaa" style={{ fontSize: 44, lineHeight: 1.2 }}>{days != null ? daysAr(days) : '—'}</b>
        {first && <span className="xs" style={{ opacity: .85 }}>أول رمضان تقريبًا {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(first)}</span>}
        <span className="xs" style={{ opacity: .8 }}>«اللهم بلّغنا رمضان» — جهّز نفسك من دلوقتي</span>
      </div>
    </section>
  );
}

function RamadanHero({ now, row, day, total, tz }) {
  const beforeFajr = now < row.fajr, beforeIftar = now >= row.fajr && now < row.maghrib;
  const target = beforeFajr ? row.imsak : beforeIftar ? row.maghrib : null;
  const label = beforeFajr ? (now < row.imsak ? 'باقي على الإمساك' : 'وقت الإمساك — أذان الفجر قريب') : beforeIftar ? 'باقي على الإفطار' : 'تقبّل الله صيامك — هنيئًا';
  const pct = beforeIftar ? (now - row.fajr) / (row.maghrib - row.fajr) : beforeFajr ? 0 : 1;
  return (
    <section className="fs-hero rm">
      <span className="fs-lanterns" aria-hidden="true">{[0, 1, 2].map((i) => <motion.i key={i} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 3 + i, repeat: Infinity }}><TileArt id="stories" size={46} /></motion.i>)}</span>
      <div className="col" style={{ gap: 2, position: 'relative' }}>
        <span className="small" style={{ opacity: .9 }}>رمضان كريم — اليوم {ar(day)} من {ar(total)}</span>
        <span className="small" style={{ opacity: .85 }}>{label}</span>
        {target && <b className="ltr num" style={{ fontSize: 46, lineHeight: 1.25 }}>{ar(countdown(target - now))}</b>}
        <div className="fs-bar"><i style={{ width: pct * 100 + '%' }} /><span style={{ right: `calc(${pct * 100}% - 12px)` }}>☀</span></div>
        <div className="between xs" style={{ opacity: .9 }}><span>الإمساك {fmtTime(row.imsak, tz)}</span><span>الإفطار {fmtTime(row.maghrib, tz)}</span></div>
      </div>
    </section>
  );
}

function Khatma({ inRamadan, day, total, times, setTimes }) {
  const days = useStore((s) => s.days);
  const p = khatmaPortion(Math.max(1, day || 1), total, times);
  const read = Object.values(days).reduce((n, d) => n + ((d.pages || []).length), 0);
  return (
    <section className="card col" style={{ gap: 10 }}>
      <div className="between"><span className="row h2"><BookOpen size={18} className="accent" /> ختمة رمضان</span>
        <div className="rc-seg" style={{ width: 210 }}>{[1, 2, 3].map((t) => <button key={t} className={times === t ? 'on' : ''} onClick={() => setTimes(t)}>{t === 1 ? 'ختمة' : t === 2 ? 'ختمتين' : '٣'}</button>)}</div>
      </div>
      <div className="xs muted">{`${pagesAr(p.per)} في اليوم تقريبًا — يعني حوالي ${pagesAr(Math.ceil(p.per / 5))} بعد كل صلاة`}</div>
      {inRamadan ? (
        <a href={'#/quran/' + p.from} className="fs-portion"><span className="col" style={{ gap: 2 }}><b>ورد اليوم {ar(day)}</b><span className="xs">من صفحة {ar(p.from)} إلى صفحة {ar(p.to)}</span></span><ChevronLeft size={18} /></a>
      ) : <div className="xs muted">الخطة هتبدأ أول يوم في رمضان، وكل يوم هيظهرلك ورده بضغطة.</div>}
      <div className="xs muted">قريت لحد دلوقتي {pagesAr(read)} في التطبيق.</div>
    </section>
  );
}

const TEN = [['قيام الليل', 'ولو ركعتين'], ['دعاء ليلة القدر', '«اللهم إنك عفو تحب العفو فاعفُ عني»'], ['صدقة ولو قليلة', ''], ['ورد قرآن', ''], ['استغفار ١٠٠ مرة', '']];
function LastTen({ day }) {
  const [done, setDone] = useState(() => { try { return JSON.parse(localStorage.getItem('rf-ten-' + day) || '[]'); } catch { return []; } });
  const t = (i) => { const n = done.includes(i) ? done.filter((x) => x !== i) : [...done, i]; setDone(n); try { localStorage.setItem('rf-ten-' + day, JSON.stringify(n)); } catch {} vibrate(8); if (n.length === TEN.length) { sound.complete(); toast('ما شاء الله! ليلة كاملة — تقبّل الله'); } };
  const odd = (day + 1) % 2 === 1;
  return (
    <section className="card col hl" style={{ gap: 8 }}>
      <div className="row h2"><Star size={18} className="accent" /> العشر الأواخر{odd ? ' — الليلة وتر' : ''}</div>
      <div className="xs muted">«تحرّوا ليلة القدر في الوتر من العشر الأواخر» — البخاري</div>
      {TEN.map(([a, b], i) => <button key={i} className={'fs-chk' + (done.includes(i) ? ' on' : '')} onClick={() => t(i)}><span className="fs-box">{done.includes(i) && <Check size={14} strokeWidth={3} />}</span><span className="col" style={{ textAlign: 'start' }}><b className="small">{a}</b>{b && <span className="xs muted">{b}</span>}</span></button>)}
    </section>
  );
}

function MonthCal({ fasts, now }) {
  const [off, setOff] = useState(0);
  const base = new Date(now.getFullYear(), now.getMonth() + off, 1);
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const lead = base.getDay();
  const keys = [...Array(days)].map((_, i) => todayKey(new Date(base.getFullYear(), base.getMonth(), i + 1)));
  const count = keys.filter((k) => fasts[k]).length;
  const year = Object.keys(fasts).filter((k) => k.startsWith(String(now.getFullYear()))).length;
  return (
    <section className="card col" style={{ gap: 10 }}>
      <div className="between">
        <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="الشهر السابق" onClick={() => setOff(off - 1)}><ChevronRight size={16} /></button>
        <div className="center" style={{ flex: 1, minWidth: 0 }}><b>{new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(base)}</b><div className="xs muted">{count ? `صمت ${daysAr(count)} الشهر ده` : 'لسه ماسجّلتش صيام الشهر ده'}{year ? ` — ${daysAr(year)} في ${ar(now.getFullYear())}` : ''}</div></div>
        <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="الشهر التالي" disabled={off >= 0} onClick={() => setOff(off + 1)}><ChevronLeft size={16} /></button>
      </div>
      <div className="fs-cal">
        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((d) => <span key={d} className="xs muted">{d}</span>)}
        {[...Array(lead)].map((_, i) => <span key={'l' + i} />)}
        {keys.map((k, i) => { const d = new Date(base.getFullYear(), base.getMonth(), i + 1); const s = sunnahOf(d); return <span key={k} className={'fs-day' + (fasts[k] ? ' on' : '') + (k === todayKey(now) ? ' today' : '') + (s && !s.haram ? ' sun' : '')} title={s?.name}>{ar(i + 1)}</span>; })}
      </div>
      <div className="row xs muted" style={{ gap: 12, justifyContent: 'center' }}><span><i className="fs-dot on" /> صمته</span><span><i className="fs-dot sun" /> يوم مستحب</span></div>
    </section>
  );
}
