import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { APP } from '../config.js';
import logo from '../assets/logo.webp';

// مقدمة متحركة: الشعار ينبثق وسط إطار نجمي يدور ببطء مع ذرات ذهبية
export default function Splash({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const dots = Array.from({ length: 18 }, (_, i) => i);
  return (
    <motion.div
      onClick={onDone} role="dialog" aria-label="مقدمة التطبيق"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: .5 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'radial-gradient(circle at 50% 40%, #134A3E 0%, #0A231E 55%, #061512 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#F5F0E1' }}
    >
      <motion.svg aria-hidden="true" width="520" height="520" viewBox="0 0 200 200" style={{ position: 'absolute', opacity: .22 }}
        initial={{ rotate: 0, scale: .8 }} animate={{ rotate: 45, scale: 1 }} transition={{ duration: 3.2, ease: 'easeOut' }}>
        <g fill="none" stroke="#D9B55A" strokeWidth=".6">
          <path d="M100 8l22 47 52-8-30 43 30 43-52-8-22 47-22-47-52 8 30-43-30-43 52 8z" />
          <path d="M100 30l16 34 37-6-21 31 21 31-37-6-16 34-16-34-37 6 21-31-21-31 37 6z" />
          <circle cx="100" cy="100" r="92" /><circle cx="100" cy="100" r="60" />
        </g>
      </motion.svg>
      {dots.map((i) => (
        <motion.span key={i} aria-hidden="true"
          style={{ position: 'absolute', width: 4, height: 4, borderRadius: 4, background: '#F0D894', boxShadow: '0 0 8px #F0D894', left: `${(i * 53) % 100}%`, top: '105%' }}
          animate={{ top: ['105%', `${(i * 37) % 70}%`], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4 + (i % 5) * .3, delay: (i % 6) * .15, ease: 'easeOut' }} />
      ))}
      <motion.div initial={{ scale: .4, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14, delay: .15 }}
        style={{ position: 'relative', width: 210, height: 210, borderRadius: 48, boxShadow: '0 0 0 1px rgba(217,181,90,.5), 0 30px 80px -20px rgba(0,0,0,.8), 0 0 90px rgba(217,181,90,.35)', overflow: 'hidden' }}>
        <img src={logo} alt="شعار الرفيق" width="210" height="210" style={{ display: 'block', width: '100%', height: '100%' }} />
        <motion.span aria-hidden="true" initial={{ x: '-120%' }} animate={{ x: '120%' }} transition={{ delay: 1, duration: 1.1, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 35%, rgba(255,240,200,.55) 50%, transparent 65%)' }} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9, duration: .6 }} style={{ marginTop: 26, textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 15, color: '#E9DDBB', letterSpacing: .5 }}>{APP.tagline}</div>
        <div className="amiri" style={{ marginTop: 10, fontSize: 18, color: '#D9B55A' }}>﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾</div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: .85 }} transition={{ delay: 1.6 }}
        style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 28px)', textAlign: 'center', fontSize: 11.5, color: '#A9C2B7', lineHeight: 1.8 }}>
        تم تصميم وتطوير التطبيق بواسطة<br /><b style={{ color: '#D9B55A', direction: 'ltr', unicodeBidi: 'isolate' }}>{APP.developer}</b>
      </motion.div>
    </motion.div>
  );
}
