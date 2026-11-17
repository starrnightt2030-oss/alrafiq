// تنبيه التحديث: عند كل فتح للتطبيق (وعند الرجوع له) نتحقق من وجود إصدار أحدث ونعرضه مع ما الجديد فيه
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Download, RefreshCw } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { checkForUpdate, applyUpdate } from '../lib/update.js';
import { isNative } from '../lib/native.js';
import { sound } from '../lib/sound.js';
import { APP } from '../config.js';

const KEY = 'rf-upd-later';

export default function UpdatePrompt({ ready }) {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!ready) return;
    let last = 0;
    const run = async () => {
      if (Date.now() - last < 60000 || !navigator.onLine) return; last = Date.now();
      try { const r = await checkForUpdate(); if (r.hasUpdate && sessionStorage.getItem(KEY) !== r.latest) { setInfo(r); sound.notify?.(); } } catch {}
    };
    const t = setTimeout(run, 1500);
    const vis = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', vis);
    let sub; if (isNative) import('@capacitor/app').then(({ App }) => { sub = App.addListener('resume', run); });
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', vis); sub?.then?.((h) => h.remove()); };
  }, [ready]);
  const later = () => { sessionStorage.setItem(KEY, info.latest); setInfo(null); };
  const go = async () => { setBusy(true); try { await applyUpdate(); } finally { if (isNative) { setBusy(false); setInfo(null); } } };
  return (
    <AnimatePresence>
      {info && (
        <Sheet onClose={later} label="تحديث جديد">
          <div className="col" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 12 }}>
              <motion.span className="upd-ic" initial={{ rotate: -120, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: .15 }}><Sparkles size={26} /></motion.span>
              <div className="col" style={{ gap: 2 }}><b className="h2">تحديث جديد للرفيق</b><span className="xs muted">الإصدار {info.latest} — عندك {APP.version}</span></div>
            </div>
            {info.notes.length > 0 && (
              <ul className="upd-notes">{info.notes.map((n, i) => <motion.li key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 + i * .07 }}>{n}</motion.li>)}</ul>
            )}
            {isNative && <div className="xs muted" style={{ lineHeight: 1.8 }}>هيتحمّل ملف التحديث، افتحه واضغط «تثبيت» — بياناتك كلها هتفضل زي ما هي.</div>}
            <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={go} disabled={busy}>{isNative ? <Download size={18} /> : <RefreshCw size={18} className={busy ? 'spin' : ''} />} {busy ? 'جارٍ التحديث…' : 'حدّث الآن'}</motion.button>
            <button className="btn ghost" onClick={later}>لاحقًا</button>
          </div>
        </Sheet>
      )}
    </AnimatePresence>
  );
}
