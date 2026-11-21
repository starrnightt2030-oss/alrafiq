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
  friday: true,
  adhan: { enabled: true, volume: 1, dua: true, silentPlay: false, prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } },
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
      nawawi: [],
      library: {},
      umrahSteps: [],
      zakat: null,
      firstDay: null,
      challenge: { i: 0, start: null, done: [] },
      stories: { last: null, pos: {}, marks: [], done: [] },
      hifz: { plan: { dir: 'back', daily: 1, started: null }, pages: {}, log: {} },
      // الحفظ الذكي: نموذج ذاكرة لكل آية + سجل الجلسات والاختبارات والشهادات
      mem: { ayat: {}, sessions: [], tests: [], certs: [], prefs: { reciter: 'husary-m', reps: 1, strict: 0.9 } },
      inbox: [],
      sent: {},
      quiz: { seen: {}, history: [], best: 0, names: [], current: null },
      backupAt: null,
      fasts: {},
      rufaqa: { name: '', hue: 0, groups: [] },
      dailyQ: {},
      answerDaily: (date, i, choice, ok) => set((s) => {
        const cur = [...(s.dailyQ?.[date] || [])]; if (cur[i]) return {};
        cur[i] = { c: choice, ok };
        const keep = Object.fromEntries(Object.entries(s.dailyQ || {}).filter(([k]) => k >= todayKey(new Date(Date.now() - 40 * 864e5))));
        return { dailyQ: { ...keep, [date]: cur }, points: s.points + (ok ? 10 : 0) };
      }),
      setRufaqa: (p) => set((s) => ({ rufaqa: { ...s.rufaqa, ...p } })),
      addRufaqaGroup: (gid) => set((s) => ({ rufaqa: { ...s.rufaqa, groups: [...new Set([...(s.rufaqa.groups || []), gid])] } })),
      removeRufaqaGroup: (gid) => set((s) => ({ rufaqa: { ...s.rufaqa, groups: (s.rufaqa.groups || []).filter((g) => g !== gid) } })),
      // الصيام: تسجيل يوم الصيام (k = نوعه) وتبديله
      toggleFast: (key, k) => set((s) => { const f = { ...s.fasts }; const had = !!f[key]; if (had) delete f[key]; else f[key] = k || 'nafl'; return { fasts: f, points: s.points + (had ? -20 : 20) }; }),
      markBackup: () => set({ backupAt: Date.now() }),

      // «فاستبقوا الخيرات»: seen يحفظ وقت آخر ظهور لكل سؤال حتى لا يتكرر في المحاولات التالية
      saveQuizGame: (current) => set((s) => ({ quiz: { ...s.quiz, current } })),
      markQuizSeen: (id) => set((s) => ({ quiz: { ...s.quiz, seen: { ...s.quiz.seen, [id]: Date.now() } } })),
      finishQuiz: (rec, pts) => set((s) => ({ points: s.points + pts, quiz: { ...s.quiz, current: null, best: Math.max(s.quiz.best, rec.best || 0), history: [rec, ...s.quiz.history].slice(0, 30), names: rec.names } })),

      // رسائل الرفيق: تُحفظ في صندوق الرسائل (آخر ٦٠ رسالة)، و sent يمنع تكرار نفس الرسالة
      addMessage: (m) => set((s) => (m.key && s.sent[m.key]) ? {} : ({
        inbox: [{ ...m, id: m.key || String(Date.now()), at: Date.now(), read: false }, ...s.inbox].slice(0, 60),
        sent: m.key ? { ...s.sent, [m.key]: Date.now() } : s.sent,
      })),
      markInboxRead: () => set((s) => ({ inbox: s.inbox.map((x) => ({ ...x, read: true })) })),
      clearInbox: () => set({ inbox: [] }),

      setHifzPlan: (plan) => set((s) => ({ hifz: { ...s.hifz, plan: { ...s.hifz.plan, ...plan, started: s.hifz.plan.started || todayKey() } } })),
      // تحديث صفحات الحفظ: updates = { [page]: state | null }، kind = 'new' | 'rev' | null للتسجيل اليومي
      updateHifz: (updates, kind = null, pts = 0) => set((s) => {
        const pages = { ...s.hifz.pages };
        for (const [p, v] of Object.entries(updates)) { if (v) pages[p] = v; else delete pages[p]; }
        const k = todayKey(); const lg = { ...(s.hifz.log[k] || { new: 0, rev: 0 }) };
        if (kind) lg[kind] += Object.keys(updates).length;
        return { points: s.points + pts, hifz: { ...s.hifz, pages, log: kind ? { ...s.hifz.log, [k]: lg } : s.hifz.log } };
      }),

      // تسجيل نتيجة تسميع آية في نموذج الذاكرة (m = الحالة الجديدة من review())
      memAyah: (k, m) => set((s) => ({ mem: { ...s.mem, ayat: { ...s.mem.ayat, [k]: m } } })),
      memMany: (upd) => set((s) => ({ mem: { ...s.mem, ayat: { ...s.mem.ayat, ...upd } } })),
      memLog: (kind, rec) => set((s) => ({ points: s.points + (rec.pts || 0), mem: { ...s.mem, [kind]: [...(s.mem[kind] || []), { at: Date.now(), ...rec }].slice(-60) } })),
      memPrefs: (p) => set((s) => ({ mem: { ...s.mem, prefs: { ...s.mem.prefs, ...p } } })),
      memCert: (c) => set((s) => ({ mem: { ...s.mem, certs: [...(s.mem.certs || []).filter((x) => x.id !== c.id), { at: Date.now(), ...c }] } })),
      saveStoryPos: (id, pct) => set((s) => ({ stories: { ...s.stories, last: id, pos: { ...s.stories.pos, [id]: pct } } })),
      toggleStoryMark: (id) => set((s) => ({ stories: { ...s.stories, marks: s.stories.marks.includes(id) ? s.stories.marks.filter((x) => x !== id) : [...s.stories.marks, id] } })),
      finishStory: (id) => set((s) => s.stories.done.includes(id) ? {} : ({ points: s.points + 20, stories: { ...s.stories, done: [...s.stories.done, id] } })),

      ensureFirstDay: () => { if (!get().firstDay) set({ firstDay: todayKey() }); },

      // تسجيل الصلاة: نفس الحالة مرة أخرى تلغي التسجيل
      setPrayer: (key, status, k = todayKey()) => set((s) => {
        const d = day(s, k); const p = { ...(d.prayers || {}) };
        if (p[key] === status) delete p[key]; else p[key] = status;
        return { days: { ...s.days, [k]: { ...d, prayers: p } } };
      }),

      // صفحات المصحف التي فُتحت اليوم
      markPage: (page) => set((s) => {
        const k = todayKey(); const d = day(s, k); const pages = d.pages || [];
        if (pages.includes(page)) return {};
        return { days: { ...s.days, [k]: { ...d, pages: [...pages, page] } } };
      }),

      startChallenge: () => set((s) => ({ challenge: { ...s.challenge, start: todayKey() } })),
      completeChallenge: (id, pts) => set((s) => s.challenge.done.some((x) => x.id === id) ? {} : ({
        points: s.points + pts,
        challenge: { i: s.challenge.i + 1, start: null, done: [...s.challenge.done, { id, at: todayKey() }] },
      })),

      toggleNawawi: (n) => set((s) => { const l = s.nawawi || []; return { nawawi: l.includes(n) ? l.filter((x) => x !== n) : [...l, n] }; }),
      setZakat: (z) => set({ zakat: z }),
      setUmrahSteps: (l) => set({ umrahSteps: l }),
      setLibrary: (patch) => set((s) => ({ library: { ...(s.library || {}), ...patch } })),
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
        settings: { ...current.settings, ...(persisted?.settings || {}), reminders: { ...current.settings.reminders, ...(persisted?.settings?.reminders || {}) }, adhan: { ...current.settings.adhan, ...(persisted?.settings?.adhan || {}), prayers: { ...current.settings.adhan.prayers, ...(persisted?.settings?.adhan?.prayers || {}) } } },
        quran: { ...current.quran, ...(persisted?.quran || {}) },
        stories: { ...current.stories, ...(persisted?.stories || {}) },
        hifz: { ...current.hifz, ...(persisted?.hifz || {}), plan: { ...current.hifz.plan, ...(persisted?.hifz?.plan || {}) } },
        mem: { ...current.mem, ...(persisted?.mem || {}), prefs: { ...current.mem.prefs, ...(persisted?.mem?.prefs || {}) } },
        challenge: { ...current.challenge, ...(persisted?.challenge || {}) },
        quiz: { ...current.quiz, ...(persisted?.quiz || {}) },
        fasts: { ...(persisted?.fasts || {}) },
        rufaqa: { ...current.rufaqa, ...(persisted?.rufaqa || {}) },
        dailyQ: { ...(persisted?.dailyQ || {}) },
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
