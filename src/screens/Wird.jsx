import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HandCount from '../components/HandCount.jsx';
import { Award, Undo2, RotateCcw, Hand, ChevronLeft } from 'lucide-react';
import { useStore } from '../store.js';
import { WIRD, MILESTONES } from '../data/wird.js';
import { ar, arNum, todayKey } from '../lib/arabic.js';
import { sound } from '../lib/sound.js';
import { vibrate } from '../lib/haptics.js';
import { TopBar, toast } from '../components/ui.jsx';

const R = 128;
const EMPTY = {};

export default function Wird({ id }) {
  const [k, setK] = useState(() => Math.max(0, WIRD.findIndex((w) => w.id === id)));
  const [armed, setArmed] = useState(null);
  const [hand, setHand] = useState(false);
  const counts = useStore((s) => s.days[todayKey()]?.wird) || EMPTY;
  const addWird = useStore((s) => s.addWird);
  const resetWird = useStore((s) => s.resetWird);
  const goal = useStore((s) => s.settings.wirdGoal);
  const z = WIRD[k];
  const c = counts[z.id] || 0;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const add = (n) => {
    sound.unlock();
    const before = c, after = c + n;
    const hit = MILESTONES.filter((m) => before < m && after >= m).pop();
    const tb = total, ta = total + n;
    addWird(z.id, n);
    if (hit) { sound.milestone(); vibrate([30, 60, 30, 60, 60]); toast(`ما شاء الله! بلغت ${arNum(hit)} في «${z.short}» — وسام جديد`); }
    else if (tb < goal && ta >= goal) { sound.complete(); vibrate([30, 60, 60]); toast(`أتممت هدفك اليومي: ${arNum(goal)} ذكر — تقبّل الله`); }
    else if (after % 33 === 0) { sound.next(); vibrate(25); }
    else { sound.tap(); vibrate(9); }
  };

  const lit = c > 0 && c % 33 === 0 ? 33 : c % 33;
  const nextM = MILESTONES.find((m) => m > c);

  return (
    <div className="screen no-nav">
      <TopBar title="الورد اليومي" sub={`مجموع اليوم ${arNum(total)} من ${arNum(goal)}`} fallback="/" />

      <div className="chips" role="tablist" aria-label="اختر الذكر">
        {WIRD.map((w, i) => (
          <button key={w.id} role="tab" aria-selected={i === k} className={'chip' + (i === k ? ' on' : '')} onClick={() => setK(i)}>
            {w.short}{counts[w.id] ? ` · ${arNum(counts[w.id])}` : ''}
          </button>
        ))}
      </div>

      <motion.article key={z.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card col center" style={{ gap: 8, minHeight: 130, justifyContent: 'center' }}>
        <p className="amiri" style={{ margin: 0, fontSize: z.long ? 17 : z.text.length > 40 ? 21 : 27, lineHeight: 1.9 }}>{z.text}</p>
        <div className="small" style={{ lineHeight: 1.8 }}><b className="accent">الفضل: </b>{z.reward} <span className="muted">— {z.src}</span></div>
      </motion.article>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <div style={{ position: 'relative', width: R * 2 + 16, height: R * 2 + 16 }}>
          {Array.from({ length: 33 }, (_, j) => {
            const a = (j / 33) * Math.PI * 2 - Math.PI / 2; const on = j < lit;
            return <span key={j} aria-hidden="true" style={{ position: 'absolute', left: R + 8 + R * Math.cos(a) - 6.5, top: R + 8 + R * Math.sin(a) - 6.5, width: 13, height: 13, borderRadius: '50%', background: on ? 'var(--acc)' : 'var(--surf2)', boxShadow: on ? '0 0 8px color-mix(in srgb, var(--acc) 70%, transparent)' : 'none', transition: 'background .2s' }} />;
          })}
          <motion.button whileTap={{ scale: .92 }} onClick={() => add(1)} aria-label={`سبّح — العدد ${c}`}
            style={{ position: 'absolute', left: '50%', top: '50%', width: 196, height: 196, margin: '-98px 0 0 -98px', borderRadius: '50%', border: '1px solid var(--line)', background: 'radial-gradient(circle at 50% 30%, var(--surf2), var(--surf))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 20px 40px -16px rgba(0,0,0,.5)' }}>
            <span className="num" style={{ fontSize: 58, lineHeight: 1.1 }}>{arNum(c)}</span>
            <span className="xs muted">{nextM ? `الهدف القادم ${arNum(nextM)}` : 'ما شاء الله، تجاوزت ١٠٠٠'}</span>
          </motion.button>
        </div>
      </div>

      <motion.button whileTap={{ scale: .97 }} className="hand-btn" onClick={() => { setHand(true); sound.tap(); }}>
        <span className="hc-ic"><Hand size={22} /></span>
        <span className="col" style={{ flex: 1, gap: 2, textAlign: 'start' }}><b>عدّيت على إيدك أو سبحتك؟</b><span className="xs muted">اكتب العدد ونحسبه لك في الورد والأوسمة</span></span>
        <ChevronLeft size={18} className="muted" />
      </motion.button>

      <section aria-label="أوسمة هذا الذكر">
        <div className="xs muted" style={{ marginBottom: 8 }}>أوسمة «{z.short}» اليوم</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }}>
          {MILESTONES.map((m) => {
            const got = c >= m;
            return (
              <div key={m} className="col center" style={{ alignItems: 'center', gap: 4, padding: '9px 0', borderRadius: 16, background: got ? 'color-mix(in srgb, var(--acc) 16%, transparent)' : 'var(--surf)', border: '1px solid ' + (got ? 'var(--acc)' : 'var(--line)'), color: got ? 'var(--acc)' : 'var(--muted)' }}>
                <Award size={20} aria-hidden="true" /><span className="xs" style={{ fontWeight: 600 }}>{arNum(m)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => { if (c > 0) { addWird(z.id, -1); vibrate(8); } }}><Undo2 size={17} />تراجع</button>
        <button className="btn soft" style={{ flex: 1 }} onClick={() => add(33)}><span className="ltr">+٣٣</span></button>
        <button className="btn soft" style={{ flex: 1 }} onClick={() => { if (!c) return; if (armed === z.id) { resetWird(z.id); setArmed(null); toast('تم تصفير العدّاد'); } else { setArmed(z.id); toast('اضغط «تصفير» مرة أخرى للتأكيد'); setTimeout(() => setArmed(null), 3000); } }}><RotateCcw size={17} />تصفير</button>
      </div>
      <AnimatePresence>{hand && <HandCount z={z} current={c} total={total} goal={goal} onAdd={(n) => add(n)} onUndo={(n) => addWird(z.id, -n)} onClose={() => setHand(false)} />}</AnimatePresence>
    </div>
  );
}
