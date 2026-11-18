// بطاقة مشاركة الآية: صورة عالية الدقة بتصميم مصحفي، وفي أسفلها هوية التطبيق والمطوّر ورمز QR لتحميل التطبيق
import QRCode from 'qrcode';
import logoUrl from '../assets/logo.webp';
import { SURAHS } from './quran.js';
import { ar } from './arabic.js';
import { SITE } from './update.js';

export const SIZES = { post: [1080, 1350, 'منشور'], story: [1080, 1920, 'ستوري'], square: [1080, 1080, 'مربع'] };
export const STYLES = {
  emerald: { name: 'زمرّدي', bg: ['#0F4A3D', '#06261F'], text: '#FFF8E6', accent: '#E3BC62', soft: '#A9C9BC', pat: 'rgba(227,188,98,.08)', panel: 'rgba(0,0,0,.22)' },
  night: { name: 'ليلي', bg: ['#1F3766', '#070E22'], text: '#F4F6FB', accent: '#E9C67D', soft: '#A7B4CC', pat: 'rgba(233,198,125,.07)', panel: 'rgba(0,0,0,.25)', stars: true },
  parchment: { name: 'ورقي', bg: ['#FFF8E9', '#EBDDBE'], text: '#2A2016', accent: '#9A6A22', soft: '#6B5A46', pat: 'rgba(154,106,34,.09)', panel: 'rgba(154,106,34,.08)' },
  dawn: { name: 'فجر', bg: ['#5A2A63', '#1A1036'], text: '#FFF4F0', accent: '#F2C08A', soft: '#D9B9CF', pat: 'rgba(242,192,138,.08)', panel: 'rgba(0,0,0,.22)', stars: true },
  maroon: { name: 'عنّابي', bg: ['#6B2333', '#250A11'], text: '#FBEFE8', accent: '#E8B57F', soft: '#D2AFA8', pat: 'rgba(232,181,127,.08)', panel: 'rgba(0,0,0,.22)' },
};

const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const plain = (n) => n.replace(/[ً-ْٰ]/g, '');

function star(ctx, x, y, r, rot = 0) { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = rot + (i * Math.PI) / 8; const rr = i % 2 ? r * 0.62 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }

// تقسيم النص لأسطر بعرض محدد
function lines(ctx, text, maxW) {
  const words = text.split(/\s+/); const out = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
}

