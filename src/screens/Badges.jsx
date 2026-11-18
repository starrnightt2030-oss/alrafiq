// صفحة الأوسمة والإنجازات: كل وسام بأربع درجات (برونزي/فضي/ذهبي/ماسي) + أوسمة التحديات، مع مشاركة صورة الوسام
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Crown, Heart, Droplet, Star, Sun, Moon, Flame, CalendarCheck, Gem, Brain, Lightbulb, ScrollText, Medal as MedalIc, Users, Lock, Share2, Check, Sparkles, Landmark } from 'lucide-react';
import { useStore } from '../store.js';
import { TopBar, Pattern, toast } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import { ar, arNum } from '../lib/arabic.js';
import { badges, challengeBadges, CATS, TIERS, totalCount } from '../lib/badges.js';
import { sound } from '../lib/sound.js';

const ICONS = { beads: Sparkles, drop: Droplet, heart: Heart, star: Star, sun: Sun, book: BookOpen, crown: Crown, mosque: Landmark, moon: Moon, flame: Flame, calendar: CalendarCheck, gem: Gem, brain: Brain, bulb: Lightbulb, scroll: ScrollText, crescent: Moon, medal: MedalIc, people: Users };
const EMOJI = { beads: '📿', drop: '💧', heart: '💚', star: '⭐', sun: '☀️', book: '📖', crown: '👑', mosque: '🕌', moon: '🌙', flame: '🔥', calendar: '📅', gem: '💎', brain: '🧠', bulb: '💡', scroll: '📜', crescent: '🌙', medal: '🏅', people: '🤝' };

