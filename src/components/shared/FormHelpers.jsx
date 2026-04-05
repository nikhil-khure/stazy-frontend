import { useEffect, useMemo, useState } from 'react';
import { C } from '../../constants/theme';

export function PasswordRequirements({ password }) {
  const checks = useMemo(() => {
    const value = password || '';
    return [
      ['Minimum 8 characters', value.length >= 8],
      ['1 uppercase letter', /[A-Z]/.test(value)],
      ['1 number', /\d/.test(value)],
      ['1 special symbol', /[^A-Za-z0-9]/.test(value)],
    ];
  }, [password]);

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: '10px 12px', marginTop: -2, marginBottom: 12, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>Password Requirements</div>
      {checks.map(([label, passed]) => (
        <div key={label} style={{ fontSize: 12, color: passed ? C.success : C.textLight, marginBottom: 4 }}>
          {passed ? '✓' : '•'} {label}
        </div>
      ))}
    </div>
  );
}

export function FilePreviewList({ files, title = 'Selected Files' }) {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return undefined;
    }

    const nextPreviews = files.map(file => {
      const isVisual = file.type?.startsWith('image/') || file.type?.startsWith('video/');
      return {
        key: `${file.name}-${file.size}`,
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        type: file.type || 'file',
        url: isVisual ? URL.createObjectURL(file) : null,
      };
    });

    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach(item => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [files]);

  if (!previews.length) {
    return null;
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, padding: 14, marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {previews.map(item => (
          <div key={item.key} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, background: C.bg }}>
            {item.url && item.type.startsWith('image/') && (
              <img src={item.url} alt={item.name} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
            )}
            {item.url && item.type.startsWith('video/') && (
              <video src={item.url} controls style={{ width: '100%', maxHeight: 220, borderRadius: 8, marginBottom: 8 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.name}</div>
            <div style={{ fontSize: 12, color: C.textLight }}>{item.size}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: C.textLight }}>Review the preview above before you submit.</div>
    </div>
  );
}
