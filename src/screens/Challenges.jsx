import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2, Play, RotateCcw, Award } from 'lucide-react';
import { useStore } from '../store.js';
import { CHALLENGES, challengeState } from '../data/challenges.js';
import { ar, arNum } from '../lib/arabic.js';
import { sound } from '../lib/sound.js';
import { vibrate } from '../lib/haptics.js';
import { TopBar, Ring, toast } from '../components/ui.jsx';
import { notify } from '../lib/companion.js';

// يراقب التحدي الحالي ويكافئ المستخدم تلقائيًّا عند إتمامه (يُستدعى من الرئيسية وشاشة التحديات)
export function useChallengeWatcher() {
  const s = useStore();
  const st = challengeState(s.challenge, s);
  const fired = useRef(null);
  useEffect(() => {
    if (st.done && st.c && fired.current !== st.c.id) {
      fired.current = st.c.id;
      s.completeChallenge(st.c.id, st.c.points);
      sound.complete(); vibrate([40, 60, 40, 60, 90]);
      notify({ key: 'chdone-' + st.c.id, icon: 'trophy', tone: 'celebrate', title: 'ما شاء الله! تحدٍّ جديد اكتمل', body: `أتممت «${st.c.title}» وكسبت وسام «${st.c.badge}» و${arNum(st.c.points)} نقطة. التحدي اللي بعده اتفتح!`, cta: { label: 'التحدي التالي', href: '#/challenges' } });
    }
  }, [st.done, st.c?.id]); // eslint-disable-line
  return st;
}

export default function Challenges() {
  const { challenge, points, startChallenge } = useStore();
  const st = useChallengeWatcher();
  const doneIds = challenge.done.map((x) => x.id);

  return (
    <div className="screen no-nav">
      <TopBar title="رحلة التحديات" right={<span className="row xs accent" style={{ padding: '8px 12px', borderRadius: 999, background: 'var(--surf)', border: '1px solid var(--line)', fontWeight: 600 }}>{arNum(points)} نقطة</span>} />

      {st.all ? (
        <div className="card hl col center" style={{ alignItems: 'center', gap: 10, padding: 26 }}>
          <Trophy size={44} className="accent" aria-hidden="true" />
          <div style={{ fontSize: 20, fontWeight: 700 }}>أتممت كل التحديات</div>
          <div className="small muted">بارك الله فيك وتقبّل منك. تحديات جديدة في التحديثات القادمة بإذن الله.</div>
        </div>
      ) : (
        <motion.section key={st.c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', borderRadius: 28, padding: 20, background: 'var(--hero)', color: 'var(--heroText)', overflow: 'hidden' }}>
          <svg aria-hidden="true" width="200" height="200" viewBox="0 0 100 100" style={{ position: 'absolute', left: -50, bottom: -60, opacity: .14 }}><path d="M50 4l11 23 25-4-14 21 14 21-25-4-11 23-11-23-25 4 14-21L14 23l25 4z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          <div className="row" style={{ gap: 14, position: 'relative' }}>
            <Ring size={92} value={st.pct} label={`التقدّم ${st.value} من ${st.c.target}`}>
              <span className="num" style={{ fontSize: st.c.target >= 1000 ? 17 : 22, color: 'var(--heroText)' }}>{arNum(st.value)}</span>
              <span className="xs" style={{ opacity: .8 }}>من {arNum(st.c.target)}</span>
            </Ring>
            <div className="col" style={{ gap: 4 }}>
              <span className="xs" style={{ opacity: .85, fontWeight: 600 }}>التحدي {ar(challenge.i + 1)} من {ar(CHALLENGES.length)}</span>
              <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45 }}>{st.c.title}</span>
              <span className="xs" style={{ opacity: .85, lineHeight: 1.7 }}>{ar(st.c.how)}</span>
            </div>
          </div>
          <div style={{ position: 'relative', marginTop: 14, padding: 14, borderRadius: 18, background: 'rgba(0,0,0,.18)' }}>
            <div className="xs" style={{ fontWeight: 600, marginBottom: 6, opacity: .9 }}>ما ستُجزى به بإذن الله</div>
            <div className="amiri" style={{ fontSize: 17, lineHeight: 1.9 }}>{st.c.reward}</div>
            <div className="xs" style={{ opacity: .8 }}>{st.c.src}</div>
            <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span className="xs" style={{ padding: '5px 10px', borderRadius: 999, background: 'var(--acc)', color: 'var(--onAcc)', fontWeight: 600 }}>وسام «{st.c.badge}»</span>
              <span className="xs" style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,.14)' }}>+{arNum(st.c.points)} نقطة</span>
              <span className="xs" style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,.14)' }}>يفتح التحدي التالي</span>
            </div>
          </div>
          <div className="row" style={{ position: 'relative', gap: 10, marginTop: 14 }}>
            {!st.started ? (
              <button className="btn" style={{ flex: 1 }} onClick={() => { startChallenge(); sound.next(); toast('بدأ التحدي — أعانك الله'); }}><Play size={18} />ابدأ التحدي الآن</button>
            ) : st.expired ? (
              <button className="btn" style={{ flex: 1 }} onClick={() => { startChallenge(); toast('أعدت بدء التحدي — لا تيأس'); }}><RotateCcw size={18} />انتهت المدة — أعد المحاولة</button>
            ) : (
              <a className="btn" style={{ flex: 1 }} href={st.c.link}>أكمل التحدي</a>
            )}
          </div>
        </motion.section>
      )}

      <h2 className="h2">المسار</h2>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 28 }}>
        <div aria-hidden="true" style={{ position: 'absolute', right: 10, top: 12, bottom: 12, width: 2, background: 'repeating-linear-gradient(to bottom, var(--line) 0 6px, transparent 6px 12px)' }} />
        {CHALLENGES.map((c, i) => {
          const isDone = doneIds.includes(c.id); const now = i === challenge.i; const locked = !isDone && !now;
          return (
            <div key={c.id} className="card" style={{ position: 'relative', padding: 14, borderColor: now ? 'var(--acc)' : 'var(--line)', opacity: locked ? .7 : 1 }}>
              <span aria-hidden="true" style={{ position: 'absolute', right: -28, top: 16, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'var(--acc)' : now ? 'var(--surf)' : 'var(--surf2)', border: '2px solid ' + (now || isDone ? 'var(--acc)' : 'var(--line)'), color: 'var(--onAcc)' }}>
                {isDone && <CheckCircle2 size={14} />}
              </span>
              <div className="between" style={{ gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{c.title}</span>
                <span className="xs row" style={{ flex: 'none', gap: 4, padding: '4px 9px', borderRadius: 999, background: isDone ? 'var(--acc)' : 'var(--surf2)', color: isDone ? 'var(--onAcc)' : 'var(--muted)' }}>
                  {isDone ? <><Award size={12} aria-hidden="true" />{c.badge}</> : now ? 'الحالي' : <><Lock size={12} aria-hidden="true" />مقفل</>}
                </span>
              </div>
              <div className="xs muted" style={{ marginTop: 6, lineHeight: 1.7 }}>{c.reward.length > 90 ? c.reward.slice(0, 90) + '…' : c.reward} — {c.src}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
