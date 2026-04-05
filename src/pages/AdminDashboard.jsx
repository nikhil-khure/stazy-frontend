import { useEffect, useState } from 'react';
import { C, BTN } from '../constants/theme';
import { Logo } from '../components/shared/SharedComponents';
import Popup from '../components/shared/Popup';

const ADMIN_CITY = 'Pune';

const MOCK_STUDENTS = [
  { id: 'STU001', name: 'Priya Sharma', email: 'priya@gmail.com', verified: true, status: 'Active', city: 'Koregaon Park, Pune', activeComplaints: 0, resolvedComplaints: 2 },
  { id: 'STU002', name: 'Ankit Verma', email: 'ankit@gmail.com', verified: false, status: 'Warning', city: 'Viman Nagar, Pune', activeComplaints: 2, resolvedComplaints: 1 },
  { id: 'STU003', name: 'Neha Patel', email: 'neha@gmail.com', verified: true, status: 'Active', city: 'Baner, Pune', activeComplaints: 0, resolvedComplaints: 3 },
];

const MOCK_OWNERS = [
  { id: 'OWN001', name: 'Rajesh Patil', listing: 'Sunrise PG for Boys', verified: true, listingStatus: 'Live', pgLocation: 'Koregaon Park, Pune', activeComplaints: 0, resolvedComplaints: 1 },
  { id: 'OWN002', name: 'Meera Joshi', listing: 'Girls Only Nest', verified: false, listingStatus: 'Under Review', pgLocation: 'Baner, Pune', activeComplaints: 1, resolvedComplaints: 0 },
];

const MOCK_LISTING_REQUESTS = [
  { id: 'LST001', owner: 'Rajesh Patil', listing: 'Sunrise PG for Boys', images: ['🏠','🛏️','🚿'], status: 'Under Review' },
  { id: 'LST002', owner: 'Meera Joshi', listing: 'Girls Only Nest', images: ['🏡','🌸','🪴'], status: 'Pending AI Verify' },
];

const MOCK_SUPER_ADMIN_REPLIES = [
  { id: 'REP001', date: '2025-06-01', message: 'The backlog issue is noted. Proceed with manual verification until resolved.' }
];

