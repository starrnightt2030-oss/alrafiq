import { HandHeart, ShieldCheck, Headphones, Trophy, ChartColumn } from 'lucide-react';
import { TopBar } from '../components/ui.jsx';
const INFO = {
  duas: { t: 'الأدعية', d: 'أدعية القرآن الكريم كاملة مصنّفة: تفريج الكرب، الرزق، المغفرة، الشفاء، الذرية — ومتى يُقال كل دعاء.', I: HandHeart },
  ruqyah: { t: 'الرقية الشرعية', d: 'الرقية من القرآن والسنة، تُقرأ جزءًا جزءًا مع عدّاد التكرار.', I: ShieldCheck },
  stories: { t: 'القصص والسيرة', d: 'السيرة النبوية كاملة، والغزوات، وقصص الصحابة والأنبياء، مع حفظ موضع القراءة ثم النسخة المسموعة.', I: Headphones },
  challenges: { t: 'التحديات', d: 'تحديات يومية وأسبوعية تعينك على الطاعة، ولكل تحدٍّ جزاؤه بالدليل وأوسمة ونقاط.', I: Trophy },
  report: { t: 'التقييم', d: 'تقييم أسبوعي وشهري للصلاة والأذكار والورد ليعرف المسلم مستواه.', I: ChartColumn },
};
export default function Soon({ id }) {
  const x = INFO[id] || INFO.duas; const I = x.I;
  return (
    <div className="screen">
      <TopBar title={x.t} />
      <div className="card hl col center" style={{ alignItems: 'center', gap: 12, padding: 28 }}>
        <span className="tile" style={{ border: 0, background: 'transparent' }}><span className="ic" style={{ width: 64, height: 64, borderRadius: 20 }}><I size={30} aria-hidden="true" /></span></span>
        <div className="h2">قريبًا بإذن الله</div>
        <div className="small muted" style={{ lineHeight: 1.9 }}>{x.d}</div>
        <a className="btn" href="#/">العودة للرئيسية</a>
      </div>
    </div>
  );
}
