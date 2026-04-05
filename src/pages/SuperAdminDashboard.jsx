import { useState } from 'react';
import { C, BTN } from '../constants/theme';
import Popup from '../components/shared/Popup';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_FEEDBACKS_UNAUTH = [
  { id: 1, username: 'Rahul Sharma', email: 'rahul@gmail.com', message: 'Great platform! Would love more filtering options.' },
  { id: 2, username: 'Sneha Patel', email: 'sneha@gmail.com', message: 'Please add more cities.' },
];
const MOCK_FEEDBACKS_AUTH = [
  { id: 1, name: 'Priya Sharma', photo: '👩‍🎓', rating: 5, message: 'Stazy helped me find my perfect PG in just 2 days!', location: 'Koregaon Park, Pune' },
  { id: 2, name: 'Ankit Verma', photo: '🧑‍🎓', rating: 4, message: 'Very smooth process. Highly recommended.', location: 'Baner, Pune' },
];
const MOCK_HIRING = [
  { id: 1, name: 'Mohit Singh', email: 'mohit@gmail.com', mobile: '+91 99001 23456', resume: 'mohit_resume.pdf' },
  { id: 2, name: 'Kavya Nair', email: 'kavya@gmail.com', mobile: '+91 88001 23456', resume: 'kavya_cv.pdf' },
];
const MOCK_ADMINS = [
  { id: 'ADM001', city: 'Pune', email: 'admin.pune@stazy.in' },
  { id: 'ADM002', city: 'Mumbai', email: 'admin.mumbai@stazy.in' },
];
const MOCK_STUDENTS = [
  { id: 'STU001', name: 'Priya Sharma', email: 'priya@gmail.com', phone: '+91 98765 43210', college: 'MIT Pune', location: 'Koregaon Park', status: 'Active' },
  { id: 'STU002', name: 'Ankit Verma', email: 'ankit@gmail.com', phone: '+91 87654 32109', college: 'COEP Pune', location: 'Viman Nagar', status: 'Blocked' },
];
const MOCK_OWNERS = [
  { id: 'OWN001', name: 'Rajesh Patil', email: 'rajesh@stazy.in', phone: '+91 98765 00001', pgName: 'Sunrise PG', pgAddress: 'Koregaon Park', pan: 'ABCDE1234F', status: 'Active' },
  { id: 'OWN002', name: 'Meera Joshi', email: 'meera@stazy.in', phone: '+91 87654 00002', pgName: 'Girls Only Nest', pgAddress: 'Baner', pan: 'FGHIJ5678K', status: 'Blocked' },
];
const MOCK_CITY_DATA = [
  { city: 'Pune', listings: 312, owners: 84, students: 1204 },
  { city: 'Mumbai', listings: 520, owners: 142, students: 3210 },
  { city: 'Bangalore', listings: 280, owners: 71, students: 980 },
];
const MOCK_ADMIN_QUERIES = [
  { adminId: 'ADM001', city: 'Pune', email: 'admin.pune@stazy.in', message: 'Need guidance on handling duplicate listing requests.' },
  { adminId: 'ADM002', city: 'Mumbai', email: 'admin.mumbai@stazy.in', message: 'Student verification backlog is growing. Please advise.' },
];

