import { useState, useEffect } from 'react';
import { C } from '../../constants/theme';

export default function Popup({ title, onClose, children, width = 520 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 16
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: isMobile ? 12 : 14, width: '100%', maxWidth: isMobile ? '100%' : width,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '14px 16px' : '18px 24px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 800, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: '50%', width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, cursor: 'pointer', fontSize: isMobile ? 14 : 16, color: C.textLight, fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: isMobile ? '16px 16px' : '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}
