// حالة التطبيق — تُحفظ على الجهاز (localStorage) مع رقم مخطط للترقية الآمنة عند التحديثات
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { APP } from './config.js';
import { todayKey } from './lib/arabic.js';

const safeStorage = createJSONStorage(() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  catch { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; }
});

const defaultSettings = {
  theme: 'emerald',
  sound: true,
  volume: 0.8,
  haptics: true,
  intro: true,
  reminders: { enabled: false, morning: '06:30', evening: '16:30' },
  location: { mode: 'city', id: 'eg-cairo' },
  quranScale: 1,
  textScale: 1,
  wirdGoal: 1000,
};

const day = (s, k = todayKey()) => s.days[k] || { azkar: {}, wird: {} };

export const useStore = create(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      days: {},
      points: 0,
      quran: { lastPage: 1, lastAt: null, bookmarks: [] },
      favDuas: [],

      toggleFavDua: (id) => set((s) => ({ favDuas: s.favDuas.includes(id) ? s.favDuas.filter((x) => x !== id) : [...s.favDuas, id] })),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      // الأذكار: حفظ الموضع في كل ورد (الصباح/المساء) لليوم الحالي
      saveAzkar: (session, data) => set((s) => {
        const k = todayKey(); const d = day(s, k);
        const was = d.azkar[session]?.done;
        const gained = data.done && !was ? 50 : 0;
        return { points: s.points + gained, days: { ...s.days, [k]: { ...d, azkar: { ...d.azkar, [session]: { ...data, done: !!(data.done || was) } } } } };
      }),

      addWird: (id, delta) => set((s) => {
        const k = todayKey(); const d = day(s, k);
        const cur = d.wird[id] || 0; const next = Math.max(0, cur + delta);
        const before = Object.values(d.wird).reduce((a, b) => a + b, 0);
        const after = before - cur + next;
        const gained = Math.max(0, Math.floor(after / 100) - Math.floor(before / 100)) * 10;
        return { points: s.points + gained, days: { ...s.days, [k]: { ...d, wird: { ...d.wird, [id]: next } } } };
      }),
      resetWird: (id) => set((s) => { const k = todayKey(); const d = day(s, k); return { days: { ...s.days, [k]: { ...d, wird: { ...d.wird, [id]: 0 } } } }; }),

      setLastPage: (p) => set((s) => ({ quran: { ...s.quran, lastPage: p, lastAt: Date.now() } })),
      toggleBookmark: (p) => set((s) => {
        const has = s.quran.bookmarks.includes(p);
        return { quran: { ...s.quran, bookmarks: has ? s.quran.bookmarks.filter((x) => x !== p) : [...s.quran.bookmarks, p].sort((a, b) => a - b) } };
      }),
    }),
    {
      name: APP.storageKey,
      version: APP.schemaVersion,
      storage: safeStorage,
      // دمج الإعدادات الجديدة مع القديمة عند إضافة خيارات في تحديثات لاحقة
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        settings: { ...current.settings, ...(persisted?.settings || {}), reminders: { ...current.settings.reminders, ...(persisted?.settings?.reminders || {}) } },
        quran: { ...current.quran, ...(persisted?.quran || {}) },
      }),
      migrate: (state) => state,
    }
  )
);

export const today = (s) => day(s);

// عدد الأيام المتتالية التي أُتمّ فيها ورد الصباح أو المساء
export function streakOf(days) {
  let n = 0; const d = new Date();
  const ok = (k) => { const a = days[k]?.azkar; return a && (a.morning?.done || a.evening?.done); };
  if (!ok(todayKey(d))) d.setDate(d.getDate() - 1);
  while (ok(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
