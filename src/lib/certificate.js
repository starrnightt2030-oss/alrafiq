// شهادة «فاستبقوا الخيرات»: تُرسم على Canvas بدقة عالية، ثم تُحفظ أو تُشارك كصورة
import logoUrl from '../assets/logo.webp';
import { ar, hijri } from './arabic.js';
import { analysis, levelOf, percent } from './quiz.js';
import { isNative } from './native.js';

const W = 1240, H = 1754;
const C = { bg: '#0A231E', bg2: '#0F4A3D', gold: '#D9B55A', gold2: '#F0D894', text: '#F5F0E1', muted: '#A9C2B7', green: '#5FC59A', red: '#E58C7A' };

const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function star(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = rot + (i * Math.PI) / 8; const rr = i % 2 ? r * 0.62 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}

function wrap(ctx, text, x, y, maxW, lh, maxLines = 4) {
  const words = text.split(/\s+/); let line = ''; let n = 0;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y + n * lh); line = w; n++; if (n >= maxLines) return n; }
    else line = t;
  }
  if (line) { ctx.fillText(line, x, y + n * lh); n++; }
  return n;
}

function fitFont(ctx, text, family, weight, size, maxW) {
  let s = size; do { ctx.font = `${weight} ${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 20);
}

export async function drawCertificate({ player, branches, mode, rank }) {
  await Promise.all(['700 80px "Aref Ruqaa"', '700 40px "Amiri"', '400 30px "Amiri"', '600 30px "Readex Pro"', '400 26px "Readex Pro"', '700 30px "Readex Pro"'].map((f) => document.fonts?.load(f).catch(() => {})));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const pct = percent(player); const lv = levelOf(pct); const { rows, strong, weak } = analysis(player, branches);

  // الخلفية
  const g = ctx.createRadialGradient(W / 2, 380, 80, W / 2, H / 2, H * 0.8); g.addColorStop(0, C.bg2); g.addColorStop(1, C.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // زخرفة نجمية خفيفة
  ctx.strokeStyle = 'rgba(217,181,90,0.07)'; ctx.lineWidth = 1.5;
  for (let y = 60; y < H; y += 110) for (let x = (y / 110) % 2 ? 60 : 115; x < W; x += 110) { star(ctx, x, y, 26, Math.PI / 16); ctx.stroke(); }
  // الإطار المزدوج
  ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2; ctx.strokeRect(62, 62, W - 124, H - 124);
  for (const [x, y] of [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]]) { ctx.fillStyle = C.bg; star(ctx, x, y, 34); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = C.gold; star(ctx, x, y, 14, Math.PI / 8); ctx.fill(); }

  // الشعار
  const logo = await loadImg(logoUrl);
  if (logo) { ctx.save(); ctx.shadowColor = 'rgba(217,181,90,.45)'; ctx.shadowBlur = 40; ctx.drawImage(logo, W / 2 - 85, 110, 170, 170); ctx.restore(); }

  let y = 340;
  ctx.fillStyle = C.gold2; ctx.font = '700 46px "Amiri"'; ctx.fillText('شهادة تقدير وتميّز', W / 2, y);
  y += 110; ctx.fillStyle = C.gold; ctx.font = '700 104px "Aref Ruqaa"'; ctx.fillText('فاستبقوا الخيرات', W / 2, y);
  y += 30; ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 260, y); ctx.lineTo(W / 2 + 260, y); ctx.stroke();
  ctx.fillStyle = C.gold; star(ctx, W / 2, y, 12); ctx.fill();

  y += 70; ctx.fillStyle = C.muted; ctx.font = '400 30px "Readex Pro"'; ctx.fillText(mode === 'duo' ? 'يشهد تطبيق الرفيق بأن المتسابق' : 'يشهد تطبيق الرفيق بأن', W / 2, y);
  y += 110; ctx.fillStyle = C.text; fitFont(ctx, player.name, '"Aref Ruqaa"', 700, 96, W - 260); ctx.fillText(player.name, W / 2, y);
  y += 72; ctx.fillStyle = C.muted; ctx.font = '400 30px "Readex Pro"';
  ctx.fillText(`أتمّ مسابقة «فاستبقوا الخيرات» في ${ar(branches.length)} ${branches.length > 2 && branches.length < 11 ? 'فروع' : 'فرعًا'}${rank ? ` — ${rank}` : ''}`, W / 2, y);

  // المستوى
  y += 60; const bw = 640, bh = 150, bx = (W - bw) / 2;
  ctx.fillStyle = 'rgba(217,181,90,0.12)'; ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(bx, y, bw, bh, 30); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.gold2; ctx.font = '400 26px "Readex Pro"'; ctx.fillText('المستوى', W / 2, y + 44);
  ctx.fillStyle = C.gold; fitFont(ctx, lv.title, '"Amiri"', 700, 56, bw - 60); ctx.fillText(lv.title, W / 2, y + 108);
  y += bh + 66;
  ctx.fillStyle = C.text; ctx.font = '700 34px "Readex Pro"'; ctx.fillText(`النتيجة: ${ar(player.correct)} من ${ar(player.total)}  —  ${ar(pct)}٪  —  ${ar(player.score)} نقطة`, W / 2, y);

  // نتائج الفروع
  y += 50; const colW = 470, gap = 40, startR = W / 2 + colW + gap / 2, rh = 66;
  rows.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const xr = col === 0 ? W - 130 : W / 2 - gap / 2; const yy = y + row * rh;
    ctx.textAlign = 'right'; ctx.fillStyle = C.text; ctx.font = '600 26px "Readex Pro"'; ctx.fillText(r.name, xr, yy + 26);
    ctx.textAlign = 'left'; ctx.fillStyle = r.pct >= 80 ? C.green : r.pct < 60 ? C.red : C.gold2; ctx.fillText(`${ar(r.c)}/${ar(r.t)}`, xr - colW + 10, yy + 26);
    ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.roundRect(xr - colW + 10, yy + 38, colW - 10, 10, 5); ctx.fill();
    ctx.fillStyle = r.pct >= 80 ? C.green : r.pct < 60 ? C.red : C.gold; const fw = Math.max(10, (colW - 10) * (r.pct / 100));
    ctx.beginPath(); ctx.roundRect(xr - fw, yy + 38, fw, 10, 5); ctx.fill();
  });
  void startR;
  ctx.textAlign = 'center';
  y += Math.ceil(rows.length / 2) * rh + 40;

  ctx.font = '600 28px "Readex Pro"';
  if (strong.length) { ctx.fillStyle = C.green; wrap(ctx, `✦ تميّز في: ${strong.map((r) => r.name).join('، ')}`, W / 2, y, W - 260, 42, 2); y += 48; }
  if (weak.length) { ctx.fillStyle = C.red; wrap(ctx, `✦ يحتاج مراجعة في: ${weak.map((r) => r.name).join('، ')}`, W / 2, y, W - 260, 42, 2); y += 48; }
  if (!weak.length && !strong.length) { ctx.fillStyle = C.gold2; ctx.fillText('✦ مستوى متوازن في جميع الفروع', W / 2, y); y += 48; }

  y += 24; ctx.fillStyle = C.text; ctx.font = '400 34px "Amiri"';
  wrap(ctx, lv.msg, W / 2, y, W - 280, 54, 3);

  // التذييل
  const fy = H - 190;
  ctx.fillStyle = C.gold; ctx.font = '400 34px "Amiri"'; ctx.fillText('﴿ فَاسْتَبِقُوا الْخَيْرَاتِ ﴾', W / 2, fy - 40);
  ctx.fillStyle = C.muted; ctx.font = '400 24px "Readex Pro"';
  const greg = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  ctx.fillText(`${hijri()}  —  ${greg}`, W / 2, fy + 10);
  ctx.fillText('تطبيق الرفيق — تصميم وتطوير Mohamed Eldawly', W / 2, fy + 52);
  return cv;
}

const toBlob = (cv) => new Promise((r) => cv.toBlob(r, 'image/png'));

export async function shareCertificate(cv, name) {
  const file = `شهادة-${name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
  if (isNative) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const data = cv.toDataURL('image/png').split(',')[1];
    const w = await Filesystem.writeFile({ path: 'certificate.png', data, directory: Directory.Cache });
    await Share.share({ title: 'شهادة فاستبقوا الخيرات', text: 'شهادتي في مسابقة «فاستبقوا الخيرات» من تطبيق الرفيق', files: [w.uri] });
    return 'shared';
  }
  const blob = await toBlob(cv);
  const f = new File([blob], file, { type: 'image/png' });
  if (navigator.canShare?.({ files: [f] })) {
    try { await navigator.share({ files: [f], title: 'شهادة فاستبقوا الخيرات' }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancel'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
