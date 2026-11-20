// شهادات الحفظ: صورة PNG بتصميم رسمي (إطار مزخرف، خط الرقعة للعنوان، والأميري للنص) تُحفظ على الجهاز أو تُشارك
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import logo from '../assets/logo.webp';
import { useStore } from '../store.js';

const W = 1080, H = 1440;
const ARD = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
export const dates = (d = new Date()) => {
  const g = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  let h = ''; try { h = d.toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
  return [g, h];
};
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

// c: { title, name, verb, main, sub, lines: [[label, value, color]], grade, id, at }
async function draw(canvas, c) {
  try { await Promise.all(['700 60px "Aref Ruqaa"', '700 60px Amiri', '600 40px "Readex Pro"'].map((f) => document.fonts.load(f))); } catch (e) {}
  const g = canvas.getContext('2d'); canvas.width = W; canvas.height = H;
  const T = (t, x, y, font, color, align = 'center') => { g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.direction = 'rtl'; g.fillText(t, x, y); };
  const ink = '#0F3B2E', gold = '#B8892B', paper = '#FBF6E9';
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  // نقشة هندسية خفيفة (نجمة ثمانية)
  g.save(); g.globalAlpha = 0.05; g.strokeStyle = ink; g.lineWidth = 2;
  for (let y = 80; y < H; y += 120) for (let x = (y / 120) % 2 ? 80 : 140; x < W; x += 120) { g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 18 : 34; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke(); }
  g.restore();
  // الإطار
  const gg = g.createLinearGradient(0, 0, W, H); gg.addColorStop(0, '#9C6F1E'); gg.addColorStop(0.5, '#E8C97A'); gg.addColorStop(1, '#9C6F1E');
  g.strokeStyle = ink; g.lineWidth = 26; g.strokeRect(30, 30, W - 60, H - 60);
  g.strokeStyle = gg; g.lineWidth = 6; g.strokeRect(58, 58, W - 116, H - 116);
  g.lineWidth = 2; g.strokeRect(74, 74, W - 148, H - 148);
  for (const [x, y] of [[58, 58], [W - 58, 58], [58, H - 58], [W - 58, H - 58]]) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = ink; g.fillRect(-26, -26, 52, 52); g.fillStyle = gg; g.fillRect(-16, -16, 32, 32); g.restore(); }
  const lg = await img(logo); if (lg) g.drawImage(lg, W / 2 - 70, 110, 140, 140);
  T('بسم الله الرحمن الرحيم', W / 2, 290, '700 40px Amiri, serif', ink);
  T(c.title || 'شهادة', W / 2, 390, '700 92px "Aref Ruqaa", Amiri, serif', gold);
  T('يشهد تطبيق الرفيق بأن', W / 2, 490, '600 34px "Readex Pro", sans-serif', '#5A5240');
  let fs = 96; g.font = `700 ${fs}px Amiri, serif`; while (g.measureText(c.name).width > W - 280 && fs > 54) { fs -= 6; g.font = `700 ${fs}px Amiri, serif`; }
  T(c.name, W / 2, 590, `700 ${fs}px Amiri, serif`, ink);
  g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 260, 662); g.lineTo(W / 2 + 260, 662); g.stroke();
  T(c.verb || '', W / 2, 726, '600 34px "Readex Pro", sans-serif', '#5A5240');
  T(c.main || '', W / 2, 820, '700 78px Amiri, serif', '#1F7A55');
  if (c.sub) T(c.sub, W / 2, 900, '600 32px "Readex Pro", sans-serif', '#6B6350');
  let y = 980;
  if (c.lines?.length) {
    const L = c.lines.slice(0, 10), two = L.length > 4, rows = two ? Math.ceil(L.length / 2) : L.length, rh = 50;
    g.fillStyle = 'rgba(15,59,46,.05)'; g.beginPath(); g.roundRect(120, y - 34, W - 240, rows * rh + 20, 20); g.fill();
    L.forEach(([l, v, col], k) => {
      const cx = two ? (k < rows ? W / 2 + 400 : W / 2 - 20) : W / 2 + 380, yy = y + (two ? k % rows : k) * rh;
      T(l, cx, yy, '600 28px "Readex Pro", sans-serif', ink, 'right');
      T(v, cx - (two ? 360 : 760), yy, '700 28px "Readex Pro", sans-serif', col || '#1F7A55', 'left');
    });
    y += rows * rh + 30;
  }
  if (c.grade) { g.fillStyle = ink; g.beginPath(); g.roundRect(W / 2 - 170, Math.max(y, 1090), 340, 70, 35); g.fill(); T('التقدير: ' + c.grade, W / 2, Math.max(y, 1090) + 36, '700 34px "Readex Pro", sans-serif', '#F3DFA8'); }
  const [dg, dh] = dates(c.at ? new Date(c.at) : new Date());
  T('‏' + dg, W / 2, 1222, '600 28px "Readex Pro", sans-serif', '#5A5240'); if (dh) T('‏' + dh, W / 2, 1262, '600 26px "Readex Pro", sans-serif', '#7A715C');
  T('«خيركم من تعلّم القرآن وعلّمه»', W / 2, 1325, '700 34px Amiri, serif', '#1F7A55');
  T('رقم الشهادة: ' + ARD(String(c.id || Date.now()).slice(-8)), W / 2, 1366, '500 20px "Readex Pro", sans-serif', '#9A917C');
  return canvas;
}
const fileName = (c) => `شهادة-${c.name}-${(c.main || '').replace(/\s+/g, '-')}.png`.replace(/[\\/:*?"<>|]/g, '');

export default function Cert({ c, onClose }) {
  const memPrefs = useStore((s) => s.memPrefs), saved = useStore((s) => s.mem.prefs.name);
  const cv = useRef(null), [url, setUrl] = useState(null), [msg, setMsg] = useState(''), [name, setName] = useState(saved || (c.name !== 'القارئ' ? c.name : '')), [shown, setShown] = useState(saved || c.name);
  // لو مفيش اسم محفوظ، نطلب الاسم مرة واحدة ويتحفظ لكل الشهادات الجاية
  useEffect(() => { draw(cv.current, { ...c, name: shown }).then((x) => setUrl(x.toDataURL('image/png'))); }, [shown]);
  const b64 = () => url.split(',')[1];
  const share = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        const w = await Filesystem.writeFile({ path: fileName({ ...c, name: shown }), data: b64(), directory: Directory.Cache });
        await Share.share({ title: c.title, text: `${c.title}: ${shown} — ${c.main}`, files: [w.uri] }); return;
      }
      const blob = await (await fetch(url)).blob(), f = new File([blob], fileName({ ...c, name: shown }), { type: 'image/png' });
      if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: c.title }); return; }
      save();
    } catch (e) { if (!/cancel/i.test(String(e?.message || e))) setMsg('تعذّرت المشاركة، جرّب «حفظ»'); }
  };
  const save = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({ path: 'الرفيق/' + fileName({ ...c, name: shown }), data: b64(), directory: Directory.Documents, recursive: true });
        setMsg('حُفظت في: Documents ← الرفيق'); return;
      }
      const a = document.createElement('a'); a.href = url; a.download = fileName({ ...c, name: shown }); a.click(); setMsg('تم تنزيل الشهادة');
    } catch (e) { setMsg('تعذّر الحفظ هنا — استخدم «مشاركة» واحفظها في الصور'); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,20,16,.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
      <canvas ref={cv} style={{ display: 'none' }} />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 170, damping: 16 }}
        style={{ width: 'min(100%, 400px)', aspectRatio: '1080 / 1440', borderRadius: 12, overflow: 'hidden', background: '#FBF6E9', boxShadow: '0 20px 60px #0009' }}>
        {url && <img src={url} alt={c.title} style={{ width: '100%', height: '100%', display: 'block' }} />}
      </motion.div>
      {!saved && <div className="row" style={{ gap: 6, width: 'min(100%, 400px)' }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك ليظهر على الشهادة" style={{ flex: 1, padding: 10, borderRadius: 12, border: 0 }} /><button className="btn" onClick={() => { const n = name.trim(); if (!n) return; memPrefs({ name: n }); setShown(n); }}>تم</button></div>}
      {msg && <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      <div className="row" style={{ gap: 8, width: 'min(100%, 400px)' }}>
        <button className="btn" style={{ flex: 1 }} disabled={!url} onClick={share}>مشاركة</button>
        <button className="btn soft" style={{ flex: 1 }} disabled={!url} onClick={save}>حفظ</button>
        <button className="btn ghost" style={{ background: '#fff', color: '#0F3B2E' }} onClick={onClose}>إغلاق</button>
      </div>
    </div>
  );
}
