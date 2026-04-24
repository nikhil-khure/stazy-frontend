import { C } from '../constants/theme';

export default function BlockedAccountBanner({ user }) {
  if (!user?.isBlocked) {
    return null;
  }

  const blockReason = user.blockReason || 'Your account has been blocked by the admin.';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #DC2626, #991B1B)',
      color: '#fff',
      padding: '16px 24px',
      borderBottom: '3px solid #7F1D1D',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 24 }}>🚫</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
            Account Blocked
          </div>
          <div style={{ fontSize: 14, opacity: 0.95 }}>
            {blockReason}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
            You can view your data but cannot perform any actions. Please contact support for assistance.
          </div>
        </div>
      </div>
    </div>
  );
}
