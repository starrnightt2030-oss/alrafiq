// قوالب فنية بخلفيات مرسومة: حديقة ليلية، نافذة سماء، بطاقة مزخرفة، ألوان مائية، تدبّر (إنفوجرافيك بالتفسير)، صورتك الخاصة
import { SURAHS } from './quran.js';
import { ar } from './arabic.js';

const plain = (n) => n.replace(/[ً-ْٰ]/g, '');
const rnd = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
export function lines(ctx, text, maxW) { const words = text.split(/\s+/); const out = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
const gold = (ctx, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#FFF3C6'); g.addColorStop(.45, '#EBC56A'); g.addColorStop(.75, '#C4932F'); g.addColorStop(1, '#F6DE98'); return g; };
function star(ctx, x, y, r, rot = 0, n = 8, inner = 0.62) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n; const rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
function archPath(ctx, x, y, w, h, k = 0.42) { const aH = w * k; ctx.moveTo(x, y + h); ctx.lineTo(x, y + aH); ctx.quadraticCurveTo(x, y + aH * 0.22, x + w / 2, y); ctx.quadraticCurveTo(x + w, y + aH * 0.22, x + w, y + aH); ctx.lineTo(x + w, y + h); ctx.closePath(); }

// يختار أكبر خط يملأ الصندوق
export function fit(ctx, text, maxW, maxH, max = 110, min = 30, lh = 1.9, family = '"KFGQPC Hafs"') {
  let fs = max, ls = [];
  for (; fs >= min; fs -= 2) { ctx.font = `400 ${fs}px ${family}`; ls = lines(ctx, text, maxW); if (ls.length * fs * lh <= maxH) break; }
  return { fs, ls, lh: fs * lh };
}
function drawLines(ctx, f, cx, top, h, color) {
  let y = top + (h - f.ls.length * f.lh) / 2 + f.fs * 1.12;
  for (const l of f.ls) { ctx.fillStyle = typeof color === 'function' ? color(y - f.fs, y) : color; ctx.fillText(l, cx, y); y += f.lh; }
  return y - f.lh + f.fs * 0.6;
}
const refOf = (ayahs) => { const a = ayahs[0], b = ayahs[ayahs.length - 1]; const n = plain(SURAHS[a.s - 1].name); return a.a === b.a ? `سورة ${n} — الآية ${ar(a.a)}` : `سورة ${n} — الآيات ${ar(a.a)}–${ar(b.a)}`; };

export const ART = {
  // حديقة ليلية: ضوء ضبابي، يراعات، زهور، وكرة نور زجاجية حول الآية
  garden: { name: 'حديقة ليلية', sw: ['#16402C', '#05110B'], accent: '#F0CF86', light: false, draw(ctx, W, H, B, ayahs) {
    const R = rnd(11);
    const g = ctx.createRadialGradient(W / 2, H * .35, 20, W / 2, H * .5, H); g.addColorStop(0, '#1F4A34'); g.addColorStop(.6, '#0B2017'); g.addColorStop(1, '#040A07'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.filter = 'blur(18px)'; for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(${R() > .5 ? '120,190,140' : '230,200,140'},${.05 + R() * .12})`; ctx.beginPath(); ctx.arc(R() * W, R() * B, 20 + R() * 70, 0, 7); ctx.fill(); } ctx.restore();
    // الزهور
    for (let i = 0; i < 9; i++) { const x = (i + .5) * W / 9 + (R() - .5) * 60, y = B - 40 - R() * 220, s = .6 + R() * .8;
      ctx.strokeStyle = 'rgba(70,120,70,.8)'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(x, B + 30); ctx.quadraticCurveTo(x + 20 * s, (y + B) / 2, x, y); ctx.stroke();
      ctx.fillStyle = 'rgba(60,110,60,.85)'; ctx.beginPath(); ctx.ellipse(x - 26 * s, y + 90 * s, 26 * s, 9 * s, -.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 24 * s, y + 130 * s, 24 * s, 8 * s, .5, 0, 7); ctx.fill();
      ctx.save(); ctx.filter = i % 3 === 0 ? 'blur(3px)' : 'none';
      for (let k = 0; k < 26; k++) { const a = R() * Math.PI * 2, rr = R() * 36 * s; const pg = ctx.createRadialGradient(x + Math.cos(a) * rr, y - 30 * s + Math.sin(a) * rr * 1.2, 1, x + Math.cos(a) * rr, y - 30 * s + Math.sin(a) * rr * 1.2, 14 * s); pg.addColorStop(0, '#F6B6CF'); pg.addColorStop(1, 'rgba(150,40,90,.9)'); ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * rr, y - 30 * s + Math.sin(a) * rr * 1.2, 8 * s, 14 * s, a, 0, 7); ctx.fill(); }
      ctx.restore(); }
    // يراعات
    for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * B; ctx.save(); ctx.shadowColor = '#FFE7A0'; ctx.shadowBlur = 16; ctx.fillStyle = '#FFF1C2'; ctx.beginPath(); ctx.arc(x, y, 1.5 + R() * 3, 0, 7); ctx.fill(); ctx.restore(); }
    // الكرة الزجاجية
    const cx = W / 2, cy = B * .4, r = Math.min(W * .42, B * .34);
    const og = ctx.createRadialGradient(cx - r * .3, cy - r * .4, r * .1, cx, cy, r); og.addColorStop(0, 'rgba(255,255,255,.16)'); og.addColorStop(.7, 'rgba(255,255,255,.05)'); og.addColorStop(1, 'rgba(255,255,255,.12)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.stroke();
    const text = ayahs.map((a) => a.t).join(' ');
    const f = fit(ctx, text, r * 1.72, r * 1.35, 110, 30);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
    const end = drawLines(ctx, f, cx, cy - r * .7, r * 1.4, (y0, y1) => gold(ctx, y0, y1));
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.font = '400 30px "Amiri"'; ctx.fillStyle = 'rgba(255,240,210,.85)'; ctx.fillText(refOf(ayahs), cx, Math.min(cy + r - 30, end + 50));
  } },

  // نافذة القوس على سماء وغيوم
  archsky: { name: 'نافذة السماء', sw: ['#6E9BC9', '#3A2E25'], accent: '#C9A15A', light: true, draw(ctx, W, H, B, ayahs) {
    const R = rnd(5);
    const sky = ctx.createLinearGradient(0, 0, 0, B); sky.addColorStop(0, '#1C2F55'); sky.addColorStop(.35, '#5E8EC2'); sky.addColorStop(.7, '#DDE9F4'); sky.addColorStop(1, '#FFF4DE'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,255,${R() * .8})`; ctx.beginPath(); ctx.arc(R() * W, R() * B * .3, R() * 2, 0, 7); ctx.fill(); }
    ctx.save(); ctx.filter = 'blur(14px)'; for (let i = 0; i < 60; i++) { const y = B * (.3 + R() * .55); ctx.fillStyle = `rgba(255,255,255,${.25 + R() * .4})`; ctx.beginPath(); ctx.ellipse(R() * W, y, 60 + R() * 120, 30 + R() * 50, 0, 0, 7); ctx.fill(); } ctx.restore();
    const sun = ctx.createRadialGradient(W / 2, B * .82, 10, W / 2, B * .82, W * .7); sun.addColorStop(0, 'rgba(255,240,200,.95)'); sun.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    // الحجر حول القوس
    const ax = 110, ay = 70, aw = W - 220, ah = B - 70;
    const st = ctx.createLinearGradient(0, 0, W, 0); st.addColorStop(0, '#2A2119'); st.addColorStop(.5, '#6B5844'); st.addColorStop(1, '#2A2119');
    ctx.fillStyle = st; ctx.beginPath(); ctx.rect(0, 0, W, B + 4); archPath(ctx, ax, ay, aw, ah); ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(255,225,170,.55)'; ctx.lineWidth = 6; ctx.beginPath(); archPath(ctx, ax, ay, aw, ah); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 22; ctx.beginPath(); archPath(ctx, ax - 14, ay - 14, aw + 28, ah + 14); ctx.stroke();
    for (let i = 0; i < 2; i++) { const x = i ? W - 55 : 55; const cg = ctx.createLinearGradient(x - 30, 0, x + 30, 0); cg.addColorStop(0, '#3B2F25'); cg.addColorStop(.5, '#8A735A'); cg.addColorStop(1, '#3B2F25'); ctx.fillStyle = cg; ctx.fillRect(x - 28, ay + aw * .42, 56, ah); }
    const text = ayahs.map((a) => a.t).join(' ');
    const top = ay + aw * .42 + 30, h = ah - aw * .42 - 120;
    const f = fit(ctx, text, aw - 90, h, 108, 30);
    ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 24;
    const end = drawLines(ctx, f, W / 2, top, h, (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#13213F'); g.addColorStop(1, '#3A2A12'); return g; });
    ctx.shadowBlur = 0;
    ctx.font = '400 32px "Amiri"'; ctx.fillStyle = '#3A2A12'; ctx.fillText(refOf(ayahs), W / 2, Math.min(B - 40, end + 60));
  } },

  // بطاقة مزخرفة بزخارف خضراء وإطار ذهبي على خلفية فاتحة
  cartouche: { name: 'بطاقة مزخرفة', sw: ['#F7F2E6', '#1E6B4E'], accent: '#B8913A', light: true, draw(ctx, W, H, B, ayahs) {
    const R = rnd(3);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#EEF3EE'); g.addColorStop(1, '#DCE7DF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.filter = 'blur(30px)'; for (let i = 0; i < 12; i++) { ctx.fillStyle = `rgba(255,255,255,${.4 + R() * .4})`; ctx.beginPath(); ctx.arc(R() * W, R() * B, 80 + R() * 140, 0, 7); ctx.fill(); } ctx.restore();
    // ورقة نخيل زخرفية في الخلفية
    ctx.strokeStyle = 'rgba(30,107,78,.10)'; ctx.lineWidth = 3; for (let i = 0; i < 2; i++) { const x = i ? W - 90 : 90; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(x, 80 + k * 60); ctx.quadraticCurveTo(x + (i ? -1 : 1) * 70, 60 + k * 60, x + (i ? -1 : 1) * 120, 110 + k * 60); ctx.stroke(); } }
    const px = 80, pw = W - 160, ph = Math.min(B - 220, 820), py = (B - ph) / 2 + 20;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = '#FBF6E8'; ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 36); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#B8913A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(px + 18, py + 18, pw - 36, ph - 36, 26); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(px + 28, py + 28, pw - 56, ph - 56, 20); ctx.stroke();
    // وريدات خضراء على الجانبين
    for (const x of [px, px + pw]) { const y = py + ph / 2; ctx.fillStyle = '#1E6B4E'; ctx.beginPath(); ctx.arc(x, y, 48, 0, 7); ctx.fill(); ctx.strokeStyle = '#B8913A'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#EED9A6'; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 22, y + Math.sin(a) * 22, 13, 6, a, 0, 7); ctx.fill(); } ctx.fillStyle = '#B8913A'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); }
    for (const [x, y] of [[W / 2, py], [W / 2, py + ph]]) { ctx.fillStyle = '#FBF6E8'; star(ctx, x, y, 26); ctx.fill(); ctx.strokeStyle = '#B8913A'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#1E6B4E'; star(ctx, x, y, 11, Math.PI / 8); ctx.fill(); }
    // لوحة اسم السورة
    const tw = 460, th = 78, tx = (W - tw) / 2, ty = py + 52;
    ctx.fillStyle = '#F3E9CF'; ctx.strokeStyle = '#B8913A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 39); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1E6B4E'; ctx.font = '700 46px "Amiri"'; ctx.textBaseline = 'middle'; ctx.fillText('سُورَةُ ' + SURAHS[ayahs[0].s - 1].name, W / 2, ty + th / 2 + 4); ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = '#B8913A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - 200, ty + th + 34); ctx.lineTo(W / 2 + 200, ty + th + 34); ctx.stroke(); ctx.fillStyle = '#B8913A'; star(ctx, W / 2, ty + th + 34, 8); ctx.fill();
    const text = ayahs.map((a) => a.t).join(' ');
    const top = ty + th + 50, h = py + ph - 120 - top;
    const f = fit(ctx, text, pw - 170, h, 92, 28);
    drawLines(ctx, f, W / 2, top, h, '#123F2E');
    ctx.font = '400 30px "Amiri"'; ctx.fillStyle = '#8A6A22'; ctx.fillText(refOf(ayahs), W / 2, py + ph - 62);
  } },

  // ألوان مائية فيروزية وذهبية مع أغصان ذهبية
  watercolor: { name: 'ألوان مائية', sw: ['#9FD3D6', '#E7C67A'], accent: '#B98A2E', light: true, draw(ctx, W, H, B, ayahs) {
    const R = rnd(21);
    ctx.fillStyle = '#FBF7EE'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.filter = 'blur(40px)';
    for (let i = 0; i < 18; i++) { const c = i % 3 === 0 ? `rgba(231,198,122,${.25 + R() * .25})` : `rgba(${60 + R() * 40},${150 + R() * 40},${160 + R() * 30},${.18 + R() * .25})`; const edge = i % 2; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(edge ? (R() > .5 ? R() * 220 : W - R() * 220) : R() * W, edge ? R() * H : (R() > .5 ? R() * 260 : B - R() * 200), 120 + R() * 200, 90 + R() * 160, R() * 3, 0, 7); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(200,160,70,${R() * .5})`; ctx.beginPath(); ctx.arc(R() * W, R() * B, R() * 2.2, 0, 7); ctx.fill(); }
    // أغصان ذهبية
    const branch = (x, y, dir, len) => { ctx.strokeStyle = gold(ctx, y - len, y); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + dir * 40, y - len * .3, x - dir * 30, y - len * .7, x + dir * 20, y - len); ctx.stroke();
      for (let k = 1; k < 9; k++) { const t = k / 9, bx = x + dir * (Math.sin(t * 3) * 30), by = y - len * t, side = k % 2 ? 1 : -1; ctx.save(); ctx.translate(bx, by); ctx.rotate(side * .9 - dir * .2); const lg = ctx.createLinearGradient(0, -30, 0, 30); lg.addColorStop(0, k % 3 ? '#F6DE98' : '#2E6E72'); lg.addColorStop(1, k % 3 ? '#B98A2E' : '#1E4E55'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(side * 26, 0, 26, 10, 0, 0, 7); ctx.fill(); ctx.restore(); } };
    branch(110, B - 30, 1, B * .7); branch(W - 110, B - 30, -1, B * .7);
    // إطار القوس
    const ax = 190, ay = 90, aw = W - 380, ah = B - 150;
    ctx.fillStyle = 'rgba(255,253,246,.78)'; ctx.beginPath(); archPath(ctx, ax, ay, aw, ah, .32); ctx.fill();
    ctx.strokeStyle = '#C9A04A'; ctx.lineWidth = 3; ctx.beginPath(); archPath(ctx, ax, ay, aw, ah, .32); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); archPath(ctx, ax + 14, ay + 18, aw - 28, ah - 30, .32); ctx.stroke();
    const text = ayahs.map((a) => a.t).join(' ');
    const top = ay + aw * .3, h = ah - aw * .3 - 110;
    const f = fit(ctx, text, aw - 80, h, 104, 28);
    // الكلمات المتضمّنة لفظ الجلالة بالذهبي والباقي فيروزي
    let y = top + (h - f.ls.length * f.lh) / 2 + f.fs * 1.12; ctx.textAlign = 'right';
    for (const l of f.ls) { const words = l.split(' '); const sp = ctx.measureText(' ').width; const lw = ctx.measureText(l).width; let x = W / 2 + lw / 2;
      for (const w of words) { const ww = ctx.measureText(w).width; ctx.fillStyle = /لله|ٱللَّه|اللَّه|لِلَّه/.test(w) ? gold(ctx, y - f.fs, y) : '#1F5B66'; ctx.fillText(w, x, y); x -= ww + sp; }
      y += f.lh; }
    ctx.textAlign = 'center';
    ctx.font = '400 30px "Amiri"'; ctx.fillStyle = '#9A7330'; ctx.fillText('✦ ' + refOf(ayahs) + ' ✦', W / 2, ay + ah - 46);
  } },

  // تدبّر: كل آية في بطاقة ملوّنة وتحتها تفسيرها بنفس اللون
  tadabbur: { name: 'تدبّر بالتفسير', sw: ['#E6F2F1', '#8FC9C4'], accent: '#3B7F7A', light: true, needsTafsir: true, draw(ctx, W, H, B, ayahs, opts) {
    const C = [['#CFE9EE', '#1D6B7A'], ['#E9F1C9', '#5E7A12'], ['#F6D6DE', '#A12C52'], ['#E3DCF5', '#5A3FA8'], ['#FBE3C7', '#A8601A'], ['#D7EFDD', '#21784A']];
    ctx.fillStyle = '#F6F8F7'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(59,127,122,.07)'; ctx.lineWidth = 2; for (let y = 40; y < H; y += 110) for (let x = (y / 110) % 2 ? 40 : 95; x < W; x += 110) { star(ctx, x, y, 34, Math.PI / 16); ctx.stroke(); }
    const name = plain(SURAHS[ayahs[0].s - 1].name);
    ctx.font = '700 64px "Amiri"'; const tw = ctx.measureText('سورة ' + name).width + 80;
    ctx.fillStyle = '#BFE3DF'; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2, 58, tw, 46, 23); ctx.fill();
    ctx.fillStyle = '#1E3B39'; ctx.fillText('سورة ' + name, W / 2, 108);
    const n = ayahs.length, top = 150, avail = B - top - 30, slot = avail / n;
    ayahs.forEach((a, i) => {
      const [bg, fg] = C[i % C.length]; const y0 = top + i * slot;
      const tf = opts.tafsirFor?.(a) || '';
      const boxH = slot * (tf ? .48 : .9) - 14;
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(70, y0, W - 140, boxH, 22); ctx.fill();
      const f = fit(ctx, a.t, W - 240, boxH - 16, n === 1 ? 96 : 76, 24, 1.7);
      drawLines(ctx, f, W / 2, y0 + 6, boxH - 12, '#1B1B1B');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(W - 70, y0 + boxH / 2, 22, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 22px "Amiri"'; ctx.textBaseline = 'middle'; ctx.fillText(ar(a.a), W - 70, y0 + boxH / 2 + 2); ctx.textBaseline = 'alphabetic';
      if (tf) {
        const th = slot - boxH - 22; const fs = n === 1 ? 40 : n <= 2 ? 36 : n <= 4 ? 31 : 27;
        ctx.font = `400 ${fs}px "Amiri"`; let ls = lines(ctx, tf, W - 220); const max = Math.max(1, Math.floor(th / (fs * 1.5))); if (ls.length > max) { ls = ls.slice(0, max); ls[max - 1] = ls[max - 1].replace(/\s+\S*$/, '') + ' …'; }
        ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(W - 110, y0 + boxH); ctx.lineTo(W - 110, y0 + boxH + 18); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = fg; ls.forEach((l, k) => ctx.fillText(l, W / 2, y0 + boxH + 14 + fs * 1.1 + k * fs * 1.5));
      }
    });
    ctx.font = '600 22px "Readex Pro"'; ctx.fillStyle = '#5E7A78'; ctx.fillText('المعنى من التفسير الميسّر — ' + refOf(ayahs), W / 2, B + 6);
  } },

  // صورتك: أي صورة من جهازك كخلفية مع تعتيم أنيق
  photo: { name: 'صورة من جهازك', sw: ['#555', '#222'], accent: '#F0D894', light: false, photo: true, draw(ctx, W, H, B, ayahs, opts) {
    const img = opts.photo;
    if (img) { const s = Math.max(W / img.width, H / img.height); const w = img.width * s, h = img.height * s; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }
    else { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, W, H); }
    const ov = ctx.createLinearGradient(0, 0, 0, H); ov.addColorStop(0, 'rgba(0,0,0,.15)'); ov.addColorStop(.45, 'rgba(0,0,0,.55)'); ov.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,240,200,.55)'; ctx.lineWidth = 2; ctx.strokeRect(50, 50, W - 100, B - 70);
    const text = ayahs.map((a) => a.t).join(' ');
    const f = fit(ctx, text, W - 200, B - 340, 108, 30);
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
    const end = drawLines(ctx, f, W / 2, 140, B - 340, '#FFFFFF');
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.font = '400 32px "Amiri"'; ctx.fillStyle = '#F0D894'; ctx.fillText(refOf(ayahs), W / 2, Math.min(B - 60, end + 60));
    if (!img) { ctx.font = '600 30px "Readex Pro"'; ctx.fillStyle = '#fff'; ctx.fillText('اختار صورة من جهازك', W / 2, 100); }
  } },
};
