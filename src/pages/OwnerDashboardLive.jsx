import { useEffect, useMemo, useRef, useState } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo } from '../components/shared/SharedComponents';
import { FilePreviewList, PasswordRequirements } from '../components/shared/FormHelpers';
import { ImagePreviewGrid, ProfilePhotoPreview } from '../components/shared/ImagePreview';
import { ComplaintTable, EvidenceViewerPopup, DescriptionViewerPopup } from '../components/ComplaintComponents';
import { PaymentHistoryPopup, PaymentUpdatePopup } from '../components/PaymentComponents';
import { OwnerCancelRequestTable, ViewReasonPopup, RejectCancelRequestPopup } from '../components/CancelRequestComponents';
import Popup from '../components/shared/Popup';
import SlidingTabs from '../components/shared/SlidingTabs';
import BlockedAccountBanner from '../components/BlockedAccountBanner';
import { apiRequest, bootstrapCurrentUser, createMultipartForm, uploadMedia } from '../services/api';
import { apiWithRefresh } from '../services/apiWithRefresh';
import { addWebSocketListener } from '../services/websocket';
import NotificationBell from '../components/shared/NotificationBell';
import { useDashboardData } from '../hooks/useDashboardData';
import { clearSession } from '../services/session';
import { applyRealtimeDashboardEvent } from '../utils/realtimeDashboardData';
import { validatePassword } from '../utils/passwordRules';
import { prepareVerificationDisplay } from '../utils/verificationDisplay';

