// التفسير الميسّر ومعاني الكلمات، ومشاركة الآية كصورة احترافية
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Share2, Play, ChevronRight, ChevronLeft, Minus, Plus, Download, Loader2 } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { toast } from './ui.jsx';
import { SURAHS } from '../lib/quran.js';
import { ar } from '../lib/arabic.js';
import { start as reciteStart, nextKey, prevKey } from '../lib/recite.js';
import { drawAyahCard, SIZES, STYLES } from '../lib/ayahCard.js';
import { shareImage } from '../lib/shareImage.js';
import { useStore } from '../store.js';
import { vibrate } from '../lib/haptics.js';

const plain = (n) => n.replace(/[ً-ْٰ]/g, '');
const cache = {};
export async function loadTafsir(s) {
  if (!cache[s]) cache[s] = fetch(new URL(`tafsir/${s}.json`, document.baseURI)).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).catch((e) => { delete cache[s]; throw e; });
  return cache[s];
}
// إبراز الكلمات القرآنية بين ﴿ ﴾ في النص
function Rich({ text }) {
  return text.split('\n').filter(Boolean).map((para, i) => (
    <p key={i} style={{ margin: '0 0 8px' }}>{para.split(/(﴿[^﴾]*﴾)/g).map((p, j) => p.startsWith('﴿') ? <span key={j} className="hafs tf-q">{p}</span> : p)}</p>
  ));
}

export function TafsirSheet({ k: k0, getAyah, onShare, onClose }) {
  const [k, setK] = useState(k0);
  const [d, setD] = useState(null); const [err, setErr] = useState(false); const [about, setAbout] = useState(false);
  useEffect(() => { setD(null); setErr(false); loadTafsir(k.s).then(setD).catch(() => setErr(true)); }, [k.s]);
  const a = getAyah(k); const t = d?.a?.[k.a];
  const sname = SURAHS[k.s - 1].name;
  const go = (n) => { if (n) { setK(n); vibrate(6); } };
  return (
    <Sheet onClose={onClose} label="التفسير">
      <div className="col" style={{ gap: 12 }}>
        <div className="between">
          <button className="icon-btn" aria-label="الآية السابقة" onClick={() => go(prevKey(k))}><ChevronRight size={18} /></button>
          <div className="center"><b className="h2">سورة {sname}</b><div className="xs muted">الآية {ar(k.a)}</div></div>
          <button className="icon-btn" aria-label="الآية التالية" onClick={() => go(nextKey(k))}><ChevronLeft size={18} /></button>
        </div>
        {a && <div className="tf-ayah hafs">{a.t}</div>}
        {err ? <div className="card center small">تعذّر تحميل التفسير — اتأكد من النت أول مرة، وبعدها بيشتغل من غير نت</div>
          : !d ? <div className="center muted small" style={{ padding: 20 }}><Loader2 size={18} className="spin" /> جارٍ التحميل…</div> : (
          <>
            <section className="tf-box"><div className="tf-h"><BookOpenText size={16} /> التفسير الميسّر</div><div className="tf-t"><Rich text={t?.[0] || '—'} /></div></section>
            {t?.[1] && <section className="tf-box soft"><div className="tf-h">معاني الكلمات</div><div className="tf-t"><Rich text={t[1]} /></div></section>}
            {d.i && <section className="tf-box soft"><button className="tf-h link-btn" style={{ padding: 0 }} onClick={() => setAbout(!about)}>عن سورة {plain(sname)} {about ? '▴' : '▾'}</button>{about && <div className="tf-t"><Rich text={d.i.replace(/•/g, '')} /></div>}</section>}
            <div className="xs muted">المصدر: التفسير الميسّر — مجمع الملك فهد لطباعة المصحف الشريف، والميسّر في غريب القرآن.</div>
          </>
        )}
        <div className="grid2">
          <button className="btn soft" onClick={() => { reciteStart(k); onClose(); }}><Play size={16} /> استمع</button>
          <button className="btn" onClick={() => onShare(k, t?.[0])}><Share2 size={16} /> شارك كصورة</button>
        </div>
      </div>
    </Sheet>
  );
}

