// أسماء الله الحسنى: بحث + شبكة + لوح المعنى، ونسخ ومشاركة
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Copy, Share2 } from 'lucide-react';
import { ASMAA, ASMAA_NOTE } from '../data/asmaa.js';
import { ar } from '../lib/arabic.js';
import { TopBar, toast } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';

const strip = (s) => s.replace(/[ً-ٰٟ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const text = (x) => `${x.n}: ${x.m}`;
async function share(t) {
  if (navigator.share) { try { await navigator.share({ text: t + '\n\nمن تطبيق الرفيق' }); return; } catch { return; } }
  try { await navigator.clipboard.writeText(t); toast('تم النسخ'); } catch { toast('تعذّر النسخ'); }
}

export default function Asmaa() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const list = useMemo(() => { const k = strip(q.trim()); return k ? ASMAA.filter((x) => strip(x.n + ' ' + x.m).includes(k)) : ASMAA; }, [q]);
  return (
    <div className="screen no-nav">
      <TopBar title="أسماء الله الحسنى" sub={`${ar(99)} اسمًا ومعانيها`} />
      <div className="card small" style={{ lineHeight: 1.9 }}>{ASMAA_NOTE}</div>
      <label className="card row" style={{ padding: '0 14px', minHeight: 48 }}>
        <Search size={18} className="muted" aria-hidden="true" />
        <span className="sr">ابحث في الأسماء</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: الرحمن، رزق، مغفرة…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 46 }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {list.map((x, k) => (
          <motion.button key={x.i} className="card col" onClick={() => setOpen(x)} initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(k, 15) * 0.02 }}
            style={{ padding: '12px 6px', gap: 2, alignItems: 'center', cursor: 'pointer', color: 'var(--text)' }}>
            <span className="xs muted">{ar(x.i)}</span>
            <b className="amiri accent" style={{ fontSize: x.n.length > 9 ? 15 : 21, lineHeight: 1.5 }}>{x.n}</b>
          </motion.button>
        ))}
      </div>
      {!list.length && <div className="card center small muted">لا توجد نتائج — جرّب كلمة أخرى.</div>}
      <AnimatePresence>{open && (
        <Sheet onClose={() => setOpen(null)} label={open.n}>
          <div className="col center" style={{ gap: 12, padding: '4px 6px 18px' }}>
            <span className="xs muted">الاسم {ar(open.i)} من ٩٩</span>
            <b className="amiri accent" style={{ fontSize: 40, lineHeight: 1.6 }}>{open.n}</b>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 2 }}>{open.m}</p>
            <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
              {open.i > 1 && <button className="btn soft" onClick={() => setOpen(ASMAA[open.i - 2])}>السابق</button>}
              <button className="btn ghost" onClick={() => share(text(open))} aria-label="مشاركة"><Share2 size={16} /></button>
              <button className="btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(text(open)); toast('تم النسخ'); } catch { toast('تعذّر النسخ'); } }} aria-label="نسخ"><Copy size={16} /></button>
              {open.i < 99 && <button className="btn" onClick={() => setOpen(ASMAA[open.i])}>التالي</button>}
            </div>
          </div>
        </Sheet>
      )}</AnimatePresence>
    </div>
  );
}
