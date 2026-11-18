// «رفقاء الخير»: مجموعات للأهل والأصحاب على Firebase (دخول مجهول الهوية + Firestore Lite)
// لا نرفع إلا الاسم المختار وملخّص الإنجاز اليومي — بدون بريد أو رقم أو موقع
import { useStore, streakOf } from '../store.js';
import { todayKey } from './arabic.js';

const CONFIG = {
  apiKey: 'AIzaSyB6KHM5ITysHpDE3CKeRKDqFOfXpNopowM',
  authDomain: 'alrafiq-d4116.firebaseapp.com',
  projectId: 'alrafiq-d4116',
  storageBucket: 'alrafiq-d4116.firebasestorage.app',
  messagingSenderId: '579736688288',
  appId: '1:579736688288:web:eda4ddcb45cd2c3ba15bc5',
};

let fbP = null;
// تحميل Firebase عند الحاجة فقط حتى لا يثقل التطبيق
export function fb() {
  if (!fbP) fbP = (async () => {
    const [{ initializeApp }, A, F] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite')]);
    const app = initializeApp(CONFIG);
    const auth = A.initializeAuth(app, { persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence] });
    if (!auth.currentUser) await new Promise((r) => { const u = A.onAuthStateChanged(auth, () => { u(); r(); }); });
    if (!auth.currentUser) await A.signInAnonymously(auth);
    return { app, auth, uid: auth.currentUser.uid, db: F.getFirestore(app), F };
  })().catch((e) => { fbP = null; throw e; });
  return fbP;
}

// نقاط الأسبوع: أذكار، ورد، صفحات، صلوات، صيام — تُحسب من بيانات الجهاز
export function weekKey(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 1) % 7)); return todayKey(x); } // الأسبوع يبدأ السبت
export function summary(s = useStore.getState()) {
  const t = todayKey(); const day = s.days[t] || { azkar: {}, wird: {} };
  const score = (k, d) => { if (!d) return 0; const az = ['morning', 'evening'].filter((x) => d.azkar?.[x]?.done).length; const w = Object.values(d.wird || {}).reduce((a, b) => a + b, 0); return az * 20 + Math.floor(w / 10) + (d.pages || []).length * 5 + Object.keys(d.prayers || {}).length * 10 + (s.fasts?.[k] ? 30 : 0); };
  const wk = weekKey(); let week = 0; for (let i = 0; i < 7; i++) { const x = new Date(); x.setDate(x.getDate() - i); const k = todayKey(x); if (k < wk) break; week += score(k, s.days[k]); }
  return {
    date: t, azkar: ['morning', 'evening'].filter((x) => day.azkar?.[x]?.done).length,
    wird: Object.values(day.wird || {}).reduce((a, b) => a + b, 0), pages: (day.pages || []).length,
    prayers: Object.keys(day.prayers || {}).length, fasted: !!s.fasts?.[t], streak: streakOf(s.days), week, wk, today: score(t, day),
  };
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export async function pushMe() {
  const r = useStore.getState().rufaqa; if (!r?.name) return;
  const { db, uid, F } = await fb();
  await F.setDoc(F.doc(db, 'users', uid), { name: r.name, hue: r.hue || 0, s: summary(), at: Date.now() });
}

export async function createGroup(name) {
  const { db, uid, F } = await fb(); const me = useStore.getState().rufaqa;
  const ref = F.doc(F.collection(db, 'groups'));
  let code = newCode();
  for (let i = 0; i < 4; i++) { const c = await F.getDoc(F.doc(db, 'codes', code)); if (!c.exists()) break; code = newCode(); }
  await F.setDoc(ref, { name, code, owner: uid, members: [uid], names: { [uid]: me.name }, createdAt: Date.now(), khatma: { n: 1, parts: {} } });
  await F.setDoc(F.doc(db, 'codes', code), { gid: ref.id });
  await pushMe();
  useStore.getState().addRufaqaGroup(ref.id);
  return ref.id;
}

export class JoinError extends Error {}
export async function joinGroup(code) {
  const { db, uid, F } = await fb(); const me = useStore.getState().rufaqa;
  const c = await F.getDoc(F.doc(db, 'codes', code.trim().toUpperCase()));
  if (!c.exists()) throw new JoinError('الكود ده مش موجود — اتأكد منه');
  const gid = c.data().gid;
  try { await F.updateDoc(F.doc(db, 'groups', gid), { members: F.arrayUnion(uid), [`names.${uid}`]: me.name }); }
  catch { throw new JoinError('تعذّر الانضمام — ممكن المجموعة اتملت (٣٠ عضو)'); }
  await pushMe();
  useStore.getState().addRufaqaGroup(gid);
  return gid;
}

export async function leaveGroup(gid) {
  const { db, uid, F } = await fb();
  await F.updateDoc(F.doc(db, 'groups', gid), { members: F.arrayRemove(uid), [`names.${uid}`]: F.deleteField() });
  useStore.getState().removeRufaqaGroup(gid);
}

export async function loadGroup(gid) {
  const { db, uid, F } = await fb();
  const g = await F.getDoc(F.doc(db, 'groups', gid));
  if (!g.exists()) return null;
  const data = { id: gid, ...g.data() };
  const users = await Promise.all(data.members.map((m) => F.getDoc(F.doc(db, 'users', m)).then((d) => ({ uid: m, ...(d.exists() ? d.data() : { name: data.names?.[m] || 'عضو' }) })).catch(() => ({ uid: m, name: data.names?.[m] || 'عضو' }))));
  const cq = F.query(F.collection(db, 'groups', gid, 'cheers'), F.where('to', '==', uid), F.limit(40));
  const cheers = await F.getDocs(cq).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.at - a.at).slice(0, 15)).catch(() => []);
  return { group: data, users, cheers, uid };
}

