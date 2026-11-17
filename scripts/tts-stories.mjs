// توليد صوت القصص بصوت «شاكر» المصري من Azure — يعمل على GitHub Actions بمفتاح محفوظ في أسرار المستودع.
// لكل فصل: مقدمة (العنوان)، وكل فقرة، وتمهيد قبل كل آية («قال الله تعالى في سورة…»)، والدروس.
// الآيات نفسها لا تُقرأ بصوت آلي احترامًا لأحكام التلاوة.
// الاستخدام: AZURE_SPEECH_KEY=… AZURE_SPEECH_REGION=… node scripts/tts-stories.mjs [معرّف-فصل]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.AZURE_SPEECH_KEY, REGION = process.env.AZURE_SPEECH_REGION;
const VOICE = process.env.TTS_VOICE || 'ar-EG-ShakirNeural';
const ONLY = process.argv[2];
if ((!KEY || !REGION) && !process.env.DRY) { console.error('يلزم AZURE_SPEECH_KEY و AZURE_SPEECH_REGION'); process.exit(1); }

const meta = JSON.parse(readFileSync(join(root, 'src/data/quranMeta.json'), 'utf8'));
const lexicon = JSON.parse(readFileSync(join(root, 'scripts/tts-lexicon.json'), 'utf8'));
const outDir = process.env.DRY ? join('/tmp', 'tts-dry') : join(root, 'public/audio/stories');
const manifestPath = join(outDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { voice: VOICE, stories: {} };
if (manifest.voice !== VOICE) manifest.stories = Object.fromEntries(Object.entries(manifest.stories).filter(([, v]) => v.manual)); // تغيير الصوت = إعادة توليد الكل
manifest.voice = VOICE;

// تجهيز النص للنطق: الرموز والاختصارات وقاموس النطق
function speakable(t) {
  let s = t
    .replace(/ﷺ/g, ' صلى الله عليه وسلم ')
    .replace(/[«»"]/g, '')
    .replace(/[﴿﴾]/g, '')
    .replace(/\s*—\s*/g, '، ')
    .replace(/([٠-٩\d]+)\s*هـ/g, '$1 للهجرة')
    .replace(/([٠-٩\d]+)\s*م(?=[\s،.]|$)/g, '$1 ميلادية')
    .replace(/–/g, ' إلى ');
  // كلمات كاملة فقط (مع حرف عطف/جر ملتصق اختياري) حتى لا تتغير كلمات أخرى تحتويها
  for (const [from, to] of Object.entries(lexicon)) {
    const re = new RegExp(`(?<![\\p{L}\\p{M}])([وفبك]?)${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}])`, 'gu');
    s = s.replace(re, (_, pre) => pre + to);
  }
  return s.replace(/\s+/g, ' ').trim();
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ssml = (text) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ar-EG"><voice name="${VOICE}"><prosody rate="-6%">${esc(text)}</prosody></voice></speak>`;
const hash = (s) => createHash('sha1').update(VOICE + '|' + s).digest('hex').slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DRY = !!process.env.DRY;
async function synth(text, file) {
  if (DRY) { console.log('   «' + text.slice(0, 110) + '»'); return; }
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'alrafiq-tts' },
      body: ssml(text),
    });
    if (res.ok) { writeFileSync(file, Buffer.from(await res.arrayBuffer())); return; }
    if (res.status === 429 || res.status >= 500) { const w = 4000 * attempt; console.log(`  انتظار ${w / 1000}ث (${res.status})`); await sleep(w); continue; }
    throw new Error(`Azure ${res.status}: ${await res.text()}`);
  }
  throw new Error('فشل التوليد بعد عدة محاولات');
}

const refIntro = (ref) => { const [s] = ref.split(':'); return `قال الله تعالى في سورة ${meta.surahs[+s - 1].name.replace(/[ً-ْ]/g, '')}:`; };

const files = readdirSync(join(root, 'src/data/stories')).filter((f) => f.endsWith('.js') && f !== 'index.js');
let made = 0, kept = 0;
for (const f of files) {
  const mod = await import(pathToFileURL(join(root, 'src/data/stories', f)).href);
  const stories = Object.values(mod).flat();
  for (const st of stories) {
    if (ONLY && st.id !== ONLY) continue;
    if (manifest.stories[st.id]?.manual) continue; // قصص بصوت مسجّل يدويًّا لا تُستبدل
    const parts = [{ k: 'intro', text: `${st.title}. ${st.sub}.` }];
    st.body.forEach((p, i) => parts.push(typeof p === 'string' ? { k: 'p' + i, i, text: p } : { k: 'q' + i, i, q: true, text: refIntro(p.q) }));
    parts.push({ k: 'lessons', text: 'دروس وعبر: ' + st.lessons.join('. ') });
    mkdirSync(join(outDir, st.id), { recursive: true });
    const out = [];
    for (const p of parts) {
      const text = speakable(p.text); const h = hash(text);
      const name = `${p.k}-${h}.mp3`; const file = join(outDir, st.id, name);
      if (existsSync(file)) kept++;
      else { console.log(`↻ ${st.id}/${p.k}`); await synth(text, file); made++; if (!DRY) await sleep(1500); }
      out.push({ k: p.k, ...(p.i !== undefined ? { i: p.i } : {}), ...(p.q ? { q: true } : {}), f: `${st.id}/${name}` });
    }
    manifest.stories[st.id] = { parts: out };
    writeFileSync(manifestPath, JSON.stringify(manifest));
  }
}
// حذف الملفات القديمة التي لم تعد مستخدمة
if (!ONLY) {
  const used = new Set(Object.values(manifest.stories).flatMap((x) => x.parts.map((p) => p.f)));
  for (const d of readdirSync(outDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(outDir, d.name))) if (!used.has(`${d.name}/${f}`)) unlinkSync(join(outDir, d.name, f));
  }
}
manifest.generated = new Date().toISOString();
writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`✓ تم: ${made} ملف جديد، ${kept} محفوظ مسبقًا`);
