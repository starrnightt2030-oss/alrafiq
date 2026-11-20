// المكتبة الإسلامية: رف الكتب (تصنيفات + بحث + «تابع القراءة») ← صفحة الكتاب (تحميل + فهرس + بحث داخل الكتاب) ← القارئ
// القارئ: حجم الخط، ثلاث خلفيات (فاتح / ورقي / ليلي)، علامات، السابق والتالي، ويحفظ آخر مكان وقفت عنده
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, BookOpen, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Type, Trash2, List } from 'lucide-react';
import { BOOKS, CATS, hueOf } from '../data/library.js';
import { loadBook, savedList, removeBook } from '../lib/library.js';
import { useStore } from '../store.js';
import { ar } from '../lib/arabic.js';
import { go } from '../router.js';
import { TopBar, toast } from '../components/ui.jsx';

const norm = (s) => s.replace(/[ً-ٰٟ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const byId = Object.fromEntries(BOOKS.map((b) => [b.id, b]));
const sizeOf = (b) => (b.kb < 1000 ? `${ar(b.kb)} ك.ب` : `${ar(Math.round(b.kb / 102.4) / 10).replace('.', '٫')} م.ب`);

function Cover({ b, size = 1 }) {
  const [c1, c2] = hueOf(b);
  return (
    <div style={{ position: 'relative', width: 92 * size, height: 128 * size, flex: 'none', borderRadius: 10 * size, background: `linear-gradient(160deg, ${c1}, ${c2})`, boxShadow: '0 8px 18px -8px rgba(0,0,0,.5), inset -6px 0 0 rgba(0,0,0,.18)', color: '#F3E3B5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 * size, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 5 * size, border: '1px solid rgba(243,227,181,.45)', borderRadius: 7 * size }} />
      <svg viewBox="0 0 40 40" width={20 * size} height={20 * size} style={{ opacity: .8 }}><path d="M20 2l5 11 12 2-9 8 3 12-11-6-11 6 3-12-9-8 12-2z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      <b className="amiri" style={{ fontSize: (b.t.length > 16 ? 12.5 : 15) * size, lineHeight: 1.45, textAlign: 'center', marginTop: 4 * size }}>{b.t}</b>
      <span style={{ fontSize: 9 * size, opacity: .85, marginTop: 4 * size, textAlign: 'center' }}>{b.a}</span>
    </div>
  );
}

function Shelf() {
  const lib = useStore((s) => s.library) || {};
  const [q, setQ] = useState(''), [cat, setCat] = useState('');
  const [have, setHave] = useState([]);
  useEffect(() => { savedList(BOOKS.map((b) => b.id)).then(setHave); }, []);
  const list = useMemo(() => { const k = norm(q.trim()); return BOOKS.filter((b) => (!cat || b.cat === cat) && (!k || norm(b.t + ' ' + b.a + ' ' + b.desc).includes(k))); }, [q, cat]);
  const last = lib.last && byId[lib.last.id];
  return (
    <div className="screen no-nav">
      <TopBar title="المكتبة الإسلامية" sub={`${ar(BOOKS.length)} كتابًا من أمهات كتب التراث`} />
      {last && (
        <a href={`#/library/${last.id}/${lib.last.ch}`} className="card row" style={{ gap: 12, textDecoration: 'none', color: 'var(--text)', padding: 12 }}>
          <Cover b={last} size={0.55} />
          <span className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}><span className="xs muted">تابع القراءة</span><b>{last.t}</b><span className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lib.last.h || ''}</span></span>
          <ChevronLeft size={20} className="accent" />
        </a>
      )}
      <label className="card row" style={{ padding: '0 14px', minHeight: 48 }}>
        <Search size={18} className="muted" aria-hidden="true" /><span className="sr">ابحث في المكتبة</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الكتاب أو المؤلف…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 46 }} />
      </label>
      <div className="row" style={{ gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {['', ...CATS].map((c) => <button key={c || 'all'} className={'chip' + (cat === c ? ' on' : '')} style={{ flex: 'none' }} onClick={() => setCat(c)}>{c || 'الكل'}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '16px 10px' }}>
        {list.map((b, i) => (
          <motion.a key={b.id} href={'#/library/' + b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.03 }} className="col" style={{ alignItems: 'center', gap: 4, textDecoration: 'none', color: 'var(--text)' }}>
            <Cover b={b} />
            <span className="xs muted" style={{ textAlign: 'center' }}>{have.includes(b.id) ? '✓ محفوظ' : sizeOf(b)}</span>
          </motion.a>
        ))}
      </div>
      <div className="xs muted center" style={{ lineHeight: 1.8 }}>النصوص من مشروع OpenITI والمكتبة الشاملة. الكتاب يتحمّل مرة واحدة ويتقري بعدها من غير إنترنت.</div>
    </div>
  );
}

function BookPage({ id }) {
  const b = byId[id];
  const lib = useStore((s) => s.library) || {};
  const [data, setData] = useState(null), [p, setP] = useState(-1), [err, setErr] = useState(false), [q, setQ] = useState('');
  const start = () => { setErr(false); setP(0); loadBook(id, setP).then((d) => { setData(d); setP(-1); }).catch(() => { setErr(true); setP(-1); }); };
  useEffect(() => { savedList([id]).then((l) => { if (l.length) start(); }); }, [id]); // eslint-disable-line
  const hits = useMemo(() => {
    const k = norm(q.trim()); if (!data || k.length < 2) return null;
    const out = []; data.c.forEach((c, ci) => c.p.forEach((t, pi) => { if (out.length < 60) { const n = norm(t); const at = n.indexOf(k); if (at >= 0) out.push({ ci, pi, h: c.h, s: t.slice(Math.max(0, at - 40), at + 80) }); } }));
    return out;
  }, [q, data]);
  if (!b) return null;
  const marks = (lib.marks || []).filter((m) => m.id === id);
  return (
    <div className="screen no-nav">
      <TopBar title={b.t} sub={b.a + ' (ت ' + ar(b.d) + 'هـ)'} fallback="/library" />
      <div className="card row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <Cover b={b} />
        <div className="col" style={{ gap: 6, flex: 1 }}>
          <span className="xs" style={{ alignSelf: 'flex-start', padding: '2px 10px', borderRadius: 999, background: 'var(--surf2)' }}>{b.cat}</span>
          <span className="small" style={{ lineHeight: 1.9 }}>{b.desc}</span>
          <span className="xs muted">{ar(b.n)} بابًا وفصلًا</span>
        </div>
      </div>
      {!data && (
        <div className="card col" style={{ gap: 8 }}>
          {p >= 0 ? (<><span className="small">جارٍ تحميل الكتاب… {ar(Math.round(p * 100))}٪</span><div style={{ height: 8, borderRadius: 8, background: 'var(--surf2)', overflow: 'hidden' }}><div style={{ width: `${p * 100}%`, height: '100%', background: 'var(--acc)', transition: 'width .2s' }} /></div></>)
            : <button className="btn" onClick={start}><Download size={18} /> {err ? 'تعذّر التحميل — حاول تاني' : `تحميل الكتاب (${sizeOf(b)})`}</button>}
          {err && <span className="xs muted">تأكد إن الإنترنت شغّال. بعد التحميل الكتاب يتقري من غير نت.</span>}
        </div>
      )}
      {data && (<>
        <a href={`#/library/${id}/${lib.last?.id === id ? lib.last.ch : 0}`} className="btn" style={{ textDecoration: 'none' }}><BookOpen size={18} /> {lib.last?.id === id ? 'تابع من حيث وقفت' : 'ابدأ القراءة'}</a>
        {marks.length > 0 && <div className="card col" style={{ gap: 4 }}><b className="small">علاماتك</b>{marks.map((m) => <a key={m.ch} href={`#/library/${id}/${m.ch}`} className="row small" style={{ gap: 8, padding: '6px 0', color: 'var(--text)', textDecoration: 'none' }}><BookmarkCheck size={16} className="accent" />{m.h}</a>)}</div>}
        <label className="card row" style={{ padding: '0 14px', minHeight: 48 }}>
          <Search size={18} className="muted" aria-hidden="true" /><span className="sr">ابحث داخل الكتاب</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث داخل الكتاب…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 46 }} />
        </label>
        {hits ? (
          <div className="card col" style={{ gap: 2 }}>
            <span className="xs muted">{hits.length ? `${ar(hits.length)}${hits.length >= 60 ? '+' : ''} نتيجة` : 'لا توجد نتائج'}</span>
            {hits.map((h, i) => <a key={i} href={`#/library/${id}/${h.ci}`} onClick={() => sessionStorage.setItem('rf-lib-p', String(h.pi))} className="col" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--text)', textDecoration: 'none', gap: 2 }}><span className="xs accent">{h.h}</span><span className="small amiri">…{h.s}…</span></a>)}
          </div>
        ) : (
          <div className="card col" style={{ gap: 0 }}>
            <div className="row" style={{ gap: 6, paddingBottom: 6 }}><List size={16} className="accent" /><b className="small">الفهرس</b></div>
            {data.c.map((c, i) => <a key={i} href={`#/library/${id}/${i}`} className="between small" style={{ padding: '9px 0', borderTop: '1px solid var(--line)', color: 'var(--text)', textDecoration: 'none', gap: 8 }}><span>{c.h}</span><span className="xs muted">{ar(i + 1)}</span></a>)}
          </div>
        )}
        <button className="btn ghost" style={{ fontSize: 12 }} onClick={async () => { await removeBook(id); toast('اتشال الكتاب من الجهاز'); go('/library'); }}><Trash2 size={15} /> إزالة الكتاب من الجهاز</button>
      </>)}
    </div>
  );
}

