import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Bookmark, List } from 'lucide-react';
import { useStore } from '../store.js';
import { useQuran, pageBlocks, surahAt, juzAt, TOTAL_PAGES } from '../lib/quran.js';
import { ar } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { go } from '../router.js';
import Q from '../data/quranSnippets.json';

function SuraHead({ name }) {
  return (
    <div className="sura-head">
      <svg viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
        <rect x="2" y="4" width="396" height="36" rx="6" fill="none" stroke="var(--pageFrame)" strokeWidth="2" />
        <rect x="8" y="9" width="384" height="26" rx="4" fill="color-mix(in srgb, var(--pageFrame) 12%, transparent)" stroke="var(--pageFrame)" strokeWidth=".8" />
        <path d="M30 22l10-8 10 8-10 8z M350 22l10-8 10 8-10 8z" fill="var(--pageFrame)" opacity=".7" />
      </svg>
      <span>سُورَةُ {name}</span>
    </div>
  );
}

function Page({ n, ayahs, width, height }) {
  const inner = useRef(null);
  const blocks = pageBlocks(ayahs);
  const special = n <= 2;

  const fit = useCallback(() => {
    const el = inner.current; if (!el) return;
    el.style.lineHeight = '1.95';
    let lo = 10, hi = Math.min(42, width / (special ? 13 : 10.5));
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2; el.style.fontSize = mid + 'px';
      if (el.scrollHeight > el.clientHeight + 1) hi = mid; else lo = mid;
    }
    el.style.fontSize = lo + 'px';
    if (!special) {
      const content = Array.from(el.children).reduce((h, c) => h + c.getBoundingClientRect().height, 0);
      const ratio = Math.min(1.22, (el.clientHeight - 4) / Math.max(1, content));
      if (ratio > 1.01) { el.style.lineHeight = (1.95 * ratio).toFixed(3); if (el.scrollHeight > el.clientHeight + 1) el.style.lineHeight = '1.95'; }
    }
  }, [width, height, special, n]);

  useLayoutEffect(() => { fit(); }, [fit, ayahs]);
  useEffect(() => { document.fonts?.ready.then(fit); }, [fit]);

  return (
    <div className="mushaf-page" style={{ width, height }}>
      <div ref={inner} className="mushaf-inner" style={{ justifyContent: special ? 'center' : 'flex-start' }} lang="ar">
        {blocks.map((b, i) => b.type === 'head' ? <SuraHead key={i} name={b.name} />
          : b.type === 'basmala' ? <div key={i} className="basmala">{Q.basmala}</div>
          : <p key={i} className="mushaf-text" style={{ margin: 0, textAlignLast: special ? 'center' : (i === blocks.length - 1 && n !== 604 ? 'justify' : 'center') }}>
              {b.ayahs.map((x) => <span key={x.s + ':' + x.a}>{x.t} </span>)}
            </p>)}
      </div>
    </div>
  );
}

export default function MushafReader({ page: initial }) {
  const { data, error } = useQuran();
  const setLastPage = useStore((s) => s.setLastPage);
  const bookmarks = useStore((s) => s.quran.bookmarks);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const [page, setPage] = useState(() => Math.min(TOTAL_PAGES, Math.max(1, initial || 1)));
  const [dir, setDir] = useState(1);
  const [size, setSize] = useState({ w: 360, h: 560 });

  useEffect(() => {
    const calc = () => {
      const vh = window.innerHeight, vw = Math.min(window.innerWidth, 520);
      const h = Math.max(380, vh - 150), w = Math.min(vw - 20, h * 0.66);
      setSize({ w: Math.round(w), h: Math.round(Math.min(h, w / 0.62)) });
    };
    calc(); addEventListener('resize', calc); return () => removeEventListener('resize', calc);
  }, []);

  useEffect(() => { if (initial && initial !== page) { setDir(initial > page ? 1 : -1); setPage(Math.min(TOTAL_PAGES, Math.max(1, initial))); } }, [initial]); // eslint-disable-line
  useEffect(() => { setLastPage(page); history.replaceState(null, '', '#/quran/' + page); }, [page]); // eslint-disable-line

  const turn = (d) => { const p = page + d; if (p < 1 || p > TOTAL_PAGES) return; setDir(d); setPage(p); vibrate(6); };
  const marked = bookmarks.includes(page);
  const s = surahAt(page), j = juzAt(page);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top) + 10px) 10px calc(env(safe-area-inset-bottom) + 14px)', gap: 10, overflow: 'hidden' }}>
      <div className="between" style={{ width: '100%', maxWidth: 500 }}>
        <button className="icon-btn" aria-label="فهرس المصحف" onClick={() => go('/quran')}><List size={20} /></button>
        <div className="center"><div className="amiri" style={{ fontSize: 19, fontWeight: 700 }}>سورة {s.name}</div><div className="xs muted">الجزء {ar(j.juz)}</div></div>
        <button className="icon-btn" aria-label={marked ? 'إزالة العلامة' : 'حفظ علامة'} aria-pressed={marked} onClick={() => { toggleBookmark(page); vibrate(12); }}>
          <Bookmark size={20} fill={marked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div style={{ position: 'relative', width: size.w, height: size.h }}>
        {error && <div className="card center" style={{ marginTop: 40 }}>تعذّر تحميل المصحف. تأكد من الاتصال بالإنترنت عند أول فتح، ثم يعمل بدونه.<br /><button className="btn" style={{ marginTop: 12 }} onClick={() => location.reload()}>إعادة المحاولة</button></div>}
        {!data && !error && <div className="center muted" style={{ paddingTop: 120 }}>جارٍ تحميل المصحف…</div>}
        {data && (
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div key={page} custom={dir}
              initial={{ x: dir > 0 ? -size.w * 0.6 : size.w * 0.6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir > 0 ? size.w * 0.6 : -size.w * 0.6, opacity: 0 }}
              transition={{ type: 'tween', duration: .28, ease: 'easeOut' }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.35}
              onDragEnd={(_, info) => { if (info.offset.x > 70) turn(1); else if (info.offset.x < -70) turn(-1); }}
              style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}>
              <Page n={page} ayahs={data.pages[page]} width={size.w} height={size.h} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="between" style={{ width: '100%', maxWidth: 500 }}>
        <button className="icon-btn" aria-label="الصفحة السابقة" disabled={page <= 1} onClick={() => turn(-1)}><ChevronRight size={20} /></button>
        <label className="row" style={{ flex: 1, gap: 8, padding: '0 10px' }}>
          <span className="sr">الانتقال إلى صفحة</span>
          <input type="range" min="1" max={TOTAL_PAGES} value={page} onChange={(e) => { const p = +e.target.value; setDir(p > page ? 1 : -1); setPage(p); }} style={{ flex: 1, direction: 'rtl' }} />
          <span className="small" style={{ minWidth: 44, textAlign: 'center', fontWeight: 600 }}>{ar(page)}</span>
        </label>
        <button className="icon-btn" aria-label="الصفحة التالية" disabled={page >= TOTAL_PAGES} onClick={() => turn(1)}><ChevronLeft size={20} /></button>
      </div>
    </div>
  );
}
