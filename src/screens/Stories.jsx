import { BookOpen, Swords, Users, ScrollText, Lightbulb, Bookmark, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store.js';
import { COLLECTIONS, STORY, minutes } from '../data/stories/index.js';
import { ar, minutesAr } from '../lib/arabic.js';
import { TopBar } from '../components/ui.jsx';

const ICONS = { sirah: ScrollText, ghazawat: Swords, sahaba: Users, anbiya: BookOpen, ibar: Lightbulb };

export function StoriesHome() {
  const st = useStore((s) => s.stories);
  const last = st.last && STORY[st.last];
  return (
    <div className="screen no-nav">
      <TopBar title="القصص والسيرة" sub="قصص حقيقية من القرآن والسنة والسيرة" />

      {last && (
        <a href={'#/story/' + last.id} style={{ position: 'relative', borderRadius: 26, padding: 18, background: 'var(--hero)', color: 'var(--heroText)', textDecoration: 'none', overflow: 'hidden' }}>
          <div className="between xs" style={{ opacity: .9 }}><span style={{ fontWeight: 600 }}>تابع القراءة</span>{st.marks.includes(last.id) && <span className="row" style={{ gap: 4 }}><Bookmark size={13} fill="currentColor" aria-hidden="true" />علامة محفوظة</span>}</div>
          <div className="amiri" style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{last.title}</div>
          <div className="xs" style={{ opacity: .85 }}>{last.col.title} · الفصل {ar(last.index + 1)}</div>
          <div style={{ marginTop: 12, height: 6, borderRadius: 6, background: 'rgba(255,255,255,.15)' }}><div style={{ width: Math.round((st.pos[last.id] || 0) * 100) + '%', height: '100%', borderRadius: 6, background: 'var(--heroText)' }} /></div>
          <div className="xs" style={{ marginTop: 6, opacity: .85 }}>{ar(Math.round((st.pos[last.id] || 0) * 100))}٪</div>
        </a>
      )}

      <h2 className="h2">المكتبة</h2>
      <div className="grid2">
        {COLLECTIONS.map((c) => {
          const I = ICONS[c.id]; const done = c.items.filter((x) => st.done.includes(x.id)).length;
          return (
            <a key={c.id} href={c.soon ? '#/stories' : '#/stories/' + c.id} aria-disabled={c.soon} className="card col" style={{ textDecoration: 'none', color: 'var(--text)', gap: 8, minHeight: 150, justifyContent: 'space-between', opacity: c.soon ? .65 : 1, position: 'relative' }}>
              {c.soon && <span className="xs" style={{ position: 'absolute', top: 10, left: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--surf2)', color: 'var(--muted)' }}>قريبًا</span>}
              <I size={30} className="accent" strokeWidth={1.6} aria-hidden="true" />
              <div>
                <div className="h2">{c.title}</div>
                <div className="xs muted" style={{ lineHeight: 1.7, marginTop: 2 }}>{c.desc}</div>
                {!c.soon && <div className="xs accent" style={{ marginTop: 6 }}>{ar(done)} من {ar(c.items.length)} {c.items.length > 10 ? 'فصلًا' : 'فصول'} مقروءة</div>}
              </div>
            </a>
          );
        })}
      </div>

      {st.marks.length > 0 && (
        <>
          <h2 className="h2">علاماتي</h2>
          {st.marks.filter((id) => STORY[id]).map((id) => (
            <a key={id} href={'#/story/' + id} className="card row" style={{ textDecoration: 'none', color: 'var(--text)' }}>
              <Bookmark size={20} className="accent" fill="currentColor" aria-hidden="true" />
              <div style={{ flex: 1 }}><div className="h2">{STORY[id].title}</div><div className="xs muted">{STORY[id].col.title} · {ar(Math.round((st.pos[id] || 0) * 100))}٪</div></div>
              <ChevronLeft size={18} className="muted" aria-hidden="true" />
            </a>
          ))}
        </>
      )}
    </div>
  );
}

export function StoryList({ col }) {
  const c = COLLECTIONS.find((x) => x.id === col) || COLLECTIONS[0];
  const st = useStore((s) => s.stories);
  return (
    <div className="screen no-nav">
      <TopBar title={c.title} sub={c.desc} fallback="/stories" />
      {c.items.map((s, i) => {
        const done = st.done.includes(s.id); const p = st.pos[s.id] || 0;
        return (
          <a key={s.id} href={'#/story/' + s.id} className="card row" style={{ textDecoration: 'none', color: 'var(--text)', gap: 12 }}>
            <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--acc)' : 'var(--surf2)', color: done ? 'var(--onAcc)' : 'var(--acc)', fontWeight: 600 }}>
              {done ? <CheckCircle2 size={20} aria-label="مقروء" /> : ar(i + 1)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="amiri" style={{ fontSize: 19, fontWeight: 700 }}>{s.title}</div>
              <div className="xs muted">{s.sub} · {minutesAr(minutes(s))}</div>
              {!done && p > 0.02 && <div className="bar" style={{ marginTop: 6, height: 4 }}><i style={{ width: p * 100 + '%' }} /></div>}
            </div>
            {st.marks.includes(s.id) && <Bookmark size={16} className="accent" fill="currentColor" aria-label="علامة" />}
          </a>
        );
      })}
    </div>
  );
}
