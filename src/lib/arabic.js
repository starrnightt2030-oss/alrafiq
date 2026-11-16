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
