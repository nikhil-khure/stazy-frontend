import { useEffect, useState } from 'react';
import { C, BTN } from '../constants/theme';
import Popup from '../components/shared/Popup';
import { PasswordRequirements } from '../components/shared/FormHelpers';
import { apiRequest, createSessionFromTokenResponse, fetchAuthorizedBlob } from '../services/api';
import { saveSession } from '../services/session';
import { validatePassword } from '../utils/passwordRules';

const H = value => (value || '').toString().toLowerCase().split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const D = value => (value ? new Date(value).toLocaleString() : '-');

function Badge({ value }) {
  const color = { ACTIVE: C.success, ACCEPTED: C.success, PUBLISHED: C.success, BLOCKED: C.danger, REJECTED: C.danger, DELETED: C.danger, PENDING: '#D97706', PENDING_REVIEW: '#D97706', REPLIED: C.secondary }[(value || '').toUpperCase()] || C.textLight;
  return <span style={{ background: `${color}18`, color, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{H(value)}</span>;
}

function Table({ headers, children }) {
  return <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflowX: 'auto' }}><table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: C.bg }}>{headers.map(header => <th key={header} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 800, color: C.textLight }}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function Cell({ children, style = {} }) {
  return <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap', ...style }}>{children}</td>;
}

function TextField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</label><input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>;
}

