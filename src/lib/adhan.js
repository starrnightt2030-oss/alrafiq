// الأذان: تشغيل ملف الأذان عند دخول وقت الصلاة (أثناء فتح التطبيق) مع إشعار
import { useEffect, useState } from 'react';
import { useStore } from '../store.js';
import { resolveLocation, timesFor } from './prayer.js';
import { todayKey } from './arabic.js';
const url = (f) => new URL('audio/adhan/' + f, document.baseURI).href;
const fajrUrl = url('fajr.mp3'), adhanUrl = url('adhan.mp3'), duaUrl = url('dua.mp3');

export const MUEZZIN = 'الشيخ نصر الدين طوبار';
let audio = null, phase = null; // phase: 'adhan' | 'dua'
const listeners = new Set();
const emit = () => listeners.forEach((f) => f({ playing: !!audio && !audio.paused && !audio.ended, phase }));

// key: اسم الصلاة، أو 'dua' لتشغيل دعاء ما بعد الأذان وحده
export async function playAdhan(key) {
  stopAdhan();
  const s = useStore.getState().settings.adhan;
  phase = key === 'dua' ? 'dua' : 'adhan';
  audio = new Audio(key === 'dua' ? duaUrl : key === 'fajr' ? fajrUrl : adhanUrl);
  audio.volume = s.volume;
  audio.onpause = emit;
  audio.onended = () => {
    // بعد انتهاء الأذان يُشغَّل دعاء ما بعد الأذان تلقائيًّا إن كان مفعّلًا
    if (phase === 'adhan' && useStore.getState().settings.adhan.dua) {
      phase = 'dua'; audio.src = duaUrl; audio.play().then(emit).catch(emit);
    } else emit();
  };
  try {
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: key === 'dua' ? 'دعاء ما بعد الأذان' : key === 'fajr' ? 'أذان الفجر' : 'الأذان', artist: MUEZZIN, album: 'الرفيق' });
    await audio.play(); emit(); return true;
  } catch { emit(); return false; }
}
export const adhanTime = () => (audio && phase === 'adhan' ? audio.currentTime : 0);
export function stopAdhan() { if (audio) { audio.onended = null; audio.pause(); audio.currentTime = 0; } emit(); }
export function useAdhanState() {
  const [p, setP] = useState({ playing: false, phase: null });
  useEffect(() => { listeners.add(setP); return () => listeners.delete(setP); }, []);
  return p;
}

const played = new Set();
// يراقب دخول وقت كل صلاة ويعيد اسم الصلاة الحالية لعرض شاشة الأذان
export function useAdhanWatcher(onAdhan) {
  useEffect(() => {
    const tick = () => {
      const st = useStore.getState().settings;
      if (!st.adhan.enabled) return;
      const now = new Date();
      const place = resolveLocation(st.location);
      for (const p of timesFor(place, now)) {
        if (p.info || !st.adhan.prayers[p.key]) continue;
        const id = todayKey() + p.key;
        const diff = now - p.time;
        if (diff >= 0 && diff < 120000 && !played.has(id)) { played.add(id); onAdhan(p); }
      }
    };
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line
}
