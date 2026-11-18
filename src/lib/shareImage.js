// مشاركة صورة مرسومة على Canvas: على أندرويد عبر نافذة المشاركة، وعلى الويب بالمشاركة أو التنزيل
import { isNative } from './native.js';

export async function shareImage(cv, name, text = '') {
  const file = `${name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
  if (isNative) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const data = cv.toDataURL('image/png').split(',')[1];
    const w = await Filesystem.writeFile({ path: 'share.png', data, directory: Directory.Cache });
    await Share.share({ title: name, text, files: [w.uri] });
    return 'shared';
  }
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  const f = new File([blob], file, { type: 'image/png' });
  if (navigator.canShare?.({ files: [f] })) {
    try { await navigator.share({ files: [f], title: name, text }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancel'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
