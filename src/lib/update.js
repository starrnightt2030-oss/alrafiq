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

export async function checkForUpdate() {
  const res = await fetch((NATIVE ? SITE : './') + 'version.json?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('تعذّر الاتصال بالخادم');
  const remote = await res.json();
  return { current: APP.version, latest: remote.version, notes: remote.notes || [], hasUpdate: cmp(remote.version, APP.version) > 0 };
}

export async function applyUpdate() {
  if (NATIVE) { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url: APK_URL }); return; }
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
