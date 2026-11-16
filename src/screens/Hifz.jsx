import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, RotateCcw, CheckCircle2, Settings2, BookMarked, Flame, Search } from 'lucide-react';
import { useStore } from '../store.js';
import { SURAHS, TOTAL_PAGES } from '../lib/quran.js';
import { nextNew, dueReviews, memorizedCount, juzProgress, surahPages, surahOf, firstMemorize, isMem, addDaysKey } from '../lib/hifz.js';
import { ar, arNum, todayKey, daysAr, pagesAr } from '../lib/arabic.js';
import { TopBar, Ring, toast } from '../components/ui.jsx';

const strip = (s) => s.replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');

function hifzStreak(log) {
  let n = 0; const d = new Date();
  const ok = (k) => log[k] && (log[k].new + log[k].rev) > 0;
  if (!ok(todayKey(d))) d.setDate(d.getDate() - 1);
  while (ok(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function MarkMemorized({ onClose }) {
  const hifz = useStore((s) => s.hifz);
  const updateHifz = useStore((s) => s.updateHifz);
  const [q, setQ] = useState('');
  const list = useMemo(() => { const k = strip(q.trim()); return k ? SURAHS.filter((x) => strip(x.name).includes(k)) : [...SURAHS].reverse(); }, [q]);
  const full = (n) => { const r = surahPages(n); for (let p = r.from; p <= r.to; p++) if (!isMem(hifz.pages[p])) return false; return true; };
  const toggle = (n) => {
    const r = surahPages(n); const on = full(n); const upd = {};
    for (let p = r.from; p <= r.to; p++) {
      if (on) upd[p] = null;
      else if (!isMem(hifz.pages[p])) upd[p] = { ...firstMemorize(), due: addDaysKey(1 + (p % 7)) }; // توزيع المراجعة على الأسبوع
    }
    updateHifz(upd);
  };
  return (
    <div className="col" style={{ gap: 10 }}>
      <div className="between"><h2 className="h2">حدّد السور التي تحفظها</h2><button className="btn" style={{ minHeight: 40 }} onClick={onClose}>تم</button></div>
      <div className="small muted" style={{ lineHeight: 1.8 }}>ستُضاف صفحاتها إلى جدول المراجعة موزّعة على الأيام القادمة.</div>
      <label className="card row" style={{ padding: '0 14px', minHeight: 46 }}>
        <Search size={18} className="muted" aria-hidden="true" /><span className="sr">ابحث عن سورة</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم السورة" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 44 }} />
      </label>
      {list.map((s) => { const on = full(s.n); return (
        <button key={s.n} onClick={() => toggle(s.n)} aria-pressed={on} className="card row" style={{ padding: '10px 14px', textAlign: 'right', borderColor: on ? 'var(--acc)' : 'var(--line)' }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--acc)' : 'var(--surf2)', color: 'var(--onAcc)' }}>{on && <CheckCircle2 size={16} />}</span>
          <span className="amiri" style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>سورة {s.name}</span>
          <span className="xs muted">{ar(s.ayahs)} آية</span>
        </button>
      ); })}
    </div>
  );
}

export default function Hifz() {
  const { hifz, setHifzPlan } = useStore();
  const [mode, setMode] = useState(null); // null | 'mark' | 'plan'
  const mem = memorizedCount(hifz);
  const todayLog = hifz.log[todayKey()] || { new: 0, rev: 0 };
  const remainingNew = Math.max(0, hifz.plan.daily - todayLog.new);
  const news = nextNew(hifz, Math.max(remainingNew, 0));
  const reviews = dueReviews(hifz, 12);
  const juz = juzProgress(hifz);
  const streak = hifzStreak(hifz.log);
  const left = TOTAL_PAGES - mem;
  const daysLeft = Math.ceil(left / hifz.plan.daily);
  const finish = new Date(); finish.setDate(finish.getDate() + daysLeft);
  const finishTxt = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(finish);

  if (mode === 'mark') return <div className="screen no-nav"><MarkMemorized onClose={() => setMode(null)} /></div>;

  return (
    <div className="screen no-nav">
      <TopBar title="حفظ القرآن" sub="خطتك اليومية ومراجعتك" fallback="/quran"
        right={<button className="icon-btn" aria-label="إعدادات الخطة" onClick={() => setMode(mode === 'plan' ? null : 'plan')}><Settings2 size={19} /></button>} />

      {mode === 'plan' && (
        <motion.section initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="card col" style={{ gap: 12 }}>
          <div className="h2">خطة الحفظ</div>
          <div className="col" style={{ gap: 6 }}>
            <span className="xs muted">اتجاه الحفظ</span>
            <div className="grid2">
              {[['back', 'من آخر المصحف (جزء عمّ)'], ['fwd', 'من أول المصحف (البقرة)']].map(([k, l]) => <button key={k} className={'chip' + (hifz.plan.dir === k ? ' on' : '')} style={{ minHeight: 44, whiteSpace: 'normal' }} onClick={() => setHifzPlan({ dir: k })}>{l}</button>)}
            </div>
          </div>
          <div className="col" style={{ gap: 6 }}>
            <span className="xs muted">الحفظ الجديد يوميًّا</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
              {[1, 2, 3, 5].map((n) => <button key={n} className={'chip' + (hifz.plan.daily === n ? ' on' : '')} onClick={() => setHifzPlan({ daily: n })}>{n === 1 ? 'صفحة' : n === 2 ? 'صفحتان' : `${ar(n)} صفحات`}</button>)}
            </div>
          </div>
          <button className="btn ghost" onClick={() => setMode('mark')}>حدّد السور التي تحفظها مسبقًا</button>
        </motion.section>
      )}

      <section className="row" style={{ gap: 16, padding: 18, borderRadius: 26, background: 'var(--hero)', color: 'var(--heroText)' }}>
        <Ring size={100} value={mem / TOTAL_PAGES} label={`المحفوظ ${mem} صفحة من ${TOTAL_PAGES}`}>
          <span className="num" style={{ fontSize: 24, color: 'var(--heroText)' }}>{ar(Math.round((mem / TOTAL_PAGES) * 100))}٪</span>
          <span className="xs" style={{ opacity: .85 }}>من المصحف</span>
        </Ring>
        <div className="col" style={{ gap: 4 }}>
          <span className="xs" style={{ opacity: .85 }}>المحفوظ</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{mem ? pagesAr(mem) : 'لم تبدأ بعد'}</span>
          <span className="xs" style={{ opacity: .9 }}>≈ {ar((mem / 20).toFixed(1).replace('.0', '').replace('.', '٫'))} جزء</span>
          {left > 0 && <span className="xs" style={{ opacity: .85, lineHeight: 1.7 }}>بخطتك الحالية تختم الحفظ في {finishTxt} بإذن الله</span>}
        </div>
      </section>

      {mem === 0 && mode !== 'plan' && (
        <div className="card row small" style={{ lineHeight: 1.8 }}>
          <BookMarked size={20} className="accent" style={{ flex: 'none' }} aria-hidden="true" />
          <span style={{ flex: 1 }}>تحفظ سورًا من قبل؟ حدّدها ليضيفها الرفيق إلى جدول مراجعتك.</span>
          <button className="btn soft" style={{ minHeight: 38, fontSize: 12 }} onClick={() => setMode('mark')}>تحديد</button>
        </div>
      )}

      <div className="between"><h2 className="h2">ورد اليوم</h2>{streak > 0 && <span className="row xs accent"><Flame size={15} aria-hidden="true" />{daysAr(streak)} متتالية</span>}</div>

      <section className="card col" style={{ gap: 10, borderColor: news.length ? 'var(--acc)' : 'var(--line)' }}>
        <div className="row"><Plus size={20} className="accent" aria-hidden="true" /><span className="h2" style={{ flex: 1 }}>الحفظ الجديد</span><span className="xs muted">{ar(todayLog.new)} من {ar(hifz.plan.daily)}</span></div>
        {news.length === 0 ? <div className="small accent">{left === 0 ? 'ما شاء الله، أتممت حفظ المصحف كاملًا!' : 'أتممت حفظ اليوم — بارك الله فيك وثبّته في قلبك.'}</div> : news.map((p) => (
          <a key={p} href={`#/quran/${p}/hifz`} className="row" style={{ textDecoration: 'none', color: 'var(--text)', padding: '10px 12px', borderRadius: 14, background: 'var(--surf2)' }}>
            <span style={{ flex: 1 }}><b>صفحة {ar(p)}</b> <span className="xs muted">· سورة {surahOf(p).name}</span></span>
            <span className="btn" style={{ minHeight: 36, padding: '0 14px', fontSize: 12 }}>ابدأ الحفظ</span>
          </a>
        ))}
      </section>

      <section className="card col" style={{ gap: 10 }}>
        <div className="row"><RotateCcw size={19} className="accent" aria-hidden="true" /><span className="h2" style={{ flex: 1 }}>المراجعة المستحقة</span><span className="xs muted">{ar(reviews.length)} صفحة · راجعت اليوم {ar(todayLog.rev)}</span></div>
        {reviews.length === 0 ? <div className="small muted">{mem ? 'لا مراجعة مستحقة الآن — أحسنت.' : 'ستظهر هنا الصفحات التي تحفظها في موعد مراجعتها.'}</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {reviews.map((p) => (
              <a key={p} href={`#/quran/${p}/review`} className="col center" style={{ textDecoration: 'none', color: 'var(--text)', padding: '10px 4px', borderRadius: 14, background: 'var(--surf2)', gap: 2 }}>
                <b className="small">ص {ar(p)}</b><span className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{surahOf(p).name}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="h2">خريطة الأجزاء</h2>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 6 }} role="list">
          {[...juz].reverse().map((j) => (
            <div key={j.juz} role="listitem" aria-label={`الجزء ${j.juz}: ${Math.round(j.pct * 100)}٪`} style={{ position: 'relative', height: 44, borderRadius: 10, overflow: 'hidden', background: 'var(--surf2)', border: '1px solid ' + (j.pct >= 1 ? 'var(--acc)' : 'var(--line)') }}>
              <div style={{ position: 'absolute', insetInline: 0, bottom: 0, height: j.pct * 100 + '%', background: 'color-mix(in srgb, var(--acc) 75%, transparent)' }} />
              <span style={{ position: 'relative', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: j.pct > .55 ? 'var(--onAcc)' : 'var(--text)' }}>{ar(j.juz)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card center" style={{ background: 'var(--surf)' }}>
        <div className="amiri" style={{ fontSize: 18, lineHeight: 1.9 }}>«خيركم من تعلّم القرآن وعلّمه»</div>
        <div className="xs muted">رواه البخاري</div>
      </section>
    </div>
  );
}
