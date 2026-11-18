// الأوسمة والإنجازات: كلها محسوبة من بيانات المستخدم — بدرجات برونزي/فضي/ذهبي/ماسي
import { CHALLENGES } from '../data/challenges.js';
import { onTime } from './stats.js';
import { isMem } from './hifz.js';
import { MILESTONES } from '../data/wird.js';

export const TIERS = {
  1: { name: 'برونزي', a: '#F3C7A0', b: '#A35E2C', ink: '#4A2508' },
  2: { name: 'فضي', a: '#F4F7FA', b: '#8D99A8', ink: '#2E3642' },
  3: { name: 'ذهبي', a: '#FFE9A8', b: '#C98E1E', ink: '#4A3000' },
  4: { name: 'ماسي', a: '#D6F4FF', b: '#3E8FD8', ink: '#0B2F55' },
};

export const CATS = [
  { id: 'dhikr', name: 'الذكر', c: '#1FA36A' },
  { id: 'quran', name: 'القرآن', c: '#2F7BEA' },
  { id: 'salah', name: 'الصلاة', c: '#16A2B0' },
  { id: 'steady', name: 'المواظبة', c: '#F07A2A' },
  { id: 'know', name: 'العلم والمعرفة', c: '#8B5CF6' },
  { id: 'fast', name: 'الصيام', c: '#7A3FB0' },
  { id: 'chal', name: 'التحديات', c: '#E2A92B' },
  { id: 'rufaqa', name: 'الرفقة', c: '#E0507A' },
];

function longestStreak(days) {
  const keys = Object.keys(days).filter((k) => { const a = days[k]?.azkar; return a && (a.morning?.done || a.evening?.done); }).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) {
    const d = new Date(k + 'T12:00:00');
    cur = prev && (d - prev) / 864e5 < 1.5 ? cur + 1 : 1; best = Math.max(best, cur); prev = d;
  }
  return best;
}

// كل سلسلة أوسمة: مقياس واحد ودرجات متصاعدة
const ladder = (id, cat, icon, title, unit, measure, steps, why) => ({ id, cat, icon, title, unit, measure, steps, why });

export const LADDERS = [
  ladder('dhikr', 'dhikr', 'beads', 'الذاكر', 'ذكر', (x) => x.dhikr, [1000, 10000, 50000, 100000], '«سبق المفرِّدون: الذاكرون الله كثيرًا والذاكرات» — رواه مسلم'),
  ladder('istighfar', 'dhikr', 'drop', 'المستغفر', 'استغفار', (x) => x.istighfar, [500, 3000, 10000, 30000], '«من لزم الاستغفار جعل الله له من كل هم فرجًا» — رواه أبو داود'),
  ladder('salawat', 'dhikr', 'heart', 'المحب', 'صلاة على النبي ﷺ', (x) => x.salawat, [500, 3000, 10000, 30000], '«من صلّى عليّ صلاة صلّى الله عليه بها عشرًا» — رواه مسلم'),
  ladder('mile', 'dhikr', 'star', 'صاحب الهمة', 'يوم بلغ فيه ١٠٠٠ ذكر', (x) => x.bigDays, [1, 7, 30, 100], 'أيام وصلت فيها لألف ذكر أو أكتر'),
  ladder('azkar', 'dhikr', 'sun', 'المحصَّن', 'يوم بأذكار الصباح والمساء', (x) => x.bothDays, [7, 30, 100, 365], '«ألا بذكر الله تطمئن القلوب»'),
  ladder('pages', 'quran', 'book', 'التالي', 'صفحة', (x) => x.pages, [20, 100, 300, 604], '«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعًا لأصحابه» — رواه مسلم'),
  ladder('hifz', 'quran', 'crown', 'الحافظ', 'صفحة محفوظة', (x) => x.mem, [1, 20, 100, 604], '«يُقال لصاحب القرآن: اقرأ وارتقِ ورتّل» — رواه الترمذي'),
  ladder('ontime', 'salah', 'mosque', 'المحافظ على الصلاة', 'صلاة في وقتها', (x) => x.ontime, [35, 150, 500, 1500], '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ﴾'),
  ladder('fajr', 'salah', 'moon', 'أهل الفجر', 'فجر في وقته', (x) => x.fajr, [7, 30, 100, 365], '«من صلّى الصبح فهو في ذمة الله» — رواه مسلم'),
  ladder('streak', 'steady', 'flame', 'المواظب', 'يوم متتالي', (x) => x.longest, [3, 14, 40, 100], '«أحب الأعمال إلى الله أدومها وإن قلّ» — متفق عليه'),
  ladder('active', 'steady', 'calendar', 'الملازم', 'يوم نشاط', (x) => x.active, [7, 30, 100, 300], 'أيام فتحت فيها الرفيق وعملت فيها خير'),
  ladder('points', 'steady', 'gem', 'جامع الحسنات', 'نقطة', (x) => x.points, [500, 3000, 10000, 30000], 'مجموع نقاطك في التطبيق كله'),
  ladder('quiz', 'know', 'brain', 'فارس المسابقة', 'نقطة في أفضل محاولة', (x) => x.quizBest, [100, 300, 600, 1000], 'أعلى نتيجة ليك في «فاستبقوا الخيرات»'),
  ladder('daily', 'know', 'bulb', 'طالب العلم', 'إجابة صحيحة في أسئلة اليوم', (x) => x.dailyOk, [3, 30, 100, 300], '«من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة» — رواه مسلم'),
  ladder('stories', 'know', 'scroll', 'القارئ', 'فصل من القصص', (x) => x.stories, [1, 10, 30, 60], '﴿لَقَدْ كَانَ فِي قَصَصِهِمْ عِبْرَةٌ لِّأُولِي الْأَلْبَابِ﴾'),
  ladder('fasts', 'fast', 'crescent', 'الصائم', 'يوم صيام', (x) => x.fasts, [1, 10, 30, 100], '«من صام يومًا في سبيل الله باعد الله وجهه عن النار سبعين خريفًا» — متفق عليه'),
  ladder('chal', 'chal', 'medal', 'المتحدّي', 'تحدّي مكتمل', (x) => x.chal, [1, 3, 6, CHALLENGES.length], 'التحديات اللي خلّصتها من رحلة التحديات'),
  ladder('rufaqa', 'rufaqa', 'people', 'الرفيق الوفي', 'مجموعة', (x) => x.groups, [1, 2, 3, 5], '«المرء على دين خليله فلينظر أحدكم من يخالل» — رواه أبو داود'),
];

