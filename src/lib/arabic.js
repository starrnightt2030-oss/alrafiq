const D = '٠١٢٣٤٥٦٧٨٩';
export const ar = (n) => String(n).replace(/\d/g, (d) => D[d]);
export const arNum = (n) => ar(Number(n).toLocaleString('en-US').replace(/,/g, '٬'));
export const todayKey = (d = new Date()) => {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const hijri = (d = new Date()) => {
  try { return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); }
  catch { return ''; }
};
export const gregorian = (d = new Date()) => new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
// «يوم واحد / يومان / ٣ أيام / ١١ يومًا»
export const daysAr = (n) => n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${ar(n)} أيام` : `${ar(n)} يومًا`;
export const minutesAr = (n) => n === 1 ? 'دقيقة واحدة' : n === 2 ? 'دقيقتان' : n <= 10 ? `${ar(n)} دقائق` : `${ar(n)} دقيقة`;
export const pagesAr = (n) => n === 1 ? 'صفحة واحدة' : n === 2 ? 'صفحتان' : n >= 3 && n <= 10 ? `${ar(n)} صفحات` : `${arNum(n)} صفحة`;