export function ShareSheet({ k, getAyah, tafsir: tf0, onClose }) {
  const saved = useStore((s) => s.settings.share);
  const setSetting = useStore((s) => s.setSetting);
  const opt = { style: 'emerald', size: 'post', ...(saved || {}) };
  const set = (p) => setSetting('share', { ...opt, ...p });
  const [count, setCount] = useState(1);
  const [withTafsir, setWithTafsir] = useState(false);
  const [tafsir, setTafsir] = useState(tf0 || '');
  const [img, setImg] = useState(null); const [busy, setBusy] = useState(false);
  const cv = useRef(null);
  const ayahs = []; { let c = k; for (let i = 0; i < count && c && c.s === k.s; i++) { const a = getAyah(c); if (a) ayahs.push(a); c = nextKey(c); } }
  useEffect(() => { if (withTafsir && !tafsir) loadTafsir(k.s).then((d) => setTafsir(d.a?.[k.a]?.[0] || '')).catch(() => {}); }, [withTafsir]);
  useEffect(() => {
    let on = true; setImg(null);
    const t = setTimeout(() => drawAyahCard({ ayahs, style: opt.style, size: opt.size, tafsir: withTafsir && count === 1 ? tafsir : '' }).then((c) => { if (!on) return; cv.current = c; setImg(c.toDataURL('image/jpeg', .85)); }), 120);
    return () => { on = false; clearTimeout(t); };
  }, [opt.style, opt.size, count, withTafsir, tafsir]); // eslint-disable-line
  const share = async () => {
    if (!cv.current) return; setBusy(true);
    try { const r = await shareImage(cv.current, `آية-${plain(SURAHS[k.s - 1].name)}-${k.a}`, 'من تطبيق الرفيق — رفيقك في ذكر الله'); if (r === 'downloaded') toast('اتحفظت الصورة في التنزيلات'); }
    catch { toast('تعذّرت المشاركة — جرّب تاني'); }
    setBusy(false);
  };
  const [W, H] = SIZES[opt.size];
  return (
    <Sheet onClose={onClose} label="مشاركة الآية">
      <div className="col" style={{ gap: 12 }}>
        <b className="h2 center">شارك الآية كصورة</b>
        <div className="sh-prev" style={{ aspectRatio: `${W} / ${H}` }}>
          {img ? <motion.img key={img.length} src={img} alt="معاينة الصورة" initial={{ opacity: .4 }} animate={{ opacity: 1 }} /> : <div className="center muted"><Loader2 className="spin" /></div>}
        </div>
        <div className="row" style={{ gap: 10, justifyContent: 'center' }} role="radiogroup" aria-label="التصميم">
          {Object.entries(STYLES).map(([id, s]) => <button key={id} role="radio" aria-checked={opt.style === id} aria-label={s.name} className={'sh-sw' + (opt.style === id ? ' on' : '')} style={{ background: `linear-gradient(135deg, ${s.bg[0]}, ${s.bg[1]})`, '--a': s.accent }} onClick={() => set({ style: id })}><i /></button>)}
        </div>
        <div className="rc-seg">{Object.entries(SIZES).map(([id, s]) => <button key={id} className={opt.size === id ? 'on' : ''} onClick={() => set({ size: id })}>{s[2]}</button>)}</div>
        <div className="between">
          <span className="small">عدد الآيات</span>
          <div className="row" style={{ gap: 8 }}>
            <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="آية أقل" onClick={() => setCount(Math.max(1, count - 1))}><Minus size={16} /></button>
            <b className="num" style={{ minWidth: 20, textAlign: 'center' }}>{ar(ayahs.length)}</b>
            <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="آية أكتر" onClick={() => setCount(Math.min(6, count + 1))}><Plus size={16} /></button>
          </div>
        </div>
        {count === 1 && <label className="between small"><span>أضف التفسير الميسّر تحت الآية</span><input type="checkbox" checked={withTafsir} onChange={(e) => setWithTafsir(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--acc)' }} /></label>}
        <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={share} disabled={!img || busy}>{busy ? <Loader2 size={18} className="spin" /> : <Share2 size={18} />} حفظ ومشاركة</motion.button>
      </div>
    </Sheet>
  );
}