const MENU = [
  { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { key: 'profile', icon: '👤', label: 'My Profile' },
  { key: 'bookingMgmt', icon: '📅', label: 'Booking Management' },
  { key: 'listingMgmt', icon: '🏢', label: 'Listing Management' },
  { key: 'verify', icon: '🪪', label: 'Verify Profile' },
  { key: 'feedback', icon: '⭐', label: 'Feedback & Rating' },
  { key: 'complaints', icon: '📣', label: 'See Complaints' },
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
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return String(value);
  }
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function formatMonthRange(start, end) {
  if (!start || !end) {
    return '-';
  }
  return `${formatDate(start)} to ${formatDate(end)}`;
}

function latestMessage(complaint, type) {
  return [...(complaint?.messages || [])].reverse().find(message => message.messageType === type) || null;
}

function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();
  const cfg = {
    ACCEPTED: [C.success, '✓'],
    REJECTED: [C.danger, '✕'],
    PENDING: ['#D97706', '⏳'],
    UNDER_PROGRESS: ['#D97706', '⏳'],
    PAID: [C.success, '✓'],
    UNPAID: [C.danger, '✕'],
    LIVE: [C.success, '✓'],
    UNDER_REVIEW: ['#D97706', '⏳'],
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
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function FTextarea({ label, placeholder, rows = 4, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label>}
      <textarea placeholder={placeholder} rows={rows} value={value} onChange={onChange} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function SCard({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <h4 style={{ margin: 0, fontWeight: 800, color: C.text, fontSize: 15 }}>{title}</h4>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14 }}>
      <span style={{ color: C.textLight, minWidth: 180 }}>{label}</span>
      <span style={{ fontWeight: 600, color: C.text }}>{value || '-'}</span>
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
  if (!result) {
    return null;
  }

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
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Face matched</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Owner name matched</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Govt emblem detected</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Government of India header found</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Income Tax Department header found</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ Signature matched</div>
            <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 12px', color: C.success, fontSize: 13 }}>✓ PAN number matched</div>
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
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Face not matched</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Owner name not matched</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ PAN number not matched</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Govt emblem not detected</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Government of India header not found</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Income Tax Department header not found</div>
                <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.danger, fontSize: 13 }}>✗ Signature not matched</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingManagement({
  bookingRequests,
  ownerStays,
  payments,
  cancelRequests,
  studentComplaints,
  connectedStudents,
  onAcceptBooking,
  onRejectBooking,
  onUpdatePayment,
  onCreateComplaint,
  onReviewCancelRequest,
  onCloseComplaint,
  onReopenComplaint,
  onDeleteStudent,
  actionLoading,
}) {
  const [popup, setPopup] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [complaintForm, setComplaintForm] = useState({ studentUserCode: '', title: '', description: '', attachments: [] });
  const [reComplaint, setReComplaint] = useState({ complaintId: null, message: '', attachments: [] });
  const [fcfsSort, setFcfsSort] = useState(false);

  const tabs = [
    { icon: '📋', label: 'Student Room Management' },
    { icon: '💳', label: 'Student Payment Management' },
    { icon: '📣', label: 'Complaint Against Student' },
    { icon: '❌', label: 'Student Room Cancel Requests' },
    { icon: '📊', label: 'Complaint Against Student Status' },
    { icon: '👥', label: 'See All Connected Students' },
  ];

  const staysByStudent = useMemo(
    () => Object.fromEntries(ownerStays.map(stay => [stay.studentUserCode, stay])),
    [ownerStays]
  );

  // Sort booking requests by FCFS (First Come First Serve) if filter is active
  const sortedBookingRequests = useMemo(() => {
    if (!fcfsSort) return bookingRequests;
    return [...bookingRequests].sort((a, b) => {
      const dateA = new Date(a.requestedAt || a.createdAt);
      const dateB = new Date(b.requestedAt || b.createdAt);
      return dateA - dateB; // Earliest first
    });
  }, [bookingRequests, fcfsSort]);

  return (
    <div>
      {popup?.type === 'rejectBooking' && (
        <Popup title="Reject Booking Request" onClose={() => setPopup(null)}>
          <FTextarea label="Reason to Reject" placeholder="Explain why the request is being rejected..." value={rejectReason} onChange={event => setRejectReason(event.target.value)} rows={3} />
          <button onClick={async () => { await onRejectBooking(popup.data.id, rejectReason); setRejectReason(''); setPopup(null); }} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} disabled={actionLoading}>Submit Rejection</button>
        </Popup>
      )}
      {popup?.type === 'payment' && (
        <PaymentUpdatePopup
          payment={popup.data}
          onUpdate={async (data) => {
            await onUpdatePayment(popup.data.id, data);
            setPopup(null);
          }}
          onClose={() => setPopup(null)}
          loading={actionLoading}
        />
      )}
      {popup?.type === 'paymentHistory' && (
        <PaymentHistoryPopup
          payments={popup.data.payments}
          studentName={popup.data.studentName}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'reComplaint' && (
        <Popup title="Re-Complaint Against Student" onClose={() => setPopup(null)}>
          <FTextarea label="Message" placeholder="Provide more context..." value={reComplaint.message} onChange={event => setReComplaint(current => ({ ...current, message: event.target.value }))} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
              Attach Evidence (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={event => setReComplaint(current => ({ ...current, attachments: Array.from(event.target.files || []) }))}
              style={{ width: '100%', padding: '8px', border: `1px solid ${C.border}`, borderRadius: 8 }}
            />
          </div>
          <ImagePreviewGrid
            files={reComplaint.attachments}
            onRemove={(idx) => setReComplaint(current => ({
              ...current,
              attachments: current.attachments.filter((_, i) => i !== idx)
            }))}
          />
          <button onClick={async () => { await onReopenComplaint(reComplaint.complaintId, reComplaint.message, reComplaint.attachments); setReComplaint({ complaintId: null, message: '', attachments: [] }); setPopup(null); }} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Send Re-Complaint</button>
        </Popup>
      )}
      {popup?.type === 'viewReason' && (
        <ViewReasonPopup
          title="Student Cancel Reason"
          reason={popup.data.reason}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'rejectCancel' && (
        <RejectCancelRequestPopup
          request={popup.data}
          onReject={async (message) => {
            await onReviewCancelRequest(popup.data.id, false, message);
            setPopup(null);
          }}
          onClose={() => setPopup(null)}
          loading={actionLoading}
        />
      )}

      <SlidingTabs tabs={tabs}>
        <div>
          {bookingRequests.length === 0 ? (
            <EmptyState icon="📭" title="No booking requests" subtitle="Incoming student requests will show up here." />
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setFcfsSort(!fcfsSort)}
                  style={{
                    background: fcfsSort ? C.primary : '#fff',
                    color: fcfsSort ? '#fff' : C.primary,
                    border: `1px solid ${C.primary}`,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {fcfsSort ? '✓' : '⏱️'} FCFS Sort {fcfsSort ? '(Active)' : ''}
                </button>
              </div>
              <TableWrap headers={['Booking ID', 'Student Name', 'College', 'Date Requested', 'Listing', 'Space Available', 'Actions']}>
                {sortedBookingRequests.map(request => (
                  <TR key={request.id}>
                    <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{String(request.id).slice(0, 8)}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{request.studentName}</span></TD>
                    <TD>{request.studentCollegeName || '-'}</TD>
                    <TD>{formatDateTime(request.requestedAt)}</TD>
                    <TD>{request.listingTitle}</TD>
                    <TD>{request.availableCapacity}/{request.totalCapacity}</TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onAcceptBooking(request.id)} style={{ background: '#F0FFF4', color: C.success, border: '1px solid #86EFAC', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || request.status !== 'PENDING'}>✓ Accept</button>
                        <button onClick={() => { setPopup({ type: 'rejectBooking', data: request }); setRejectReason(''); }} style={{ background: '#FEF2F2', color: C.danger, border: '1px solid #FCA5A5', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || request.status !== 'PENDING'}>✕ Reject</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </>
          )}
        </div>

        <div>
          {payments.length === 0 ? (
            <EmptyState icon="💳" title="No rent records yet" subtitle="Rent payments will appear here once students move in." />
          ) : (
            <TableWrap headers={['Student', 'Listing', 'Room', 'Month Range', 'Status', 'Next Due Date', 'Actions']}>
              {payments.map(payment => (
                <TR key={payment.id}>
                  <TD><div style={{ fontWeight: 700 }}>{payment.studentName}</div><div style={{ color: C.textLight, fontSize: 11 }}>{payment.studentUserCode}</div></TD>
                  <TD>{payment.listingTitle}</TD>
                  <TD>{payment.roomCode}</TD>
                  <TD>{formatMonthRange(payment.periodStart, payment.periodEnd)}</TD>
                  <TD><StatusBadge status={payment.status} /></TD>
                  <TD>{formatDate(payment.dueDate)}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setPopup({ type: 'payment', data: payment })}
                        style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => {
                          const studentPayments = payments.filter(p => p.studentUserCode === payment.studentUserCode);
                          setPopup({
                            type: 'paymentHistory',
                            data: {
                              payments: studentPayments,
                              studentName: payment.studentName
                            }
                          });
                        }}
                        style={{ ...BTN.ghost, padding: '6px 12px', fontSize: 12, color: C.secondary }}
                      >
                        History
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
        </div>

        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, maxWidth: 560 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Student</label>
              <select value={complaintForm.studentUserCode} onChange={event => setComplaintForm(current => ({ ...current, studentUserCode: event.target.value }))} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
                <option value="">Select student</option>
                {connectedStudents.map(student => <option key={student.studentUserCode} value={student.studentUserCode}>{student.studentName} ({student.studentUserCode})</option>)}
              </select>
            </div>
            <FInput label="Issue Title" placeholder="Brief title of your complaint" value={complaintForm.title} onChange={event => setComplaintForm(current => ({ ...current, title: event.target.value }))} />
            <FTextarea label="Describe Issue in Detail" placeholder="Provide full details of the issue..." value={complaintForm.description} onChange={event => setComplaintForm(current => ({ ...current, description: event.target.value }))} />
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
            <button onClick={async () => { const stay = staysByStudent[complaintForm.studentUserCode]; await onCreateComplaint({ ...complaintForm, relatedStayId: stay?.id, relatedListingId: stay?.listingId }); setComplaintForm({ studentUserCode: '', title: '', description: '', attachments: [] }); }} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Submit Complaint to Student</button>
          </div>
        </div>

        <div>
          <OwnerCancelRequestTable
            requests={cancelRequests}
            onViewReason={(request) => setPopup({ type: 'viewReason', data: request })}
            onAccept={(requestId) => onReviewCancelRequest(requestId, true, '')}
            onReject={(request) => setPopup({ type: 'rejectCancel', data: request })}
            onViewPaymentHistory={(request) => {
              const studentPayments = payments.filter(p => p.studentUserCode === request.studentUserCode);
              setPopup({
                type: 'paymentHistory',
                data: {
                  payments: studentPayments,
                  studentName: request.studentName || request.studentDisplayName
                }
              });
            }}
            loading={actionLoading}
          />
        </div>

        <div>
          <ComplaintTable
            complaints={studentComplaints}
            isOwner={false}
            onViewEvidence={(attachments) => setPopup({ type: 'evidence', data: attachments })}
            onViewDescription={(title, description) => setPopup({ type: 'description', title, data: description })}
            onViewJustification={(message) => setPopup({ type: 'justification', data: message })}
            onReComplaint={(complaintId) => {
              setPopup({ type: 'reComplaint' });
              setReComplaint({ complaintId, message: '', attachments: [] });
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
              title="Student Justification"
              description={popup.data}
              onClose={() => setPopup(null)}
            />
          )}
        </div>

        <div>
          {connectedStudents.length === 0 ? (
            <EmptyState icon="👥" title="No connected students yet" subtitle="Students with active stays will appear here." />
          ) : (
            <TableWrap headers={['Student ID', 'Student Name', 'College Name', 'Listing', 'Actions']}>
              {connectedStudents.map(student => (
                <TR key={student.studentUserCode}>
                  <TD>{student.studentUserCode}</TD>
                  <TD>{student.studentName}</TD>
                  <TD>{student.studentCollegeName || '-'}</TD>
                  <TD>{student.listingTitle}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setPopup({ type: 'student', data: student })} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>Details</button>
                      <button 
                        onClick={() => setPopup({ type: 'deleteStudent', data: student })} 
                        style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12, color: C.danger, borderColor: C.danger }}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
        </div>
      </SlidingTabs>

      {popup?.type === 'student' && (
        <Popup title="Student Profile Details" onClose={() => setPopup(null)}>
          <InfoRow label="Student ID" value={popup.data.studentUserCode} />
          <InfoRow label="Full Name" value={popup.data.studentName} />
          <InfoRow label="College" value={popup.data.studentCollegeName} />
          <InfoRow label="Phone" value={popup.data.studentPhone} />
          <InfoRow label="Email" value={popup.data.studentEmail} />
          <InfoRow label="Location" value={popup.data.studentCurrentLocation} />
          <InfoRow label="Enrollment No." value={popup.data.studentEnrollmentNumber} />
        </Popup>
      )}
      {popup?.type === 'deleteStudent' && (
        <Popup title="Delete Student Connection" onClose={() => setPopup(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Are you sure you want to delete this student connection?
            </div>
            <div style={{ fontSize: 13, color: C.textLight, marginBottom: 12 }}>
              Student: {popup.data.studentName} ({popup.data.studentUserCode})
            </div>
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 12, fontSize: 13, color: C.danger }}>
              ⚠️ This will permanently delete:
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>Active stay record</li>
                <li>All payment records</li>
                <li>All complaints between you and this student</li>
              </ul>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={async () => {
                await onDeleteStudent(popup.data.id);
                setPopup(null);
              }}
              disabled={actionLoading}
              style={{ ...BTN.primary, flex: 1, padding: 12, background: C.danger }}
            >
              {actionLoading ? 'Deleting...' : 'Delete Connection'}
            </button>
            <button
              onClick={() => setPopup(null)}
              disabled={actionLoading}
              style={{ ...BTN.outline, padding: '12px 24px' }}
            >
              Cancel
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
}

function ReceivedComplaints({ complaints, onResolveComplaint, actionLoading }) {
  const [popup, setPopup] = useState(null);
  const [resolution, setResolution] = useState({ message: '', attachments: [] });

  const handleSubmit = async () => {
    await onResolveComplaint(popup.id, resolution.message, resolution.attachments);
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

      <ComplaintTable
        complaints={complaints}
        isOwner={true}
        onViewEvidence={(attachments) => setPopup({ type: 'evidence', data: attachments })}
        onViewDescription={(title, description) => setPopup({ type: 'description', title, data: description })}
        onResolve={(complaintId) => setPopup({ type: 'resolve', id: complaintId })}
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

export default function OwnerDashboardLive({ user, setUser, navigate }) {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [feedback, setFeedback] = useState({ text: '', rating: 0 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  const [editPwdGate, setEditPwdGate] = useState('');
  const [editPwdErr, setEditPwdErr] = useState('');
  const [editPwdConfirmed, setEditPwdConfirmed] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '', pan: '', pgName: '', cityId: '', pgAddress: '', pincode: '', password: '', confirmPassword: '', photo: null, existingPhotoUrl: null });
  const [deletePopup, setDeletePopup] = useState(false);
  const [pwdVerify, setPwdVerify] = useState('');
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyFiles, setVerifyFiles] = useState({ liveImage: null, panImage: null, userSignature: null });
  const [verifyConfirmed, setVerifyConfirmed] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [listingForm, setListingForm] = useState({ title: '', cityId: '', address: '', rentAmount: '', roomKind: 'PG', genderCategory: 'BOTH', totalCapacity: '', amenitiesCsv: '', description: '', roomImages: [], ownerPhoto: null, ownerLiveVideo: null, selectedAdminId: null });
  const [listingConfirmed, setListingConfirmed] = useState(false);
  const [listingPopup, setListingPopup] = useState(null);
  const [adminSelectionPopup, setAdminSelectionPopup] = useState({ open: false, admins: [] });
  const [listingTab, setListingTab] = useState(0);
  const [successToast, setSuccessToast] = useState(null);
  const [optimisticListings, setOptimisticListings] = useState([]);
  const [optimisticBookings, setOptimisticBookings] = useState({ removed: new Set(), updated: new Map() });
  const [optimisticRemovedListings, setOptimisticRemovedListings] = useState(new Set());
  const [optimisticPayments, setOptimisticPayments] = useState(new Map());
  const [optimisticCancelRequests, setOptimisticCancelRequests] = useState(new Map());
  const [optimisticComplaints, setOptimisticComplaints] = useState(new Map());
  const notifRef = useRef(null);

  // Use the new dashboard data hook
  const { data, loading: pageLoading, error: pageError, refresh, mutateData } = useDashboardData('owner');
  const profile = data.profile;
  const ownerListings = data.listings || [];
  const serverBookingRequests = data.bookingRequests || [];
  const ownerStays = data.activeStays || [];
  const serverPayments = data.payments || [];
  
  // Merge optimistic bookings with server bookings
  // Filter out removed bookings and apply status updates
  const bookingRequests = useMemo(() => {
    return serverBookingRequests
      .filter(booking => !optimisticBookings.removed.has(booking.id))
      .map(booking => {
        const update = optimisticBookings.updated.get(booking.id);
        return update ? { ...booking, ...update } : booking;
      });
  }, [serverBookingRequests, optimisticBookings]);
  
  // Merge optimistic payments
  const payments = serverPayments.map(p =>
    optimisticPayments.has(p.id) ? { ...p, ...optimisticPayments.get(p.id) } : p
  );
  
  // Merge optimistic cancel requests
  const cancelRequests = (data.cancelRequests || []).map(cr =>
    optimisticCancelRequests.has(cr.id) ? { ...cr, ...optimisticCancelRequests.get(cr.id) } : cr
  );
  
  // Merge optimistic complaints
  const filedComplaints = (data.filedComplaints || []).map(c =>
    optimisticComplaints.has(c.id) ? { ...c, ...optimisticComplaints.get(c.id) } : c
  );
  const receivedComplaints = (data.receivedComplaints || []).map(c =>
    optimisticComplaints.has(c.id) ? { ...c, ...optimisticComplaints.get(c.id) } : c
  );
  const liveNotifications = data.notifications || [];
  const rawVerificationHistory = data.verificationHistory || [];
  
  // Process verification history through prepareVerificationDisplay to get failedReasons
  const verificationHistory = useMemo(
    () => rawVerificationHistory.map(v => prepareVerificationDisplay(v)),
    [rawVerificationHistory]
  );

  // Merge optimistic listings with server listings
  // CRITICAL: Filter out server listings that have optimistic versions AND filter out removed listings
  const allListings = useMemo(() => {
    const optimisticIds = new Set(optimisticListings.map(l => l.id));
    const serverListings = ownerListings
      .filter(l => !optimisticIds.has(l.id))
      .filter(l => !optimisticRemovedListings.has(l.id)); // Filter out deleted listings
    
    // Transform server listings to extract ownerPhotoUrl from media array
    const transformedServerListings = serverListings.map(listing => {
      if (!listing.ownerPhotoUrl && listing.media) {
        const ownerPhotoMedia = listing.media.find(m => m.mediaType === 'OWNER_PHOTO');
        return {
          ...listing,
          ownerPhotoUrl: ownerPhotoMedia?.url || null
        };
      }
      return listing;
    });
    
    return [...optimisticListings, ...transformedServerListings];
  }, [optimisticListings, ownerListings, optimisticRemovedListings]);
  
  const liveListings = allListings.filter(listing => listing.status === 'LIVE');
  const pendingListings = allListings.filter(listing => listing.status === 'UNDER_REVIEW');
  const rejectedListings = allListings.filter(listing => listing.status === 'REJECTED');
  const studentComplaints = filedComplaints.filter(complaint => complaint.againstRoleCode === 'STUDENT');
  const latestVerification = verificationResult || verificationHistory[0] || null;
  const isFullyUnlocked = (profile?.completionPercentage || 0) >= 100;
  const isMenuDisabled = key => !isFullyUnlocked && !['dashboard', 'profile', 'verify'].includes(key);
  const connectedStudents = useMemo(() => {
    const unique = new Map();
    ownerStays.forEach(stay => {
      if (!unique.has(stay.studentUserCode)) {
        unique.set(stay.studentUserCode, stay);
      }
    });
    return Array.from(unique.values());
  }, [ownerStays]);

  const syncUser = async () => {
    const refreshedUser = await bootstrapCurrentUser();
    setUser(refreshedUser);
    return refreshedUser;
  };

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      return;
    }

    const unsubscribe = addWebSocketListener((topic, payload) => {
      if (topic !== 'user' && topic !== 'role' && topic !== 'global') {
        return;
      }

      mutateData(current => applyRealtimeDashboardEvent('owner', current, topic, payload));
    });

    return () => unsubscribe();
  }, [user, mutateData]);

  // Load cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cityResponse = await apiRequest('/api/public/cities');
        setCities(cityResponse || []);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
  }, []);

  // Initialize edit form and listing form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.displayName || '',
        email: profile.email || '',
        mobile: profile.mobileNumber || '',
        pan: profile.panNumber || '',
        pgName: profile.pgName || '',
        cityId: profile.cityId || '',
        pgAddress: profile.addressLineOne || '',
        pincode: profile.pincode || '',
        password: '',
        confirmPassword: '',
        photo: null,
        existingPhotoUrl: profile.profilePhotoUrl || null,
      });
      // For listing form: only set cityId (owner's city), keep address empty
      setListingForm(current => ({
        ...current,
        cityId: current.cityId || profile.cityId || '',
        // address is intentionally NOT auto-filled - user must enter manually
      }));
    }
  }, [profile]);

  // REMOVED: Aggressive refresh on tab change causes stale data to overwrite optimistic updates
  // Data is already fresh from useDashboardData hook and gets updated after API calls complete

  if (!user || user.role !== 'owner') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, color: C.text }}>Owner sign-in required</h2>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 18 }}>Please sign in with an owner account to access this dashboard.</p>
          <button onClick={() => navigate('login')} style={{ ...BTN.primary, padding: '10px 20px' }}>Go to Login</button>
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

  const ensureListingAccess = () => {
    if (!profile?.profileComplete) {
      setActionError('Complete your profile to 100% before creating or updating listings.');
      return false;
    }
    if (!profile?.identityVerified) {
      setActionError('Complete owner verification before creating or updating listings.');
      return false;
    }
    return true;
  };

  const openEditPopup = () => {
    // Re-initialize editForm with current profile data when opening popup
    if (profile) {
      console.log('Opening edit popup with profile:', profile);
      setEditForm({
        fullName: profile.displayName || '',
        email: profile.email || '',
        mobile: profile.mobileNumber || '',
        pan: profile.panNumber || '',
        pgName: profile.pgName || '',
        cityId: profile.cityId || '',
        pgAddress: profile.addressLineOne || '',
        pincode: profile.pincode || '',
        password: '',
        confirmPassword: '',
        photo: null,
        existingPhotoUrl: profile.profilePhotoUrl || null, // Track existing photo
      });
      console.log('Edit form initialized with pgAddress:', profile.addressLineOne);
    }
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
      
      const profileData = {
        displayName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        mobileNumber: editForm.mobile?.trim() || null,
        panNumber: editForm.pan?.trim() || null,
        pgName: editForm.pgName?.trim() || null,
        cityId: editForm.cityId || undefined,
        pgAddress: editForm.pgAddress?.trim() || null,
        pincode: editForm.pincode?.trim() || null,
        ...photoPayload,
      };
      
      console.log('Saving profile with data:', profileData);
      
      await apiWithRefresh.updateProfile(profileData, 'OWNER');
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
      
      // Refresh user session and dashboard data
      await syncUser();
      await refresh(); // Force dashboard refresh
      
      setSuccessToast('Profile saved successfully! ✓');
      setTimeout(() => setSuccessToast(null), 2500);
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

  const handleCreateListing = async () => {
    if (!ensureListingAccess()) {
      return;
    }
    
    // Validate required fields
    if (!listingForm.title || !listingForm.title.trim()) {
      setActionError('Please enter a room title.');
      return;
    }
    if (!listingForm.cityId) {
      setActionError('Please select a city.');
      return;
    }
    if (!listingForm.address || !listingForm.address.trim()) {
      setActionError('Please enter the full address.');
      return;
    }
    if (!listingForm.rentAmount || !listingForm.rentAmount.trim()) {
      setActionError('Please enter the monthly rent amount.');
      return;
    }
    if (!listingForm.totalCapacity || !listingForm.totalCapacity.trim()) {
      setActionError('Please enter the total capacity.');
      return;
    }
    if (!listingForm.genderCategory) {
      setActionError('Please select the gender category.');
      return;
    }
    
    // Owner photo is required - must be uploaded during listing creation
    if (!listingForm.ownerPhoto) {
      setActionError('Please upload the owner photo required for AI listing verification.');
      return;
    }
    
    if (!listingConfirmed) {
      setActionError('Please preview and confirm your listing media first.');
      return;
    }
    
    // Check for matching admin before proceeding
    try {
      console.log('Checking for matching admin...');
      const matchingAdminResponse = await apiWithRefresh.getMatchingAdmin();
      console.log('Matching admin response:', matchingAdminResponse);
      console.log('Response type:', typeof matchingAdminResponse);
      console.log('Has userId?', matchingAdminResponse?.userId);
      
      // apiRequest returns the admin object directly if found, or full payload if data is null
      // Check if we have a valid admin by looking for userId property
      if (!matchingAdminResponse?.userId) {
        console.log('No matching admin found, fetching all available admins...');
        // No matching admin found - show admin selection popup
        const availableAdminsResponse = await apiWithRefresh.getAvailableAdmins();
        
        console.log('Available admins response:', availableAdminsResponse);
        console.log('Available admins type:', typeof availableAdminsResponse);
        console.log('Available admins length:', availableAdminsResponse?.length);
        
        if (!availableAdminsResponse || availableAdminsResponse.length === 0) {
          console.error('No active admins available');
          setActionError('No active admins available. Please contact support.');
          return;
        }
        
        console.log('Opening admin selection popup with admins:', availableAdminsResponse);
        // Show admin selection popup
        setAdminSelectionPopup({
          open: true,
          admins: availableAdminsResponse,
        });
        return; // Stop here and wait for admin selection
      }
      
      // Matching admin found - use the userId from the response
      console.log('Matching admin found, proceeding with admin ID:', matchingAdminResponse.userId);
      await proceedWithListingCreation(matchingAdminResponse.userId);
      
    } catch (error) {
      console.error('Failed to check for matching admin:', error);
      console.error('Error details:', error.message, error.stack);
      setActionError('Failed to verify admin assignment. Please try again.');
      return;
    }
  };
  
  const proceedWithListingCreation = async (selectedAdminId = null) => {
    // Build location string from city and address
    const selectedCity = cities.find(c => c.cityId === listingForm.cityId);
    const locationString = selectedCity ? `${listingForm.address.trim()}, ${selectedCity.cityName}` : listingForm.address.trim();
    
    const listingData = {
      title: listingForm.title.trim(),
      location: locationString,
      description: listingForm.description?.trim() || '',
      rentAmount: listingForm.rentAmount.trim(),
      roomKind: listingForm.roomKind,
      genderCategory: listingForm.genderCategory,
      totalCapacity: listingForm.totalCapacity.trim(),
      amenitiesCsv: listingForm.amenitiesCsv?.trim() || '',
      roomImages: listingForm.roomImages,
      ownerPhoto: listingForm.ownerPhoto,
      ownerLiveVideo: listingForm.ownerLiveVideo,
      selectedAdminId: selectedAdminId || listingForm.selectedAdminId,
    };
    
    // ===== OPTIMISTIC UI UPDATE =====
    // Create temporary optimistic listing object
    const optimisticListing = {
      id: `temp-${Date.now()}`, // Temporary ID
      title: listingData.title,
      location: listingData.location,
      description: listingData.description,
      rentAmount: listingData.rentAmount,
      roomKind: listingData.roomKind,
      genderCategory: listingData.genderCategory,
      totalCapacity: parseInt(listingData.totalCapacity),
      availableCapacity: parseInt(listingData.totalCapacity),
      amenities: listingData.amenitiesCsv ? listingData.amenitiesCsv.split(',').map(a => a.trim()) : [],
      status: 'UNDER_REVIEW', // New listings go to UNDER_REVIEW
      latestFakeDetectionStatus: 'PENDING',
      isOptimistic: true, // Flag to identify optimistic listings
    };
    
    // 1. Add optimistic listing IMMEDIATELY
    setOptimisticListings(current => [optimisticListing, ...current]);
    
    // 2. Show success toast IMMEDIATELY
    setSuccessToast('Request sent to admin successfully! ✓');
    setActionError('');
    
    // 3. Reset form IMMEDIATELY
    setListingForm({ 
      title: '', 
      cityId: profile?.cityId || '', 
      address: '', 
      rentAmount: '', 
      roomKind: 'PG', 
      genderCategory: 'BOTH', 
      totalCapacity: '', 
      amenitiesCsv: '', 
      description: '', 
      roomImages: [], 
      ownerPhoto: null, 
      ownerLiveVideo: null,
      selectedAdminId: null
    });
    setListingConfirmed(false);
    
    // 4. Switch to Pending Review tab immediately (listing already visible!)
    setTimeout(() => {
      setSuccessToast(null);
      setListingTab(2); // Tab 2 = Pending Review
    }, 1500); // Reduced from 2s to 1.5s for faster navigation
    
    // ===== BACKGROUND API CALL =====
    // Call API in background without blocking UI
    (async () => {
      try {
        console.log('Creating listing in background:', listingData);
        
        // Make API call (non-blocking) and get the created listing response
        const createdListingResponse = await apiWithRefresh.createListing(createMultipartForm(listingData));
        
        console.log('Listing created successfully, response:', createdListingResponse);
        
        // CRITICAL FIX: Replace optimistic listing with FULL API response
        // Extract ownerPhotoUrl from media array if not already present
        if (createdListingResponse) {
          const transformedResponse = {
            ...createdListingResponse,
            ownerPhotoUrl: createdListingResponse.ownerPhotoUrl || 
              createdListingResponse.media?.find(m => m.mediaType === 'OWNER_PHOTO')?.url || null
          };
          
          setOptimisticListings(current => 
            current.map(listing => 
              listing.id === optimisticListing.id && listing.isOptimistic
                ? { ...transformedResponse, isOptimistic: true } // Keep optimistic flag
                : listing
            )
          );
          
          // After a delay, refresh to get server data
          // Keep optimistic listing for longer to ensure server has processed the creation
          setTimeout(async () => {
            await refresh();
            
            // Wait 3 seconds after refresh to ensure backend has processed
            // The merge logic prevents stale server data from overwriting optimistic state
            setTimeout(() => {
              setOptimisticListings(current => 
                current.filter(listing => listing.id !== optimisticListing.id)
              );
            }, 3000);
          }, 1000);
        } else {
          // If no response, just refresh to get server data
          await refresh();
          setOptimisticListings(current => 
            current.filter(listing => listing.id !== optimisticListing.id)
          );
        }
        
      } catch (error) {
        console.error('Failed to create listing:', error);
        
        // Remove failed optimistic listing
        setOptimisticListings(current => 
          current.filter(listing => listing.id !== optimisticListing.id)
        );
        
        // Show error toast if API fails
        setSuccessToast(null);
        setActionError(`Failed to create listing: ${error.message}. Please try again.`);
      }
    })();
  };


  const handleUpdateListing = async () => {
    if (!ensureListingAccess()) {
      return;
    }
    
    const listingId = listingPopup.data.id;
    const wasRejected = listingPopup.data.status === 'REJECTED';
    
    // Detect if media is being changed
    const hasNewMedia = (
      (listingPopup.data.roomImages && listingPopup.data.roomImages.length > 0) ||
      (listingPopup.data.ownerPhoto) ||
      (listingPopup.data.ownerLiveVideo)
    );
    
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Show success toast IMMEDIATELY
    if (hasNewMedia) {
      setSuccessToast('Listing updated! Media changes require re-verification. ✓');
    } else {
      setSuccessToast('Listing updated! ✓');
    }
    setActionError('');
    
    // 2. Close popup IMMEDIATELY
    setListingPopup(null);
    
    // 3. Create optimistic updated listing
    const optimisticUpdatedListing = {
      ...listingPopup.data,
      // Only change status to UNDER_REVIEW if media changed or was rejected
      status: hasNewMedia || wasRejected ? 'UNDER_REVIEW' : listingPopup.data.status,
      latestFakeDetectionStatus: hasNewMedia || wasRejected ? 'PENDING' : listingPopup.data.latestFakeDetectionStatus,
      amenities: listingPopup.data.amenitiesCsv ? listingPopup.data.amenitiesCsv.split(',').map(a => a.trim()) : [],
      isOptimistic: true,
      updatedAt: new Date().toISOString(),
    };
    
    // 4. If listing was rejected, add to optimistic listings (will appear in Live tab)
    if (wasRejected) {
      setOptimisticListings(current => [optimisticUpdatedListing, ...current]);
    } else {
      // Update existing listing in optimistic state
      setOptimisticListings(current => {
        const existing = current.find(l => l.id === listingId);
        if (existing) {
          return current.map(l => l.id === listingId ? optimisticUpdatedListing : l);
        }
        return [optimisticUpdatedListing, ...current];
      });
    }
    
    // 5. Switch to appropriate tab after 1.5s
    setTimeout(() => {
      setSuccessToast(null);
      // If media changed, go to Pending tab (index 2), otherwise stay on Live tab (index 1)
      setListingTab(hasNewMedia || wasRejected ? 2 : 1);
    }, 1500);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        console.log('Updating listing in background:', listingId);
        
        // Make API call (non-blocking) and get the updated listing response
        const updatedListingResponse = await apiWithRefresh.updateListing(listingId, createMultipartForm({
          title: listingPopup.data.title,
          location: listingPopup.data.location,
          description: listingPopup.data.description,
          rentAmount: listingPopup.data.rentAmount,
          roomKind: listingPopup.data.roomKind,
          genderCategory: listingPopup.data.genderCategory,
          totalCapacity: listingPopup.data.totalCapacity,
          amenitiesCsv: listingPopup.data.amenitiesCsv,
          roomImages: listingPopup.data.roomImages,
          ownerPhoto: listingPopup.data.ownerPhoto,
          ownerLiveVideo: listingPopup.data.ownerLiveVideo,
        }));
        
        console.log('Listing updated successfully, response:', updatedListingResponse);
        
        // CRITICAL FIX: Replace optimistic listing with FULL API response
        // Extract ownerPhotoUrl from media array if not already present
        if (updatedListingResponse) {
          const transformedResponse = {
            ...updatedListingResponse,
            ownerPhotoUrl: updatedListingResponse.ownerPhotoUrl || 
              updatedListingResponse.media?.find(m => m.mediaType === 'OWNER_PHOTO')?.url || null,
            // CRITICAL: Preserve optimistic status if API hasn't updated yet
            status: updatedListingResponse.status === 'REJECTED' && wasRejected 
              ? 'UNDER_REVIEW' // Keep optimistic status if server hasn't updated
              : updatedListingResponse.status
          };
          
          setOptimisticListings(current => 
            current.map(listing => 
              listing.id === listingId && listing.isOptimistic
                ? { ...transformedResponse, isOptimistic: true } // Keep optimistic flag to prevent overwrite
                : listing
            )
          );
          
          // After a delay, refresh to get server data
          // Keep optimistic listing for longer to ensure server has processed the update
          setTimeout(async () => {
            await refresh();
            
            // Wait 3 seconds after refresh to ensure backend has processed
            // The merge logic prevents stale server data from overwriting optimistic state
            setTimeout(() => {
              setOptimisticListings(current => 
                current.filter(listing => listing.id !== listingId)
              );
            }, 3000);
          }, 1000);
        } else {
          // If no response, just refresh to get server data
          await refresh();
          setOptimisticListings(current => 
            current.filter(listing => listing.id !== listingId || !listing.isOptimistic)
          );
        }
        
      } catch (error) {
        console.error('Failed to update listing:', error);
        
        // Remove failed optimistic listing
        setOptimisticListings(current => 
          current.filter(listing => listing.id !== listingId || !listing.isOptimistic)
        );
        
        // Show error toast
        setSuccessToast(null);
        setActionError(`Failed to update listing: ${error.message}. Please try again.`);
      }
    })();
  };

  const handleDeleteListing = (listingId) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Remove listing immediately
    setOptimisticRemovedListings(current => new Set([...current, listingId]));
    
    // 2. Show success toast
    setSuccessToast('Listing deleted! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiWithRefresh.deleteListing(listingId);
        await refresh();
        
        // Clean up optimistic state after refresh
        setTimeout(() => {
          setOptimisticRemovedListings(current => {
            const newSet = new Set(current);
            newSet.delete(listingId);
            return newSet;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to delete listing:', error);
        
        // Revert: restore the listing
        setOptimisticRemovedListings(current => {
          const newSet = new Set(current);
          newSet.delete(listingId);
          return newSet;
        });
        
        setSuccessToast(null);
        setActionError(`Failed to delete listing: ${error.message}`);
      }
    })();
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
    try {
      const result = await apiRequest('/api/verifications/owner', {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: createMultipartForm({
          liveImage: verifyFiles.liveImage,
          panImage: verifyFiles.panImage,
          userSignature: verifyFiles.userSignature,
          ownerName: profile.displayName,
          panNumber: profile.panNumber,
        }),
      });
      const normalizedResult = prepareVerificationDisplay(result);
      setVerificationResult(normalizedResult);
      await syncUser();
      await refresh();
      setVerifyStep(3);
    } catch (error) {
      setActionError(error.message);
      setVerifyStep(3);
      setVerificationResult(prepareVerificationDisplay({ verified: false, status: 'FAILED', message: error.message }));
    }
  };

  const handlePlatformFeedback = () => {
    const previousFeedback = { ...feedback };
    setFeedbackSent(true);
    setFeedback({ text: '', rating: 0 });
    setSuccessToast('Feedback submitted! ✓');
    setTimeout(() => setSuccessToast(null), 2500);
    
    (async () => {
      try {
        await apiWithRefresh.submitFeedback({
          feedbackScope: 'PLATFORM',
          rating: previousFeedback.rating,
          message: previousFeedback.text,
          location: profile?.locality || profile?.addressLineOne || '',
        });
      } catch (error) {
        setFeedbackSent(false);
        setFeedback(previousFeedback);
        setSuccessToast(null);
        setActionError(`Failed to submit feedback: ${error.message}`);
      }
    })();
  };

  const handleAcceptBooking = async (requestId) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Remove booking from list IMMEDIATELY
    setOptimisticBookings(current => ({
      ...current,
      removed: new Set([...current.removed, requestId])
    }));
    
    // 2. Show success toast
    setSuccessToast('Booking accepted! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiWithRefresh.acceptBooking(requestId);
        
        // Row stays hidden permanently — server will no longer return this
        // booking in future refreshes. Do NOT clear the removed set here.
      } catch (error) {
        console.error('Failed to accept booking:', error);
        
        // Revert: restore the row only on failure
        setOptimisticBookings(current => {
          const newRemoved = new Set(current.removed);
          newRemoved.delete(requestId);
          return { ...current, removed: newRemoved };
        });
        
        setSuccessToast(null);
        setActionError(`Failed to accept booking: ${error.message}`);
      }
    })();
  };

  const handleRejectBooking = async (requestId, reason) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Remove booking from list IMMEDIATELY
    setOptimisticBookings(current => ({
      ...current,
      removed: new Set([...current.removed, requestId])
    }));
    
    // 2. Show success toast
    setSuccessToast('Booking rejected! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiWithRefresh.rejectBooking(requestId, reason);
        
        // Row stays hidden permanently. Do NOT clear the removed set here.
      } catch (error) {
        console.error('Failed to reject booking:', error);
        
        // Revert: restore the row only on failure
        setOptimisticBookings(current => {
          const newRemoved = new Set(current.removed);
          newRemoved.delete(requestId);
          return { ...current, removed: newRemoved };
        });
        
        setSuccessToast(null);
        setActionError(`Failed to reject booking: ${error.message}`);
      }
    })();
  };

  const handleUpdatePayment = (paymentId, paymentData) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Apply update immediately
    setOptimisticPayments(current => new Map(current).set(paymentId, paymentData));
    
    // 2. Show success toast
    setSuccessToast('Payment updated! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiWithRefresh.updatePayment(paymentId, paymentData);
        await refresh();
        
        // Clear optimistic payment after refresh
        setTimeout(() => {
          setOptimisticPayments(current => {
            const newMap = new Map(current);
            newMap.delete(paymentId);
            return newMap;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to update payment:', error);
        
        // Revert: remove optimistic update
        setOptimisticPayments(current => {
          const newMap = new Map(current);
          newMap.delete(paymentId);
          return newMap;
        });
        
        setSuccessToast(null);
        setActionError(`Failed to update payment: ${error.message}`);
      }
    })();
  };

  const handleCreateComplaint = ({ studentUserCode, title, description, attachments, relatedStayId, relatedListingId }) => {
    setSuccessToast('Complaint submitted to student! ✓');
    setTimeout(() => setSuccessToast(null), 2500);
    
    (async () => {
      try {
        await apiRequest('/api/complaints', {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: createMultipartForm({
            againstUserCode: studentUserCode,
            title,
            description,
            relatedStayId,
            relatedListingId,
            attachments,
          }),
        });
        await refresh();
      } catch (error) {
        setSuccessToast(null);
        setActionError(`Failed to submit complaint: ${error.message}`);
      }
    })();
  };

  const handleReviewCancelRequest = (cancelRequestId, accept, ownerReason) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Update status immediately
    setOptimisticCancelRequests(current => 
      new Map(current).set(cancelRequestId, { status: accept ? 'ACCEPTED' : 'REJECTED' })
    );
    
    // 2. Show success toast
    setSuccessToast('Cancel request reviewed! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiWithRefresh.reviewCancelRequest(cancelRequestId, accept, ownerReason);
        await refresh();
        
        // Clear optimistic state after refresh
        setTimeout(() => {
          setOptimisticCancelRequests(current => {
            const newMap = new Map(current);
            newMap.delete(cancelRequestId);
            return newMap;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to review cancel request:', error);
        
        // Revert: remove optimistic update
        setOptimisticCancelRequests(current => {
          const newMap = new Map(current);
          newMap.delete(cancelRequestId);
          return newMap;
        });
        
        setSuccessToast(null);
        setActionError(`Failed to review cancel request: ${error.message}`);
      }
    })();
  };

  const handleCloseComplaint = (complaintId) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Update status immediately
    setOptimisticComplaints(current => new Map(current).set(complaintId, { status: 'CLOSED' }));
    
    // 2. Show success toast
    setSuccessToast('Complaint closed! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiWithRefresh.closeComplaint(complaintId);
        await refresh();
        
        // Clear optimistic state after refresh
        setTimeout(() => {
          setOptimisticComplaints(current => {
            const newMap = new Map(current);
            newMap.delete(complaintId);
            return newMap;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to close complaint:', error);
        
        // Revert: remove optimistic update
        setOptimisticComplaints(current => {
          const newMap = new Map(current);
          newMap.delete(complaintId);
          return newMap;
        });
        
        setSuccessToast(null);
        setActionError(`Failed to close complaint: ${error.message}`);
      }
    })();
  };

  const handleReopenComplaint = (complaintId, message, attachments) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Update status immediately
    setOptimisticComplaints(current => new Map(current).set(complaintId, { status: 'OPEN' }));
    
    // 2. Show success toast
    setSuccessToast('Complaint reopened! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiRequest(`/api/complaints/${complaintId}/re-open`, {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: createMultipartForm({ message, attachments }),
        });
        await refresh();
        
        // Clear optimistic state after refresh
        setTimeout(() => {
          setOptimisticComplaints(current => {
            const newMap = new Map(current);
            newMap.delete(complaintId);
            return newMap;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to reopen complaint:', error);
        
        // Revert: remove optimistic update
        setOptimisticComplaints(current => {
          const newMap = new Map(current);
          newMap.delete(complaintId);
          return newMap;
        });
        
        setSuccessToast(null);
        setActionError(`Failed to reopen complaint: ${error.message}`);
      }
    })();
  };

  const handleResolveComplaint = (complaintId, message, attachments) => {
    // ===== OPTIMISTIC UI UPDATE =====
    // 1. Update status immediately
    setOptimisticComplaints(current => new Map(current).set(complaintId, { status: 'RESOLVED' }));
    
    // 2. Show success toast
    setSuccessToast('Complaint resolved! ✓');
    setTimeout(() => setSuccessToast(null), 2000);
    
    // ===== BACKGROUND API CALL =====
    (async () => {
      try {
        await apiRequest(`/api/complaints/${complaintId}/justify`, {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: createMultipartForm({ message, attachments }),
        });
        await refresh();
        
        // Clear optimistic state after refresh
        setTimeout(() => {
          setOptimisticComplaints(current => {
            const newMap = new Map(current);
            newMap.delete(complaintId);
            return newMap;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to resolve complaint:', error);
        
        // Revert: remove optimistic update
        setOptimisticComplaints(current => {
          const newMap = new Map(current);
          newMap.delete(complaintId);
          return newMap;
        });
        
        setSuccessToast(null);
        setActionError(`Failed to resolve complaint: ${error.message}`);
      }
    })();
  };

  const handleDeleteStudent = async (activeStayId) => {
    await performAction(async () => {
      // Call the new endpoint to delete the active stay and all related data
      await apiRequest(`/api/bookings/active/${activeStayId}`, {
        method: 'DELETE',
        auth: true,
      });
      
      setSuccessToast('Student connection deleted successfully! ✓');
      setTimeout(() => setSuccessToast(null), 2500);
      
      // Refresh to get updated data
      await refresh();
    });
  };

  const notifications = [
    ...liveNotifications.map(item => `${item.title}: ${item.message}`),
    !profile?.profileComplete && 'Complete your profile before using listing and verification features.',
    profile?.profileComplete && !profile?.identityVerified && 'Profile complete. Finish owner verification to send listings for review.',
    ownerListings.some(listing => listing.status === 'UNDER_REVIEW') && 'One or more listings are still under admin review.',
    bookingRequests.some(request => request.status === 'PENDING') && 'You have new booking requests waiting for review.',
  ].filter(Boolean);

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔄</div>
          <div style={{ fontWeight: 800, color: C.text }}>Loading owner dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <BlockedAccountBanner user={user} />
      {editPopup && (
        <Popup title="Edit Profile" onClose={() => { setEditPopup(false); setEditPwdGate(''); setEditPwdErr(''); setEditPwdConfirmed(false); }}>
          {!editPwdConfirmed ? (
            <>
              <p style={{ color: C.textLight, fontSize: 14, marginBottom: 14 }}>Please enter your current password to edit your profile.</p>
              {editPwdErr && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>{editPwdErr}</div>}
              <FInput label="Current Password" placeholder="Enter your current password" type="password" value={editPwdGate} onChange={event => setEditPwdGate(event.target.value)} />
              <button onClick={async () => {
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
              }} style={{ ...BTN.primary, width: '100%', padding: 11 }}>Verify Password</button>
            </>
          ) : (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 14 }}>✓ Password confirmed. You can now edit your profile.</p>
              <FInput label="Full Name" placeholder="Full name" value={editForm.fullName} onChange={event => setEditForm(current => ({ ...current, fullName: event.target.value }))} />
              <FInput label="Email ID" placeholder="Email address" type="email" value={editForm.email} onChange={event => setEditForm(current => ({ ...current, email: event.target.value }))} />
              <FInput label="Mobile Number" placeholder="Mobile number" value={editForm.mobile} onChange={event => setEditForm(current => ({ ...current, mobile: event.target.value }))} />
              <FInput label="PAN Number" placeholder="PAN number" value={editForm.pan} onChange={event => setEditForm(current => ({ ...current, pan: event.target.value }))} />
              <FInput label="PG Name" placeholder="PG name" value={editForm.pgName} onChange={event => setEditForm(current => ({ ...current, pgName: event.target.value }))} />
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>PG City</label>
                <select value={editForm.cityId} onChange={event => setEditForm(current => ({ ...current, cityId: event.target.value }))} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
                  <option value="">Select city</option>
                  {cities.map(city => <option key={city.cityId} value={city.cityId}>{city.cityName}</option>)}
                </select>
              </div>
              <FInput label="PG Address" placeholder="Full PG address" value={editForm.pgAddress} onChange={event => setEditForm(current => ({ ...current, pgAddress: event.target.value }))} />
              <FInput label="Pincode" placeholder="Pincode" value={editForm.pincode} onChange={event => setEditForm(current => ({ ...current, pincode: event.target.value }))} />
              <FInput label="New Password" placeholder="Leave blank to keep current password" type="password" value={editForm.password} onChange={event => setEditForm(current => ({ ...current, password: event.target.value }))} />
              <FInput label="Confirm Password" placeholder="Confirm password" type="password" value={editForm.confirmPassword} onChange={event => setEditForm(current => ({ ...current, confirmPassword: event.target.value }))} />
              <PasswordRequirements password={editForm.password} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Profile Photo</label>
                
                {/* Show existing photo if available and no new photo selected */}
                {editForm.existingPhotoUrl && !editForm.photo && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={editForm.existingPhotoUrl} 
                        alt="Current profile" 
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: `2px solid ${C.border}` }} 
                      />
                      <button
                        onClick={() => setEditForm(current => ({ ...current, existingPhotoUrl: null }))}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          background: C.danger,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>Current profile photo (click X to remove)</div>
                  </div>
                )}
                
                {/* Upload new photo */}
                <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <input type="file" accept="image/*" onChange={event => setEditForm(current => ({ ...current, photo: event.target.files?.[0] || null }))} style={{ width: '100%', fontSize: 12 }} />
                </div>
                <FilePreviewList files={editForm.photo ? [editForm.photo] : []} title="New Profile Photo Preview" />
              </div>
              <button onClick={handleSaveProfile} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>{actionLoading ? 'Saving...' : '💾 Save Changes'}</button>
            </>
          )}
        </Popup>
      )}
      {deletePopup && (
        <Popup title="Delete Account" onClose={() => { setDeletePopup(false); setPwdVerify(''); }}>
          <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.danger }}>⚠️ This action is permanent and cannot be undone.</div>
          <FInput label="Confirm Password" placeholder="Enter your password" type="password" value={pwdVerify} onChange={event => setPwdVerify(event.target.value)} />
          <button onClick={handleDeleteAccount} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} disabled={actionLoading}>{actionLoading ? 'Deleting...' : '🗑️ Delete My Account Permanently'}</button>
        </Popup>
      )}
      {listingPopup?.type === 'edit' && (
        <Popup title="Edit Listing" onClose={() => setListingPopup(null)}>
          <FInput label="Room Title" value={listingPopup.data.title || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, title: event.target.value } }))} />
          <FInput label="Location" value={listingPopup.data.location || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, location: event.target.value } }))} />
          <FInput label="Rent / Month (₹)" value={listingPopup.data.rentAmount || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, rentAmount: event.target.value } }))} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Room Type</label>
            <select value={listingPopup.data.roomKind || 'PG'} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, roomKind: event.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
              <option value="PG">PG</option>
              <option value="HOSTEL">Hostel</option>
              <option value="ROOM">Room</option>
              <option value="FLAT">Flat</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Occupancy</label>
            <select value={listingPopup.data.genderCategory || 'BOTH'} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, genderCategory: event.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
              <option value="MALE">Boys</option>
              <option value="FEMALE">Girls</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <FInput label="Total Capacity" value={listingPopup.data.totalCapacity || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, totalCapacity: event.target.value } }))} />
          <FInput label="Amenities" value={listingPopup.data.amenitiesCsv || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, amenitiesCsv: event.target.value } }))} />
          <FTextarea label="Description" value={listingPopup.data.description || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, description: event.target.value } }))} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Room Images</label>
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', marginBottom: 12 }}>
              <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, roomImages: Array.from(event.target.files || []) } }))} />
                Upload Room Images
              </label>
            </div>
            <FilePreviewList files={Array.isArray(listingPopup.data.roomImages) ? listingPopup.data.roomImages : []} title="Room Images Preview" onRemoveFile={key => setListingPopup(current => ({ ...current, data: { ...current.data, roomImages: (current.data.roomImages || []).filter(file => `${file.name}-${file.size}` !== key) } }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Owner Photo</label>
            
            {/* Show existing owner photo if available and no new photo selected */}
            {listingPopup.data.existingOwnerPhotoUrl && !listingPopup.data.ownerPhoto && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={listingPopup.data.existingOwnerPhotoUrl} 
                    alt="Current owner photo" 
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: `2px solid ${C.border}` }} 
                  />
                  <button
                    onClick={() => setListingPopup(current => ({ ...current, data: { ...current.data, existingOwnerPhotoUrl: null } }))}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: C.danger,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>Current owner photo (click X to remove)</div>
              </div>
            )}
            
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
              <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, ownerPhoto: event.target.files?.[0] || null } }))} />
                {listingPopup.data.existingOwnerPhotoUrl && !listingPopup.data.ownerPhoto ? 'Change Owner Photo' : 'Upload Owner Photo'}
              </label>
            </div>
            <FilePreviewList files={listingPopup.data.ownerPhoto ? [listingPopup.data.ownerPhoto] : []} title="New Owner Photo Preview" onRemoveFile={() => setListingPopup(current => ({ ...current, data: { ...current.data, ownerPhoto: null } }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Owner Video</label>
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
              <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="video/*" style={{ display: 'none' }} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, ownerLiveVideo: event.target.files?.[0] || null } }))} />
                Upload Owner Video
              </label>
            </div>
            <FilePreviewList files={listingPopup.data.ownerLiveVideo ? [listingPopup.data.ownerLiveVideo] : []} title="Owner Video Preview" onRemoveFile={() => setListingPopup(current => ({ ...current, data: { ...current.data, ownerLiveVideo: null } }))} />
          </div>
          <button onClick={handleUpdateListing} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Save Listing Changes</button>
        </Popup>
      )}

      {/* Admin Selection Popup */}
      {adminSelectionPopup.open && (
        <Popup title="Select Admin for Your Listing" onClose={() => setAdminSelectionPopup({ open: false, admins: [] })}>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FFFBEB', border: '1px solid #D97706', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
            ⚠️ No admin found for your city. Please select an available admin to proceed with your listing request.
          </div>
          
          {adminSelectionPopup.admins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: C.textLight }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>😔</div>
              <div>No active admins available</div>
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {adminSelectionPopup.admins.map(admin => (
                <div 
                  key={admin.userId}
                  style={{
                    background: '#fff',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '14px 16px',
                    marginBottom: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  onClick={async () => {
                    // Set the selected admin ID in the form
                    setListingForm(current => ({ ...current, selectedAdminId: admin.userId }));
                    // Close the popup
                    setAdminSelectionPopup({ open: false, admins: [] });
                    // Proceed with listing creation
                    await proceedWithListingCreation(admin.userId);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{admin.displayName}</div>
                    <StatusBadge status={admin.accountStatus} />
                  </div>
                  <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>
                    📍 {admin.cityName}
                  </div>
                  <div style={{ fontSize: 12, color: C.textLight }}>
                    ID: {admin.userCode}
                  </div>
                  <div style={{ marginTop: 10, textAlign: 'right' }}>
                    <span style={{ ...BTN.primary, padding: '6px 16px', fontSize: 12, display: 'inline-block' }}>
                      Select Admin →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Popup>
      )}

      {/* Success Toast */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: '#fff',
          padding: '16px 32px',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
          fontSize: 15,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'slideDown 0.3s ease-out',
        }}>
          <span style={{ fontSize: 20 }}>✓</span>
          {successToast}
        </div>
      )}

      <nav style={{ background: C.primary, padding: '0 20px', zIndex: 100, position: 'sticky', top: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setCollapsed(current => !current)} style={{ ...BTN.ghost, color: '#fff', fontSize: 18 }}>☰</button>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white size={22} /></div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
            <NotificationBell notifications={data.notifications || []} refreshData={refresh} />
            <button onClick={() => setPage('profile')} style={{ ...BTN.accent, padding: '6px 14px', fontSize: 13 }}>👤 {user?.name}</button>
            <button onClick={signOut} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: collapsed ? 56 : 220, background: '#fff', borderRight: `1px solid ${C.border}`, transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ paddingTop: 12 }}>
            {MENU.map(item => (
              <button key={item.key} onClick={() => { if (isMenuDisabled(item.key)) { return; } setPage(item.key); }} disabled={isMenuDisabled(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', border: 'none', background: page === item.key ? `${C.primary}15` : 'transparent', color: page === item.key ? C.primary : C.text, cursor: isMenuDisabled(item.key) ? 'not-allowed' : 'pointer', textAlign: 'left', fontWeight: page === item.key ? 800 : 500, fontSize: 14, borderLeft: page === item.key ? `3px solid ${C.primary}` : '3px solid transparent', transition: 'all 0.2s', opacity: isMenuDisabled(item.key) ? 0.45 : 1 }}>
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
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Welcome back, {user?.name}! 🏠</h1>
                <p style={{ margin: '6px 0 0', opacity: 0.85 }}>Owner ID: <b>{profile?.userCode}</b></p>
              </div>
              <div ref={notifRef} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontWeight: 800 }}>🔔 Notifications</h3>
                {notifications.length === 0 ? <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.success, fontWeight: 500 }}>Everything looks good right now.</div> : notifications.map(message => <div key={message} style={{ background: C.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: C.text }}>{message}</div>)}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 12 }}>
                  {MENU.map(item => <button key={item.key} onClick={() => { if (isMenuDisabled(item.key)) { return; } setPage(item.key); }} disabled={isMenuDisabled(item.key)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 10px', cursor: isMenuDisabled(item.key) ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: isMenuDisabled(item.key) ? 0.45 : 1 }}><div style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{item.label}</div></button>)}
                </div>
              </div>
            </div>
          )}
          {page === 'profile' && (
            <div style={{ maxWidth: 720 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>👤 My Profile</h2>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Profile Completion</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: profile?.completionPercentage === 100 ? C.success : C.primary }}>{profile?.completionPercentage || 0}%</span>
                </div>
                <div style={{ background: C.bg, borderRadius: 99, height: 10, overflow: 'hidden' }}><div style={{ width: `${profile?.completionPercentage || 0}%`, height: '100%', background: profile?.completionPercentage === 100 ? `linear-gradient(90deg, ${C.success}, #34D399)` : `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, borderRadius: 99 }} /></div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#003B95,#0071C2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, overflow: 'hidden' }}>{profile?.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt={profile.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👨‍💼'}</div>
                  <div><div style={{ fontWeight: 900, fontSize: 20 }}>{profile?.displayName}</div><div style={{ color: C.textLight, fontSize: 14 }}>Room Owner • {profile?.locality || 'Location pending'}</div></div>
                </div>
                {[['Owner ID', profile?.userCode], ['Name', profile?.displayName], ['Mobile Number', profile?.mobileNumber], ['Email ID', profile?.email], ['PAN Number', profile?.panNumber], ['PG Name', profile?.pgName], ['PG City', profile?.cityName], ['PG Address', profile?.addressLineOne], ['Identity Verified', profile?.identityVerified ? 'Yes' : 'No']].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.textLight, fontSize: 14 }}>{label}</span><span style={{ fontWeight: 600, fontSize: 14 }}>{value || '-'}</span></div>)}
                <button onClick={openEditPopup} style={{ ...BTN.primary, marginTop: 16 }}>✏️ Edit Profile</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}><button onClick={signOut} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🚪 Logout</button><button onClick={() => setDeletePopup(true)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🗑️ Delete Account</button></div>
            </div>
          )}
          {page === 'bookingMgmt' && <BookingManagement bookingRequests={bookingRequests} ownerStays={ownerStays} payments={payments} cancelRequests={cancelRequests} studentComplaints={studentComplaints} connectedStudents={connectedStudents} onAcceptBooking={handleAcceptBooking} onRejectBooking={handleRejectBooking} onUpdatePayment={handleUpdatePayment} onCreateComplaint={handleCreateComplaint} onReviewCancelRequest={handleReviewCancelRequest} onCloseComplaint={handleCloseComplaint} onReopenComplaint={handleReopenComplaint} onDeleteStudent={handleDeleteStudent} actionLoading={actionLoading} />}
          {page === 'listingMgmt' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🏢 Listing Management</h2>
              
              <SlidingTabs 
                tabs={[
                  { icon: '➕', label: 'Create New Listing' },
                  { icon: '🟢', label: `Live Listings (${liveListings.length})` },
                  { icon: '⏳', label: `Pending Review (${pendingListings.length})` },
                  { icon: '❌', label: 'Rejected Listings' }
                ]}
                activeTab={listingTab}
                onTabChange={setListingTab}
              >
                {/* Tab 1: Create New Listing */}
                <div>
                  <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <FInput label="Room Title" placeholder="e.g. Sunrise PG for Boys" value={listingForm.title} onChange={event => { setListingForm(current => ({ ...current, title: event.target.value })); setListingConfirmed(false); }} />
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>City</label>
                        <select value={listingForm.cityId} onChange={event => { setListingForm(current => ({ ...current, cityId: event.target.value })); setListingConfirmed(false); }} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
                          <option value="">Select city</option>
                          {/* Show only the owner's city */}
                          {cities.filter(city => city.cityId === profile?.cityId).map(city => <option key={city.cityId} value={city.cityId}>{city.cityName}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <FInput label="Full Address" placeholder="Complete address of the property" value={listingForm.address} onChange={event => { setListingForm(current => ({ ...current, address: event.target.value })); setListingConfirmed(false); }} />
                      </div>
                      <FInput label="Rent / Month (₹)" placeholder="e.g. 7500" value={listingForm.rentAmount} onChange={event => { setListingForm(current => ({ ...current, rentAmount: event.target.value })); setListingConfirmed(false); }} />
                      <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Room Type</label><select value={listingForm.roomKind} onChange={event => { setListingForm(current => ({ ...current, roomKind: event.target.value })); setListingConfirmed(false); }} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}><option value="PG">PG</option><option value="HOSTEL">Hostel</option><option value="ROOM">Room</option><option value="FLAT">Flat</option></select></div>
                      <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Occupancy</label><select value={listingForm.genderCategory} onChange={event => { setListingForm(current => ({ ...current, genderCategory: event.target.value })); setListingConfirmed(false); }} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}><option value="MALE">Boys</option><option value="FEMALE">Girls</option><option value="BOTH">Both</option></select></div>
                      <FInput label="Total Space in Listing" placeholder="e.g. 10" value={listingForm.totalCapacity} onChange={event => { setListingForm(current => ({ ...current, totalCapacity: event.target.value })); setListingConfirmed(false); }} />
                      <FInput label="Amenities" placeholder="WiFi, AC, Meals, Laundry..." value={listingForm.amenitiesCsv} onChange={event => { setListingForm(current => ({ ...current, amenitiesCsv: event.target.value })); setListingConfirmed(false); }} />
                      <div style={{ gridColumn: '1/-1' }}><FTextarea label="Description" placeholder="Describe your room in detail..." value={listingForm.description} onChange={event => { setListingForm(current => ({ ...current, description: event.target.value })); setListingConfirmed(false); }} rows={3} /></div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>📷 Room Images</label>
                        <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', marginBottom: 12 }}>
                          <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={event => { setListingForm(current => ({ ...current, roomImages: Array.from(event.target.files || []) })); setListingConfirmed(false); }} />Upload Images</label>
                        </div>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>👤 Owner Photo (Required)</label>
                        <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
                          <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="image/*" style={{ display: 'none' }} onChange={event => { setListingForm(current => ({ ...current, ownerPhoto: event.target.files?.[0] || null })); setListingConfirmed(false); }} />Upload Owner Photo</label>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: C.textLight }}>Upload a clear photo of yourself for listing verification. This is separate from your profile photo.</div>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>🎥 Live Video of Owner Face</label>
                        <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
                          <label style={{ ...BTN.primary, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="video/*" capture="environment" style={{ display: 'none' }} onChange={event => { setListingForm(current => ({ ...current, ownerLiveVideo: event.target.files?.[0] || null })); setListingConfirmed(false); }} />📷 Open Camera & Record</label>
                        </div>
                      </div>
                    </div>
                    <FilePreviewList files={[...listingForm.roomImages, listingForm.ownerPhoto, listingForm.ownerLiveVideo].filter(Boolean)} title="Listing Media Preview" onRemoveFile={key => setListingForm(current => ({ ...current, roomImages: current.roomImages.filter(file => `${file.name}-${file.size}` !== key), ownerPhoto: current.ownerPhoto && `${current.ownerPhoto.name}-${current.ownerPhoto.size}` === key ? null : current.ownerPhoto, ownerLiveVideo: current.ownerLiveVideo && `${current.ownerLiveVideo.name}-${current.ownerLiveVideo.size}` === key ? null : current.ownerLiveVideo }))} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}><button style={{ ...BTN.outline }} onClick={() => { setListingForm({ title: '', cityId: '', address: '', rentAmount: '', roomKind: 'PG', genderCategory: 'BOTH', totalCapacity: '', amenitiesCsv: '', description: '', roomImages: [], ownerPhoto: null, ownerLiveVideo: null }); setListingConfirmed(false); }}>↺ Reset</button><button onClick={() => setListingConfirmed(true)} style={{ ...BTN.outline, borderColor: listingConfirmed ? C.success : C.danger, color: listingConfirmed ? C.success : C.danger, background: listingConfirmed ? '#F0FFF4' : '#FEF2F2' }}>Confirm Media</button><button onClick={handleCreateListing} style={{ ...BTN.primary }} disabled={actionLoading}>📤 Send Request to Admin</button></div>
                  </div>
                </div>

                {/* Tab 2: Live Listings */}
                <div>
                  {liveListings.length === 0 ? (
                    <EmptyState icon="🏢" title="No owner listings yet" subtitle="Create your first listing to see it here." />
                  ) : (
                    <TableWrap headers={['Listing Name', 'Available Space', 'Address + Monthly Rent', 'Verification Status', 'Actions']}>
                      {liveListings.map(listing => (
                        <TR key={listing.id}>
                          <TD>
                            {listing.title}
                            {listing.isOptimistic && (
                              <span style={{ marginLeft: 8, fontSize: 11, color: C.secondary, fontWeight: 600 }}>
                                (Submitting...)
                              </span>
                            )}
                          </TD>
                          <TD>{listing.availableCapacity}/{listing.totalCapacity}</TD>
                          <TD>
                            <div style={{ color: C.textLight, fontSize: 12 }}>{listing.location}</div>
                            <div style={{ fontWeight: 700 }}>{formatCurrency(listing.rentAmount)}/mo</div>
                          </TD>
                          <TD><StatusBadge status={listing.latestFakeDetectionStatus || listing.status} /></TD>
                          <TD>
                            {listing.isOptimistic ? (
                              <div style={{ fontSize: 12, color: C.textLight, fontStyle: 'italic' }}>
                                Processing...
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setListingPopup({ 
                                  type: 'edit', 
                                  data: { 
                                    ...listing, 
                                    amenitiesCsv: (listing.amenities || []).join(', '), 
                                    genderCategory: listing.genderCategory || 'BOTH',
                                    ownerPhoto: null, // Will be replaced if user uploads new one
                                    existingOwnerPhotoUrl: listing.ownerPhotoUrl || null, // Preserve existing
                                  } 
                                })} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>✏️ Edit</button>
                                <button onClick={() => handleDeleteListing(listing.id)} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }} disabled={actionLoading}>🗑️ Delete</button>
                              </div>
                            )}
                          </TD>
                        </TR>
                      ))}
                    </TableWrap>
                  )}
                </div>

                {/* Tab 3: Pending Review Listings */}
                <div>
                  {pendingListings.length === 0 ? (
                    <EmptyState icon="✅" title="No pending listings" subtitle="Listings awaiting review will appear here." />
                  ) : (
                    <TableWrap headers={['Listing Name', 'Available Space', 'Address + Monthly Rent', 'Verification Status', 'Actions']}>
                      {pendingListings.map(listing => (
                        <TR key={listing.id}>
                          <TD>
                            <div style={{ fontWeight: 700 }}>{listing.title}</div>
                          </TD>
                          <TD>
                            <div style={{ fontSize: 13, color: C.text }}>
                              {listing.availableCapacity} / {listing.totalCapacity} available
                            </div>
                          </TD>
                          <TD>
                            <div style={{ fontSize: 13, color: C.text, marginBottom: 2 }}>{listing.location}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>₹{listing.rentAmount?.toLocaleString()}/month</div>
                          </TD>
                          <TD>
                            <StatusBadge status={listing.status} fakeStatus={listing.latestFakeDetectionStatus} />
                          </TD>
                          <TD>
                            {listing.isOptimistic ? (
                              <div style={{ fontSize: 12, color: C.textLight, fontStyle: 'italic' }}>
                                Processing...
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setListingPopup({ 
                                  type: 'edit', 
                                  data: { 
                                    ...listing, 
                                    amenitiesCsv: (listing.amenities || []).join(', '), 
                                    genderCategory: listing.genderCategory || 'BOTH',
                                    ownerPhoto: null,
                                    existingOwnerPhotoUrl: listing.ownerPhotoUrl || null,
                                  } 
                                })} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>✏️ Edit</button>
                                <button onClick={() => handleDeleteListing(listing.id)} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }} disabled={actionLoading}>🗑️ Delete</button>
                              </div>
                            )}
                          </TD>
                        </TR>
                      ))}
                    </TableWrap>
                  )}
                </div>

                {/* Tab 4: Rejected Listings */}
                <div>
                  {rejectedListings.length === 0 ? (
                    <EmptyState icon="✅" title="No rejected listings" subtitle="Rejected listings will appear here if admins send one back." />
                  ) : (
                    <TableWrap headers={['Listing Name', 'Listing ID', 'Reason for Rejection', 'Actions']}>
                      {rejectedListings.map(listing => (
                        <TR key={listing.id}>
                          <TD>
                            <div style={{ fontWeight: 700 }}>{listing.title}</div>
                            <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>
                              {listing.location}
                            </div>
                          </TD>
                          <TD>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.textLight }}>
                              {String(listing.id).slice(0, 8)}
                            </span>
                          </TD>
                          <TD style={{ whiteSpace: 'normal', maxWidth: 300 }}>
                            <div style={{ 
                              background: '#FEF2F2', 
                              borderLeft: `3px solid ${C.danger}`, 
                              padding: '8px 12px', 
                              borderRadius: 4,
                              fontSize: 13,
                              color: C.text
                            }}>
                              {listing.rejectionReason || 'Listing was rejected during review.'}
                            </div>
                          </TD>
                          <TD>
                            {listing.isOptimistic ? (
                              <div style={{ fontSize: 12, color: C.textLight, fontStyle: 'italic' }}>
                                Processing...
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button 
                                  onClick={() => setListingPopup({ 
                                    type: 'edit', 
                                    data: { 
                                      ...listing, 
                                      amenitiesCsv: (listing.amenities || []).join(', '), 
                                      genderCategory: listing.genderCategory || 'BOTH',
                                      ownerPhoto: null, // Will be replaced if user uploads new one
                                      existingOwnerPhotoUrl: listing.ownerPhotoUrl || null, // Preserve existing
                                    } 
                                  })} 
                                  style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}
                                >
                                  ✏️ Update Listing
                                </button>
                                <button 
                                  onClick={() => handleDeleteListing(listing.id)} 
                                  style={{ 
                                    background: '#FEF2F2', 
                                    color: C.danger, 
                                    border: 'none', 
                                    borderRadius: 6, 
                                    padding: '6px 12px', 
                                    cursor: 'pointer', 
                                    fontWeight: 700, 
                                    fontSize: 12 
                                  }} 
                                  disabled={actionLoading}
                                >
                                  🗑️ Remove
                                </button>
                              </div>
                            )}
                          </TD>
                        </TR>
                      ))}
                    </TableWrap>
                  )}
                </div>
              </SlidingTabs>
            </div>
          )}
          {page === 'verify' && (
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🪪 Verify Your Profile</h2>
              <div style={{ background: '#FFFBEB', border: '1px solid #D97706', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>⚠️ Complete your profile first, then upload your verification files, preview them, confirm them, and submit for AI review.</div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
                {verifyStep !== 1 && (
                  <>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}><div style={{ fontSize: 40, marginBottom: 8 }}>📸</div><label style={{ ...BTN.primary, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={event => { setVerifyFiles(current => ({ ...current, liveImage: event.target.files?.[0] || null })); setVerifyConfirmed(false); }} />📷 Open Camera</label></div>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}><div style={{ fontSize: 40, marginBottom: 8 }}>🪪</div><label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={event => { setVerifyFiles(current => ({ ...current, panImage: event.target.files?.[0] || null })); setVerifyConfirmed(false); }} />Choose PAN File</label></div>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}><div style={{ fontSize: 40, marginBottom: 8 }}>✍️</div><label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="image/*" style={{ display: 'none' }} onChange={event => { setVerifyFiles(current => ({ ...current, userSignature: event.target.files?.[0] || null })); setVerifyConfirmed(false); }} />Choose Signature</label></div>
                    <FilePreviewList files={[verifyFiles.liveImage, verifyFiles.panImage, verifyFiles.userSignature].filter(Boolean)} title="Verification Media Preview" />
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}><button onClick={() => { if (!verifyFiles.liveImage || !verifyFiles.panImage || !verifyFiles.userSignature) { setActionError('Please select all verification files first.'); setVerifyConfirmed(false); return; } setVerifyConfirmed(true); setActionError(''); }} style={{ ...BTN.outline, flex: 1, minWidth: 180, borderColor: verifyConfirmed ? C.success : C.danger, color: verifyConfirmed ? C.success : C.danger, background: verifyConfirmed ? '#F0FFF4' : '#FEF2F2' }}>Confirm Selected Media</button><button onClick={handlePerformVerification} disabled={!profile?.profileComplete} style={{ ...BTN.primary, flex: 1, minWidth: 180, opacity: profile?.profileComplete ? 1 : 0.5, cursor: profile?.profileComplete ? 'pointer' : 'not-allowed' }}>🤖 Perform AI Verification</button></div>
                  </>
                )}
                {verifyStep === 1 && <div style={{ textAlign: 'center', padding: 24 }}><div style={{ fontSize: 48, display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 12 }}>🔄</div><div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>AI Verification in progress...</div><div style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}><div style={{ marginBottom: 8 }}>🔍 Scanning face...</div><div style={{ marginBottom: 8 }}>🆔 Matching face with owner ID card...</div><div style={{ marginBottom: 8 }}>👤 Matching owner name...</div><div style={{ marginBottom: 8 }}>🛡️ Detecting government emblem...</div><div style={{ marginBottom: 8 }}>✍️ Matching signature with PAN card...</div><div style={{ marginBottom: 8 }}>🇮🇳 Checking "Government of India" header...</div><div style={{ marginBottom: 8 }}>🏛️ Checking "Income Tax Department" header...</div><div>🔢 Matching PAN number...</div></div></div>}
              </div>
              <VerificationResultPanel result={latestVerification} />
            </div>
          )}
          {page === 'feedback' && (
            <div style={{ maxWidth: 500 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>⭐ Feedback & Rating</h2>
              {feedbackSent ? <div style={{ background: '#F0FFF4', border: `1px solid ${C.success}`, borderRadius: 12, padding: 32, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 8 }}>🙏</div><div style={{ fontWeight: 700, color: C.success, fontSize: 18 }}>Thank you for your feedback!</div></div> : <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}><label style={{ display: 'block', fontWeight: 700, marginBottom: 10 }}>Rate Our Platform</label><div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>{[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setFeedback(current => ({ ...current, rating: star }))} style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', color: star <= feedback.rating ? '#FFB700' : '#D1D5DB' }}>★</button>)}</div><FTextarea label="Feedback & Suggestions" placeholder="Share your thoughts about Stazy..." value={feedback.text} onChange={event => setFeedback(current => ({ ...current, text: event.target.value }))} rows={5} /><button onClick={handlePlatformFeedback} style={{ ...BTN.primary, width: '100%', padding: 12 }} disabled={actionLoading}>{actionLoading ? 'Submitting...' : 'Submit Feedback 📤'}</button></div>}
            </div>
          )}
          {page === 'complaints' && <ReceivedComplaints complaints={receivedComplaints} onResolveComplaint={handleResolveComplaint} actionLoading={actionLoading} />}
        </div>
      </div>

      <footer style={{ background: C.primary, color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
        <button onClick={signOut} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🚪 Sign Out</button>
      </footer>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translate(-50%,-20px)}to{opacity:1;transform:translate(-50%,0)}}
      `}</style>
    </div>
  );
}
