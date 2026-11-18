// شاشة الأذان: مشهد كامل متحرك (سماء حسب وقت الصلاة، مسجد ومئذنة، نجوم ونور)، وتظهر كلمات الأذان جملة بجملة مع صوت المؤذن
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

function Scene({ k }) {
  const c = SKY[k] || SKY.isha; const night = k === 'isha' || k === 'fajr' || k === 'maghrib';
  const stars = useMemo(() => [...Array(46)].map(() => ({ x: Math.random() * 100, y: Math.random() * 55, r: Math.random() * 1.6 + .4, d: Math.random() * 3 })), []);
  return (
    <div className="az-scene" aria-hidden="true" style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 38%, ${c[2]} 72%, ${c[3]} 100%)` }}>
      {night && stars.map((s, i) => <motion.i key={i} className="az-star" style={{ left: s.x + '%', top: s.y + '%', width: s.r * 2, height: s.r * 2 }} animate={{ opacity: [.2, 1, .2] }} transition={{ duration: 2 + s.d, repeat: Infinity, delay: s.d }} />)}
      {k === 'isha' || k === 'fajr' ? (
        <motion.svg className="az-moon" viewBox="0 0 100 100" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 2 }}><path d="M64 14a38 38 0 1 0 0 72a30 30 0 1 1 0-72z" fill="#FBE7A6" /></motion.svg>
      ) : (
        <motion.div className="az-sun" style={{ background: k === 'maghrib' ? '#FFB067' : '#FFF3C4', top: k === 'maghrib' ? '52%' : k === 'asr' ? '30%' : '12%' }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity }} />
      )}
      <motion.div className="az-rays" animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }} />
      <svg className="az-mosque" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax meet">
        <defs><linearGradient id="azm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0f1a" stopOpacity=".92" /><stop offset="1" stopColor="#05070c" /></linearGradient></defs>
        <g fill="url(#azm)">
          <rect x="54" y="40" width="16" height="130" /><path d="M50 40h24l-12-26z" /><rect x="56" y="62" width="12" height="4" fill="#F7C96B" opacity=".7" />
          <rect x="330" y="40" width="16" height="130" /><path d="M326 40h24l-12-26z" /><rect x="332" y="62" width="12" height="4" fill="#F7C96B" opacity=".7" />
          <path d="M120 170V112q80-20 160 0v58z" />
          <path d="M140 112q60-86 120 0z" />
          <path d="M100 170v-40q20-24 40 0v40zM260 170v-40q20-24 40 0v40z" />
          <rect x="198" y="16" width="4" height="12" /><circle cx="200" cy="14" r="4" />
          <rect x="0" y="150" width="400" height="20" />
        </g>
        {[[165, 128], [190, 128], [210, 128], [235, 128], [112, 146], [282, 146]].map(([x, y], i) => <motion.rect key={i} x={x} y={y} width="10" height="16" rx="5" fill="#F7C96B" animate={{ opacity: [.55, 1, .55] }} transition={{ duration: 3, repeat: Infinity, delay: i * .4 }} />)}
        <motion.circle cx="62" cy="64" r="22" fill="#F7C96B" opacity=".18" animate={{ r: [16, 30, 16], opacity: [.25, .05, .25] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.circle cx="338" cy="64" r="22" fill="#F7C96B" opacity=".18" animate={{ r: [16, 30, 16], opacity: [.25, .05, .25] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} />
      </svg>
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
        <div className="az-sm">حان الآن موعد</div>
        <h1 className="ruqaa az-title">أذان {prayer.name}</h1>
        <div className="az-sm">{fmtTime(prayer.time, tz)} — بصوت {MUEZZIN}</div>
      </motion.header>

      <div className="az-center">
        {!ended ? (
          idx >= 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={idx} className="az-phrase" initial={{ opacity: 0, y: 30, filter: 'blur(12px)', scale: .92 }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 1.1, ease: [.2, .8, .2, 1] }}>
                  {cues[idx][1]}
                </motion.div>
              </AnimatePresence>
              <motion.div key={'r' + idx} className="az-reply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>ردّد: {reply(cues[idx][1])}</motion.div>
              <div className="az-dots">{cues.map((_, i) => <i key={i} className={i < idx ? 'done' : i === idx ? 'now' : ''} />)}</div>
            </>
          ) : (
            <motion.div className="col center" style={{ gap: 14, alignItems: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
          {blocked ? <button className="btn q-go" onClick={start}><Volume2 size={18} /> شغّل الأذان مع الكلمات</button>
            : <button className="az-stop" onClick={() => { stopAdhan(); setStarted(true); }}><Square size={15} fill="currentColor" /> إيقاف الأذان</button>}
        </div>
      )}
    </motion.div>
  );
}
