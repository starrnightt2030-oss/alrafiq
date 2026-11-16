import { House, BookOpen, Moon, Settings, BookMarked } from 'lucide-react';
const ITEMS = [
  { to: '/', key: '', label: 'الرئيسية', Icon: House },
  { to: '/azkar', key: 'azkar', label: 'الأذكار', Icon: BookOpen },
  { to: '/quran', key: 'quran', label: 'المصحف', Icon: BookMarked },
  { to: '/prayer', key: 'prayer', label: 'الصلاة', Icon: Moon },
  { to: '/settings', key: 'settings', label: 'الإعدادات', Icon: Settings },
];
export default function BottomNav({ route }) {
  const cur = route[0] || '';
  return (
    <nav className="nav" aria-label="التنقل الرئيسي">
      {ITEMS.map(({ to, key, label, Icon }) => (
        <a key={key} href={'#' + to} className={cur === key ? 'on' : ''} aria-current={cur === key ? 'page' : undefined}>
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
