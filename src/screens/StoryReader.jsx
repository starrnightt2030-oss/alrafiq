import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, ChevronLeft, AArrowUp, AArrowDown, Headphones, Pause, Lightbulb, BookOpenCheck } from 'lucide-react';
import { useStore } from '../store.js';
import { STORY, minutes } from '../data/stories/index.js';
import Q from '../data/quranSnippets.json';
import { refName } from '../lib/ref.js';
import { ar, minutesAr } from '../lib/arabic.js';
import { vibrate } from '../lib/haptics.js';
import { sound } from '../lib/sound.js';
import { back, go } from '../router.js';
import { toast } from '../components/ui.jsx';
import { useStoryAudio } from '../lib/storyAudio.js';
import { Play, SkipBack, SkipForward, Square } from 'lucide-react';

// قراءة صوتية تجريبية بأصوات الجهاز العربية — تتخطى الآيات احترامًا للتلاوة الصحيحة
function useSpeech(paragraphs) {
  const [cur, setCur] = useState(-1);
  const stop = () => { try { speechSynthesis.cancel(); } catch {} setCur(-1); };
  useEffect(() => stop, []); // eslint-disable-line
  const play = () => {
    if (!('speechSynthesis' in window)) { toast('القراءة الصوتية غير مدعومة على هذا الجهاز'); return; }
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === 'ar-EG') || voices.find((v) => v.lang?.startsWith('ar'));
    if (!voice && voices.length) { toast('لا يوجد صوت عربي مثبّت على جهازك'); return; }
    speechSynthesis.cancel();
    const list = paragraphs.map((p, i) => [p, i]).filter(([p]) => typeof p === 'string');
    list.forEach(([text, i], k) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice?.lang || 'ar-EG'; if (voice) u.voice = voice; u.rate = 0.92;
      u.onstart = () => { setCur(i); document.getElementById('para-' + i)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      if (k === list.length - 1) u.onend = () => setCur(-1);
      speechSynthesis.speak(u);
    });
  };
  return { cur, playing: cur >= 0, play, stop };
}

