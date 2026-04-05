import { useState, useRef } from 'react';
import { C, BTN } from '../constants/theme';
import { ROOMS } from '../data/mockData';
import { Logo, VerifiedBadge } from '../components/shared/SharedComponents';
import Popup from '../components/shared/Popup';
import SlidingTabs from '../components/shared/SlidingTabs';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    'Accepted': [C.success, '✓'], 'Rejected': [C.danger, '✕'], 'Under Progress': ['#D97706', '⏳'],
    'Paid': [C.success, '✓'], 'Unpaid': [C.danger, '✕'], 'Nil': [C.success, '✓'], 'Due': [C.danger, '!'],
    'Live': [C.success, '🟢'], 'Under Review': ['#D97706', '⏳'], 'Student Provided Justification': [C.secondary, '💬'],
    'Verified': [C.success, '✓'], 'Not Verified': [C.danger, '✕']
  };
  const [color, icon] = cfg[status] || [C.textLight, '•'];
  return <span style={{ background: color + '18', color, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{icon} {status}</span>;
}
function TableWrap({ headers, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflowX: 'auto', width: '100%' }}>
      <table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: C.bg }}>{headers.map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function TR({ children }) { return <tr style={{ borderTop: `1px solid ${C.border}` }}>{children}</tr>; }
function TD({ children, style = {} }) { return <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap', ...style }}>{children}</td>; }
function FInput({ label, placeholder, type = 'text', value, onChange, readOnly }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} readOnly={readOnly}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: readOnly ? C.bg : '#fff' }} />
    </div>
  );
}
function FTextarea({ label, placeholder, rows = 4, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label>}
      <textarea placeholder={placeholder} rows={rows} value={value} onChange={onChange}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
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
      <span style={{ fontWeight: 600, color: C.text }}>{value}</span>
    </div>
  );
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_BOOKING_REQUESTS = [
  { bookingId: 'BKG001', studentName: 'Priya Sharma', college: 'MIT Pune', date: '2025-11-01', listing: 'Sunrise PG for Boys', space: '2/10' },
  { bookingId: 'BKG002', studentName: 'Ankit Verma', college: 'COEP Pune', date: '2025-11-02', listing: 'Sunrise PG for Boys', space: '2/10' },
];
const MOCK_STUDENTS_PAYMENT = [
  { studentId: 'STU001', studentName: 'Priya Sharma', monthRange: '1st May to 31st May', paymentStatus: 'Paid', nextDue: '1st June 2025', accountStatus: 'Nil' },
  { studentId: 'STU002', studentName: 'Ankit Verma', monthRange: '1st May to 31st May', paymentStatus: 'Unpaid', nextDue: '1st June 2025', accountStatus: 'Due' },
];
const MOCK_CANCEL_REQUESTS = [
  { studentId: 'STU001', studentName: 'Priya Sharma', roomId: 'RM-001', reason: 'Going back home permanently', accountStatus: 'Nil' },
  { studentId: 'STU002', studentName: 'Ankit Verma', roomId: 'RM-001', reason: 'Found another place', accountStatus: 'Due' },
];
const MOCK_COMPLAINTS_STATUS = [
  { id: 'CPL001', status: 'Student Provided Justification', justification: 'I have paid via UPI on 2nd May. Please check transaction ID: TXN123456789.' },
  { id: 'CPL002', status: 'Under Progress', justification: '' },
];
const MOCK_CONNECTED_STUDENTS = [
  { studentId: 'STU001', studentName: 'Priya Sharma', college: 'MIT Pune', phone: '+91 98765 43210', email: 'priya@gmail.com', location: 'Koregaon Park', enrollNo: 'EN2024001' },
  { studentId: 'STU002', studentName: 'Ankit Verma', college: 'COEP Pune', phone: '+91 87654 32109', email: 'ankit@gmail.com', location: 'Viman Nagar', enrollNo: 'EN2024002' },
];
const MOCK_REJECTED_LISTINGS = [
  { id: 'LST-009', reason: 'Images are unclear and blur. Upload high quality images.' }
];

