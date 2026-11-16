import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { CITIES } from '../data/cities.js';

export const PRAYERS = [
  { key: 'fajr', name: 'الفجر' }, { key: 'sunrise', name: 'الشروق', info: true }, { key: 'dhuhr', name: 'الظهر' },
  { key: 'asr', name: 'العصر' }, { key: 'maghrib', name: 'المغرب' }, { key: 'isha', name: 'العشاء' },
];

export function resolveLocation(loc) {
  if (loc?.mode === 'gps' && typeof loc.lat === 'number') {
    const near = loc.near && CITIES.find((c) => c.id === loc.near);
    return {
      name: near ? (loc.nearDist < 15 ? near.name : `قرب ${near.name}`) : 'موقعي الحالي',
      country: near?.country || '', lat: loc.lat, lng: loc.lng, method: loc.method || near?.method || 'Egyptian',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone, gps: true,
    };
  }
  return CITIES.find((c) => c.id === loc?.id) || CITIES[0];
}

export function timesFor(place, date = new Date()) {
  const params = (CalculationMethod[place.method] || CalculationMethod.Egyptian)();
  const pt = new PrayerTimes(new Coordinates(place.lat, place.lng), date, params);
  return PRAYERS.map((p) => ({ ...p, time: pt[p.key] }));
}

export function fmtTime(d, tz) {
  try { return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(d); }
  catch { return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(d); }
}

// الصلاة القادمة (تتجاهل الشروق) — وإن انتهت صلوات اليوم فهي فجر الغد
export function nextPrayer(place, now = new Date()) {
  const list = timesFor(place, now).filter((p) => !p.info);
  const n = list.find((p) => p.time > now);
  if (n) return n;
  const t = new Date(now); t.setDate(t.getDate() + 1);
  return timesFor(place, t).find((p) => p.key === 'fajr');
}

export function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (x) => String(x).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
