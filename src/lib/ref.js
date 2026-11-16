import meta from '../data/quranMeta.json';
import { ar } from './arabic.js';
// اسم الموضع القرآني بصيغة مقروءة: «الأنبياء · الآية ٨٧» أو «الفاتحة · الآيات من ١ إلى ٧»
export function refName(ref, withSurah = true) {
  const [s, range] = ref.split(':');
  const [a, b] = range.split('-');
  const name = meta.surahs[+s - 1].name;
  const ayat = b ? `الآيات من ${ar(a)} إلى ${ar(b)}` : `الآية ${ar(a)}`;
  return withSurah ? `${name} · ${ayat}` : ayat;
}
