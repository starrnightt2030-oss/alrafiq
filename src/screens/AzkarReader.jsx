import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, RotateCcw, ChevronRight, ChevronLeft, AArrowUp, AArrowDown } from 'lucide-react';
import { useStore } from '../store.js';
import Q from '../data/quranSnippets.json';
import { refName } from '../lib/ref.js';
import { ar, todayKey } from '../lib/arabic.js';
import { sound } from '../lib/sound.js';
import { vibrate } from '../lib/haptics.js';
import { TopBar, Ring } from '../components/ui.jsx';
import { go } from '../router.js';

export default function AzkarReader({ set, fallback = '/azkar' }) {
  const session = set?.id;
  const saved = useStore((s) => s.days[todayKey()]?.azkar?.[session]);
  const saveAzkar = useStore((s) => s.saveAzkar);
  const scale = useStore((s) => s.settings.textScale);
  const setSetting = useStore((s) => s.setSetting);
  const fresh = saved?.done && set?.repeatable; // أذكار تتكرر في اليوم (بعد الصلاة، الرقية) تبدأ من جديد
  const [i, setI] = useState(() => !saved || fresh ? 0 : saved.done ? set.items.length : saved.i || 0);
  const [c, setC] = useState(() => !saved || fresh || saved.done ? 0 : saved.c || 0);
  const items = set?.items || [];
  const done = i >= items.length;
  const z = items[Math.min(i, items.length - 1)];

  useEffect(() => { if (set) saveAzkar(session, { i: Math.min(i, items.length), c, done }); }, [i, c, done]); // eslint-disable-line

  const advance = (to) => { setI(to); setC(0); };

  const tap = () => {
    if (done) return;
    const nc = c + 1;
    sound.unlock();
    if (nc >= z.count) {
      setC(nc);
      vibrate([18, 40, 18]);
      if (i + 1 >= items.length) { sound.complete(); setTimeout(() => advance(i + 1), 380); }
      else { sound.next(); setTimeout(() => advance(i + 1), 380); }
    } else { setC(nc); sound.tap(); vibrate(10); }
  };

  const steps = useMemo(() => items.map((_, k) => (k < i ? 'd' : k === i ? 'n' : '')), [i, items]);
  if (!set) { go(fallback); return null; }
  const fs = (z.quran ? 24 : z.text.length > 200 ? 18 : z.text.length > 90 ? 21 : 27) * scale;

  return (
    <div className="screen no-nav" style={{ minHeight: '100dvh' }}>
      <TopBar title={set.title} sub={done ? 'اكتمل الورد' : `الذكر ${ar(i + 1)} من ${ar(items.length)}`} fallback={fallback}
        right={<button className="icon-btn" aria-label="إعادة البدء" onClick={() => advance(0)}><RotateCcw size={19} /></button>} />
      <div className="row" style={{ gap: 3 }} aria-hidden="true">
        {steps.map((s, k) => <span key={k} style={{ flex: 1, height: 5, borderRadius: 4, background: s === 'd' ? 'var(--acc)' : s === 'n' ? 'color-mix(in srgb, var(--acc) 45%, transparent)' : 'var(--surf2)', transition: 'background .3s' }} />)}
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={'z' + i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: .28 }} className="col" style={{ gap: 14, flex: 1 }}>
            <article className="card col" style={{ gap: 12 }}>
              <div className="between">
                <span className="col" style={{ gap: 0 }}>
                  <span className="small accent" style={{ fontWeight: 600 }}>{z.title}</span>
                  {z.ref && <span className="xs muted">{refName(z.ref, !z.title.startsWith('سورة'))}</span>}
                </span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="تصغير الخط" onClick={() => setSetting('textScale', Math.max(.8, +(scale - .1).toFixed(2)))}><AArrowDown size={17} /></button>
                  <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="تكبير الخط" onClick={() => setSetting('textScale', Math.min(1.5, +(scale + .1).toFixed(2)))}><AArrowUp size={17} /></button>
                </div>
              </div>
              {z.basmala && <div className="hafs center muted" style={{ fontSize: 18 * scale }}>{Q.basmala}</div>}
              <p className={z.quran ? 'hafs' : 'amiri'} style={{ margin: 0, fontSize: fs, lineHeight: z.quran ? 2.1 : 2, textAlign: 'center' }}>
                {z.quran ? <>﴿{z.text}﴾</> : z.text}
              </p>
              <div className="row" style={{ alignItems: 'flex-start', gap: 8, borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
                <Star size={17} className="accent" style={{ flex: 'none', marginTop: 3 }} aria-hidden="true" />
                <div className="small" style={{ lineHeight: 1.8 }}><b className="accent">الفضل: </b>{z.reward}{z.src && <span className="muted"> — {z.src}</span>}</div>
              </div>
            </article>

            <div className="col" style={{ alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
              <motion.button whileTap={{ scale: .93 }} onClick={tap} aria-label={`عدّ — ${c} من ${z.count}`}
                style={{ border: 0, padding: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, var(--surf2), var(--surf))', boxShadow: '0 0 0 8px color-mix(in srgb, var(--acc) 10%, transparent), 0 20px 40px -14px rgba(0,0,0,.5)' }}>
                <Ring size={188} stroke={4.5} value={c / z.count}>
                  <span className="num" style={{ fontSize: 58, lineHeight: 1.1, color: 'var(--text)' }}>{ar(c)}</span>
                  <span className="small muted" style={{ marginTop: 6 }}>من {ar(z.count)}</span>
                </Ring>
              </motion.button>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn ghost" disabled={i === 0} onClick={() => advance(i - 1)}><ChevronRight size={18} />السابق</button>
                <button className="btn soft" onClick={() => advance(i + 1)}>تخطٍّ<ChevronLeft size={18} /></button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} className="card hl col center" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }}>
            <motion.svg width="110" height="110" viewBox="0 0 100 100" aria-hidden="true" initial={{ rotate: -30, scale: .5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring' }}>
              <path d="M50 4l11 23 25-4-14 21 14 21-25-4-11 23-11-23-25 4 14-21L14 23l25 4z" fill="var(--acc)" opacity=".18" />
              <path d="M34 52l11 11 22-24" fill="none" stroke="var(--acc)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <div style={{ fontSize: 22, fontWeight: 700 }}>أتممت {set.title}</div>
            <div className="small muted" style={{ lineHeight: 1.9 }}>تقبّل الله منك، وأُضيفت ٥٠ نقطة إلى رصيدك.</div>
            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              <a className="btn" href={fallback === '/azkar' ? '#/azkar' : '#/'}>{fallback === '/azkar' ? 'باقي الأذكار' : 'الرئيسية'}</a>
              <button className="btn ghost" onClick={() => advance(0)}>إعادة القراءة</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
