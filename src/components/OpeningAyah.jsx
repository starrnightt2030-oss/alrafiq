// آية الافتتاح بعد المقدمة: ﴿فاذكروني أذكركم﴾ (البقرة ١٥٢) بصوت الشيخ محمد صديق المنشاوي،
// والكلمات تنكتب كلمة كلمة مع التلاوة بخط المصحف، ثم يتلاشى المشهد إلى التطبيق
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const WORDS = ['فَٱذۡكُرُونِيٓ', 'أَذۡكُرۡكُمۡ', 'وَٱشۡكُرُواْ', 'لِي', 'وَلَا', 'تَكۡفُرُونِ'];
const LOCAL = new URL('audio/intro/2-152.mp3', document.baseURI).href;
const NET = 'https://everyayah.com/data/Minshawy_Murattal_128kbps/002152.mp3';
// نسبة بداية كل كلمة من مدة التلاوة (تقريبية حسب طول الكلمة، مع سكتة بسيطة في الأول)
const W = WORDS.map((w) => w.replace(/[ً-ٰٟۖ-ۭ]/g, '').length + 2);
const STARTS = W.reduce((a, w, i) => { a.push(i ? a[i - 1] + W[i - 1] : 0); return a; }, []).map((x) => 0.04 + 0.86 * (x / W.reduce((s, v) => s + v, 0)));

export default function OpeningAyah({ onDone }) {
  const [shown, setShown] = useState(0);
  const [muted, setMuted] = useState(false);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };

  useEffect(() => {
    const a = new Audio(LOCAL); let triedNet = false, timers = [];
    let fell = false;
    const fallback = () => { if (fell) return; fell = true; // بدون صوت: الكلمات تظهر لوحدها في ٤ ثواني
      setMuted(true); timers = WORDS.map((_, i) => setTimeout(() => setShown(i + 1), 500 + i * 480)); timers.push(setTimeout(finish, 5200));
    };
    a.onerror = () => { if (!triedNet) { triedNet = true; a.src = NET; a.play().catch(fallback); } else fallback(); };
    a.ontimeupdate = () => { if (a.duration) { const p = a.currentTime / a.duration; setShown(STARTS.filter((s) => p >= s).length); } };
    a.onended = () => { setShown(WORDS.length); timers.push(setTimeout(finish, 1300)); };
    a.play().catch(() => { if (!triedNet && a.error) return; fallback(); });
    const guard = setTimeout(finish, 15000);
    return () => { a.pause(); a.src = ''; timers.forEach(clearTimeout); clearTimeout(guard); };
  }, []); // eslint-disable-line

  return (
    <motion.div onClick={finish} role="dialog" aria-label="فاذكروني أذكركم واشكروا لي ولا تكفرون — بصوت الشيخ محمد صديق المنشاوي"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: .7 }}
      style={{ position: 'fixed', inset: 0, zIndex: 99, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#F5F0E1', background: 'radial-gradient(120% 80% at 50% 42%, #0F4A3D 0%, #0A231E 48%, #04100D 100%)' }}>
      <motion.div aria-hidden="true" animate={{ scale: [1, 1.12, 1], opacity: [.35, .6, .35] }} transition={{ duration: 6, repeat: Infinity }}
        style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,216,148,.28) 0%, transparent 65%)', top: '50%', left: '50%', margin: '-260px 0 0 -230px' }} />
      {/* إطار زخرفي يُرسم */}
      <svg aria-hidden="true" viewBox="0 0 320 240" style={{ position: 'absolute', width: 'min(92vw, 460px)', top: '50%', left: '50%', transform: 'translate(-50%, -54%)' }}>
        <motion.path d="M20 40 Q160 -8 300 40 L300 200 Q160 248 20 200 Z" fill="none" stroke="#D9B55A" strokeWidth="1.2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: .8 }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
        <motion.path d="M32 50 Q160 8 288 50 L288 190 Q160 232 32 190 Z" fill="none" stroke="#F0D894" strokeWidth=".6" strokeDasharray="2 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: .3 }} />
      </svg>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: .9, y: 0 }} transition={{ delay: .3 }} className="ruqaa" style={{ position: 'relative', fontSize: 18, color: '#D9B55A', marginBottom: 6 }}>قال الله تعالى</motion.div>
      <div className="hafs" dir="rtl" style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 12px', maxWidth: 'min(78vw, 380px)', fontSize: 'clamp(26px, 7.6vw, 38px)', lineHeight: 2, textAlign: 'center' }}>
        <span style={{ color: '#D9B55A' }}>﴿</span>
        {WORDS.map((w, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }} animate={i < shown ? { opacity: 1, y: 0, filter: 'blur(0px)', color: ['#FFF6D6', '#F5F0E1'], textShadow: ['0 0 26px rgba(240,216,148,.95)', '0 0 10px rgba(240,216,148,.25)'] } : {}} transition={{ duration: .7, ease: 'easeOut' }}>{w}</motion.span>
        ))}
        <span style={{ color: '#D9B55A' }}>﴾</span>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown >= WORDS.length ? .85 : 0 }} transition={{ duration: .6 }} style={{ position: 'relative', fontSize: 13, color: '#E9DDBB', marginTop: 38 }}>سورة البقرة — الآية ١٥٢</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: .75 }} transition={{ delay: .8 }} style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 30px)', fontSize: 12, color: '#A9C2B7', textAlign: 'center', lineHeight: 1.8 }}>
        {muted ? 'المس الشاشة للمتابعة' : <>بصوت الشيخ <b style={{ color: '#D9B55A' }}>محمد صديق المنشاوي</b></>}
      </motion.div>
    </motion.div>
  );
}
