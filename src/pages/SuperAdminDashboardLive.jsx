import { useEffect, useState } from 'react';
import { C, BTN } from '../constants/theme';
import Popup from '../components/shared/Popup';
import { PasswordRequirements } from '../components/shared/FormHelpers';
import { apiRequest, createSessionFromTokenResponse, fetchAuthorizedBlob } from '../services/api';
import { saveSession } from '../services/session';
import { validatePassword } from '../utils/passwordRules';
import { addWebSocketListener } from '../services/websocket';
import { applySuperAdminDashboardEvent } from '../utils/realtimeManagementState';

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
    try { 
      const res = await post('/api/auth/super-admin/send-otp', { loginId: form.adminId, password: form.password, secretCode: form.secretCode }); 
      setOtpSent(true); 
      setOtpVerified(false); 
      setForm(current => ({ ...current, otp: '' })); 
      setDevOtp(res?.otpForLocalDevelopment || ''); 
    } catch (error) { 
      setErr(error.message); 
    } finally { 
      setLoading(false); 
    }
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
        {otpSent && !devOtp && <div style={{ background: '#EFF6FF', color: C.primary, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13 }}>📧 OTP has been sent to your registered email</div>}
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
  const [successToast, setSuccessToast] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [resumeLoadingId, setResumeLoadingId] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [actionError, setActionError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Direct state updates from WebSocket events
  useEffect(() => {
    if (!user || user.role !== 'superAdmin') return;

    const unsubscribe = addWebSocketListener((topic, payload) => {
      if (topic !== 'role' && topic !== 'global' && topic !== 'user') {
        return;
      }

      const nextState = applySuperAdminDashboardEvent({
        stats,
        feedbacksUnauth,
        feedbacksAuth,
        hiringRequests,
        admins,
        students,
        owners,
        cities,
        queries,
      }, payload);

      setStats(nextState.stats);
      setFeedbacksUnauth(nextState.feedbacksUnauth);
      setFeedbacksAuth(nextState.feedbacksAuth);
      setHiringRequests(nextState.hiringRequests);
      setAdmins(nextState.admins);
      setStudents(nextState.students);
      setOwners(nextState.owners);
      setCities(nextState.cities);
      setQueries(nextState.queries);
    });

    return () => unsubscribe();
  }, [user, stats, feedbacksUnauth, feedbacksAuth, hiringRequests, admins, students, owners, cities, queries]);

  const syncStatus = (userId, status) => {
    setAdmins(current => current.map(item => (item.userId === userId ? { ...item, accountStatus: status } : item)));
    setStudents(current => current.map(item => (item.userId === userId ? { ...item, accountStatus: status } : item)));
    setOwners(current => current.map(item => (item.userId === userId ? { ...item, accountStatus: status } : item)));
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const patchUserStatus = (userId, status, message = '') => {
    setActionError('');

    // 1. Get previous status for rollback
    const prevStatus = [...admins, ...students, ...owners].find(u => u.userId === userId)?.accountStatus;

    // 2. Apply immediately
    syncStatus(userId, status);
    showToast('User status updated! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/dashboard/users/${userId}/status`, { method: 'PATCH', auth: true, body: { status, message } });
      } catch (error) {
        // Revert
        syncStatus(userId, prevStatus);
        setActionError(`Failed to update status: ${error.message}`);
      }
    })();
  };

  const dropUser = (userId) => {
    setActionError('');

    // 1. Capture items for rollback
    const prevAdmin = admins.find(u => u.userId === userId);
    const prevStudent = students.find(u => u.userId === userId);
    const prevOwner = owners.find(u => u.userId === userId);

    // 2. Remove immediately
    setAdmins(curr => curr.filter(u => u.userId !== userId));
    setStudents(curr => curr.filter(u => u.userId !== userId));
    setOwners(curr => curr.filter(u => u.userId !== userId));
    showToast('User deleted! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/super/users/${userId}`, { method: 'DELETE', auth: true });
      } catch (error) {
        // Revert: restore the user in the correct list
        if (prevAdmin) setAdmins(curr => [prevAdmin, ...curr]);
        if (prevStudent) setStudents(curr => [prevStudent, ...curr]);
        if (prevOwner) setOwners(curr => [prevOwner, ...curr]);
        setActionError(`Failed to delete user: ${error.message}`);
      }
    })();
  };

  const revokeAdmin = (adminUserId) => {
    setActionError('');

    // 1. Capture for rollback
    const prev = admins.find(a => a.userId === adminUserId);

    // 2. Update status immediately
    setAdmins(curr => curr.map(a => a.userId === adminUserId ? { ...a, employeeStatus: 'REVOKED' } : a));
    showToast('Admin access revoked! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/super/admins/${adminUserId}/revoke`, { method: 'PATCH', auth: true, body: { reviewNotes: 'Access revoked by Super Admin' } });
      } catch (error) {
        // Revert
        if (prev) setAdmins(curr => curr.map(a => a.userId === adminUserId ? prev : a));
        setActionError(`Failed to revoke admin access: ${error.message}`);
      }
    })();
  };

  const activateAdmin = (adminUserId) => {
    setActionError('');

    // 1. Capture for rollback
    const prev = admins.find(a => a.userId === adminUserId);

    // 2. Update status immediately
    setAdmins(curr => curr.map(a => a.userId === adminUserId ? { ...a, employeeStatus: 'ACTIVE' } : a));
    showToast('Admin access activated! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/super/admins/${adminUserId}/activate`, { method: 'PATCH', auth: true });
      } catch (error) {
        // Revert
        if (prev) setAdmins(curr => curr.map(a => a.userId === adminUserId ? prev : a));
        setActionError(`Failed to activate admin access: ${error.message}`);
      }
    })();
  };

  const deleteAdmin = (adminUserId) => {
    setActionError('');

    // 1. Capture for rollback
    const prev = admins.find(a => a.userId === adminUserId);

    // 2. Remove immediately
    setAdmins(curr => curr.filter(a => a.userId !== adminUserId));
    showToast('Admin deleted! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/super/admins/${adminUserId}`, { method: 'DELETE', auth: true });
      } catch (error) {
        // Revert
        if (prev) setAdmins(curr => [prev, ...curr]);
        setActionError(`Failed to delete admin: ${error.message}`);
      }
    })();
  };

  const publishFeedback = (feedbackId) => {
    setActionError('');

    // 1. Get prev item for rollback
    const prev = feedbacksAuth.find(f => f.id === feedbackId);

    // 2. Apply published: true immediately
    setFeedbacksAuth(curr => curr.map(f => f.id === feedbackId ? { ...f, published: true } : f));
    showToast('Feedback published! ✓');

    // 3. API in background
    (async () => {
      try {
        const res = await apiRequest(`/api/feedbacks/${feedbackId}/publish`, { method: 'PATCH', auth: true });
        // Sync with real server response
        setFeedbacksAuth(curr => curr.map(f => f.id === res.id ? res : f));
      } catch (error) {
        // Revert
        if (prev) setFeedbacksAuth(curr => curr.map(f => f.id === feedbackId ? prev : f));
        setActionError(`Failed to publish feedback: ${error.message}`);
      }
    })();
  };

  const unpublishFeedback = (feedbackId) => {
    setActionError('');

    // 1. Get prev item for rollback
    const prev = feedbacksAuth.find(f => f.id === feedbackId);

    // 2. Apply published: false immediately
    setFeedbacksAuth(curr => curr.map(f => f.id === feedbackId ? { ...f, published: false } : f));
    showToast('Feedback taken back from live! ✓');

    // 3. API in background
    (async () => {
      try {
        const res = await apiRequest(`/api/feedbacks/${feedbackId}/unpublish`, { method: 'PATCH', auth: true });
        // Sync with real server response
        setFeedbacksAuth(curr => curr.map(f => f.id === res.id ? res : f));
      } catch (error) {
        // Revert
        if (prev) setFeedbacksAuth(curr => curr.map(f => f.id === feedbackId ? prev : f));
        setActionError(`Failed to unpublish feedback: ${error.message}`);
      }
    })();
  };

  const removeFeedback = (feedbackId) => {
    setActionError('');

    // 1. Capture items for rollback
    const prevUnauth = feedbacksUnauth.find(f => f.id === feedbackId);
    const prevAuth = feedbacksAuth.find(f => f.id === feedbackId);

    // 2. Remove cards immediately from both lists
    setFeedbacksUnauth(curr => curr.filter(f => f.id !== feedbackId));
    setFeedbacksAuth(curr => curr.filter(f => f.id !== feedbackId));
    showToast('Feedback deleted! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/feedbacks/${feedbackId}`, { method: 'DELETE', auth: true });
      } catch (error) {
        // Revert: put the card back in the correct list
        if (prevUnauth) setFeedbacksUnauth(curr => [prevUnauth, ...curr]);
        if (prevAuth) setFeedbacksAuth(curr => [prevAuth, ...curr]);
        setActionError(`Failed to delete feedback: ${error.message}`);
      }
    })();
  };

  const rejectHiring = (requestId) => {
    setActionError('');

    // 1. Capture for rollback
    const prev = hiringRequests.find(r => r.id === requestId);

    // 2. Remove row immediately
    setHiringRequests(curr => curr.filter(r => r.id !== requestId));
    showToast('Hiring request rejected! ✓');

    // 3. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/super/hiring-requests/${requestId}/reject`, { method: 'PATCH', auth: true, body: { reviewNotes: 'Rejected from super admin dashboard.' } });
      } catch (error) {
        // Revert
        if (prev) setHiringRequests(curr => [prev, ...curr]);
        setActionError(`Failed to reject hiring request: ${error.message}`);
      }
    })();
  };

  const submitHire = () => {
    if (!popup?.data?.id) return;
    const check = validatePassword(hireForm.password);
    if (!hireForm.adminId || !hireForm.secretCode || !hireForm.cityId || !check.valid) {
      setActionError(check.valid ? 'Fill all hiring fields first.' : check.message);
      return;
    }
    setActionError('');

    const requestId = popup.data.id;
    const prev = hiringRequests.find(r => r.id === requestId);
    const submittedForm = { ...hireForm };

    // 1. Close popup and remove row immediately
    setHiringRequests(curr => curr.filter(r => r.id !== requestId));
    setHireForm({ adminId: '', password: '', secretCode: '', cityId: '' });
    setPopup(null);
    showToast('Admin hired successfully! ✓');

    // 2. API in background
    (async () => {
      try {
        await apiRequest(`/api/admin/super/hiring-requests/${requestId}/hire`, {
          method: 'PATCH',
          auth: true,
          body: { adminId: submittedForm.adminId, password: submittedForm.password, secretCode: submittedForm.secretCode, cityId: Number(submittedForm.cityId), reviewNotes: 'Approved from super admin dashboard.' },
        });
      } catch (error) {
        // Revert: restore request and re-open popup with original form
        if (prev) setHiringRequests(curr => [prev, ...curr]);
        setHireForm(submittedForm);
        setPopup({ type: 'hire', data: prev });
        setActionError(`Failed to hire admin: ${error.message}`);
      }
    })();
  };

  const submitReply = () => {
    if (!popup?.data?.id || !replyMsg.trim()) {
      setActionError('Please enter a reply.');
      return;
    }
    setActionError('');

    const queryId = popup.data.id;
    const replyText = replyMsg.trim();
    const prev = queries.find(q => q.id === queryId);

    // 1. Close popup and update the query in list immediately
    setQueries(curr =>
      curr.map(q => q.id === queryId ? { ...q, replyMessage: replyText } : q)
    );
    setReplyMsg('');
    setPopup(null);
    showToast('Reply sent! ✓');

    // 2. API in background
    (async () => {
      try {
        const res = await apiRequest(`/api/admin/super/queries/${queryId}/reply`, { method: 'PATCH', auth: true, body: { replyMessage: replyText } });
        // Sync with real server response
        setQueries(curr => curr.map(q => q.id === res.id ? res : q));
      } catch (error) {
        // Revert
        if (prev) setQueries(curr => curr.map(q => q.id === queryId ? prev : q));
        setReplyMsg(replyText);
        setPopup({ type: 'reply', data: prev });
        setActionError(`Failed to send reply: ${error.message}`);
      }
    })();
  };

  const addCity = () => {
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
    const tempId = `temp-${Date.now()}`;
    const optimisticCity = { cityId: tempId, ...payload, isOptimistic: true, totalListings: 0, totalOwners: 0, totalStudents: 0 };

    // 1. Add city row immediately; clear form
    setCities(curr =>
      [...curr.filter(c => c.cityId !== tempId), optimisticCity].sort((a, b) => (a.cityName || '').localeCompare(b.cityName || ''))
    );
    setCityForm({ cityName: '', state: '', country: payload.country });
    setCityLoading(true);
    showToast('City added! ✓');

    // 2. API in background
    (async () => {
      try {
        const created = await apiRequest('/api/admin/super/cities', {
          method: 'POST',
          auth: true,
          body: payload,
        });
        // Replace optimistic entry with real one
        setCities(curr =>
          [...curr.filter(c => c.cityId !== tempId), created].sort((a, b) => (a.cityName || '').localeCompare(b.cityName || ''))
        );
      } catch (error) {
        // Revert: remove the optimistic city
        setCities(curr => curr.filter(c => c.cityId !== tempId));
        setCityForm(payload);
        setActionError(`Failed to add city: ${error.message}`);
      } finally {
        setCityLoading(false);
      }
    })();
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
    showToast('Opening resume...');
    try {
      const blob = await fetchAuthorizedBlob(`/api/admin/super/hiring-requests/${requestId}/resume`);
      const fileUrl = window.URL.createObjectURL(blob);
      if (resumeTab) {
        resumeTab.location.replace(fileUrl);
      } else {
        window.open(fileUrl, '_blank');
      }
      showToast('Resume opened! ✓');
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
          <button onClick={submitHire} style={{ ...BTN.primary, width: '100%', padding: 12 }}>Send</button>
        </Popup>
      )}
      {popup?.type === 'reply' && (
        <Popup title={`Reply to ${popup.data.adminUserCode}`} onClose={() => { setPopup(null); setReplyMsg(''); setActionError(''); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Message</label>
            <textarea value={replyMsg} onChange={event => setReplyMsg(event.target.value)} rows={5} style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {actionError && <div style={{ marginBottom: 12, background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{actionError}</div>}
          <button onClick={submitReply} style={{ ...BTN.primary, width: '100%', padding: 12 }}>Send Reply</button>
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
      {popup?.type === 'block' && (
        <Popup title={`Block ${popup.role === 'student' ? 'Student' : 'Owner'} - ${popup.data.displayName}`} onClose={() => { setPopup(null); setActionError(''); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>Block Reason</label>
            <textarea
              placeholder="Enter reason for blocking this account..."
              value={replyMsg}
              onChange={e => setReplyMsg(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', minHeight: 100, resize: 'vertical' }}
            />
          </div>
          {actionError && <div style={{ marginBottom: 12, background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{actionError}</div>}
          <button onClick={() => {
            if (!replyMsg.trim()) {
              setActionError('Please enter a reason for blocking.');
              return;
            }
            const userId = popup.data.userId;
            const reason = replyMsg.trim();
            setPopup(null);
            setReplyMsg('');
            patchUserStatus(userId, 'BLOCKED', reason);
          }} style={{ ...BTN.primary, width: '100%', padding: 12 }}>Block Account</button>
        </Popup>
      )}
      <nav style={{ background: '#0A0A0A', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}><div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Super Admin</span><span style={{ background: 'rgba(255,183,0,0.2)', color: '#FFB700', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>STAZY HQ</span></div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>ID: {user?.userCode}</span><button onClick={() => navigate('home')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Home</button><button onClick={() => { setUser(null); navigate('home'); }} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Logout</button></div></div></nav>
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            display: 'none',
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#FFB700',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            fontSize: 24,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 999,
            fontWeight: 900,
          }}
          className="mobile-menu-btn"
        >
          ☰
        </button>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'none',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
            className="mobile-sidebar-overlay"
          />
        )}

        <div style={{ width: 240, background: '#fff', borderRight: `1px solid ${C.border}` }} className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'none', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, justifyContent: 'space-between', alignItems: 'center' }} className="mobile-sidebar-header">
            <span style={{ fontWeight: 800, color: C.text }}>Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: C.textLight,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          {['profile','stats','feedbackUnauth','feedbackAuth','hiring','admins','studentsList','ownersList','cityData','adminQueries'].map(key => <button key={key} onClick={() => { setSection(key); setSidebarOpen(false); }} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: section === key ? '#0A0A0A' : 'transparent', color: section === key ? '#FFB700' : C.text, textAlign: 'left', fontWeight: section === key ? 800 : 500, cursor: 'pointer' }}>{H(key)}</button>)}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {dashboardError && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{dashboardError}</div>}
          {actionError && !popup && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>{actionError}</div>}
          {section === 'profile' && (
            <div className="super-admin-profile-card" style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
              borderRadius: 20, 
              padding: 40, 
              border: '2px solid #FFB700',
              boxShadow: '0 8px 32px rgba(255, 183, 0, 0.15)',
              maxWidth: 680 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #FFB700 0%, #FF8C00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 900,
                  color: '#1a1a2e',
                  boxShadow: '0 4px 16px rgba(255, 183, 0, 0.4)'
                }}>
                  👑
                </div>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    color: '#FFB700', 
                    fontSize: 28, 
                    fontWeight: 900,
                    textShadow: '0 2px 8px rgba(255, 183, 0, 0.3)'
                  }}>
                    Super Admin Profile
                  </h2>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: 14, 
                    marginTop: 4,
                    fontWeight: 600
                  }}>
                    System Administrator
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: 20 }}>
                {[
                  ['Super Admin ID', user?.userCode, '🆔'],
                  ['Name', user?.name, '👤'],
                  ['Email', user?.email, '📧']
                ].map(([label, value, icon]) => (
                  <div 
                    key={label} 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      border: '1px solid rgba(255, 183, 0, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{icon}</span>
                      <span style={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        fontSize: 14,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {label}
                      </span>
                    </div>
                    <span style={{ 
                      fontWeight: 700, 
                      color: '#fff',
                      fontSize: 15
                    }}>
                      {value || '-'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: 24,
                padding: '16px 20px',
                background: 'rgba(255, 183, 0, 0.1)',
                borderRadius: 12,
                border: '1px solid rgba(255, 183, 0, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  color: '#FFB700', 
                  fontSize: 13, 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  ⚡ Full System Access Granted ⚡
                </div>
              </div>
            </div>
          )}
          {section === 'stats' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>{[['Connected Students', stats?.totalStudents, C.secondary], ['Connected Owners', stats?.totalOwners, '#6B21A8'], ['Connected Admins', stats?.totalAdmins, C.primary]].map(([label, value, color]) => <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}><div style={{ fontSize: 13, color: C.textLight, fontWeight: 700, marginBottom: 8 }}>{label}</div><div style={{ fontSize: 36, fontWeight: 900, color }}>{loading ? '...' : value ?? 0}</div></div>)}</div>}
          {section === 'feedbackUnauth' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>{feedbacksUnauth.map(item => <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{item.displayName || 'Anonymous'}</div><div style={{ color: C.textLight, fontSize: 12, marginBottom: 10 }}>{item.email || '-'}</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{item.message}</div><button onClick={() => removeFeedback(item.id)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button></div>)}</div>}
          {section === 'feedbackAuth' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>{feedbacksAuth.map(item => <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}><div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>{item.profilePhotoUrl ? (<img src={item.profilePhotoUrl} alt={item.displayName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }} />) : (<div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: C.primary, border: `2px solid ${C.border}` }}>{(item.displayName || 'U').charAt(0).toUpperCase()}</div>)}<div><div style={{ fontWeight: 800, fontSize: 15 }}>{item.displayName}</div><div style={{ color: C.textLight, fontSize: 12 }}>{item.location || '-'} {item.userRole ? `(${item.userRole === 'OWNER' ? 'Owner' : item.userRole === 'STUDENT' ? 'Student' : item.userRole})` : ''}</div></div></div><div style={{ color: '#FFB700', fontSize: 16, marginBottom: 8 }}>{'★'.repeat(item.rating || 0)}{'☆'.repeat(5 - (item.rating || 0))}</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{item.message}</div><div style={{ display: 'flex', gap: 8 }}>{item.published ? (<button onClick={() => unpublishFeedback(item.id)} style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Take Back Live</button>) : (<button onClick={() => publishFeedback(item.id)} style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Put Live</button>)}<button onClick={() => removeFeedback(item.id)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button></div></div>)}</div>}
          {section === 'hiring' && <Table headers={['Name', 'Email', 'Mobile', 'Resume', 'Hire', 'Reject']}>{hiringRequests.map(item => <tr key={item.id} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.fullName}</b></Cell><Cell>{item.email}</Cell><Cell>{item.mobileNumber}</Cell><Cell><button onClick={() => openResume(item.id)} style={{ background: `${C.primary}15`, color: C.primary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: item.resumeUrl ? 1 : 0.6 }} disabled={!item.resumeUrl || resumeLoadingId === item.id}>{resumeLoadingId === item.id ? 'Opening...' : 'See Resume'}</button></Cell><Cell><button onClick={() => { setPopup({ type: 'hire', data: item }); setActionError(''); }} style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Hire</button></Cell><Cell><button onClick={() => rejectHiring(item.id)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Reject</button></Cell></tr>)}</Table>}
          {section === 'admins' && <Table headers={['Admin ID', 'City', 'Email', 'Status', 'Employee Status', 'Access']}>{admins.map(item => <tr key={item.userId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.userCode}</b></Cell><Cell>{item.cityName || (item.canManageAllCities ? 'All Cities' : '-')}</Cell><Cell>{item.email}</Cell><Cell><Badge value={item.accountStatus} /></Cell><Cell><Badge value={item.employeeStatus} /></Cell><Cell><div style={{ display: 'flex', gap: 6 }}>{item.employeeStatus === 'REVOKED' ? (<button onClick={() => activateAdmin(item.userId)} style={{ background: '#F0FFF4', color: C.success, border: `1px solid #86EFAC`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Activate</button>) : (<button onClick={() => revokeAdmin(item.userId)} style={{ background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Revoke</button>)}<button onClick={() => deleteAdmin(item.userId)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button></div></Cell></tr>)}</Table>}
          {section === 'studentsList' && <Table headers={['Student ID', 'Name', 'Details', 'Status', 'Action']}>{students.map(item => <tr key={item.userId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.userCode}</b></Cell><Cell><b>{item.displayName}</b></Cell><Cell><button onClick={() => setPopup({ type: 'details', title: 'Student Details', data: item })} style={{ background: `${C.secondary}15`, color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>More Details</button></Cell><Cell><Badge value={item.accountStatus} /></Cell><Cell><div style={{ display: 'flex', gap: 6 }}><button onClick={() => { if (item.accountStatus === 'BLOCKED') { patchUserStatus(item.userId, 'ACTIVE'); } else { setPopup({ type: 'block', data: item, role: 'student' }); setActionError(''); } }} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{item.accountStatus === 'BLOCKED' ? 'Activate' : 'Block'}</button><button onClick={() => dropUser(item.userId)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button></div></Cell></tr>)}</Table>}
          {section === 'ownersList' && <Table headers={['Owner ID', 'Name', 'Details', 'Status', 'Action']}>{owners.map(item => <tr key={item.userId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.userCode}</b></Cell><Cell><b>{item.displayName}</b></Cell><Cell><button onClick={() => setPopup({ type: 'details', title: 'Owner Details', data: item })} style={{ background: `${C.secondary}15`, color: C.secondary, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>More Details</button></Cell><Cell><Badge value={item.accountStatus} /></Cell><Cell><div style={{ display: 'flex', gap: 6 }}><button onClick={() => { if (item.accountStatus === 'BLOCKED') { patchUserStatus(item.userId, 'ACTIVE'); } else { setPopup({ type: 'block', data: item, role: 'owner' }); setActionError(''); } }} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{item.accountStatus === 'BLOCKED' ? 'Activate' : 'Block'}</button><button onClick={() => dropUser(item.userId)} style={{ background: '#FEF2F2', color: C.danger, border: `1px solid #FCA5A5`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button></div></Cell></tr>)}</Table>}
          {section === 'cityData' && <div style={{ display: 'grid', gap: 18 }}><div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, maxWidth: 760 }}><h3 style={{ margin: '0 0 16px', color: C.text }}>Add City</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}><TextField label="City Name" value={cityForm.cityName} onChange={event => setCityForm(current => ({ ...current, cityName: event.target.value }))} placeholder="Chandrapur" /><TextField label="State" value={cityForm.state} onChange={event => setCityForm(current => ({ ...current, state: event.target.value }))} placeholder="Maharashtra" /><TextField label="Country" value={cityForm.country} onChange={event => setCityForm(current => ({ ...current, country: event.target.value }))} placeholder="India" /></div><button onClick={addCity} style={{ ...BTN.primary, padding: '10px 18px' }} disabled={cityLoading}>{cityLoading ? 'Adding...' : 'Add City'}</button></div><Table headers={['City Name', 'Total Listings', 'Total Owners', 'Total Students']}>{cities.map(item => <tr key={item.cityId} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.cityName}</b></Cell><Cell>{item.totalListings}</Cell><Cell>{item.totalOwners}</Cell><Cell>{item.totalStudents}</Cell></tr>)}</Table></div>}
          {section === 'adminQueries' && <Table headers={['Admin ID', 'Subject', 'Status', 'Message', 'Action']}>{queries.map(item => <tr key={item.id} style={{ borderTop: `1px solid ${C.border}` }}><Cell><b>{item.adminUserCode}</b></Cell><Cell>{item.subject || '-'}</Cell><Cell><Badge value={item.status} /></Cell><Cell style={{ whiteSpace: 'normal' }}>{item.message}</Cell><Cell><button onClick={() => { setPopup({ type: 'reply', data: item }); setActionError(''); }} style={{ background: `${C.primary}15`, color: C.primary, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{item.replyMessage ? 'Update Reply' : 'Send Reply'}</button></Cell></tr>)}</Table>}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          
          .mobile-sidebar-overlay {
            display: block !important;
          }
          
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: -280px;
            bottom: 0;
            width: 260px !important;
            z-index: 1001;
            transition: left 0.3s ease;
            overflow-y: auto;
            max-height: 100vh;
          }
          
          .admin-sidebar.open {
            left: 0 !important;
          }
          
          .mobile-sidebar-header {
            display: flex !important;
          }
          
          /* Add horizontal scroll to Super Admin profile card on mobile */
          .super-admin-profile-card {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
}