export async function drawAyahCard({ ayahs, style = 'emerald', size = 'post', tafsir = '' }) {
  const S = STYLES[style] || STYLES.emerald; const [W, H] = SIZES[size] || SIZES.post;
  await Promise.all(['400 60px "KFGQPC Hafs"', '700 60px "Aref Ruqaa"', '700 40px "Amiri"', '400 30px "Amiri"', '600 28px "Readex Pro"', '400 24px "Readex Pro"'].map((f) => document.fonts?.load(f).catch(() => {})));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center';

  // الخلفية والزخرفة
  const g = ctx.createRadialGradient(W / 2, H * 0.35, 60, W / 2, H / 2, H * 0.85); g.addColorStop(0, S.bg[0]); g.addColorStop(1, S.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = S.pat; ctx.lineWidth = 1.6;
  for (let y = 50; y < H; y += 120) for (let x = (y / 120) % 2 ? 50 : 110; x < W; x += 120) { star(ctx, x, y, 30, Math.PI / 16); ctx.stroke(); }
  if (S.stars) { ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 70; i++) { const x = (i * 157) % W, y = (i * 263) % (H * 0.45); ctx.globalAlpha = .25 + ((i * 37) % 60) / 100; ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3), 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  // هالة نور خلف النص
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, W * 0.6); glow.addColorStop(0, S.accent + '22'); glow.addColorStop(1, S.accent + '00');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // الإطار المزخرف
  const M = 46, FOOT = 250;
  ctx.strokeStyle = S.accent; ctx.lineWidth = 5; ctx.strokeRect(M, M, W - 2 * M, H - 2 * M - FOOT + 30);
  ctx.lineWidth = 1.6; ctx.strokeRect(M + 16, M + 16, W - 2 * M - 32, H - 2 * M - FOOT - 2);
  for (const [x, y] of [[M, M], [W - M, M], [M, H - M - FOOT + 30], [W - M, H - M - FOOT + 30]]) { ctx.fillStyle = S.bg[1]; star(ctx, x, y, 30); ctx.fill(); ctx.strokeStyle = S.accent; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = S.accent; star(ctx, x, y, 12, Math.PI / 8); ctx.fill(); }

  // لوحة اسم السورة
  const first = ayahs[0], last = ayahs[ayahs.length - 1];
  const sname = SURAHS[first.s - 1].name;
  const py = M + 60, pw = 560, ph = 92, px = (W - pw) / 2;
  ctx.fillStyle = S.panel; ctx.strokeStyle = S.accent; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(px + 40, py); ctx.lineTo(px + pw - 40, py); ctx.lineTo(px + pw, py + ph / 2); ctx.lineTo(px + pw - 40, py + ph); ctx.lineTo(px + 40, py + ph); ctx.lineTo(px, py + ph / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const x of [px + 22, px + pw - 22]) { ctx.fillStyle = S.accent; star(ctx, x, py + ph / 2, 10); ctx.fill(); }
  ctx.fillStyle = S.accent; ctx.font = '700 50px "Amiri"'; ctx.textBaseline = 'middle'; ctx.fillText('سُورَةُ ' + sname, W / 2, py + ph / 2 + 4); ctx.textBaseline = 'alphabetic';

  // نص الآية: نختار أكبر خط يناسب المساحة
  const text = ayahs.map((a) => a.t).join(' ');
  const top = py + ph + 50; const tafH = tafsir ? 260 : 0;
  const bottom = H - M - FOOT - 70 - tafH; const maxW = W - 2 * M - 120;
  let fs = size === 'story' ? 108 : 92, ls = [];
  for (; fs >= 34; fs -= 3) { ctx.font = `400 ${fs}px "KFGQPC Hafs"`; ls = lines(ctx, text, maxW); if (ls.length * fs * 1.95 <= bottom - top) break; }
  const lh = fs * 1.95; let y = top + (bottom - top - ls.length * lh) / 2 + fs * 1.15;
  ctx.fillStyle = S.text; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = style === 'parchment' ? 0 : 12;
  for (const l of ls) { ctx.fillText(l, W / 2, y); y += lh; }
  ctx.shadowBlur = 0;
  // المرجع
  const ref = first.a === last.a ? `${plain(sname)} — الآية ${ar(first.a)}` : `${plain(sname)} — الآيات ${ar(first.a)}–${ar(last.a)}`;
  ctx.fillStyle = S.accent; ctx.font = '400 32px "Amiri"'; ctx.fillText(`﴿ ${ref} ﴾`, W / 2, bottom + 40);

  // التفسير (اختياري)
  if (tafsir) {
    const ty = bottom + 76, tw = W - 2 * M - 110, tx = (W - tw) / 2;
    ctx.fillStyle = S.panel; ctx.beginPath(); ctx.roundRect(tx, ty, tw, 220, 24); ctx.fill();
    ctx.fillStyle = S.accent; ctx.font = '600 24px "Readex Pro"'; ctx.fillText('التفسير الميسّر', W / 2, ty + 40);
    ctx.fillStyle = S.text; ctx.globalAlpha = .9; ctx.font = '400 31px "Amiri"';
    let tl = lines(ctx, tafsir, tw - 50); if (tl.length > 3) { tl = tl.slice(0, 3); tl[2] = tl[2].replace(/\s+\S*$/, '') + ' …'; }
    tl.forEach((l, i) => ctx.fillText(l, W / 2, ty + 92 + i * 48)); ctx.globalAlpha = 1;
  }

  // التذييل: هوية التطبيق + المطوّر + QR
  const fy = H - FOOT + 10;
  ctx.strokeStyle = S.accent; ctx.globalAlpha = .6; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M + 30, fy); ctx.lineTo(W - M - 30, fy); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = S.accent; star(ctx, W / 2, fy, 11); ctx.fill();
  const logo = await loadImg(logoUrl);
  const ly = fy + 38, ls2 = 150;
  if (logo) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18; ctx.drawImage(logo, W - M - ls2, ly, ls2, ls2); ctx.restore(); }
  ctx.textAlign = 'right';
  const tx2 = W - M - ls2 - 26;
  ctx.fillStyle = S.accent; ctx.font = '700 60px "Amiri"'; ctx.fillText('تطبيق الرفيق', tx2, ly + 56);
  ctx.fillStyle = S.text; ctx.font = '400 27px "Readex Pro"'; ctx.fillText('رفيقك في ذكر الله — أذكار، قرآن، صلاة', tx2, ly + 104);
  ctx.fillStyle = S.soft; ctx.font = '400 22px "Readex Pro"'; ctx.fillText('تصميم وتطوير Mohamed Eldawly', tx2, ly + 142);
  // QR
  const qs = 170, qx = M + 6, qy = ly - 8;
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, SITE, { margin: 1, width: qs - 20, color: { dark: '#0A231E', light: '#FFFFFF' }, errorCorrectionLevel: 'H' });
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(qx, qy, qs, qs, 20); ctx.fill();
  ctx.drawImage(qr, qx + 10, qy + 10, qs - 20, qs - 20);
  if (logo) { const c = 38; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(qx + qs / 2 - c / 2 - 4, qy + qs / 2 - c / 2 - 4, c + 8, c + 8, 8); ctx.fill(); ctx.drawImage(logo, qx + qs / 2 - c / 2, qy + qs / 2 - c / 2, c, c); }
  ctx.textAlign = 'center'; ctx.fillStyle = S.soft; ctx.font = '400 20px "Readex Pro"'; ctx.fillText('امسح وحمّل التطبيق', qx + qs / 2, qy + qs + 30);
  return cv;
}