export default function StoryReader({ id }) {
  const s = STORY[id];
  const st = useStore((x) => x.stories);
  const { saveStoryPos, toggleStoryMark, finishStory, setSetting } = useStore();
  const scale = useStore((x) => x.settings.textScale);
  const [pct, setPct] = useState(st.pos[id] || 0);
  const restored = useRef(false);
  const speech = useSpeech(s?.body || []);
  const narr = useStoryAudio(s || { id: '' }, (i) => { const p = s?.body[i]; return p && p.q ? Q[p.q] : ''; });
  const [rate, setRate] = useState(1);
  const listening = narr.active || speech.playing;
  const curPara = narr.active ? narr.cur : speech.cur;
  const toggleListen = () => {
    if (listening) { narr.stop(); speech.stop(); return; }
    if (narr.available) narr.start(); else { toast('الصوت المسجّل لهذا الفصل غير متوفر بعد — قراءة تجريبية بصوت الجهاز'); speech.play(); }
  };

  useEffect(() => {
    if (!s) { go('/stories'); return; }
    restored.current = false;
    const saved = useStore.getState().stories.pos[id] || 0;
    const t = setTimeout(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (saved > 0.03 && saved < 0.97) window.scrollTo({ top: saved * max });
      restored.current = true;
    }, 120);
    saveStoryPos(id, saved);
    return () => clearTimeout(t);
  }, [id]); // eslint-disable-line

  useEffect(() => {
    let raf = 0, timer = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? Math.min(1, scrollY / max) : 1;
        setPct(p);
        if (!restored.current) return;
        clearTimeout(timer); timer = setTimeout(() => saveStoryPos(id, +p.toFixed(3)), 300);
        if (p > 0.96 && !useStore.getState().stories.done.includes(id)) { finishStory(id); sound.next(); toast('أتممت قراءة هذا الفصل — بارك الله فيك (+٢٠ نقطة)'); }
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [id]); // eslint-disable-line

  if (!s) return null;
  const items = s.col.items;
  const prev = items[s.index - 1], next = items[s.index + 1];
  const marked = st.marks.includes(id);
  const fs = 18.5 * scale;

  return (
    <div className="screen no-nav" style={{ paddingTop: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, margin: '0 -18px', padding: 'calc(env(safe-area-inset-top) + 10px) 18px 10px', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="between">
          <button className="icon-btn" aria-label="رجوع" onClick={() => back('/stories/' + s.col.id)}><ChevronRight size={20} /></button>
          <div className="center" style={{ minWidth: 0, flex: 1 }}><div className="xs muted">{s.col.title} · الفصل {ar(s.index + 1)} من {ar(items.length)}</div></div>
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label={listening ? 'إيقاف الاستماع' : 'استمع بصوت الراوي'} onClick={toggleListen}>{listening ? <Square size={16} /> : <Headphones size={18} />}</button>
            <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label={marked ? 'إزالة العلامة' : 'حفظ علامة'} aria-pressed={marked} onClick={() => { toggleStoryMark(id); vibrate(10); toast(marked ? 'أُزيلت العلامة' : 'حُفظت العلامة — ستجدها في علاماتي'); }}><Bookmark size={18} fill={marked ? 'currentColor' : 'none'} /></button>
          </div>
        </div>
        <div className="bar" style={{ marginTop: 10, height: 4 }}><i style={{ width: pct * 100 + '%', transition: 'none' }} /></div>
      </div>

      <motion.header key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="center" style={{ padding: '6px 0 4px' }}>
        <h1 className="amiri accent" style={{ fontSize: 32, margin: 0, lineHeight: 1.4 }}>{s.title}</h1>
        <div className="small muted">{s.sub}</div>
        <div className="row xs muted" style={{ justifyContent: 'center', marginTop: 8, gap: 10 }}>
          <span>قراءة {minutesAr(minutes(s))}</span>·
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="تصغير الخط" onClick={() => setSetting('textScale', Math.max(.8, +(scale - .1).toFixed(2)))}><AArrowDown size={16} /></button>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="تكبير الخط" onClick={() => setSetting('textScale', Math.min(1.5, +(scale + .1).toFixed(2)))}><AArrowUp size={16} /></button>
        </div>
      </motion.header>

      <article className="col" style={{ gap: 16 }}>
        {s.body.map((p, i) => typeof p === 'string' ? (
          <p key={i} id={'para-' + i} className="amiri" style={{ margin: 0, fontSize: fs, lineHeight: 2.05, textAlign: 'justify', padding: curPara === i ? '6px 10px' : 0, borderRadius: 12, background: curPara === i ? 'color-mix(in srgb, var(--acc) 14%, transparent)' : 'transparent', transition: 'all .3s' }}>{p}</p>
        ) : (
          <figure key={i} id={'para-' + i} className="card center" style={{ margin: 0, background: 'var(--surf)', borderColor: 'var(--acc)', boxShadow: curPara === i ? '0 0 0 3px color-mix(in srgb, var(--acc) 35%, transparent)' : 'none', transition: 'box-shadow .3s' }}>
            <p className="hafs" style={{ margin: 0, fontSize: fs + 2, lineHeight: 2.15 }}>﴿{Q[p.q]}﴾</p>
            <figcaption className="xs muted" style={{ marginTop: 4 }}>{refName(p.q)}</figcaption>
          </figure>
        ))}
      </article>

      <section id="lessons" className="card col" style={{ gap: 8, borderColor: curPara === 'lessons' ? 'var(--acc)' : 'var(--line)' }}>
        <div className="row h2"><Lightbulb size={18} className="accent" aria-hidden="true" />دروس وعبر</div>
        {s.lessons.map((l, i) => <div key={i} className="row small" style={{ alignItems: 'flex-start', lineHeight: 1.85 }}><span style={{ flex: 'none', width: 7, height: 7, marginTop: 10, borderRadius: '50%', background: 'var(--acc)' }} />{l}</div>)}
        <div className="xs muted" style={{ borderTop: '1px dashed var(--line)', paddingTop: 8, marginTop: 4 }}>المصادر: {s.src}</div>
      </section>

      {st.done.includes(id) && <div className="row small accent" style={{ justifyContent: 'center' }}><BookOpenCheck size={18} aria-hidden="true" />قرأت هذا الفصل</div>}

      <div className="grid2">
        {prev ? <a className="btn ghost" href={'#/story/' + prev.id} style={{ justifyContent: 'flex-start' }}><ChevronRight size={18} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prev.title}</span></a> : <span />}
        {next ? <a className="btn" href={'#/story/' + next.id} style={{ justifyContent: 'flex-end' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.title}</span><ChevronLeft size={18} /></a> : <a className="btn" href={'#/stories/' + s.col.id}>العودة للفهرس</a>}
      </div>
      {narr.active && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 12px)', left: 12, right: 12, maxWidth: 496, margin: '0 auto', zIndex: 40, padding: '10px 12px', borderRadius: 22, background: 'var(--nav)', border: '1px solid var(--line)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: '0 14px 34px -12px rgba(0,0,0,.5)' }}>
          <div className="between" style={{ gap: 8 }}>
            <div className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
              <span className="small" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
              <span className="xs muted">{narr.waiting ? 'تأمّل الآية… يتابع الراوي بعد لحظات' : 'بصوت الراوي شاكر'}</span>
            </div>
            <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label="السابق" onClick={narr.prev}><SkipForward size={17} /></button>
            <button className="icon-btn" style={{ width: 46, height: 46, background: 'var(--acc)', color: 'var(--onAcc)', border: 0 }} aria-label={narr.playing ? 'إيقاف مؤقت' : 'تشغيل'} onClick={narr.playing ? narr.pause : narr.resume}>{narr.playing ? <Pause size={20} /> : <Play size={20} />}</button>
            <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label="التالي" onClick={narr.next}><SkipBack size={17} /></button>
            <button className="icon-btn" style={{ width: 40, height: 40, fontSize: 12, fontWeight: 600 }} aria-label="سرعة القراءة" onClick={() => { const r = rate === 1 ? 1.25 : rate === 1.25 ? 0.9 : 1; setRate(r); narr.setRate(r); }}>{rate === 1 ? '١×' : rate === 1.25 ? '١٫٢٥×' : '٠٫٩×'}</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
