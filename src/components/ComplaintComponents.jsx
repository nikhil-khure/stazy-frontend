import { useState } from 'react';
import { C, BTN } from '../constants/theme';
import Popup from './shared/Popup';

/**
 * Complaint Components
 * Solves Requirements 20, 22, 23, 24, 25, 26: Complete complaint system UI
 */

/**
 * Evidence/Image Viewer Popup
 * Requirement 20: Evidence column with View button
 */
export function EvidenceViewerPopup({ attachments, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!attachments || attachments.length === 0) {
    return (
      <Popup title="Evidence" onClose={onClose} width={500}>
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          No evidence attached
        </div>
      </Popup>
    );
  }

  const current = attachments[currentIndex];
  const isVideo = current.mimeType?.startsWith('video/');

  return (
    <Popup title={`Evidence (${currentIndex + 1}/${attachments.length})`} onClose={onClose} width={700}>
      <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isVideo ? (
          <video
            src={current.url}
            controls
            style={{ maxWidth: '100%', maxHeight: 500 }}
          />
        ) : (
          <img
            src={current.url}
            alt="Evidence"
            style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }}
          />
        )}
      </div>
      {attachments.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            style={{ ...BTN.outline, padding: '8px 16px', opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(attachments.length - 1, prev + 1))}
            disabled={currentIndex === attachments.length - 1}
            style={{ ...BTN.outline, padding: '8px 16px', opacity: currentIndex === attachments.length - 1 ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </Popup>
  );
}

/**
 * Description Viewer Popup
 * Requirement 20: View Description button with popup
 */
export function DescriptionViewerPopup({ title, description, onClose }) {
  return (
    <Popup title={title || "Description"} onClose={onClose} width={600}>
      <div style={{
        background: C.bg,
        borderRadius: 10,
        padding: 20,
        maxHeight: 400,
        overflowY: 'auto',
        lineHeight: 1.7,
        color: C.text,
        whiteSpace: 'pre-wrap',
      }}>
        {description || 'No description provided'}
      </div>
    </Popup>
  );
}

/**
 * Complaint Status Badge
 * Requirements 23, 24, 26: Status display
 */
export function ComplaintStatusBadge({ status }) {
  const statusConfig = {
    OPEN: { label: 'Open', color: '#3B82F6', bg: '#EFF6FF' },
    UNDER_PROGRESS: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
    UNDER_PROGRESS_RE_COMPLAINT: { label: 'Under Progress (Re-Complaint)', color: '#DC2626', bg: '#FEE2E2' },
    RESOLVED: { label: 'Resolved', color: '#10B981', bg: '#D1FAE5' },
    CLOSED: { label: 'Closed', color: '#6B7280', bg: '#F3F4F6' },
    AWAITING_JUSTIFICATION: { label: 'Awaiting Response', color: '#8B5CF6', bg: '#EDE9FE' },
  };

  const config = statusConfig[status] || statusConfig.OPEN;

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
 * Complaint Table Row Component
 * Requirements 20, 23, 24, 25, 26: Complete table with all columns
 */
export function ComplaintTableRow({
  complaint,
  isOwner,
  onViewEvidence,
  onViewDescription,
  onViewJustification,
  onResolve,
  onReComplaint,
  onClose,
  actionLoading,
}) {
  const latestComplaintMessage = [...(complaint.messages || [])].reverse().find(m => m.messageType === 'COMPLAINT' || m.messageType === 'RE_COMPLAINT');
  const latestJustification = [...(complaint.messages || [])].reverse().find(m => m.messageType === 'JUSTIFICATION');
  const hasEvidence = latestComplaintMessage?.attachments?.length > 0;
  const hasJustificationEvidence = latestJustification?.attachments?.length > 0;
  const isClosed = complaint.status === 'CLOSED';
  
  // Use the latest complaint/re-complaint message text, fallback to original description
  const latestDescription = latestComplaintMessage?.message || complaint.description;

  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: '12px 8px', fontSize: 13, color: C.text }}>
        {complaint.title}
      </td>
      <td style={{ padding: '12px 8px', fontSize: 13 }}>
        <button
          onClick={() => onViewDescription(complaint.title, latestDescription)}
          style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.primary }}
        >
          View
        </button>
      </td>
      {isOwner && (
        <td style={{ padding: '12px 8px', fontSize: 13 }}>
          {hasEvidence ? (
            <button
              onClick={() => onViewEvidence(latestComplaintMessage.attachments)}
              style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.primary }}
            >
              View Evidence
            </button>
          ) : (
            <span style={{ color: C.textLight, fontSize: 12 }}>No evidence</span>
          )}
        </td>
      )}
      {!isOwner && (
        <td style={{ padding: '12px 8px', fontSize: 13 }}>
          {hasJustificationEvidence ? (
            <button
              onClick={() => onViewEvidence(latestJustification.attachments)}
              style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.primary }}
            >
              View
            </button>
          ) : (
            <span style={{ color: C.textLight, fontSize: 12 }}>-</span>
          )}
        </td>
      )}
      {!isOwner && (
        <td style={{ padding: '12px 8px', fontSize: 13 }}>
          {latestJustification ? (
            <button
              onClick={() => onViewJustification(latestJustification.message)}
              style={{ ...BTN.ghost, fontSize: 12, padding: '4px 12px', color: C.primary }}
            >
              View
            </button>
          ) : (
            <span style={{ color: C.textLight, fontSize: 12 }}>-</span>
          )}
        </td>
      )}
      <td style={{ padding: '12px 8px', fontSize: 13 }}>
        <ComplaintStatusBadge status={complaint.status} />
      </td>
      <td style={{ padding: '12px 8px', fontSize: 13 }}>
        {isClosed ? (
          <span style={{ color: C.textLight, fontSize: 12 }}>-</span>
        ) : isOwner ? (
          <button
            onClick={() => onResolve(complaint.id)}
            disabled={actionLoading}
            style={{ ...BTN.primary, fontSize: 12, padding: '6px 14px' }}
          >
            Resolve
          </button>
        ) : complaint.status === 'RESOLVED' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onReComplaint(complaint.id)}
              disabled={actionLoading}
              style={{ ...BTN.outline, fontSize: 12, padding: '6px 12px' }}
            >
              Recomplaint
            </button>
            <button
              onClick={() => onClose(complaint.id)}
              disabled={actionLoading}
              style={{ ...BTN.primary, fontSize: 12, padding: '6px 12px' }}
            >
              Close
            </button>
          </div>
        ) : (
          <span style={{ color: C.textLight, fontSize: 12 }}>Pending</span>
        )}
      </td>
    </tr>
  );
}

/**
 * Complaint Table Component
 */
export function ComplaintTable({
  complaints,
  isOwner,
  onViewEvidence,
  onViewDescription,
  onViewJustification,
  onResolve,
  onReComplaint,
  onClose,
  actionLoading,
}) {
  if (!complaints || complaints.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
        No complaints found
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Title
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Description
            </th>
            {isOwner && (
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                Evidence
              </th>
            )}
            {!isOwner && (
              <>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                  Reported User Evidence
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                  Justification
                </th>
              </>
            )}
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Status
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {complaints.map(complaint => (
            <ComplaintTableRow
              key={complaint.id}
              complaint={complaint}
              isOwner={isOwner}
              onViewEvidence={onViewEvidence}
              onViewDescription={onViewDescription}
              onViewJustification={onViewJustification}
              onResolve={onResolve}
              onReComplaint={onReComplaint}
              onClose={onClose}
              actionLoading={actionLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
