// حاسبة زكاة المال: نقود + ذهب + فضة + عروض تجارة + ديون لك − ديون عليك، ومقارنة بالنصاب (٨٥ جرام ذهب عيار ٢٤)
// الأسعار يكتبها المستخدم بنفسه (التطبيق يعمل بدون إنترنت) وتُحفظ للمرة القادمة
import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { useStore } from '../store.js';
import { arNum } from '../lib/arabic.js';
import { TopBar } from '../components/ui.jsx';

const GOLD_NISAB = 85, SILVER_NISAB = 595;
const KARATS = [24, 21, 18];
const blank = { gold: '', silver: '', cash: '', g24: '', g21: '', g18: '', silverG: '', trade: '', owed: '', debts: '', base: 'gold' };
const num = (v) => { const x = parseFloat(String(v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,]/g, '').replace('٫', '.')); return isFinite(x) && x > 0 ? x : 0; };
const money = (x) => arNum(Math.round(x * 100) / 100);

function Field({ label, hint, v, on, unit }) {
  return (
    <label className="col" style={{ gap: 4, minWidth: 0 }}>
      <span className="small" style={{ fontWeight: 600 }}>{label}{hint && <span className="xs muted"> — {hint}</span>}</span>
      <span className="row" style={{ gap: 8, border: '1px solid var(--line)', borderRadius: 14, padding: '0 12px', background: 'var(--surf2)' }}>
        <input inputMode="decimal" value={v} onChange={(e) => on(e.target.value)} placeholder="٠" style={{ flex: 1, minWidth: 0, width: '100%', minHeight: 44, border: 0, outline: 0, background: 'transparent', fontSize: 16 }} />
        {unit && <span className="xs muted">{unit}</span>}
      </span>
    </label>
  );
}

export default function Zakat() {
  const saved = useStore((s) => s.zakat), save = useStore((s) => s.setZakat);
  const [f, setF] = useState(() => ({ ...blank, gold: saved?.gold || '', silver: saved?.silver || '', base: saved?.base || 'gold' }));
  const set = (k) => (v) => { const n = { ...f, [k]: v }; setF(n); if (['gold', 'silver', 'base'].includes(k)) save({ gold: n.gold, silver: n.silver, base: n.base }); };
  const r = useMemo(() => {
    const gp = num(f.gold), sp = num(f.silver);
    const goldVal = KARATS.reduce((a, k) => a + num(f['g' + k]) * (k / 24) * gp, 0);
    const silverVal = num(f.silverG) * sp;
    const total = num(f.cash) + goldVal + silverVal + num(f.trade) + num(f.owed) - num(f.debts);
    const nisab = f.base === 'silver' ? SILVER_NISAB * sp : GOLD_NISAB * gp;
    return { goldVal, silverVal, total, nisab, ok: nisab > 0, due: nisab > 0 && total >= nisab ? total * 0.025 : 0 };
  }, [f]);
  return (
    <div className="screen no-nav">
      <TopBar title="حاسبة الزكاة" sub="زكاة المال والذهب والفضة والتجارة" />
      <div className="card col" style={{ gap: 12 }}>
        <b>الأسعار اليوم (للجرام)</b>
        <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="ذهب عيار ٢٤" v={f.gold} on={set('gold')} />
          <Field label="فضة خالصة" v={f.silver} on={set('silver')} />
        </div>
        <div className="row" style={{ gap: 8 }} role="radiogroup" aria-label="النصاب على أساس">
          <span className="xs muted">النصاب بـ:</span>
          <button role="radio" aria-checked={f.base === 'gold'} className={'chip' + (f.base === 'gold' ? ' on' : '')} onClick={() => set('base')('gold')}>الذهب (٨٥ جم)</button>
          <button role="radio" aria-checked={f.base === 'silver'} className={'chip' + (f.base === 'silver' ? ' on' : '')} onClick={() => set('base')('silver')}>الفضة (٥٩٥ جم)</button>
        </div>
      </div>
      <div className="card col" style={{ gap: 12 }}>
        <b>أموالك التي مرّ عليها حول هجري</b>
        <Field label="النقود" hint="في البيت والبنك والمحفظة" v={f.cash} on={set('cash')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {KARATS.map((k) => <Field key={k} label={`ذهب ${arNum(k)}`} v={f['g' + k]} on={set('g' + k)} unit="جم" />)}
        </div>
        <Field label="الفضة" v={f.silverG} on={set('silverG')} unit="جم" />
        <Field label="عروض التجارة" hint="بسعر البيع اليوم" v={f.trade} on={set('trade')} />
        <Field label="ديون لك مرجوّ سدادها" v={f.owed} on={set('owed')} />
        <Field label="ديون عليك حالّة" hint="تُخصم" v={f.debts} on={set('debts')} />
      </div>
      <div className="card hl col center" style={{ gap: 6 }}>
        {!r.ok ? <span className="small muted">اكتب سعر جرام {f.base === 'silver' ? 'الفضة' : 'الذهب'} ليُحسب النصاب</span> : (<>
          <span className="small muted">مجموع أموالك الزكوية: <b style={{ color: 'var(--text)' }}>{money(r.total)}</b></span>
          <span className="small muted">النصاب: <b style={{ color: 'var(--text)' }}>{money(r.nisab)}</b></span>
          {r.due > 0 ? (<><span className="small">الزكاة الواجبة (٢٫٥٪)</span><b className="accent" style={{ fontSize: 32 }}>{money(r.due)}</b></>)
            : <b style={{ fontSize: 16 }}>{r.total > 0 ? 'لم يبلغ مالك النصاب، فلا زكاة عليك فيه الآن' : 'اكتب أموالك لنحسب الزكاة'}</b>}
        </>)}
      </div>
      <div className="card row xs muted" style={{ gap: 8, alignItems: 'flex-start', lineHeight: 1.9 }}>
        <Info size={16} style={{ flex: 'none', marginTop: 3 }} />
        <span>تجب الزكاة إذا بلغ المال النصاب وحال عليه الحول الهجري. الذهب المعدّ للزينة المستعمل فيه خلاف بين العلماء، والأحوط إخراج زكاته. هذه الحاسبة للتقريب؛ وفي الحالات الخاصة (الأسهم، الرواتب، الشركات) يُرجع لأهل العلم ودار الإفتاء.</span>
      </div>
    </div>
  );
}
