// النسخة الاحتياطية: تصدير كل بيانات المستخدم في ملف واحد واستيرادها على أي جهاز
import { useStore } from '../store.js';
import { APP } from '../config.js';
import { isNative } from './native.js';
import { todayKey } from './arabic.js';

const KEYS = ['settings', 'days', 'points', 'quran', 'favDuas', 'firstDay', 'challenge', 'stories', 'hifz', 'inbox', 'sent', 'quiz', 'fasts', 'backupAt'];

export function snapshot() {
  const s = useStore.getState();
  const data = Object.fromEntries(KEYS.map((k) => [k, s[k]]));
  return { app: 'alrafiq', schema: APP.schemaVersion, version: APP.version, at: new Date().toISOString(), data };
}

export function summary(data) {
  const days = Object.keys(data.days || {}).length;
  const hifz = Object.keys(data.hifz?.pages || {}).length;
  return { days, hifz, points: data.points || 0, quiz: data.quiz?.history?.length || 0 };
}

export async function exportBackup() {
  const json = JSON.stringify(snapshot());
  const name = `alrafiq-backup-${todayKey()}.json`;
  useStore.getState().markBackup();
  if (isNative) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const w = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'نسخة احتياطية — الرفيق', text: 'احفظ الملف في مكان آمن (Drive أو واتساب لنفسك)', files: [w.uri], dialogTitle: 'احفظ النسخة الاحتياطية' });
    return 'shared';
  }
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title: 'نسخة احتياطية — الرفيق' }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancel'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}

export class BackupError extends Error {}

export async function readBackup(file) {
  let obj;
  try { obj = JSON.parse(await file.text()); } catch { throw new BackupError('الملف ده مش نسخة احتياطية صالحة'); }
  if (obj?.app !== 'alrafiq' || typeof obj.data !== 'object') throw new BackupError('الملف ده مش نسخة احتياطية من تطبيق الرفيق');
  if ((obj.schema || 1) > APP.schemaVersion) throw new BackupError('النسخة دي من إصدار أحدث — حدّث التطبيق الأول');
  return obj;
}

// الاستعادة تستبدل البيانات الحالية ثم تعيد تحميل التطبيق ليمرّ كل شيء على الدمج الآمن للإعدادات
export function restoreBackup(obj) {
  const data = Object.fromEntries(KEYS.filter((k) => k in obj.data).map((k) => [k, obj.data[k]]));
  localStorage.setItem(APP.storageKey, JSON.stringify({ state: { ...data, backupAt: Date.now() }, version: APP.schemaVersion }));
  setTimeout(() => location.reload(), 300);
}
