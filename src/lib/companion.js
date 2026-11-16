// «الرفيق» يتكلم: محرك رسائل يراقب نشاط المستخدم ويرسل رسائل تشجيع وتحدٍّ وتذكير — كل رسالة مرة واحدة فقط
import { useStore, streakOf } from '../store.js';
import { todayKey, ar, arNum } from './arabic.js';
import { WIRD, MILESTONES } from '../data/wird.js';
import { challengeState } from '../data/challenges.js';
import { resolveLocation, timesFor } from './prayer.js';
import { dueReviews } from './hifz.js';
import meta from '../data/quranMeta.json';

// طابور الرسائل المنبثقة
const subs = new Set();
export const onMessage = (f) => { subs.add(f); return () => subs.delete(f); };
export function notify(m) {
  const s = useStore.getState();
  if (m.key && s.sent[m.key]) return;
  s.addMessage(m);
  subs.forEach((f) => f({ ...m, id: m.key || String(Date.now()) }));
}

const pick = (arr, seed) => arr[Math.abs([...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % arr.length];
const hm = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const GREET = {
  morning: [
    ['صباح الخير يا بطل', 'يوم جديد وفرصة جديدة. ابدأه بأذكار الصباح وخلّي الرفيق يفتخر بيك!'],
    ['صباحك نور وذِكر', '«من قال حين يصبح…» — أذكار الصباح مستنياك، ٥ دقايق تكسب بيهم يومك كله.'],
    ['أصبحنا وأصبح الملك لله', 'جاهز لتحدي النهارده؟ نبدأ بالأذكار وبعدها الورد.'],
  ],
  noon: [['نص النهار عدّى', 'خد استراحة بسيطة واكسب ١٠٠ «سبحان الله وبحمده» — حُطّت خطاياه ولو مثل زبد البحر.']],
  evening: [
    ['مساء الخير', 'أذكار المساء بتحصّنك لحد الصبح بإذن الله. يلا نخلّصها سوا؟'],
    ['الشمس بتغيب', 'وقت أذكار المساء. قعدة قصيرة مع الرفيق وتبقى في حفظ الله.'],
  ],
  night: [['قبل ما تنام', 'أذكار النوم والمعوذات وآية الكرسي — «لن يزال عليك من الله حافظ».']],
};

function rules(s) {
  const out = [];
  const now = new Date(), t = todayKey(now), H = now.getHours(), M = H * 60 + now.getMinutes();
  const day = s.days[t] || { azkar: {}, wird: {} };

  // ترحيب أول مرة
  if (!s.sent.welcome) out.push({ key: 'welcome', icon: 'heart', tone: 'cheer', title: 'أهلًا بيك في الرفيق', body: 'أنا رفيقك اليومي: هفكّرك بالأذكار والصلاة، وأتحدّاك تكسب أوسمة جديدة كل يوم. يلا نبدأ؟', cta: { label: 'أذكار اليوم', href: '#/azkar' } });

  // تحية حسب وقت اليوم (مرة واحدة يوميًّا)
  const part = H >= 4 && H < 11 ? 'morning' : H >= 11 && H < 15 ? 'noon' : H >= 15 && H < 19 ? 'evening' : 'night';
  if (!s.sent['greet-' + t] && s.sent.welcome) {
    const [title, body] = pick(GREET[part], t);
    out.push({ key: 'greet-' + t, icon: part === 'night' || part === 'evening' ? 'moon' : 'sun', tone: 'cheer', title, body, cta: part === 'morning' ? { label: 'أذكار الصباح', href: '#/azkar/morning' } : part === 'evening' ? { label: 'أذكار المساء', href: '#/azkar/evening' } : part === 'night' ? { label: 'أذكار النوم', href: '#/azkar/sleep' } : { label: 'الورد', href: '#/wird' } });
  }

  // تذكير الأذكار في وقتها إن لم تُتمّ
  const r = s.settings.reminders;
  if (M >= hm(r.morning) && H < 11 && !day.azkar.morning?.done) out.push({ key: 'am-' + t, icon: 'sun', tone: 'remind', title: 'أذكار الصباح لسه مستنياك', body: 'متفوّتش حصن اليوم — كلها دقايق.', cta: { label: 'ابدأ الآن', href: '#/azkar/morning' } });
  if (M >= hm(r.evening) && H < 21 && !day.azkar.evening?.done) out.push({ key: 'pm-' + t, icon: 'moon', tone: 'remind', title: 'وقت أذكار المساء', body: 'خلّي ليلتك في حفظ الله. أذكار المساء جاهزة.', cta: { label: 'ابدأ الآن', href: '#/azkar/evening' } });

  // احتفال بإتمام الأذكار
  for (const [k, n] of [['morning', 'الصباح'], ['evening', 'المساء']]) if (day.azkar[k]?.done) out.push({ key: `done-${k}-${t}`, icon: 'trophy', tone: 'celebrate', title: `ما شاء الله! خلّصت أذكار ${n}`, body: k === 'morning' ? 'بداية قوية. تقدر تكمّل وتجيب ١٠٠ استغفار قبل الضهر؟' : 'تقبّل الله منك. فاضل ورد اليوم يقفل الدايرة.', cta: { label: 'الورد اليومي', href: '#/wird' } });

  // قريب من وسام في الورد
  for (const w of WIRD) {
    const c = day.wird[w.id] || 0;
    const m = MILESTONES.find((x) => x > c);
    if (m && c > 0 && m - c <= 15) out.push({ key: `near-${w.id}-${m}-${t}`, icon: 'flame', tone: 'challenge', title: `باقي ${ar(m - c)} بس!`, body: `وتاخد وسام ${arNum(m)} في «${w.short}». كمّل يا بطل، أنت قرّبت جدًّا.`, cta: { label: 'كمّل', href: '#/wird' } });
  }
  const total = Object.values(day.wird).reduce((a, b) => a + b, 0), goal = s.settings.wirdGoal;
  if (total >= goal) out.push({ key: 'goal-' + t, icon: 'star', tone: 'celebrate', title: 'هدف اليوم اكتمل!', body: `${arNum(total)} ذكر النهارده. «سبق المفرِّدون… الذاكرون الله كثيرًا».`, cta: { label: 'شوف تقييمك', href: '#/report' } });
  else if (total >= goal * 0.7 && H >= 17) out.push({ key: 'goal70-' + t, icon: 'flame', tone: 'challenge', title: 'قرّبت تقفل هدف اليوم', body: `فاضل ${arNum(goal - total)} ذكر وتكمّل ${arNum(goal)}. تقبل التحدي؟`, cta: { label: 'يلا', href: '#/wird' } });

  // السلسلة
  const st = streakOf(s.days);
  for (const n of [3, 7, 14, 21, 30, 40, 60, 100]) if (st >= n) out.push({ key: 'streak-' + n, icon: 'flame', tone: 'celebrate', title: `سلسلة ${ar(n)} يوم!`, body: n >= 30 ? 'ثبات يُحسد عليه. «أحبّ الأعمال إلى الله أدومها وإن قلّ».' : 'كل يوم بتثبت أكتر. ما تكسرش السلسلة!', cta: { label: 'التحديات', href: '#/challenges' } });

  // التحدي الحالي
  const ch = challengeState(s.challenge, s);
  if (ch.c && !ch.started && H >= 10) out.push({ key: `ch-start-${ch.c.id}-${t}`, icon: 'trophy', tone: 'challenge', title: 'عندك تحدي مستنيك', body: `«${ch.c.title}» — والجزاء وسام «${ch.c.badge}». تقبل؟`, cta: { label: 'ابدأ التحدي', href: '#/challenges' } });
  if (ch.c && ch.started && ch.pct >= 0.5 && !ch.done) out.push({ key: `ch-half-${ch.c.id}-${s.challenge.start}`, icon: 'flame', tone: 'challenge', title: 'نص الطريق!', body: `خلّصت ${ar(Math.round(ch.pct * 100))}٪ من «${ch.c.title}». الباقي أسهل، كمّل.`, cta: { label: 'التحدي', href: '#/challenges' } });

  // تسجيل الصلاة الفائتة
  const place = resolveLocation(s.settings.location);
  const past = timesFor(place, now).filter((p) => !p.info && p.time < now);
  const last = past[past.length - 1];
  if (last && !day.prayers?.[last.key]) { const mins = (now - last.time) / 60000; if (mins > 40 && mins < 180) out.push({ key: `pray-${last.key}-${t}`, icon: 'bell', tone: 'remind', title: `صلّيت ${last.name}؟`, body: 'سجّلها علشان تقييمك يبقى دقيق — وجماعة يبقى أحسن وأحسن!', cta: { label: 'سجّل', href: '#/prayer' } }); }

  // الجمعة والصيام
  const wd = now.getDay();
  if (wd === 5 && H >= 7) out.push({ key: 'kahf-' + t, icon: 'book', tone: 'remind', title: 'جمعة مباركة', body: 'سورة الكهف نور ما بين الجمعتين، وأكثِر من الصلاة على النبي ﷺ النهارده.', cta: { label: 'اقرأ الكهف', href: '#/quran/' + meta.surahs[17].page } });
  if ((wd === 0 || wd === 3) && H >= 18) out.push({ key: 'fast-' + t, icon: 'moon', tone: 'cheer', title: wd === 0 ? 'بكرة الاثنين' : 'بكرة الخميس', body: '«تُعرض الأعمال يوم الاثنين والخميس، فأحب أن يُعرض عملي وأنا صائم» — ما تيجي نصوم؟', cta: null });

  // مراجعة الحفظ
  const due = dueReviews(s.hifz, 50).length;
  if (due > 0 && H >= 8) out.push({ key: 'hifz-' + t, icon: 'book', tone: 'remind', title: `عندك ${ar(due)} ${due > 2 && due < 11 ? 'صفحات' : 'صفحة'} مراجعة`, body: 'المراجعة هي اللي بتثبّت الحفظ. خلّصها وانت مرتاح.', cta: { label: 'راجع', href: '#/hifz' } });

  // المستوى
  const level = 1 + Math.floor(s.points / 500);
  if (level >= 2) out.push({ key: 'level-' + level, icon: 'star', tone: 'celebrate', title: `وصلت المستوى ${ar(level)}!`, body: `${arNum(s.points)} نقطة من الطاعات. اللي بعده أقرب مما تتخيّل.`, cta: { label: 'تقدّمي', href: '#/report' } });

  return out;
}

let timer = null, lastToast = 0;
export function evaluate() {
  const s = useStore.getState();
  const list = rules(s).filter((m) => !s.sent[m.key]);
  // نعرض رسالة واحدة كل مرة حتى لا يزدحم المستخدم، والباقي يدخل صندوق الرسائل بهدوء
  list.forEach((m, i) => { if (i === 0 && Date.now() - lastToast > 8000) { lastToast = Date.now(); notify(m); } else useStore.getState().addMessage(m); });
}
export function startCompanion() {
  setTimeout(evaluate, 4500);
  const unsub = useStore.subscribe(() => { clearTimeout(timer); timer = setTimeout(evaluate, 1800); });
  const iv = setInterval(evaluate, 60000);
  return () => { unsub(); clearInterval(iv); };
}
