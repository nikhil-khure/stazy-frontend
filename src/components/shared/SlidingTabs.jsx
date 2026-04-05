import { useState } from 'react';
import { C } from '../../constants/theme';

export default function SlidingTabs({ tabs, children }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Sliding Tab Bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `2px solid ${C.border}` }}>
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              padding: '13px 20px', border: 'none', cursor: 'pointer', fontWeight: active === i ? 800 : 500,
              fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
              background: active === i ? C.primary : 'transparent',
              color: active === i ? '#fff' : C.textLight,
              borderBottom: active === i ? `3px solid ${C.primary}` : '3px solid transparent',
              marginBottom: -2,
            }}>
              {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Tab Content */}
      <div>{children[active]}</div>
    </div>
  );
}
