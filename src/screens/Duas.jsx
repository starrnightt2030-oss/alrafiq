import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart, Copy, Share2, Clock } from 'lucide-react';
import { useStore } from '../store.js';
import { DUAS, CATEGORIES } from '../data/duas.js';
import { ar } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { TopBar, toast } from '../components/ui.jsx';

const strip = (s) => s.replace(/[ً-ٰٟۖ-ۭۥۦ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const plain = (d) => d.quran ? `﴿${d.text}﴾ [${d.refName}]` : `${d.text}\n— ${d.src}`;

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('تم نسخ الدعاء'); }
  catch { toast('تعذّر النسخ على هذا الجهاز'); }
}
async function share(text) {
  if (navigator.share) { try { await navigator.share({ text: text + '\n\nمن تطبيق الرفيق' }); return; } catch { return; } }
  copy(text);
}

export default function Duas() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const favs = useStore((s) => s.favDuas);
  const toggleFav = useStore((s) => s.toggleFavDua);
  const scale = useStore((s) => s.settings.textScale);

  const list = useMemo(() => {
    const k = strip(q.trim());
    return DUAS.filter((d) => (cat === 'all' || (cat === 'fav' ? favs.includes(d.id) : d.cats.includes(cat))) &&
      (!k || strip(d.text + ' ' + d.who + ' ' + d.when).includes(k)));
  }, [cat, q, favs]);

  return (
    <div className="screen no-nav">
      <TopBar title="الأدعية" sub={`${ar(DUAS.length)} دعاءً من القرآن الكريم والسنة الصحيحة`} />

      <label className="card row" style={{ padding: '0 14px', minHeight: 48 }}>
        <Search size={18} className="muted" aria-hidden="true" />
        <span className="sr">ابحث في الأدعية</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: كرب، رزق، ذرية، مغفرة…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 46 }} />
      </label>

      <div className="chips" role="tablist" aria-label="التصنيفات">
        {[...CATEGORIES.slice(0, 1), { id: 'fav', name: `المفضلة${favs.length ? ' · ' + ar(favs.length) : ''}` }, ...CATEGORIES.slice(1)].map((c) => (
          <button key={c.id} role="tab" aria-selected={cat === c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.name}</button>
        ))}
      </div>

      {!list.length && (
        <div className="card center small muted" style={{ lineHeight: 1.9 }}>
          {cat === 'fav' ? 'لم تضف أدعية للمفضلة بعد. اضغط على القلب في أي دعاء لحفظه هنا.' : 'لا توجد نتائج — جرّب كلمة أخرى.'}
        </div>
      )}

      {list.map((d, idx) => {
        const fav = favs.includes(d.id);
        return (
          <motion.article key={d.id} className="card col" style={{ gap: 10 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 6) * 0.03 }}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <span className="small accent" style={{ fontWeight: 600, lineHeight: 1.6 }}>{d.who}</span>
              <span className="xs" style={{ flex: 'none', padding: '4px 10px', borderRadius: 999, background: 'var(--surf2)' }}>{d.quran ? d.refName : 'من السنة'}</span>
            </div>
            <p className={d.quran ? 'hafs' : 'amiri'} style={{ margin: 0, fontSize: (d.quran ? 21 : 19) * scale, lineHeight: 2.05, textAlign: 'center' }}>
              {d.quran ? <>﴿{d.text}﴾</> : d.text}
            </p>
            <div className="row small" style={{ alignItems: 'flex-start', gap: 8, lineHeight: 1.8 }}>
              <Clock size={16} className="accent" style={{ flex: 'none', marginTop: 4 }} aria-hidden="true" />
              <span><b className="accent">متى يُقال: </b>{d.when}{!d.quran && <span className="muted"> — {d.src}</span>}</span>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label={fav ? 'إزالة من المفضلة' : 'أضف للمفضلة'} aria-pressed={fav} onClick={() => { toggleFav(d.id); vibrate(10); }}>
                <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
              </button>
              <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label="نسخ" onClick={() => copy(plain(d))}><Copy size={18} /></button>
              <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label="مشاركة" onClick={() => share(plain(d))}><Share2 size={18} /></button>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
