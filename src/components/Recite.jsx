// واجهة التلاوة: شريط التشغيل العائم، لوح الإعدادات والقرّاء والتحميل، وقائمة الآية بالضغط المطوّل
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, X, SlidersHorizontal, Repeat, Repeat1, Download, Check, Trash2, Headphones, Flag, ListMusic, Loader2, CircleStop } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { useStore } from '../store.js';
import { useRecite, toggle, skip, stop, start, RECITERS, reciterOf, DEFAULTS, HL, setReciteOpt, download, isDownloaded, clearDownloads, surahKeys, ayahList } from '../lib/recite.js';
import { SURAHS } from '../lib/quran.js';
import { ar } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { toast } from './ui.jsx';

const plain = (n) => n.replace(/[ً-ْٰ]/g, '');
const useOpts = () => ({ ...DEFAULTS, ...(useStore((s) => s.settings.recite) || {}) });
const initial = (r) => r.ini || r.name[0];
const timesAr = (n) => (n === 0 ? 'بلا توقف' : n === 1 ? 'مرة واحدة' : n === 2 ? 'مرتين' : `${ar(n)} مرات`);

export function Avatar({ r, size = 44 }) {
  return <span className="rc-av" style={{ width: size, height: size, fontSize: size * 0.42, '--h': r.hue }}>{initial(r)}</span>;
}

// ——— الشريط العائم ———
export function ReciteDock({ onSettings }) {
  const st = useRecite(); const o = useOpts(); const r = reciterOf(o.reciter);
  useEffect(() => { if (st.error) toast(st.error); }, [st.error]);
  useEffect(() => { if (st.finished) toast('اكتملت التلاوة — تقبّل الله منك'); }, [st.finished]);
  if (!st.active || !st.key) return null;
  const C = 2 * Math.PI * 27;
  const sname = plain(SURAHS[st.key.s - 1].name);
  return (
    <motion.div className="rc-dock" style={{ '--h': r.hue }} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
      <span className="rc-glow" aria-hidden="true" />
      <button className="rc-play" onClick={() => { toggle(); vibrate(8); }} aria-label={st.playing ? 'إيقاف مؤقت' : 'تشغيل'}>
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
          <circle cx="32" cy="32" r="27" fill="none" stroke="#F0D894" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (st.basmala ? 0 : st.progress))} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .25s linear' }} /></svg>
        <span className="rc-play-in">{st.loading ? <Loader2 size={24} className="spin" /> : st.playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginRight: -3 }} />}</span>
      </button>
      <div className="col" style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <div className="row" style={{ gap: 6 }}>
          <Eq on={st.playing} />
          <b className="rc-title">{st.basmala ? 'البسملة' : `${sname} — آية ${ar(st.key.a)}`}</b>
        </div>
        <span className="rc-sub">{r.name}{r.style ? ` · ${r.style}` : ''}</span>
        <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
          {o.repeat > 1 && <span className="rc-tag"><Repeat1 size={11} /> {ar(st.rep + 1)}/{ar(o.repeat)}</span>}
          {st.range && <span className="rc-tag"><Repeat size={11} /> مقطع {st.range.times ? `${ar(st.rangeRep + 1)}/${ar(st.range.times)}` : '∞'}</span>}
          {o.rate !== 1 && <span className="rc-tag">×{ar(o.rate)}</span>}
          {st.waiting && <span className="rc-tag on">ردّد الآن…</span>}
        </div>
      </div>
      <div className="rc-btns">
        <button aria-label="الآية السابقة" onClick={() => skip(-1)}><SkipForward size={19} /></button>
        <button aria-label="الآية التالية" onClick={() => skip(1)}><SkipBack size={19} /></button>
      </div>
      <div className="rc-side">
        <button aria-label="إعدادات التلاوة" onClick={onSettings}><SlidersHorizontal size={16} /></button>
        <button aria-label="إنهاء التلاوة" onClick={() => stop()}><X size={16} /></button>
      </div>
    </motion.div>
  );
}

