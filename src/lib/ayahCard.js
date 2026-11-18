// بطاقة مشاركة الآية: قوالب فنية (محراب، ذهبي ملكي، مخطوطة، ليلة، فجر، بسيط) بدقة عالية، وفي أسفلها هوية التطبيق والمطوّر ورمز QR
import QRCode from 'qrcode';
import logoUrl from '../assets/logo.webp';
import { SURAHS } from './quran.js';
import { ar } from './arabic.js';
import { SITE } from './update.js';
import { ART } from './ayahArt.js';
export { ART };

export const SIZES = { post: [1080, 1350, 'منشور'], story: [1080, 1920, 'ستوري'], square: [1080, 1080, 'مربع'] };
export const STYLES = {
  mihrab: { name: 'محراب', bg: ['#0E5A49', '#04211B'], text: '#FFF8E6', accent: '#E3BC62', soft: '#BFD8CC', panel: 'rgba(0,0,0,.28)', frame: 'arch', lamp: true },
  royal: { name: 'ذهبي ملكي', bg: ['#1B1710', '#050403'], text: 'gold', accent: '#E2B65A', soft: '#CDBB94', panel: 'rgba(226,182,90,.08)', frame: 'band', rosette: true },
  manuscript: { name: 'مخطوطة', bg: ['#FBF2DC', '#E9D6AE'], text: '#2B1D0E', accent: '#A5672A', soft: '#6B5236', panel: 'rgba(165,103,42,.09)', frame: 'band', paper: true, red: '#9E2B25' },
  night: { name: 'ليلة', bg: ['#22407A', '#060C1F'], text: '#F5F7FF', accent: '#EBCB86', soft: '#B3C0DB', panel: 'rgba(0,0,0,.28)', frame: 'double', stars: true, mosque: true, moon: true },
  dawn: { name: 'فجر', bg: ['#F3A27A', '#3B1B55'], text: '#FFFFFF', accent: '#FFE1A8', soft: '#FBE3D8', panel: 'rgba(40,10,50,.3)', frame: 'arch', sun: true, linear: true },
  minimal: { name: 'بسيط', bg: ['#FFFFFF', '#F2EEE6'], text: '#141414', accent: '#B8913A', soft: '#5C5C5C', panel: 'rgba(0,0,0,.04)', frame: 'thin' },
};

const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const plain = (n) => n.replace(/[ً-ْٰ]/g, '');
const rnd = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