const THEMES = { light: ['#FFFFFF', '#1F2328'], sepia: ['#F6ECD6', '#3B2F1E'], night: ['#12161C', '#D9D4C7'] };
function Reader({ id, ch }) {
  const b = byId[id];
  const lib = useStore((s) => s.library) || {}, setLib = useStore((s) => s.setLibrary);
  const [data, setData] = useState(null), [err, setErr] = useState(false);
  const box = useRef(null);
  const fs = lib.fs || 19, th = lib.th || 'sepia';
  const i = +ch || 0;
  useEffect(() => { loadBook(id).then(setData).catch(() => setErr(true)); }, [id]);
  const c = data?.c[i];
  useEffect(() => {
    if (!c) return;
    setLib({ last: { id, ch: i, h: c.h } });
    const el = box.current; if (!el) return;
    const pi = sessionStorage.getItem('rf-lib-p'); sessionStorage.removeItem('rf-lib-p');
    requestAnimationFrame(() => {
      if (pi) { el.querySelector(`[data-p="${pi}"]`)?.scrollIntoView({ block: 'center' }); return; }
      const y = lib.last?.id === id && lib.last?.ch === i ? lib.last.y || 0 : 0;
      el.scrollTop = y * (el.scrollHeight - el.clientHeight);
    });
  }, [c]); // eslint-disable-line
  const onScroll = (e) => { const el = e.currentTarget; const y = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight); clearTimeout(onScroll.t); onScroll.t = setTimeout(() => setLib({ last: { id, ch: i, h: c?.h, y } }), 400); };
  const marked = (lib.marks || []).some((m) => m.id === id && m.ch === i);
  const toggleMark = () => { const ms = lib.marks || []; setLib({ marks: marked ? ms.filter((m) => !(m.id === id && m.ch === i)) : [...ms, { id, ch: i, h: c.h }] }); toast(marked ? 'اتشالت العلامة' : 'اتحفظت العلامة'); };
  const [bg, fg] = THEMES[th];
  if (!b) return null;
  return (
    <div className="screen no-nav" style={{ background: bg, color: fg, paddingBottom: 0, height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="between" style={{ gap: 6 }}>
        <button className="icon-btn" aria-label="رجوع للكتاب" onClick={() => go('/library/' + id)} style={{ color: fg }}><ChevronRight size={20} /></button>
        <div className="center" style={{ minWidth: 0, flex: 1 }}><b className="small" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c?.h || b.t}</b><span className="xs" style={{ opacity: .7 }}>{b.t}{data ? ` • ${ar(i + 1)} / ${ar(data.c.length)}` : ''}</span></div>
        <button className="icon-btn" aria-label={marked ? 'إزالة العلامة' : 'حفظ علامة'} aria-pressed={marked} onClick={toggleMark} style={{ color: fg }}>{marked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}</button>
      </div>
      <div className="row" style={{ gap: 6, justifyContent: 'center', padding: '6px 0' }}>
        <button className="chip" aria-label="تصغير الخط" onClick={() => setLib({ fs: Math.max(14, fs - 1) })}><Type size={13} />−</button>
        <button className="chip" aria-label="تكبير الخط" onClick={() => setLib({ fs: Math.min(30, fs + 1) })}><Type size={17} />+</button>
        {Object.entries({ light: 'فاتح', sepia: 'ورقي', night: 'ليلي' }).map(([k, t]) => <button key={k} className={'chip' + (th === k ? ' on' : '')} onClick={() => setLib({ th: k })}>{t}</button>)}
      </div>
      <div ref={box} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: '6px 4px 24px' }}>
        {err && <div className="center small" style={{ marginTop: 40 }}>الكتاب مش متحمّل. ارجع لصفحة الكتاب وحمّله الأول.</div>}
        {!data && !err && <div className="center small" style={{ marginTop: 40, opacity: .7 }}>جارٍ الفتح…</div>}
        {c && (<>
          <h2 className="amiri" style={{ fontSize: fs + 5, textAlign: 'center', margin: '8px 0 14px', color: th === 'night' ? '#E6C77A' : '#8A5A12' }}>{c.h}</h2>
          {c.p.map((t, k) => <p key={k} data-p={k} className="amiri" style={{ fontSize: fs, lineHeight: 2.05, margin: '0 0 12px', textAlign: 'justify' }}>{t}</p>)}
          <div className="between" style={{ gap: 8, marginTop: 10 }}>
            {i > 0 ? <a href={`#/library/${id}/${i - 1}`} className="btn ghost" style={{ textDecoration: 'none', color: fg }}><ChevronRight size={18} /> السابق</a> : <span />}
            {i < data.c.length - 1 ? <a href={`#/library/${id}/${i + 1}`} className="btn" style={{ textDecoration: 'none' }}>التالي <ChevronLeft size={18} /></a> : <span className="small" style={{ opacity: .7 }}>تمّ الكتاب بحمد الله</span>}
          </div>
        </>)}
      </div>
    </div>
  );
}

export default function Library({ id, ch }) {
  if (id && ch !== undefined) return <Reader key={id + ch} id={id} ch={ch} />;
  if (id) return <BookPage key={id} id={id} />;
  return <Shelf />;
}
