import { useState, useRef } from 'react';
import { C, BTN } from '../constants/theme';
import { ROOMS } from '../data/mockData';
import { Logo, RoomCard } from '../components/shared/SharedComponents';
import Popup from '../components/shared/Popup';
import SlidingTabs from '../components/shared/SlidingTabs';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_BOOKINGS = [
  { id: 'BKG001', status: 'Under Progress', reason: '-', ownerName: 'Rajesh Patil', pgName: 'Sunrise PG', ownerPhone: '+91 98765 43210', ownerEmail: 'rajesh@stazy.in', roomType: 'PG', location: 'Koregaon Park, Pune', rent: 7500 },
  { id: 'BKG002', status: 'Accepted', reason: '-', ownerName: 'Meera Joshi', pgName: 'Girls Only Nest', ownerPhone: '+91 87654 32109', ownerEmail: 'meera@stazy.in', roomType: 'PG', location: 'Baner, Pune', rent: 8000 },
  { id: 'BKG003', status: 'Rejected', reason: 'Sorry, no space available currently.', ownerName: 'Suresh Kumar', pgName: 'Green Valley', ownerPhone: '+91 76543 21098', ownerEmail: 'suresh@stazy.in', roomType: 'Hostel', location: 'Viman Nagar, Pune', rent: 6200 },
];
const MOCK_CURRENT_ROOM = {
  roomId: 'RM-2024-001', roomType: 'PG', address: 'Flat 3B, Sunrise PG, Koregaon Park, Pune - 411001',
  ownerName: 'Rajesh Patil', ownerPhone: '+91 98765 43210', ownerEmail: 'rajesh@stazy.in', ownerId: 'OWN001',
  joiningDate: '1st January 2025', currentMonthRange: '1st May to 31st May 2025',
  monthlyRent: 7500, paymentStatus: 'Paid', paymentDate: '1-5-25',
  nextDueDate: '1st June 2025', reminderMsg: 'Please pay rent before the due date.',
};
const MOCK_CANCEL_REQUESTS = [
  { roomId: 'RM-2024-001', status: 'Under Progress', ownerReason: 'Please clear all dues before cancellation.', accountStatus: 'Nil' },
];
const MOCK_OWNER_COMPLAINTS = [
  { id: 'CMP001', status: 'Owner Provided Justification', justification: 'The issue has been resolved. We fixed the water leakage on 5th May 2025. Please check and confirm.' },
  { id: 'CMP002', status: 'Under Progress', justification: '' },
];

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    'Accepted': [C.success, '✓'], 'Rejected': [C.danger, '✕'], 'Under Progress': ['#D97706', '⏳'],
    'Paid': [C.success, '✓'], 'Unpaid': [C.danger, '✕'], 'Nil': [C.success, '✓'], 'Due': [C.danger, '!'],
    'Owner Provided Justification': [C.secondary, '💬'],
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

