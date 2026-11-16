import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useStore } from '../store.js';
import { ICONS, TONE } from '../components/Messages.jsx';
import { TopBar } from '../components/ui.jsx';
import { todayKey } from '../lib/arabic.js';
import logo from '../assets/logo.webp';

const dayLabel = (ts) => {
  const d = new Date(ts), k = todayKey(d), t = todayKey();
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (k === t) return 'اليوم';
  if (k === todayKey(y)) return 'أمس';
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
};
const time = (ts) => new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(new Date(ts));

export default function Inbox() {
  const { inbox, markInboxRead, clearInbox } = useStore();
  useEffect(() => { const t = setTimeout(markInboxRead, 800); return () => clearTimeout(t); }, []); // eslint-disable-line
  let lastDay = null;
  return (
    <div className="screen no-nav">
      <TopBar title="رسائل الرفيق" sub="تشجيع وتحديات وتذكير"
        right={inbox.length ? <button className="icon-btn" aria-label="مسح الرسائل" onClick={clearInbox}><Trash2 size={18} /></button> : null} />
      {!inbox.length && (
        <div className="card col center" style={{ alignItems: 'center', gap: 10, padding: 28 }}>
          <img src={logo} alt="" width="64" height="64" style={{ borderRadius: 18 }} />
          <div className="h2">لا رسائل بعد</div>
          <div className="small muted">هنا هتلاقي رسايل الرفيق: تشجيع وتحديات وتذكير بالأذكار والصلاة.</div>
        </div>
      )}
      {inbox.map((m, i) => {
        const dl = dayLabel(m.at); const showDay = dl !== lastDay; lastDay = dl;
        const I = ICONS[m.icon] || ICONS.bell; const tone = TONE[m.tone] || TONE.cheer;
        return (
          <div key={m.id} className="col" style={{ gap: 8 }}>
            {showDay && <div className="xs muted center" style={{ margin: '6px 0' }}><span style={{ padding: '4px 12px', borderRadius: 999, background: 'var(--surf2)' }}>{dl}</span></div>}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
              <img src={logo} alt="" width="34" height="34" style={{ borderRadius: 11, flex: 'none' }} />
              <div style={{ position: 'relative', flex: 1, padding: '10px 14px', borderRadius: '20px 20px 6px 20px', background: 'var(--surf)', border: '1px solid ' + (m.read ? 'var(--line)' : 'var(--acc)') }}>
                <div className="row xs" style={{ gap: 6, color: tone.color, fontWeight: 600 }}><I size={13} aria-hidden="true" />{tone.label}</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{m.title}</div>
                <div className="small" style={{ lineHeight: 1.75, opacity: .92 }}>{m.body}</div>
                <div className="between" style={{ marginTop: 6 }}>
                  {m.cta ? <a href={m.cta.href} className="xs accent" style={{ fontWeight: 600 }}>{m.cta.label} ←</a> : <span />}
                  <span className="xs muted">{time(m.at)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
