// البحث عن آية بكلمة أو جزء منها (يتجاهل التشكيل واختلاف الرسم العثماني)، ثم فتحها أو تفسيرها أو مشاركتها
import { useDeferredValue, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, BookOpenText, Share2, BookOpen, X } from 'lucide-react';
import { useQuran, SURAHS } from '../lib/quran.js';
import { ar } from '../lib/arabic.js';
import { TafsirSheet, ShareSheet } from './AyahTools.jsx';
import { go } from '../router.js';
import { start as reciteStart } from '../lib/recite.js';

export const norm = (s) => s.replace(/وٰ/g, 'ا').replace(/ىٰ/g, 'ا')
  .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
  .replace(/[ٱأإآا]/g, '').replace(/ء/g, '').replace(/ؤ/g, 'و').replace(/[ئى]/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[^ء-ي]/g, '');
const plain = (n) => n.replace(/[ً-ْٰ]/g, '');

let INDEX = null;
function buildIndex(pages) {
  if (INDEX) return INDEX;
  const all = []; for (const pg of pages) for (const x of pg) all.push({ ...x, n: norm(x.t) });
  INDEX = { all, map: new Map(all.map((x) => [x.s + ':' + x.a, x])) };
  return INDEX;
}

export default function AyahSearch() {
  const { data } = useQuran();
  const [q, setQ] = useState(''); const dq = useDeferredValue(q);
  const [tafsir, setTafsir] = useState(null); const [share, setShare] = useState(null);
  const idx = useMemo(() => (data ? buildIndex(data.pages) : null), [data]);
  const res = useMemo(() => {
    if (!idx) return null; const k = norm(dq); if (k.length < 3) return null;
    const out = []; for (const x of idx.all) { if (x.n.includes(k)) { out.push(x); if (out.length >= 60) break; } }
    return out;
  }, [dq, idx]);
  const getAyah = (k) => idx?.map.get(k.s + ':' + k.a) || null;
  return (
    <section className="col" style={{ gap: 10 }}>
      <label className="as-box">
        <Search size={20} className="accent" aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن آية… اكتب كلمة أو جزء منها" aria-label="ابحث عن آية" />
        {q && <button className="as-x" aria-label="مسح" onClick={() => setQ('')}><X size={16} /></button>}
      </label>
      {q && !data && <div className="xs muted center">جارٍ تجهيز المصحف للبحث…</div>}
      {res && (
        <div className="col" style={{ gap: 8 }}>
          <div className="xs muted">{res.length ? (res.length === 1 ? 'نتيجة واحدة' : `${res.length >= 60 ? 'أول ٦٠' : ar(res.length)} نتيجة`) : 'مفيش آية فيها الكلام ده — جرّب كلمة تانية أو أقصر'}</div>
          <AnimatePresence initial={false}>
            {res.map((x, i) => (
              <motion.div key={x.s + ':' + x.a} className="as-res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * .03 }}>
                <div className="between xs"><b className="accent">سورة {plain(SURAHS[x.s - 1].name)} — الآية {ar(x.a)}</b><span className="muted">ص {ar(x.p)}</span></div>
                <div className="hafs as-t">{x.t}</div>
                <div className="as-acts">
                  <button onClick={() => go('/quran/' + x.p)}><BookOpen size={15} /> افتح في المصحف</button>
                  <button onClick={() => setTafsir({ s: x.s, a: x.a })}><BookOpenText size={15} /> التفسير</button>
                  <button onClick={() => setShare({ k: { s: x.s, a: x.a } })}><Share2 size={15} /> شارك</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <AnimatePresence>
        {tafsir && <TafsirSheet key="tf" k={tafsir} getAyah={getAyah} onListen={(k) => { const a = getAyah(k); go('/quran/' + a.p); setTimeout(() => reciteStart(k), 600); }} onShare={(k, t) => { setTafsir(null); setShare({ k, t }); }} onClose={() => setTafsir(null)} />}
        {share && <ShareSheet key="sh" k={share.k} tafsir={share.t} getAyah={getAyah} onClose={() => setShare(null)} />}
      </AnimatePresence>
    </section>
  );
}
