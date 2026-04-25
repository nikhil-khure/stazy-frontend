import { useEffect, useRef, useState, useMemo } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo, RoomCard, StarRating } from '../components/shared/SharedComponents';
import { PasswordRequirements } from '../components/shared/FormHelpers';
import { ImagePreviewGrid, ProfilePhotoPreview } from '../components/shared/ImagePreview';
import { ComplaintTable, EvidenceViewerPopup, DescriptionViewerPopup } from '../components/ComplaintComponents';
import { StudentCancelRequestTable, ViewReasonPopup } from '../components/CancelRequestComponents';
import Popup from '../components/shared/Popup';
import SlidingTabs from '../components/shared/SlidingTabs';
import BlockedAccountBanner from '../components/BlockedAccountBanner';
import { apiRequest, bootstrapCurrentUser, createMultipartForm, uploadMedia } from '../services/api';
import { apiWithRefresh } from '../services/apiWithRefresh';
import { addWebSocketListener } from '../services/websocket';
import NotificationBell from '../components/shared/NotificationBell';
import { useDashboardData } from '../hooks/useDashboardData';
import { clearSession } from '../services/session';
import { mapListingToRoom } from '../utils/listingMapper';
import { applyRealtimeDashboardEvent } from '../utils/realtimeDashboardData';
import { validatePassword } from '../utils/passwordRules';
import { prepareVerificationDisplay } from '../utils/verificationDisplay';

