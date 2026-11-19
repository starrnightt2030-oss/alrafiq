// الأربعون النووية: قائمة بالعناوين ومتابعة الحفظ، وقارئ لكل حديث بالتخريج والفائدة
import { motion } from 'framer-motion';
import { Check, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store.js';
import { NAWAWI } from '../data/nawawi.js';
import { ar } from '../lib/arabic.js';
import { go } from '../router.js';
import { TopBar, toast } from '../components/ui.jsx';

async function share(h) {
  const t = `الحديث ${ar(h.n)} من الأربعين النووية — ${h.t}\n\n${h.a}\n\n[${h.src}]`;
  if (navigator.share) { try { await navigator.share({ text: t + '\n\nمن تطبيق الرفيق' }); return; } catch { return; } }
  try { await navigator.clipboard.writeText(t); toast('تم نسخ الحديث'); } catch { toast('تعذّر النسخ'); }
}

export default function Nawawi({ n }) {
  const done = useStore((s) => s.nawawi) || [];
  const toggle = useStore((s) => s.toggleNawawi);
  const scale = useStore((s) => s.settings.textScale);
  const h = n && NAWAWI[+n - 1];
  if (h) {
    const on = done.includes(h.n);
    return (
      <div className="screen no-nav">
        <TopBar title={`الحديث ${ar(h.n)}`} sub={h.t} fallback="/nawawi" right={<button className="icon-btn" aria-label="مشاركة" onClick={() => share(h)}><Share2 size={18} /></button>} />
        <motion.article key={h.n} className="card col" style={{ gap: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="amiri" style={{ margin: 0, fontSize: 19 * scale, lineHeight: 2.15, textAlign: 'justify' }}>{h.a}</p>
          <span className="xs" style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 999, background: 'var(--surf2)' }}>رواه {h.src}</span>
        </motion.article>
        <div className="card hl small" style={{ lineHeight: 1.9 }}><b className="accent">من فوائد الحديث: </b>{h.b}</div>
        <button className={'btn' + (on ? ' soft' : '')} onClick={() => { toggle(h.n); if (!on) toast('ما شاء الله! أُضيف لمحفوظاتك'); }}><Check size={18} /> {on ? 'محفوظ ✓' : 'حفظته'}</button>
        <div className="between">
          {h.n > 1 ? <button className="btn ghost" onClick={() => go('/nawawi/' + (h.n - 1))}><ChevronRight size={18} /> السابق</button> : <span />}
          {h.n < NAWAWI.length ? <button className="btn ghost" onClick={() => go('/nawawi/' + (h.n + 1))}>التالي <ChevronLeft size={18} /></button> : <span />}
        </div>
      </div>
    );
  }
  return (
    <div className="screen no-nav">
      <TopBar title="الأربعون النووية" sub={`حفظت ${ar(done.length)} من ${ar(NAWAWI.length)} حديثًا`} />
      <div className="card small muted" style={{ lineHeight: 1.9 }}>جمعها الإمام النووي رحمه الله (ت ٦٧٦هـ)، اثنان وأربعون حديثًا تدور عليها قواعد الدين، أكثرها من الصحيحين.</div>
      {NAWAWI.map((x, i) => { const on = done.includes(x.n); return (
        <motion.a key={x.n} href={'#/nawawi/' + x.n} className="card row" style={{ gap: 12, textDecoration: 'none', color: 'var(--text)', padding: '12px 14px' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
          <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 700, background: on ? 'var(--acc)' : 'var(--surf2)', color: on ? 'var(--onAcc)' : 'var(--text)' }}>{on ? <Check size={18} /> : ar(x.n)}</span>
          <span className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}><b style={{ fontSize: 15 }}>{x.t}</b><span className="xs muted">رواه {x.src}</span></span>
          <ChevronLeft size={18} className="muted" />
        </motion.a>
      ); })}
    </div>
  );
}
