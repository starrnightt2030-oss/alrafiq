import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Bookmark, List } from 'lucide-react';
import { useStore } from '../store.js';
import { useQuran, pageBlocks, surahAt, juzAt, TOTAL_PAGES, JUZ as JUZ_LIST } from '../lib/quran.js';
import { ar } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { go } from '../router.js';
import Q from '../data/quranSnippets.json';
import { firstMemorize, schedule, dueReviews } from '../lib/hifz.js';
import { toast } from '../components/ui.jsx';
import { sound } from '../lib/sound.js';
import { Eye, EyeOff, Headphones } from 'lucide-react';
import { ReciteDock, ReciteSheet, AyahMenu, StartSheet, Avatar } from '../components/Recite.jsx';
import { useRecite, start as reciteStart, stop as reciteStop, DEFAULTS, HL, reciterOf } from '../lib/recite.js';

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

function Page({ n, ayahs, width, height, hidden, activeKey, segStart, onAyah }) {
  const press = useRef(null);
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
      <div ref={inner} className="mushaf-inner" style={{ justifyContent: special ? 'center' : 'flex-start', filter: hidden ? 'blur(7px)' : 'none', transition: 'filter .3s' }} lang="ar">
        {blocks.map((b, i) => b.type === 'head' ? <SuraHead key={i} name={b.name} />
          : b.type === 'basmala' ? <div key={i} className="basmala">{Q.basmala}</div>
          : <p key={i} className="mushaf-text" style={{ margin: 0, textAlignLast: special ? 'center' : (i === blocks.length - 1 && n !== 604 ? 'justify' : 'center') }}>
              {b.ayahs.map((x) => { const on = activeKey && activeKey.s === x.s && activeKey.a === x.a; const seg = segStart && segStart.s === x.s && segStart.a === x.a; return (
                <span key={x.s + ':' + x.a} data-ayah={x.s + ':' + x.a} className={'ayah' + (on ? ' on' : '') + (seg ? ' seg' : '')}
                  onContextMenu={(e) => { e.preventDefault(); onAyah?.(x); }}
                  onPointerDown={(e) => { const p0 = [e.clientX, e.clientY]; clearTimeout(press.current?.t); press.current = { p0, t: setTimeout(() => { vibrate(15); onAyah?.(x); }, 480) }; }}
                  onPointerMove={(e) => { const p = press.current; if (p && Math.hypot(e.clientX - p.p0[0], e.clientY - p.p0[1]) > 10) clearTimeout(p.t); }}
                  onPointerUp={() => clearTimeout(press.current?.t)} onPointerCancel={() => clearTimeout(press.current?.t)}>{x.t} </span>); })}
            </p>)}
      </div>
    </div>
  );
}

