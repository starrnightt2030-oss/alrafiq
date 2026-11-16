// تحديد الموقع تلقائيًّا: إضافة Capacitor في تطبيق أندرويد، وواجهة المتصفح في نسخة الويب.
// بعد تحديد الإحداثيات نختار أقرب مدينة معروفة لنعرض اسمها ونستخدم طريقة الحساب المعتمدة في بلدها.
import { Capacitor } from '@capacitor/core';
import { CITIES } from '../data/cities.js';

const rad = (d) => (d * Math.PI) / 180;
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
export function nearestCity(lat, lng) {
  let best = null, dist = Infinity;
  for (const c of CITIES) { const d = distanceKm({ lat, lng }, c); if (d < dist) { dist = d; best = c; } }
  return { city: best, dist };
}

export class LocateError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const MSG = {
  denied: 'لم يُسمح للتطبيق بالوصول إلى الموقع. اسمح به من إعدادات الموبايل ← التطبيقات ← الرفيق ← الأذونات ← الموقع.',
  off: 'خدمة الموقع (GPS) مقفولة في الموبايل. شغّلها من الإشعارات السريعة وحاول تاني.',
  timeout: 'استغرق تحديد الموقع وقتًا طويلًا. جرّب في مكان مفتوح أو قرب الشباك، أو اختر محافظتك من القائمة.',
  unsupported: 'الموقع غير مدعوم على هذا الجهاز — اختر محافظتك من القائمة.',
};

async function nativePosition() {
  const { Geolocation } = await import('@capacitor/geolocation');
  let perm = await Geolocation.checkPermissions().catch(() => ({ location: 'prompt' }));
  if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') perm = await Geolocation.requestPermissions();
  if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') throw new LocateError('denied', MSG.denied);
  try { return await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }); }
  catch (e) {
    const m = String(e?.message || e);
    if (/disabled|not enabled|location services/i.test(m)) throw new LocateError('off', MSG.off);
    // محاولة ثانية بدقة أقل (شبكة/واي فاي) أسرع داخل المباني
    try { return await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 }); }
    catch { throw new LocateError('timeout', MSG.timeout); }
  }
}

function webPosition() {
  if (!('geolocation' in navigator)) return Promise.reject(new LocateError('unsupported', MSG.unsupported));
  const once = (opts) => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));
  return once({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
    .catch((e) => {
      if (e.code === 1) throw new LocateError('denied', 'لم يُسمح للمتصفح بالوصول إلى الموقع. اضغط على القفل بجوار عنوان الموقع واسمح بالموقع، ثم حاول تاني.');
      return once({ enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 });
    })
    .catch((e) => { if (e instanceof LocateError) throw e; throw new LocateError(e.code === 2 ? 'off' : 'timeout', e.code === 2 ? MSG.off : MSG.timeout); });
}

export async function locate() {
  const pos = Capacitor.isNativePlatform() ? await nativePosition() : await webPosition();
  const lat = +pos.coords.latitude.toFixed(4), lng = +pos.coords.longitude.toFixed(4);
  const { city, dist } = nearestCity(lat, lng);
  return { mode: 'gps', lat, lng, acc: Math.round(pos.coords.accuracy || 0), near: dist < 300 ? city.id : null, nearDist: Math.round(dist), method: dist < 600 ? city.method : 'MuslimWorldLeague', at: Date.now() };
}
