// مكتبة القصص — كل مجموعة قائمة فصول، والفصل: { id, title, sub, body: [نص | { q: 'سورة:آية' }], lessons, src }
import { SIRAH } from './sirah.js';
import { GHAZAWAT } from './ghazawat.js';
import { SAHABA } from './sahaba.js';
import { ANBIYA } from './anbiya.js';
import { IBAR } from './ibar.js';

export const COLLECTIONS = [
  { id: 'sirah', title: 'السيرة النبوية', desc: 'من المولد الشريف إلى الرفيق الأعلى', items: SIRAH },
  { id: 'ghazawat', title: 'الغزوات', desc: 'بدر · أحد · الخندق · خيبر · مؤتة · الفتح · حنين · تبوك', items: GHAZAWAT },
  { id: 'sahaba', title: 'الصحابة الأجلاء', desc: 'العشرة المبشرون بالجنة وأعلام الصحابة والصحابيات', items: SAHABA },
  { id: 'anbiya', title: 'قصص الأنبياء', desc: 'آدم · نوح · إبراهيم · يوسف · موسى · يونس · أيوب · عيسى', items: ANBIYA },
  { id: 'ibar', title: 'قصص فيها عبرة', desc: 'من القرآن الكريم والسنة الصحيحة', items: IBAR },
];

export const STORY = {};
for (const c of COLLECTIONS) c.items.forEach((s, i) => { STORY[s.id] = { ...s, col: c, index: i }; });

export const words = (s) => s.body.reduce((n, p) => n + (typeof p === 'string' ? p.split(/\s+/).length : 25), 0);
export const minutes = (s) => Math.max(1, Math.round(words(s) / 140));