function Eq({ on }) {
  return <span className={'rc-eq' + (on ? ' on' : '')} aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * -0.22}s` }} />)}</span>;
}

// ——— شبكة القرّاء ولون التظليل (مشتركة) ———
function ReciterGrid({ onPick }) {
  const o = useOpts();
  return (
    <div className="rc-grid">
      {RECITERS.map((r) => { const on = o.reciter === r.id; return (
        <motion.button key={r.id} whileTap={{ scale: .96 }} className={'rc-card' + (on ? ' on' : '')} style={{ '--h': r.hue }} onClick={() => { setReciteOpt({ reciter: r.id }); vibrate(8); onPick?.(r); }} aria-pressed={on}>
          <Avatar r={r} size={40} />
          <span className="col" style={{ minWidth: 0, gap: 1, textAlign: 'start' }}><b className="rc-cn">{r.name}</b><span className="xs muted">{r.style}</span></span>
          {on && <span className="rc-check"><Check size={13} strokeWidth={3} /></span>}
        </motion.button>
      ); })}
    </div>
  );
}
export function HlPicker() {
  const o = useOpts();
  return (
    <div className="col" style={{ gap: 8 }}>
      <span className="small" style={{ fontWeight: 600 }}>لون تظليل الآية</span>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }} role="radiogroup" aria-label="لون التظليل">
        {Object.entries(HL).map(([k, [name, c]]) => (
          <button key={k} role="radio" aria-checked={o.hl === k} aria-label={name} className={'hl-dot' + (o.hl === k ? ' on' : '')} style={{ '--c': c }} onClick={() => { setReciteOpt({ hl: k }); vibrate(6); }}>{o.hl === k && <Check size={15} strokeWidth={3} />}</button>
        ))}
      </div>
      <div className="hl-sample" style={{ '--hl': HL[o.hl]?.[1] || HL.gold[1] }}><span className="ayah on">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ</span></div>
    </div>
  );
}

// ——— لوح البدء: اختيار القارئ ثم التشغيل ———
export function StartSheet({ onClose, onStart, pageLabel }) {
  const o = useOpts(); const r = reciterOf(o.reciter);
  return (
    <Sheet onClose={onClose} label="اختيار القارئ">
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 10 }}><span className="hc-ic"><Headphones size={22} /></span><div className="col"><b className="h2">استمع للتلاوة</b><span className="xs muted">اختار القارئ وابدأ — {pageLabel}</span></div></div>
        <ReciterGrid />
        <HlPicker />
        <motion.button whileTap={{ scale: .97 }} className="btn q-go rc-start" style={{ '--h': r.hue }} onClick={() => { onStart(); onClose(); }}>
          <Play size={18} fill="currentColor" /> ابدأ التلاوة بصوت {r.name}
        </motion.button>
        <span className="xs muted center">نصيحة: اضغط مطوّل على أي آية علشان تبدأ منها أو تكرّرها</span>
      </div>
    </Sheet>
  );
}

// ——— لوح الإعدادات ———
function Seg({ value, options, onChange, label }) {
  return (
    <div className="col" style={{ gap: 6 }}>
      <span className="small" style={{ fontWeight: 600 }}>{label}</span>
      <div className="rc-seg" role="radiogroup" aria-label={label}>
        {options.map(([v, t]) => <button key={String(v)} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => { onChange(v); vibrate(6); }}>{t}</button>)}
      </div>
    </div>
  );
}

export function ReciteSheet({ onClose, page, pageAyahs, juzRange }) {
  const o = useOpts(); const st = useRecite();
  const s = pageAyahs?.[0]?.s || 1; const sname = plain(SURAHS[s - 1].name);
  const [dl, setDl] = useState(null); const [has, setHas] = useState(false);
  const abort = useRef(null);
  useEffect(() => { isDownloaded(o.reciter, s).then(setHas); }, [o.reciter, s, dl]);
  const pick = (r) => {
    setReciteOpt({ reciter: r.id });
    if (st.active && st.key) start(st.key, st.range);
  };
  const get = async (what) => {
    const keys = what === 'surah' ? surahKeys(s) : juzRange ? ayahList(juzRange.from, juzRange.to) : [];
    if (!keys.length) return;
    abort.current = new AbortController();
    setDl({ what, p: 0 });
    const r = await download(o.reciter, keys, (p) => setDl({ what, p }), abort.current.signal);
    setDl(null);
    if (abort.current.signal.aborted) toast('اتوقف التحميل');
    else if (r.failed === r.total) toast('التحميل للاستماع بدون نت متاح في تطبيق الأندرويد، أو اتأكد من النت');
    else if (r.failed) toast(`اتحمّل الأغلب — ${ar(r.failed)} ملف محتاج إعادة محاولة`);
    else toast(what === 'surah' ? `اتحمّلت سورة ${sname} — تقدر تسمعها من غير نت` : 'اتحمّل الجزء — تقدر تسمعه من غير نت');
  };
  return (
    <Sheet onClose={onClose} label="إعدادات التلاوة">
      <div className="col" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 10 }}><span className="hc-ic"><Headphones size={22} /></span><div className="col"><b className="h2">التلاوة</b><span className="xs muted">اختار القارئ وطريقة الاستماع</span></div></div>

        <ReciterGrid onPick={(r) => { if (st.active && st.key) start(st.key, st.range); }} />
        <HlPicker />

        <Seg label="سرعة التلاوة" value={o.rate} onChange={(v) => setReciteOpt({ rate: v })} options={[[0.75, '٠٫٧٥×'], [1, 'عادي'], [1.25, '١٫٢٥×'], [1.5, '١٫٥×']]} />
        <Seg label="تكرار كل آية" value={o.repeat} onChange={(v) => setReciteOpt({ repeat: v })} options={[[1, 'مرة'], [2, '٢'], [3, '٣'], [5, '٥'], [10, '١٠']]} />
        <Seg label="مهلة للترديد بعد كل آية" value={o.gap} onChange={(v) => setReciteOpt({ gap: v })} options={[[0, 'بدون'], [2, '٢ ث'], [5, '٥ ث'], ['ayah', 'بطول الآية']]} />
        <Seg label="تكرار المقطع أو الصفحة" value={o.range} onChange={(v) => setReciteOpt({ range: v })} options={[[1, 'مرة'], [3, '٣'], [5, '٥'], [10, '١٠'], [0, 'بلا توقف']]} />
        <label className="set-row" style={{ padding: 0 }}><span className="small" style={{ fontWeight: 600 }}>قلب الصفحة تلقائيًا مع التلاوة</span><input type="checkbox" checked={o.follow} onChange={(e) => setReciteOpt({ follow: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--acc)' }} /></label>

        <div className="hc-preview" style={{ gap: 10 }}>
          <b className="small">الاستماع بدون إنترنت — {reciterOf(o.reciter).name}</b>
          {dl ? (
            <div className="col" style={{ gap: 6 }}>
              <div className="between xs"><span>جارٍ تحميل {dl.what === 'surah' ? `سورة ${sname}` : 'الجزء'}…</span><b className="num">{ar(Math.round(dl.p * 100))}٪</b></div>
              <div className="bar"><i style={{ width: dl.p * 100 + '%' }} /></div>
              <button className="btn ghost" style={{ minHeight: 38 }} onClick={() => abort.current?.abort()}><CircleStop size={15} /> إيقاف</button>
            </div>
          ) : (
            <div className="grid2">
              <button className="btn soft" style={{ minHeight: 44, fontSize: 13 }} onClick={() => get('surah')} disabled={has}>{has ? <><Check size={15} /> {sname} محمّلة</> : <><Download size={15} /> سورة {sname}</>}</button>
              <button className="btn soft" style={{ minHeight: 44, fontSize: 13 }} onClick={() => get('juz')} disabled={!juzRange}><Download size={15} /> الجزء {juzRange ? ar(juzRange.juz) : ''}</button>
            </div>
          )}
          <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={async () => { await clearDownloads(); setHas(false); toast('اتمسحت كل التلاوات المحمّلة'); }}><Trash2 size={13} style={{ verticalAlign: -2 }} /> مسح كل التحميلات</button>
        </div>
      </div>
    </Sheet>
  );
}

// ——— قائمة الآية (ضغط مطوّل) ———
export function AyahMenu({ k, segStart, onSegStart, pageRange, onClose }) {
  const o = useOpts();
  const sname = plain(SURAHS[k.s - 1].name);
  const times = o.range;
  const act = (fn) => { fn(); vibrate(10); onClose(); };
  const validEnd = segStart && (segStart.s < k.s || (segStart.s === k.s && segStart.a <= k.a));
  return (
    <Sheet onClose={onClose} label={`سورة ${sname} آية ${k.a}`}>
      <div className="col" style={{ gap: 10 }}>
        <div className="center col" style={{ gap: 2 }}><b className="h2">سورة {sname}</b><span className="xs muted">الآية {ar(k.a)}</span></div>
        {validEnd ? (
          <button className="rc-act hl" onClick={() => act(() => { start(segStart, { from: segStart, to: k, times }); onSegStart(null); })}><Flag size={19} /><span><b>انهِ المقطع هنا وابدأ التكرار</b><small>من آية {ar(segStart.a)} لحد آية {ar(k.a)} — {timesAr(times)}</small></span></button>
        ) : null}
        <button className="rc-act" onClick={() => act(() => start(k))}><Play size={19} /><span><b>استمع من هنا</b><small>وكمّل للي بعدها</small></span></button>
        <button className="rc-act" onClick={() => act(() => start(k, { from: k, to: k, times: times || 0 }))}><Repeat1 size={19} /><span><b>كرّر الآية دي</b><small>{timesAr(times)} — غيّر العدد من إعدادات التلاوة</small></span></button>
        <button className="rc-act" onClick={() => act(() => { onSegStart(k); toast('اضغط مطوّل على آخر آية في المقطع'); })}><ListMusic size={19} /><span><b>حدّد مقطع يبدأ من هنا</b><small>بعدها اضغط مطوّل على آية النهاية</small></span></button>
        {pageRange && <button className="rc-act" onClick={() => act(() => start(pageRange.from, { ...pageRange, times }))}><Repeat size={19} /><span><b>كرّر الصفحة كلها</b><small>مناسبة للحفظ والمراجعة</small></span></button>}
      </div>
    </Sheet>
  );
}
