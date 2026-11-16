import { useMemo, useState } from 'react';
import { BookMarked, Bookmark, Search, ChevronLeft, GraduationCap } from 'lucide-react';
import { useStore } from '../store.js';
import { SURAHS, JUZ, surahAt } from '../lib/quran.js';
import { ar } from '../lib/arabic.js';

const strip = (s) => s.replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');

export default function QuranIndex() {
  const [tab, setTab] = useState('surah');
  const [q, setQ] = useState('');
  const quran = useStore((s) => s.quran);
  const s = surahAt(quran.lastPage);
  const list = useMemo(() => { const k = strip(q.trim()); return k ? SURAHS.filter((x) => strip(x.name).includes(k) || String(x.n) === q.trim()) : SURAHS; }, [q]);

  return (
    <div className="screen">
      <h1 className="title center">المصحف الشريف</h1>

      <a href={'#/quran/' + quran.lastPage} className="card hl row" style={{ textDecoration: 'none', color: 'var(--text)', background: 'var(--hero)', borderColor: 'transparent' }}>
        <BookMarked size={28} style={{ color: 'var(--heroText)' }} aria-hidden="true" />
        <div style={{ flex: 1, color: 'var(--heroText)' }}>
          <div className="xs" style={{ opacity: .85 }}>تابع من حيث توقفت</div>
          <div className="h2">سورة {s.name} · صفحة {ar(quran.lastPage)}</div>
        </div>
        <ChevronLeft size={20} style={{ color: 'var(--heroText)' }} aria-hidden="true" />
      </a>

      <a href="#/hifz" className="card row" style={{ textDecoration: 'none', color: 'var(--text)' }}>
        <GraduationCap size={26} className="accent" aria-hidden="true" />
        <div style={{ flex: 1 }}><div className="h2">متابعة الحفظ</div><div className="xs muted">ورد الحفظ اليومي والمراجعة وخريطة الأجزاء</div></div>
        <ChevronLeft size={20} className="muted" aria-hidden="true" />
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 4, padding: 4, borderRadius: 16, background: 'var(--surf2)' }} role="tablist">
        {[['surah', 'السور'], ['juz', 'الأجزاء'], ['marks', 'العلامات']].map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{ minHeight: 40, borderRadius: 12, border: 0, background: tab === id ? 'var(--surf)' : 'transparent', color: tab === id ? 'var(--acc)' : 'var(--muted)', fontWeight: tab === id ? 600 : 400, fontSize: 13 }}>{l}</button>
        ))}
      </div>

      {tab === 'surah' && (
        <>
          <label className="row card" style={{ padding: '0 14px', minHeight: 48 }}>
            <Search size={18} className="muted" aria-hidden="true" />
            <span className="sr">ابحث عن سورة</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم السورة أو رقمها" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', minHeight: 46 }} />
          </label>
          <div className="col" style={{ gap: 8 }}>
            {list.map((x) => (
              <a key={x.n} href={'#/quran/' + x.page} className="card row" style={{ padding: '12px 14px', textDecoration: 'none', color: 'var(--text)' }}>
                <span style={{ width: 38, height: 38, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'var(--surf2)', color: 'var(--acc)', fontWeight: 600, fontSize: 13 }}>{ar(x.n)}</span>
                <div style={{ flex: 1 }}><div className="amiri" style={{ fontSize: 19, fontWeight: 700 }}>سورة {x.name}</div><div className="xs muted">{ar(x.ayahs)} آية · الجزء {ar(x.juz)}</div></div>
                <span className="xs muted">ص {ar(x.page)}</span>
              </a>
            ))}
            {!list.length && <div className="center muted small">لا توجد سورة بهذا الاسم</div>}
          </div>
        </>
      )}

      {tab === 'juz' && (
        <div className="grid2">
          {JUZ.map((j) => (
            <a key={j.juz} href={'#/quran/' + j.page} className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
              <div className="h2">الجزء {ar(j.juz)}</div>
              <div className="xs muted">{SURAHS[j.s - 1].name} · آية {ar(j.a)} · ص {ar(j.page)}</div>
            </a>
          ))}
        </div>
      )}

      {tab === 'marks' && (
        <div className="col" style={{ gap: 8 }}>
          {!quran.bookmarks.length && <div className="card center small muted" style={{ lineHeight: 1.9 }}>لا توجد علامات بعد.<br />اضغط على أيقونة العلامة أثناء القراءة لحفظ أي صفحة.</div>}
          {quran.bookmarks.map((p) => (
            <a key={p} href={'#/quran/' + p} className="card row" style={{ textDecoration: 'none', color: 'var(--text)' }}>
              <Bookmark size={20} className="accent" fill="currentColor" aria-hidden="true" />
              <div style={{ flex: 1 }}><div className="h2">سورة {surahAt(p).name}</div><div className="xs muted">صفحة {ar(p)}</div></div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