export function stats(s) {
  const days = s.days || {}; let dhikr = 0, istighfar = 0, salawat = 0, bigDays = 0, bothDays = 0, ontime = 0, fajr = 0, active = 0;
  const pageSet = new Set();
  for (const d of Object.values(days)) {
    const w = d.wird || {}; const tot = Object.values(w).reduce((a, b) => a + b, 0);
    dhikr += tot; istighfar += (w.istighfar || 0) + (w.rabbighfir || 0); salawat += (w.salah || 0) + (w.ibrahimiyya || 0);
    if (tot >= 1000) bigDays++;
    if (d.azkar?.morning?.done && d.azkar?.evening?.done) bothDays++;
    Object.values(d.prayers || {}).forEach((p) => { if (onTime(p)) ontime++; });
    if (onTime(d.prayers?.fajr)) fajr++;
    (d.pages || []).forEach((p) => pageSet.add(p));
    if (tot || d.azkar?.morning?.done || d.azkar?.evening?.done || (d.pages || []).length || Object.keys(d.prayers || {}).length) active++;
  }
  const dailyOk = Object.values(s.dailyQ || {}).reduce((a, l) => a + (l || []).filter((x) => x?.ok).length, 0);
  return {
    dhikr, istighfar, salawat, bigDays, bothDays, ontime, fajr, active, pages: pageSet.size,
    mem: Object.values(s.hifz?.pages || {}).filter(isMem).length, longest: longestStreak(days), points: s.points || 0,
    quizBest: s.quiz?.best || 0, dailyOk, stories: (s.stories?.done || []).length, fasts: Object.values(s.fasts || {}).filter(Boolean).length,
    chal: (s.challenge?.done || []).length, groups: (s.rufaqa?.groups || []).length,
  };
}

// كل سلسلة → درجتها الحالية والتقدّم للدرجة التالية
export function badges(s) {
  const x = stats(s);
  return LADDERS.map((l) => {
    const v = l.measure(x) || 0; const tier = l.steps.filter((t) => v >= t).length;
    const next = l.steps[tier]; const prev = tier ? l.steps[tier - 1] : 0;
    return { ...l, v, tier, next, prev, pct: next ? Math.min(1, (v - prev) / (next - prev)) : 1 };
  });
}

// أوسمة التحديات الخاصة (اسم الوسام من كل تحدّي)
export function challengeBadges(s) {
  const done = new Set((s.challenge?.done || []).map((d) => d.id));
  return CHALLENGES.map((c) => ({ id: c.id, name: c.badge, title: c.title, earned: done.has(c.id), at: (s.challenge?.done || []).find((d) => d.id === c.id)?.at }));
}

export const earnedCount = (s) => badges(s).reduce((a, b) => a + b.tier, 0) + challengeBadges(s).filter((b) => b.earned).length;
export const totalCount = () => LADDERS.length * 4 + CHALLENGES.length;
export { MILESTONES };
