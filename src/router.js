// توجيه بسيط بالـ hash يعمل على GitHub Pages وبدون خادم
import { useEffect, useState } from 'react';
const parse = () => (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => { const f = () => { setR(parse()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}
export const go = (path) => { location.hash = path; };
export const back = (fallback = '/') => { if (history.length > 1) history.back(); else go(fallback); };
