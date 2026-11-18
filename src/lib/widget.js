// ويدجت الشاشة الرئيسية (أندرويد): نكتب المواقيت وحالة الأذكار والمسبحة، ونسحب تسبيحات الويدجت لوردك
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useStore, streakOf } from '../store.js';
import { resolveLocation, timesFor, fmtTime } from './prayer.js';
import { todayKey } from './arabic.js';
import { hijriParts, HMONTHS } from './fasting.js';
import { WIRD } from '../data/wird.js';

const Widget = registerPlugin('RafiqWidget');
const native = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
const arD = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const TASBIH = ['subhanbihamdih', 'istighfar', 'salah', 'lailaha', 'hawqala', 'baqiyat', 'tasbeeh', 'tahmeed', 'takbeer'];

export function widgetData(s = useStore.getState()) {
  const place = resolveLocation(s.settings.location);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push({ date: todayKey(d), p: timesFor(place, d).map((p) => ({ k: p.key, n: p.name, t: p.time.getTime(), s: fmtTime(p.time, place.tz).replace(/\s+/g, ' '), info: !!p.info })) });
  }
  const t = todayKey(); const day = s.days[t] || { azkar: {}, wird: {} };
  const h = hijriParts(new Date());
  return {
    v: 1, city: place.name, hijri: `${arD(h.d)} ${HMONTHS[h.m - 1]} ${arD(h.y)} هـ`, days,
    azkar: { date: t, m: !!day.azkar?.morning?.done, e: !!day.azkar?.evening?.done },
    streak: streakOf(s.days),
    tasbih: { date: t, list: TASBIH.map((id) => { const w = WIRD.find((x) => x.id === id); return { id, short: w.short, base: day.wird?.[id] || 0 }; }) },
  };
}

let last = '';
export async function pushWidget() {
  if (!native) return;
  try { const json = JSON.stringify(widgetData()); if (json === last) return; last = json; await Widget.update({ json }); }
  catch (e) { last = ''; console.warn('widget', e); }
}

// تسبيحات اتعدّت من الويدجت والتطبيق مقفول — نضيفها للورد
export async function drainTasbih() {
  if (!native) return 0;
  try {
    const { json } = await Widget.drain(); const p = JSON.parse(json || '{}');
    const st = useStore.getState(); const t = todayKey(); let total = 0;
    const apply = (date, c) => Object.entries(c || {}).forEach(([id, n]) => {
      if (!n) return; total += n;
      if (date === t) st.addWird(id, n);
      else useStore.setState((s) => { const d = s.days[date] || { azkar: {}, wird: {} }; return { days: { ...s.days, [date]: { ...d, wird: { ...d.wird, [id]: (d.wird?.[id] || 0) + n } } } }; });
    });
    if (p.old) apply(p.old.date, p.old.c);
    if (p.date) apply(p.date, p.c);
    return total;
  } catch { return 0; }
}

export function startWidgetSync() {
  if (!native) return () => {};
  const sync = async () => { const n = await drainTasbih(); last = ''; await pushWidget(); if (n) import('../components/ui.jsx').then(({ toast }) => toast(`اتضاف ${arD(n)} تسبيحة من الويدجت لوردك 📿`)); };
  setTimeout(sync, 1500);
  let tm = null;
  const unsub = useStore.subscribe((s, p) => { if (s.days !== p.days || s.settings.location !== p.settings.location) { clearTimeout(tm); tm = setTimeout(pushWidget, 2000); } });
  const vis = () => { if (document.visibilityState === 'visible') sync(); else pushWidget(); };
  document.addEventListener('visibilitychange', vis);
  return () => { unsub(); document.removeEventListener('visibilitychange', vis); };
}

// روابط الويدجت alrafiq://open/azkar/morning → #/azkar/morning
export async function handleWidgetLinks() {
  if (!native) return;
  const { App } = await import('@capacitor/app');
  const go = (url) => { const m = /^alrafiq:\/\/open(\/.*)?$/.exec(url || ''); if (m) location.hash = m[1] || '/'; };
  App.addListener('appUrlOpen', (e) => go(e.url));
  App.getLaunchUrl().then((r) => go(r?.url)).catch(() => {});
}
