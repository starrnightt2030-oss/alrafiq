// مشغّل التلاوة: ملف صوتي لكل آية (EveryAyah)، تتبّع الآية الحالية، تكرار الآية والمقطع، مهلة للترديد، وتحميل للاستماع دون إنترنت
import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import meta from '../data/quranMeta.json';
import { useStore } from '../store.js';
import logo from '../assets/logo.webp';

const NATIVE = Capacitor.isNativePlatform();
const BASE = 'https://everyayah.com/data/';
export const RECITERS = [
  { id: 'minshawy', ini: 'م', name: 'محمد صديق المنشاوي', style: 'مرتّل', folder: 'Minshawy_Murattal_128kbps', hue: '#1E9E74' },
  { id: 'husary', ini: 'ح', name: 'محمود خليل الحصري', style: 'مرتّل', folder: 'Husary_64kbps', hue: '#2F5FD0' },
  { id: 'husary-m', ini: 'ح', name: 'الحصري — المعلّم', style: 'للحفظ مع ترديد طفل', folder: 'Husary_Muallim_128kbps', hue: '#8A55D6' },
  { id: 'basit', ini: 'ب', name: 'عبد الباسط عبد الصمد', style: 'مرتّل', folder: 'Abdul_Basit_Murattal_64kbps', hue: '#D99A2B' },
  { id: 'basit-j', ini: 'ب', name: 'عبد الباسط عبد الصمد', style: 'مجوّد', folder: 'Abdul_Basit_Mujawwad_128kbps', hue: '#E0743A' },
  { id: 'minshawy-j', ini: 'م', name: 'محمد صديق المنشاوي', style: 'مجوّد', folder: 'Minshawy_Mujawwad_64kbps', hue: '#16A2B0' },
  { id: 'alafasy', ini: 'ع', name: 'مشاري راشد العفاسي', style: 'مرتّل', folder: 'Alafasy_64kbps', hue: '#D6588A' },
  { id: 'maher', ini: 'م', name: 'ماهر المعيقلي', style: 'مرتّل', folder: 'Maher_AlMuaiqly_64kbps', hue: '#3C7FD8' },
  { id: 'ghamadi', ini: 'غ', name: 'سعد الغامدي', style: 'مرتّل', folder: 'Ghamadi_40kbps', hue: '#2A9D8F' },
  { id: 'ayyoub', ini: 'أ', name: 'محمد أيوب', style: 'مرتّل', folder: 'Muhammad_Ayyoub_64kbps', hue: '#E2533E' },
];
export const reciterOf = (id) => RECITERS.find((r) => r.id === id) || RECITERS[0];
export const DEFAULTS = { reciter: 'minshawy', rate: 1, repeat: 1, gap: 0, range: 3, follow: true, hl: 'gold' };
// ألوان تظليل الآية الجاري تلاوتها
export const HL = { gold: ['ذهبي', '#E2A92B'], green: ['أخضر', '#1FA36A'], blue: ['أزرق', '#2F7BEA'], rose: ['وردي', '#E0507A'], purple: ['بنفسجي', '#8B5CF6'], orange: ['برتقالي', '#F07A2A'] };
const pad = (n) => String(n).padStart(3, '0');
const fileOf = (s, a) => pad(s) + pad(a) + '.mp3';
const urlOf = (folder, s, a) => BASE + folder + '/' + fileOf(s, a);
const ayahsIn = (s) => meta.surahs[s - 1].ayahs;
export const nextKey = ({ s, a }) => (a < ayahsIn(s) ? { s, a: a + 1 } : s < 114 ? { s: s + 1, a: 1 } : null);
export const prevKey = ({ s, a }) => (a > 1 ? { s, a: a - 1 } : s > 1 ? { s: s - 1, a: ayahsIn(s - 1) } : null);
const same = (x, y) => x && y && x.s === y.s && x.a === y.a;
const before = (x, y) => x.s < y.s || (x.s === y.s && x.a < y.a);