// الختمة الجماعية: كل جزء يحجزه عضو واحد ثم يعلّمه مقروءًا
export async function takePart(gid, part) {
  const { db, uid, F } = await fb(); const me = useStore.getState().rufaqa;
  const ref = F.doc(db, 'groups', gid);
  return F.runTransaction(db, async (tx) => {
    const g = await tx.get(ref); const p = g.data().khatma?.parts?.[part];
    if (p && p.uid !== uid) throw new JoinError(`الجزء ده مع ${p.name}`);
    if (p && p.uid === uid) { tx.update(ref, { [`khatma.parts.${part}`]: F.deleteField() }); return 'released'; }
    tx.update(ref, { [`khatma.parts.${part}`]: { uid, name: me.name, done: false, at: Date.now() } }); return 'taken';
  });
}
export async function donePart(gid, part, done = true) {
  const { db, F } = await fb();
  await F.updateDoc(F.doc(db, 'groups', gid), { [`khatma.parts.${part}.done`]: done });
}
export async function newKhatma(gid, n) {
  const { db, F } = await fb();
  await F.updateDoc(F.doc(db, 'groups', gid), { khatma: { n: n + 1, parts: {} }, [`done.${n}`]: Date.now() });
}
export async function sendCheer(gid, to, text) {
  const { db, uid, F } = await fb(); const me = useStore.getState().rufaqa;
  await F.addDoc(F.collection(db, 'groups', gid, 'cheers'), { from: uid, fromName: me.name, to, text, at: Date.now() });
}
export async function renameMe(name) {
  const { db, uid, F } = await fb(); const st = useStore.getState();
  st.setRufaqa({ name });
  await pushMe();
  await Promise.all((st.rufaqa.groups || []).map((gid) => F.updateDoc(F.doc(db, 'groups', gid), { [`names.${uid}`]: name }).catch(() => {})));
}

// مزامنة الملخّص تلقائيًّا عند تغيّر الإنجاز (مع تأخير لتقليل الكتابة)
let timer = null, last = '', lastCheck = 0;
// تشجيعات جديدة وصلت؟ نعرضها كرسالة من الرفيق
async function checkCheers() {
  if (Date.now() - lastCheck < 10 * 6e4) return; lastCheck = Date.now();
  const r = useStore.getState().rufaqa; const seen = r.seen || 0; let top = seen;
  const { db, uid, F } = await fb();
  for (const gid of r.groups || []) {
    const q = F.query(F.collection(db, 'groups', gid, 'cheers'), F.where('to', '==', uid), F.limit(40));
    const list = await F.getDocs(q).then((x) => x.docs.map((d) => ({ id: d.id, ...d.data() }))).catch(() => []);
    list.filter((c) => c.at > seen).sort((a, b) => a.at - b.at).slice(-3).forEach((c) => {
      top = Math.max(top, c.at);
      import('./companion.js').then(({ notify }) => notify({ key: 'cheer-' + c.id, icon: 'heart', tone: 'cheer', title: `${c.fromName} بيشجّعك 💚`, body: c.text, cta: { label: 'افتح المجموعة', href: '#/rufaqa/g/' + gid } }));
    });
  }
  if (top > seen) useStore.getState().setRufaqa({ seen: top });
}
export function startRufaqaSync() {
  const run = () => { const r = useStore.getState().rufaqa; if (!r?.groups?.length) return; checkCheers().catch(() => {}); const s = JSON.stringify(summary()); if (s === last) return; last = s; pushMe().catch(() => { last = ''; }); };
  setTimeout(run, 5000);
  const unsub = useStore.subscribe((s, p) => { if (s.days !== p.days || s.fasts !== p.fasts) { clearTimeout(timer); timer = setTimeout(run, 15000); } });
  const vis = () => document.visibilityState === 'visible' && run();
  document.addEventListener('visibilitychange', vis);
  return () => { unsub(); document.removeEventListener('visibilitychange', vis); };
}

export const CHEERS = ['ربنا يتقبّل منك 💚', 'ما شاء الله عليك، كمّل!', 'وحشتنا في الورد النهارده 🌙', 'يلا نخلّص الأذكار سوا', 'جزاك الله خيرًا يا رفيقي', 'متنساش جزءك في الختمة 📖'];
export const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function authed() { return request.auth != null; }
    function member(g) { return authed() && request.auth.uid in get(/databases/$(db)/documents/groups/$(g)).data.members; }
    match /users/{uid} {
      allow read: if authed();
      allow write: if authed() && request.auth.uid == uid && request.resource.data.name is string && request.resource.data.name.size() <= 30;
    }
    match /codes/{code} {
      allow read: if authed();
      allow create: if authed() && request.resource.data.keys().hasOnly(['gid']);
    }
    match /groups/{gid} {
      allow read: if authed() && request.auth.uid in resource.data.members;
      allow create: if authed() && request.resource.data.owner == request.auth.uid && request.resource.data.members == [request.auth.uid];
      allow update: if authed() && (
        (request.auth.uid in resource.data.members && request.resource.data.owner == resource.data.owner && request.resource.data.code == resource.data.code
          && request.resource.data.members.hasAll(resource.data.members.removeAll([request.auth.uid])))
        || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['members', 'names'])
          && request.resource.data.members.size() == resource.data.members.size() + 1
          && request.resource.data.members.hasAll(resource.data.members)
          && request.auth.uid in request.resource.data.members && resource.data.members.size() < 30)
      );
      match /cheers/{cid} {
        allow read: if member(gid) && resource.data.to == request.auth.uid;
        allow create: if member(gid) && request.resource.data.from == request.auth.uid && request.resource.data.text.size() <= 80;
      }
    }
  }
}`;
