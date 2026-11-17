// تشغيل صوت القصص المولَّد مسبقًا (ملفات MP3 بصوت الراوي). عند الآيات: يقول الراوي «قال الله تعالى…»
// ثم يتوقف لحظات ليقرأ المستخدم الآية المعروضة، ثم يتابع. وإن لم تتوفر ملفات للفصل يُستخدم صوت الجهاز.
import { useEffect, useRef, useState } from 'react';

let manifestP = null;
export function loadManifest() {
  if (!manifestP) manifestP = fetch(new URL('audio/stories/manifest.json', document.baseURI), { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return manifestP;
}

const readingPause = (text) => Math.min(18000, Math.max(4500, (text?.length || 60) * 85));

export function useStoryAudio(story, quranText) {
  const [parts, setParts] = useState(null);
  const [state, setState] = useState({ playing: false, cur: -1, waiting: false, idx: -1 });
  const audio = useRef(null), timer = useRef(null), idxRef = useRef(-1), rate = useRef(1);

  useEffect(() => { let on = true; loadManifest().then((m) => { if (on) setParts(m?.stories?.[story.id]?.parts || null); }); return () => { on = false; }; }, [story.id]);
  useEffect(() => () => stop(), [story.id]); // eslint-disable-line

  const hl = (p) => (p && p.i !== undefined ? p.i : p?.k === 'lessons' ? 'lessons' : -1);

  function playAt(n) {
    clearTimeout(timer.current);
    if (!parts || n >= parts.length) { stop(); return; }
    idxRef.current = n;
    const p = parts[n];
    if (!audio.current) audio.current = new Audio();
    const a = audio.current;
    a.src = /^https?:/.test(p.f) ? p.f : new URL('audio/stories/' + p.f, document.baseURI).href; // الآيات بصوت قارئ من مصدر التلاوة
    a.playbackRate = rate.current;
    a.onended = () => {
      if (p.q) { setState((s) => ({ ...s, waiting: true })); timer.current = setTimeout(() => playAt(n + 1), readingPause(quranText(p.i))); }
      else playAt(n + 1);
    };
    setState({ playing: true, cur: hl(p), waiting: false, idx: n });
    const el = document.getElementById(p.k === 'lessons' ? 'lessons' : 'para-' + p.i);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    a.play().catch(() => stop());
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: story.title, artist: 'الراوي محمد الدولي', album: story.col?.title || 'القصص' });
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('play', resume);
        navigator.mediaSession.setActionHandler('nexttrack', () => playAt(idxRef.current + 1));
      } catch {}
    }
  }
  function pause() { clearTimeout(timer.current); audio.current?.pause(); setState((s) => ({ ...s, playing: false })); }
  function resume() { if (state.waiting || audio.current?.ended) playAt(idxRef.current + 1); else { audio.current?.play(); setState((s) => ({ ...s, playing: true })); } }
  function stop() { clearTimeout(timer.current); if (audio.current) { audio.current.pause(); audio.current.src = ''; } idxRef.current = -1; setState({ playing: false, cur: -1, waiting: false, idx: -1 }); }
  function setRate(r) { rate.current = r; if (audio.current) audio.current.playbackRate = r; }

  return {
    available: !!parts, ...state, active: state.idx >= 0,
    start: () => playAt(0), pause, resume, stop, next: () => playAt(idxRef.current + 1), prev: () => playAt(Math.max(0, idxRef.current - 1)), setRate,
  };
}
