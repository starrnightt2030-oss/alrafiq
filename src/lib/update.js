// التحقق من التحديثات: يقارن رقم الإصدار الحالي بملف version.json المنشور مع التطبيق
import { APP } from '../config.js';
import { Capacitor } from '@capacitor/core';

const NATIVE = Capacitor.isNativePlatform();
export const SITE = 'https://starrnightt2030-oss.github.io/alrafiq/';
export const APK_URL = 'https://github.com/starrnightt2030-oss/alrafiq/releases/latest/download/alrafiq.apk';

const cmp = (a, b) => {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); }
  return 0;
};

// على أندرويد نقارن بآخر ملف APK منشور فعلًا (وليس بنسخة الموقع التي تُنشر قبله بدقائق)
// حتى لا يظهر تنبيه لتحديث ملفه لم يجهز بعد فيتكرر التنبيه بعد التثبيت
async function latestApk() {
  const r = await fetch('https://api.github.com/repos/starrnightt2030-oss/alrafiq/releases/latest', { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error('تعذّر الاتصال بالخادم');
  const j = await r.json();
  const a = (j.assets || []).find((x) => x.name === 'alrafiq.apk');
  if (!a) throw new Error('لا يوجد ملف تحديث');
  return { v: String(j.tag_name || '').replace(/^v/, ''), size: a.size || 0 };
}

export const NATIVE_HASH = __NATIVE_HASH__;
const timed = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
// الملاحظات: بس النسخ اللي أحدث من اللي عندك ولحد النسخة اللي هتنزل (مش كل الملاحظات القديمة)
function newNotes(remote, upto) {
  if (!remote.history) return remote.version === upto ? remote.notes || [] : [];
  return remote.history.filter((x) => cmp(x.v, APP.version) > 0 && cmp(x.v, upto) <= 0).flatMap((x) => x.notes || []);
}
// قايمة الملفات اللي عندك دلوقتي: بعد تحديث سريع بنحفظها، وإلا اللي جوه التطبيق نفسه
const MKEY = 'rf-files';
async function localManifest() {
  try { const m = JSON.parse(localStorage.getItem(MKEY) || 'null'); if (m && m.version === APP.version) return { files: m.files.map(([f, h]) => ({ f, h })) }; } catch {}
  return fetch('./update-manifest.json').then((x) => x.json()).catch(() => ({ files: [] }));
}
// لو جزء الأندرويد زي ما هو: «تحديث سريع» بيحمّل الملفات اللي اتغيّرت بس. لو اتغيّر: APK كامل.
async function liveInfo(remote) {
  if (!NATIVE || !remote.native || remote.native !== NATIVE_HASH || !remote.manifest) return null;
  try {
    const [rm, local] = await Promise.all([timed(fetch(SITE + remote.manifest + '?v=' + remote.version, { cache: 'no-store' }).then((x) => x.json()), 12000), localManifest()]);
    if (!rm?.files?.length || rm.version !== remote.version) return null;
    const have = new Map(local.files.map((x) => [x.f, x.h]));
    const need = rm.files.filter((x) => have.get(x.f) !== x.h);
    return { files: rm.files, need: need.length, bytes: need.reduce((a, x) => a + x.s, 0) };
  } catch { return null; }
}
export async function checkForUpdate() {
  const res = await fetch((NATIVE ? SITE : './') + 'version.json?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('تعذّر الاتصال بالخادم');
  const remote = await res.json();
  const base = { current: APP.version, manifest: remote.manifest };
  if (!NATIVE) return { ...base, latest: remote.version, notes: newNotes(remote, remote.version), size: 0, mode: 'web', hasUpdate: cmp(remote.version, APP.version) > 0 };
  if (cmp(remote.version, APP.version) > 0) {
    const live = await liveInfo(remote);
    if (live) return { ...base, latest: remote.version, notes: newNotes(remote, remote.version), size: live.bytes, mode: 'live', live, hasUpdate: true };
  }
  // محتاج APK: نقارن بآخر ملف APK منشور فعلًا (مش بنسخة الموقع اللي بتتنشر قبله بدقايق)
  const apk = await latestApk();
  return { ...base, latest: apk.v, notes: newNotes(remote, apk.v), size: apk.size, mode: 'apk', hasUpdate: cmp(apk.v, APP.version) > 0 };
}

// التحديث السريع: الإضافة بتقارن كل ملف بالموجود جوه التطبيق وبتحمّل الناقص بس
let liveRun = null, liveBundle = null;
export function downloadLive(info, onProgress) {
  if (liveRun) return liveRun;
  liveRun = (async () => {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    const h = await CapacitorUpdater.addListener('download', (e) => { if (e?.percent != null) onProgress?.(Math.min(1, e.percent / 100)); });
    try {
      const manifest = info.live.files.map((x) => ({ file_name: x.f, file_hash: x.h, download_url: SITE + x.f.split('/').map(encodeURIComponent).join('/') + '?v=' + info.latest }));
      liveBundle = await CapacitorUpdater.download({ url: SITE + info.manifest, version: info.latest, manifest });
      onProgress?.(1);
      return liveBundle;
    } finally { h.remove(); }
  })();
  liveRun.finally(() => { liveRun = null; });
  return liveRun;
}
// بيفتح النسخة الجديدة (التطبيق بيعيد تحميل نفسه في ثانية)
export async function applyLive(info, bundle = liveBundle) {
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
  try { localStorage.setItem(MKEY, JSON.stringify({ version: info.latest, files: info.live.files.map((x) => [x.f, x.h]) })); } catch {}
  await CapacitorUpdater.set({ id: bundle.id });
}
// لازم التطبيق يقول «أنا اشتغلت تمام» بعد كل فتحة، وإلا الإضافة ترجع للنسخة اللي قبلها (حماية لو تحديث باظ)
export async function appReady() {
  if (!NATIVE) return;
  try { const { CapacitorUpdater } = await import('@capgo/capacitor-updater'); await CapacitorUpdater.notifyAppReady(); } catch {}
}

const apkOf = (v) => (v ? `https://github.com/starrnightt2030-oss/alrafiq/releases/download/v${v}/alrafiq.apk` : APK_URL);

// على الموبايل: التحديث بيتحمّل جوّه التطبيق بشريط تقدّم، وبعدين شاشة التثبيت تفتح على طول
// قبل التثبيت بنتأكد إن الملف كامل (حجمه مطابق) عشان «مشكلة أثناء تحليل الحزمة» ما تظهرش
let running = null;
export function downloadUpdate(v, expected = 0, onProgress) {
  if (running) return running; // ضغطتين = تحميل واحد
  running = (async () => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { FileTransfer } = await import('@capacitor/file-transfer');
    const name = `alrafiq-${v}.apk`;
    for (const f of (await Filesystem.readdir({ path: '', directory: Directory.Cache }).catch(() => ({ files: [] }))).files || []) {
      const n = typeof f === 'string' ? f : f.name; if (/^alrafiq.*\.apk$/.test(n)) await Filesystem.deleteFile({ path: n, directory: Directory.Cache }).catch(() => {});
    }
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    let best = 0;
    const h = await FileTransfer.addListener('progress', (p) => {
      if (p.type !== 'download') return;
      const total = expected || (p.lengthComputable ? p.contentLength : 0);
      if (total < 1e6) return;
      const f = Math.min(1, p.bytes / total);
      if (f > best) { best = f; onProgress?.(f, p.bytes, total); } // التقدّم بيزيد بس
    });
    try { await FileTransfer.downloadFile({ url: apkOf(v), path: uri, progress: true, connectTimeout: 20000, readTimeout: 60000 }); }
    finally { h.remove(); }
    const st = await Filesystem.stat({ path: name, directory: Directory.Cache });
    if (st.size < 3e6 || (expected && st.size !== expected)) { await Filesystem.deleteFile({ path: name, directory: Directory.Cache }).catch(() => {}); throw new Error('incomplete'); }
    onProgress?.(1, st.size, st.size);
    return st.uri || uri;
  })();
  running.finally(() => { running = null; });
  return running;
}
export async function installUpdate(path) {
  const { FileOpener } = await import('@capacitor-community/file-opener');
  await FileOpener.open({ filePath: path, contentType: 'application/vnd.android.package-archive', openWithDefault: true });
}
export async function openApkInBrowser(v) {
  const { Browser } = await import('@capacitor/browser'); await Browser.open({ url: apkOf(v) });
}
// زرار الإعدادات بيفتح نفس شاشة التحديث (بشريط التقدّم)
export const openUpdate = (info) => window.dispatchEvent(new CustomEvent('rf-open-update', { detail: info }));

export async function applyUpdate(version) {
  if (NATIVE) { await openApkInBrowser(version); return; }
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
    }
    if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
  } catch {}
  location.reload();
}

export function registerSW() {
  if (NATIVE || !('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
