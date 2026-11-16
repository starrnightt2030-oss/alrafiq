import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { APP } from '../config.js';
import { sound } from '../lib/sound.js';
import logo from '../assets/logo.webp';

// مقدمة سينمائية: تُرسم النجمة الثمانية بخط ذهبي، ثم ينبثق الشعار من الضوء وتمرّ عليه لمعة،
// وتدور الأشعة خلفه وتصعد ذرات النور، ثم يظهر الشعار النصي والآية، ثم يتلاشى المشهد إلى التطبيق
const STAR = 'M100 10 L127 64 L190 73 L136 100 L190 127 L127 136 L100 190 L73 136 L10 127 L64 100 L10 73 L73 64 Z';
const STAR2 = 'M100 10 L120 80 L190 100 L120 120 L100 190 L80 120 L10 100 L80 80 Z';

export default function Splash({ onDone }) {
  useEffect(() => { sound.intro(); const t = setTimeout(onDone, 4300); return () => clearTimeout(t); }, [onDone]);
  const motes = Array.from({ length: 26 }, (_, i) => i);
  const rays = Array.from({ length: 12 }, (_, i) => i);
  return (
    <motion.div onClick={onDone} role="dialog" aria-label="مقدمة تطبيق الرفيق"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }} transition={{ duration: .6, ease: 'easeInOut' }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F5F0E1', background: 'radial-gradient(120% 80% at 50% 38%, #0F4A3D 0%, #0A231E 45%, #04100D 100%)', perspective: 900 }}>

      {/* هالة الضوء */}
      <motion.div aria-hidden="true" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4, 1.15], opacity: [0, .9, .55] }} transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,216,148,.45) 0%, rgba(217,181,90,.12) 40%, transparent 70%)', top: '50%', left: '50%', margin: '-250px 0 0 -210px' }} />

      {/* أشعة تدور ببطء */}
      <motion.svg aria-hidden="true" viewBox="-100 -100 200 200" width="640" height="640" style={{ position: 'absolute', top: '50%', left: '50%', margin: '-360px 0 0 -320px', opacity: .5 }}
        initial={{ rotate: 0, opacity: 0 }} animate={{ rotate: 30, opacity: .2 }} transition={{ duration: 4.2, ease: 'linear', opacity: { duration: 1.4, delay: .6 } }}>
        {rays.map((i) => <path key={i} d="M0 0 L-3 -100 L3 -100 Z" fill="url(#ray)" transform={`rotate(${i * 30})`} />)}
        <defs><linearGradient id="ray" x1="0" y1="0" x2="0" y2="-1"><stop offset="0" stopColor="#F0D894" stopOpacity=".55" /><stop offset="1" stopColor="#F0D894" stopOpacity="0" /></linearGradient></defs>
      </motion.svg>

      {/* النجمة تُرسم */}
      <svg aria-hidden="true" viewBox="0 0 200 200" width="360" height="360" style={{ position: 'absolute', top: '50%', left: '50%', margin: '-220px 0 0 -180px' }}>
        <motion.path d={STAR} fill="none" stroke="#D9B55A" strokeWidth=".9" initial={{ pathLength: 0, opacity: .9 }} animate={{ pathLength: 1, opacity: [0.9, 0.9, 0.35] }} transition={{ duration: 1.5, ease: 'easeInOut', opacity: { duration: 3.2, times: [0, .5, 1] } }} />
        <motion.path d={STAR2} fill="none" stroke="#F0D894" strokeWidth=".6" initial={{ pathLength: 0 }} animate={{ pathLength: 1, rotate: 22.5 }} style={{ originX: '100px', originY: '100px' }} transition={{ duration: 1.8, delay: .25, ease: 'easeInOut' }} />
        <motion.circle cx="100" cy="100" r="58" fill="none" stroke="#D9B55A" strokeWidth=".5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: .4 }} />
      </svg>

      {/* ذرات النور */}
      {motes.map((i) => (
        <motion.span key={i} aria-hidden="true"
          style={{ position: 'absolute', width: i % 3 ? 3 : 5, height: i % 3 ? 3 : 5, borderRadius: 6, background: '#F6DFA8', boxShadow: '0 0 10px #F0D894', left: `${(i * 37 + 11) % 100}%`, top: '108%' }}
          animate={{ top: ['108%', `${10 + ((i * 53) % 70)}%`], opacity: [0, 1, 0], x: [0, (i % 2 ? 1 : -1) * (10 + (i % 5) * 6)] }}
          transition={{ duration: 2.6 + (i % 6) * .35, delay: .5 + (i % 7) * .14, ease: 'easeOut' }} />
      ))}

      {/* الشعار */}
      <motion.div
        initial={{ scale: .35, opacity: 0, rotateY: -70, filter: 'blur(14px) brightness(2.2)' }}
        animate={{ scale: [0.35, 1.08, 1], opacity: 1, rotateY: 0, filter: 'blur(0px) brightness(1)' }}
        transition={{ duration: 1.25, delay: .55, ease: [0.2, 0.9, 0.3, 1.15] }}
        style={{ position: 'relative', width: 196, height: 196, marginTop: -40, borderRadius: 46, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(240,216,148,.55), 0 28px 70px -18px rgba(0,0,0,.85), 0 0 80px rgba(217,181,90,.35)', transformStyle: 'preserve-3d' }}>
        <img src={logo} alt="" width="196" height="196" style={{ display: 'block', width: '100%', height: '100%' }} />
        <motion.span aria-hidden="true" initial={{ x: '-130%' }} animate={{ x: '130%' }} transition={{ delay: 1.75, duration: .95, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: '-20%', background: 'linear-gradient(110deg, transparent 38%, rgba(255,246,214,.75) 50%, transparent 62%)' }} />
      </motion.div>
      <motion.div aria-hidden="true" initial={{ scale: .8, opacity: 0 }} animate={{ scale: [0.8, 1.35], opacity: [0, .6, 0] }} transition={{ delay: 1.6, duration: 1.2 }}
        style={{ position: 'absolute', width: 230, height: 230, borderRadius: 56, border: '2px solid #F0D894', top: '50%', left: '50%', margin: '-155px 0 0 -115px' }} />

      {/* النصوص */}
      <div style={{ position: 'relative', marginTop: 26, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 12, letterSpacing: '6px' }} animate={{ opacity: 1, y: 0, letterSpacing: '0px' }} transition={{ delay: 1.9, duration: .8 }}
          className="amiri" style={{ fontSize: 34, fontWeight: 700, color: '#F0D894', textShadow: '0 0 24px rgba(217,181,90,.45)' }}>{APP.name}</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: .9 }} transition={{ delay: 2.3, duration: .6 }} style={{ fontSize: 14, color: '#E9DDBB', marginTop: 2 }}>{APP.tagline}</motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.7, duration: .7 }} className="amiri" style={{ marginTop: 12, fontSize: 17, color: '#D9B55A' }}>﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾</motion.div>
      </div>

      {/* شريط التحميل والمطوّر */}
      <motion.div aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 92px)', width: 120, height: 3, borderRadius: 3, background: 'rgba(240,216,148,.18)', overflow: 'hidden' }}>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 3, ease: 'easeInOut' }} style={{ height: '100%', background: '#D9B55A', transformOrigin: 'right' }} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: .9, y: 0 }} transition={{ delay: 2.9 }}
        style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 26px)', textAlign: 'center', fontSize: 11.5, color: '#A9C2B7', lineHeight: 1.8 }}>
        تم تصميم وتطوير التطبيق بواسطة<br /><b style={{ color: '#D9B55A', direction: 'ltr', unicodeBidi: 'isolate', letterSpacing: .5 }}>{APP.developer}</b>
      </motion.div>
    </motion.div>
  );
}
