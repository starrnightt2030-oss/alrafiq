// تنبيه التحديث: عند كل فتح للتطبيق (وعند الرجوع له) نتحقق من وجود إصدار أحدث ونعرضه مع ما الجديد فيه
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Download, RefreshCw, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { checkForUpdate, applyUpdate, downloadUpdate, installUpdate, openApkInBrowser, downloadLive, applyLive } from '../lib/update.js';
import { isNative } from '../lib/native.js';
import { sound } from '../lib/sound.js';
import { APP } from '../config.js';

// التنبيه يظهر مرة واحدة لكل إصدار جديد؛ بعدها التحديث متاح من الإعدادات
const KEY = 'rf-upd-shown';
const shown = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const markShown = (v) => { try { localStorage.setItem(KEY, v); } catch {} };

export default function UpdatePrompt({ ready }) {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  // مراحل التحديث على الموبايل: ask (السؤال) ← down (بيتحمّل) ← ready (جاهز للتثبيت) / fail
  const [stage, setStage] = useState('ask'), [pct, setPct] = useState(0), [mb, setMb] = useState([0, 0]), [file, setFile] = useState(null);
  const open = useRef(false), installing = useRef(0);
  open.current = !!info;
  useEffect(() => {
    const open = (e) => { setInfo(e.detail); setStage('ask'); setPct(0); };
    window.addEventListener('rf-open-update', open); return () => window.removeEventListener('rf-open-update', open);
  }, []);
  useEffect(() => {
    if (!ready) return;
    let last = 0;
    const run = async () => {
      // لو شاشة التحديث مفتوحة أو بيتحمّل/بيتثبّت، مانعيدش الفحص (ده اللي كان بيطلّع التثبيت كذا مرة فوق بعض)
      if (open.current || Date.now() - last < 60000 || !navigator.onLine) return; last = Date.now();
      try { const r = await checkForUpdate(); if (r.hasUpdate && shown() !== r.latest) { markShown(r.latest); setInfo(r); sound.notify?.(); } } catch {}
    };
    const t = setTimeout(run, 1500);
    const vis = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', vis);
    let sub; if (isNative) import('@capacitor/app').then(({ App }) => { sub = App.addListener('resume', run); });
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', vis); sub?.then?.((h) => h.remove()); };
  }, [ready]);
  const later = () => { if (stage !== 'down') setInfo(null); };
  // ضغطة واحدة = شاشة تثبيت واحدة، والتثبيت مابيفتحش لوحده بعد التحميل
  const install = async (f = file) => {
    if (Date.now() - installing.current < 8000) return; installing.current = Date.now();
    try { if (info.mode === 'live') await applyLive(info); else await installUpdate(f); } catch { installing.current = 0; setStage('fail'); }
  };
  const go = async () => {
    if (!isNative) { setBusy(true); try { await applyUpdate(info.latest); } finally { setBusy(false); } return; }
    setStage('down'); setPct(0);
    try {
      if (info.mode === 'live') await downloadLive(info, (p) => { setPct(p); setMb([p * (info.size || 0), info.size || 0]); });
      else setFile(await downloadUpdate(info.latest, info.size, (p, b, t) => { setPct(p); setMb([b, t]); }));
      setStage('ready'); sound.success?.();
    } catch { setStage('fail'); }
  };
  const MB = (b) => (b < 104858 ? (b / 1048576).toFixed(2) : (b / 1048576).toFixed(1));
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
            {stage === 'ask' && (<>
              {isNative && <div className="xs muted" style={{ lineHeight: 1.8 }}>{info.mode === 'live' ? `⚡ تحديث سريع: هيتحمّل الجديد بس${info.size ? ` (${MB(info.size)} ميجا)` : ''} بدل التطبيق كله — بياناتك كلها هتفضل زي ما هي.` : `التحديث هيتحمّل جوّه التطبيق${info.size ? ` (${MB(info.size)} ميجا)` : ''}، وبعدها تضغط «تثبيت» — بياناتك كلها هتفضل زي ما هي.`}</div>}
              <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={go} disabled={busy}>{isNative ? <Download size={18} /> : <RefreshCw size={18} className={busy ? 'spin' : ''} />} {busy ? 'جارٍ التحديث…' : 'حدّث الآن'}</motion.button>
              <button className="btn ghost" onClick={later}>لاحقًا</button>
            </>)}
            {stage === 'down' && (
              <div className="col" style={{ gap: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}><b className="small">جارٍ تحميل التحديث…</b><b className="small accent" dir="ltr">{Math.round(pct * 100)}%</b></div>
                <div className="upd-bar"><motion.i animate={{ width: `${Math.max(3, pct * 100)}%` }} transition={{ ease: 'linear', duration: .25 }} /></div>
                <span className="xs muted">{mb[1] ? `${MB(mb[0])} من ${MB(mb[1])} ميجا` : 'بيبدأ التحميل…'} — خليك فاتح التطبيق لحد ما يخلص</span>
              </div>
            )}
            {stage === 'ready' && (<>
              <div className="row small" style={{ gap: 8 }}><CheckCircle2 size={20} className="accent" />{info.mode === 'live' ? 'التحديث نزل ✓ — اضغط «شغّل التحديث» والتطبيق هيفتح بالنسخة الجديدة' : 'التحديث اتحمّل كامل ✓ — اضغط «تثبيت»'}</div>
              <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={() => install()}><Download size={18} /> {info.mode === 'live' ? 'شغّل التحديث' : 'تثبيت التحديث'}</motion.button>
            </>)}
            {stage === 'fail' && (<>
              <div className="row small" style={{ gap: 8 }}><AlertTriangle size={20} style={{ color: '#E0507A' }} />التحميل ما كملش (ممكن النت فصل). جرّب تاني.</div>
              <motion.button whileTap={{ scale: .97 }} className="btn q-go" onClick={go}><RefreshCw size={18} /> جرّب تاني</motion.button>
              {info.mode !== 'live' && <button className="btn ghost" onClick={() => openApkInBrowser(info.latest)}><Globe size={18} /> حمّله من المتصفح</button>}
              <button className="btn ghost" onClick={later}>لاحقًا</button>
            </>)}
          </div>
        </Sheet>
      )}
    </AnimatePresence>
  );
}
