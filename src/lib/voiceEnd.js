// نهاية صوت الشيخ الحقيقية في ملف الآية.
// ملفات الآيات فيها في الآخر سكوت أو صدى (أحيانًا ثانية أو اتنين)، والمشغّل مش بيقول «خلص» إلا بعدها،
// فالمستخدم كان بيستنى كام ثانية بعد ما الشيخ يسكت. هنا بنحلّل الملف ونعرف آخر لحظة فيها صوت فعلًا.
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const cache = new Map();
let ctx = null;
const ac = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());

function b64ToBuf(b64) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

async function bytesOf(src) {
  // ملفات الإنترنت: على الموبايل بنجيبها من أندرويد مباشرة (المتصفح الداخلي بيمنع قراءة ملف من موقع تاني)
  if (/^https?:/.test(src) && !src.startsWith(location.origin) && Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.get({ url: src, responseType: 'arraybuffer' });
    if (r.status !== 200 || !r.data) throw new Error('http ' + r.status);
    return typeof r.data === 'string' ? b64ToBuf(r.data) : r.data;
  }
  const r = await fetch(src);
  if (!r.ok) throw new Error('fetch ' + r.status);
  return r.arrayBuffer();
}

// آخر لحظة (بالثانية) فيها صوت أعلى من ٧٪ من أعلى صوت في الآية
export function analyze(buf) {
  const n = buf.numberOfChannels, sr = buf.sampleRate, win = Math.round(sr * 0.03);
  const ch = [...Array(n)].map((_, k) => buf.getChannelData(k));
  const frames = Math.floor(buf.length / win), rms = new Float32Array(frames);
  let peak = 0;
  for (let f = 0; f < frames; f++) {
    let s = 0;
    for (let k = 0; k < n; k++) { const d = ch[k]; for (let i = f * win, e = i + win; i < e; i += 2) s += d[i] * d[i]; }
    rms[f] = Math.sqrt(s / (win / 2 * n)); if (rms[f] > peak) peak = rms[f];
  }
  if (!peak) return null;
  const th = peak * 0.07;
  let f = frames - 1; while (f > 0 && rms[f] < th) f--;
  return Math.min(buf.duration, (f + 1) * win / sr + 0.12);
}

export function voiceEnd(src) {
  if (!cache.has(src)) {
    const p = (async () => {
      const raw = await bytesOf(src);
      const buf = await ac().decodeAudioData(raw);
      return analyze(buf);
    })().catch(() => null);
    cache.set(src, p);
    if (cache.size > 80) cache.delete(cache.keys().next().value);
  }
  return cache.get(src);
}
