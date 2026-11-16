import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Sun, Moon, BookOpen, Heart, Star, Bell, X } from 'lucide-react';
import { onMessage } from '../lib/companion.js';
import { sound } from '../lib/sound.js';
import { vibrate } from '../lib/haptics.js';
import logo from '../assets/logo.webp';

export const ICONS = { flame: Flame, trophy: Trophy, sun: Sun, moon: Moon, book: BookOpen, heart: Heart, star: Star, bell: Bell };
export const TONE = {
  challenge: { label: 'تحدٍّ', color: '#E3A14A' },
  celebrate: { label: 'إنجاز', color: 'var(--acc)' },
  remind: { label: 'تذكير', color: 'var(--muted)' },
  cheer: { label: 'رسالة', color: 'var(--acc)' },
};

let pushSimple = () => {};
export const toast = (msg) => pushSimple(msg);

// فقاعة رسالة من «الرفيق» تنزل من أعلى الشاشة، تُسحب للإغلاق، وتختفي تلقائيًّا
export function MessageHost() {
  const [q, setQ] = useState([]);
  const timers = useRef({});
  const close = (id) => { setQ((x) => x.filter((m) => m.id !== id)); clearTimeout(timers.current[id]); };
  const push = (m) => {
    const id = m.id || String(Date.now() + Math.random());
    setQ((x) => [...x.filter((y) => y.id !== id), { ...m, id }].slice(-2));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => close(id), m.simple ? 2800 : 6500);
  };
  useEffect(() => {
    pushSimple = (text) => push({ simple: true, body: text });
    return onMessage((m) => { push(m); sound.notify(); vibrate([12, 40, 12]); });
  }, []); // eslint-disable-line

  return (
    <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 10px)', left: 12, right: 12, zIndex: 70, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }} aria-live="polite">
      <AnimatePresence>
        {q.map((m) => m.simple ? (
          <motion.div key={m.id} layout initial={{ opacity: 0, y: -24, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -14 }} role="status"
            style={{ pointerEvents: 'auto', maxWidth: 460, width: '100%', padding: '13px 16px', borderRadius: 18, background: 'var(--acc)', color: 'var(--onAcc)', fontWeight: 600, fontSize: 13.5, textAlign: 'center', boxShadow: '0 16px 40px -14px rgba(0,0,0,.5)' }}>{m.body}</motion.div>
        ) : (
          <MessageBubble key={m.id} m={m} onClose={() => close(m.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ m, onClose }) {
  const I = ICONS[m.icon] || Bell; const tone = TONE[m.tone] || TONE.cheer;
  return (
    <motion.div layout role="alert"
      initial={{ opacity: 0, y: -60, scale: .9, rotateX: 25 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: -40, scale: .95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: .8, bottom: .1 }} onDragEnd={(_, i) => { if (i.offset.y < -40) onClose(); }}
      style={{ pointerEvents: 'auto', maxWidth: 460, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'color-mix(in srgb, var(--surf) 92%, transparent)', border: '1px solid var(--line)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 22px 50px -18px rgba(0,0,0,.55)', padding: '12px 14px 14px', color: 'var(--text)' }}>
      <motion.div aria-hidden="true" initial={{ x: '-110%' }} animate={{ x: '110%' }} transition={{ duration: 1.4, delay: .25 }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, transparent 30%, color-mix(in srgb, var(--acc) 22%, transparent) 50%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="row" style={{ gap: 10, alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 'none' }}>
          <img src={logo} alt="" width="40" height="40" style={{ borderRadius: 13, display: 'block' }} />
          <span style={{ position: 'absolute', bottom: -4, left: -4, width: 22, height: 22, borderRadius: '50%', background: tone.color, color: 'var(--onAcc)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surf)' }}><I size={12} aria-hidden="true" /></span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row xs" style={{ gap: 6 }}><b className="accent">الرفيق</b><span className="muted">· {tone.label} · الآن</span></div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{m.title}</div>
          <div className="small" style={{ lineHeight: 1.75, color: 'var(--text)', opacity: .9 }}>{m.body}</div>
          {m.cta && <a href={m.cta.href} onClick={onClose} className="btn" style={{ minHeight: 34, padding: '0 14px', fontSize: 12, marginTop: 8, display: 'inline-flex' }}>{m.cta.label}</a>}
        </div>
        <button aria-label="إغلاق" onClick={onClose} style={{ border: 0, background: 'transparent', color: 'var(--muted)', padding: 4 }}><X size={16} /></button>
      </div>
      <motion.div aria-hidden="true" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 6.5, ease: 'linear' }} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: tone.color, transformOrigin: 'right' }} />
    </motion.div>
  );
}
