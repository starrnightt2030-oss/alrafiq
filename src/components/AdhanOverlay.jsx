// شاشة الأذان: صورة خلفية لكل صلاة بحركة هادية، وتظهر كلمات الأذان جملة بجملة مع صوت المؤذن
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, Square, X } from 'lucide-react';
import { playAdhan, stopAdhan, useAdhanState, adhanTime, MUEZZIN } from '../lib/adhan.js';
import { fmtTime } from '../lib/prayer.js';
import { ar } from '../lib/arabic.js';

const T = 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ', SH = 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ', RS = 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ', HS = 'حَيَّ عَلَى الصَّلَاةِ', HF = 'حَيَّ عَلَى الْفَلَاحِ', L = 'لَا إِلَٰهَ إِلَّا اللَّهُ';
const HAWQALA = 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ';
// توقيت بداية كل جملة (بالثانية) في تسجيل الشيخ نصر الدين طوبار — مستخرج من فواصل الصوت
const CUES = {
  adhan: [[0, T], [12.7, T], [30.5, SH], [47.3, SH], [65.8, RS], [86.6, RS], [107.5, HS], [127.4, HS], [149.8, HF], [163.9, HF], [182.9, T], [197.4, L]],
  fajr: [[0, T], [18.8, T], [39, SH], [59.5, SH], [78.8, RS], [101.2, RS], [114.6, HS], [136.4, HS], [148.8, HF], [172.5, HF], [185.8, T], [199.2, L]],
};
const reply = (t) => (t === HS || t === HF ? HAWQALA : t);

// ألوان السماء لكل صلاة
const SKY = {
  fajr: ['#0B1636', '#2B2E6B', '#C76B7E', '#F4B183'],
  dhuhr: ['#0E4E7A', '#2E86B8', '#8CC6E3', '#E9F4F8'],
  asr: ['#3A2A12', '#8C5A1F', '#D99A3E', '#F4D49A'],
  maghrib: ['#1B0F2E', '#5A2350', '#C2463F', '#F59A4A'],
  isha: ['#03060F', '#0A1430', '#16285A', '#203A73'],
};

// خلفية الصلاة: صورتين لكل صلاة بالتبادل يوم بيوم (نفس صور شاشة الأذان فوق القفل)
export function adhanBg(k) {
  const key = SKY[k] ? k : 'isha';
  const now = new Date(); const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  return new URL(`img/adhan/${key}${day % 2 === 0 ? 1 : 2}.webp`, document.baseURI).href;
}

function Scene({ k }) {
  const c = SKY[k] || SKY.isha; const night = k === 'isha' || k === 'fajr';
  const src = useMemo(() => adhanBg(k), [k]);
  const stars = useMemo(() => [...Array(18)].map(() => ({ x: Math.random() * 100, y: Math.random() * 35, r: Math.random() * 1.3 + .4, d: Math.random() * 3 })), []);
  return (
    <div className="az-scene" aria-hidden="true" style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 38%, ${c[2]} 72%, ${c[3]} 100%)` }}>
      <motion.img className="az-bg" src={src} alt="" initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: [1.02, 1.1, 1.02] }} transition={{ opacity: { duration: 1.2 }, scale: { duration: 40, repeat: Infinity, ease: 'easeInOut' } }} />
      {night && stars.map((s, i) => <motion.i key={i} className="az-star" style={{ left: s.x + '%', top: s.y + '%', width: s.r * 2, height: s.r * 2 }} animate={{ opacity: [0, .9, 0] }} transition={{ duration: 2.5 + s.d, repeat: Infinity, delay: s.d }} />)}
      <motion.div className="az-glow" animate={{ opacity: [.35, .7, .35] }} transition={{ duration: 6, repeat: Infinity }} />
    </div>
  );
}

export default function AdhanOverlay({ prayer, tz, onClose, autoplay = true }) {
  const { playing, phase } = useAdhanState();
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);
  const key = prayer.key === 'fajr' ? 'fajr' : 'adhan';
  const cues = CUES[key];
  useEffect(() => { if (!autoplay) { setBlocked(true); return; } playAdhan(prayer.key).then((ok) => { setBlocked(!ok); setStarted(ok); }); return () => stopAdhan(); }, [prayer.key]);
  useEffect(() => { const iv = setInterval(() => setT(adhanTime()), 200); return () => clearInterval(iv); }, []);
  const idx = started && phase === 'adhan' ? cues.reduce((n, c, i) => (t >= c[0] ? i : n), 0) : -1;
  const ended = started && (!playing || phase === 'dua');
  const start = () => playAdhan(prayer.key).then((ok) => { setBlocked(!ok); setStarted(ok); });
  const close = () => { stopAdhan(); onClose(); };

  return (
    <motion.div className="az" role="dialog" aria-label={'أذان ' + prayer.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .8 }}>
      <Scene k={prayer.key} />
      <div className="az-shade" aria-hidden="true" />
      <button className="az-x" aria-label="إغلاق" onClick={close}><X size={20} /></button>

      <motion.header className="az-head" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .3 }}>
        <div className="az-brand">✦ الرفيق ✦</div>
        <div className="az-sm">حان الآن موعد أذان</div>
        <h1 className="ruqaa az-title">{prayer.name}</h1>
        <div className="az-time">{fmtTime(prayer.time, tz)}</div>
      </motion.header>

      <div className="az-center">
        {!ended ? (
          idx >= 0 ? (
            <>
              <div className="az-card">
              <div className="az-label">يُرفع الآن</div>
              <div className="az-orn">۞</div>
              <AnimatePresence mode="wait">
                <motion.div key={idx} className="az-phrase" initial={{ opacity: 0, y: 30, filter: 'blur(12px)', scale: .92 }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 1.1, ease: [.2, .8, .2, 1] }}>
                  {cues[idx][1]}
                </motion.div>
              </AnimatePresence>
              <motion.div key={'r' + idx} className="az-reply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>ردّد: {reply(cues[idx][1])}</motion.div>
              <div className="az-dots">{cues.map((_, i) => <i key={i} className={i < idx ? 'done' : i === idx ? 'now' : ''} />)}</div>
              </div>
            </>
          ) : (
            <motion.div className="az-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="az-phrase" style={{ fontSize: 'clamp(26px, 8vw, 40px)' }}>{T}</div>
              <div className="az-sm" style={{ maxWidth: 320, lineHeight: 1.9 }}>«إذا سمعتم المؤذن فقولوا مثل ما يقول» — متفق عليه</div>
            </motion.div>
          )
        ) : (
          <motion.div className="az-dua" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="xs" style={{ color: '#F7C96B', fontWeight: 700 }}>دعاء ما بعد الأذان{playing && phase === 'dua' ? ' — يُتلى الآن' : ''}</div>
            <div className="amiri" style={{ fontSize: 20, lineHeight: 2.1 }}>اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ</div>
            <div className="xs" style={{ opacity: .8 }}>«حلّت له شفاعتي يوم القيامة» — رواه البخاري</div>
            <button className="btn" onClick={close}>تقبّل الله</button>
          </motion.div>
        )}
      </div>

      {!ended && (
        <div className="az-foot">
          <div className="az-sm" style={{ marginBottom: 8, opacity: .75 }}>بصوت {MUEZZIN}</div>
          {blocked ? <button className="btn q-go" onClick={start}><Volume2 size={18} /> شغّل الأذان مع الكلمات</button>
            : <button className="az-stop" onClick={() => { stopAdhan(); setStarted(true); }}><Square size={15} fill="currentColor" /> إيقاف الأذان</button>}
        </div>
      )}
    </motion.div>
  );
}
