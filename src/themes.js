// الثيمات الخمسة — كل قيمة تُطبّق كمتغيّر CSS على العنصر الجذري
export const THEMES = {
  emerald: { name: 'زمرّد', dark: true, bg: '#0A231E', surf: '#12352D', surf2: '#1C473C', acc: '#D9B55A', acc2: '#F0D894', text: '#F5F0E1', muted: '#A9C2B7', line: 'rgba(217,181,90,0.22)', onAcc: '#1B1405', pat: 'rgba(217,181,90,0.14)', hero: '#0F4A3D', heroText: '#F8F1DD', nav: 'rgba(15,46,39,0.92)', page: '#FBF6E9', pageText: '#1E1A12', pageFrame: '#B8913A' },
  night:   { name: 'ليل المدينة', dark: true, bg: '#0B1426', surf: '#132039', surf2: '#1E2E50', acc: '#E6C27A', acc2: '#F6DFA8', text: '#EEF2FA', muted: '#A7B4CC', line: 'rgba(230,194,122,0.22)', onAcc: '#1A1406', pat: 'rgba(230,194,122,0.13)', hero: '#1F3766', heroText: '#F4F6FB', nav: 'rgba(16,27,49,0.92)', page: '#F8F4EA', pageText: '#1A1712', pageFrame: '#B08B45' },
  sand:    { name: 'رمال', dark: false, bg: '#F5EEDF', surf: '#FFFBF2', surf2: '#EFE3CB', acc: '#8E5320', acc2: '#2F6B4F', text: '#2A2016', muted: '#6B5A46', line: 'rgba(142,83,32,0.18)', onAcc: '#FFF8EC', pat: 'rgba(142,83,32,0.12)', hero: '#2F6B4F', heroText: '#FFF8EC', nav: 'rgba(255,251,242,0.94)', page: '#FFFBF0', pageText: '#1E1A12', pageFrame: '#A8793A' },
  turquoise: { name: 'فيروز', dark: false, bg: '#EAF5F3', surf: '#FFFFFF', surf2: '#D5EBE6', acc: '#0F6E66', acc2: '#B7822A', text: '#10302C', muted: '#4A6762', line: 'rgba(15,110,102,0.16)', onAcc: '#FFFFFF', pat: 'rgba(15,110,102,0.1)', hero: '#0F6E66', heroText: '#FFFFFF', nav: 'rgba(255,255,255,0.94)', page: '#FFFDF6', pageText: '#14201E', pageFrame: '#2E8A80' },
  maroon:  { name: 'عنّاب', dark: true, bg: '#220D12', surf: '#33151C', surf2: '#47202A', acc: '#E3AE78', acc2: '#F5D3AE', text: '#F8ECE6', muted: '#C9AEAA', line: 'rgba(227,174,120,0.22)', onAcc: '#2A120B', pat: 'rgba(227,174,120,0.13)', hero: '#5C2433', heroText: '#FBEFE8', nav: 'rgba(43,17,23,0.92)', page: '#FBF3EA', pageText: '#21160F', pageFrame: '#B07A4E' },
};
export const THEME_ORDER = ['emerald', 'night', 'sand', 'turquoise', 'maroon'];

export function applyTheme(id) {
  const t = THEMES[id] || THEMES.emerald;
  const r = document.documentElement;
  for (const [k, v] of Object.entries(t)) if (typeof v === 'string') r.style.setProperty('--' + k, v);
  r.style.colorScheme = t.dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.bg);
}
