import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Vibrate, Bell, Sparkles, RefreshCw, Download, CheckCircle2, Palette, Target, BookOpen } from 'lucide-react';
import { useStore } from '../store.js';
import { THEMES, THEME_ORDER } from '../themes.js';
import { APP } from '../config.js';
import { sound } from '../lib/sound.js';
import { askPermission, scheduleReminders } from '../lib/notify.js';
import { checkForUpdate, applyUpdate, openUpdate } from '../lib/update.js';
import { ar, arNum, daysAr, pagesAr } from '../lib/arabic.js';
import { Switch, Credit, toast } from '../components/ui.jsx';
import logo from '../assets/logo.webp';
import { playAdhan, stopAdhan, useAdhanState, MUEZZIN } from '../lib/adhan.js';
import { FARD } from '../lib/stats.js';
import { Megaphone, Square, Play, Smartphone } from 'lucide-react';
import { isNative, testAdhanNative, adhanStatus, openAdhanSettings } from '../lib/native.js';
import { useEffect } from 'react';
import { APK_URL } from '../lib/update.js';
import { CalendarHeart, DatabaseBackup, Upload, ShieldCheck } from 'lucide-react';
import { exportBackup, readBackup, restoreBackup, summary } from '../lib/backup.js';
import { useRef } from 'react';

// شاشة الأذان فوق القفل (أندرويد): حالة الأذونات + تجربة بعد ١٠ ثواني
function AdhanLock() {
  const [st, setSt] = useState(null);
  useEffect(() => { const f = () => adhanStatus().then(setSt); f(); const on = () => document.visibilityState === 'visible' && f(); document.addEventListener('visibilitychange', on); return () => document.removeEventListener('visibilitychange', on); }, []);
  if (!isNative) return null;
  const ok = st && st.fullScreen && st.exact;
  return (
    <div className="col" style={{ gap: 8, padding: '6px 0 10px' }}>
      <span className="small" style={{ fontWeight: 700 }}>شاشة الأذان على الموبايل المقفول</span>
      <span className="xs muted" style={{ lineHeight: 1.8 }}>{st == null ? '…' : ok ? 'جاهزة ✓ — مع دخول الوقت تنوّر الشاشة ويظهر الأذان بالكلمات لحد ما يخلص.' : 'محتاجة إذن واحد من إعدادات الموبايل عشان تظهر فوق القفل.'}</span>
      {st && !st.fullScreen && <button className="btn" onClick={() => openAdhanSettings('fullScreen')}>اسمح بعرض شاشة الأذان</button>}
      {st && !st.exact && <button className="btn" onClick={() => openAdhanSettings('exact')}>اسمح بالمنبّهات في وقتها</button>}
      <button className="btn soft" onClick={() => { testAdhanNative(); toast('اقفل الموبايل دلوقتي — الأذان هيظهر بعد ١٠ ثواني'); }}>جرّب شاشة الأذان (بعد ١٠ ثواني)</button>
    </div>
  );
}

