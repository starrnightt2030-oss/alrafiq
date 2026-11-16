import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useStore } from './store.js';
import { applyTheme } from './themes.js';
import { useRoute } from './router.js';
import { sound } from './lib/sound.js';
import { scheduleReminders } from './lib/notify.js';
import Splash from './components/Splash.jsx';
import BottomNav from './components/BottomNav.jsx';
import { ToastHost } from './components/ui.jsx';
import Home from './screens/Home.jsx';
import AzkarIndex from './screens/AzkarIndex.jsx';
import AzkarReader from './screens/AzkarReader.jsx';
import Wird from './screens/Wird.jsx';
import QuranIndex from './screens/QuranIndex.jsx';
import MushafReader from './screens/MushafReader.jsx';
import Prayer from './screens/Prayer.jsx';
import Settings from './screens/Settings.jsx';
import Soon from './screens/Soon.jsx';
import Duas from './screens/Duas.jsx';
import Report from './screens/Report.jsx';
import Challenges from './screens/Challenges.jsx';
import { StoriesHome, StoryList } from './screens/Stories.jsx';
import StoryReader from './screens/StoryReader.jsx';
import { AZKAR } from './data/azkar.js';
import { RUQYAH } from './data/ruqyah.js';

function Screen({ route }) {
  const [a, b] = route;
  switch (a) {
    case undefined: return <Home />;
    case 'azkar': return b ? <AzkarReader key={b} set={AZKAR[b]} /> : <AzkarIndex />;
    case 'ruqyah': return <AzkarReader key="ruqyah" set={RUQYAH} fallback="/azkar" />;
    case 'duas': return <Duas />;
    case 'report': return <Report />;
    case 'challenges': return <Challenges />;
    case 'stories': return b ? <StoryList col={b} /> : <StoriesHome />;
    case 'story': return <StoryReader key={b} id={b} />;
    case 'wird': return <Wird />;
    case 'quran': return b ? <MushafReader key="m" page={+b} /> : <QuranIndex />;
    case 'prayer': return <Prayer />;
    case 'settings': return <Settings />;
    case 'soon': return <Soon id={b} />;
    default: return <Home />;
  }
}

const FULL = (r) => (r[0] === 'azkar' && r[1]) || ['wird', 'ruqyah', 'duas', 'report', 'challenges', 'stories', 'story'].includes(r[0]) || (r[0] === 'quran' && r[1]);

export default function App() {
  const theme = useStore((s) => s.settings.theme);
  const intro = useStore((s) => s.settings.intro);
  const route = useRoute();
  const [splash, setSplash] = useState(() => intro && !sessionStorageGet('rf-intro'));

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    useStore.getState().ensureFirstDay();
    scheduleReminders();
    const unlock = () => { sound.unlock(); removeEventListener('pointerdown', unlock); };
    addEventListener('pointerdown', unlock);
    return () => removeEventListener('pointerdown', unlock);
  }, []);

  const done = () => { setSplash(false); sessionStorageSet('rf-intro', '1'); };

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Screen route={route} />
        {!FULL(route) && <BottomNav route={route} />}
        <ToastHost />
      </div>
      <AnimatePresence>{splash && <Splash onDone={done} />}</AnimatePresence>
    </MotionConfig>
  );
}

function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch {} }
