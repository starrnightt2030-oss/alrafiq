// رسومات الأقسام: لوحات SVG بطبقات وتدرّجات ذهبية وبيضاء، تُرسم فوق خلفية كل مربع
const P = Math.PI;

function Defs({ p }) {
  return (
    <defs>
      <linearGradient id={p + 'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0BE" /><stop offset=".55" stopColor="#E8BE5C" /><stop offset="1" stopColor="#B07F22" /></linearGradient>
      <linearGradient id={p + 'w'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#FFFFFF" stopOpacity=".72" /></linearGradient>
      <radialGradient id={p + 'r'}><stop offset="0" stopColor="#FFF6D8" stopOpacity=".9" /><stop offset="1" stopColor="#FFF6D8" stopOpacity="0" /></radialGradient>
    </defs>
  );
}
const Spark = ({ x, y, s = 6, f }) => <path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={f} />;

const ART = {
  azkar: (p) => {
    const beads = [...Array(11)].map((_, i) => { const a = P * (0.15 + i * 0.07); return [60 + Math.cos(a) * 44, 40 + Math.sin(a) * 44]; });
    return (<>
      <circle cx="66" cy="44" r="34" fill={`url(#${p}r)`} />
      <path d="M78 18a28 28 0 1 0 0 52a24 24 0 1 1 0-52z" fill={`url(#${p}g)`} />
      <Spark x={86} y={30} s={7} f="#fff" /><Spark x={96} y={50} s={4} f="#FFF0BE" />
      {beads.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 5 ? 6.5 : 5} fill={i === 5 ? `url(#${p}g)` : `url(#${p}w)`} />)}
    </>);
  },
  quran: (p) => (<>
    <circle cx="60" cy="52" r="46" fill={`url(#${p}r)`} />
    {[-50, -25, 0, 25, 50].map((a) => <rect key={a} x="58.5" y="4" width="3" height="18" rx="1.5" fill="#FFF0BE" opacity=".7" transform={`rotate(${a} 60 50)`} />)}
    <path d="M28 104L92 64M92 104L28 64" stroke={`url(#${p}g)`} strokeWidth="6" strokeLinecap="round" />
    <path d="M60 46Q42 35 18 42V84Q42 77 60 88Z" fill={`url(#${p}w)`} />
    <path d="M60 46Q78 35 102 42V84Q78 77 60 88Z" fill="#fff" opacity=".88" />
    <path d="M60 46V88" stroke={`url(#${p}g)`} strokeWidth="2.5" />
    {[52, 60, 68].map((y) => <g key={y} stroke="#7A8BB8" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round"><path d={`M27 ${y}Q42 ${y - 5} 53 ${y + 3}`} /><path d={`M93 ${y}Q78 ${y - 5} 67 ${y + 3}`} /></g>)}
  </>),
  wird: (p) => {
    const n = 18; const beads = [...Array(n)].map((_, i) => { const a = P / 2 + (i / n) * P * 2; return [60 + Math.cos(a) * 34, 50 + Math.sin(a) * 32]; });
    return (<>
      <circle cx="60" cy="50" r="40" fill={`url(#${p}r)`} />
      {beads.map(([x, y], i) => i === 0 ? null : <circle key={i} cx={x} cy={y} r="6" fill={i % 6 === 0 ? `url(#${p}g)` : `url(#${p}w)`} />)}
      <path d="M60 82v10" stroke={`url(#${p}g)`} strokeWidth="3" />
      <rect x="53" y="76" width="14" height="10" rx="5" fill={`url(#${p}g)`} />
      <path d="M56 94l-4 18M60 94v20M64 94l4 18" stroke="#FFF0BE" strokeWidth="2.5" strokeLinecap="round" />
    </>);
  },
  hifz: (p) => (<>
    <circle cx="56" cy="56" r="42" fill={`url(#${p}r)`} />
    <rect x="26" y="26" width="58" height="72" rx="8" fill={`url(#${p}w)`} transform="rotate(-8 55 62)" />
    <rect x="26" y="26" width="12" height="72" rx="6" fill={`url(#${p}g)`} transform="rotate(-8 55 62)" />
    <path d="M54 30l-10 2 4 30 5-6 6 4z" fill="#E58C7A" transform="rotate(-8 55 62)" />
    <path d="M52 50l12-2M50 60l18-3M52 70l16-3" stroke="#000" strokeOpacity=".15" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="86" cy="80" r="17" fill={`url(#${p}g)`} stroke="#fff" strokeWidth="3" />
    <path d="M78 80l6 6 10-11" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </>),
  duas: (p) => {
    const hand = 'M60 102C44 102 33 92 30 76L26 48C25 43 32 41 34 46L39 64L37 38C37 32 45 32 45 38L47 62L49 34C49 28 57 28 57 34L57 62L59 42C59 36 66 37 66 43L64 76C63 90 61 98 60 102Z';
    return (<>
      <circle cx="60" cy="40" r="38" fill={`url(#${p}r)`} />
      {[-40, -20, 0, 20, 40].map((a) => <rect key={a} x="58.5" y="2" width="3" height="16" rx="1.5" fill="#FFF0BE" opacity=".75" transform={`rotate(${a} 60 46)`} />)}
      <g transform="translate(-6 4)"><path d={hand} fill={`url(#${p}w)`} /></g>
      <g transform="translate(126 4) scale(-1 1)"><path d={hand} fill="#fff" opacity=".9" /></g>
      <Spark x={60} y={22} s={8} f={`url(#${p}g)`} />
    </>);
  },
  ruqyah: (p) => (<>
    <circle cx="60" cy="58" r="44" fill={`url(#${p}r)`} />
    <path d="M60 14L96 28V58C96 82 80 98 60 106C40 98 24 82 24 58V28Z" fill={`url(#${p}w)`} />
    <path d="M60 24L87 35V58C87 76 75 89 60 96C45 89 33 76 33 58V35Z" fill="none" stroke={`url(#${p}g)`} strokeWidth="3" />
    <path d="M66 44a17 17 0 1 0 0 30a13 13 0 1 1 0-30z" fill={`url(#${p}g)`} />
    <Spark x={71} y={58} s={5} f={`url(#${p}g)`} />
  </>),
  stories: (p) => (<>
    <circle cx="60" cy="62" r="46" fill={`url(#${p}r)`} />
    <path d="M60 4v10" stroke={`url(#${p}g)`} strokeWidth="2.5" />
    <circle cx="60" cy="16" r="5" fill="none" stroke={`url(#${p}g)`} strokeWidth="3" />
    <path d="M40 34L60 20L80 34Z" fill={`url(#${p}g)`} />
    <path d="M38 36H82L88 52L80 88H40L32 52Z" fill="#FFD879" opacity=".35" />
    <path d="M38 36H82L88 52L80 88H40L32 52Z M60 36V88 M32 52H88" fill="none" stroke={`url(#${p}g)`} strokeWidth="3.5" strokeLinejoin="round" />
    <ellipse cx="60" cy="64" rx="9" ry="14" fill="#FFF6D8" />
    <path d="M38 90H82L76 100H44Z" fill={`url(#${p}g)`} />
    <Spark x={96} y={30} s={5} f="#fff" /><Spark x={22} y={70} s={4} f="#FFF0BE" />
  </>),
  challenges: (p) => (<>
    <circle cx="60" cy="66" r="44" fill={`url(#${p}r)`} />
    <path d="M40 8H58L66 44H48Z" fill="#fff" opacity=".85" /><path d="M80 8H62L54 44H72Z" fill="#fff" opacity=".6" />
    <circle cx="60" cy="72" r="32" fill={`url(#${p}g)`} />
    <circle cx="60" cy="72" r="25" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeDasharray="3 4" />
    <path d="M60 52C66 60 74 64 72 76C71 85 64 90 60 90C53 90 47 85 47 77C47 70 52 67 54 62C56 68 58 70 60 70C61 64 58 58 60 52Z" fill="#fff" />
  </>),
  report: (p) => (<>
    <circle cx="62" cy="60" r="46" fill={`url(#${p}r)`} />
    {[[22, 70, 30], [42, 56, 44], [62, 42, 58], [82, 26, 74]].map(([x, y, h], i) => <rect key={i} x={x} y={y} width="16" height={100 - y} rx="5" fill={i === 3 ? `url(#${p}g)` : `url(#${p}w)`} opacity={i === 3 ? 1 : 0.6 + i * 0.12} />)}
    <path d="M18 64L46 44L64 52L96 16" fill="none" stroke="#FFF0BE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M84 14H98V28" fill="none" stroke="#FFF0BE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </>),
  qibla: (p) => (<>
    <circle cx="60" cy="60" r="50" fill={`url(#${p}r)`} />
    <circle cx="60" cy="60" r="46" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeDasharray="2 6" />
    <path d="M60 8l5 10h-10z" fill={`url(#${p}g)`} />
    <path d="M60 30L90 44L60 58L30 44Z" fill="#3a3a3a" />
    <path d="M30 44L60 58V96L30 82Z" fill="#141414" />
    <path d="M90 44L60 58V96L90 82Z" fill="#232323" />
    <path d="M30 52L60 66L90 52" fill="none" stroke={`url(#${p}g)`} strokeWidth="4" />
    <path d="M70 72L80 67V86L70 91Z" fill={`url(#${p}g)`} />
  </>),
  quiz: (p) => (<>
    <circle cx="60" cy="52" r="48" fill={`url(#${p}r)`} />
    <path d="M36 18H84V40C84 56 74 66 60 68C46 66 36 56 36 40Z" fill={`url(#${p}g)`} />
    <path d="M36 26H24C24 42 30 50 40 52M84 26H96C96 42 90 50 80 52" fill="none" stroke={`url(#${p}g)`} strokeWidth="5" strokeLinecap="round" />
    <path d="M54 66H66V82H54Z" fill={`url(#${p}g)`} />
    <rect x="40" y="82" width="40" height="12" rx="4" fill={`url(#${p}g)`} />
    <rect x="34" y="94" width="52" height="8" rx="4" fill="#fff" opacity=".9" />
    <path d="M60 30l3.5 7 7.5 1-5.5 5 1.4 7.5L60 47l-6.9 3.5 1.4-7.5-5.5-5 7.5-1z" fill="#fff" />
    <Spark x={18} y={70} s={6} f="#fff" /><Spark x={104} y={66} s={5} f="#FFF0BE" /><Spark x={100} y={12} s={4} f="#fff" />
  </>),
  badges: (p) => (<>
    <circle cx="60" cy="58" r="48" fill={`url(#${p}r)`} />
    <path d="M40 6h16l10 32H50z" fill="#fff" opacity=".85" /><path d="M80 6H64L54 38h16z" fill="#fff" opacity=".7" />
    <circle cx="60" cy="72" r="34" fill={`url(#${p}g)`} />
    {[...Array(12)].map((_, i) => { const a = (i / 12) * P * 2; return <circle key={i} cx={60 + Math.cos(a) * 34} cy={72 + Math.sin(a) * 34} r="3.4" fill={`url(#${p}g)`} />; })}
    <circle cx="60" cy="72" r="26" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeDasharray="3 3" />
    <path d="M60 56l5 10 11 1.6-8 7.8 2 11L60 81l-10 5.4 2-11-8-7.8 11-1.6z" fill="#fff" />
    <Spark x={100} y={30} s={6} f="#fff" /><Spark x={18} y={52} s={5} f="#FFF0BE" />
  </>),
  rufaqa: (p) => (<>
    <circle cx="60" cy="56" r="48" fill={`url(#${p}r)`} />
    <path d="M60 26c-6-10-24-8-24 6 0 10 14 18 24 26 10-8 24-16 24-26 0-14-18-16-24-6z" fill={`url(#${p}g)`} />
    <circle cx="34" cy="66" r="11" fill="#fff" opacity=".88" /><path d="M14 104c0-14 9-24 20-24s20 10 20 24z" fill="#fff" opacity=".88" />
    <circle cx="86" cy="66" r="11" fill="#fff" opacity=".88" /><path d="M66 104c0-14 9-24 20-24s20 10 20 24z" fill="#fff" opacity=".88" />
    <circle cx="60" cy="74" r="13" fill={`url(#${p}w)`} /><path d="M36 112c0-16 10-27 24-27s24 11 24 27z" fill={`url(#${p}w)`} />
    <Spark x={98} y={22} s={6} f="#fff" /><Spark x={20} y={28} s={5} f="#FFF0BE" /><Spark x={60} y={8} s={3.5} f="#fff" />
  </>),
  fasting: (p) => (<>
    <circle cx="60" cy="52" r="46" fill={`url(#${p}r)`} />
    <path d="M70 12a30 30 0 1 0 0 56a24 24 0 1 1 0-56z" fill={`url(#${p}g)`} />
    <Spark x={86} y={26} s={6} f="#fff" /><Spark x={40} y={16} s={4} f="#FFF0BE" />
    <path d="M22 84h76c-3 14-18 24-38 24S25 98 22 84z" fill={`url(#${p}w)`} />
    {[[40, 80], [52, 76], [64, 77], [76, 80], [58, 84]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="5.5" fill={i % 2 ? '#8B4A1C' : '#A65A24'} transform={`rotate(${i * 25 - 40} ${x} ${y})`} />)}
    <path d="M30 96h60" stroke={`url(#${p}g)`} strokeWidth="2.5" />
  </>),
  asmaa: (p) => (<>
    <circle cx="60" cy="56" r="46" fill={`url(#${p}r)`} />
    <circle cx="60" cy="58" r="38" fill="none" stroke={`url(#${p}g)`} strokeWidth="4" />
    <circle cx="60" cy="58" r="30" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 4" opacity=".8" />
    <text x="60" y="72" textAnchor="middle" fontFamily="Amiri, serif" fontSize="34" fontWeight="700" fill={`url(#${p}w)`}>الله</text>
    <Spark x={98} y={18} s={6} f="#fff" /><Spark x={20} y={24} s={5} f="#FFF0BE" /><Spark x={100} y={98} s={4} f="#FFF0BE" />
  </>),
  nawawi: (p) => (<>
    <circle cx="60" cy="56" r="46" fill={`url(#${p}r)`} />
    <path d="M22 34Q40 26 58 34V96Q40 88 22 96Z" fill={`url(#${p}w)`} />
    <path d="M62 34Q80 26 98 34V96Q80 88 62 96Z" fill="#fff" opacity=".85" />
    {[48, 60, 72].map((y) => <path key={y} d={`M30 ${y}h20M70 ${y}h20`} stroke={`url(#${p}g)`} strokeWidth="3" strokeLinecap="round" />)}
    <path d="M60 30v70" stroke={`url(#${p}g)`} strokeWidth="3" />
    <text x="60" y="22" textAnchor="middle" fontFamily="Amiri, serif" fontSize="18" fontWeight="700" fill={`url(#${p}g)`}>٤٠</text>
  </>),
  zakat: (p) => (<>
    <circle cx="60" cy="56" r="46" fill={`url(#${p}r)`} />
    {[[40, 88], [60, 92], [80, 88]].map(([x, y], i) => [0, 1, 2, 3].map((k) => <ellipse key={i + '-' + k} cx={x} cy={y - k * 8} rx="16" ry="5" fill={k === 3 ? `url(#${p}g)` : '#E8BE5C'} stroke="#B07F22" strokeWidth="1" />))}
    <path d="M60 18c-10 0-18 8-18 18s8 18 18 18 18-8 18-18-8-18-18-18z" fill={`url(#${p}w)`} />
    <text x="60" y="44" textAnchor="middle" fontFamily="sans-serif" fontSize="16" fontWeight="800" fill="#B07F22">٪</text>
    <Spark x={98} y={24} s={6} f="#fff" /><Spark x={22} y={30} s={4} f="#FFF0BE" />
  </>),
  prayer: (p) => (<>
    <circle cx="60" cy="56" r="46" fill={`url(#${p}r)`} />
    <path d="M30 10a14 14 0 1 0 12 22a11 11 0 1 1 -12-22z" fill={`url(#${p}g)`} />
    <path d="M60 30C76 34 84 46 84 60H36C36 46 44 34 60 30Z" fill={`url(#${p}w)`} />
    <path d="M60 18v12" stroke={`url(#${p}g)`} strokeWidth="3" /><circle cx="60" cy="18" r="3.5" fill={`url(#${p}g)`} />
    <rect x="30" y="60" width="60" height="44" rx="3" fill="#fff" opacity=".9" />
    <path d="M52 104V82a8 8 0 0 1 16 0V104Z" fill={`url(#${p}g)`} />
    <rect x="92" y="34" width="10" height="70" rx="2" fill="#fff" opacity=".8" /><path d="M90 34L97 20L104 34Z" fill={`url(#${p}g)`} />
    <rect x="18" y="44" width="10" height="60" rx="2" fill="#fff" opacity=".8" /><path d="M16 44L23 30L30 44Z" fill={`url(#${p}g)`} />
  </>),
};

export default function TileArt({ id, size = 92, className = '' }) {
  const draw = ART[id]; if (!draw) return null;
  const p = 'ta-' + id;
  return <svg className={className} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true"><Defs p={p} />{draw(p)}</svg>;
}