export default function Settings() {
  const st = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const [upd, setUpd] = useState({ state: 'idle' });
  const adhanPlaying = useAdhanState().playing;
  const ad = st.adhan;
  const setAd = (patch) => setSetting('adhan', { ...ad, ...patch });

  const check = async () => {
    setUpd({ state: 'checking' });
    try { const r = await checkForUpdate(); setUpd({ state: r.hasUpdate ? 'available' : 'latest', ...r }); }
    catch { setUpd({ state: 'error' }); }
  };

  const reminders = async (on) => {
    if (on && !isNative) { const p = await askPermission(); if (p === 'denied') toast('الإشعارات مرفوضة من المتصفح — سيظهر التذكير داخل التطبيق فقط'); }
    setSetting('reminders', { ...st.reminders, enabled: on });
    setTimeout(scheduleReminders, 0);
  };

  return (
    <div className="screen">
      <h1 className="title center">الإعدادات</h1>

      <section className="card col" style={{ gap: 12 }}>
        <div className="row h2"><Palette size={18} className="accent" aria-hidden="true" />الثيم</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }} role="radiogroup" aria-label="الثيم">
          {THEME_ORDER.map((id) => {
            const t = THEMES[id], on = st.theme === id;
            return (
              <button key={id} role="radio" aria-checked={on} onClick={() => setSetting('theme', id)} className="col" style={{ alignItems: 'center', gap: 6, padding: '8px 0', borderRadius: 16, border: '2px solid ' + (on ? 'var(--acc)' : 'transparent'), background: 'var(--surf2)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 12, background: `linear-gradient(135deg, ${t.bg} 55%, ${t.acc} 55%)`, border: '1px solid var(--line)' }} />
                <span className="xs" style={{ fontWeight: on ? 600 : 400 }}>{t.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="set-row"><span className="row"><Volume2 size={18} className="accent" aria-hidden="true" />أصوات التطبيق</span><Switch label="أصوات التطبيق" checked={st.sound} onChange={(v) => { setSetting('sound', v); if (v) setTimeout(() => sound.next(), 50); }} /></div>
        {st.sound && (
          <div className="set-row">
            <label className="row" style={{ flex: 1 }}><span className="small muted" style={{ minWidth: 60 }}>مستوى الصوت</span>
              <input type="range" min="0.1" max="1" step="0.1" value={st.volume} onChange={(e) => setSetting('volume', +e.target.value)} style={{ flex: 1 }} /></label>
            <button className="btn soft" style={{ minHeight: 38, padding: '0 12px', fontSize: 12 }} onClick={() => sound.milestone()}>تجربة</button>
          </div>
        )}
        {st.sound && <div className="set-row"><span className="row"><BookOpen size={18} className="accent" aria-hidden="true" />صوت تقليب صفحات المصحف</span><Switch label="صوت تقليب الصفحات" checked={st.pageSound !== false} onChange={(v) => { setSetting('pageSound', v); if (v) setTimeout(() => sound.page(), 50); }} /></div>}
        <div className="set-row"><span className="row"><Vibrate size={18} className="accent" aria-hidden="true" />الاهتزاز مع العدّ</span><Switch label="الاهتزاز" checked={st.haptics} onChange={(v) => setSetting('haptics', v)} /></div>
        <div className="set-row"><span className="row"><Sparkles size={18} className="accent" aria-hidden="true" />المقدمة المتحركة عند الفتح</span><Switch label="المقدمة المتحركة" checked={st.intro} onChange={(v) => setSetting('intro', v)} /></div>
      </section>

      <section className="card">
        <div className="set-row"><span className="row"><Megaphone size={18} className="accent" aria-hidden="true" /><span className="col" style={{ gap: 0 }}><span>الأذان</span><span className="xs muted">بصوت {MUEZZIN}</span></span></span><Switch label="الأذان" checked={ad.enabled} onChange={(v) => setAd({ enabled: v })} /></div>
        {ad.enabled && (
          <>
            <div className="set-row" style={{ flexWrap: 'wrap', gap: 6, paddingBlock: 8 }}>
              {FARD.map((p) => <button key={p.key} aria-pressed={ad.prayers[p.key]} className={'chip' + (ad.prayers[p.key] ? ' on' : '')} onClick={() => setAd({ prayers: { ...ad.prayers, [p.key]: !ad.prayers[p.key] } })}>{p.name}</button>)}
            </div>
            <div className="set-row"><span className="small">دعاء ما بعد الأذان بعده تلقائيًّا</span><Switch label="دعاء ما بعد الأذان" checked={ad.dua} onChange={(v) => setAd({ dua: v })} /></div>
            <div className="set-row">
              <label className="row" style={{ flex: 1 }}><span className="small muted" style={{ minWidth: 60 }}>صوت الأذان</span>
                <input type="range" min="0.2" max="1" step="0.1" value={ad.volume} onChange={(e) => setAd({ volume: +e.target.value })} style={{ flex: 1 }} /></label>
            </div>
            <div className="set-row" style={{ gap: 8 }}>
              {adhanPlaying ? <button className="btn soft" style={{ flex: 1, minHeight: 40, fontSize: 12 }} onClick={stopAdhan}><Square size={15} />إيقاف</button> : <>
                <button className="btn soft" style={{ flex: 1, minHeight: 40, fontSize: 12 }} onClick={() => playAdhan('fajr')}><Play size={15} />أذان الفجر</button>
                <button className="btn soft" style={{ flex: 1, minHeight: 40, fontSize: 12 }} onClick={() => playAdhan('dhuhr')}><Play size={15} />الأذان</button>
                <button className="btn soft" style={{ flex: 1, minHeight: 40, fontSize: 12 }} onClick={() => playAdhan('dua')}><Play size={15} />الدعاء</button>
              </>}
            </div>
            <div className="col" style={{ gap: 6, padding: '4px 0 8px' }}>
              <span className="small muted">معاينة شاشة الأذان بالكلمات</span>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {[['fajr', 'الفجر'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']].map(([k, n]) => <button key={k} className="chip" onClick={() => { stopAdhan(); dispatchEvent(new CustomEvent('rf-adhan-preview', { detail: { key: k, name: n, time: new Date() } })); }}>{n}</button>)}
              </div>
            </div>
            <AdhanLock />
            {!isNative && <div className="xs muted" style={{ lineHeight: 1.8, paddingBottom: 6 }}>يُرفع الأذان كاملًا والتطبيق مفتوح، ويظهر إشعار بدخول الوقت إن سمحت بالإشعارات.</div>}
          </>
        )}
      </section>

      <section className="card">
        <div className="set-row"><span className="row"><Bell size={18} className="accent" aria-hidden="true" />تذكير أذكار الصباح والمساء</span><Switch label="تذكير الأذكار" checked={st.reminders.enabled} onChange={reminders} /></div>
        {st.reminders.enabled && (
          <>
            <label className="set-row"><span className="small">أذكار الصباح</span><input className="inp" type="time" value={st.reminders.morning} onChange={(e) => { setSetting('reminders', { ...st.reminders, morning: e.target.value }); setTimeout(scheduleReminders, 0); }} /></label>
            <label className="set-row"><span className="small">أذكار المساء</span><input className="inp" type="time" value={st.reminders.evening} onChange={(e) => { setSetting('reminders', { ...st.reminders, evening: e.target.value }); setTimeout(scheduleReminders, 0); }} /></label>
          </>
        )}
        <div className="set-row"><span className="row"><CalendarHeart size={18} className="accent" aria-hidden="true" />تذكيرات يوم الجمعة</span><Switch label="تذكيرات الجمعة" checked={st.friday !== false} onChange={(v) => setSetting('friday', v)} /></div>
        {st.friday !== false && <div className="xs muted" style={{ lineHeight: 1.8, padding: '0 2px 6px' }}>سورة الكهف من مغرب الخميس، والاستعداد لصلاة الجمعة، وتحدي الصلاة على النبي ﷺ، وساعة الإجابة قبل المغرب</div>}
        <div className="set-row">
          <span className="row"><Target size={18} className="accent" aria-hidden="true" />هدف الورد اليومي</span>
          <select className="sel" value={st.wirdGoal} onChange={(e) => setSetting('wirdGoal', +e.target.value)}>
            {[100, 300, 500, 1000, 2000, 3000].map((n) => <option key={n} value={n}>{arNum(n)} ذكر</option>)}
          </select>
        </div>
      </section>

      <Backup />

      <section className="card col center" style={{ alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
        <img src={logo} alt="" width="84" height="84" style={{ borderRadius: 22, boxShadow: '0 12px 30px -12px rgba(0,0,0,.5)' }} />
        <div>
          <div className="amiri accent" style={{ fontSize: 30, fontWeight: 700 }}>{APP.name}</div>
          <div className="xs muted">{APP.tagline}</div>
        </div>
        <motion.div initial={{ scale: .9 }} animate={{ scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'linear-gradient(135deg, var(--acc), var(--acc2))', color: 'var(--onAcc)', fontWeight: 700, letterSpacing: .5 }}>
          <span className="xs" style={{ fontWeight: 500 }}>الإصدار</span><span dir="ltr">v{APP.version}</span>
        </motion.div>
        <div className="xs muted">تاريخ البناء {ar(APP.buildDate)}</div>

        {upd.state === 'available' ? (
          <div className="col" style={{ width: '100%', gap: 8 }}>
            <div className="small accent">يتوفر إصدار جديد: v{upd.latest}</div>
            {upd.notes?.length > 0 && <ul className="xs muted" style={{ textAlign: 'right', margin: 0, lineHeight: 1.9 }}>{upd.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <button className="btn" onClick={() => (isNative ? openUpdate(upd) : applyUpdate(upd.latest))}><Download size={18} />تحديث الآن</button>
          </div>
        ) : (
          <button className="btn ghost" style={{ width: '100%' }} onClick={check} disabled={upd.state === 'checking'}>
            {upd.state === 'latest' ? <><CheckCircle2 size={18} className="accent" />أنت على آخر إصدار</> : <><RefreshCw size={18} className={upd.state === 'checking' ? 'spin' : ''} />{upd.state === 'checking' ? 'جارٍ البحث…' : upd.state === 'error' ? 'تعذّر الاتصال — حاول مجددًا' : 'البحث عن تحديثات'}</>}
          </button>
        )}
      </section>

      {!isNative && (
        <a href={APK_URL} className="card row" style={{ textDecoration: 'none', color: 'var(--text)', borderColor: 'var(--acc)' }}>
          <Smartphone size={26} className="accent" aria-hidden="true" />
          <div style={{ flex: 1 }}><div className="h2">حمّل تطبيق أندرويد</div><div className="xs muted" style={{ lineHeight: 1.8 }}>الأذان بصوته الكامل وتنبيهات الرفيق حتى والتطبيق مغلق</div></div>
          <Download size={20} className="accent" aria-hidden="true" />
        </a>
      )}

      <section className="card xs muted" style={{ lineHeight: 1.9 }}>
        نص المصحف وخطّه: مجمع الملك فهد لطباعة المصحف الشريف (رواية حفص، الإصدار ١٨). الأذكار من الأحاديث الصحيحة والحسنة مع ذكر مصادرها.
      </section>

      <Credit />
    </div>
  );
}

function Backup() {
  const backupAt = useStore((s) => s.backupAt);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const fmt = (t) => new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t));
  const doExport = async () => {
    setBusy(true);
    try { const r = await exportBackup(); if (r === 'downloaded') toast('تم حفظ النسخة في التنزيلات — انقلها لمكان آمن'); else if (r === 'shared') toast('تم تجهيز النسخة الاحتياطية'); }
    catch { toast('تعذّر إنشاء النسخة — جرّب مرة تانية'); } finally { setBusy(false); }
  };
  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    try { setPending(await readBackup(f)); } catch (err) { toast(err.message || 'الملف غير صالح'); }
  };
  const sm = pending && summary(pending.data);
  return (
    <section className="card col" style={{ gap: 10 }}>
      <div className="row h2"><DatabaseBackup size={18} className="accent" aria-hidden="true" />بياناتك والنسخة الاحتياطية</div>
      <div className="xs muted" style={{ lineHeight: 1.9 }}>كل تقدّمك (الحفظ، الأوراد، الصلوات، النقاط، القصص، المسابقة) محفوظ على الجهاز ده بس. خد نسخة واحفظها في Drive أو ابعتها لنفسك، وتقدر ترجّعها على أي موبايل.</div>
      <div className="row xs" style={{ gap: 6, color: backupAt ? '#5FC59A' : '#E3A14A' }}><ShieldCheck size={14} />{backupAt ? `آخر نسخة: ${fmt(backupAt)}` : 'لسه ماخدتش نسخة احتياطية'}</div>
      <div className="grid2">
        <button className="btn" onClick={doExport} disabled={busy}><Download size={16} /> {busy ? 'جارٍ…' : 'حفظ نسخة'}</button>
        <button className="btn soft" onClick={() => input.current?.click()}><Upload size={16} /> استعادة</button>
      </div>
      <input ref={input} type="file" accept="application/json,.json" onChange={pick} hidden />
      {pending && (
        <motion.div className="card col" style={{ gap: 8, background: 'var(--surf2)', borderColor: 'var(--acc)' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <b className="small">استعادة نسخة {fmt(pending.at)}؟</b>
          <div className="xs muted" style={{ lineHeight: 1.9 }}>فيها نشاط {daysAr(sm.days)}، و{pagesAr(sm.hifz)} محفوظة، و{arNum(sm.points)} نقطة. البيانات الحالية على الجهاز ده هتتستبدل بيها.</div>
          <div className="grid2">
            <button className="btn" onClick={() => { restoreBackup(pending); toast('تمت الاستعادة — جارٍ إعادة التشغيل'); }}>استعادة</button>
            <button className="btn ghost" onClick={() => setPending(null)}>إلغاء</button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