function star(ctx, x, y, r, rot = 0, n = 8, inner = 0.62) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n; const rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
function lines(ctx, text, maxW) { const words = text.split(/\s+/); const out = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
const gold = (ctx, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#FFF3C6'); g.addColorStop(.45, '#EBC56A'); g.addColorStop(.75, '#C4932F'); g.addColorStop(1, '#F6DE98'); return g; };
const goldH = (ctx, x0, x1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#9C7128'); g.addColorStop(.25, '#F3D88E'); g.addColorStop(.5, '#C99A3A'); g.addColorStop(.75, '#FBE7A8'); g.addColorStop(1, '#9C7128'); return g; };

// قوس المحراب المدبّب
function archPath(ctx, x, y, w, h) {
  const aH = w * 0.36;
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + aH);
  ctx.quadraticCurveTo(x, y + aH * 0.25, x + w * 0.5, y);
  ctx.quadraticCurveTo(x + w, y + aH * 0.25, x + w, y + aH);
  ctx.lineTo(x + w, y + h); ctx.closePath();
}
// وردة هندسية كبيرة في الخلفية
function rosette(ctx, cx, cy, r, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) { star(ctx, cx, cy, r * (1 - k * 0.22), k * Math.PI / 8, 8, 0.72); ctx.stroke(); }
  ctx.globalAlpha = .35;
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.5, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, r * 1.04, 0, 7); ctx.stroke();
  ctx.restore();
}
// زخرفة ركنية (أرابيسك)
function corner(ctx, x, y, sx, sy, c, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sx * s, sy * s); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 90); ctx.bezierCurveTo(0, 30, 30, 0, 90, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, 70); ctx.bezierCurveTo(16, 34, 34, 16, 70, 14); ctx.stroke();
  for (const [px, py, r] of [[90, 0, 7], [0, 90, 7], [36, 36, 9]]) { ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(36, 36); ctx.bezierCurveTo(60, 50, 70, 70, 54, 84); ctx.bezierCurveTo(46, 70, 40, 56, 36, 36); ctx.fill();
  ctx.beginPath(); ctx.moveTo(36, 36); ctx.bezierCurveTo(50, 60, 70, 70, 84, 54); ctx.bezierCurveTo(70, 46, 56, 40, 36, 36); ctx.fill();
  ctx.restore();
}
// شريط نجوم زخرفي على حدود الإطار
function starBand(ctx, x, y, w, h, c, step = 44) {
  ctx.save(); ctx.fillStyle = c;
  for (let i = x + step / 2; i < x + w; i += step) { star(ctx, i, y, 8, 0, 8, .5); ctx.fill(); star(ctx, i, y + h, 8, 0, 8, .5); ctx.fill(); }
  for (let j = y + step / 2; j < y + h; j += step) { star(ctx, x, j, 8, 0, 8, .5); ctx.fill(); star(ctx, x + w, j, 8, 0, 8, .5); ctx.fill(); }
  ctx.restore();
}
function lantern(ctx, x, y, c) {
  ctx.save(); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 70); ctx.stroke();
  const g = ctx.createRadialGradient(x, y + 120, 4, x, y + 120, 120); g.addColorStop(0, 'rgba(255,220,140,.55)'); g.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 130, y, 260, 260); ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(x - 22, y + 86); ctx.lineTo(x, y + 70); ctx.lineTo(x + 22, y + 86); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 26, y + 88); ctx.lineTo(x + 26, y + 88); ctx.lineTo(x + 30, y + 120); ctx.lineTo(x + 18, y + 156); ctx.lineTo(x - 18, y + 156); ctx.lineTo(x - 30, y + 120); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,226,150,.85)'; ctx.beginPath(); ctx.ellipse(x, y + 122, 9, 18, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 18, y + 158); ctx.lineTo(x + 18, y + 158); ctx.lineTo(x, y + 176); ctx.fill();
  ctx.restore();
}
function mosque(ctx, x, w, base, c) {
  ctx.save(); ctx.fillStyle = c; const s = w / 400; ctx.translate(x, base - 170 * s); ctx.scale(s, s);
  ctx.fillRect(54, 40, 16, 130); ctx.beginPath(); ctx.moveTo(50, 40); ctx.lineTo(74, 40); ctx.lineTo(62, 12); ctx.fill();
  ctx.fillRect(330, 40, 16, 130); ctx.beginPath(); ctx.moveTo(326, 40); ctx.lineTo(350, 40); ctx.lineTo(338, 12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(120, 170); ctx.lineTo(120, 112); ctx.quadraticCurveTo(200, 92, 280, 112); ctx.lineTo(280, 170); ctx.fill();
  ctx.beginPath(); ctx.moveTo(140, 112); ctx.quadraticCurveTo(200, 26, 260, 112); ctx.fill();
  ctx.beginPath(); ctx.moveTo(100, 170); ctx.lineTo(100, 130); ctx.quadraticCurveTo(120, 106, 140, 130); ctx.lineTo(140, 170); ctx.fill();
  ctx.beginPath(); ctx.moveTo(260, 170); ctx.lineTo(260, 130); ctx.quadraticCurveTo(280, 106, 300, 130); ctx.lineTo(300, 170); ctx.fill();
  ctx.fillRect(198, 16, 4, 14); ctx.beginPath(); ctx.arc(200, 14, 5, 0, 7); ctx.fill();
  ctx.restore();
}

export async function drawAyahCard({ ayahs, style = 'mihrab', size = 'post', tafsir = '', tafsirFor, photo }) {
  await Promise.all(['400 60px "KFGQPC Hafs"', '700 40px "Amiri"', '400 30px "Amiri"', '600 28px "Readex Pro"', '400 24px "Readex Pro"'].map((f) => document.fonts?.load(f).catch(() => {})));
  if (ART[style]) {
    const A = ART[style]; const [W, H] = SIZES[size] || SIZES.post; const FOOT = 236;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center';
    A.draw(ctx, W, H, H - FOOT + 20, ayahs, { tafsirFor, photo });
    ctx.filter = 'none'; ctx.shadowBlur = 0; ctx.textAlign = 'center';
    const S = { text: A.light ? '#1B1B1B' : '#FFFFFF', soft: A.light ? '#555' : 'rgba(255,255,255,.75)', accent: A.accent };
    await drawFooter(ctx, S, W, H, 44, FOOT, A.light, A.accent, style);
    return cv;
  }
  const S = STYLES[style] || STYLES.mihrab; const [W, H] = SIZES[size] || SIZES.post;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center';
  const R = rnd(7); const light = !!S.paper || style === 'minimal';

  // ١) الخلفية
  let g;
  if (S.linear) { g = ctx.createLinearGradient(0, H, 0, 0); g.addColorStop(0, S.bg[0]); g.addColorStop(.55, '#C2577A'); g.addColorStop(1, S.bg[1]); }
  else { g = ctx.createRadialGradient(W / 2, H * 0.38, 40, W / 2, H * 0.5, H * 0.9); g.addColorStop(0, S.bg[0]); g.addColorStop(1, S.bg[1]); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (S.paper) { for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(90,60,20,${R() * 0.05})`; ctx.fillRect(R() * W, R() * H, 2, 2); } const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(120,80,30,0)'); v.addColorStop(1, 'rgba(120,80,30,.28)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  if (S.stars) for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + R() * 0.7})`; ctx.beginPath(); ctx.arc(R() * W, R() * H * 0.7, 0.6 + R() * 2, 0, 7); ctx.fill(); }
  if (S.sun) { const sg = ctx.createRadialGradient(W / 2, H * 0.78, 10, W / 2, H * 0.78, W * 0.7); sg.addColorStop(0, 'rgba(255,230,170,.75)'); sg.addColorStop(1, 'rgba(255,230,170,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); }
  if (S.rosette) rosette(ctx, W / 2, H * 0.42, W * 0.42, 'rgba(226,182,90,.10)');
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, W * 0.55); glow.addColorStop(0, light ? 'rgba(255,255,255,.45)' : 'rgba(255,230,160,.10)'); glow.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // ٢) الإطار
  const M = 44, FOOT = 236; const fx = M, fy = M, fw = W - 2 * M, fh = H - 2 * M - FOOT + 20;
  const accentFill = style === 'royal' || style === 'mihrab' ? goldH(ctx, fx, fx + fw) : S.accent;
  ctx.strokeStyle = accentFill;
  if (S.frame === 'arch') {
    ctx.fillStyle = S.panel; archPath(ctx, fx + 40, fy + 34, fw - 80, fh - 44); ctx.fill();
    ctx.lineWidth = 6; archPath(ctx, fx + 20, fy + 10, fw - 40, fh - 10); ctx.stroke();
    ctx.lineWidth = 2; archPath(ctx, fx + 40, fy + 34, fw - 80, fh - 44); ctx.stroke();
    ctx.fillStyle = S.accent; star(ctx, W / 2, fy + 10, 14); ctx.fill();
  } else if (S.frame === 'band') {
    ctx.lineWidth = 5; ctx.strokeRect(fx, fy, fw, fh); ctx.lineWidth = 1.6; ctx.strokeRect(fx + 34, fy + 34, fw - 68, fh - 68);
    starBand(ctx, fx + 17, fy + 17, fw - 34, fh - 34, S.red || S.accent);
    for (const [x, y, sx, sy] of [[fx + 34, fy + 34, 1, 1], [fx + fw - 34, fy + 34, -1, 1], [fx + 34, fy + fh - 34, 1, -1], [fx + fw - 34, fy + fh - 34, -1, -1]]) corner(ctx, x, y, sx, sy, S.accent, 1.1);
  } else if (S.frame === 'double') {
    ctx.lineWidth = 4; ctx.strokeRect(fx, fy, fw, fh); ctx.lineWidth = 1.5; ctx.strokeRect(fx + 14, fy + 14, fw - 28, fh - 28);
    for (const [x, y, sx, sy] of [[fx + 14, fy + 14, 1, 1], [fx + fw - 14, fy + 14, -1, 1], [fx + 14, fy + fh - 14, 1, -1], [fx + fw - 14, fy + fh - 14, -1, -1]]) corner(ctx, x, y, sx, sy, S.accent, .9);
  } else {
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx + 60, fy + 20); ctx.lineTo(fx + fw - 60, fy + 20); ctx.moveTo(fx + 60, fy + fh); ctx.lineTo(fx + fw - 60, fy + fh); ctx.stroke();
    ctx.fillStyle = S.accent; for (const x of [fx + 60, fx + fw - 60]) for (const y of [fy + 20, fy + fh]) { star(ctx, x, y, 9); ctx.fill(); }
  }
  if (S.moon) { ctx.save(); ctx.shadowColor = 'rgba(255,236,170,.8)'; ctx.shadowBlur = 40; ctx.fillStyle = '#FBE9AE'; ctx.beginPath(); ctx.arc(fx + fw - 120, fy + 110, 40, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = S.bg[0]; ctx.beginPath(); ctx.arc(fx + fw - 102, fy + 98, 37, 0, 7); ctx.fill(); ctx.restore(); }
  if (S.mosque) mosque(ctx, fx + fw * 0.12, fw * 0.76, fy + fh - 14, 'rgba(0,0,0,.42)');
  if (S.lamp) lantern(ctx, W / 2, fy + 24, '#E3BC62');

  // ٣) اسم السورة
  const first = ayahs[0], last = ayahs[ayahs.length - 1];
  const sname = SURAHS[first.s - 1].name;
  const headY = S.frame === 'arch' ? fy + (S.lamp ? 250 : 210) : fy + 96;
  ctx.textBaseline = 'middle';
  if (S.frame !== 'arch') {
    const pw = 520, ph = 86, px = (W - pw) / 2, py = headY - ph / 2;
    ctx.fillStyle = S.panel; ctx.strokeStyle = accentFill; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px + 44, py); ctx.lineTo(px + pw - 44, py); ctx.lineTo(px + pw, py + ph / 2); ctx.lineTo(px + pw - 44, py + ph); ctx.lineTo(px + 44, py + ph); ctx.lineTo(px, py + ph / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = S.accent; for (const x of [px + 24, px + pw - 24]) { star(ctx, x, py + ph / 2, 10); ctx.fill(); }
  }
  ctx.fillStyle = style === 'royal' || style === 'mihrab' ? gold(ctx, headY - 30, headY + 30) : S.accent; ctx.font = '700 50px "Amiri"';
  ctx.fillText('سُورَةُ ' + sname, W / 2, headY + 4); ctx.textBaseline = 'alphabetic';
  if (S.frame === 'arch') { ctx.strokeStyle = S.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - 170, headY + 46); ctx.lineTo(W / 2 - 16, headY + 46); ctx.moveTo(W / 2 + 16, headY + 46); ctx.lineTo(W / 2 + 170, headY + 46); ctx.stroke(); ctx.fillStyle = S.accent; star(ctx, W / 2, headY + 46, 9); ctx.fill(); }

  // ٤) نص الآية — أكبر خط يناسب المساحة
  const text = ayahs.map((a) => a.t).join(' ');
  const top = headY + 76; const tafH = tafsir ? 260 : 0;
  const bottom = fy + fh - (S.mosque ? 150 : 74) - tafH; const maxW = fw - (S.frame === 'arch' ? 180 : 150);
  let fs = size === 'story' ? 112 : 96, ls = [];
  for (; fs >= 34; fs -= 3) { ctx.font = `400 ${fs}px "KFGQPC Hafs"`; ls = lines(ctx, text, maxW); if (ls.length * fs * 1.95 <= bottom - top) break; }
  const lh = fs * 1.95; let y = top + (bottom - top - ls.length * lh) / 2 + fs * 1.15;
  ctx.fillStyle = S.text === 'gold' ? gold(ctx, y - fs, y + ls.length * lh) : S.text;
  ctx.shadowColor = light ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 2;
  for (const l of ls) { ctx.fillText(l, W / 2, y); y += lh; }
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // المرجع بين نجمتين
  const ry = bottom + 38;
  const ref = first.a === last.a ? `${plain(sname)} — الآية ${ar(first.a)}` : `${plain(sname)} — الآيات ${ar(first.a)}–${ar(last.a)}`;
  ctx.font = '400 30px "Amiri"'; const rw = ctx.measureText(ref).width;
  ctx.fillStyle = S.red || S.accent; ctx.fillText(ref, W / 2, ry);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - rw / 2 - 100, ry - 10); ctx.lineTo(W / 2 - rw / 2 - 28, ry - 10); ctx.moveTo(W / 2 + rw / 2 + 28, ry - 10); ctx.lineTo(W / 2 + rw / 2 + 100, ry - 10); ctx.stroke();
  ctx.fillStyle = S.accent; for (const x of [W / 2 - rw / 2 - 16, W / 2 + rw / 2 + 16]) { star(ctx, x, ry - 10, 8); ctx.fill(); }

  // ٥) التفسير (اختياري)
  if (tafsir) {
    const ty = bottom + 74, tw = fw - 140, tx = (W - tw) / 2;
    ctx.fillStyle = S.panel; ctx.beginPath(); ctx.roundRect(tx, ty, tw, 220, 26); ctx.fill();
    ctx.strokeStyle = S.accent; ctx.lineWidth = 1.2; ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = S.accent; ctx.font = '600 24px "Readex Pro"'; ctx.fillText('التفسير الميسّر', W / 2, ty + 42);
    ctx.fillStyle = S.text === 'gold' ? '#EADFC4' : S.text; ctx.globalAlpha = .92; ctx.font = '400 31px "Amiri"';
    let tl = lines(ctx, tafsir, tw - 60); if (tl.length > 3) { tl = tl.slice(0, 3); tl[2] = tl[2].replace(/\s+\S*$/, '') + ' …'; }
    tl.forEach((l, i) => ctx.fillText(l, W / 2, ty + 94 + i * 48)); ctx.globalAlpha = 1;
  }

  await drawFooter(ctx, S, W, H, M, FOOT, light, accentFill, style);
  return cv;
}

// التذييل المشترك: لوحة بهوية التطبيق والمطوّر ورمز QR
async function drawFooter(ctx, S, W, H, M, FOOT, light, accentFill, style) {
  const by = H - FOOT + 44, bh = FOOT - 72, bx = M, bw = W - 2 * M;
  ctx.fillStyle = light ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 30); ctx.fill();
  ctx.strokeStyle = accentFill; ctx.lineWidth = 2; ctx.stroke();
  const logo = await loadImg(logoUrl); const ls2 = 124, lx = bx + bw - ls2 - 20, lyy = by + (bh - ls2) / 2;
  if (logo) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16; ctx.drawImage(logo, lx, lyy, ls2, ls2); ctx.restore(); }
  ctx.textAlign = 'right'; const tx2 = lx - 22;
  ctx.fillStyle = style === 'royal' || style === 'mihrab' ? gold(ctx, by + 20, by + 70) : (S.red || S.accent); ctx.font = '700 50px "Amiri"'; ctx.fillText('تطبيق الرفيق', tx2, by + 62);
  ctx.fillStyle = S.text === 'gold' ? '#EADFC4' : S.text; ctx.font = '400 24px "Readex Pro"'; ctx.fillText('رفيقك في ذكر الله — أذكار، قرآن، صلاة', tx2, by + 102);
  ctx.fillStyle = S.soft; ctx.font = '400 21px "Readex Pro"'; ctx.fillText('تصميم وتطوير Mohamed Eldawly', tx2, by + 136);
  // QR داخل بطاقة بيضاء وتحته جملة الدعوة
  const qw = 180, qh = bh - 18, qx = bx + 14, qy = by + 9, qs = 116;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(qx, qy, qw, qh, 18); ctx.fill();
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, SITE, { margin: 0, width: qs, color: { dark: '#10241E', light: '#FFFFFF' }, errorCorrectionLevel: 'H' });
  ctx.drawImage(qr, qx + (qw - qs) / 2, qy + 8, qs, qs);
  if (logo) { const c = 28; ctx.fillStyle = '#fff'; ctx.fillRect(qx + qw / 2 - c / 2 - 3, qy + 10 + qs / 2 - c / 2 - 3, c + 6, c + 6); ctx.drawImage(logo, qx + qw / 2 - c / 2, qy + 10 + qs / 2 - c / 2, c, c); }
  ctx.textAlign = 'center'; ctx.fillStyle = '#10241E'; ctx.font = '600 16px "Readex Pro"'; ctx.fillText('امسح وحمّل التطبيق', qx + qw / 2, qy + qh - 9);
}
