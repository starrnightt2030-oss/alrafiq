// أصوات التطبيق — مولَّدة برمجيًّا (أجراس ونقرات هادئة) بدون موسيقى، وتُشغَّل فقط إذا كانت الأصوات مفعّلة
import { useStore } from '../store.js';

let ctx = null;
const getCtx = () => {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const enabled = () => {
  const s = useStore.getState().settings;
  return s.sound ? s.volume : 0;
};

// جرس ناعم بتوافقيات خفيفة
function bell(c, freq, at, dur, gain) {
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  out.connect(c.destination);
  [[1, 1], [2.01, 0.35], [3.98, 0.12]].forEach(([m, g]) => {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq * m;
    og.gain.value = g;
    o.connect(og).connect(out);
    o.start(at);
    o.stop(at + dur + 0.05);
  });
}

// نقرة حبّة سبحة خشبية
function bead(c, at, gain) {
  const len = Math.floor(c.sampleRate * 0.045);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1700;
  bp.Q.value = 4;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(c.destination);
  src.start(at);
  const o = c.createOscillator();
  const og = c.createGain();
  o.frequency.setValueAtTime(880, at);
  o.frequency.exponentialRampToValueAtTime(520, at + 0.05);
  og.gain.setValueAtTime(gain * 0.25, at);
  og.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
  o.connect(og).connect(c.destination);
  o.start(at);
  o.stop(at + 0.08);
}

// مقام حجاز خفيف: ري – مي بيمول – فا دييز – صول – لا
const HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 587.33];

export const sound = {
  tap() { const v = enabled(); if (!v) return; const c = getCtx(); if (c) bead(c, c.currentTime, 0.5 * v); },
  next() { const v = enabled(); if (!v) return; const c = getCtx(); if (!c) return; const t = c.currentTime; bell(c, HIJAZ[3] * 2, t, 0.9, 0.18 * v); bell(c, HIJAZ[5] * 2, t + 0.11, 1.1, 0.14 * v); },
  milestone() { const v = enabled(); if (!v) return; const c = getCtx(); if (!c) return; const t = c.currentTime; [0, 1, 2, 3, 4, 5].forEach((i) => bell(c, HIJAZ[i] * 2, t + i * 0.09, 1.4, 0.13 * v)); },
  complete() { const v = enabled(); if (!v) return; const c = getCtx(); if (!c) return; const t = c.currentTime; [5, 4, 2, 5].forEach((n, i) => bell(c, HIJAZ[n] * (i === 3 ? 4 : 2), t + i * 0.16, 1.8, 0.14 * v)); },
  intro() { const v = enabled(); if (!v) return; const c = getCtx(); if (!c) return; const t = c.currentTime + 0.05; bell(c, HIJAZ[0], t, 2.6, 0.12 * v); bell(c, HIJAZ[3] * 2, t + 0.5, 2.2, 0.1 * v); bell(c, HIJAZ[5] * 2, t + 0.9, 2.4, 0.09 * v); },
  notify() { const v = enabled(); if (!v) return; const c = getCtx(); if (!c) return; const t = c.currentTime; [3, 5, 3].forEach((n, i) => bell(c, HIJAZ[n] * 2, t + i * 0.22, 1.2, 0.15 * v)); },
  unlock() { getCtx(); },
};
