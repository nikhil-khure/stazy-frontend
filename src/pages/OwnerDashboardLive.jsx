import { useEffect, useMemo, useRef, useState } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo } from '../components/shared/SharedComponents';
import { FilePreviewList, PasswordRequirements } from '../components/shared/FormHelpers';
import Popup from '../components/shared/Popup';
import SlidingTabs from '../components/shared/SlidingTabs';
import { apiRequest, bootstrapCurrentUser, createMultipartForm, uploadMedia } from '../services/api';
import { clearSession } from '../services/session';
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
        <div style={{ color: C.success, fontWeight: 800, fontSize: 16 }}>Verified</div>
      ) : (
        <div>
          <div style={{ marginBottom: 10, color: C.danger, fontWeight: 800, fontSize: 15 }}>Verification Failed</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {failedReasons.map(reason => (
              <div key={reason} style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13 }}>
                {reason}
              </div>
            ))}
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
  actionLoading,
}) {
  const [popup, setPopup] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentForm, setPaymentForm] = useState({ dueDate: '', reminderMessage: '', notes: '', status: '' });
  const [complaintForm, setComplaintForm] = useState({ studentUserCode: '', title: '', description: '', attachments: [] });
  const [reComplaint, setReComplaint] = useState({ complaintId: null, message: '', attachments: [] });

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

  return (
    <div>
      {popup?.type === 'rejectBooking' && (
        <Popup title="Reject Booking Request" onClose={() => setPopup(null)}>
          <FTextarea label="Reason to Reject" placeholder="Explain why the request is being rejected..." value={rejectReason} onChange={event => setRejectReason(event.target.value)} rows={3} />
          <button onClick={async () => { await onRejectBooking(popup.data.id, rejectReason); setRejectReason(''); setPopup(null); }} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} disabled={actionLoading}>Submit Rejection</button>
        </Popup>
      )}
      {popup?.type === 'payment' && (
        <Popup title="Update Payment" onClose={() => setPopup(null)}>
          <FInput label="Due Date" placeholder="YYYY-MM-DD" value={paymentForm.dueDate} onChange={event => setPaymentForm(current => ({ ...current, dueDate: event.target.value }))} />
          <FInput label="Status" placeholder="PAID or UNPAID" value={paymentForm.status} onChange={event => setPaymentForm(current => ({ ...current, status: event.target.value.toUpperCase() }))} />
          <FTextarea label="Reminder Message" placeholder="Reminder message" value={paymentForm.reminderMessage} onChange={event => setPaymentForm(current => ({ ...current, reminderMessage: event.target.value }))} rows={3} />
          <FTextarea label="Notes" placeholder="Internal notes" value={paymentForm.notes} onChange={event => setPaymentForm(current => ({ ...current, notes: event.target.value }))} rows={2} />
          <button onClick={async () => { await onUpdatePayment(popup.data.id, paymentForm); setPopup(null); setPaymentForm({ dueDate: '', reminderMessage: '', notes: '', status: '' }); }} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Save Payment Update</button>
        </Popup>
      )}
      {popup?.type === 'reComplaint' && (
        <Popup title="Re-Complaint Against Student" onClose={() => setPopup(null)}>
          <FTextarea label="Message" placeholder="Provide more context..." value={reComplaint.message} onChange={event => setReComplaint(current => ({ ...current, message: event.target.value }))} />
          <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
            <label style={{ ...BTN.outline, padding: '5px 14px', fontSize: 12, cursor: 'pointer', display: 'inline-block' }}>
              <input type="file" multiple style={{ display: 'none' }} onChange={event => setReComplaint(current => ({ ...current, attachments: Array.from(event.target.files || []) }))} />
              Choose Files
            </label>
          </div>
          <FilePreviewList files={reComplaint.attachments} title="Re-Complaint Attachments" />
          <button onClick={async () => { await onReopenComplaint(reComplaint.complaintId, reComplaint.message, reComplaint.attachments); setReComplaint({ complaintId: null, message: '', attachments: [] }); setPopup(null); }} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Send Re-Complaint</button>
        </Popup>
      )}

      <SlidingTabs tabs={tabs}>
        <div>
          {bookingRequests.length === 0 ? (
            <EmptyState icon="📭" title="No booking requests" subtitle="Incoming student requests will show up here." />
          ) : (
            <TableWrap headers={['Booking ID', 'Student Name', 'College', 'Date Requested', 'Listing', 'Space Available', 'Actions']}>
              {bookingRequests.map(request => (
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
                  <TD><button onClick={() => { setPopup({ type: 'payment', data: payment }); setPaymentForm({ dueDate: payment.dueDate || '', reminderMessage: payment.reminderMessage || '', notes: payment.notes || '', status: payment.status || '' }); }} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>Update</button></TD>
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
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
              <label style={{ ...BTN.outline, padding: '5px 14px', fontSize: 12, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" multiple style={{ display: 'none' }} onChange={event => setComplaintForm(current => ({ ...current, attachments: Array.from(event.target.files || []) }))} />
                Choose Files
              </label>
            </div>
            <FilePreviewList files={complaintForm.attachments} title="Complaint Attachments" />
            <button onClick={async () => { const stay = staysByStudent[complaintForm.studentUserCode]; await onCreateComplaint({ ...complaintForm, relatedStayId: stay?.id, relatedListingId: stay?.listingId }); setComplaintForm({ studentUserCode: '', title: '', description: '', attachments: [] }); }} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Submit Complaint to Student</button>
          </div>
        </div>

        <div>
          {cancelRequests.length === 0 ? (
            <EmptyState icon="❌" title="No cancel requests" subtitle="Student move-out requests will appear here." />
          ) : (
            <TableWrap headers={['Student ID', 'Student Name', 'Room ID', 'Reason', 'Account Status', 'Actions']}>
              {cancelRequests.map(request => (
                <TR key={request.id}>
                  <TD>{request.studentUserCode}</TD>
                  <TD>{request.studentName}</TD>
                  <TD>{request.roomCode}</TD>
                  <TD style={{ whiteSpace: 'normal' }}>{request.reason}</TD>
                  <TD><StatusBadge status={request.accountStatusSnapshot} /></TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => onReviewCancelRequest(request.id, true, '')} style={{ background: '#F0FFF4', color: C.success, border: '1px solid #86EFAC', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || request.status !== 'UNDER_PROGRESS'}>✓ Accept</button>
                      <button onClick={() => onReviewCancelRequest(request.id, false, 'Please clear pending dues first.')} style={{ background: '#FEF2F2', color: C.danger, border: '1px solid #FCA5A5', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || request.status !== 'UNDER_PROGRESS'}>✕ Reject</button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
        </div>

        <div>
          {studentComplaints.length === 0 ? (
            <EmptyState icon="📣" title="No student complaint threads" subtitle="Complaints you file against students will appear here." />
          ) : (
            <TableWrap headers={['Complaint ID', 'Status', 'Student Justification', 'Actions']}>
              {studentComplaints.map(complaint => {
                const justification = latestMessage(complaint, 'JUSTIFICATION');
                return (
                  <TR key={complaint.id}>
                    <TD>{String(complaint.id).slice(0, 8)}</TD>
                    <TD><StatusBadge status={complaint.status} /></TD>
                    <TD>{justification ? <span style={{ fontSize: 12, color: C.text }}>{justification.message}</span> : <span style={{ color: C.textLight, fontSize: 12 }}>Awaiting response...</span>}</TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onCloseComplaint(complaint.id)} style={{ background: '#F0FFF4', color: C.success, border: '1px solid #86EFAC', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || complaint.status === 'CLOSED'}>✓ Close</button>
                        <button onClick={() => { setPopup({ type: 'reComplaint', data: complaint }); setReComplaint({ complaintId: complaint.id, message: '', attachments: [] }); }} style={{ background: '#FEF2F2', color: C.danger, border: '1px solid #FCA5A5', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || complaint.status === 'CLOSED'}>🔁 Re-Complaint</button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TableWrap>
          )}
        </div>

        <div>
          {connectedStudents.length === 0 ? (
            <EmptyState icon="👥" title="No connected students yet" subtitle="Students with active stays will appear here." />
          ) : (
            <TableWrap headers={['Student ID', 'Student Name', 'College Name', 'Action']}>
              {connectedStudents.map(student => (
                <TR key={student.studentUserCode}>
                  <TD>{student.studentUserCode}</TD>
                  <TD>{student.studentName}</TD>
                  <TD>{student.studentCollegeName || '-'}</TD>
                  <TD><button onClick={() => setPopup({ type: 'student', data: student })} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>See More Details</button></TD>
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
    </div>
  );
}

function ReceivedComplaints({ complaints, onResolveComplaint, actionLoading }) {
  const [popup, setPopup] = useState(null);
  const [resolution, setResolution] = useState({ message: '', attachments: [] });

  return (
    <div>
      {popup && (
        <Popup title="Resolve Complaint" onClose={() => setPopup(null)}>
          <FTextarea label="Your Full Justification" placeholder="Explain how the issue was resolved..." value={resolution.message} onChange={event => setResolution(current => ({ ...current, message: event.target.value }))} rows={5} />
          <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
            <label style={{ ...BTN.outline, padding: '5px 14px', fontSize: 12, cursor: 'pointer', display: 'inline-block' }}>
              <input type="file" multiple style={{ display: 'none' }} onChange={event => setResolution(current => ({ ...current, attachments: Array.from(event.target.files || []) }))} />
              Choose Files
            </label>
          </div>
          <FilePreviewList files={resolution.attachments} title="Justification Attachments" />
          <button onClick={async () => { await onResolveComplaint(popup.id, resolution.message, resolution.attachments); setPopup(null); setResolution({ message: '', attachments: [] }); }} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Submit Resolution</button>
        </Popup>
      )}
      {complaints.length === 0 ? <EmptyState icon="📣" title="No complaints received" subtitle="Student complaints addressed to you will show up here." /> : (
        <TableWrap headers={['Complaint ID', 'Student Name', 'Issue', 'Description', 'Action']}>
          {complaints.map(complaint => (
            <TR key={complaint.id}>
              <TD>{String(complaint.id).slice(0, 8)}</TD>
              <TD>{complaint.complainantName}</TD>
              <TD>{complaint.title}</TD>
              <TD style={{ whiteSpace: 'normal' }}>{complaint.description}</TD>
              <TD><button onClick={() => setPopup(complaint)} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }} disabled={actionLoading || complaint.status === 'CLOSED'}>Resolve</button></TD>
            </TR>
          ))}
        </TableWrap>
      )}
    </div>
  );
}

export default function OwnerDashboardLive({ user, setUser, navigate }) {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [ownerListings, setOwnerListings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [ownerStays, setOwnerStays] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [filedComplaints, setFiledComplaints] = useState([]);
  const [receivedComplaints, setReceivedComplaints] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', rating: 0 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  const [editPwdGate, setEditPwdGate] = useState('');
  const [editPwdErr, setEditPwdErr] = useState('');
  const [editPwdConfirmed, setEditPwdConfirmed] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '', pan: '', pgName: '', businessName: '', addressLineOne: '', addressLineTwo: '', locality: '', pincode: '', password: '', confirmPassword: '', photo: null });
  const [deletePopup, setDeletePopup] = useState(false);
  const [pwdVerify, setPwdVerify] = useState('');
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyFiles, setVerifyFiles] = useState({ liveImage: null, panImage: null, userSignature: null });
  const [verifyConfirmed, setVerifyConfirmed] = useState(false);
  const [listingForm, setListingForm] = useState({ title: '', location: '', rentAmount: '', genderCategory: 'BOTH', totalCapacity: '', amenitiesCsv: '', description: '', roomImages: [], ownerPhoto: null, ownerLiveVideo: null });
  const [listingConfirmed, setListingConfirmed] = useState(false);
  const [listingPopup, setListingPopup] = useState(null);
  const notifRef = useRef(null);

  const liveListings = ownerListings.filter(listing => listing.status !== 'REJECTED');
  const rejectedListings = ownerListings.filter(listing => listing.status === 'REJECTED');
  const studentComplaints = filedComplaints.filter(complaint => complaint.againstRoleCode === 'STUDENT');
  const latestVerification = verificationResult || verificationHistory[0] || null;
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

  const loadDashboard = async () => {
    setPageLoading(true);
    setPageError('');
    try {
      const [profileResponse, listingsResponse, requestResponse, staysResponse, paymentsResponse, cancelResponse, filedResponse, receivedResponse, historyResponse] = await Promise.all([
        apiRequest('/api/profiles/owner/me', { auth: true }),
        apiRequest('/api/listings/owner/me', { auth: true }),
        apiRequest('/api/bookings/requests/owner', { auth: true }),
        apiRequest('/api/bookings/active/owner', { auth: true }),
        apiRequest('/api/bookings/payments/me', { auth: true }),
        apiRequest('/api/bookings/cancel-requests/me', { auth: true }),
        apiRequest('/api/complaints/filed', { auth: true }),
        apiRequest('/api/complaints/received', { auth: true }),
        apiRequest('/api/verifications/me/history', { auth: true }),
      ]);
      setProfile(profileResponse);
      setOwnerListings(listingsResponse || []);
      setBookingRequests(requestResponse || []);
      setOwnerStays(staysResponse || []);
      setPayments(paymentsResponse || []);
      setCancelRequests(cancelResponse || []);
      setFiledComplaints(filedResponse || []);
      setReceivedComplaints(receivedResponse || []);
      setVerificationHistory((historyResponse || []).map(prepareVerificationDisplay));
      setEditForm({
        fullName: profileResponse.displayName || '',
        email: profileResponse.email || '',
        mobile: profileResponse.mobileNumber || '',
        pan: profileResponse.panNumber || '',
        pgName: profileResponse.pgName || '',
        businessName: profileResponse.businessName || '',
        addressLineOne: profileResponse.addressLineOne || '',
        addressLineTwo: profileResponse.addressLineTwo || '',
        locality: profileResponse.locality || '',
        pincode: profileResponse.pincode || '',
        password: '',
        confirmPassword: '',
        photo: null,
      });
    } catch (error) {
      setPageError(error.message);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'owner') {
      loadDashboard();
    }
  }, [user]);

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
        const uploaded = await uploadMedia(editForm.photo, 'profile-photo');
        photoPayload = {
          profilePhotoUrl: uploaded.url,
          profilePhotoPublicId: uploaded.publicId,
        };
      }
      await apiRequest('/api/profiles/owner/me', {
        method: 'PUT',
        auth: true,
        body: {
          displayName: editForm.fullName,
          email: editForm.email,
          mobileNumber: editForm.mobile,
          panNumber: editForm.pan,
          pgName: editForm.pgName,
          businessName: editForm.businessName,
          addressLineOne: editForm.addressLineOne,
          addressLineTwo: editForm.addressLineTwo,
          locality: editForm.locality,
          pincode: editForm.pincode,
          ...photoPayload,
        },
      });
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
      await Promise.all([loadDashboard(), syncUser()]);
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
    if (!listingForm.ownerPhoto && !profile?.profilePhotoUrl) {
      setActionError('Please upload the owner photo required for AI listing verification.');
      return;
    }
    if (!listingConfirmed) {
      setActionError('Please preview and confirm your listing media first.');
      return;
    }
    await performAction(async () => {
      await apiRequest('/api/listings/owner', {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: createMultipartForm({
          title: listingForm.title,
          location: listingForm.location,
          description: listingForm.description,
          rentAmount: listingForm.rentAmount,
          genderCategory: listingForm.genderCategory,
          totalCapacity: listingForm.totalCapacity,
          amenitiesCsv: listingForm.amenitiesCsv,
          roomImages: listingForm.roomImages,
          ownerPhoto: listingForm.ownerPhoto,
          ownerLiveVideo: listingForm.ownerLiveVideo,
        }),
      });
      setListingForm({ title: '', location: '', rentAmount: '', genderCategory: 'BOTH', totalCapacity: '', amenitiesCsv: '', description: '', roomImages: [], ownerPhoto: null, ownerLiveVideo: null });
      setListingConfirmed(false);
      await loadDashboard();
    });
  };

  const handleUpdateListing = async () => {
    if (!ensureListingAccess()) {
      return;
    }
    await performAction(async () => {
      await apiRequest(`/api/listings/owner/${listingPopup.data.id}`, {
        method: 'PUT',
        auth: true,
        isFormData: true,
        body: createMultipartForm({
          title: listingPopup.data.title,
          location: listingPopup.data.location,
          description: listingPopup.data.description,
          rentAmount: listingPopup.data.rentAmount,
          genderCategory: listingPopup.data.genderCategory,
          totalCapacity: listingPopup.data.totalCapacity,
          amenitiesCsv: listingPopup.data.amenitiesCsv,
          roomImages: listingPopup.data.roomImages,
          ownerPhoto: listingPopup.data.ownerPhoto,
          ownerLiveVideo: listingPopup.data.ownerLiveVideo,
        }),
      });
      setListingPopup(null);
      await loadDashboard();
    });
  };

  const handleDeleteListing = async (listingId) => {
    await performAction(async () => {
      await apiRequest(`/api/listings/owner/${listingId}`, { method: 'DELETE', auth: true });
      await loadDashboard();
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
      setVerificationHistory(current => [normalizedResult, ...current.filter(item => item.verificationId !== normalizedResult.verificationId)]);
      await syncUser();
      await loadDashboard();
      setVerifyStep(3);
    } catch (error) {
      setActionError(error.message);
      setVerifyStep(3);
      setVerificationResult(prepareVerificationDisplay({ verified: false, status: 'FAILED', message: error.message }));
    }
  };

  const handlePlatformFeedback = async () => {
    await performAction(async () => {
      await apiRequest('/api/feedbacks/me', {
        method: 'POST',
        auth: true,
        body: {
          feedbackScope: 'PLATFORM',
          rating: feedback.rating,
          message: feedback.text,
          location: profile?.locality || profile?.addressLineOne || '',
        },
      });
      setFeedbackSent(true);
      setFeedback({ text: '', rating: 0 });
    });
  };

  const handleAcceptBooking = async (requestId) => {
    await performAction(async () => {
      await apiRequest(`/api/bookings/requests/${requestId}/accept`, { method: 'PATCH', auth: true });
      await loadDashboard();
    });
  };

  const handleRejectBooking = async (requestId, reason) => {
    await performAction(async () => {
      await apiRequest(`/api/bookings/requests/${requestId}/reject`, { method: 'PATCH', auth: true, body: { reason } });
      await loadDashboard();
    });
  };

  const handleUpdatePayment = async (paymentId, paymentForm) => {
    await performAction(async () => {
      await apiRequest(`/api/bookings/payments/${paymentId}`, {
        method: 'PATCH',
        auth: true,
        body: {
          dueDate: paymentForm.dueDate || undefined,
          reminderMessage: paymentForm.reminderMessage || undefined,
          notes: paymentForm.notes || undefined,
          status: paymentForm.status || undefined,
        },
      });
      await loadDashboard();
    });
  };

  const handleCreateComplaint = async ({ studentUserCode, title, description, attachments, relatedStayId, relatedListingId }) => {
    await performAction(async () => {
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
      await loadDashboard();
    });
  };

  const handleReviewCancelRequest = async (cancelRequestId, accept, ownerReason) => {
    await performAction(async () => {
      await apiRequest(`/api/bookings/cancel-requests/${cancelRequestId}`, {
        method: 'PATCH',
        auth: true,
        body: { accept, ownerReason },
      });
      await loadDashboard();
    });
  };

  const handleCloseComplaint = async (complaintId) => {
    await performAction(async () => {
      await apiRequest(`/api/complaints/${complaintId}/close`, { method: 'PATCH', auth: true });
      await loadDashboard();
    });
  };

  const handleReopenComplaint = async (complaintId, message, attachments) => {
    await performAction(async () => {
      await apiRequest(`/api/complaints/${complaintId}/re-open`, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: createMultipartForm({ message, attachments }),
      });
      await loadDashboard();
    });
  };

  const handleResolveComplaint = async (complaintId, message, attachments) => {
    await performAction(async () => {
      await apiRequest(`/api/complaints/${complaintId}/justify`, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: createMultipartForm({ message, attachments }),
      });
      await loadDashboard();
    });
  };

  const notifications = [
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
      {editPopup && (
        <Popup title="Edit Profile" onClose={() => { setEditPopup(false); setEditPwdGate(''); setEditPwdErr(''); setEditPwdConfirmed(false); }}>
          {!editPwdConfirmed ? (
            <>
              <p style={{ color: C.textLight, fontSize: 14, marginBottom: 14 }}>Please enter your current password to edit your profile.</p>
              {editPwdErr && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>{editPwdErr}</div>}
              <FInput label="Current Password" placeholder="Enter your current password" type="password" value={editPwdGate} onChange={event => setEditPwdGate(event.target.value)} />
              <button onClick={() => { if (editPwdGate.trim()) { setEditPwdConfirmed(true); setEditPwdErr(''); } else { setEditPwdErr('Please enter your current password.'); } }} style={{ ...BTN.primary, width: '100%', padding: 11 }}>Verify Password</button>
            </>
          ) : (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 14 }}>✓ Password confirmed. You can now edit your profile.</p>
              <FInput label="Full Name" placeholder="Full name" value={editForm.fullName} onChange={event => setEditForm(current => ({ ...current, fullName: event.target.value }))} />
              <FInput label="Email ID" placeholder="Email address" type="email" value={editForm.email} onChange={event => setEditForm(current => ({ ...current, email: event.target.value }))} />
              <FInput label="Mobile Number" placeholder="Mobile number" value={editForm.mobile} onChange={event => setEditForm(current => ({ ...current, mobile: event.target.value }))} />
              <FInput label="PAN Number" placeholder="PAN number" value={editForm.pan} onChange={event => setEditForm(current => ({ ...current, pan: event.target.value }))} />
              <FInput label="PG Name" placeholder="PG name" value={editForm.pgName} onChange={event => setEditForm(current => ({ ...current, pgName: event.target.value }))} />
              <FInput label="Business Name" placeholder="Business name" value={editForm.businessName} onChange={event => setEditForm(current => ({ ...current, businessName: event.target.value }))} />
              <FInput label="Address Line 1" placeholder="Address line 1" value={editForm.addressLineOne} onChange={event => setEditForm(current => ({ ...current, addressLineOne: event.target.value }))} />
              <FInput label="Address Line 2" placeholder="Address line 2" value={editForm.addressLineTwo} onChange={event => setEditForm(current => ({ ...current, addressLineTwo: event.target.value }))} />
              <FInput label="Locality" placeholder="Locality" value={editForm.locality} onChange={event => setEditForm(current => ({ ...current, locality: event.target.value }))} />
              <FInput label="Pincode" placeholder="Pincode" value={editForm.pincode} onChange={event => setEditForm(current => ({ ...current, pincode: event.target.value }))} />
              <FInput label="New Password" placeholder="Leave blank to keep current password" type="password" value={editForm.password} onChange={event => setEditForm(current => ({ ...current, password: event.target.value }))} />
              <FInput label="Confirm Password" placeholder="Confirm password" type="password" value={editForm.confirmPassword} onChange={event => setEditForm(current => ({ ...current, confirmPassword: event.target.value }))} />
              <PasswordRequirements password={editForm.password} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Profile Photo Upload</label>
                <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <input type="file" accept="image/*" onChange={event => setEditForm(current => ({ ...current, photo: event.target.files?.[0] || null }))} style={{ width: '100%', fontSize: 12 }} />
                </div>
                <FilePreviewList files={editForm.photo ? [editForm.photo] : []} title="Profile Photo Preview" />
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
          <FInput label="Total Capacity" value={listingPopup.data.totalCapacity || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, totalCapacity: event.target.value } }))} />
          <FInput label="Amenities" value={listingPopup.data.amenitiesCsv || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, amenitiesCsv: event.target.value } }))} />
          <FTextarea label="Description" value={listingPopup.data.description || ''} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, description: event.target.value } }))} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Owner Photo</label>
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
              <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={event => setListingPopup(current => ({ ...current, data: { ...current.data, ownerPhoto: event.target.files?.[0] || null } }))} />
                Upload Owner Photo
              </label>
            </div>
          </div>
          <button onClick={handleUpdateListing} style={{ ...BTN.primary, width: '100%', padding: 11 }} disabled={actionLoading}>Save Listing Changes</button>
        </Popup>
      )}

      <nav style={{ background: C.primary, padding: '0 20px', zIndex: 100, position: 'sticky', top: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setCollapsed(current => !current)} style={{ ...BTN.ghost, color: '#fff', fontSize: 18 }}>☰</button>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white size={22} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
            <button onClick={() => { setPage('dashboard'); setTimeout(() => notifRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }} title="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, position: 'relative', padding: '4px 8px' }}>🔔{notifications.length > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#EF4444', borderRadius: '50%' }} />}</button>
            <button onClick={() => setPage('profile')} style={{ ...BTN.accent, padding: '6px 14px', fontSize: 13 }}>🏠 {user?.name}</button>
            <button onClick={signOut} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: collapsed ? 56 : 220, background: '#fff', borderRight: `1px solid ${C.border}`, transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ paddingTop: 12 }}>
            {MENU.map(item => (
              <button key={item.key} onClick={() => setPage(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', border: 'none', background: page === item.key ? `${C.primary}15` : 'transparent', color: page === item.key ? C.primary : C.text, cursor: 'pointer', textAlign: 'left', fontWeight: page === item.key ? 800 : 500, fontSize: 14, borderLeft: page === item.key ? `3px solid ${C.primary}` : '3px solid transparent', transition: 'all 0.2s' }}>
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
                  {MENU.map(item => <button key={item.key} onClick={() => setPage(item.key)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 10px', cursor: 'pointer', textAlign: 'center' }}><div style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{item.label}</div></button>)}
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
                {[['Owner ID', profile?.userCode], ['Name', profile?.displayName], ['Mobile Number', profile?.mobileNumber], ['Email ID', profile?.email], ['PAN Number', profile?.panNumber], ['PG Name', profile?.pgName], ['Address', profile?.addressLineOne || profile?.locality], ['Identity Verified', profile?.identityVerified ? 'Yes' : 'No']].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.textLight, fontSize: 14 }}>{label}</span><span style={{ fontWeight: 600, fontSize: 14 }}>{value || '-'}</span></div>)}
                <button onClick={openEditPopup} style={{ ...BTN.primary, marginTop: 16 }}>✏️ Edit Profile</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}><button onClick={signOut} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🚪 Logout</button><button onClick={() => setDeletePopup(true)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🗑️ Delete Account</button></div>
            </div>
          )}
          {page === 'bookingMgmt' && <BookingManagement bookingRequests={bookingRequests} ownerStays={ownerStays} payments={payments} cancelRequests={cancelRequests} studentComplaints={studentComplaints} connectedStudents={connectedStudents} onAcceptBooking={handleAcceptBooking} onRejectBooking={handleRejectBooking} onUpdatePayment={handleUpdatePayment} onCreateComplaint={handleCreateComplaint} onReviewCancelRequest={handleReviewCancelRequest} onCloseComplaint={handleCloseComplaint} onReopenComplaint={handleReopenComplaint} actionLoading={actionLoading} />}
          {page === 'listingMgmt' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🏢 Listing Management</h2>
              <SCard title="➕ Create New Listing" icon="🏢">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FInput label="Room Title" placeholder="e.g. Sunrise PG for Boys" value={listingForm.title} onChange={event => { setListingForm(current => ({ ...current, title: event.target.value })); setListingConfirmed(false); }} />
                  <FInput label="Location" placeholder="Full address" value={listingForm.location} onChange={event => { setListingForm(current => ({ ...current, location: event.target.value })); setListingConfirmed(false); }} />
                  <FInput label="Rent / Month (₹)" placeholder="e.g. 7500" value={listingForm.rentAmount} onChange={event => { setListingForm(current => ({ ...current, rentAmount: event.target.value })); setListingConfirmed(false); }} />
                  <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Room Type</label><select value={listingForm.genderCategory} onChange={event => { setListingForm(current => ({ ...current, genderCategory: event.target.value })); setListingConfirmed(false); }} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}><option value="MALE">Boys</option><option value="FEMALE">Girls</option><option value="BOTH">Both</option></select></div>
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
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>👤 Owner Photo</label>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
                      <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="image/*" style={{ display: 'none' }} onChange={event => { setListingForm(current => ({ ...current, ownerPhoto: event.target.files?.[0] || null })); setListingConfirmed(false); }} />Upload Owner Photo</label>
                    </div>
                    {profile?.profilePhotoUrl && !listingForm.ownerPhoto ? <div style={{ marginTop: 8, fontSize: 12, color: C.textLight }}>Current owner profile photo will be used unless you upload a new one here.</div> : null}
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>🎥 Live Video of Owner Face</label>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
                      <label style={{ ...BTN.primary, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'inline-block' }}><input type="file" accept="video/*" capture="environment" style={{ display: 'none' }} onChange={event => { setListingForm(current => ({ ...current, ownerLiveVideo: event.target.files?.[0] || null })); setListingConfirmed(false); }} />📷 Open Camera & Record</label>
                    </div>
                  </div>
                </div>
                <FilePreviewList files={[...listingForm.roomImages, listingForm.ownerPhoto, listingForm.ownerLiveVideo].filter(Boolean)} title="Listing Media Preview" />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}><button style={{ ...BTN.outline }} onClick={() => { setListingForm({ title: '', location: '', rentAmount: '', genderCategory: 'BOTH', totalCapacity: '', amenitiesCsv: '', description: '', roomImages: [], ownerPhoto: null, ownerLiveVideo: null }); setListingConfirmed(false); }}>↺ Reset</button><button onClick={() => setListingConfirmed(true)} style={{ ...BTN.outline }}>Confirm Media</button><button onClick={handleCreateListing} style={{ ...BTN.primary }} disabled={actionLoading}>📤 Send Request to Admin</button></div>
              </SCard>
              <SCard title="🟢 Live Listings" icon="📋">
                {liveListings.length === 0 ? <EmptyState icon="🏢" title="No owner listings yet" subtitle="Create your first listing to see it here." /> : <TableWrap headers={['Listing Name', 'Available Space', 'Address + Monthly Rent', 'Verification Status', 'Actions']}>{liveListings.map(listing => <TR key={listing.id}><TD>{listing.title}</TD><TD>{listing.availableCapacity}/{listing.totalCapacity}</TD><TD><div style={{ color: C.textLight, fontSize: 12 }}>{listing.location}</div><div style={{ fontWeight: 700 }}>{formatCurrency(listing.rentAmount)}/mo</div></TD><TD><StatusBadge status={listing.latestFakeDetectionStatus || listing.status} /></TD><TD><div style={{ display: 'flex', gap: 6 }}><button onClick={() => setListingPopup({ type: 'edit', data: { ...listing, amenitiesCsv: (listing.amenities || []).join(', '), ownerPhoto: null } })} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>✏️ Edit</button><button onClick={() => handleDeleteListing(listing.id)} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }} disabled={actionLoading}>🗑️ Delete</button></div></TD></TR>)}</TableWrap>}
              </SCard>
              <SCard title="❌ View Rejected Listings" icon="📉">
                {rejectedListings.length === 0 ? <EmptyState icon="✅" title="No rejected listings" subtitle="Rejected listings will appear here if admins send one back." /> : <TableWrap headers={['Listing ID', 'Reason for Rejection', 'Actions']}>{rejectedListings.map(listing => <TR key={listing.id}><TD>{String(listing.id).slice(0, 8)}</TD><TD style={{ whiteSpace: 'normal' }}>{listing.rejectionReason || 'Listing was rejected during review.'}</TD><TD><div style={{ display: 'flex', gap: 6 }}><button onClick={() => setListingPopup({ type: 'edit', data: { ...listing, amenitiesCsv: (listing.amenities || []).join(', '), ownerPhoto: null } })} style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>✏️ Update Listing</button><button onClick={() => handleDeleteListing(listing.id)} style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }} disabled={actionLoading}>🗑️ Remove</button></div></TD></TR>)}</TableWrap>}
              </SCard>
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
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}><button onClick={() => { if (!verifyFiles.liveImage || !verifyFiles.panImage || !verifyFiles.userSignature) { setActionError('Please select all verification files first.'); return; } setVerifyConfirmed(true); setActionError(''); }} style={{ ...BTN.outline, flex: 1, minWidth: 180 }}>Confirm Selected Media</button><button onClick={handlePerformVerification} disabled={!profile?.profileComplete} style={{ ...BTN.primary, flex: 1, minWidth: 180, opacity: profile?.profileComplete ? 1 : 0.5, cursor: profile?.profileComplete ? 'pointer' : 'not-allowed' }}>🤖 Perform AI Verification</button></div>
                  </>
                )}
                {verifyStep === 1 && <div style={{ textAlign: 'center', padding: 24 }}><div style={{ fontSize: 48, display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 12 }}>🔄</div><div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>AI Verification in progress...</div></div>}
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

      <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