export function Medal({ icon, tier, size = 84, locked, pct = 0, glow }) {
  const t = TIERS[Math.max(1, tier)] || TIERS[1]; const I = ICONS[icon] || Star; const id = `md${icon}${tier}${size}`;
  const off = locked || !tier;
  return (
    <div className={'bd-medal' + (off ? ' off' : '') + (glow ? ' glow' : '')} style={{ width: size, height: size * 1.12, '--a': t.a, '--b': t.b }}>
      <svg viewBox="0 0 100 112" width={size} height={size * 1.12} aria-hidden="true">
        <defs>
          <linearGradient id={id + 'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={off ? '#B9C2C0' : t.a} /><stop offset="1" stopColor={off ? '#6B7573' : t.b} /></linearGradient>
          <linearGradient id={id + 'r'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={off ? '#7D8785' : t.b} /><stop offset="1" stopColor={off ? '#5A6361' : t.a} /></linearGradient>
        </defs>
        <path d="M30 0h16l10 30H40z" fill={`url(#${id}r)`} opacity=".9" /><path d="M70 0H54L44 30h16z" fill={`url(#${id}r)`} />
        <circle cx="50" cy="64" r="44" fill={`url(#${id}g)`} />
        <circle cx="50" cy="64" r="37" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray={off ? '0' : '3 3'} />
        {[...Array(12)].map((_, i) => { const a = (i / 12) * Math.PI * 2; return <circle key={i} cx={50 + Math.cos(a) * 44} cy={64 + Math.sin(a) * 44} r="3.2" fill={`url(#${id}g)`} />; })}
        {off && pct > 0 && <circle cx="50" cy="64" r="47" fill="none" stroke="var(--acc)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${pct * 295} 295`} transform="rotate(-90 50 64)" />}
        <path d="M22 50a36 36 0 0 1 56 0" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="bd-ic" style={{ color: off ? '#3E4644' : t.ink }}>{off ? <Lock size={size * .26} /> : <I size={size * .32} strokeWidth={2.2} />}</span>
      {!off && <span className="bd-stars">{[...Array(tier)].map((_, i) => <i key={i}>★</i>)}</span>}
    </div>
  );
}

export default function Badges() {
  const st = useStore();
  const list = useMemo(() => badges(st), [st.days, st.points, st.hifz, st.quiz, st.dailyQ, st.stories, st.fasts, st.challenge, st.rufaqa]); // eslint-disable-line
  const chal = useMemo(() => challengeBadges(st), [st.challenge]); // eslint-disable-line
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState(null);
  const earned = list.reduce((a, b) => a + b.tier, 0) + chal.filter((c) => c.earned).length;
  const total = totalCount();
  const byTier = [1, 2, 3, 4].map((t) => list.filter((b) => b.tier >= t).length);
  const shown = cat === 'all' ? list : list.filter((b) => b.cat === cat);
  const near = [...list].filter((b) => b.next && b.pct > 0).sort((a, b) => b.pct - a.pct)[0];

  return (
    <div className="screen no-nav">
      <Pattern />
      <TopBar title="الأوسمة والإنجازات" sub={`${arNum(earned)} من ${arNum(total)} وسام`} fallback="/" />

      <section className="bd-hero">
        <div className="bd-hero-ring" style={{ '--p': earned / total }}>
          <b className="ruqaa">{arNum(earned)}</b><span className="xs">وسام</span>
        </div>
        <div className="col" style={{ flex: 1, gap: 8 }}>
          <b className="h2" style={{ color: '#fff' }}>خزانة أوسمتك</b>
          <div className="bd-tiers">
            {[1, 2, 3, 4].map((t, i) => <span key={t} style={{ '--a': TIERS[t].a, '--b': TIERS[t].b }}><i />{TIERS[t].name} <b>{ar(byTier[i])}</b></span>)}
          </div>
          {near && <button className="bd-near" onClick={() => setOpen(near)}>الأقرب ليك: <b>{near.title}</b> — باقي {arNum(near.next - near.v)} {near.unit}</button>}
        </div>
      </section>

      <div className="chips">
        <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>الكل</button>
        {CATS.map((c) => <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </div>

      <div className="bd-grid">
        {shown.map((b, i) => (
          <motion.button key={b.id} className="bd-cell" onClick={() => { setOpen(b); sound.tap(); }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * .035 }}>
            <Medal icon={b.icon} tier={b.tier} pct={b.pct} size={74} glow={b.tier === 4} />
            <b className="small">{b.title}</b>
            <span className="xs muted">{b.tier ? TIERS[b.tier].name : 'لسه'}{b.next ? ` · ${arNum(b.v)}/${arNum(b.next)}` : ' · مكتمل ✓'}</span>
            {b.next && <span className="bd-mini"><i style={{ width: b.pct * 100 + '%' }} /></span>}
          </motion.button>
        ))}
      </div>

      {(cat === 'all' || cat === 'chal') && (
        <section className="col" style={{ gap: 10 }}>
          <div className="h2 row" style={{ gap: 6 }}><MedalIc size={18} className="accent" /> أوسمة رحلة التحديات</div>
          <div className="bd-grid">
            {chal.map((c) => (
              <div key={c.id} className="bd-cell" title={c.title}>
                <Medal icon="medal" tier={c.earned ? 3 : 0} size={64} />
                <b className="small">{c.name}</b>
                <span className="xs muted" style={{ lineHeight: 1.6 }}>{c.earned ? 'مكتسب ✓' : c.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>{open && <BadgeSheet b={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

function BadgeSheet({ b, onClose }) {
  const [busy, setBusy] = useState(false);
  const share = async () => {
    setBusy(true);
    try { const cv = await drawBadgeCard(b); const { shareImage } = await import('../lib/shareImage.js'); await shareImage(cv, 'وسام ' + b.title, `حصلت على وسام «${b.title}» ${TIERS[b.tier].name} في تطبيق الرفيق 🏅`); }
    catch { toast('تعذّرت المشاركة'); } finally { setBusy(false); }
  };
  return (
    <Sheet onClose={onClose} label={b.title}>
      <div className="col center" style={{ gap: 10, paddingBottom: 12 }}>
        <motion.div initial={{ scale: .4, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} style={{ margin: '0 auto' }}>
          <Medal icon={b.icon} tier={b.tier} pct={b.pct} size={130} glow />
        </motion.div>
        <b className="ruqaa" style={{ fontSize: 30 }}>{b.title}</b>
        <span className="small" style={{ color: b.tier ? TIERS[b.tier].b : 'var(--muted)', fontWeight: 700 }}>{b.tier ? `الدرجة ${TIERS[b.tier].name}` : 'لسه ماكسبتوش — قرّبت!'}</span>
        <span className="xs muted" style={{ lineHeight: 1.9, maxWidth: 320 }}>{b.why}</span>
        <div className="bd-steps">
          {b.steps.map((s, i) => (
            <div key={i} className={'bd-step' + (b.v >= s ? ' on' : '')} style={{ '--a': TIERS[i + 1].a, '--b': TIERS[i + 1].b }}>
              <i>{b.v >= s ? <Check size={14} /> : ar(i + 1)}</i>
              <span className="xs">{TIERS[i + 1].name}</span>
              <b className="xs">{arNum(s)}</b>
            </div>
          ))}
        </div>
        <div className="small">رصيدك: <b className="accent">{arNum(b.v)}</b> {b.unit}{b.next ? ` — باقي ${arNum(b.next - b.v)} للدرجة الجاية` : ''}</div>
        {b.tier > 0 && <button className="btn q-go" style={{ width: '100%' }} disabled={busy} onClick={share}><Share2 size={18} /> {busy ? 'بجهّز الصورة…' : 'شارك وسامك'}</button>}
      </div>
    </Sheet>
  );
}

async function drawBadgeCard(b) {
  const { drawFooter } = await import('../lib/ayahCard.js');
  await Promise.all(['700 40px "Amiri"', '400 30px "Readex Pro"', '700 30px "Aref Ruqaa"'].map((f) => document.fonts?.load(f).catch(() => {})));
  const W = 1080, H = 1350, FOOT = 260; const t = TIERS[b.tier];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const bg = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 520, 900); bg.addColorStop(0, '#1C5A47'); bg.addColorStop(1, '#06140F');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // أشعة
  ctx.save(); ctx.translate(W / 2, 470); for (let i = 0; i < 24; i++) { ctx.rotate(Math.PI / 12); ctx.fillStyle = i % 2 ? 'rgba(232,190,92,.06)' : 'rgba(255,255,255,.025)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -900); ctx.lineTo(60, -900); ctx.fill(); } ctx.restore();
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillStyle = '#E8BE5C'; ctx.font = '700 46px "Amiri"'; ctx.fillText('وسام جديد', W / 2, 120);
  // الشريط والوسام
  const cx = W / 2, cy = 500, R = 220;
  const rib = ctx.createLinearGradient(0, 170, 0, 330); rib.addColorStop(0, t.b); rib.addColorStop(1, t.a);
  ctx.fillStyle = rib; ctx.beginPath(); ctx.moveTo(cx - 150, 160); ctx.lineTo(cx - 70, 160); ctx.lineTo(cx + 10, 340); ctx.lineTo(cx - 70, 340); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 150, 160); ctx.lineTo(cx + 70, 160); ctx.lineTo(cx - 10, 340); ctx.lineTo(cx + 70, 340); ctx.fill();
  ctx.save(); ctx.shadowColor = t.b; ctx.shadowBlur = 80;
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, t.a); g.addColorStop(1, t.b);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 16, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.arc(cx, cy, R - 34, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '150px "Noto Color Emoji", "Apple Color Emoji", sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText(EMOJI[b.icon] || '🏅', cx, cy + 6); ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = t.a; ctx.font = '700 40px sans-serif'; ctx.fillText('★'.repeat(b.tier), cx, cy + R + 70);
  ctx.fillStyle = '#fff'; ctx.font = '700 96px "Aref Ruqaa", "Amiri"'; ctx.fillText(b.title, W / 2, 900);
  ctx.fillStyle = t.a; ctx.font = '600 40px "Readex Pro"'; ctx.fillText(`الدرجة ${t.name} — ${arNum(b.v)} ${b.unit}`, W / 2, 965);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '400 30px "Readex Pro"';
  const words = b.why.split(' '); let line = '', y = 1030; for (const w of words) { const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > 880) { ctx.fillText(line, W / 2, y); line = w; y += 46; } else line = tt; } ctx.fillText(line, W / 2, y);
  await drawFooter(ctx, { text: '#FFFFFF', soft: 'rgba(255,255,255,.65)', accent: '#E8BE5C' }, W, H, 44, FOOT, false, '#E8BE5C', 'royal');
  return cv;
}
