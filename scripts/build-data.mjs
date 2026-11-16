// يحوّل بيانات مجمع الملك فهد (رواية حفص، الإصدار 18) إلى ملفات مضغوطة يستخدمها التطبيق.
// المصدر: https://qurancomplex.gov.sa/en/techquran/dev/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'data-src/hafsData_v18.json'), 'utf8'));

if (raw.length !== 6236) throw new Error('عدد الآيات غير صحيح: ' + raw.length);

const surahs = [];
const ayahs = raw.map((r) => {
  if (r.aya_no === 1) {
    surahs.push({ n: r.sora, name: r.sora_name_ar, en: r.sora_name_en, page: r.page, juz: r.jozz, ayahs: 0 });
  }
  surahs[surahs.length - 1].ayahs++;
  return [r.sora, r.aya_no, r.page, r.line_start, r.line_end, r.jozz, r.aya_text, r.aya_text_emlaey];
});
if (surahs.length !== 114) throw new Error('عدد السور غير صحيح');

const juzStarts = [];
for (const a of ayahs) if (!juzStarts[a[5] - 1]) juzStarts[a[5] - 1] = { juz: a[5], page: a[2], s: a[0], a: a[1] };

mkdirSync(join(root, 'public/quran'), { recursive: true });
writeFileSync(join(root, 'public/quran/hafs-v18.json'), JSON.stringify({ v: 18, surahs, juz: juzStarts, ayahs }));
writeFileSync(join(root, 'src/data/quranMeta.json'), JSON.stringify({ surahs, juz: juzStarts }));

// مقتطفات قرآنية تُستخدم في الأذكار والأدعية والرقية — تُنسخ حرفيًّا من بيانات المجمع
const { QURAN_REFS } = await import(new URL('../src/data/quranRefs.js', import.meta.url));
const snippets = { basmala: ayahs[0][6].replace(/\s*[\u0660-\u0669]+$/, '') };
for (const ref of QURAN_REFS) {
  const [s, range] = ref.split(':');
  const [from, to = from] = range.split('-').map(Number);
  const list = ayahs.filter((a) => a[0] === +s && a[1] >= from && a[1] <= to);
  if (list.length !== to - from + 1) throw new Error('مرجع غير صحيح: ' + ref);
  snippets[ref] = list.map((a) => a[6]).join(' ');
}
writeFileSync(join(root, 'src/data/quranSnippets.json'), JSON.stringify(snippets, null, 1));
console.log('✓ quran data:', ayahs.length, 'ayahs,', surahs.length, 'surahs,', QURAN_REFS.length, 'snippets');