function SuperAdminLogin({ setUser }) {
  const [form, setForm] = useState({ adminId: '', secretCode: '', password: '', otp: '' });
  const [err, setErr] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const post = async (path, body) => apiRequest(path, { method: 'POST', body });
  const updateFormField = (key, value) => {
    setForm(current => ({
      ...current,
      [key]: value,
      ...(key === 'otp' ? {} : { otp: '' }),
    }));
    if (key !== 'otp') {
      setOtpSent(false);
      setOtpVerified(false);
      setDevOtp('');
      setErr('');
    }
  };
  const sendOtp = async () => {
    setLoading(true); setErr('');
    try { const res = await post('/api/auth/super-admin/send-otp', { loginId: form.adminId, password: form.password, secretCode: form.secretCode }); setOtpSent(true); setOtpVerified(false); setForm(current => ({ ...current, otp: '' })); setDevOtp(res?.otpForLocalDevelopment || ''); } catch (error) { setErr(error.message); } finally { setLoading(false); }
  };
  const verifyOtp = async () => {
    setLoading(true); setErr('');
    try { await post('/api/auth/super-admin/verify-otp', { loginId: form.adminId, otp: form.otp }); setOtpVerified(true); } catch (error) { setErr(error.message); } finally { setLoading(false); }
  };
  const login = async () => {
    setLoading(true); setErr('');
    try { const res = await post('/api/auth/super-admin/login', { loginId: form.adminId, password: form.password, secretCode: form.secretCode }); const session = createSessionFromTokenResponse(res); saveSession(session); setUser(session.user); } catch (error) { setErr(error.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0A0A, #1a1a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        <h2 style={{ color: C.text, margin: '0 0 12px', fontWeight: 900, fontSize: 22, textAlign: 'center' }}>Super Admin</h2>
        {err && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{err}</div>}
        <TextField label="Super Admin ID" value={form.adminId} onChange={event => updateFormField('adminId', event.target.value)} />
        <TextField label="Secret Code" type="password" value={form.secretCode} onChange={event => updateFormField('secretCode', event.target.value)} />
        <TextField label="Password" type="password" value={form.password} onChange={event => updateFormField('password', event.target.value)} />
        <PasswordRequirements password={form.password} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><TextField label="OTP" value={form.otp} onChange={event => updateFormField('otp', event.target.value)} /></div>
          {!otpSent ? <button onClick={sendOtp} style={{ ...BTN.outline, padding: '10px 12px', marginBottom: 12 }} disabled={loading}>Send OTP</button> : !otpVerified ? <button onClick={verifyOtp} style={{ background: C.success, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 12px', marginBottom: 12, cursor: 'pointer' }} disabled={loading}>Verify OTP</button> : <div style={{ background: '#F0FFF4', color: C.success, border: `1px solid ${C.success}`, borderRadius: 8, padding: '10px', marginBottom: 12, fontSize: 13, fontWeight: 700 }}>Verified</div>}
        </div>
        {devOtp && <div style={{ background: '#EFF6FF', color: C.primary, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12 }}>Development OTP: <b>{devOtp}</b></div>}
        <button onClick={login} disabled={!otpVerified || loading} style={{ ...BTN.primary, width: '100%', padding: 13, opacity: otpVerified ? 1 : 0.6 }}>{loading ? 'Signing In...' : 'Login'}</button>
      </div>
    </div>
  );
}

export default function SuperAdminDashboardLive({ user, setUser, navigate }) {
  const [section, setSection] = useState('profile');
  const [popup, setPopup] = useState(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [hireForm, setHireForm] = useState({ adminId: '', password: '', secretCode: '', cityId: '' });
  const [cityForm, setCityForm] = useState({ cityName: '', state: '', country: 'India' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [resumeLoadingId, setResumeLoadingId] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [actionError, setActionError] = useState('');
  const [stats, setStats] = useState(null);
  const [feedbacksUnauth, setFeedbacksUnauth] = useState([]);
  const [feedbacksAuth, setFeedbacksAuth] = useState([]);
  const [hiringRequests, setHiringRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [owners, setOwners] = useState([]);
  const [cities, setCities] = useState([]);
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'superAdmin') return;
    let active = true;
    (async () => {
      setLoading(true); setDashboardError('');
      try {
        const [a, b, c, d, e, f, g, h, i] = await Promise.all([
          apiRequest('/api/admin/super/stats', { auth: true }),
          apiRequest('/api/feedbacks', { auth: true, query: { authenticated: false } }),
          apiRequest('/api/feedbacks', { auth: true, query: { authenticated: true } }),
          apiRequest('/api/admin/super/hiring-requests', { auth: true, query: { status: 'PENDING' } }),
          apiRequest('/api/admin/super/admins', { auth: true }),
          apiRequest('/api/admin/super/students', { auth: true }),
          apiRequest('/api/admin/super/owners', { auth: true }),
          apiRequest('/api/admin/super/cities', { auth: true }),
          apiRequest('/api/admin/super/queries', { auth: true }),
        ]);
        if (!active) return;
        setStats(a); setFeedbacksUnauth(b || []); setFeedbacksAuth(c || []); setHiringRequests(d || []); setAdmins(e || []); setStudents(f || []); setOwners(g || []); setCities(h || []); setQueries(i || []);
      } catch (error) {
        if (active) setDashboardError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const syncStatus = (userId, status) => {
    setAdmins(current => current.map(item => (item.userId === userId ? { ...item, accountStatus: status } : item)));
    setStudents(current => current.map(item => (item.userId === userId ? { ...item, accountStatus: status } : item)));
    setOwners(current => current.map(item => (item.userId === userId ? { ...item, accountStatus: status } : item)));
  };

  const patchUserStatus = async (userId, status) => {
    setActionError(''); setActionLoading(true);
    try {
      const res = await apiRequest(`/api/admin/dashboard/users/${userId}/status`, { method: 'PATCH', auth: true, body: { status } });
      syncStatus(res.userId, res.accountStatus);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const dropUser = async userId => {
    setActionError(''); setActionLoading(true);
    try {
      await apiRequest(`/api/admin/super/users/${userId}`, { method: 'DELETE', auth: true });
      setAdmins(current => current.filter(item => item.userId !== userId));
      setStudents(current => current.filter(item => item.userId !== userId));
      setOwners(current => current.filter(item => item.userId !== userId));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const publishFeedback = async feedbackId => {
    setActionError(''); setActionLoading(true);
    try {
      const res = await apiRequest(`/api/feedbacks/${feedbackId}/publish`, { method: 'PATCH', auth: true });
      setFeedbacksAuth(current => current.map(item => (item.id === res.id ? res : item)));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const removeFeedback = async feedbackId => {
    setActionError(''); setActionLoading(true);
    try {
      await apiRequest(`/api/feedbacks/${feedbackId}`, { method: 'DELETE', auth: true });
      setFeedbacksUnauth(current => current.filter(item => item.id !== feedbackId));
      setFeedbacksAuth(current => current.filter(item => item.id !== feedbackId));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const rejectHiring = async requestId => {
    setActionError(''); setActionLoading(true);
    try {
      await apiRequest(`/api/admin/super/hiring-requests/${requestId}/reject`, { method: 'PATCH', auth: true, body: { reviewNotes: 'Rejected from super admin dashboard.' } });
      setHiringRequests(current => current.filter(item => item.id !== requestId));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitHire = async () => {
    if (!popup?.data?.id) return;
    const check = validatePassword(hireForm.password);
    if (!hireForm.adminId || !hireForm.secretCode || !hireForm.cityId || !check.valid) {
      setActionError(check.valid ? 'Fill all hiring fields first.' : check.message);
      return;
    }
    setActionError(''); setActionLoading(true);
    try {
      await apiRequest(`/api/admin/super/hiring-requests/${popup.data.id}/hire`, {
        method: 'PATCH',
        auth: true,
        body: { adminId: hireForm.adminId, password: hireForm.password, secretCode: hireForm.secretCode, cityId: Number(hireForm.cityId), reviewNotes: 'Approved from super admin dashboard.' },
      });
      setHiringRequests(current => current.filter(item => item.id !== popup.data.id));
      setHireForm({ adminId: '', password: '', secretCode: '', cityId: '' });
      setPopup(null);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitReply = async () => {
    if (!popup?.data?.id || !replyMsg.trim()) {
      setActionError('Please enter a reply.');
      return;
    }
    setActionError(''); setActionLoading(true);
    try {
      const res = await apiRequest(`/api/admin/super/queries/${popup.data.id}/reply`, { method: 'PATCH', auth: true, body: { replyMessage: replyMsg.trim() } });
      setQueries(current => current.map(item => (item.id === res.id ? res : item)));
      setReplyMsg('');
      setPopup(null);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const addCity = async () => {
    const payload = {
      cityName: cityForm.cityName.trim(),
      state: cityForm.state.trim(),
      country: cityForm.country.trim(),
    };
    if (!payload.cityName || !payload.state || !payload.country) {
      setActionError('Fill city name, state, and country first.');
      return;
    }

    setActionError('');
    setCityLoading(true);
    try {
      const createdCity = await apiRequest('/api/admin/super/cities', {
        method: 'POST',
        auth: true,
        body: payload,
      });
      setCities(current =>
        [...current.filter(item => item.cityId !== createdCity.cityId), createdCity]
          .sort((left, right) => (left.cityName || '').localeCompare(right.cityName || ''))
      );
      setCityForm({ cityName: '', state: '', country: payload.country });
    } catch (error) {
      setActionError(error.message);
    } finally {
      setCityLoading(false);
    }
  };

  const openResume = async requestId => {
    const resumeTab = window.open('', '_blank');
    if (resumeTab) {
      resumeTab.document.title = 'Opening resume';
      resumeTab.document.write('<p style="font-family: Segoe UI, sans-serif; padding: 16px;">Loading resume...</p>');
      resumeTab.document.close();
    }

    setActionError('');
    setResumeLoadingId(requestId);
    try {
      const blob = await fetchAuthorizedBlob(`/api/admin/super/hiring-requests/${requestId}/resume`);
      const fileUrl = window.URL.createObjectURL(blob);
      if (resumeTab) {
        resumeTab.location.replace(fileUrl);
      } else {
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      if (resumeTab && !resumeTab.closed) {
        resumeTab.close();
      }
      setActionError(error.message);
    } finally {
      setResumeLoadingId(null);
    }
  };

  if (!user || user.role !== 'superAdmin') return <SuperAdminLogin setUser={setUser} />;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {popup?.type === 'hire' && (
        <Popup title={`Hire - ${popup.data.fullName}`} onClose={() => { setPopup(null); setActionError(''); }}>
          <TextField label="Admin ID" value={hireForm.adminId} onChange={event => setHireForm(current => ({ ...current, adminId: event.target.value }))} />
          <TextField label="Password" type="password" value={hireForm.password} onChange={event => setHireForm(current => ({ ...current, password: event.target.value }))} />
          <PasswordRequirements password={hireForm.password} />
          <TextField label="Secret Code" value={hireForm.secretCode} onChange={event => setHireForm(current => ({ ...current, secretCode: event.target.value }))} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>Allotted City</label>
            <select value={hireForm.cityId} onChange={event => setHireForm(current => ({ ...current, cityId: event.target.value }))} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
              <option value="">Select city</option>
              {cities.map(city => <option key={city.cityId} value={city.cityId}>{city.cityName}</option>)}
            </select>
          </div>
          {actionError && <div style={{ marginBottom: 12, background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{actionError}</div>}
          <button onClick={submitHire} style={{ ...BTN.primary, width: '100%', padding: 12 }} disabled={actionLoading}>{actionLoading ? 'Sending...' : 'Send'}</button>
        </Popup>
      )}
      {popup?.type === 'reply' && (
        <Popup title={`Reply to ${popup.data.adminUserCode}`} onClose={() => { setPopup(null); setReplyMsg(''); setActionError(''); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Message</label>
            <textarea value={replyMsg} onChange={event => setReplyMsg(event.target.value)} rows={5} style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {actionError && <div style={{ marginBottom: 12, background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{actionError}</div>}
          <button onClick={submitReply} style={{ ...BTN.primary, width: '100%', padding: 12 }} disabled={actionLoading}>{actionLoading ? 'Sending...' : 'Send Reply'}</button>
        </Popup>
      )}
      {popup?.type === 'details' && (
        <Popup title={popup.title} onClose={() => setPopup(null)}>
          {Object.entries(popup.data).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.textLight }}>{H(key)}</span>
              <span style={{ fontWeight: 600, textAlign: 'right', whiteSpace: 'normal' }}>{String(value ?? '-')}</span>
            </div>
          ))}
        </Popup>
      )}
      <nav style={{ background: '#0A0A0A', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}><div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Super Admin</span><span style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>STAZY HQ</span></div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>ID: {user?.userCode}</span><button onClick={() => navigate('home')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Home</button><button onClick={() => { setUser(null); navigate('home'); }} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Logout</button></div></div></nav>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: 240, background: '#fff', borderRight: `1px solid ${C.border}` }}>
          {['profile','stats','feedbackUnauth','feedbackAuth','hiring','admins','studentsList','ownersList','cityData','adminQueries'].map(key => <button key={key} onClick={() => setSection(key)} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: section === key ? '#0A0A0A' : 'transparent', color: section === key ? '#FFB700' : C.text, textAlign: 'left', fontWeight: section === key ? 800 : 500, cursor: 'pointer' }}>{H(key)}</button>)}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {dashboardError && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{dashboardError}</div>}
          {actionError && !popup && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{actionError}</div>}
          {section === 'profile' && <div style={{ background: '#fff', borderRadius: 14, padding: 28, border: `1px solid ${C.border}`, maxWidth: 580 }}><h2 style={{ marginTop: 0, color: C.text }}>Super Admin Profile</h2><div style={{ display: 'grid', gap: 10 }}>{[['Super Admin ID', user?.userCode], ['Name', user?.name], ['Email', user?.email], ['Completion', `${user?.completionPercentage || 0}%`], ['Identity Verified', user?.identityVerified ? 'Yes' : 'No']].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}><span style={{ color: C.textLight }}>{label}</span><span style={{ fontWeight: 600 }}>{value || '-'}</span></div>)}</div></div>}
          {section === 'stats' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>{[['Connected Students', stats?.totalStudents, C.secondary], ['Connected Owners', stats?.totalOwners, '#6B21A8'], ['Connected Admins', stats?.totalAdmins, C.primary]].map(([label, value, color]) => <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}><div style={{ fontSize: 13, color: C.textLight, fontWeight: 700, marginBottom: 8 }}>{label}</div><div style={{ fontSize: 36, fontWeight: 900, color }}>{loading ? '...' : value ?? 0}</div></div>)}</div>}
          {section === 'feedbackUnauth' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>{feedbacksUnauth.map(item => <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{item.displayName || 'Anonymous'}</div><div style={{ color: C.textLight, fontSize: 12, marginBottom: 10 }}>{item.email || '-'}</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{item.message}</div><button onClick={() => removeFeedback(item.id)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>Delete</button></div>)}</div>}
          {section === 'feedbackAuth' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>{feedbacksAuth.map(item => <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}><div style={{ fontWeight: 800, fontSize: 15 }}>{item.displayName}</div><div style={{ color: C.textLight, fontSize: 12, marginBottom: 6 }}>{item.location || '-'}</div><div style={{ color: '#FFB700', fontSize: 16, marginBottom: 8 }}>{'★'.repeat(item.rating || 0)}{'☆'.repeat(5 - (item.rating || 0))}</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{item.message}</div><div style={{ display: 'flex', gap: 8 }}><button onClick={() => publishFeedback(item.id)} style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading || item.published}>{item.published ? 'Live' : 'Put Live'}</button><button onClick={() => removeFeedback(item.id)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>Delete</button></div></div>)}</div>}
          {section === 'hiring' && <Table headers={['Name', 'Email', 'Mobile', 'Resume', 'Hire', 'Reject']}>{hiringRequests.map(item => <tr key={item.id} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.fullName}</b></Cell><Cell>{item.email}</Cell><Cell>{item.mobileNumber}</Cell><Cell><button onClick={() => openResume(item.id)} style={{ background: `${C.primary}15`, color: C.primary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: item.resumeUrl ? 1 : 0.6 }} disabled={!item.resumeUrl || resumeLoadingId === item.id}>{resumeLoadingId === item.id ? 'Opening...' : 'See Resume'}</button></Cell><Cell><button onClick={() => { setPopup({ type: 'hire', data: item }); setActionError(''); }} style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Hire</button></Cell><Cell><button onClick={() => rejectHiring(item.id)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>Reject</button></Cell></tr>)}</Table>}
          {section === 'admins' && <Table headers={['Admin ID', 'City', 'Email', 'Status', 'Access']}>{admins.map(item => <tr key={item.userId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.userCode}</b></Cell><Cell>{item.cityName || (item.canManageAllCities ? 'All Cities' : '-')}</Cell><Cell>{item.email}</Cell><Cell><Badge value={item.accountStatus} /></Cell><Cell><div style={{ display: 'flex', gap: 6 }}><button onClick={() => patchUserStatus(item.userId, item.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')} style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>{item.accountStatus === 'BLOCKED' ? 'Restore' : 'Revoke'}</button><button onClick={() => dropUser(item.userId)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>Delete</button></div></Cell></tr>)}</Table>}
          {section === 'studentsList' && <Table headers={['Student ID', 'Name', 'Details', 'Status', 'Action']}>{students.map(item => <tr key={item.userId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.userCode}</b></Cell><Cell><b>{item.displayName}</b></Cell><Cell><button onClick={() => setPopup({ type: 'details', title: 'Student Details', data: item })} style={{ background: `${C.secondary}15`, color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>More Details</button></Cell><Cell><Badge value={item.accountStatus} /></Cell><Cell><div style={{ display: 'flex', gap: 6 }}><button onClick={() => patchUserStatus(item.userId, item.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>{item.accountStatus === 'BLOCKED' ? 'Activate' : 'Block'}</button><button onClick={() => dropUser(item.userId)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>Delete</button></div></Cell></tr>)}</Table>}
          {section === 'ownersList' && <Table headers={['Owner ID', 'Name', 'Details', 'Status', 'Action']}>{owners.map(item => <tr key={item.userId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.userCode}</b></Cell><Cell><b>{item.displayName}</b></Cell><Cell><button onClick={() => setPopup({ type: 'details', title: 'Owner Details', data: item })} style={{ background: `${C.secondary}15`, color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>More Details</button></Cell><Cell><Badge value={item.accountStatus} /></Cell><Cell><div style={{ display: 'flex', gap: 6 }}><button onClick={() => patchUserStatus(item.userId, item.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>{item.accountStatus === 'BLOCKED' ? 'Activate' : 'Block'}</button><button onClick={() => dropUser(item.userId)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} disabled={actionLoading}>Delete</button></div></Cell></tr>)}</Table>}
          {section === 'cityData' && <div style={{ display: 'grid', gap: 18 }}><div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, maxWidth: 760 }}><h3 style={{ margin: '0 0 16px', color: C.text }}>Add City</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}><TextField label="City Name" value={cityForm.cityName} onChange={event => setCityForm(current => ({ ...current, cityName: event.target.value }))} placeholder="Chandrapur" /><TextField label="State" value={cityForm.state} onChange={event => setCityForm(current => ({ ...current, state: event.target.value }))} placeholder="Maharashtra" /><TextField label="Country" value={cityForm.country} onChange={event => setCityForm(current => ({ ...current, country: event.target.value }))} placeholder="India" /></div><button onClick={addCity} style={{ ...BTN.primary, padding: '10px 18px' }} disabled={cityLoading}>{cityLoading ? 'Adding...' : 'Add City'}</button></div><Table headers={['City Name', 'Total Listings', 'Total Owners', 'Total Students']}>{cities.map(item => <tr key={item.cityId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.cityName}</b></Cell><Cell>{item.totalListings}</Cell><Cell>{item.totalOwners}</Cell><Cell>{item.totalStudents}</Cell></tr>)}</Table></div>}
          {section === 'adminQueries' && <Table headers={['Admin ID', 'Subject', 'Status', 'Message', 'Action']}>{queries.map(item => <tr key={item.id} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.adminUserCode}</b></Cell><Cell>{item.subject || '-'}</Cell><Cell><Badge value={item.status} /></Cell><Cell style={{ whiteSpace: 'normal' }}>{item.message}</Cell><Cell><button onClick={() => { setPopup({ type: 'reply', data: item }); setActionError(''); }} style={{ background: `${C.primary}15`, color: C.primary, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{item.replyMessage ? 'Update Reply' : 'Send Reply'}</button></Cell></tr>)}</Table>}
        </div>
      </div>
    </div>
  );
}
