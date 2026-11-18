// لوح سفلي منزلق: المحتوى يتمرّر بحرية، والسحب للإغلاق من المقبض العلوي فقط
import { motion, useDragControls } from 'framer-motion';
import { useEffect } from 'react';

export default function Sheet({ onClose, children, label }) {
  const controls = useDragControls();
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return (
    <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .6 }} onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose(); }}>
        <div className="sheet-handle" onPointerDown={(e) => controls.start(e)} aria-hidden="true"><span className="sheet-grip" /></div>
        {children}
      </motion.div>
    </motion.div>
  );
}
