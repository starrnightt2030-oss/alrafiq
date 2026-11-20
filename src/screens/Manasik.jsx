// دليل العمرة والحج: خطوات العمرة (تقدر تعلّم على كل خطوة وانت بتؤديها)، أيام الحج، الأركان، المواقيت، محظورات الإحرام
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import { UMRAH, HAJJ, ARKAN, MIQAT, MAHZURAT, MANASIK_NOTE } from '../data/manasik.js';
import { useStore } from '../store.js';
import { ar } from '../lib/arabic.js';
import { TopBar } from '../components/ui.jsx';

const TABS = [['umrah', 'العمرة'], ['hajj', 'الحج'], ['miqat', 'المواقيت'], ['mahzur', 'المحظورات']];

function Dua({ x }) {
  if (!x.dua) return null;
  return (
    <div className="col" style={{ gap: 4, background: 'var(--surf2)', borderRadius: 14, padding: '10px 12px' }}>
      <span className="amiri" style={{ fontSize: 18, lineHeight: 2 }}>{x.dua}</span>
      <span className="xs muted">{x.src}</span>
    </div>
  );
}

export default function Manasik() {
  const [tab, setTab] = useState('umrah');
  const done = useStore((s) => s.umrahSteps) || [], setDone = useStore((s) => s.setUmrahSteps);
  const toggle = (i) => setDone(done.includes(i) ? done.filter((x) => x !== i) : [...done, i]);
  return (
    <div className="screen no-nav">
      <TopBar title="دليل العمرة والحج" sub="خطوة بخطوة مع الأدعية الثابتة" />
      <div className="row" role="tablist" style={{ gap: 4, background: 'var(--surf2)', borderRadius: 16, padding: 4 }}>
        {TABS.map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} style={{ flex: 1, minHeight: 40, borderRadius: 12, border: 0, background: tab === k ? 'var(--surf)' : 'transparent', color: tab === k ? 'var(--acc)' : 'var(--muted)', fontWeight: tab === k ? 700 : 500, fontSize: 13 }}>{t}</button>)}
      </div>

      {tab === 'umrah' && (<>
        <div className="card small" style={{ lineHeight: 1.9 }}>أركان العمرة: <b>{ARKAN.umrah.join('، ')}</b>. علّم على كل خطوة وانت بتأديها. <span className="muted">({ar(done.length)} من {ar(UMRAH.length)})</span></div>
        {UMRAH.map((x, i) => { const on = done.includes(i); return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card col" style={{ gap: 8, border: on ? '2px solid var(--acc)' : undefined }}>
            <button onClick={() => toggle(i)} className="row" style={{ gap: 10, border: 0, background: 'transparent', padding: 0, color: 'var(--text)', textAlign: 'right', cursor: 'pointer' }} aria-pressed={on}>
              <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 700, background: on ? 'var(--acc)' : 'var(--surf2)', color: on ? 'var(--onAcc)' : 'var(--text)' }}>{on ? <Check size={18} /> : ar(i + 1)}</span>
              <b style={{ fontSize: 16, flex: 1 }}>{x.t}</b>
            </button>
            <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }} className="small">{x.do.map((d) => <li key={d}>{d}</li>)}</ul>
            <Dua x={x} />
          </motion.div>
        ); })}
        {done.length > 0 && <button className="btn ghost" onClick={() => setDone([])}>ابدأ عمرة جديدة</button>}
      </>)}

      {tab === 'hajj' && (<>
        <div className="card small" style={{ lineHeight: 1.9 }}>أركان الحج: <b>{ARKAN.hajj.join('، ')}</b>. ومن أعظمها الوقوف بعرفة: «الحج عرفة» — رواه الترمذي.</div>
        {HAJJ.map((x, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card col" style={{ gap: 8 }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="xs" style={{ flex: 'none', padding: '4px 10px', borderRadius: 999, background: 'var(--acc)', color: 'var(--onAcc)', fontWeight: 700 }}>{x.d}</span>
              <b style={{ fontSize: 16 }}>{x.t}</b>
            </div>
            <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }} className="small">{x.do.map((d) => <li key={d}>{d}</li>)}</ul>
            <Dua x={x} />
          </motion.div>
        ))}
      </>)}

      {tab === 'miqat' && (<>
        <div className="card small" style={{ lineHeight: 1.9 }}>المواقيت حدّدها النبي ﷺ، ومن أراد الحج أو العمرة لا يتجاوزها إلا محرمًا: «هنّ لهنّ ولمن أتى عليهن من غير أهلهن» — متفق عليه.</div>
        {MIQAT.map(([n, d]) => <div key={n} className="card col" style={{ gap: 4 }}><b>{n}</b><span className="small muted" style={{ lineHeight: 1.8 }}>{d}</span></div>)}
      </>)}

      {tab === 'mahzur' && (<>
        <div className="card small" style={{ lineHeight: 1.9 }}>محظورات الإحرام: أشياء تحرم بعد نية الإحرام حتى التحلل. من فعل شيئًا منها ناسيًا أو جاهلًا فلا شيء عليه في قول كثير من العلماء.</div>
        {MAHZURAT.map(([n, d]) => <div key={n} className="card between" style={{ gap: 8 }}><b className="small" style={{ flex: 1 }}>{n}</b><span className="xs" style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--surf2)' }}>{d}</span></div>)}
      </>)}

      <div className="card row xs muted" style={{ gap: 8, alignItems: 'flex-start', lineHeight: 1.9 }}><Info size={16} style={{ flex: 'none', marginTop: 3 }} /><span>{MANASIK_NOTE}</span></div>
    </div>
  );
}
