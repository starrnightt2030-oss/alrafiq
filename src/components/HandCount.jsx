// «عدّيت على إيدي»: إدخال عدد الذكر اللي اتعدّ على الأصابع أو السبحة، وإضافته للورد بعد التأكيد
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Minus, Plus, Check, Undo2 } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { ar, arNum } from '../lib/arabic.js';
import { MILESTONES } from '../data/wird.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';

const QUICK = [33, 100, 300, 500, 1000];
const MAX = 10000;
const toLatin = (s) => s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g, '');

export default function HandCount({ z, current, total, goal, onAdd, onUndo, onClose }) {
  const [txt, setTxt] = useState('');
  const [done, setDone] = useState(null);
  const n = Math.min(MAX, +toLatin(txt) || 0);
  const after = current + n;
  const medals = MILESTONES.filter((m) => current < m && after >= m);
  const goalHit = total < goal && total + n >= goal;
  const set = (v) => { setTxt(v ? String(Math.max(0, Math.min(MAX, v))) : ''); sound.tap(); vibrate(6); };
  const confirm = () => { if (!n) { vibrate([20, 40, 20]); return; } onAdd(n); setDone(n); };

  return (
    <Sheet onClose={onClose} label="إضافة عدد من السبحة أو الأصابع">
      <AnimatePresence mode="wait">
        {done == null ? (
          <motion.div key="f" className="col" style={{ gap: 14 }} exit={{ opacity: 0, x: 40 }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="hc-ic"><Hand size={24} /></span>
              <div className="col" style={{ gap: 2 }}><b className="h2">عدّيت على إيدك؟</b><span className="xs muted">اكتب العدد اللي سبّحته على صوابعك أو سبحتك ونضيفه لوردك</span></div>
            </div>
            <div className="hc-zikr">{z.text || z.short}</div>
            <div className="hc-entry">
              <button className="hc-step" aria-label="إنقاص ١٠" onClick={() => set(n - 10)}><Minus size={20} /></button>
              <input className="hc-input num" inputMode="numeric" autoFocus value={txt ? ar(n) : ''} placeholder="٠" aria-label="العدد" onChange={(e) => setTxt(toLatin(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && confirm()} />
              <button className="hc-step" aria-label="زيادة ١٠" onClick={() => set(n + 10)}><Plus size={20} /></button>
            </div>
            <div className="hc-quick">{QUICK.map((q) => <button key={q} className={'chip' + (n === q ? ' on' : '')} onClick={() => set(q)}>{arNum(q)}</button>)}</div>
            <div className="hc-preview">
              <div className="between small"><span className="muted">عدّك الحالي</span><b className="num">{arNum(current)}</b></div>
              <div className="between small"><span className="muted">بعد الإضافة</span><motion.b key={after} className="num accent" initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{arNum(after)}</motion.b></div>
              {medals.length > 0 && <div className="xs" style={{ color: '#5FC59A' }}>🏅 هتاخد {medals.length > 1 ? `${ar(medals.length)} أوسمة` : `وسام ${arNum(medals[0])}`}</div>}
              {goalHit && <div className="xs" style={{ color: '#5FC59A' }}>🎯 وهتكمّل هدفك اليومي ({arNum(goal)} ذكر)</div>}
            </div>
            <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={confirm} style={{ opacity: n ? 1 : .55 }}><Check size={18} /> {n ? `تمّ، احسبهم ${arNum(n)}` : 'اكتب العدد الأول'}</motion.button>
          </motion.div>
        ) : (
          <motion.div key="d" className="col center" style={{ gap: 12, alignItems: 'center', padding: '8px 0' }} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.span className="hc-ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}><Check size={40} strokeWidth={2.6} /></motion.span>
            <b className="h2">اتحسبوا {arNum(done)} — تقبّل الله</b>
            <span className="small muted">«{z.short}» بقى {arNum(current)} النهارده</span>
            <div className="grid2" style={{ width: '100%' }}>
              <button className="btn" onClick={onClose}>تمام</button>
              <button className="btn ghost" onClick={() => { onUndo(done); setDone(null); setTxt(String(done)); }}><Undo2 size={16} /> تراجع</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