const MENU = [
  { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { key: 'profile', icon: '👤', label: 'My Profile' },
  { key: 'roomActivities', icon: '📋', label: 'Room Activities' },
  { key: 'explore', icon: '🔍', label: 'Explore Rooms' },
  { key: 'verify', icon: '🪪', label: 'Verify Profile' },
  { key: 'feedback', icon: '⭐', label: 'Feedback & Rating' },
  { key: 'complaints', icon: '🔔', label: 'See Complaints' },
];

function humanize(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return String(value);
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString()}`;
}

function formatMonthRange(start, end) {
  if (!start || !end) return '-';
  return `${formatDate(start)} to ${formatDate(end)}`;
}

function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();
  const cfg = {
    ACCEPTED: [C.success, '✓'],
    REJECTED: [C.danger, '✕'],
    REVOKED: [C.textLight, '•'],
    PENDING: ['#D97706', '⏳'],
    UNDER_PROGRESS: ['#D97706', '⏳'],
    PAID: [C.success, '✓'],
    UNPAID: [C.danger, '✕'],
    OPEN: [C.primary, '•'],
    RESOLVED: [C.secondary, '💬'],
    CLOSED: [C.success, '✓'],
    SUCCESS: [C.success, '✓'],
    FAILED: [C.danger, '✕'],
  };
  const [color, icon] = cfg[normalized] || [C.textLight, '•'];
  return (
    <span style={{ background: `${color}18`, color, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
      {icon} {humanize(status)}
    </span>
  );
}

function TableWrap({ headers, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflowX: 'auto', width: '100%' }}>
      <table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {headers.map(header => (
              <th key={header} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>
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

function TR({ children }) {
  return <tr style={{ borderTop: `1px solid ${C.border}` }}>{children}</tr>;
}

function TD({ children, style = {} }) {
  return <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap', ...style }}>{children}</td>;
}

function FInput({ label, placeholder, type = 'text', value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function FTextarea({ label, placeholder, rows = 4, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label>}
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function SCard({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <h4 style={{ margin: 0, fontWeight: 800, color: C.text, fontSize: 15 }}>{title}</h4>
      </div>
      <div style={{ padding: '16px 20px', overflowX: 'auto', wordWrap: 'break-word' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14, flexWrap: 'wrap' }}>
      <span style={{ color: C.textLight, minWidth: 180, wordBreak: 'break-word' }}>{label}</span>
      <span style={{ fontWeight: 600, color: C.text, wordBreak: 'break-word', flex: 1 }}>{value || '-'}</span>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: C.text }}>{title}</div>
      {subtitle && <div style={{ color: C.textLight, fontSize: 13, marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

function VerificationResultPanel({ result }) {
  if (!result) return null;

  const failedReasons = result.failedReasons || [];

  return (
    <div style={{ marginTop: 18, background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0, color: C.text }}>Latest Verification Status</h3>
        <StatusBadge status={result.status} />
      </div>
      <div style={{ fontSize: 13, color: C.textLight, marginBottom: 12 }}>Received on {formatDateTime(result.createdAt)}</div>
      {result.verified ? (
        <div>
          <div style={{ color: C.success, fontWeight: 800, fontSize: 16, marginBottom: 12 }}>✅ Verified</div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Barcode matched</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ College name matched</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Face matched</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ PRN matched</div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 10, color: C.danger, fontWeight: 800, fontSize: 15 }}>❌ Not Verified</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {failedReasons.length > 0 ? failedReasons.map(reason => (
              <div key={reason} style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>
                ✗ {reason}
              </div>
            )) : (
              <>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ PRN not matched</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Face not matched</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ College name not matched</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Barcode not matched</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function RoomActivities({
  bookingRequests,
  currentStay,
  currentPayment,
  cancelRequests,
  ownerComplaints,
  onRevokeRequest,
  onCreateComplaint,
  onCreateCancelRequest,
  onCloseComplaint,
  onReComplaint,
  onSubmitOwnerFeedback,
  actionLoading,
}) {
  const [popup, setPopup] = useState(null);
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '', attachments: [] });
  const [cancelReason, setCancelReason] = useState('');
  const [reComplaintData, setReComplaintData] = useState({ complaintId: null, message: '', attachments: [] });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, text: '' });
  const [feedbackDone, setFeedbackDone] = useState(false);

  const tabs = [
    { icon: '📋', label: 'Requested Booking Info' },
    { icon: '🏠', label: 'Current Room Booking Info' },
    { icon: '❌', label: 'Room Cancel Request Status' },
    { icon: '📣', label: 'Complaint Against Owner Status' },
  ];

  const handleComplaintSubmit = async () => {
    await onCreateComplaint({
      title: complaintForm.title,
      description: complaintForm.description,
      attachments: complaintForm.attachments,
    });
    setComplaintForm({ title: '', description: '', attachments: [] });
  };

  const handleCancelSubmit = async () => {
    await onCreateCancelRequest(cancelReason);
    setCancelReason('');
  };

  const handleReComplaintSubmit = async () => {
    await onReComplaint(reComplaintData.complaintId, reComplaintData.message, reComplaintData.attachments);
    setPopup(null);
    setReComplaintData({ complaintId: null, message: '', attachments: [] });
  };

  const handleOwnerFeedbackSubmit = async () => {
    await onSubmitOwnerFeedback(feedbackForm);
    setFeedbackDone(true);
    setFeedbackForm({ rating: 0, text: '' });
  };

  return (
    <div>
      {popup?.type === 'ownerInfo' && (
        <Popup title="Owner & Room Details" onClose={() => setPopup(null)}>
          <InfoRow label="Booking ID" value={popup.data.id} />
          <InfoRow label="Owner ID" value={popup.data.ownerUserCode} />
          <InfoRow label="Owner Name" value={popup.data.ownerName} />
          <InfoRow label="Listing" value={popup.data.listingTitle} />
          <InfoRow label="Location" value={popup.data.listingLocation} />
          <InfoRow label="Monthly Rent" value={`${formatCurrency(popup.data.requestedRent)}/month`} />
        </Popup>
      )}

      {popup?.type === 'reComplaint' && (
        <Popup title="Re-Complaint" onClose={() => setPopup(null)}>
          <FTextarea
            label="Message"
            placeholder="Explain why you want to reopen this complaint..."
            value={reComplaintData.message}
            onChange={event => setReComplaintData(current => ({ ...current, message: event.target.value }))}
          />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
              Attach Evidence (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={event => setReComplaintData(current => ({ ...current, attachments: Array.from(event.target.files || []) }))}
              style={{ width: '100%', padding: '8px', border: `1px solid ${C.border}`, borderRadius: 8 }}
            />
          </div>
          <ImagePreviewGrid
            files={reComplaintData.attachments}
            onRemove={(idx) => setReComplaintData(current => ({
              ...current,
              attachments: current.attachments.filter((_, i) => i !== idx)
            }))}
          />
          <button onClick={handleReComplaintSubmit} style={{ ...BTN.primary, width: '100%', padding: 11, marginTop: 12 }} disabled={actionLoading}>
            {actionLoading ? 'Sending...' : '📤 Send Re-Complaint'}
          </button>
        </Popup>
      )}

      <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📋 Room Activities</h2>

      <SlidingTabs tabs={tabs}>
        <div>
          {bookingRequests.length === 0 ? (
            <EmptyState icon="📭" title="No booking requests" subtitle="Your room requests will appear here." />
          ) : (
            <TableWrap headers={['Booking ID', 'Booking Status', 'Reason', 'Owner & Room', 'Action']}>
              {bookingRequests.map(request => (
                <TR key={request.id}>
                  <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{String(request.id).slice(0, 8)}</span></TD>
                  <TD><StatusBadge status={request.status} /></TD>
                  <TD><span style={{ color: request.rejectionReason ? C.danger : C.textLight, fontSize: 12 }}>{request.rejectionReason || '-'}</span></TD>
                  <TD>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{request.ownerName}</div>
                    <div style={{ color: C.textLight, fontSize: 11, marginBottom: 4 }}>{request.listingTitle}</div>
                    <button
                      onClick={() => setPopup({ type: 'ownerInfo', data: request })}
                      style={{ background: `${C.secondary}15`, color: C.secondary, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔍 Click More Info
                    </button>
                  </TD>
                  <TD>
                    {request.status === 'PENDING' ? (
                      <button
                        onClick={() => onRevokeRequest(request.id)}
                        style={{ background: '#FEF2F2', color: C.danger, border: '1px solid #FCA5A5', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        disabled={actionLoading}
                      >
                        🚫 Revoke Request
                      </button>
                    ) : (
                      <span style={{ color: C.textLight, fontWeight: 700 }}>-</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
        </div>

        <div>
          {!currentStay ? (
            <EmptyState icon="🏠" title="No active stay" subtitle="Once an owner accepts your booking, your room details will appear here." />
          ) : (
            <>
              <SCard title="Room Information" icon="🏠">
                <InfoRow label="Room ID" value={currentStay.roomCode} />
                <InfoRow label="Room Type" value={humanize(currentStay.roomKind)} />
                <InfoRow label="Room Address" value={currentStay.listingLocation} />
              </SCard>
              <SCard title="Owner Details" icon="👤">
                <InfoRow label="Owner ID" value={currentStay.ownerUserCode} />
                <InfoRow label="Owner Name" value={currentStay.ownerName} />
                <InfoRow label="Contact Number" value={currentStay.ownerPhone} />
                <InfoRow label="Email ID" value={currentStay.ownerEmail} />
              </SCard>
              <SCard title="Tenancy Details" icon="📅">
                <InfoRow label="Joining Date" value={formatDate(currentStay.joinDate)} />
                <InfoRow label="Current Month Range" value={formatMonthRange(currentPayment?.periodStart, currentPayment?.periodEnd)} />
                <InfoRow label="Monthly Rent" value={formatCurrency(currentStay.monthlyRent)} />
              </SCard>
              <SCard title="Payment Details" icon="💳">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.textLight, fontSize: 14, minWidth: 180 }}>Current Month Payment</span>
                  <StatusBadge status={currentStay.currentPaymentStatus} />
                </div>
                <InfoRow label="Payment Date" value={formatDateTime(currentPayment?.paidAt)} />
                <InfoRow label="Next Due Date" value={formatDate(currentStay.nextDueDate)} />
                {(currentPayment?.reminderMessage || currentStay.reminderMessage) && (
                  <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E', marginTop: 8 }}>
                    ⚠️ {currentPayment?.reminderMessage || currentStay.reminderMessage}
                  </div>
                )}
              </SCard>
              <SCard title="Complaint Against Owner" icon="📣">
                <FInput
                  label="Issue Title"
                  placeholder="Brief title of your issue"
                  value={complaintForm.title}
                  onChange={event => setComplaintForm(current => ({ ...current, title: event.target.value }))}
                />
                <FTextarea
                  label="Describe Issue in Detail"
                  placeholder="Explain the issue..."
                  value={complaintForm.description}
                  onChange={event => setComplaintForm(current => ({ ...current, description: event.target.value }))}
                />
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
                    Attach Evidence (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={event => setComplaintForm(current => ({ ...current, attachments: Array.from(event.target.files || []) }))}
                    style={{ width: '100%', padding: '8px', border: `1px solid ${C.border}`, borderRadius: 8 }}
                  />
                </div>
                <ImagePreviewGrid
                  files={complaintForm.attachments}
                  onRemove={(idx) => setComplaintForm(current => ({
                    ...current,
                    attachments: current.attachments.filter((_, i) => i !== idx)
                  }))}
                />
                <button onClick={handleComplaintSubmit} style={{ ...BTN.primary, width: '100%', padding: 11, marginTop: 12 }} disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : '📤 Submit Complaint to Owner'}
                </button>
              </SCard>
              <SCard title="Revoke Current Booking" icon="❌">
                <FTextarea
                  label="Enter Reason to Cancel Booking"
                  placeholder="Please provide a valid reason for cancellation..."
                  value={cancelReason}
                  onChange={event => setCancelReason(event.target.value)}
                  rows={3}
                />
                <button
                  onClick={handleCancelSubmit}
                  style={{ background: '#FEF2F2', color: C.danger, border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Sending...' : '📤 Send Room Cancel Request to Owner'}
                </button>
              </SCard>
              <SCard title="Feedback & Rating for Owner" icon="⭐">
                {feedbackDone ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🙏</div>
                    <div style={{ fontWeight: 700, color: C.success }}>Thank you for your feedback!</div>
                  </div>
                ) : (
                  <>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 10 }}>Rate Owner Service</label>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFeedbackForm(current => ({ ...current, rating: star }))}
                          style={{ fontSize: 30, background: 'none', border: 'none', cursor: 'pointer', color: star <= feedbackForm.rating ? '#FFB700' : '#D1D5DB' }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <FTextarea
                      label="Share your thoughts about room facilities"
                      placeholder="Tell us about your experience..."
                      value={feedbackForm.text}
                      onChange={event => setFeedbackForm(current => ({ ...current, text: event.target.value }))}
                      rows={3}
                    />
                    <button onClick={handleOwnerFeedbackSubmit} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>
                      {actionLoading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </>
                )}
              </SCard>
            </>
          )}
        </div>

        <div>
          <StudentCancelRequestTable
            requests={cancelRequests}
            onViewOwnerMessage={(message) => setPopup({ type: 'ownerMessage', data: message })}
          />
          {popup?.type === 'ownerMessage' && (
            <ViewReasonPopup
              title="Owner Response"
              reason={popup.data}
              onClose={() => setPopup(null)}
            />
          )}
        </div>

        <div>
          <ComplaintTable
            complaints={ownerComplaints}
            isOwner={false}
            onViewEvidence={(attachments) => setPopup({ type: 'evidence', data: attachments })}
            onViewDescription={(title, description) => setPopup({ type: 'description', title, data: description })}
            onViewJustification={(message) => setPopup({ type: 'justification', data: message })}
            onReComplaint={(complaintId) => {
              setPopup({ type: 'reComplaint' });
              setReComplaintData({ complaintId, message: '', attachments: [] });
            }}
            onClose={(complaintId) => onCloseComplaint(complaintId)}
            actionLoading={actionLoading}
          />
          {popup?.type === 'evidence' && (
            <EvidenceViewerPopup
              attachments={popup.data}
              onClose={() => setPopup(null)}
            />
          )}
          {popup?.type === 'description' && (
            <DescriptionViewerPopup
              title={popup.title}
              description={popup.data}
              onClose={() => setPopup(null)}
            />
          )}
          {popup?.type === 'justification' && (
            <DescriptionViewerPopup
              title="Owner Justification"
              description={popup.data}
              onClose={() => setPopup(null)}
            />
          )}
        </div>
      </SlidingTabs>
    </div>
  );
}


function SeeComplaints({ complaints, onResolveComplaint, actionLoading }) {
  const [popup, setPopup] = useState(null);
  const [resolution, setResolution] = useState({ message: '', attachments: [] });

  const handleSubmit = async () => {
    await onResolveComplaint(popup.data.id, resolution.message, resolution.attachments);
    setPopup(null);
    setResolution({ message: '', attachments: [] });
  };

  return (
    <div>
      {popup?.type === 'resolve' && (
        <Popup title="Resolve Complaint" onClose={() => { setPopup(null); setResolution({ message: '', attachments: [] }); }}>
          <FTextarea
            label="Your Full Justification"
            placeholder="Explain how the issue was resolved..."
            value={resolution.message}
            onChange={event => setResolution(current => ({ ...current, message: event.target.value }))}
            rows={5}
          />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
              Attach Evidence (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={event => setResolution(current => ({ ...current, attachments: Array.from(event.target.files || []) }))}
              style={{ width: '100%', padding: '8px', border: `1px solid ${C.border}`, borderRadius: 8 }}
            />
          </div>
          <ImagePreviewGrid
            files={resolution.attachments}
            onRemove={(idx) => setResolution(current => ({
              ...current,
              attachments: current.attachments.filter((_, i) => i !== idx)
            }))}
          />
          <button onClick={handleSubmit} style={{ ...BTN.primary, width: '100%', padding: 11, marginTop: 12 }} disabled={actionLoading}>
            {actionLoading ? 'Submitting...' : '📤 Submit Resolution'}
          </button>
        </Popup>
      )}

      <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📋 See Complaints</h2>

      <ComplaintTable
        complaints={complaints}
        isOwner={true}
        onViewEvidence={(attachments) => setPopup({ type: 'evidence', data: attachments })}
        onViewDescription={(title, description) => setPopup({ type: 'description', title, data: description })}
        onResolve={(complaintId) => setPopup({ type: 'resolve', data: { id: complaintId } })}
        actionLoading={actionLoading}
      />

      {popup?.type === 'evidence' && (
        <EvidenceViewerPopup
          attachments={popup.data}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'description' && (
        <DescriptionViewerPopup
          title={popup.title}
          description={popup.data}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

export default function StudentDashboardLive({ user, setUser, navigate }) {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomReviews, setRoomReviews] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const [feedback, setFeedback] = useState({ text: '', rating: 0 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  const [editPwdGate, setEditPwdGate] = useState('');
  const [editPwdErr, setEditPwdErr] = useState('');
  const [editPwdConfirmed, setEditPwdConfirmed] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '', collegeName: '', enrollNo: '', location: '', gender: '', password: '', confirmPassword: '', photo: null, existingPhotoUrl: null });
  const [deletePopup, setDeletePopup] = useState(false);
  const [pwdVerify, setPwdVerify] = useState('');
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyFiles, setVerifyFiles] = useState({ liveImage: null, idCardImage: null });
  const [verifyConfirmed, setVerifyConfirmed] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [optimisticBookings, setOptimisticBookings] = useState({ removed: new Set() });
  const [optimisticCancelRequests, setOptimisticCancelRequests] = useState([]);
  const [optimisticComplaints, setOptimisticComplaints] = useState(new Map());
  const [successToast, setSuccessToast] = useState(null);
  const notifRef = useRef(null);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Use the new dashboard data hook
  const { data, loading: pageLoading, error: pageError, refresh, mutateData } = useDashboardData('student');
  const profile = useMemo(() => data.profile || {}, [data.profile]);
  const bookingRequests = useMemo(() => 
    (data.bookingRequests || []).filter(b => !optimisticBookings.removed.has(b.id)),
    [data.bookingRequests, optimisticBookings.removed]
  );
  const currentStay = data.currentStay;
  const payments = data.payments || [];
  const cancelRequests = [...optimisticCancelRequests, ...(data.cancelRequests || [])];
  const filedComplaints = useMemo(() => 
    (data.filedComplaints || []).map(c =>
      optimisticComplaints.has(c.id) ? { ...c, ...optimisticComplaints.get(c.id) } : c
    ),
    [data.filedComplaints, optimisticComplaints]
  );
  const receivedComplaints = useMemo(() => 
    (data.receivedComplaints || []).map(c =>
      optimisticComplaints.has(c.id) ? { ...c, ...optimisticComplaints.get(c.id) } : c
    ),
    [data.receivedComplaints, optimisticComplaints]
  );
  const liveNotifications = data.notifications || [];
  const rawVerificationHistory = data.verificationHistory || [];
  
  // Process verification history through prepareVerificationDisplay to get failedReasons
  const verificationHistory = useMemo(
    () => rawVerificationHistory.map(v => prepareVerificationDisplay(v)),
    [rawVerificationHistory]
  );

  const currentPayment = currentStay ? payments.find(payment => payment.activeStayId === currentStay.id) || payments[0] : null;
  const ownerComplaints = filedComplaints.filter(complaint => complaint.againstRoleCode === 'OWNER');
  const latestVerification = verificationResult || verificationHistory[0] || null;
  const isFullyUnlocked = (profile?.completionPercentage || 0) >= 100;
  const isMenuDisabled = key => !isFullyUnlocked && !['dashboard', 'profile', 'verify'].includes(key);
  const isBlocked = user?.isBlocked || false;

  const syncUser = async () => {
    const refreshedUser = await bootstrapCurrentUser();
    setUser(refreshedUser);
    return refreshedUser;
  };

  useEffect(() => {
    if (!user || user.role !== 'student') {
      return;
    }

    const unsubscribe = addWebSocketListener((topic, payload) => {
      if (topic !== 'user' && topic !== 'role' && topic !== 'global') {
        return;
      }

      mutateData(current => applyRealtimeDashboardEvent('student', current, topic, payload));
    });

    return () => unsubscribe();
  }, [user, mutateData]);

  // Load recommended rooms - use stable IDs instead of object references
  const profileUserCode = profile?.userCode;
  const profileLocation = profile?.currentLocation;
  const profileGender = profile?.gender;
  const bookingRequestIds = useMemo(() => 
    bookingRequests.map(item => item.listingId).join(','), 
    [bookingRequests]
  );
  const currentStayListingId = currentStay?.listingId;

  useEffect(() => {
    if (!profileUserCode) {
      return;
    }
    
    const loadRecommendations = async () => {
      try {
        // Fetch more rooms to ensure we have enough after filtering
        const listingsResponse = await apiRequest('/api/listings', { query: { size: 20 } });
        
        // Create set of listing IDs to exclude (already booked or current stay)
        const blockedListingIds = new Set([
          ...bookingRequestIds.split(',').filter(Boolean),
          currentStayListingId,
        ].filter(Boolean));
        
        // Filter and map rooms
        const availableRooms = (listingsResponse?.items || [])
          .map(mapListingToRoom)
          .filter(room => {
            // Exclude already booked or current stay rooms
            if (blockedListingIds.has(room.id)) {
              return false;
            }
            
            // If student has a location, show only rooms from that city
            if (profileLocation) {
              // City-based match: check if room location contains student's city
              const studentCity = profileLocation.trim().toLowerCase();
              const roomLocation = (room.location || '').trim().toLowerCase();
              if (!roomLocation.includes(studentCity)) {
                return false;
              }
            }
            
            // Gender-based filtering: Male students see Male + Both, Female students see Female + Both
            if (profileGender) {
              const studentGender = profileGender.toUpperCase();
              const roomCategory = (room.category || '').toUpperCase();
              
              // If room is for Both genders, always show it
              if (roomCategory === 'BOTH') {
                return true;
              }
              
              // Otherwise, room gender must match student gender
              if (studentGender === 'MALE' && roomCategory !== 'MALE') {
                return false;
              }
              if (studentGender === 'FEMALE' && roomCategory !== 'FEMALE') {
                return false;
              }
            }
            
            return true;
          });
        
        // Sort by rating (highest first), then by ID for consistency
        const sortedRooms = availableRooms.sort((a, b) => {
          // First sort by rating (descending)
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          // If ratings are equal, sort by ID for consistency
          return a.id.localeCompare(b.id);
        });
        
        // Take top 3 rooms
        const topRooms = sortedRooms.slice(0, 3);
        
        setRecommendedRooms(topRooms);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setRecommendedRooms([]);
      }
    };
    loadRecommendations();
  }, [profileUserCode, profileLocation, profileGender, bookingRequestIds, currentStayListingId]);

  // Fetch reviews when a room is selected
  useEffect(() => {
    if (!selectedRoom) {
      setRoomReviews([]);
      return;
    }
    
    let active = true;
    apiRequest(`/api/public/listings/${selectedRoom.id}/reviews`)
      .then(items => {
        if (active) {
          setRoomReviews(items || []);
        }
      })
      .catch(() => {
        if (active) {
          setRoomReviews([]);
        }
      });
    
    return () => {
      active = false;
    };
  }, [selectedRoom]);

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.displayName || '',
        email: profile.email || '',
        mobile: profile.mobileNumber || '',
        collegeName: profile.collegeName || '',
        enrollNo: profile.enrollmentNumber || profile.prn || '',
        location: profile.currentLocation || '',
        gender: profile.gender || '',
        password: '',
        confirmPassword: '',
        photo: null,
      });
    }
  }, [profile]);

  if (!user || user.role !== 'student') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, color: C.text }}>Student sign-in required</h2>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 18 }}>Please sign in with a student account to access this dashboard.</p>
          <button onClick={() => navigate('login')} style={{ ...BTN.primary, padding: '10px 20px' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const performAction = async (task) => {
    setActionError('');
    setActionLoading(true);
    try {
      await task();
    } catch (error) {
      setActionError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const signOut = () => {
    clearSession();
    setUser(null);
    navigate('home');
  };

  const openEditPopup = () => {
    setEditForm({
      fullName: profile?.displayName || '',
      email: profile?.email || '',
      mobile: profile?.mobileNumber || '',
      collegeName: profile?.collegeName || '',
      enrollNo: profile?.enrollmentNumber || profile?.prn || '',
      location: profile?.currentLocation || '',
      gender: profile?.gender || '',
      password: '',
      confirmPassword: '',
      photo: null,
      existingPhotoUrl: profile?.profilePhotoUrl || null,
    });
    setEditPopup(true);
  };

  const handleSaveProfile = async () => {
    if (editForm.password) {
      if (!editForm.confirmPassword) {
        setActionError('Please confirm your new password.');
        return;
      }
      if (editForm.password !== editForm.confirmPassword) {
        setActionError('Passwords do not match.');
        return;
      }
      const passwordCheck = validatePassword(editForm.password);
      if (!passwordCheck.valid) {
        setActionError(passwordCheck.message);
        return;
      }
    }

    await performAction(async () => {
      let photoPayload = {};
      if (editForm.photo) {
        // New photo uploaded - upload it
        const uploaded = await uploadMedia(editForm.photo, 'profile-photo');
        photoPayload = {
          profilePhotoUrl: uploaded.url,
          profilePhotoPublicId: uploaded.publicId,
        };
      } else if (editForm.existingPhotoUrl) {
        // No new photo, but keep existing photo
        photoPayload = {
          profilePhotoUrl: editForm.existingPhotoUrl,
          profilePhotoPublicId: profile?.profilePhotoPublicId || undefined,
        };
      }
      // If both are null, photo will be removed (user clicked X to remove)

      await apiWithRefresh.updateProfile({
        displayName: editForm.fullName,
        email: editForm.email,
        mobileNumber: editForm.mobile,
        collegeName: editForm.collegeName,
        prn: editForm.enrollNo,
        enrollmentNumber: editForm.enrollNo,
        currentLocation: editForm.location,
        gender: editForm.gender || null,
        ...photoPayload,
      }, 'STUDENT');

      if (editForm.password) {
        await apiRequest('/api/users/me/password', {
          method: 'PATCH',
          auth: true,
          body: {
            currentPassword: editPwdGate,
            newPassword: editForm.password,
            confirmPassword: editForm.confirmPassword,
          },
        });
      }

      await syncUser();
      showToast('Profile saved successfully! ✓');
      setEditPopup(false);
      setEditPwdGate('');
      setEditPwdErr('');
      setEditPwdConfirmed(false);
    });
  };

  const handleDeleteAccount = async () => {
    await performAction(async () => {
      await apiRequest('/api/users/me', {
        method: 'DELETE',
        auth: true,
        body: { currentPassword: pwdVerify },
      });
      clearSession();
      setUser(null);
      navigate('home');
    });
  };

  const handlePerformVerification = async () => {
    if (!profile?.profileComplete) {
      setActionError('Please complete your profile to 100% before performing AI verification.');
      return;
    }
    if (!verifyConfirmed) {
      setActionError('Please preview and confirm your verification files first.');
      return;
    }

    setVerifyStep(1);
    setActionError('');
    try {
      const result = await apiRequest('/api/verifications/student', {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: createMultipartForm({
          liveImage: verifyFiles.liveImage,
          idCardImage: verifyFiles.idCardImage,
          collegeName: profile.collegeName,
          prn: profile.prn || profile.enrollmentNumber,
        }),
      });
      const normalizedResult = prepareVerificationDisplay(result);
      setVerificationResult(normalizedResult);
      await syncUser();
      await refresh();
      showToast('Verification complete! ✓');
      setVerifyStep(3);
    } catch (error) {
      setActionError(error.message);
      setVerifyStep(3);
      setVerificationResult(prepareVerificationDisplay({
        verified: false,
        status: 'FAILED',
        message: error.message,
      }));
    }
  };

  const handlePlatformFeedback = () => {
    // 1. Reset form and show sent state immediately
    setFeedbackSent(true);
    const previousFeedback = { ...feedback };
    setFeedback({ text: '', rating: 0 });
    showToast('Feedback submitted! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiWithRefresh.submitFeedback({
          feedbackScope: 'PLATFORM',
          rating: previousFeedback.rating,
          message: previousFeedback.text,
          location: profile?.currentLocation || '',
        });
      } catch (e) {
        // Revert the form if submission fails
        setFeedbackSent(false);
        setFeedback(previousFeedback);
        setActionError(`Failed to submit feedback: ${e.message}`);
      }
    })();
  };

  const handleOwnerFeedback = ({ rating, text }) => {
    if (!currentStay?.ownerUserCode) {
      setActionError('Owner details are not available for feedback yet.');
      return;
    }

    // 1. Confirm immediately
    showToast('Owner feedback submitted! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiWithRefresh.submitFeedback({
          feedbackScope: 'LISTING',
          rating,
          message: text,
          location: currentStay.listingId,
          targetUserCode: currentStay.ownerUserCode,
        });
      } catch (e) {
        setActionError(`Failed to submit feedback: ${e.message}`);
      }
    })();
  };

  const handleRevokeRequest = (requestId) => {
    // 1. Remove the request row immediately
    setOptimisticBookings(curr => ({
      ...curr,
      removed: new Set([...curr.removed, requestId])
    }));
    showToast('Booking request revoked! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiWithRefresh.revokeBooking(requestId);
        await refresh();
      } catch (e) {
        // Revert: put the request back in view
        setOptimisticBookings(curr => {
          const newRemoved = new Set(curr.removed);
          newRemoved.delete(requestId);
          return { ...curr, removed: newRemoved };
        });
        setActionError(`Failed to revoke booking: ${e.message}`);
      }
    })();
  };

  const handleCreateComplaint = ({ title, description, attachments }) => {
    if (!currentStay?.ownerUserCode) {
      setActionError('Owner details are not available for complaints yet.');
      return;
    }

    // 1. Close the form / show confirmation immediately
    showToast('Complaint submitted! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiRequest('/api/complaints', {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: createMultipartForm({
            againstUserCode: currentStay.ownerUserCode,
            title,
            description,
            relatedStayId: currentStay.id,
            relatedListingId: currentStay.listingId,
            attachments,
          }),
        });
        await refresh();
      } catch (e) {
        setActionError(`Failed to submit complaint: ${e.message}`);
      }
    })();
  };

  const handleCreateCancelRequest = (reason) => {
    if (!currentStay?.id) {
      setActionError('You do not have an active stay to cancel.');
      return;
    }

    // 1. Add a pending cancel request entry immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticEntry = {
      id: tempId,
      activeStayId: currentStay.id,
      reason,
      status: 'PENDING',
      isOptimistic: true,
      createdAt: new Date().toISOString(),
    };
    setOptimisticCancelRequests(curr => [optimisticEntry, ...curr]);
    showToast('Cancel request submitted! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiWithRefresh.createCancelRequest(currentStay.id, reason);
        await refresh();
        // Clear optimistic entry after refresh brings real data
        setOptimisticCancelRequests(curr => curr.filter(r => r.id !== tempId));
      } catch (e) {
        // Revert: remove the optimistic entry
        setOptimisticCancelRequests(curr => curr.filter(r => r.id !== tempId));
        setActionError(`Failed to submit cancel request: ${e.message}`);
      }
    })();
  };

  const handleCloseComplaint = (complaintId) => {
    // 1. Update status badge immediately
    setOptimisticComplaints(curr => new Map(curr).set(complaintId, { status: 'CLOSED' }));
    showToast('Complaint closed! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiWithRefresh.closeComplaint(complaintId);
        await refresh();
        setOptimisticComplaints(curr => { const m = new Map(curr); m.delete(complaintId); return m; });
      } catch (e) {
        setOptimisticComplaints(curr => { const m = new Map(curr); m.delete(complaintId); return m; });
        setActionError(`Failed to close complaint: ${e.message}`);
      }
    })();
  };

  const handleReopenComplaint = (complaintId, message, attachments) => {
    // 1. Update status badge immediately
    setOptimisticComplaints(curr => new Map(curr).set(complaintId, { status: 'OPEN' }));
    showToast('Complaint reopened! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiRequest(`/api/complaints/${complaintId}/re-open`, {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: createMultipartForm({ message, attachments }),
        });
        await refresh();
        setOptimisticComplaints(curr => { const m = new Map(curr); m.delete(complaintId); return m; });
      } catch (e) {
        setOptimisticComplaints(curr => { const m = new Map(curr); m.delete(complaintId); return m; });
        setActionError(`Failed to reopen complaint: ${e.message}`);
      }
    })();
  };

  const handleResolveComplaint = (complaintId, message, attachments) => {
    setOptimisticComplaints(curr => new Map(curr).set(complaintId, { status: 'RESOLVED' }));
    showToast('Complaint resolved! ✓');
    
    (async () => {
      try {
        await apiRequest(`/api/complaints/${complaintId}/justify`, {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: createMultipartForm({ message, attachments }),
        });
        await refresh();
        setOptimisticComplaints(curr => {
          const m = new Map(curr);
          m.delete(complaintId);
          return m;
        });
      } catch (e) {
        setOptimisticComplaints(curr => {
          const m = new Map(curr);
          m.delete(complaintId);
          return m;
        });
        setActionError(`Failed to resolve complaint: ${e.message}`);
      }
    })();
  };

  const notifications = [
    ...liveNotifications.map(item => `${item.title}: ${item.message}`),
    !profile?.profileComplete && 'Complete your profile to unlock verification and booking features.',
    profile?.profileComplete && !profile?.identityVerified && 'Your profile is complete. Finish identity verification to continue booking safely.',
    currentStay?.nextDueDate && `Your next rent due date is ${formatDate(currentStay.nextDueDate)}.`,
  ].filter(Boolean);

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔄</div>
          <div style={{ fontWeight: 800, color: C.text }}>Loading student dashboard...</div>
        </div>
      </div>
    );
  }

  // If a room is selected from recommendations, show room detail view
  if (selectedRoom) {
    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: C.bg, minHeight: '100vh' }}>
        <div style={{ background: C.primary, padding: '0 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSelectedRoom(null)} style={{ ...BTN.ghost, color: '#fff', fontSize: 20 }}>←</button>
            <Logo white size={22} />
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <div style={{ height: 320, background: `linear-gradient(135deg, ${C.primary}22, ${C.secondary}33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 }}>
              {selectedRoom.images?.[0] && typeof selectedRoom.images[0] === 'string' && /^(https?:|blob:|data:)/i.test(selectedRoom.images[0]) ? (
                <img src={selectedRoom.images[0]} alt={selectedRoom.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
              ) : (
                <div>{selectedRoom.images?.[0] || '🏠'}</div>
              )}
            </div>
            <div style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.text }}>{selectedRoom.title}</h1>
                  <div style={{ color: C.textLight, marginTop: 6, fontSize: 15 }}>📍 {selectedRoom.location}</div>
                  <div style={{ marginTop: 8, display: 'inline-block', background: C.primary + '18', color: C.primary, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                    {selectedRoom.category}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: C.primary }}>₹{selectedRoom.rent.toLocaleString()}</span>
                    <span style={{ color: C.textLight, fontSize: 13 }}>/month</span>
                  </div>
                </div>
              </div>
              <p style={{ color: C.text, lineHeight: 1.7, marginBottom: 20 }}>{selectedRoom.desc}</p>
              <h3 style={{ color: C.text, marginBottom: 10 }}>🏷️ Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {selectedRoom.amenities.map(a => (
                  <div key={a} style={{ background: C.primary + '10', color: C.primary, borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>✓ {a}</div>
                ))}
              </div>
              <h3 style={{ color: C.text, marginBottom: 10 }}>💬 Student Reviews</h3>
              {roomReviews.length === 0 ? (
                <div style={{ background: C.bg, borderRadius: 10, padding: 16, marginBottom: 24, border: `1px solid ${C.border}`, textAlign: 'center', color: C.textLight }}>
                  No reviews yet
                </div>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  {roomReviews.map((review, i) => (
                    <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 16, marginBottom: 10, border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                        {review.profilePhotoUrl ? (
                          <img 
                            src={review.profilePhotoUrl} 
                            alt={review.displayName || 'Student'} 
                            style={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: `2px solid ${C.border}`
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            background: C.primary + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            fontWeight: 700,
                            color: C.primary,
                            border: `2px solid ${C.border}`
                          }}>
                            {(review.displayName || review.name || 'S').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{review.displayName || review.name || 'Verified student'}</div>
                          <StarRating rating={review.rating || 0} size={12} />
                        </div>
                      </div>
                      <p style={{ color: C.textLight, fontSize: 13, margin: 0 }}>{review.message || review.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={async () => {
                  setActionLoading(true);
                  setActionError('');
                  try {
                    await apiRequest(`/api/bookings/listings/${selectedRoom.id}/requests`, {
                      method: 'POST',
                      auth: true,
                      body: { message: `Booking request for ${selectedRoom.title}` },
                    });
                    showToast('Booking request submitted successfully');
                    setSelectedRoom(null);
                    refresh();
                  } catch (error) {
                    setActionError(error.message);
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                style={{ 
                  ...BTN.primary, 
                  padding: '13px 28px', 
                  fontSize: 15, 
                  opacity: actionLoading ? 0.5 : 1,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {actionLoading ? 'Submitting...' : '📅 Book Room'}
              </button>
              {actionError && <div style={{ marginTop: 14, fontSize: 13, color: C.danger }}>{actionError}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <BlockedAccountBanner user={user} />
      {successToast && (
        <div style={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          background: '#16a34a',
          color: '#fff', 
          borderRadius: 10, 
          padding: '10px 18px', 
          fontWeight: 700,
          fontSize: 14, 
          zIndex: 9999, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)' 
        }}>
          {successToast}
        </div>
      )}
      {editPopup && (
        <Popup
          title="Edit Profile"
          onClose={() => {
            setEditPopup(false);
            setEditPwdGate('');
            setEditPwdErr('');
            setEditPwdConfirmed(false);
          }}
        >
          {!editPwdConfirmed ? (
            <>
              <p style={{ color: C.textLight, fontSize: 14, marginBottom: 14 }}>Please enter your current password to edit your profile.</p>
              {editPwdErr && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>{editPwdErr}</div>}
              <FInput label="Current Password" placeholder="Enter your current password" type="password" value={editPwdGate} onChange={event => setEditPwdGate(event.target.value)} />
              <button
                onClick={async () => {
                  if (!editPwdGate.trim()) {
                    setEditPwdErr('Please enter your current password.');
                    return;
                  }
                  try {
                    await apiRequest('/api/users/me/verify-password', {
                      method: 'PATCH',
                      auth: true,
                      body: { currentPassword: editPwdGate },
                    });
                    setEditPwdConfirmed(true);
                    setEditPwdErr('');
                  } catch (error) {
                    setEditPwdErr(error.message);
                  }
                }}
                style={{ ...BTN.primary, width: '100%', padding: 11 }}
              >
                Verify Password
              </button>
            </>
          ) : (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 14 }}>✓ Password confirmed. You can now edit your profile.</p>
              <FInput label="Full Name" placeholder="Full name" value={editForm.fullName} onChange={event => setEditForm(current => ({ ...current, fullName: event.target.value }))} />
              <FInput label="Email ID" placeholder="Email address" type="email" value={editForm.email} onChange={event => setEditForm(current => ({ ...current, email: event.target.value }))} />
              <FInput label="Mobile Number" placeholder="Mobile number" value={editForm.mobile} onChange={event => setEditForm(current => ({ ...current, mobile: event.target.value }))} />
              <FInput label="College Name" placeholder="College name" value={editForm.collegeName} onChange={event => setEditForm(current => ({ ...current, collegeName: event.target.value }))} />
              <FInput label="College Enrollment Number" placeholder="Enrollment number" value={editForm.enrollNo} onChange={event => setEditForm(current => ({ ...current, enrollNo: event.target.value }))} />
              <FInput label="Current Location" placeholder="Current location" value={editForm.location} onChange={event => setEditForm(current => ({ ...current, location: event.target.value }))} />
              
              {/* Gender Selection */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Gender</label>
                <select 
                  value={editForm.gender} 
                  onChange={event => setEditForm(current => ({ ...current, gender: event.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 8, 
                    fontSize: 13, 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              
              <FInput label="New Password" placeholder="Leave blank to keep current password" type="password" value={editForm.password} onChange={event => setEditForm(current => ({ ...current, password: event.target.value }))} />
              <FInput label="Confirm Password" placeholder="Confirm password" type="password" value={editForm.confirmPassword} onChange={event => setEditForm(current => ({ ...current, confirmPassword: event.target.value }))} />
              <PasswordRequirements password={editForm.password} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>Profile Photo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => setEditForm(current => ({ ...current, photo: event.target.files?.[0] || null }))}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${C.border}`, borderRadius: 8 }}
                />
              </div>
              <ProfilePhotoPreview
                file={editForm.photo}
                url={!editForm.photo ? editForm.existingPhotoUrl : null}
                onRemove={() => setEditForm(current => ({ ...current, photo: null, existingPhotoUrl: null }))}
              />
              <button onClick={handleSaveProfile} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </>
          )}
        </Popup>
      )}
      {deletePopup && (
        <Popup title="Delete Account" onClose={() => { setDeletePopup(false); setPwdVerify(''); }}>
          <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.danger }}>
            ⚠️ This action is permanent and cannot be undone.
          </div>
          <FInput label="Confirm Password" placeholder="Enter your password" type="password" value={pwdVerify} onChange={event => setPwdVerify(event.target.value)} />
          <button
            onClick={handleDeleteAccount}
            style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : '🗑️ Delete My Account Permanently'}
          </button>
        </Popup>
      )}

      <nav style={{ background: C.primary, padding: '0 20px', zIndex: 100, position: 'sticky', top: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setCollapsed(current => !current)} style={{ ...BTN.ghost, color: '#fff', fontSize: 18 }}>☰</button>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white size={22} /></div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <NotificationBell notifications={liveNotifications} refreshData={refresh} />
            <button onClick={signOut} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: collapsed ? 56 : 220, background: '#fff', borderRight: `1px solid ${C.border}`, transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ paddingTop: 12 }}>
            {MENU.map(item => (
              <button
                key={item.key}
                onClick={() => {
                  if (isMenuDisabled(item.key)) return;
                  item.key === 'explore' ? navigate('explore') : setPage(item.key);
                }}
                disabled={isMenuDisabled(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '13px 16px',
                  border: 'none',
                  background: page === item.key ? `${C.primary}15` : 'transparent',
                  color: page === item.key ? C.primary : C.text,
                  cursor: isMenuDisabled(item.key) ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  fontWeight: page === item.key ? 800 : 500,
                  fontSize: 14,
                  borderLeft: page === item.key ? `3px solid ${C.primary}` : '3px solid transparent',
                  transition: 'all 0.2s',
                  opacity: isMenuDisabled(item.key) ? 0.45 : 1,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {pageError && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{pageError}</div>}
          {actionError && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{actionError}</div>}
          {page === 'dashboard' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#003B95,#0071C2)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Welcome back, {user?.name}! 👋</h1>
                <p style={{ margin: '6px 0 0', opacity: 0.85 }}>Student ID: <b>{profile?.userCode}</b></p>
              </div>
              <div ref={notifRef} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontWeight: 800 }}>🔔 Notifications</h3>
                  {liveNotifications.length > 0 && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to clear all notifications?')) {
                          try {
                            await apiRequest('/api/notifications/me/all', {
                              method: 'DELETE',
                              auth: true,
                            });
                            await refresh();
                            showToast('All notifications cleared! ✓');
                          } catch (error) {
                            setActionError(error.message);
                          }
                        }
                      }}
                      style={{
                        background: '#FEF2F2',
                        color: C.danger,
                        border: `1px solid ${C.danger}`,
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.success, fontWeight: 500 }}>Everything looks good right now.</div>
                ) : (
                  notifications.map((message, index) => {
                    const colors = [['#FFFBEB', '#D97706'], ['#EFF6FF', '#1D4ED8'], ['#F0FFF4', '#059669']];
                    const [bg, clr] = colors[index % colors.length];
                    return <div key={message} style={{ background: bg, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: clr, fontWeight: 500 }}>{message}</div>;
                  })
                )}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontWeight: 800 }}>📌 Recent Booking</h3>
                {currentStay ? (
                  <div style={{ background: C.bg, borderRadius: 10, padding: 20 }}>
                    <div style={{ fontWeight: 800, color: C.text, marginBottom: 8 }}>{currentStay.listingTitle}</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 6 }}>{currentStay.listingLocation}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={currentStay.status} />
                      <span style={{ color: C.primary, fontWeight: 700 }}>{formatCurrency(currentStay.monthlyRent)}/month</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: C.bg, borderRadius: 10, padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>No active stay yet</div>
                    <button onClick={() => navigate('explore')} style={{ ...BTN.primary, padding: '9px 22px' }}>🔍 Explore Rooms</button>
                  </div>
                )}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 12 }}>
                  {MENU.map(item => (
                    <button key={item.key} onClick={() => { if (isMenuDisabled(item.key)) return; item.key === 'explore' ? navigate('explore') : setPage(item.key); }} disabled={isMenuDisabled(item.key)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 10px', cursor: isMenuDisabled(item.key) ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'all 0.2s', opacity: isMenuDisabled(item.key) ? 0.45 : 1 }}>
                      <div style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>💡 Recommended for You</h3>
                {recommendedRooms.length === 0 ? <EmptyState icon="🔍" title="No live rooms available yet" subtitle="Check back later for live listings." /> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>{recommendedRooms.map(room => <RoomCard key={room.id} room={room} onClick={() => setSelectedRoom(room)} />)}</div>}
              </div>
            </div>
          )}
          {page === 'profile' && (
            <div style={{ maxWidth: 700 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>👤 My Profile</h2>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Profile Completion</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: profile?.completionPercentage === 100 ? C.success : C.primary }}>{profile?.completionPercentage || 0}%</span>
                </div>
                <div style={{ background: C.bg, borderRadius: 99, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${profile?.completionPercentage || 0}%`, height: '100%', background: profile?.completionPercentage === 100 ? `linear-gradient(90deg, ${C.success}, #34D399)` : `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
                {!profile?.profileComplete && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.textLight }}>Complete all profile fields to enable AI Verification.</p>}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#003B95,#0071C2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, overflow: 'hidden' }}>
                    {profile?.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt={profile.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👨‍🎓'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>{profile?.displayName}</div>
                    <div style={{ color: C.textLight, fontSize: 14 }}>Student • {profile?.currentLocation || 'Location pending'}</div>
                  </div>
                </div>
                {[
                  ['Student ID', profile?.userCode],
                  ['Full Name', profile?.displayName],
                  ['Mobile Number', profile?.mobileNumber],
                  ['Email ID', profile?.email],
                  ['College Name', profile?.collegeName],
                  ['College Enrollment No.', profile?.enrollmentNumber || profile?.prn],
                  ['Current Location', profile?.currentLocation],
                  ['Gender', profile?.gender === 'MALE' ? 'Male' : profile?.gender === 'FEMALE' ? 'Female' : '-'],
                  ['Identity Verified', profile?.identityVerified ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.textLight, fontSize: 14 }}>{label}</span>
                    <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{value || '-'}</span>
                  </div>
                ))}
                <button onClick={openEditPopup} style={{ ...BTN.primary, marginTop: 16 }}>✏️ Edit Profile</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={signOut} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🚪 Logout</button>
                <button onClick={() => setDeletePopup(true)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🗑️ Delete Account</button>
              </div>
            </div>
          )}
          {page === 'roomActivities' && (
            <RoomActivities
              bookingRequests={bookingRequests}
              currentStay={currentStay}
              currentPayment={currentPayment}
              cancelRequests={cancelRequests}
              ownerComplaints={ownerComplaints}
              onRevokeRequest={handleRevokeRequest}
              onCreateComplaint={handleCreateComplaint}
              onCreateCancelRequest={handleCreateCancelRequest}
              onCloseComplaint={handleCloseComplaint}
              onReComplaint={handleReopenComplaint}
              onSubmitOwnerFeedback={handleOwnerFeedback}
              actionLoading={actionLoading}
            />
          )}
          {page === 'verify' && (
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🪪 Verify Your Profile</h2>
              <div style={{ background: '#FFFBEB', border: '1px solid #D97706', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
                ⚠️ Complete your profile first, then upload your verification files, preview them, confirm them, and submit for AI review.
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
                {verifyStep !== 1 && (
                  <>
                    <h3 style={{ color: C.text, marginBottom: 14 }}>Step 1: Live Photo</h3>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
                      <label style={{ ...BTN.primary, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                        📷 Open Camera
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={event => { setVerifyFiles(current => ({ ...current, liveImage: event.target.files?.[0] || null })); setVerifyConfirmed(false); }} />
                      </label>
                    </div>
                    <h3 style={{ color: C.text, marginBottom: 12 }}>Step 2: Upload Student ID Card</h3>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🪪</div>
                      <label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}>
                        Choose File
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={event => { setVerifyFiles(current => ({ ...current, idCardImage: event.target.files?.[0] || null })); setVerifyConfirmed(false); }} />
                      </label>
                    </div>
                    <ImagePreviewGrid
                      files={[verifyFiles.liveImage, verifyFiles.idCardImage].filter(Boolean)}
                      onRemove={(idx) => {
                        if (idx === 0) setVerifyFiles(current => ({ ...current, liveImage: null }));
                        else setVerifyFiles(current => ({ ...current, idCardImage: null }));
                        setVerifyConfirmed(false);
                      }}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          if (!verifyFiles.liveImage || !verifyFiles.idCardImage) {
                            setActionError('Please select both the live photo and the ID card image.');
                            setVerifyConfirmed(false);
                            return;
                          }
                          setVerifyConfirmed(true);
                          setActionError('');
                        }}
                        style={{
                          ...BTN.outline,
                          flex: 1,
                          minWidth: 180,
                          borderColor: verifyConfirmed ? C.success : C.danger,
                          color: verifyConfirmed ? C.success : C.danger,
                          background: verifyConfirmed ? '#F0FFF4' : '#FEF2F2'
                        }}
                      >
                        Confirm Selected Media
                      </button>
                      <button
                        onClick={handlePerformVerification}
                        disabled={!profile?.profileComplete}
                        style={{
                          ...BTN.primary,
                          flex: 1,
                          minWidth: 180,
                          opacity: profile?.profileComplete ? 1 : 0.5,
                          cursor: profile?.profileComplete ? 'pointer' : 'not-allowed'
                        }}
                      >
                        🤖 Perform AI Verification
                      </button>
                    </div>
                  </>
                )}
                {verifyStep === 1 && (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: 48, display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 12 }}>🔄</div>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>AI Verification in progress...</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>
                      <div style={{ marginBottom: 8 }}>🔍 Scanning face...</div>
                      <div style={{ marginBottom: 8 }}>🎓 Matching face with student ID card...</div>
                      <div style={{ marginBottom: 8 }}>📊 Decoding barcode...</div>
                      <div style={{ marginBottom: 8 }}>🔢 Matching college PRN number with student ID card...</div>
                      <div>🏫 Matching college name with student ID card...</div>
                    </div>
                  </div>
                )}
              </div>
              <VerificationResultPanel result={latestVerification} />
            </div>
          )}
          {page === 'feedback' && (
            <div style={{ maxWidth: 500 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>⭐ Platform Feedback & Rating</h2>
              {feedbackSent ? (
                <div style={{ background: '#F0FFF4', border: `1px solid ${C.success}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🙏</div>
                  <div style={{ fontWeight: 700, color: C.success, fontSize: 18 }}>Thank you for your feedback!</div>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 10 }}>Rate Our Platform</label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setFeedback(current => ({ ...current, rating: star }))} style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', color: star <= feedback.rating ? '#FFB700' : '#D1D5DB' }}>★</button>)}
                  </div>
                  <FTextarea label="Feedback & Suggestions" placeholder="Share your thoughts about Stazy..." value={feedback.text} onChange={event => setFeedback(current => ({ ...current, text: event.target.value }))} rows={5} />
                  <button onClick={handlePlatformFeedback} style={{ ...BTN.primary, width: '100%', padding: 12 }} disabled={actionLoading}>{actionLoading ? 'Submitting...' : 'Submit Feedback 📤'}</button>
                </div>
              )}
            </div>
          )}
          {page === 'complaints' && <SeeComplaints complaints={receivedComplaints} onResolveComplaint={handleResolveComplaint} actionLoading={actionLoading} />}
        </div>
      </div>

      <footer style={{ background: C.primary, color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
        <button onClick={signOut} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🚪 Sign Out</button>
      </footer>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        
        @media (max-width: 768px) {
          /* Make InfoRow responsive */
          .info-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          /* Ensure SCard content doesn't overflow */
          .scard-content {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