// ─── BOOKING MANAGEMENT (6 sliding tabs) ─────────────────────────────────────
function BookingManagement({ user }) {
  const [popup, setPopup] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reminderMsg, setReminderMsg] = useState('');
  const [complaint, setComplaint] = useState({ studentId: '', title: '', desc: '' });
  const [reComplaint, setReComplaint] = useState({ reason: '', msg: '' });
  const [paymentStatuses, setPaymentStatuses] = useState(() =>
    Object.fromEntries(MOCK_STUDENTS_PAYMENT.map(s => [s.studentId, s.paymentStatus]))
  );

  const tabs = [
    { icon: '📋', label: 'Student Room Management' },
    { icon: '💳', label: 'Student Payment Management' },
    { icon: '📣', label: 'Complaint Against Student' },
    { icon: '❌', label: 'Student Room Cancel Requests' },
    { icon: '📊', label: 'Complaint Against Student Status' },
    { icon: '👥', label: 'See All Connected Students' },
  ];

  return (
    <div>
      {popup?.type === 'rejectBooking' && (
        <Popup title="Reject Booking Request" onClose={() => setPopup(null)}>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 14 }}>Booking ID: <b>{popup.data.bookingId}</b> — Student: <b>{popup.data.studentName}</b></p>
          <FTextarea label="Reason to Reject" placeholder='e.g. "Sorry, space is full"' value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <button onClick={() => { alert('Booking rejected!'); setPopup(null); setRejectReason(''); }}
            style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            ✕ Submit Rejection
          </button>
        </Popup>
      )}
      {popup?.type === 'payHistory' && (
        <Popup title={`Payment History — ${popup.data.studentName}`} onClose={() => setPopup(null)}>
          <TableWrap headers={['Month', 'Amount', 'Status', 'Action']}>
            {['January','February','March','April','May'].map((m, i) => (
              <TR key={i}>
                <TD>{m} 2025</TD>
                <TD>₹7,500</TD>
                <TD><StatusBadge status={i < 4 ? 'Paid' : 'Unpaid'} /></TD>
                <TD>
                  {i >= 4 && (
                    <button onClick={() => setPopup({ type: 'payReminder', data: popup.data })}
                      style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ⚠ Send Reminder
                    </button>
                  )}
                </TD>
              </TR>
            ))}
          </TableWrap>
        </Popup>
      )}
      {popup?.type === 'payReminder' && (
        <Popup title="Send Payment Reminder" onClose={() => setPopup(null)}>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 14 }}>Sending reminder to: <b>{popup.data.studentName}</b></p>
          <FTextarea label="Reminder Message" placeholder="Please pay your pending rent..." value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} rows={4} />
          <button onClick={() => { alert('Reminder sent!'); setPopup(null); setReminderMsg(''); }}
            style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Send Reminder</button>
        </Popup>
      )}
      {popup?.type === 'sendDue' && (
        <Popup title="Send Due Date" onClose={() => setPopup(null)}>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 14 }}>Student: <b>{popup.data.studentName}</b></p>
          <FInput label="Due Date" placeholder="e.g. 1st June 2025" />
          <FInput label="Month Range" placeholder="e.g. 1st June to 30th June" />
          <button onClick={() => { alert('Due date sent!'); setPopup(null); }}
            style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Send Due Date</button>
        </Popup>
      )}
      {popup?.type === 'rejectCancel' && (
        <Popup title="Reject Cancel Request" onClose={() => setPopup(null)}>
          <FTextarea label="Reason" placeholder='e.g. "Please pay your dues first"' value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <button onClick={() => { alert('Rejection sent!'); setPopup(null); setRejectReason(''); }}
            style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer' }}>
            Submit Rejection
          </button>
        </Popup>
      )}
      {popup?.type === 'studentJustification' && (
        <Popup title="Student Justification" onClose={() => setPopup(null)}>
          <p style={{ color: C.text, lineHeight: 1.7, fontSize: 14 }}>{popup.data.justification}</p>
        </Popup>
      )}
      {popup?.type === 'reComplaintPopup' && (
        <Popup title="Re-Complaint Against Student" onClose={() => setPopup(null)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Reason for Re-Complaint</label>
            <select value={reComplaint.reason} onChange={e => setReComplaint(p => ({ ...p, reason: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
              <option value="">Select reason...</option>
              <option>Student has not replied</option>
              <option>Not satisfied with student justification</option>
              <option>Issue still not resolved</option>
            </select>
          </div>
          <FTextarea label="Message" placeholder="Provide more context..." value={reComplaint.msg} onChange={e => setReComplaint(p => ({ ...p, msg: e.target.value }))} />
          <button onClick={() => { alert('Re-complaint submitted!'); setPopup(null); setReComplaint({ reason: '', msg: '' }); }}
            style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Send Re-Complaint</button>
        </Popup>
      )}
      {popup?.type === 'studentDetail' && (
        <Popup title="Student Profile Details" onClose={() => setPopup(null)}>
          {[['Student ID', popup.data.studentId], ['Full Name', popup.data.studentName], ['College', popup.data.college],
            ['Phone', popup.data.phone], ['Email', popup.data.email], ['Location', popup.data.location], ['Enrollment No.', popup.data.enrollNo]].map(([k, v]) => (
            <InfoRow key={k} label={k} value={v} />
          ))}
        </Popup>
      )}

      <SlidingTabs tabs={tabs}>

        {/* Tab 1: Student Room Management */}
        <div>
          <h3 style={{ color: C.text, fontWeight: 900, marginBottom: 16 }}>📋 Student Room Management</h3>
          <TableWrap headers={['Booking ID', 'Student Name', 'College', 'Date Requested', 'Listing', 'Space Available', 'Actions']}>
            {MOCK_BOOKING_REQUESTS.map((r, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{r.bookingId}</span></TD>
                <TD><span style={{ fontWeight: 700 }}>{r.studentName}</span></TD>
                <TD>{r.college}</TD>
                <TD>{r.date}</TD>
                <TD>{r.listing}</TD>
                <TD><span style={{ fontWeight: 700, fontSize: 13 }}>{r.space}</span></TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => alert('Booking accepted!')}
                      style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Accept</button>
                    <button onClick={() => setPopup({ type: 'rejectBooking', data: r })}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>

        {/* Tab 2: Student Payment Management */}
        <div>
          <h3 style={{ color: C.text, fontWeight: 900, marginBottom: 16 }}>💳 Student Payment Management</h3>
          <TableWrap headers={['Student ID', 'Student Name', 'Edit Current Month Payment', 'Current Month Payment Status', 'Next Due Date', 'Account Status', 'Actions']}>
            {MOCK_STUDENTS_PAYMENT.map((s, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.studentId}</span></TD>
                <TD><span style={{ fontWeight: 700 }}>{s.studentName}</span></TD>
                <TD>
                  <div style={{ fontSize: 11, color: C.textLight, marginBottom: 6 }}>Payment for {s.monthRange}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => setPaymentStatuses(prev => ({ ...prev, [s.studentId]: 'Paid' }))}
                      style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Paid</button>
                    <button onClick={() => setPaymentStatuses(prev => ({ ...prev, [s.studentId]: 'Unpaid' }))}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕ Unpaid</button>
                  </div>
                </TD>
                <TD><StatusBadge status={paymentStatuses[s.studentId] || s.paymentStatus} /></TD>
                <TD>
                  <div style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>Due for month</div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{s.nextDue}</span>
                </TD>
                <TD><StatusBadge status={s.accountStatus} /></TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => setPopup({ type: 'sendDue', data: s })}
                      style={{ background: C.primary + '15', color: C.primary, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📅 Send Due</button>
                    <button onClick={() => setPopup({ type: 'payHistory', data: s })}
                      style={{ background: '#F0FFF4', color: C.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📜 View History</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>

        {/* Tab 3: Complaint Against Student */}
        <div>
          <h3 style={{ color: C.text, fontWeight: 900, marginBottom: 16 }}>📣 Complaint Against Student</h3>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, maxWidth: 560 }}>
            <FInput label="Student ID" placeholder="Enter student ID" value={complaint.studentId} onChange={e => setComplaint(p => ({ ...p, studentId: e.target.value }))} />
            <FInput label="Issue Title" placeholder="Brief title of your complaint" value={complaint.title} onChange={e => setComplaint(p => ({ ...p, title: e.target.value }))} />
            <FTextarea label="Describe Issue in Detail" placeholder="Provide full details of the issue..." value={complaint.desc} onChange={e => setComplaint(p => ({ ...p, desc: e.target.value }))} />
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
              <span style={{ color: C.textLight, fontSize: 13, marginRight: 8 }}>📎 Attach Files</span>
              <label style={{ ...BTN.outline, padding: '5px 14px', fontSize: 12, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" style={{ display: 'none' }} /> Choose Files
              </label>
            </div>
            <button onClick={() => { alert('Complaint submitted to student!'); setComplaint({ studentId: '', title: '', desc: '' }); }}
              style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Submit Complaint to Student</button>
          </div>
        </div>

        {/* Tab 4: Student Room Cancel Requests */}
        <div>
          <h3 style={{ color: C.text, fontWeight: 900, marginBottom: 16 }}>❌ Student Room Cancel Requests</h3>
          <TableWrap headers={['Student ID', 'Student Name', 'Room ID', 'Reason', 'Account Status', 'Actions']}>
            {MOCK_CANCEL_REQUESTS.map((r, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.studentId}</span></TD>
                <TD><span style={{ fontWeight: 700 }}>{r.studentName}</span></TD>
                <TD><span style={{ fontFamily: 'monospace' }}>{r.roomId}</span></TD>
                <TD><span style={{ fontSize: 12, color: C.text }}>{r.reason}</span></TD>
                <TD><StatusBadge status={r.accountStatus} /></TD>
                <TD>
                  {r.accountStatus === 'Nil' ? (
                    <button onClick={() => alert('Cancel request accepted!')}
                      style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Accept</button>
                  ) : (
                    <button onClick={() => setPopup({ type: 'rejectCancel', data: r })}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                  )}
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>

        {/* Tab 5: Complaint Against Student Status */}
        <div>
          <h3 style={{ color: C.text, fontWeight: 900, marginBottom: 16 }}>📊 Complaint Against Student Status</h3>
          <TableWrap headers={['Complaint ID', 'Status', 'Student Justification', 'Actions']}>
            {MOCK_COMPLAINTS_STATUS.map((c, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{c.id}</span></TD>
                <TD><StatusBadge status={c.status} /></TD>
                <TD>
                  {c.justification ? (
                    <button onClick={() => setPopup({ type: 'studentJustification', data: c })}
                      style={{ background: C.secondary + '15', color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      💬 Click to See
                    </button>
                  ) : (
                    <span style={{ color: C.textLight, fontSize: 12 }}>Awaiting response...</span>
                  )}
                </TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => { if (window.confirm('Do you really want to close this complaint?')) alert('Complaint closed!'); }}
                      style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Close</button>
                    <button onClick={() => setPopup({ type: 'reComplaintPopup', data: c })}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔁 Re-Complaint</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>

        {/* Tab 6: See All Connected Students */}
        <div>
          <h3 style={{ color: C.text, fontWeight: 900, marginBottom: 16 }}>👥 All Connected Students</h3>
          <TableWrap headers={['Student ID', 'Student Name', 'College Name', 'Action']}>
            {MOCK_CONNECTED_STUDENTS.map((s, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.studentId}</span></TD>
                <TD><span style={{ fontWeight: 700 }}>{s.studentName}</span></TD>
                <TD>{s.college}</TD>
                <TD>
                  <button onClick={() => setPopup({ type: 'studentDetail', data: s })}
                    style={{ background: C.primary + '15', color: C.primary, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    👤 See More Details
                  </button>
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>
      </SlidingTabs>
    </div>
  );
}

// ─── SEE COMPLAINTS ───────────────────────────────────────────────────────────
function SeeComplaints() {
  const [popup, setPopup] = useState(null);
  const [justification, setJustification] = useState('');
  const COMPLAINTS = [
    { id: 'CPL001', userName: 'Priya Sharma (Student)', issue: 'Noise Complaint', description: 'Student is making noise after midnight repeatedly.' },
  ];
  return (
    <div>
      {popup?.type === 'resolve' && (
        <Popup title="Resolve Complaint" onClose={() => { setPopup(null); setJustification(''); }}>
          <FTextarea label="Your Full Justification" placeholder="Explain how the issue was resolved..." value={justification} onChange={e => setJustification(e.target.value)} rows={5} />
          <button onClick={() => { alert('Resolution submitted!'); setPopup(null); setJustification(''); }}
            style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Submit Resolution</button>
        </Popup>
      )}
      <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📋 See Complaints</h2>
      <TableWrap headers={['Complaint ID', 'User Name', 'Issue', 'Description', 'Action']}>
        {COMPLAINTS.map((c, i) => (
          <TR key={i}>
            <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{c.id}</span></TD>
            <TD><span style={{ fontWeight: 600 }}>{c.userName}</span></TD>
            <TD><span style={{ fontWeight: 700 }}>{c.issue}</span></TD>
            <TD><span style={{ fontSize: 12, color: C.textLight }}>{c.description}</span></TD>
            <TD>
              <button onClick={() => setPopup({ type: 'resolve', data: c })}
                style={{ background: C.primary + '15', color: C.primary, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Resolve
              </button>
            </TD>
          </TR>
        ))}
      </TableWrap>
    </div>
  );
}

// ─── SIDEBAR MENU ─────────────────────────────────────────────────────────────
const MENU = [
  { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { key: 'profile', icon: '👤', label: 'My Profile' },
  { key: 'bookingMgmt', icon: '📅', label: 'Booking Management' },
  { key: 'listingMgmt', icon: '🏢', label: 'Listing Management' },
  { key: 'verify', icon: '🪪', label: 'Verify Profile' },
  { key: 'feedback', icon: '⭐', label: 'Feedback & Rating' },
  { key: 'complaints', icon: '🔔', label: 'See Complaints' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function OwnerDashboard({ user, setUser, navigate }) {
  if (!user || user.role !== 'owner') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, color: C.text }}>Owner sign-in required</h2>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 18 }}>Please sign in with an owner account to access this dashboard.</p>
          <button onClick={() => navigate('login')} style={{ ...BTN.primary, padding: '10px 20px' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  const [editPwdGate, setEditPwdGate] = useState('');
  const [editPwdErr, setEditPwdErr] = useState('');
  const [editPwdConfirmed, setEditPwdConfirmed] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [pwdVerify, setPwdVerify] = useState('');
  const [pwdConfirmed, setPwdConfirmed] = useState(false);
  const [listingPopup, setListingPopup] = useState(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyAnim, setVerifyAnim] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '', pan: '', pgName: '', pgAddress: '', password: '', confirmPassword: '', photo: null });
  const [liveListings, setLiveListings] = useState(ROOMS.slice(0, 2));
  const [rejectedListings, setRejectedListings] = useState(MOCK_REJECTED_LISTINGS);
  const [verificationResult, setVerificationResult] = useState(null);
  const notifRef = useRef(null);

  // Profile completion
  const profileFields = [editForm.fullName || 'Rajesh', editForm.email || 'owner@stazy.in', editForm.mobile || '+91 98765 43210', editForm.pan || 'ABCDE1234F', editForm.pgName || 'Sunrise PG', editForm.pgAddress || 'Koregaon Park'];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const ownerId = 'OWN-' + (user?.name?.substring(0, 3).toUpperCase() || 'OWN') + '-2024001';

  const handleNotifClick = () => {
    setPage('dashboard');
    setTimeout(() => notifRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handlePerformAIVerify = () => {
    if (profileCompletion < 100) {
      alert('Please complete your profile to 100% before performing AI verification.');
      return;
    }
    setVerifyAnim(true);
    setTimeout(() => {
      setVerifyAnim(false);
      setVerifyStep(3);
      // Mocking result: verified true
      setVerificationResult({ verified: true, message: 'Identity Verified!' });
    }, 1200);
  };

  const handleDeleteListing = (id) => {
    if (window.confirm('Do you really want to delete this listing?')) {
      setLiveListings(prev => prev.filter(r => r.id !== id));
      alert('Listing deleted!');
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {editPopup && (
        <Popup title="Edit Profile" onClose={() => { setEditPopup(false); setEditPwdGate(''); setEditPwdErr(''); setEditPwdConfirmed(false); setEditForm({ fullName: '', email: '', mobile: '', pan: '', pgName: '', pgAddress: '', password: '', confirmPassword: '', photo: null }); }}>
          {!editPwdConfirmed ? (
            <>
              <p style={{ color: C.textLight, fontSize: 14, marginBottom: 14 }}>Please enter your current password to edit your profile.</p>
              {editPwdErr && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>{editPwdErr}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Current Password</label>
                <input type="password" placeholder="Enter your current password" value={editPwdGate} onChange={e => setEditPwdGate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => {
                if (editPwdGate.length >= 4) { setEditPwdConfirmed(true); setEditPwdErr(''); }
                else { setEditPwdErr('Incorrect password. Please try again.'); }
              }} style={{ ...BTN.primary, width: '100%', padding: 11 }}>Verify Password</button>
            </>
          ) : (
            <>
              <p style={{ color: C.success, fontSize: 13, marginBottom: 14 }}>✓ Password verified. You can now edit your profile.</p>
              {[['fullName','Full Name','text'],['email','Email ID','email'],['mobile','Mobile Number','tel'],['pan','PAN Number','text'],['pgName','PG Name','text'],['pgAddress','PG Address','text']].map(([k,lbl,type]) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{lbl}</label>
                  <input type={type} placeholder={lbl} value={editForm[k]} onChange={e => setEditForm(p => ({...p,[k]:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Password</label>
                <input type="password" placeholder="New password (leave blank to keep current)" value={editForm.password} onChange={e => setEditForm(p => ({...p, password: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>
                  Confirm Password {editForm.password && <span style={{ color: C.danger }}>*</span>}
                </label>
                <input type="password" placeholder={editForm.password ? 'Confirm password (required)' : 'Confirm password'} value={editForm.confirmPassword}
                  onChange={e => setEditForm(p => ({...p, confirmPassword: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`2px solid ${editForm.password && editForm.confirmPassword && editForm.password !== editForm.confirmPassword ? C.danger : C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                {editForm.password && editForm.confirmPassword && editForm.password !== editForm.confirmPassword && (
                  <div style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>⚠ Passwords do not match</div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Profile Photo Upload</label>
                <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <input type="file" accept="image/*" onChange={e => setEditForm(p => ({...p, photo: e.target.files[0]}))} style={{ width: '100%', fontSize: 12 }} />
                  {editForm.photo && <div style={{ color: C.success, fontSize: 12, marginTop: 4 }}>✓ {editForm.photo.name}</div>}
                </div>
              </div>
              <button onClick={() => {
                if (editForm.password && !editForm.confirmPassword) { alert('Please confirm your password.'); return; }
                if (editForm.password && editForm.password !== editForm.confirmPassword) { alert('Passwords do not match.'); return; }
                alert('Profile updated!'); setEditPopup(false); setEditPwdConfirmed(false); setEditPwdGate(''); setEditForm({ fullName: '', email: '', mobile: '', pan: '', pgName: '', pgAddress: '', password: '', confirmPassword: '', photo: null });
              }} style={{ ...BTN.primary, width: '100%', padding: 11 }}>💾 Save Changes</button>
            </>
          )}
        </Popup>
      )}

      {deletePopup && (
        <Popup title="Delete Account" onClose={() => { setDeletePopup(false); setPwdVerify(''); }}>
          <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '12px', marginBottom: 14, fontSize: 13, color: C.danger }}>
            ⚠️ This action is permanent and cannot be undone.
          </div>
          <FInput label="Confirm Password" placeholder="Enter your password" type="password" value={pwdVerify} onChange={e => setPwdVerify(e.target.value)} />
          <button onClick={() => { 
              if (pwdVerify.length >= 4) { 
                if(window.confirm('Do you really want to delete your account?')) {
                  setUser(null); navigate('home'); 
                }
              } else alert('Incorrect password'); 
            }}
            style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 11, width: '100%', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            🗑️ Delete My Account Permanently
          </button>
        </Popup>
      )}

      {/* Edit Listing Popup */}
      {listingPopup?.type === 'editListing' && (
        <Popup title="Edit Listing" onClose={() => setListingPopup(null)} width={600}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FInput label="Room Title" placeholder="Room title" value={listingPopup.data.title || ''} />
            <FInput label="Location" placeholder="Location" value={listingPopup.data.location || ''} />
            <FInput label="Rent / Month (₹)" placeholder="Monthly rent" value={listingPopup.data.rent || ''} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Room Type</label>
              <select style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
                <option>Boys</option><option>Girls</option><option>Both</option>
              </select>
            </div>
            <FInput label="Total Space in Listing" placeholder="e.g. 10" />
            <FInput label="Amenities" placeholder="WiFi, AC, Meals..." />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Description</label>
              <textarea rows={3} placeholder="Room description..." style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>📷 Room Images</label>
              <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                <div style={{ color: C.textLight, fontSize: 13, marginBottom: 8 }}>Drag & drop room images or click to upload</div>
                <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                   Upload Images <input type="file" accept="image/*" multiple style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>📹 Live Video of Owner Face</label>
              <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>🎥</div>
                <div style={{ color: C.textLight, fontSize: 13, marginBottom: 8 }}>Record a short live video of yourself</div>
                <label style={{ ...BTN.primary, padding: '7px 16px', fontSize: 12, cursor: 'pointer', display: 'inline-block' }}>
                   📷 Open Camera <input type="file" accept="video/*" capture="environment" style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
          <button onClick={() => { alert('Listing updated!'); setListingPopup(null); }}
            style={{ ...BTN.primary, width: '100%', padding: 12, marginTop: 8 }}>💾 Save Changes</button>
        </Popup>
      )}

      {/* Navbar */}
      <nav style={{ background: C.primary, padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setCollapsed(c => !c)} style={{ ...BTN.ghost, color: '#fff', fontSize: 18 }}>☰</button>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white size={22} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
            <button onClick={handleNotifClick} title="Notifications"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, position: 'relative', padding: '4px 8px' }}>
              🔔<span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#EF4444', borderRadius: '50%' }} />
            </button>
            <button style={{ ...BTN.accent, padding: '6px 14px', fontSize: 13 }}>🏠 {user?.name}</button>
            <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: collapsed ? 56 : 230, background: '#fff', borderRight: `1px solid ${C.border}`, transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ paddingTop: 12 }}>
            {MENU.map(m => (
              <button key={m.key} onClick={() => setPage(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px',
                border: 'none', background: page === m.key ? C.primary + '15' : 'transparent',
                color: page === m.key ? C.primary : C.text, cursor: 'pointer',
                fontWeight: page === m.key ? 800 : 500, fontSize: 14,
                borderLeft: page === m.key ? `3px solid ${C.primary}` : '3px solid transparent', transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                {!collapsed && <span>{m.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {page === 'dashboard' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#003B95,#0071C2)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Welcome back, {user?.name}! 🏠</h1>
                <p style={{ margin: '6px 0 0', opacity: 0.85 }}>Owner ID: <b>{ownerId}</b></p>
              </div>
              <div ref={notifRef} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontWeight: 800 }}>🔔 Notifications</h3>
                {["Your listing 'Sunrise PG' is under admin review.", "Student Priya Sharma sent a booking request.", "Complete your PAN card verification to go live."].map((n, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: C.text }}>{n}</div>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 12 }}>
                  {MENU.map(m => (
                    <button key={m.key} onClick={() => setPage(m.key)}
                      style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primary + '08'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
                      <div style={{ fontSize: 22, marginBottom: 5 }}>{m.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {page === 'profile' && (
            <div style={{ maxWidth: 600 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>👤 My Profile</h2>
              {/* Profile Completion Progress Bar */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Profile Completion</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: profileCompletion === 100 ? C.success : C.primary }}>{profileCompletion}%</span>
                </div>
                <div style={{ background: C.bg, borderRadius: 99, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${profileCompletion}%`, height: '100%', background: profileCompletion === 100 ? `linear-gradient(90deg, ${C.success}, #34D399)` : `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
                {profileCompletion < 100 && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.textLight }}>Complete all profile fields to enable AI Verification.</p>}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#003B95,#0071C2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👨‍💼</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{user?.name}</div>
                    <div style={{ color: C.textLight, fontSize: 14 }}>Room Owner • Pune</div>
                  </div>
                </div>
                {[
                  ['Owner ID', ownerId], ['Name', user?.name],
                  ['Mobile Number', '+91 98765 43210'], ['Email ID', 'owner@stazy.in'],
                  ['PAN Number', 'ABCDE1234F'], ['PG Name', 'Sunrise PG for Boys'],
                  ['PG Address', 'Koregaon Park, Pune - 411001'], ['Password', '••••••••'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.textLight, fontSize: 14 }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
                  </div>
                ))}
                <button onClick={() => setEditPopup(true)} style={{ ...BTN.primary, marginTop: 16 }}>✏️ Edit Profile</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setUser(null); navigate('home'); }} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🚪 Logout</button>
                <button onClick={() => setDeletePopup(true)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🗑️ Delete Account</button>
              </div>
            </div>
          )}

          {page === 'bookingMgmt' && <BookingManagement user={user} />}

          {page === 'listingMgmt' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🏢 Listing Management</h2>
              {/* Create Listing */}
              <SCard title="➕ Create New Listing" icon="🏢">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FInput label="Room Title" placeholder="e.g. Sunrise PG for Boys" />
                  <FInput label="Location" placeholder="Full address" />
                  <FInput label="Rent / Month (₹)" placeholder="e.g. 7500" />
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Room Type</label>
                    <select style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
                      <option>Boys</option><option>Girls</option><option>Both</option>
                    </select>
                  </div>
                  <FInput label="Total Space in Listing" placeholder="e.g. 10" />
                  <FInput label="Amenities" placeholder="WiFi, AC, Meals, Laundry..." />
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Description</label>
                    <textarea rows={3} placeholder="Describe your room in detail..." style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>📷 Room Images</label>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                      <div style={{ color: C.textLight, fontSize: 13, marginBottom: 8 }}>Drag & drop room images or click to upload</div>
                      <label style={{ ...BTN.outline, fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                        Upload Images <input type="file" accept="image/*" multiple style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>🎥 Live Video of Owner Face</label>
                    <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center', background: C.bg }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>🎥</div>
                      <div style={{ color: C.textLight, fontSize: 13, marginBottom: 8 }}>Record a short live video of your face for identity confirmation</div>
                      <label style={{ ...BTN.primary, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                        📷 Open Camera & Record <input type="file" accept="video/*" capture="environment" style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button style={{ ...BTN.outline }}>↺ Reset</button>
                  <button onClick={() => alert('Request sent to admin!')} style={{ ...BTN.primary }}>📤 Send Request to Admin</button>
                </div>
              </SCard>

              {/* Live Listings Table Format */}
              <SCard title="🟢 Live Listings" icon="📋">
                <TableWrap headers={['Listing Name', 'Available Space', 'Address + Monthly Rent', 'Verification Status', 'Actions']}>
                  {liveListings.map(r => (
                    <TR key={r.id}>
                      <TD><span style={{ fontWeight: 700, color: C.text }}>{r.title}</span></TD>
                      <TD><span style={{ color: C.success, fontSize: 12, fontWeight: 700 }}>3/10 space</span></TD>
                      <TD>
                        <div style={{ color: C.textLight, fontSize: 12 }}>{r.location}</div>
                        <div style={{ fontWeight: 700 }}>₹{r.rent}/mo</div>
                      </TD>
                      <TD><StatusBadge status={r.verified ? 'Verified' : 'Not Verified'} /></TD>
                      <TD>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setListingPopup({ type: 'editListing', data: r })}
                            style={{ ...BTN.outline, padding: '6px 12px', fontSize: 12 }}>✏️ Edit</button>
                          <button onClick={() => handleDeleteListing(r.id)}
                            style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>🗑️ Delete</button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TableWrap>
              </SCard>

              {/* View Rejected Listings */}
              <SCard title="❌ View Rejected Listings" icon="📉">
                <TableWrap headers={['Listing ID', 'Reason for Rejection', 'Actions']}>
                  {rejectedListings.map(r => (
                    <TR key={r.id}>
                      <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.id}</span></TD>
                      <TD><span style={{ color: C.danger, fontSize: 12 }}>{r.reason}</span></TD>
                      <TD>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setListingPopup({ type: 'editListing', data: { id: r.id, title: '', location: '', rent: '' } })}
                            style={{ background: C.primary + '15', color: C.primary, border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✏️ Update Listing</button>
                          <button onClick={() => {
                            if (window.confirm('Do you really want to remove this rejected listing?')) {
                              setRejectedListings(prev => prev.filter(x => x.id !== r.id));
                            }
                          }}
                            style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>🗑️ Remove</button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TableWrap>
              </SCard>
            </div>
          )}

          {page === 'verify' && (
            <div style={{ maxWidth: 500 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🪪 Verify Your Profile</h2>
              <div style={{ background: '#FFFBEB', border: `1px solid #D97706`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
                ⚠️ Please verify your profile within 24 hours of account creation.
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
                {verifyStep === 0 && (<>
                  <h3 style={{ color: C.text, marginBottom: 14 }}>Step 1: Live Photo</h3>
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 10 }}>Capture a live photo of yourself</div>
                    <label style={{ ...BTN.primary, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'inline-block' }}>
                      📷 Open Camera <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} />
                    </label>
                  </div>
                  <h3 style={{ color: C.text, marginBottom: 12 }}>Step 2: Upload PAN Card</h3>
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🪪</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 10 }}>Upload your PAN Card</div>
                    <label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}>
                      Choose File <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} />
                    </label>
                  </div>
                  <h3 style={{ color: C.text, marginBottom: 12 }}>Step 3: Upload Owner Signature</h3>
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✍️</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 10 }}>Upload your Signature</div>
                    <label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}>
                      Choose File <input type="file" accept="image/*" style={{ display: 'none' }} />
                    </label>
                  </div>
                  <style>{`@keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(0,59,149,0.4)} 50%{box-shadow:0 0 0 10px rgba(0,59,149,0)} } @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  <button
                    onClick={handlePerformAIVerify}
                    disabled={profileCompletion < 100}
                    style={{ ...BTN.primary, width: '100%', padding: 12, opacity: profileCompletion < 100 ? 0.5 : 1, cursor: profileCompletion < 100 ? 'not-allowed' : 'pointer', animation: verifyAnim ? 'pulse-glow 0.6s ease infinite' : 'none', transition: 'all 0.3s' }}>
                    {verifyAnim ? '⏳ Starting AI Verification...' : '🤖 Perform AI Verification'}
                  </button>
                  {profileCompletion < 100 && <p style={{ textAlign: 'center', color: C.danger, fontSize: 12, marginTop: 8 }}>⚠ Profile must be 100% complete to use AI Verification</p>}
                </>)}
                
                {verifyStep === 3 && verificationResult && (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    {verificationResult.verified ? (
                      <>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                        <div style={{ fontWeight: 900, color: C.success, fontSize: 20, marginBottom: 4 }}>Verified</div>
                        <div style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>{verificationResult.message}</div>
                        <button onClick={() => setVerifyStep(0)} style={{ ...BTN.primary }}>✓ Done</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>❌</div>
                        <div style={{ fontWeight: 900, color: C.danger, fontSize: 20, marginBottom: 4 }}>Not Verified</div>
                        <div style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>{verificationResult.message}</div>
                        <button onClick={() => setVerifyStep(0)} style={{ ...BTN.primary }}>Try Again</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {page === 'feedback' && (
            <div style={{ maxWidth: 500 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>⭐ Feedback & Rating</h2>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Rate Our Platform</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 32, cursor: 'pointer', color: '#D1D5DB' }}>★</span>)}
                </div>
                <FTextarea label="Feedback & Suggestions" placeholder="Share your thoughts about Stazy..." rows={5} />
                <button onClick={() => alert('Feedback submitted!')} style={{ ...BTN.primary, width: '100%', padding: 12 }}>Submit Feedback 📤</button>
              </div>
            </div>
          )}

          {page === 'complaints' && <SeeComplaints />}
        </div>
      </div>

      <footer style={{ background: C.primary, color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
        <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🚪 Sign Out</button>
      </footer>
    </div>
  );
}