function StatusBadge({ status }) {
  const cfg = {
    'Active': [C.success, '✓'], 'Warning': ['#D97706', '⚠'], 'Blocked': [C.danger, '🚫'],
    'Verified': [C.success, '✓'], 'Unverified': [C.danger, '⚠'], 'Live': [C.success, '🟢'],
    'Under Review': ['#D97706', '⏳'], 'Pending AI Verify': [C.secondary, '🤖'],
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

export default function AdminDashboard({ user, setUser, navigate }) {
  const [section, setSection] = useState('students');
  const [popup, setPopup] = useState(null);
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [rejectMsg, setRejectMsg] = useState('');

  const [aiVerified, setAiVerified] = useState(false);

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg }}>
      {popup?.type === 'aiVerify' && (
        <Popup title="AI Listing Verification" onClose={() => { setPopup(null); setAiVerified(false); }} width={600}>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>Listing: <b>{popup.data.listing}</b> by {popup.data.owner}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: '0 0 12px', color: C.text }}>📷 Listing Images</h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {popup.data.images.map((img, i) => (
                  <div key={i} style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${C.primary}22, ${C.secondary}33)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: `1px solid ${C.border}` }}>
                    {img}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 12px', color: C.text }}>🎥 Listing Video</h4>
              <div style={{ width: '100%', height: 80, background: '#e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 24 }}>▶️</span>
              </div>
            </div>
          </div>
          
          {aiVerified ? (
            <div style={{ background: '#F0FFF4', border: `1px solid ${C.success}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 10px', color: C.success }}>✅ Verification Complete</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                <li>✔ Image Clarity: Pass</li>
                <li>✔ No Fake Imagery Detected</li>
                <li>✔ Inappropriate Content: None</li>
                <li>✔ Owner Identity Match: Yes</li>
              </ul>
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 16, color: C.success }}>Final Status: Verified</div>
            </div>
          ) : (
            <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              🤖 AI will analyze all listing images and details for fake listing detection, inappropriate content, and identity verification.
            </div>
          )}

          {!aiVerified ? (
            <button onClick={() => setAiVerified(true)}
              style={{ ...BTN.primary, width: '100%', padding: 12, fontSize: 15 }}>🤖 Perform AI Verification</button>
          ) : (
            <button onClick={() => { setPopup(null); setAiVerified(false); }}
              style={{ ...BTN.primary, width: '100%', padding: 12, fontSize: 15 }}>Done</button>
          )}
        </Popup>
      )}

      {popup?.type === 'rejectListing' && (
        <Popup title="Reject Room Listing" onClose={() => setPopup(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Reason for Rejection</label>
            <textarea
              placeholder="Explain why the listing was rejected..."
              value={rejectMsg}
              onChange={e => setRejectMsg(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={() => { if (!rejectMsg.trim()) { alert('Please enter a reason.'); return; } alert('Listing rejected and owner notified.'); setPopup(null); setRejectMsg(''); }}
            style={{ background: C.danger, color: '#fff', width: '100%', padding: 13, fontSize: 15, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            📤 Send Rejection
          </button>
        </Popup>
      )}

      {/* Navbar */}
      <nav style={{ background: '#001E5E', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white size={22} /></div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>| Admin Panel</span>
            <span style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>📍 City: {ADMIN_CITY}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>🏠 Home</button>
            <div style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 700 }}>🔐 Admin: {user?.name}</div>
            <button onClick={() => { setUser(null); navigate('home'); }} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #001E5E, #003B95)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Admin Control Panel 🔐</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>Managing platform for city: <b>{ADMIN_CITY}</b></p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[['👩‍🎓 Students', '15,242', C.secondary], ['🏠 Owners', '842', '#6B21A8'], ['📋 Live Listings', '1,204', C.success], ['⏳ Pending Review', '18', '#D97706'], ['📍 City', ADMIN_CITY, C.primary]].map(([l, v, clr]) => (
            <div key={l} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: `1px solid ${C.border}` }}>
              <div style={{ color: C.textLight, fontSize: 12, fontWeight: 700 }}>{l}</div>
              <div style={{ fontSize: l === '📍 City' ? 18 : 26, fontWeight: 900, color: clr, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', flexWrap: 'wrap', background: '#fff', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content', border: `1px solid ${C.border}`, gap: 2 }}>
          {[['students', '👩‍🎓 Student Management'], ['owners', '🏠 Owner Management'], ['contact', '📩 Contact Super Admin'], ['replies', '💬 See Super Admin Replies']].map(([key, label]) => (
            <button key={key} onClick={() => setSection(key)} style={{
              padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              background: section === key ? C.primary : 'transparent', color: section === key ? '#fff' : C.textLight,
            }}>{label}</button>
          ))}
        </div>

        {/* ── STUDENT MANAGEMENT ── */}
        {section === 'students' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>All Students — {ADMIN_CITY}</h3>
              </div>
              <TableWrap headers={['ID', 'Name', 'Email', 'Verification', 'Current City', 'Total Active Complaints', 'Total Resolved Complaints', 'Status', 'Actions']}>
                {MOCK_STUDENTS.map((s, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', color: C.textLight, fontSize: 12 }}>{s.id}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{s.name}</span></TD>
                    <TD><span style={{ color: C.textLight }}>{s.email}</span></TD>
                    <TD>{s.verified ? <span style={{ background: C.success+'18', color: C.success, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>✓ Verified</span> : <span style={{ background: C.danger+'18', color: C.danger, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>⚠ Unverified</span>}</TD>
                    <TD><span style={{ fontSize: 13 }}>📍 {s.city}</span></TD>
                    <TD>
                      <span style={{ background: s.activeComplaints > 0 ? C.danger+'18' : C.success+'18', color: s.activeComplaints > 0 ? C.danger : C.success, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {s.activeComplaints}
                      </span>
                    </TD>
                    <TD>
                      <span style={{ background: C.secondary+'18', color: C.secondary, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {s.resolvedComplaints}
                      </span>
                    </TD>
                    <TD><StatusBadge status={s.status} /></TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>⚠ Warn</button>
                        <button onClick={() => { if (window.confirm('Do you really want to block this user?')) alert('User blocked!'); }}
                          style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🚫 Block</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          </div>
        )}

        {/* ── OWNER MANAGEMENT ── */}
        {section === 'owners' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>🏢 Room Listing Requests</h3>
              </div>
              <TableWrap headers={['Listing ID', 'Owner', 'Listing Name', 'Status', 'Actions']}>
                {MOCK_LISTING_REQUESTS.map((l, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', color: C.textLight, fontSize: 12 }}>{l.id}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{l.owner}</span></TD>
                    <TD>{l.listing}</TD>
                    <TD><StatusBadge status={l.status} /></TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button onClick={() => setPopup({ type: 'aiVerify', data: l })}
                          style={{ background: '#F0FFF4', color: C.success, border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🤖 AI Verify</button>
                        <button onClick={() => alert('Listing is now live!')}
                          style={{ background: C.primary+'15', color: C.primary, border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🟢 Go Live</button>
                        <button onClick={() => setPopup({ type: 'rejectListing', data: l })}
                          style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>✕ Reject</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>🏠 All Owners — {ADMIN_CITY}</h3>
              </div>
              <TableWrap headers={['ID', 'Name', 'Listing', 'Verification', 'PG Location', 'Total Active Complaints', 'Total Resolved Complaints', 'Status', 'Actions']}>
                {MOCK_OWNERS.map((o, i) => (
                  <TR key={i}>
                    <TD><span style={{ fontFamily: 'monospace', color: C.textLight, fontSize: 12 }}>{o.id}</span></TD>
                    <TD><span style={{ fontWeight: 700 }}>{o.name}</span></TD>
                    <TD>{o.listing}</TD>
                    <TD>{o.verified ? <span style={{ background: C.success+'18', color: C.success, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>✓ Verified</span> : <span style={{ background: C.danger+'18', color: C.danger, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>⚠ Unverified</span>}</TD>
                    <TD><span style={{ fontSize: 13 }}>📍 {o.pgLocation}</span></TD>
                    <TD>
                      <span style={{ background: o.activeComplaints > 0 ? C.danger+'18' : C.success+'18', color: o.activeComplaints > 0 ? C.danger : C.success, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {o.activeComplaints}
                      </span>
                    </TD>
                    <TD>
                      <span style={{ background: C.secondary+'18', color: C.secondary, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {o.resolvedComplaints}
                      </span>
                    </TD>
                    <TD><StatusBadge status={o.listingStatus} /></TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>⚠ Warn</button>
                        <button onClick={() => { if (window.confirm('Do you really want to block this user?')) alert('User blocked!'); }} 
                          style={{ background: '#FEF2F2', color: C.danger, border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🚫 Block</button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          </div>
        )}

        {/* ── CONTACT SUPER ADMIN ── */}
        {section === 'contact' && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>📩 Contact Super Admin</h2>
            <div style={{ background: '#fff', borderRadius: 14, padding: 28, border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {contactSent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700, color: C.success, fontSize: 18, marginBottom: 8 }}>Message Sent!</div>
                  <div style={{ color: C.textLight, fontSize: 14, marginBottom: 20 }}>Your message has been sent to the Super Admin.</div>
                  <button onClick={() => { setContactSent(false); setContactMsg(''); }} style={{ ...BTN.outline }}>Send Another Message</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Message</label>
                    <textarea
                      placeholder="Type your message to the Super Admin..."
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value)}
                      rows={6}
                      style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={() => { if (!contactMsg.trim()) { alert('Please enter a message.'); return; } setContactSent(true); }}
                    style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15 }}>
                    📤 Submit
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* ── SEE SUPER ADMIN REPLIES ── */}
        {section === 'replies' && (
          <div>
            <h2 style={{ color: C.text, fontWeight: 900, marginBottom: 20 }}>💬 Super Admin Replies</h2>
            <TableWrap headers={['Reply ID', 'Date', 'Message']}>
              {MOCK_SUPER_ADMIN_REPLIES.map(rep => (
                <TR key={rep.id}>
                  <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary }}>{rep.id}</span></TD>
                  <TD>{rep.date}</TD>
                  <TD><span style={{ color: C.text }}>{rep.message}</span></TD>
                </TR>
              ))}
            </TableWrap>
          </div>
        )}
      </div>
    </div>
  );
}
