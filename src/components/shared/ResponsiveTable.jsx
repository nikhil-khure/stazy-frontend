import { useState, useEffect } from 'react';
import { C } from '../../constants/theme';

export function ResponsiveTableWrap({ headers, children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflowX: 'auto', width: '100%' }}>
      <table style={{ minWidth: isMobile ? 320 : 600, width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {headers.map(header => (
              <th key={header} style={{ padding: isMobile ? '8px 10px' : '11px 14px', textAlign: 'left', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap', fontSize: isMobile ? 11 : 13 }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children }) {
  return <tr style={{ borderTop: `1px solid ${C.border}` }}>{children}</tr>;
}

export function TD({ children, style = {} }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <td style={{ padding: isMobile ? '10px 10px' : '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: isMobile ? 11 : 13, ...style }}>{children}</td>;
}