// ——— الحالة العامة ———
let st = { active: false, playing: false, loading: false, key: null, basmala: false, rep: 0, rangeRep: 0, range: null, progress: 0, error: null };
const subs = new Set();
const emit = (patch) => { st = { ...st, ...patch }; subs.forEach((f) => f()); };
export const useRecite = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => st);
export const getRecite = () => st;
const opts = () => ({ ...DEFAULTS, ...(useStore.getState().settings.recite || {}) });
export const setReciteOpt = (patch) => { const s = useStore.getState(); s.setSetting('recite', { ...opts(), ...patch }); if ('rate' in patch && audio) audio.playbackRate = patch.rate; };

let audio = null, pre = null, gapTimer = null, objUrl = null;
function ensureAudio() {
  if (audio) return audio;
  audio = new Audio(); audio.preload = 'auto';
  audio.addEventListener('playing', () => emit({ playing: true, loading: false, error: null }));
  audio.addEventListener('waiting', () => emit({ loading: true }));
  audio.addEventListener('pause', () => emit({ playing: false }));
  audio.addEventListener('timeupdate', () => { if (audio.duration) emit({ progress: audio.currentTime / audio.duration }); });
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', () => { if (!st.active) return; emit({ playing: false, loading: false, error: 'تعذّر تشغيل التلاوة — تأكد من اتصالك بالإنترنت أو حمّل السورة مسبقًا' }); });
  return audio;
}

// مصدر الملف: المحمّل على الجهاز أولًا، ثم الإنترنت
async function srcOf(folder, s, a) {
  const url = urlOf(folder, s, a);
  try {
    if (NATIVE) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const r = await Filesystem.getUri({ path: `recite/${folder}/${fileOf(s, a)}`, directory: Directory.Data });
      await Filesystem.stat({ path: `recite/${folder}/${fileOf(s, a)}`, directory: Directory.Data });
      return Capacitor.convertFileSrc(r.uri);
    }
    if ('caches' in window) { const hit = await (await caches.open('rf-recite')).match(url); if (hit) { const b = await hit.blob(); if (objUrl) URL.revokeObjectURL(objUrl); objUrl = URL.createObjectURL(b); return objUrl; } }
  } catch {}
  return url;
}

async function playKey(key, { basmala = false } = {}) {
  const o = opts(); const r = reciterOf(o.reciter);
  clearTimeout(gapTimer);
  const a = ensureAudio();
  emit({ active: true, key, basmala, loading: true, progress: 0, error: null });
  a.src = basmala ? await srcOf(r.folder, 1, 1) : await srcOf(r.folder, key.s, key.a);
  a.playbackRate = o.rate;
  try { await a.play(); } catch (e) { if (e?.name !== 'AbortError') emit({ loading: false, playing: false, error: 'اضغط تشغيل لبدء التلاوة' }); }
  media(key, r);
  // تحميل مسبق للآية التالية لتشغيل بلا انقطاع
  const n = nextKey(key); if (n && !basmala) { pre = new Audio(); pre.preload = 'auto'; srcOf(r.folder, n.s, n.a).then((u) => { if (pre) pre.src = u; }); }
}

function onEnded() {
  const o = opts();
  if (st.basmala) return playKey(st.key);
  const dur = audio?.duration || 0;
  const wait = o.gap === 'ayah' ? dur * 1000 / o.rate : (+o.gap || 0) * 1000;
  const go = () => {
    if (st.rep + 1 < o.repeat) { emit({ rep: st.rep + 1 }); return playKey(st.key); }
    let n = nextKey(st.key); let rangeRep = st.rangeRep;
    if (st.range && same(st.key, st.range.to)) {
      rangeRep += 1;
      if (st.range.times === 0 || rangeRep < st.range.times) n = st.range.from; else return stop(true);
    }
    if (!n) return stop(true);
    emit({ rep: 0, rangeRep });
    playKey(n, { basmala: n.a === 1 && n.s !== 1 && n.s !== 9 && (!st.range || !same(n, st.range.from) || rangeRep === 0) });
  };
  if (wait > 0) { emit({ playing: false, waiting: true }); gapTimer = setTimeout(() => { emit({ waiting: false }); go(); }, wait); } else go();
}

