// مسار التحديات — يُحسب التقدّم تلقائيًّا من بيانات المستخدم (الأذكار، الورد، الصلوات، صفحات المصحف)
import { todayKey } from '../lib/arabic.js';
import { onTime, FARD, parseKey } from '../lib/stats.js';
import meta from './quranMeta.json';

const KAHF_FROM = meta.surahs[17].page, KAHF_TO = meta.surahs[18].page - 1;

function keysFrom(start, maxDays) {
  const out = []; const d = parseKey(start); const end = todayKey();
  for (let i = 0; i < (maxDays || 400); i++) { const k = todayKey(d); if (k > end) break; out.push(k); d.setDate(d.getDate() + 1); }
  return out;
}

// أيام متتالية تحقق الشرط تنتهي اليوم أو أمس
function streak(days, start, ok) {
  const keys = keysFrom(start);
  let n = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    const good = ok(days[keys[i]] || {});
    if (good) n++;
    else if (i === keys.length - 1) continue; // اليوم لم يكتمل بعد
    else break;
  }
  return n;
}
const windowSum = (days, start, n, f) => keysFrom(start, n).reduce((a, k) => a + f(days[k] || {}), 0);
const windowOver = (start, n) => keysFrom(start).length > n;

const azkarBoth = (d) => d.azkar?.morning?.done && d.azkar?.evening?.done;
const wirdOf = (d, ...ids) => ids.reduce((a, id) => a + (d.wird?.[id] || 0), 0);

export const CHALLENGES = [
  { id: 'azkar3', title: 'أذكار الصباح والمساء ٣ أيام متتالية', target: 3, unit: 'أيام', points: 150, badge: 'المحافظ',
    reward: '﴿وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا﴾', src: 'الأحزاب ٣٥',
    how: 'أتمّ أذكار الصباح والمساء كاملة كل يوم.', link: '#/azkar',
    progress: (days, start) => ({ value: streak(days, start, azkarBoth) }) },
  { id: 'istighfar7', title: '٧ أيام من الاستغفار ١٠٠ مرة يوميًا', target: 7, unit: 'أيام', points: 300, badge: 'المستغفر',
    reward: '﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا ۝ يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا ۝ وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ﴾', src: 'نوح ١٠–١٢',
    how: 'سجّل ١٠٠ استغفار على الأقل كل يوم من الورد اليومي.', link: '#/wird',
    progress: (days, start) => ({ value: streak(days, start, (d) => wirdOf(d, 'istighfar', 'rabbighfir') >= 100) }) },
  { id: 'salah1000', title: '١٠٠٠ صلاة على النبي ﷺ في أسبوع', target: 1000, unit: 'صلاة', points: 300, badge: 'المحب', window: 7,
    reward: '«من صلّى عليّ صلاة صلّى الله عليه بها عشرًا»', src: 'رواه مسلم',
    how: 'من الورد اليومي: الصلاة على النبي ﷺ أو الصلاة الإبراهيمية، خلال ٧ أيام من بدء التحدي.', link: '#/wird',
    progress: (days, start) => ({ value: windowSum(days, start, 7, (d) => wirdOf(d, 'salah', 'ibrahimiyya')), expired: windowOver(start, 7) }) },
  { id: 'fajr10', title: 'صلاة الفجر في وقتها ١٠ أيام متتالية', target: 10, unit: 'أيام', points: 400, badge: 'أهل الفجر',
    reward: '«من صلّى الصبح فهو في ذمة الله»', src: 'رواه مسلم',
    how: 'سجّل صلاة الفجر «في وقتها» أو «جماعة» من شاشة الصلاة.', link: '#/prayer',
    progress: (days, start) => ({ value: streak(days, start, (d) => onTime(d.prayers?.fajr)) }) },
  { id: 'kahf4', title: 'سورة الكهف ٤ جُمَع', target: 4, unit: 'جُمَع', points: 400, badge: 'نور الجمعة',
    reward: '«من قرأ سورة الكهف في يوم الجمعة أضاء له من النور ما بين الجمعتين»', src: 'رواه الحاكم والبيهقي، وصححه الألباني',
    how: 'افتح المصحف يوم الجمعة واقرأ سورة الكهف كاملة (من صفحة ' + KAHF_FROM + ' إلى ' + KAHF_TO + ').', link: '#/quran/' + KAHF_FROM,
    progress: (days, start) => ({ value: keysFrom(start).filter((k) => parseKey(k).getDay() === 5).filter((k) => { const p = days[k]?.pages || []; for (let x = KAHF_FROM; x <= KAHF_TO; x++) if (!p.includes(x)) return false; return true; }).length }) },
  { id: 'tahleel1000', title: '١٠٠٠ تهليلة في أسبوع', target: 1000, unit: 'تهليلة', points: 350, badge: 'الموحّد', window: 7,
    reward: 'من قال لا إله إلا الله وحده لا شريك له… مئة مرة كانت له عدل عشر رقاب، وكُتبت له مئة حسنة، ومُحيت عنه مئة سيئة', src: 'متفق عليه',
    how: 'من الورد اليومي: «لا إله إلا الله» أو «التهليل الكامل»، خلال ٧ أيام من بدء التحدي.', link: '#/wird',
    progress: (days, start) => ({ value: windowSum(days, start, 7, (d) => wirdOf(d, 'tahleel', 'lailaha')), expired: windowOver(start, 7) }) },
  { id: 'five7', title: 'الصلوات الخمس في وقتها ٧ أيام متتالية', target: 7, unit: 'أيام', points: 500, badge: 'المحافظ على الصلاة',
    reward: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾', src: 'البقرة ٢٣٨',
    how: 'سجّل الصلوات الخمس «في وقتها» أو «جماعة» كل يوم.', link: '#/prayer',
    progress: (days, start) => ({ value: streak(days, start, (d) => FARD.every((p) => onTime(d.prayers?.[p.key]))) }) },
  { id: 'juz7', title: 'قراءة جزء من القرآن في أسبوع', target: 20, unit: 'صفحة', points: 400, badge: 'صاحب القرآن', window: 7,
    reward: '«اقرؤوا القرآن، فإنه يأتي يوم القيامة شفيعًا لأصحابه»', src: 'رواه مسلم',
    how: 'اقرأ ٢٠ صفحة مختلفة من المصحف خلال ٧ أيام من بدء التحدي.', link: '#/quran',
    progress: (days, start) => ({ value: windowSum(days, start, 7, (d) => (d.pages || []).length), expired: windowOver(start, 7) }) },
  { id: 'wird3000', title: '٣٠٠٠ ذكر في ٣ أيام', target: 3000, unit: 'ذكر', points: 500, badge: 'الذاكر', window: 3,
    reward: '«سبق المفرِّدون… الذاكرون الله كثيرًا والذاكرات»', src: 'رواه مسلم',
    how: 'أي أذكار من الورد اليومي خلال ٣ أيام من بدء التحدي.', link: '#/wird',
    progress: (days, start) => ({ value: windowSum(days, start, 3, (d) => Object.values(d.wird || {}).reduce((a, b) => a + b, 0)), expired: windowOver(start, 3) }) },
];

export function challengeState(ch, s) {
  const c = CHALLENGES[ch.i];
  if (!c) return { all: true };
  if (!ch.start) return { c, started: false, value: 0, pct: 0 };
  const r = c.progress(s.days, ch.start);
  const value = Math.min(c.target, r.value);
  const done = r.value >= c.target;
  return { c, started: true, value, pct: value / c.target, done, expired: !done && r.expired };
}
