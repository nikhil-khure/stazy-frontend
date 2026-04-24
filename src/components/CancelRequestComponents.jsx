import { useState } from 'react';
import { C, BTN } from '../constants/theme';
import Popup from './shared/Popup';

/**
 * Cancel Request Components
 * Solves Requirement 27: View reason popup, reject with message, proper status display
 */

/**
 * View Reason Popup
 */
export function ViewReasonPopup({ title, reason, onClose }) {
  return (
    <Popup title={title || "Cancel Reason"} onClose={onClose} width={600}>
      <div style={{
        background: C.bg,
        borderRadius: 10,
        padding: 20,
        maxHeight: 300,
        overflowY: 'auto',
        lineHeight: 1.7,
        color: C.text,
        whiteSpace: 'pre-wrap',
      }}>
        {reason || 'No reason provided'}
      </div>
    </Popup>
  );
}

/**
 * Reject Cancel Request Popup
 * Requirement 27: Owner enters rejection message
 */
export function RejectCancelRequestPopup({ request, onReject, onClose, loading }) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    onReject(message.trim());
  };

  return (
    <Popup title="Reject Cancel Request" onClose={onClose} width={550}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Student: {request.studentDisplayName}
        </div>
        <div style={{ fontSize: 13, color: C.textLight }}>
          Room: {request.listingTitle} ({request.roomCode})
        </div>
      </div>

      <div style={{
        background: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>
          Student's Reason:
        </div>
        <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
          {request.reason || 'No reason provided'}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
          Rejection Message (Required)
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Explain why you are rejecting this cancel request..."
          style={{
            width: '100%',
            minHeight: 100,
            padding: '10px 12px',
            border: `2px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: C.text,
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
          This message will be shown to the student
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          style={{ ...BTN.primary, flex: 1, padding: 12, background: C.danger }}
        >
          {loading ? 'Rejecting...' : 'Reject Request'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ ...BTN.outline, padding: '12px 24px' }}
        >
          Cancel
        </button>
      </div>
    </Popup>
  );
}

/**
 * Cancel Request Status Badge
 */
export function CancelRequestStatusBadge({ status }) {
  const statusConfig = {
    UNDER_PROGRESS: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
    ACCEPTED: { label: 'Accepted', color: '#10B981', bg: '#D1FAE5' },
    REJECTED: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2' },
  };

  const config = statusConfig[status] || statusConfig.UNDER_PROGRESS;

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      color: config.color,
      background: config.bg,
    }}>
      {config.label}
    </span>
  );
}

/**
 * Cancel Request Table for Owner
 * Requirement 27: View reason button, accept/reject with proper flow
 * Fix #10: Added Payment History column and button
 */
export function OwnerCancelRequestTable({ requests, onViewReason, onAccept, onReject, onViewPaymentHistory, loading }) {
  if (!requests || requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
        No cancel requests
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Student
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Room
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Reason
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Payment History
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Requested On
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.filter(r => r.status === 'UNDER_PROGRESS').map(request => (
            <tr key={request.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '12px 8px', fontSize: 13, color: C.text }}>
                <div style={{ fontWeight: 700 }}>{request.studentName || request.studentDisplayName}</div>
                <div style={{ fontSize: 11, color: C.textLight }}>{request.studentUserCode}</div>
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13, color: C.text }}>
                {request.listingTitle}
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13 }}>
                <button
                  onClick={() => onViewReason(request)}
                  style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.primary }}
                >
                  View Reason
                </button>
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13 }}>
                <button
                  onClick={() => onViewPaymentHistory(request)}
                  style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.secondary }}
                >
                  View Payment History
                </button>
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13, color: C.textLight }}>
                {formatDate(request.requestedAt)}
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onAccept(request.id)}
                    disabled={loading}
                    style={{ ...BTN.primary, fontSize: 12, padding: '6px 14px' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(request)}
                    disabled={loading}
                    style={{ ...BTN.outline, fontSize: 12, padding: '6px 14px', color: C.danger, borderColor: C.danger }}
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Cancel Request Table for Student
 * Requirement 27: Show status and owner's rejection message
 */
export function StudentCancelRequestTable({ requests, onViewOwnerMessage }) {
  if (!requests || requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
        No cancel requests
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Room
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Your Reason
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Status
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Owner Response
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Requested On
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '12px 8px', fontSize: 13, color: C.text }}>
                {request.listingTitle}
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13, color: C.textLight, maxWidth: 200 }}>
                {request.reason?.substring(0, 50)}{request.reason?.length > 50 ? '...' : ''}
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13 }}>
                <CancelRequestStatusBadge status={request.status} />
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13 }}>
                {request.ownerReason ? (
                  <button
                    onClick={() => onViewOwnerMessage(request.ownerReason)}
                    style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.primary }}
                  >
                    View
                  </button>
                ) : (
                  <span style={{ color: C.textLight, fontSize: 12 }}>-</span>
                )}
              </td>
              <td style={{ padding: '12px 8px', fontSize: 13, color: C.textLight }}>
                {formatDate(request.requestedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper function
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
