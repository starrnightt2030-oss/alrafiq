// اتجاه القبلة: زاوية الدائرة العظمى من موقع المستخدم إلى الكعبة المشرفة، والمسافة بالكيلومتر
export const KAABA = { lat: 21.422487, lng: 39.826206 };
const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;

export function qiblaBearing(lat, lng) {
  const f1 = rad(lat), f2 = rad(KAABA.lat), dl = rad(KAABA.lng - lng);
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export function distanceKm(lat, lng) {
  const R = 6371, f1 = rad(lat), f2 = rad(KAABA.lat), df = f2 - f1, dl = rad(KAABA.lng - lng);
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const DIRS = ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'];
export const dirName = (b) => DIRS[Math.round(b / 45) % 8];

// قراءة البوصلة: iOS يعطي webkitCompassHeading، وأندرويد يعطي alpha مطلقًا في deviceorientationabsolute
export function watchHeading(cb) {
  let got = false;
  const screenAngle = () => (screen.orientation?.angle ?? window.orientation ?? 0);
  const onAbs = (e) => { if (e.alpha == null) return; got = true; cb((360 - e.alpha + screenAngle()) % 360); };
  const onRel = (e) => {
    if (typeof e.webkitCompassHeading === 'number') { got = true; cb((e.webkitCompassHeading + screenAngle()) % 360); }
    else if (e.absolute && e.alpha != null) onAbs(e);
  };
  addEventListener('deviceorientationabsolute', onAbs, true);
  addEventListener('deviceorientation', onRel, true);
  return { stop: () => { removeEventListener('deviceorientationabsolute', onAbs, true); removeEventListener('deviceorientation', onRel, true); }, got: () => got };
}

export const needsPermission = () => typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
export async function askCompass() {
  try { return (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch { return false; }
}
