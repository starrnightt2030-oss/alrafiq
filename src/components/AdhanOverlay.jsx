import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Square, X } from 'lucide-react';
import { playAdhan, stopAdhan, useAdhanState, MUEZZIN } from '../lib/adhan.js';
import { fmtTime } from '../lib/prayer.js';

// شاشة الأذان: تظهر عند دخول الوقت، وتعرض دعاء ما بعد الأذان
export default function AdhanOverlay({ prayer, tz, onClose, autoplay = true }) {
  const { playing, phase } = useAdhanState();
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  // في تطبيق أندرويد يرفع إشعار النظام الأذان بصوته، فلا نشغّله مرة ثانية هنا
  useEffect(() => { if (!autoplay) { setBlocked(true); return; } playAdhan(prayer.key).then((ok) => { setBlocked(!ok); setStarted(ok); }); return () => stopAdhan(); }, [prayer.key]);
  const ended = started && (!playing || phase === 'dua');
  return (
    <motion.div role="dialog" aria-label={'أذان ' + prayer.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'radial-gradient(circle at 50% 35%, var(--hero), var(--bg) 75%)', color: 'var(--heroText)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 14 }}>
      <button className="icon-btn" aria-label="إغلاق" onClick={() => { stopAdhan(); onClose(); }} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 14px)', left: 16 }}><X size={20} /></button>
      <motion.svg width="150" height="150" viewBox="0 0 100 100" aria-hidden="true" animate={{ rotate: playing ? 360 : 0 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
        <path d="M50 4l11 23 25-4-14 21 14 21-25-4-11 23-11-23-25 4 14-21L14 23l25 4z" fill="none" stroke="var(--acc)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="var(--acc)" strokeWidth="1" />
      </motion.svg>
      <div className="small" style={{ opacity: .85 }}>حان الآن موعد</div>
      <div className="ruqaa" style={{ fontSize: 46, color: 'var(--acc)' }}>أذان {prayer.name}</div>
      <div className="small" style={{ opacity: .85 }}>{fmtTime(prayer.time, tz)} · بصوت {MUEZZIN}</div>
      {!ended ? (
        <>
          <div className="small" style={{ opacity: .9, maxWidth: 340, lineHeight: 1.9 }}>ردّد مع المؤذن: «إذا سمعتم المؤذن فقولوا مثل ما يقول» (متفق عليه)</div>
          {blocked ? <button className="btn" onClick={() => playAdhan(prayer.key).then((ok) => { setBlocked(!ok); setStarted(ok); })}><Volume2 size={18} />تشغيل الأذان</button>
            : <button className="btn ghost" style={{ color: 'var(--heroText)' }} onClick={() => { stopAdhan(); setStarted(true); }}><Square size={16} />إيقاف الأذان</button>}
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card col" style={{ maxWidth: 420, gap: 8, color: 'var(--text)' }}>
          <div className="xs accent" style={{ fontWeight: 600 }}>دعاء ما بعد الأذان{playing && phase === 'dua' ? ' — يُتلى الآن' : ''}</div>
          <div className="amiri" style={{ fontSize: 19, lineHeight: 2 }}>اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ</div>
          <div className="xs muted">«حلّت له شفاعتي يوم القيامة» — رواه البخاري</div>
          <button className="btn" onClick={() => { stopAdhan(); onClose(); }}>تقبّل الله</button>
        </motion.div>
      )}
    </motion.div>
  );
}