// ——— واجهة التحكم ———
export function start(key, range = null) {
  sound_unlock();
  emit({ rep: 0, rangeRep: 0, range, waiting: false });
  playKey(key, { basmala: key.a === 1 && key.s !== 1 && key.s !== 9 });
}
export function toggle() {
  if (!st.active) return;
  const a = ensureAudio();
  if (st.waiting) { clearTimeout(gapTimer); emit({ waiting: false }); return onEnded(); }
  if (a.paused) a.play().catch(() => {}); else a.pause();
}
export function skip(d) {
  if (!st.key) return;
  const n = d > 0 ? nextKey(st.key) : prevKey(st.key);
  if (!n) return;
  if (st.range && (before(n, st.range.from) || before(st.range.to, n))) emit({ range: null });
  emit({ rep: 0, waiting: false }); playKey(n);
}
export function setRange(range) { emit({ range, rangeRep: 0 }); }
export function stop(finished = false) {
  clearTimeout(gapTimer);
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  pre = null;
  emit({ active: false, playing: false, loading: false, waiting: false, key: null, range: null, rep: 0, rangeRep: 0, progress: 0, error: null, finished });
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
}
function sound_unlock() { ensureAudio(); }

function media(key, r) {
  if (!('mediaSession' in navigator)) return;
  const name = meta.surahs[key.s - 1].name.replace(/[ً-ْٰ]/g, '');
  navigator.mediaSession.metadata = new MediaMetadata({ title: `سورة ${name} — آية ${key.a}`, artist: r.name + (r.style ? ` (${r.style})` : ''), album: 'الرفيق — المصحف', artwork: [{ src: new URL(logo, location.href).href, sizes: '512x512', type: 'image/webp' }] });
  navigator.mediaSession.playbackState = 'playing';
  try {
    navigator.mediaSession.setActionHandler('play', toggle);
    navigator.mediaSession.setActionHandler('pause', toggle);
    navigator.mediaSession.setActionHandler('nexttrack', () => skip(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => skip(-1));
    navigator.mediaSession.setActionHandler('stop', () => stop());
  } catch {}
}

// ——— التحميل للاستماع دون إنترنت ———
export function ayahList(fromKey, toKey) { const out = []; let k = fromKey; while (k) { out.push(k); if (same(k, toKey)) break; k = nextKey(k); } return out; }
export async function isDownloaded(reciterId, s) {
  const r = reciterOf(reciterId); const last = { s, a: ayahsIn(s) };
  try {
    if (NATIVE) { const { Filesystem, Directory } = await import('@capacitor/filesystem'); await Filesystem.stat({ path: `recite/${r.folder}/${fileOf(last.s, last.a)}`, directory: Directory.Data }); return true; }
    return !!(await (await caches.open('rf-recite')).match(urlOf(r.folder, last.s, last.a)));
  } catch { return false; }
}
export async function download(reciterId, keys, onProgress, signal) {
  const r = reciterOf(reciterId);
  const list = [...keys]; if (!list.some((k) => k.s === 1 && k.a === 1)) list.unshift({ s: 1, a: 1 });
  let done = 0, failed = 0;
  const native = NATIVE ? await import('@capacitor/filesystem') : null;
  const cache = !NATIVE ? await caches.open('rf-recite') : null;
  const one = async (k) => {
    const url = urlOf(r.folder, k.s, k.a);
    try {
      if (native) {
        const path = `recite/${r.folder}/${fileOf(k.s, k.a)}`;
        try { await native.Filesystem.stat({ path, directory: native.Directory.Data }); } catch { await native.Filesystem.downloadFile({ url, path, directory: native.Directory.Data, recursive: true }); }
      } else if (!(await cache.match(url))) {
        const res = await fetch(url, { mode: 'cors' }); if (!res.ok) throw new Error(res.status); await cache.put(url, res);
      }
    } catch { failed++; }
    done++; onProgress?.(done / list.length);
  };
  for (let i = 0; i < list.length; i += 4) { if (signal?.aborted) break; await Promise.all(list.slice(i, i + 4).map(one)); }
  return { total: list.length, failed };
}
export async function clearDownloads() {
  if (NATIVE) { const { Filesystem, Directory } = await import('@capacitor/filesystem'); try { await Filesystem.rmdir({ path: 'recite', directory: Directory.Data, recursive: true }); } catch {} }
  else if ('caches' in window) await caches.delete('rf-recite');
}
export const surahKeys = (s) => ayahList({ s, a: 1 }, { s, a: ayahsIn(s) });
