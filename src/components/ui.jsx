import { ChevronRight } from 'lucide-react';
import { APP } from '../config.js';
import { back } from '../router.js';

export function Pattern({ height = 420 }) {
  return (
    <svg aria-hidden="true" width="100%" height={height} style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <pattern id="rf-star" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 6l6 14 14 6-14 6-6 14-6-14-14-6 14-6z M28 14l10 4 4 10-4 10-10 4-10-4-4-10 4-10z" fill="none" stroke="var(--pat)" strokeWidth="1" />
        </pattern>
        <linearGradient id="rf-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="rf-m"><rect width="100%" height={height} fill="url(#rf-fade)" /></mask>
      </defs>
      <rect width="100%" height={height} fill="url(#rf-star)" mask="url(#rf-m)" />
    </svg>
  );
}

export function Ring({ size = 96, value = 0, stroke = 9, children, label }) {
  const r = 50 - stroke / 2 - 1, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surf2)" strokeWidth={stroke} />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--acc)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset .35s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}

export function TopBar({ title, sub, right, fallback = '/' }) {
  return (
    <div className="between" style={{ position: 'relative', zIndex: 1 }}>
      <button className="icon-btn" aria-label="رجوع" onClick={() => back(fallback)}><ChevronRight size={20} /></button>
      <div className="center" style={{ minWidth: 0 }}>
        <h1 className="title">{title}</h1>
        {sub && <div className="xs muted">{sub}</div>}
      </div>
      {right || <span style={{ width: 44 }} />}
    </div>
  );
}

export function Credit() {
  return (
    <div className="credit">
      تم تصميم وتطوير التطبيق بواسطة<br /><b>Mohamed Eldawly</b>
      <div className="xs" style={{ opacity: .8 }}>الإصدار {APP.version}</div>
    </div>
  );
}

export { toast } from './Messages.jsx';

export function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}