// ─── SUPER ADMIN LOGIN ────────────────────────────────────────────────────────
function SuperAdminLogin({ onLogin }) {
  const [form, setForm] = useState({ adminId: '', secretCode: '', password: '', otp: '' });
  const [err, setErr] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSendOtp = () => {
    if (!form.adminId || !form.secretCode || !form.password) { setErr('Fill all credentials first.'); return; }
    setOtpSent(true);
    setErr('');
    alert('OTP sent to registered email.');
  };

  const handleVerifyOtp = () => {
    if (form.otp === '1234') {
      setOtpVerified(true);
      setErr('');
    } else {
      setErr('Invalid OTP. Use 1234 for testing.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0A0A, #1a1a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52 }}>👑</div>
          <h2 style={{ color: C.text, margin: '8px 0 4px', fontWeight: 900, fontSize: 22 }}>Super Admin</h2>
          <p style={{ color: C.textLight, fontSize: 13, margin: 0 }}>Highest level access only</p>
        </div>
        {err && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{err}</div>}
        <FInput label="Super Admin ID" placeholder="Enter Super Admin ID" value={form.adminId} onChange={e => setForm(p => ({...p, adminId: e.target.value}))} />
        <FInput label="Secret Code" placeholder="Enter Secret Code" type="password" value={form.secretCode} onChange={e => setForm(p => ({...p, secretCode: e.target.value}))} />
        <FInput label="Password" placeholder="Enter Password" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
        
        {/* OTP SECTION */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <FInput label="OTP Verification" placeholder="Enter OTP" value={form.otp} onChange={e => setForm(p => ({...p, otp: e.target.value}))} />
          </div>
          {!otpSent ? (
            <button onClick={handleSendOtp} style={{ ...BTN.outline, padding: '10px 12px', marginBottom: 12, fontSize: 13 }}>Send OTP</button>
          ) : !otpVerified ? (
            <button onClick={handleVerifyOtp} style={{ background: C.success, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, cursor: 'pointer' }}>Verify OTP</button>
          ) : (
            <div style={{ background: '#F0FFF4', color: C.success, border: `1px solid ${C.success}`, borderRadius: 8, padding: '10px', marginBottom: 12, fontSize: 13, fontWeight: 700 }}>✓ Verified</div>
          )}
        </div>

        <button onClick={() => {
          if (!otpVerified) { setErr('Please verify OTP first.'); return; }
          onLogin({ adminId: form.adminId });
        }} disabled={!otpVerified} style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15, marginTop: 4, opacity: otpVerified ? 1 : 0.6 }}>
          🔐 Login
        </button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard({ navigate }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [section, setSection] = useState('profile');
  const [popup, setPopup] = useState(null);
  const [editSecretForm, setEditSecretForm] = useState({ oldPassword: '', secretCode: '', newSecret: '', newPassword: '' });
  const [feedbacksUnauth, setFeedbacksUnauth] = useState(MOCK_FEEDBACKS_UNAUTH);
  const [feedbacksAuth, setFeedbacksAuth] = useState(MOCK_FEEDBACKS_AUTH);
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [owners, setOwners] = useState(MOCK_OWNERS);
  const [admins, setAdmins] = useState(MOCK_ADMINS);
  const [hireForm, setHireForm] = useState({ adminId: '', password: '', secretCode: '', city: '' });
  const [replyMsg, setReplyMsg] = useState('');

  if (!loggedIn) {
    return <SuperAdminLogin onLogin={(info) => { setAdminInfo(info); setLoggedIn(true); }} />;
  }

  const SIDEBAR = [
    { key: 'profile', icon: '👑', label: 'Profile' },
    { key: 'stats', icon: '📊', label: 'Dashboard Stats' },
    { key: 'feedbackUnauth', icon: '💬', label: 'Unauthenticated Feedback' },
    { key: 'feedbackAuth', icon: '⭐', label: 'Authenticated Feedback' },
    { key: 'hiring', icon: '🤝', label: 'Admin Hiring Requests' },
    { key: 'admins', icon: '🔐', label: 'Connected Admins' },
    { key: 'studentsList', icon: '👩‍🎓', label: 'All Students' },
    { key: 'ownersList', icon: '🏠', label: 'All Owners' },
    { key: 'cityData', icon: '🏙️', label: 'City Wise Listings' },
    { key: 'adminQueries', icon: '📩', label: 'Admin Queries' },
  ];

  const NOTIFICATIONS = [
    { type: 'warning', msg: `Admin ADM002 sent a query: "Student verification backlog is growing."` },
    { type: 'info', msg: '2 new admin hiring requests pending review.' },
    { type: 'success', msg: 'System health: All services operational.' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ background: '#0A0A0A', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Super Admin</span>
            <span style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>STAZY HQ</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>ID: {adminInfo?.adminId}</span>
            <button onClick={() => setLoggedIn(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Notification Panel */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: C.text, marginRight: 4 }}>🔔 Notifications:</span>
          {NOTIFICATIONS.map((n, i) => {
            const colors = { info: ['#EFF6FF', '#1D4ED8'], warning: ['#FFFBEB', '#D97706'], success: ['#F0FFF4', '#059669'] };
            const [bg, clr] = colors[n.type];
            return <div key={i} style={{ background: bg, color: clr, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500 }}>{n.msg}</div>;
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: 240, background: '#fff', borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ paddingTop: 12 }}>
            {SIDEBAR.map(m => (
              <button key={m.key} onClick={() => setSection(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px',
                border: 'none', background: section === m.key ? '#0A0A0A' : 'transparent',
                color: section === m.key ? '#FFB700' : C.text, cursor: 'pointer',
                fontWeight: section === m.key ? 800 : 500, fontSize: 13, textAlign: 'left',
                borderLeft: section === m.key ? '3px solid #FFB700' : '3px solid transparent',
              }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* ── PROFILE ── */}
          {section === 'profile' && (
            <div style={{ maxWidth: 580 }}>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>👑 Super Admin Profile</h2>
              <div style={{ background: '#fff', borderRadius: 14, padding: 28, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👑</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>Super Administrator</div>
                    <div style={{ color: '#FFB700', fontWeight: 700, fontSize: 13 }}>Stazy HQ</div>
                  </div>
                </div>
                {[
                  ['Super Admin ID', adminInfo?.adminId || 'SA-001'],
                  ['Name', 'Super Administrator'],
                  ['Mobile Number', '+91 90000 00001'],
                  ['Email', 'superadmin@stazy.in'],
                  ['Secret Code', '••••••••'],
                  ['Password', '••••••••'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.textLight, fontSize: 14 }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
                  </div>
                ))}
                <button onClick={() => setPopup({ type: 'editProfile' })} style={{ ...BTN.primary, marginTop: 20 }}>✏️ Edit</button>
              </div>

              {popup?.type === 'editProfile' && (
                <Popup title="Edit Secret Code & Password" onClose={() => setPopup(null)}>
                  <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400E' }}>
                    🔐 You can only edit Secret Code and Password. Enter your old credentials to proceed.
                  </div>
                  <FInput label="Old Password" placeholder="Enter old password" type="password" value={editSecretForm.oldPassword} onChange={e => setEditSecretForm(p => ({...p, oldPassword: e.target.value}))} />
                  <FInput label="Current Secret Code" placeholder="Enter current secret code" type="password" value={editSecretForm.secretCode} onChange={e => setEditSecretForm(p => ({...p, secretCode: e.target.value}))} />
                  <FInput label="New Secret Code" placeholder="New secret code" value={editSecretForm.newSecret} onChange={e => setEditSecretForm(p => ({...p, newSecret: e.target.value}))} />
                  <FInput label="New Password" placeholder="New password" type="password" value={editSecretForm.newPassword} onChange={e => setEditSecretForm(p => ({...p, newPassword: e.target.value}))} />
                  <button onClick={() => { alert('Credentials updated!'); setPopup(null); }} style={{ ...BTN.primary, width: '100%', padding: 12 }}>💾 Save Changes</button>
                </Popup>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          {section === 'stats' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📊 Dashboard Statistics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
                {[['👩‍🎓 Connected Students', '15,242', C.secondary], ['🏠 Connected Owners', '842', '#6B21A8'], ['🔐 Connected Admins', '12', C.primary]].map(([label, value, color]) => (
                  <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: C.textLight, fontWeight: 700, marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── UNAUTHENTICATED FEEDBACKS ── */}
          {section === 'feedbackUnauth' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>💬 Normal User Feedback & Suggestions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
                {feedbacksUnauth.map(f => (
                  <div key={f.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{f.username}</div>
                    <div style={{ color: C.textLight, fontSize: 12, marginBottom: 10 }}>📧 {f.email}</div>
                    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{f.message}</div>
                    <button onClick={() => { if(window.confirm('Do you really want to delete this feedback?')) setFeedbacksUnauth(prev => prev.filter(x => x.id !== f.id)); }}
                      style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AUTHENTICATED FEEDBACKS ── */}
          {section === 'feedbackAuth' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>⭐ Authenticated User Feedback</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
                {feedbacksAuth.map(f => (
                  <div key={f.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 40 }}>{f.photo}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{f.name}</div>
                        <div style={{ color: C.textLight, fontSize: 12 }}>📍 {f.location}</div>
                        <div style={{ color: '#FFB700', fontSize: 16 }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
                      </div>
                    </div>
                    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{f.message}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => alert('Feedback put live!')}
                        style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🟢 Put Live</button>
                      <button onClick={() => { if(window.confirm('Do you really want to delete this feedback?')) setFeedbacksAuth(prev => prev.filter(x => x.id !== f.id)); }}
                        style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HIRING REQUESTS ── */}
          {section === 'hiring' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🤝 Admin Hiring Requests</h2>
              <TableWrap headers={['Name', 'Email', 'Mobile Number', 'See Resume', 'Hire', 'Reject']}>
                {MOCK_HIRING.map((h, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontWeight: 700 }}>{h.name}</span></TD>
                    <TD>{h.email}</TD>
                    <TD>{h.mobile}</TD>
                    <TD>
                      <button onClick={() => alert(`Opening resume: ${h.resume}`)}
                        style={{ background: C.primary + '15', color: C.primary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📄 See Resume</button>
                    </TD>
                    <TD>
                      <button onClick={() => setPopup({ type: 'hire', data: h })}
                        style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Hire</button>
                    </TD>
                    <TD>
                      <button onClick={() => { if (window.confirm(`Reject ${h.name}?`)) alert(`Rejection email sent to ${h.email}.`); }}
                        style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                    </TD>
                  </TR>
                ))}
              </TableWrap>

              {popup?.type === 'hire' && (
                <Popup title={`Hire — ${popup.data.name}`} onClose={() => setPopup(null)}>
                  <FInput label="Admin ID" placeholder="Assign Admin ID" value={hireForm.adminId} onChange={e => setHireForm(p => ({...p, adminId: e.target.value}))} />
                  <FInput label="Password" placeholder="Assign Password" type="password" value={hireForm.password} onChange={e => setHireForm(p => ({...p, password: e.target.value}))} />
                  <FInput label="Secret Code" placeholder="Assign Secret Code" value={hireForm.secretCode} onChange={e => setHireForm(p => ({...p, secretCode: e.target.value}))} />
                  <FInput label="Allotted City" placeholder="e.g. Pune" value={hireForm.city} onChange={e => setHireForm(p => ({...p, city: e.target.value}))} />
                  <button onClick={() => { alert(`Email sent to ${popup.data.email}: "You are selected. Here are your admin details."`); setPopup(null); setHireForm({ adminId: '', password: '', secretCode: '', city: '' }); }}
                    style={{ ...BTN.primary, width: '100%', padding: 12 }}>📤 Send</button>
                </Popup>
              )}
            </div>
          )}

          {/* ── CONNECTED ADMINS ── */}
          {section === 'admins' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🔐 All Connected Admins</h2>
              <TableWrap headers={['Admin ID', 'Allotted City', 'Email', 'Access']}>
                {admins.map((a, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{a.id}</span></TD>
                    <TD>{a.city}</TD>
                    <TD>{a.email}</TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { if (window.confirm('Do you really want to revoke admin access?')) alert('Access revoked!'); }}
                          style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔒 Revoke</button>
                        <button onClick={() => { if (window.confirm('Do you really want to delete this admin?')) setAdmins(prev => prev.filter(x => x.id !== a.id)); }}
                          style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          )}

          {/* ── ALL STUDENTS ── */}
          {section === 'studentsList' && (
            <div>
              {popup?.type === 'studentDetail' && (
                <Popup title="Student Details" onClose={() => setPopup(null)}>
                  {Object.entries(popup.data).map(([k, v]) => k !== 'status' && (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                      <span style={{ color: C.textLight, textTransform: 'capitalize' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </Popup>
              )}
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>👩‍🎓 All Students</h2>
              <TableWrap headers={['Student ID', 'Name', 'More Details', 'Status', 'Action']}>
                {students.map((s, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.id}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{s.name}</span></TD>
                    <TD>
                      <button onClick={() => setPopup({ type: 'studentDetail', data: s })}
                        style={{ background: C.secondary + '15', color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔍 Click More Details</button>
                    </TD>
                    <TD>
                      <span style={{ background: s.status === 'Active' ? C.success + '18' : C.danger + '18', color: s.status === 'Active' ? C.success : C.danger, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {s.status}
                      </span>
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {s.status === 'Blocked' ? (
                          <button onClick={() => setStudents(prev => prev.map(x => x.id === s.id ? {...x, status: 'Active'} : x))}
                            style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Activate</button>
                        ) : (
                          <button onClick={() => setStudents(prev => prev.map(x => x.id === s.id ? {...x, status: 'Blocked'} : x))}
                            style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🚫 Block</button>
                        )}
                        <button onClick={() => { if (window.confirm('Do you really want to delete this student?')) setStudents(prev => prev.filter(x => x.id !== s.id)); }}
                          style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          )}

          {/* ── ALL OWNERS ── */}
          {section === 'ownersList' && (
            <div>
              {popup?.type === 'ownerDetail' && (
                <Popup title="Owner Details" onClose={() => setPopup(null)}>
                  {Object.entries(popup.data).map(([k, v]) => k !== 'status' && (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                      <span style={{ color: C.textLight, textTransform: 'capitalize' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </Popup>
              )}
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🏠 All Owners</h2>
              <TableWrap headers={['Owner ID', 'Name', 'More Details', 'Status', 'Action']}>
                {owners.map((o, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.id}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{o.name}</span></TD>
                    <TD>
                      <button onClick={() => setPopup({ type: 'ownerDetail', data: o })}
                        style={{ background: C.secondary + '15', color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔍 Click More Details</button>
                    </TD>
                    <TD>
                      <span style={{ background: o.status === 'Active' ? C.success + '18' : C.danger + '18', color: o.status === 'Active' ? C.success : C.danger, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {o.status}
                      </span>
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {o.status === 'Blocked' ? (
                          <button onClick={() => setOwners(prev => prev.map(x => x.id === o.id ? {...x, status: 'Active'} : x))}
                            style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Activate</button>
                        ) : (
                          <button onClick={() => setOwners(prev => prev.map(x => x.id === o.id ? {...x, status: 'Blocked'} : x))}
                            style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🚫 Block</button>
                        )}
                        <button onClick={() => { if (window.confirm('Do you really want to delete this owner?')) setOwners(prev => prev.filter(x => x.id !== o.id)); }}
                          style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          )}

          {/* ── CITY WISE DATA ── */}
          {section === 'cityData' && (
            <div>
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>🏙️ City Wise Room Listing Data</h2>
              <TableWrap headers={['City Name', 'Total Listings', 'Total Owners', 'Total Students']}>
                {MOCK_CITY_DATA.map((c, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontWeight: 700 }}>📍 {c.city}</span></TD>
                    <TD><span style={{ fontWeight: 700, color: C.primary }}>{c.listings}</span></TD>
                    <TD><span style={{ fontWeight: 700, color: '#6B21A8' }}>{c.owners}</span></TD>
                    <TD><span style={{ fontWeight: 700, color: C.secondary }}>{c.students}</span></TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          )}

          {/* ── ADMIN QUERIES ── */}
          {section === 'adminQueries' && (
            <div>
              {popup?.type === 'replyQuery' && (
                <Popup title={`Reply to Admin: ${popup.data.adminId}`} onClose={() => setPopup(null)}>
                  <p style={{ color: C.textLight, fontSize: 13, marginBottom: 14 }}>Query: <b>{popup.data.message}</b></p>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Message</label>
                    <textarea
                      placeholder="Type your reply to the Admin..."
                      value={replyMsg}
                      onChange={e => setReplyMsg(e.target.value)}
                      rows={5}
                      style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={() => { if (!replyMsg.trim()) { alert('Please enter a reply.'); return; } alert('Reply Sent!'); setPopup(null); setReplyMsg(''); }}
                    style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15 }}>
                    📤 Send Reply
                  </button>
                </Popup>
              )}
              <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📩 Admin Queries</h2>
              <TableWrap headers={['Admin ID', 'Allotted City', 'Email', 'Message', 'Action']}>
                {MOCK_ADMIN_QUERIES.map((q, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{q.adminId}</span></TD>
                    <TD>{q.city}</TD>
                    <TD>{q.email}</TD>
                    <TD><span style={{ fontSize: 13, color: C.text }}>{q.message}</span></TD>
                    <TD>
                      <button onClick={() => setPopup({ type: 'replyQuery', data: q })}
                        style={{ background: C.primary + '15', color: C.primary, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        💬 Send Reply
                      </button>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}