export default function MushafReader({ page: initial, mode }) {
  const { data, error } = useQuran();
  const setLastPage = useStore((s) => s.setLastPage);
  const markPage = useStore((s) => s.markPage);
  const bookmarks = useStore((s) => s.quran.bookmarks);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const [page, setPage] = useState(() => Math.min(TOTAL_PAGES, Math.max(1, initial || 1)));
  const [dir, setDir] = useState(1);
  const [size, setSize] = useState({ w: 360, h: 560 });
  const [hidden, setHidden] = useState(false);
  const rc = useRecite();
  const rcActive = useRef(false); rcActive.current = rc.active;
  const rset = useStore((s) => s.settings.recite);
  const ropt = { ...DEFAULTS, ...(rset || {}) };
  const follow = ropt.follow !== false;
  const [startSheet, setStartSheet] = useState(false);
  const [tip, setTip] = useState(() => { try { return !localStorage.getItem('rf-tip-recite'); } catch { return false; } });
  const closeTip = () => { setTip(false); try { localStorage.setItem('rf-tip-recite', '1'); } catch {} };
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(null);
  const [segStart, setSegStart] = useState(null);
  useEffect(() => () => reciteStop(), []);
  useEffect(() => { if (!rc.range) return; setSegStart(null); }, [rc.range]);
  const hifzPage = useStore((s) => s.hifz.pages[page]);
  const updateHifz = useStore((s) => s.updateHifz);
  const learn = () => { updateHifz({ [page]: firstMemorize() }, 'new', 15); sound.next(); toast('أُضيفت الصفحة إلى محفوظك — ستراجعها غدًا بإذن الله (+١٥ نقطة)'); go('/hifz'); };
  const rate = (r) => {
    updateHifz({ [page]: schedule(hifzPage, r) }, 'rev', 5); sound.tap(); setHidden(false);
    const next = dueReviews(useStore.getState().hifz, 1)[0];
    if (next) { toast('تمت المراجعة — التالية صفحة ' + ar(next)); setDir(next > page ? 1 : -1); setPage(next); }
    else { toast('أتممت مراجعة اليوم — بارك الله فيك'); go('/hifz'); }
  };

  useEffect(() => {
    const calc = () => {
      const vh = window.innerHeight, vw = Math.min(window.innerWidth, 520);
      const h = Math.max(360, vh - (mode ? 260 : 150) - 56), w = Math.min(vw - 20, h * 0.66);
      setSize({ w: Math.round(w), h: Math.round(Math.min(h, w / 0.62)) });
    };
    calc(); addEventListener('resize', calc); return () => removeEventListener('resize', calc);
  }, [rc.active]);

  useEffect(() => { if (initial && initial !== page) { setDir(initial > page ? 1 : -1); setPage(Math.min(TOTAL_PAGES, Math.max(1, initial))); } }, [initial]); // eslint-disable-line
  useEffect(() => { const t = setTimeout(() => markPage(page), 4000); return () => clearTimeout(t); }, [page]); // eslint-disable-line
  useEffect(() => { setLastPage(page); history.replaceState(null, '', '#/quran/' + page + (mode ? '/' + mode : '')); }, [page]); // eslint-disable-line

  // صفحة الآية الحالية: نقلب الصفحة تلقائيًا مع التلاوة
  const pageOf = (k) => { if (!data || !k) return null; for (let p = Math.max(1, page - 2); p <= Math.min(TOTAL_PAGES, page + 3); p++) if (data.pages[p].some((x) => x.s === k.s && x.a === k.a)) return p; for (let p = 1; p <= TOTAL_PAGES; p++) if (data.pages[p].some((x) => x.s === k.s && x.a === k.a)) return p; return null; };
  useEffect(() => { if (!rc.key || !follow) return; const p = pageOf(rc.key); if (p && p !== page) { setDir(p > page ? 1 : -1); setPage(p); } }, [rc.key?.s, rc.key?.a]); // eslint-disable-line
  const pageRange = data && data.pages[page]?.length ? (() => { const a = data.pages[page]; return { from: { s: a[0].s, a: a[0].a }, to: { s: a[a.length - 1].s, a: a[a.length - 1].a } }; })() : null;
  const juzRange = (() => { if (!data) return null; const jj = juzAt(page); const all = JUZ_LIST; const i = all.findIndex((x) => x.juz === jj.juz); const p1 = jj.page, p2 = i < all.length - 1 ? all[i + 1].page - 1 : TOTAL_PAGES; const f = data.pages[p1][0]; const l = data.pages[p2][data.pages[p2].length - 1]; return { juz: jj.juz, from: { s: f.s, a: f.a }, to: { s: l.s, a: l.a } }; })();
  const listen = () => { closeTip(); if (rc.active) { setSheet(true); return; } setStartSheet(true); vibrate(8); };
  const begin = () => { if (pageRange) { reciteStart(pageRange.from); vibrate(10); } };

  const turn = (d) => { const p = page + d; if (p < 1 || p > TOTAL_PAGES) return; setDir(d); setPage(p); vibrate(6); };
  const marked = bookmarks.includes(page);
  const s = surahAt(page), j = juzAt(page);

  return (
    <div style={{ '--hl': (HL[ropt.hl] || HL.gold)[1], minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top) + 10px) 10px calc(env(safe-area-inset-bottom) + 14px)', gap: 10, overflow: 'hidden' }}>
      <div className="between" style={{ width: '100%', maxWidth: 500 }}>
        <button className="icon-btn" aria-label="فهرس المصحف" onClick={() => go('/quran')}><List size={20} /></button>
        <div className="center"><div className="amiri" style={{ fontSize: 19, fontWeight: 700 }}>سورة {s.name}</div><div className="xs muted">الجزء {ar(j.juz)}</div></div>
        <div className="row" style={{ gap: 8 }}>
          <button className={'icon-btn rc-listen' + (rc.active ? ' on' : '')} aria-label={rc.active ? 'إعدادات التلاوة' : 'استمع للصفحة'} onClick={listen}><Headphones size={20} /></button>
          <button className="icon-btn" aria-label={marked ? 'إزالة العلامة' : 'حفظ علامة'} aria-pressed={marked} onClick={() => { toggleBookmark(page); vibrate(12); }}>
            <Bookmark size={20} fill={marked ? 'currentColor' : 'none'} />
          </button>
        </div>
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
              <Page n={page} ayahs={data.pages[page]} width={size.w} height={size.h} hidden={hidden} activeKey={rc.basmala ? null : rc.key} segStart={segStart} onAyah={(x) => setMenu({ s: x.s, a: x.a })} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>{rc.active && <ReciteDock key="dock" onSettings={() => setSheet(true)} />}</AnimatePresence>
      {!rc.active && (
        <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
          <AnimatePresence>{tip && (
            <motion.button className="rc-tip" onClick={listen} initial={{ opacity: 0, y: 10, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: 1, type: 'spring' }}>
              <b>جديد ✨</b> اسمع المصحف بصوت ١٠ قرّاء والآية بتنوّر معاك
            </motion.button>
          )}</AnimatePresence>
          <motion.button whileTap={{ scale: .97 }} className="rc-cta" style={{ '--h': reciterOf(ropt.reciter).hue }} onClick={listen}>
            <span className="rc-cta-ic"><Headphones size={20} /></span>
            <span className="col" style={{ flex: 1, minWidth: 0, gap: 0, textAlign: 'start' }}><b>استمع للتلاوة</b><span className="xs" style={{ opacity: .85 }}>{reciterOf(ropt.reciter).name} — اضغط لتغيير القارئ</span></span>
            <Avatar r={reciterOf(ropt.reciter)} size={34} />
          </motion.button>
        </div>
      )}
      {!rc.active && <div className="between" style={{ width: '100%', maxWidth: 500 }}>
        <button className="icon-btn" aria-label="الصفحة السابقة" disabled={page <= 1} onClick={() => turn(-1)}><ChevronRight size={20} /></button>
        <label className="row" style={{ flex: 1, gap: 8, padding: '0 10px' }}>
          <span className="sr">الانتقال إلى صفحة</span>
          <input type="range" min="1" max={TOTAL_PAGES} value={page} onChange={(e) => { const p = +e.target.value; setDir(p > page ? 1 : -1); setPage(p); }} style={{ flex: 1, direction: 'rtl' }} />
          <span className="small" style={{ minWidth: 44, textAlign: 'center', fontWeight: 600 }}>{ar(page)}</span>
        </label>
        <button className="icon-btn" aria-label="الصفحة التالية" disabled={page >= TOTAL_PAGES} onClick={() => turn(1)}><ChevronLeft size={20} /></button>
      </div>}
      {mode && (
        <div className="card col" style={{ width: '100%', maxWidth: 500, gap: 10, padding: 12 }}>
          <div className="between">
            <span className="small" style={{ fontWeight: 600 }}>{mode === 'hifz' ? 'حفظ صفحة ' + ar(page) : 'مراجعة صفحة ' + ar(page)}</span>
            <button className="btn ghost" style={{ minHeight: 36, padding: '0 12px', fontSize: 12 }} onClick={() => setHidden(!hidden)}>{hidden ? <><Eye size={15} />إظهار النص</> : <><EyeOff size={15} />اختبر نفسك</>}</button>
          </div>
          {mode === 'hifz' ? (
            <button className="btn" onClick={learn}>أتممت حفظ هذه الصفحة</button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
              <button className="btn ghost" style={{ fontSize: 12 }} onClick={() => rate('again')}>أحتاج مراجعة</button>
              <button className="btn soft" style={{ fontSize: 12 }} onClick={() => rate('good')}>جيد</button>
              <button className="btn" style={{ fontSize: 12 }} onClick={() => rate('easy')}>متقن</button>
            </div>
          )}
        </div>
      )}
      <AnimatePresence>
        {startSheet && <StartSheet key="ss" onClose={() => setStartSheet(false)} onStart={begin} pageLabel={'من أول صفحة ' + ar(page)} />}
        {sheet && <ReciteSheet key="rs" onClose={() => setSheet(false)} page={page} pageAyahs={data?.pages[page]} juzRange={juzRange} />}
        {menu && <AyahMenu key="am" k={menu} segStart={segStart} onSegStart={setSegStart} pageRange={pageRange} onClose={() => setMenu(null)} />}
      </AnimatePresence>
    </div>
  );
}