function FInput({ label, placeholder, type = 'text', value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
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

// ─── ROOM ACTIVITIES (sliding tabs) ──────────────────────────────────────────
function RoomActivities() {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [popup, setPopup] = useState(null);
  const [emailMsg, setEmailMsg] = useState('');
  const [complaint, setComplaint] = useState({ ownerId: '', title: '', desc: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [reComplaintData, setReComplaintData] = useState({ reason: '', msg: '' });
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackDone, setFeedbackDone] = useState(false);

  const tabs = [
    { icon: '📋', label: 'Requested Booking Info' },
    { icon: '🏠', label: 'Current Room Booking Info' },
    { icon: '❌', label: 'Room Cancel Request Status' },
    { icon: '📣', label: 'Complaint Against Owner Status' },
  ];

  const handleRevoke = (id) => {
    if (window.confirm('Do you really want to revoke this request?')) {
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div>
      {popup?.type === 'ownerInfo' && (
        <Popup title="Owner & Room Details" onClose={() => setPopup(null)}>
          <InfoRow label="Booking ID" value={popup.data.id} />
          <InfoRow label="Owner Name" value={popup.data.ownerName} />
          <InfoRow label="PG Name" value={popup.data.pgName} />
          <InfoRow label="Contact Number" value={popup.data.ownerPhone} />
          <InfoRow label="Email ID" value={popup.data.ownerEmail} />
          <InfoRow label="Room Type" value={popup.data.roomType} />
          <InfoRow label="Location" value={popup.data.location} />
          <InfoRow label="Monthly Rent" value={`₹${popup.data.rent?.toLocaleString()}/month`} />
        </Popup>
      )}
      {popup?.type === 'emailOwner' && (
        <Popup title="Email Owner" onClose={() => setPopup(null)}>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 14 }}>Sending to: <b>{MOCK_CURRENT_ROOM.ownerEmail}</b></p>
          <FTextarea label="Your Message" placeholder="Type your message here..." value={emailMsg} onChange={e => setEmailMsg(e.target.value)} rows={5} />
          <button onClick={() => { alert('Message sent to owner!'); setPopup(null); setEmailMsg(''); }}
            style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Send Message</button>
        </Popup>
      )}
      {popup?.type === 'ownerJustification' && (
        <Popup title="Owner Justification" onClose={() => setPopup(null)}>
          <p style={{ color: C.text, lineHeight: 1.7, fontSize: 14 }}>{popup.data.justification || 'No justification provided yet.'}</p>
        </Popup>
      )}
      {popup?.type === 'reComplaint' && (
        <Popup title="Re-Complaint" onClose={() => setPopup(null)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Reason for Re-Complaint</label>
            <select value={reComplaintData.reason} onChange={e => setReComplaintData(p => ({ ...p, reason: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
              <option value="">Select reason...</option>
              <option>Owner has not replied</option>
              <option>Not satisfied with owner justification</option>
              <option>Issue still persists</option>
            </select>
          </div>
          <FTextarea label="Message" placeholder="Explain further..." value={reComplaintData.msg} onChange={e => setReComplaintData(p => ({ ...p, msg: e.target.value }))} />
          <button onClick={() => { alert('Re-complaint submitted!'); setPopup(null); setReComplaintData({ reason: '', msg: '' }); }}
            style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Send Re-Complaint</button>
        </Popup>
      )}

      <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📋 Room Activities</h2>
      <SlidingTabs tabs={tabs}>

        {/* Tab 1: Requested Booking Info */}
        <div>
          {bookings.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 700, color: C.text }}>No booking requests</div>
            </div>
          ) : (
            <TableWrap headers={['Booking ID', 'Booking Status', 'Reason', 'Owner & Room', 'Action']}>
              {bookings.map((b, i) => (
                <TR key={i}>
                  <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{b.id}</span></TD>
                  <TD><StatusBadge status={b.status} /></TD>
                  <TD><span style={{ color: b.reason === '-' ? C.textLight : C.danger, fontSize: 12 }}>{b.reason}</span></TD>
                  <TD>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.ownerName}</div>
                    <div style={{ color: C.textLight, fontSize: 11, marginBottom: 4 }}>{b.pgName}</div>
                    <button onClick={() => setPopup({ type: 'ownerInfo', data: b })}
                      style={{ background: C.secondary + '15', color: C.secondary, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      🔍 Click More Info
                    </button>
                  </TD>
                  <TD>
                    <button onClick={() => handleRevoke(b.id)}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      🚫 Revoke Request
                    </button>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
        </div>

        {/* Tab 2: Current Room Booking Info */}
        <div>
          <SCard title="Room Information" icon="🏠">
            <InfoRow label="Room ID" value={MOCK_CURRENT_ROOM.roomId} />
            <InfoRow label="Room Type" value={MOCK_CURRENT_ROOM.roomType} />
            <InfoRow label="Room Address" value={MOCK_CURRENT_ROOM.address} />
          </SCard>
          <SCard title="Owner Details" icon="👤">
            <InfoRow label="Owner Name" value={MOCK_CURRENT_ROOM.ownerName} />
            <InfoRow label="Contact Number" value={MOCK_CURRENT_ROOM.ownerPhone} />
            <InfoRow label="Email ID" value={MOCK_CURRENT_ROOM.ownerEmail} />
            <button onClick={() => setPopup({ type: 'emailOwner' })}
              style={{ ...BTN.primary, padding: '9px 20px', fontSize: 13, marginTop: 6 }}>📧 Email Owner</button>
          </SCard>
          <SCard title="Tenancy Details" icon="📅">
            <InfoRow label="Joining Date" value={MOCK_CURRENT_ROOM.joiningDate} />
            <InfoRow label="Current Month Range" value={MOCK_CURRENT_ROOM.currentMonthRange} />
            <InfoRow label="Monthly Rent" value={`₹${MOCK_CURRENT_ROOM.monthlyRent.toLocaleString()}`} />
          </SCard>
          <SCard title="Payment Details" icon="💳">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: C.textLight, fontSize: 14, minWidth: 180 }}>Current Month Payment</span>
              <StatusBadge status={MOCK_CURRENT_ROOM.paymentStatus} />
            </div>
            <InfoRow label="Payment Date" value={MOCK_CURRENT_ROOM.paymentDate} />
            <InfoRow label="Next Due Date" value={MOCK_CURRENT_ROOM.nextDueDate} />
            <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E', marginTop: 8 }}>
              ⚠️ {MOCK_CURRENT_ROOM.reminderMsg}
            </div>
          </SCard>
          <SCard title="Complaint Against Owner" icon="📣">
            <FInput label="Owner ID" placeholder="Enter owner ID" value={complaint.ownerId} onChange={e => setComplaint(p => ({ ...p, ownerId: e.target.value }))} />
            <FInput label="Issue Title" placeholder="Brief title of your issue" value={complaint.title} onChange={e => setComplaint(p => ({ ...p, title: e.target.value }))} />
            <FTextarea label="Describe Issue in Detail" placeholder="Explain the issue..." value={complaint.desc} onChange={e => setComplaint(p => ({ ...p, desc: e.target.value }))} />
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
              <span style={{ color: C.textLight, fontSize: 13, marginRight: 8 }}>📎 Attach Files</span>
              <label style={{ ...BTN.outline, padding: '5px 14px', fontSize: 12, cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" style={{ display: 'none' }} /> Choose Files
              </label>
            </div>
            <button onClick={() => { alert('Complaint submitted!'); setComplaint({ ownerId: '', title: '', desc: '' }); }}
              style={{ ...BTN.primary, width: '100%', padding: 11 }}>📤 Submit Complaint to Owner</button>
          </SCard>
          <SCard title="Revoke Current Booking" icon="❌">
            <FTextarea label="Enter Reason to Cancel Booking" placeholder="Please provide a valid reason for cancellation..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} />
            <button onClick={() => { if (!cancelReason.trim()) { alert('Please enter a reason.'); return; } alert('Room cancel request sent to owner!'); setCancelReason(''); }}
              style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              📤 Send Room Cancel Request to Owner
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
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setFeedbackRating(s)}
                      style={{ fontSize: 30, background: 'none', border: 'none', cursor: 'pointer', color: s <= feedbackRating ? '#FFB700' : '#D1D5DB' }}>★</button>
                  ))}
                </div>
                <FTextarea label="Share your thoughts about room facilities" placeholder="Tell us about your experience..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} />
                <button onClick={() => setFeedbackDone(true)} style={{ ...BTN.primary, width: '100%', padding: 11 }}>Submit Feedback</button>
              </>
            )}
          </SCard>
        </div>

        {/* Tab 3: Room Cancel Request Status */}
        <div>
          <TableWrap headers={['Room ID', 'Status', 'Owner Reason', 'Account Status', 'Action']}>
            {MOCK_CANCEL_REQUESTS.map((r, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.roomId}</span></TD>
                <TD><StatusBadge status={r.status} /></TD>
                <TD><span style={{ fontSize: 12, color: C.text }}>{r.ownerReason}</span></TD>
                <TD><StatusBadge status={r.accountStatus} /></TD>
                <TD>
                  <button onClick={() => { if (window.confirm('Do you really want to revoke your room cancel request?')) alert('Cancel request revoked!'); }}
                    style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    🚫 Revoke Cancel Request
                  </button>
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>

        {/* Tab 4: Complaint Against Owner Status */}
        <div>
          <TableWrap headers={['Complaint ID', 'Status', 'Owner Justification', 'Action']}>
            {MOCK_OWNER_COMPLAINTS.map((c, i) => (
              <TR key={i}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{c.id}</span></TD>
                <TD><StatusBadge status={c.status} /></TD>
                <TD>
                  {c.justification ? (
                    <button onClick={() => setPopup({ type: 'ownerJustification', data: c })}
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
                    <button onClick={() => setPopup({ type: 'reComplaint', data: c })}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔁 Re-Complaint</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TableWrap>
        </div>
      </SlidingTabs>
    </div>
  );
}

// ─── SEE COMPLAINTS (shared between Student & Owner) ─────────────────────────
function SeeComplaints({ userType }) {
  const [popup, setPopup] = useState(null);
  const [justification, setJustification] = useState('');
  const COMPLAINTS = [
    { id: 'CPL001', userName: userType === 'student' ? 'Rajesh Patil (Owner)' : 'Priya Sharma (Student)', issue: 'Late Payment', description: 'Payment has not been made for last month.' },
    { id: 'CPL002', userName: userType === 'student' ? 'Meera Joshi (Owner)' : 'Ankit Verma (Student)', issue: 'Property Damage', description: 'Some furniture was damaged during stay.' },
  ];
  return (
    <div>
      {popup?.type === 'resolve' && (
        <Popup title="Resolve Complaint" onClose={() => { setPopup(null); setJustification(''); }}>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 14 }}>Complaint: <b>{popup.data.issue}</b></p>
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
  { key: 'roomActivities', icon: '📋', label: 'Room Activities' },
  { key: 'explore', icon: '🔍', label: 'Explore Rooms' },
  { key: 'verify', icon: '🪪', label: 'Verify Profile' },
  { key: 'feedback', icon: '⭐', label: 'Feedback & Rating' },
  { key: 'complaints', icon: '🔔', label: 'See Complaints' },
];

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function StudentDashboard({ user, setUser, navigate }) {
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

  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', rating: 0 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  const [editPwdGate, setEditPwdGate] = useState('');
  const [editPwdErr, setEditPwdErr] = useState('');
  const [editPwdConfirmed, setEditPwdConfirmed] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [pwdVerify, setPwdVerify] = useState('');
  const [editForm, setEditForm] = useState({ fullName: '', email: '', collegeName: '', enrollNo: '', location: '', password: '', confirmPassword: '', photo: null });
  const notifRef = useRef(null);

  // Profile completion calculation
  const profileFields = [editForm.fullName || 'Priya', editForm.email || 'student@gmail.com', editForm.collegeName || 'MIT Pune', editForm.enrollNo || 'EN2024001234', editForm.location || 'Koregaon Park, Pune', true];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const studentId = 'STU-' + (user?.name?.substring(0, 3).toUpperCase() || 'USR') + '-2024001';

  const handleMenuClick = (key) => {
    if (key === 'explore') navigate('explore');
    else setPage(key);
  };

  const handleNotifClick = () => {
    setPage('dashboard');
    setTimeout(() => notifRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handlePerformAIVerify = () => {
    if (profileCompletion < 100) {
      alert('Please complete your profile to 100% before performing AI verification.');
      return;
    }
    setVerifyStep(1); // Set to animation state
    setTimeout(() => {
      setVerifyStep(3); // Result state
      setVerificationResult({ verified: true, message: 'Identity Verified!' });
    }, 1200);
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {editPopup && (
        <Popup title="Edit Profile" onClose={() => { setEditPopup(false); setEditPwdGate(''); setEditPwdErr(''); setEditPwdConfirmed(false); setEditForm({ fullName: '', email: '', collegeName: '', enrollNo: '', location: '', password: '', confirmPassword: '', photo: null }); }}>
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
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Full Name</label>
                <input type="text" placeholder="Full name" value={editForm.fullName} onChange={e => setEditForm(p => ({...p, fullName: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Email ID</label>
                <input type="email" placeholder="Email address" value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>College Name</label>
                <input type="text" placeholder="College name" value={editForm.collegeName} onChange={e => setEditForm(p => ({...p, collegeName: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>College Enrollment Number</label>
                <input type="text" placeholder="Enrollment number" value={editForm.enrollNo} onChange={e => setEditForm(p => ({...p, enrollNo: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Current Location</label>
                <input type="text" placeholder="Current location" value={editForm.location} onChange={e => setEditForm(p => ({...p, location: e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
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
                alert('Profile updated!'); setEditPopup(false); setEditPwdConfirmed(false); setEditPwdGate(''); setEditForm({ fullName: '', email: '', collegeName: '', enrollNo: '', location: '', password: '', confirmPassword: '', photo: null });
              }} style={{ ...BTN.primary, width: '100%', padding: 11 }}>💾 Save Changes</button>
            </>
          )}
        </Popup>
      )}

      {deletePopup && (
        <Popup title="Delete Account" onClose={() => { setDeletePopup(false); setPwdVerify(''); }}>
          <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.danger }}>
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

      {/* Navbar */}
      <nav style={{ background: C.primary, padding: '0 20px', zIndex: 100, position: 'sticky', top: 0 }}>
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
            <button onClick={() => setPage('profile')} style={{ ...BTN.accent, padding: '6px 14px', fontSize: 13 }}>👤 {user?.name}</button>
            <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: collapsed ? 56 : 220, background: '#fff', borderRight: `1px solid ${C.border}`, transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ paddingTop: 12 }}>
            {MENU.map(m => (
              <button key={m.key} onClick={() => handleMenuClick(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px',
                border: 'none', background: page === m.key ? C.primary + '15' : 'transparent',
                color: page === m.key ? C.primary : C.text, cursor: 'pointer', textAlign: 'left',
                fontWeight: page === m.key ? 800 : 500, fontSize: 14,
                borderLeft: page === m.key ? `3px solid ${C.primary}` : '3px solid transparent', transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                {!collapsed && <span>{m.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {page === 'dashboard' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#003B95,#0071C2)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Welcome back, {user?.name}! 👋</h1>
                <p style={{ margin: '6px 0 0', opacity: 0.85 }}>Student ID: <b>{studentId}</b></p>
              </div>
              <div ref={notifRef} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontWeight: 800 }}>🔔 Notifications</h3>
                {[
                  { type: 'warning', msg: 'Complete your profile verification within 24 hours to unlock full access.' },
                  { type: 'info', msg: 'Admin reminder: Please verify your identity to continue using the platform.' },
                  { type: 'success', msg: 'Your profile is 70% complete. Add your college enrollment number to finish.' },
                ].map((n, i) => {
                  const colors = { info: ['#EFF6FF','#1D4ED8'], warning: ['#FFFBEB','#D97706'], success: ['#F0FFF4','#059669'] };
                  const [bg, clr] = colors[n.type];
                  return <div key={i} style={{ background: bg, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: clr, fontWeight: 500 }}>{n.msg}</div>;
                })}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontWeight: 800 }}>📅 Recent Booking</h3>
                <div style={{ background: C.bg, borderRadius: 10, padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>No bookings yet</div>
                  <button onClick={() => navigate('explore')} style={{ ...BTN.primary, padding: '9px 22px' }}>🔍 Explore Rooms</button>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 12 }}>
                  {MENU.map(m => (
                    <button key={m.key} onClick={() => handleMenuClick(m.key)}
                      style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primary + '08'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
                      <div style={{ fontSize: 22, marginBottom: 5 }}>{m.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>💡 Recommended for You</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
                  {ROOMS.slice(0, 3).map(r => <RoomCard key={r.id} room={r} onClick={() => navigate('explore')} />)}
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
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#003B95,#0071C2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👨‍🎓</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>{user?.name}</div>
                    <div style={{ color: C.textLight, fontSize: 14 }}>Student • Pune</div>
                  </div>
                </div>
                {[
                  ['Student ID', studentId], ['Full Name', user?.name],
                  ['Mobile Number', '+91 98765 43210'], ['Email ID', (user?.name?.toLowerCase() || 'user') + '@gmail.com'],
                  ['College Name', 'MIT Pune'], ['College Enrollment No.', 'EN2024001234'],
                  ['Current Location', 'Koregaon Park, Pune'], ['Password', '••••••••'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.textLight, fontSize: 14 }}>{k}</span>
                    <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{v}</span>
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

          {page === 'roomActivities' && <RoomActivities />}

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
                  <h3 style={{ color: C.text, marginBottom: 12 }}>Step 2: Upload Student ID Card</h3>
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🪪</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 10 }}>Upload your College ID Card</div>
                    <label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}>
                      Choose File <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} />
                    </label>
                  </div>
                  {/* <h3 style={{ color: C.text, marginBottom: 12 }}>Step 3: Upload Student Signature</h3>
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✍️</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 10 }}>Upload your Signature</div>
                    <label style={{ ...BTN.outline, cursor: 'pointer', display: 'inline-block' }}>
                      Choose File <input type="file" accept="image/*" style={{ display: 'none' }} />
                    </label>
                  </div> */}
                  <button onClick={handlePerformAIVerify}
                    disabled={profileCompletion < 100}
                    style={{ ...BTN.primary, width: '100%', padding: 12, opacity: profileCompletion < 100 ? 0.5 : 1, cursor: profileCompletion < 100 ? 'not-allowed' : 'pointer' }}>🤖 Perform AI Verification</button>
                </>)}
                
                {verifyStep === 1 && (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: 48, display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 12 }}>🔄</div>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>AI Verification in progress...</div>
                    <div style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>Analyzing your live photo, ID card, and signature</div>
                  </div>
                )}
                
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
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setFeedback(p => ({ ...p, rating: s }))}
                        style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', color: s <= feedback.rating ? '#FFB700' : '#D1D5DB' }}>★</button>
                    ))}
                  </div>
                  <FTextarea label="Feedback & Suggestions" placeholder="Share your thoughts about Stazy..." value={feedback.text} onChange={e => setFeedback(p => ({ ...p, text: e.target.value }))} rows={5} />
                  <button onClick={() => setFeedbackSent(true)} style={{ ...BTN.primary, width: '100%', padding: 12 }}>Submit Feedback 📤</button>
                </div>
              )}
            </div>
          )}

          {page === 'complaints' && <SeeComplaints userType="student" />}
        </div>
      </div>

      <footer style={{ background: C.primary, color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
        <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🚪 Sign Out</button>
      </footer>
    </div>
  );
}
