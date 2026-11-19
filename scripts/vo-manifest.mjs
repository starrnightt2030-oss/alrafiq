// يضيف فصول القصص المسجّلة صوتيًّا لملف manifest: مقدمة ← فقرات ← «قال الله تعالى…» ثم الآيات بصوت المنشاوي ← الدروس
// الاستخدام: node scripts/vo-manifest.mjs sirah-07 sirah-08 ...
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public/audio/stories'), mp = join(dir, 'manifest.json');
const man = JSON.parse(readFileSync(mp, 'utf8'));
const { STORY } = await import(pathToFileURL(join(root, 'src/data/stories/index.js')).href);
const pad = (n) => String(n).padStart(3, '0');
const ayat = (ref) => { const [s, r] = ref.split(':'); const [a, b = a] = r.split('-').map(Number); return Array.from({ length: b - a + 1 }, (_, k) => `https://everyayah.com/data/Minshawy_Murattal_128kbps/${pad(s)}${pad(a + k)}.mp3`); };
for (const id of process.argv.slice(2)) {
  const st = STORY[id]; if (!st) { console.log('مش موجود', id); continue; }
  const has = (k) => existsSync(join(dir, id, k + '.mp3'));
  const parts = [];
  if (has('intro')) parts.push({ k: 'intro', f: `${id}/intro.mp3` });
  st.body.forEach((p, i) => {
    if (typeof p === 'string') { if (has('p' + i)) parts.push({ k: 'p' + i, i, f: `${id}/p${i}.mp3` }); else console.log('ناقص', id, 'p' + i); }
    else { if (has('q' + i)) parts.push({ k: 'q' + i, i, f: `${id}/q${i}.mp3` }); ayat(p.q).forEach((u, n) => parts.push({ k: `q${i}_${n + 1}`, i, f: u })); }
  });
  if (has('lessons')) parts.push({ k: 'lessons', f: `${id}/lessons.mp3` });
  man.stories[id] = { manual: true, parts };
  console.log(id, parts.length, 'جزء');
}
writeFileSync(mp, JSON.stringify(man));
