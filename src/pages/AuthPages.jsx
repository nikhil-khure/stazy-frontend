import { useState } from 'react';
import { C, BTN } from '../constants/theme';
import { TEAM } from '../data/siteContent';
import { Logo, MiniFooter } from '../components/shared/SharedComponents';
import { FilePreviewList, PasswordRequirements } from '../components/shared/FormHelpers';
import Popup from '../components/shared/Popup';
import { apiRequest, createMultipartForm, createSessionFromTokenResponse } from '../services/api';
import { saveSession } from '../services/session';
import { getDashboardPageForUser } from '../utils/dashboardRouting';
import { validatePassword } from '../utils/passwordRules';

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
export function AboutPage({ navigate }) {
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: C.bg }}>
      <nav style={{ background: C.primary, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: 'rgba(255,255,255,0.85)' }}>Home</button>
            <button onClick={() => navigate('login')} style={{ ...BTN.outline, color: '#fff', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px' }}>Login</button>
          </div>
        </div>
      </nav>
      <div style={{ background: 'linear-gradient(135deg, #003B95, #0071C2)', color: '#fff', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', fontFamily: "'Georgia', serif" }}>
            About <span style={{ color: C.accent }}>Stazy</span>
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, lineHeight: 1.7 }}>
            Stazy (Stay Easy) is a next-generation AI-powered room finder platform built exclusively for students. We connect students seeking safe, affordable accommodations near college campuses with verified room owners.
          </p>
        </div>
      </div>
      <div style={{ background: '#fff', padding: '50px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: C.primary, fontSize: 28, fontWeight: 900, marginBottom: 16 }}>🎯 Our Mission</h2>
          <p style={{ color: C.textLight, fontSize: 16, lineHeight: 1.8, maxWidth: 700, margin: '0 auto 32px' }}>
            To eliminate the stress of student accommodation hunting by building an AI-secured, transparent platform where every student can find a verified, affordable room.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 20 }}>
            {[['🛡️','Safety First','AI verifies every listing and every user'],['🤝','Transparency','No hidden fees, no fake listings'],['⚡','Speed','Find and book in under 24 hours']].map(([ic,t,d]) => (
              <div key={t} style={{ background: C.bg, borderRadius: 12, padding: 24, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{ic}</div>
                <div style={{ fontWeight: 800, color: C.text, marginBottom: 4 }}>{t}</div>
                <div style={{ color: C.textLight, fontSize: 13 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: C.bg, padding: '50px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ color: C.text, fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 32 }}>👥 Meet Our Team</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 20 }}>
            {TEAM.map((m, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>{m.avatar}</div>
                <div style={{ fontWeight: 800, color: C.text, marginBottom: 4 }}>{m.name}</div>
                <div style={{ color: C.secondary, fontSize: 13, fontWeight: 600 }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: '#fff', padding: '50px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ color: C.text, fontSize: 24, fontWeight: 900, marginBottom: 24, textAlign: 'center' }}>📩 Get in Touch</h2>
          {sent ? (
            <div style={{ background: '#F0FFF4', border: `1px solid #00875A`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ color: C.success, fontWeight: 700, fontSize: 18 }}>Thank you! We'll get back within 24 hours.</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, padding: 28, border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {[['name','Your Name','text'],['email','Your Email','email']].map(([k,ph,type]) => (
                <input key={k} type={type} placeholder={ph} value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))}
                  style={{ width:'100%', padding:'11px 14px', border:`2px solid ${C.border}`, borderRadius:8, fontSize:14, marginBottom:12, boxSizing:'border-box', outline:'none' }} />
              ))}
              <textarea placeholder="Your feedback & suggestions..." value={form.msg} onChange={e => setForm(p => ({...p,msg:e.target.value}))} rows={4}
                style={{ width:'100%', padding:'11px 14px', border:`2px solid ${C.border}`, borderRadius:8, fontSize:14, marginBottom:16, boxSizing:'border-box', resize:'vertical', outline:'none' }} />
              <button onClick={async () => {
                if (!form.name || !form.email || !form.msg) {
                  return;
                }
                setSubmitting(true);
                try {
                  await apiRequest('/api/public/contact', {
                    method: 'POST',
                    body: {
                      fullName: form.name,
                      email: form.email,
                      message: form.msg,
                    },
                  });
                  setSent(true);
                } finally {
                  setSubmitting(false);
                }
              }} style={{ ...BTN.primary, width:'100%', padding:'12px', fontSize:15 }}>
                {submitting ? 'Sending...' : 'Send Message 📤'}
              </button>
            </div>
          )}
        </div>
      </div>
      <MiniFooter navigate={navigate} />
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export function LoginPage({ navigate, setUser }) {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ userId: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.userId || !form.password) { setErr('Please fill all fields.'); return; }
    setLoading(true);
    setErr('');
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          loginId: form.userId,
          password: form.password,
          role: role === 'student' ? 'STUDENT' : 'OWNER',
        },
      });
      const session = createSessionFromTokenResponse(response);
      saveSession(session);
      setUser(session.user);
      navigate(getDashboardPageForUser(session.user) || 'home');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const idPlaceholder = '';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: C.primary, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center' }}>
          <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white /></div>
        </div>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,59,149,0.12)', border: `1px solid ${C.border}` }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Logo size={30} />
            <h2 style={{ color: C.text, marginTop: 16, marginBottom: 4, fontWeight: 900 }}>Welcome Back!</h2>
            <p style={{ color: C.textLight, fontSize: 14, margin: 0 }}>Sign in to your Stazy account</p>
          </div>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 10, padding: 4, marginBottom: 20 }}>
            {['student','owner'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s', background: role === r ? C.primary : 'transparent', color: role === r ? '#fff' : C.textLight }}>
                {r === 'student' ? '🎓 Student' : '🏠 Owner'}
              </button>
            ))}
          </div>
          {err && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{err}</div>}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{role === 'student' ? 'Student ID' : 'Owner ID'}</label>
            <input type="text" placeholder="" value={form.userId} onChange={e => setForm(p => ({...p, userId: e.target.value}))}
              style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
            <input type="password" placeholder="" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
              style={{ width: '100%', padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <PasswordRequirements password={form.password} />
          <button onClick={handleLogin} style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15, marginBottom: 14 }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ color: C.textLight, fontSize: 13 }}>— or continue with —</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['🔵 Google','🔷 Facebook'].map(s => (
              <button key={s} style={{ flex: 1, background: '#F9FAFB', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: C.text }}>{s}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: C.textLight }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('signup')} style={{ color: C.secondary, fontWeight: 700, cursor: 'pointer' }}>Sign Up</span>
          </div>
        </div>
      </div>
      <MiniFooter navigate={navigate} />
    </div>
  );
}

// ─── SIGNUP PAGE ──────────────────────────────────────────────────────────────
export function SignupPage({ navigate, setUser }) {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', confirmPassword: '', college: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) { setErr('Please fill all required fields.'); return; }
    if (form.password !== form.confirmPassword) { setErr('Passwords do not match.'); return; }
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.valid) { setErr(passwordValidation.message); return; }
    setLoading(true);
    setErr('');
    try {
      const response = await apiRequest(role === 'student' ? '/api/auth/signup/student' : '/api/auth/signup/owner', {
        method: 'POST',
        body: role === 'student'
          ? {
              name: form.name,
              mobile: form.mobile,
              email: form.email,
              password: form.password,
              confirmPassword: form.confirmPassword,
              collegeName: form.college,
            }
          : {
              name: form.name,
              mobile: form.mobile,
              email: form.email,
              password: form.password,
              confirmPassword: form.confirmPassword,
            },
      });
      const session = createSessionFromTokenResponse(response);
      saveSession(session);
      setUser(session.user);
      navigate(getDashboardPageForUser(session.user) || 'home');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const studentFields = [
    ['name','Full Name *','text'], ['mobile','Mobile Number','tel'],
    ['email','Email *','email'], ['college','College Name','text'],
    ['password','Password *','password'], ['confirmPassword','Confirm Password *','password'],
  ];
  const ownerFields = [
    ['name','Full Name *','text'], ['mobile','Mobile Number','tel'],
    ['email','Email *','email'],
    ['password','Password *','password'], ['confirmPassword','Confirm Password *','password'],
  ];
  const fields = role === 'student' ? studentFields : ownerFields;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: C.primary, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center' }}>
          <div onClick={() => navigate('home')} style={{ cursor: 'pointer' }}><Logo white /></div>
        </div>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,59,149,0.12)', border: `1px solid ${C.border}` }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Logo size={30} />
            <h2 style={{ color: C.text, marginTop: 16, marginBottom: 4, fontWeight: 900 }}>Create Account</h2>
          </div>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 10, padding: 4, marginBottom: 20 }}>
            {['student','owner'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: 9, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s', background: role === r ? C.primary : 'transparent', color: role === r ? '#fff' : C.textLight }}>
                {r === 'student' ? '🎓 Student' : '🏠 Owner'}
              </button>
            ))}
          </div>
          {err && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{err}</div>}
          {fields.map(([k, ph, type]) => (
            <input key={k} type={type} placeholder={ph} value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))}
              style={{ width:'100%', padding:'11px 14px', border:`2px solid ${k === 'confirmPassword' && form.password && form.confirmPassword && form.password !== form.confirmPassword ? C.danger : C.border}`, borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:12 }} />
          ))}
          <PasswordRequirements password={form.password} />
          {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
            <div style={{ color: C.danger, fontSize: 12, marginTop: -8, marginBottom: 10 }}>⚠ Passwords do not match</div>
          )}
          <button onClick={handleSignup} style={{ ...BTN.primary, width:'100%', padding:13, fontSize:15, marginTop:4, marginBottom:14 }}>
            {loading ? 'Creating Account...' : 'Create Account 🚀'}
          </button>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ color: C.textLight, fontSize: 13 }}>— or sign up with —</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['🔵 Google','🔷 Facebook'].map(s => (
              <button key={s} style={{ flex: 1, background: '#F9FAFB', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: C.text }}>{s}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: C.textLight }}>
            Already have an account?{' '}
            <span onClick={() => navigate('login')} style={{ color: C.secondary, fontWeight: 700, cursor: 'pointer' }}>Sign In</span>
          </div>
        </div>
      </div>
      <MiniFooter navigate={navigate} />
    </div>
  );
}

// ─── ADMIN LOGIN PAGE ─────────────────────────────────────────────────────────
export function AdminLoginPage({ navigate, setUser }) {
  const [form, setForm] = useState({ name: '', password: '', secret: '', otp: '' });
  const [err, setErr] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

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

  const handleSendOtp = async () => {
    if (!form.name || !form.password || !form.secret) { setErr('Fill all credentials first.'); return; }
    setLoading(true);
    setErr('');
    try {
      const response = await apiRequest('/api/auth/admin/send-otp', {
        method: 'POST',
        body: {
          loginId: form.name,
          password: form.password,
          secretCode: form.secret,
        },
      });
      setOtpSent(true);
      setOtpVerified(false);
      setForm(current => ({ ...current, otp: '' }));
      setDevOtp(response?.otpForLocalDevelopment || '');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await apiRequest('/api/auth/admin/verify-otp', {
        method: 'POST',
        body: {
          loginId: form.name,
          otp: form.otp,
        },
      });
      setOtpVerified(true);
      setErr('');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #001E5E, #003B95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <h2 style={{ color: C.text, margin: '8px 0 4px', fontWeight: 900 }}>Admin Access</h2>
          <p style={{ color: C.textLight, fontSize: 13, margin: 0 }}>Authorized personnel only</p>
        </div>
        {err && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{err}</div>}
        {[['name','Admin ID','text'],['password','Password','password'],['secret','Secret Code','password']].map(([k,ph,type]) => (
          <input key={k} type={type} placeholder={ph} value={form[k]} onChange={e => updateFormField(k, e.target.value)}
            style={{ width:'100%', padding:'11px 14px', border:`2px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:12 }} />
        ))}
        <PasswordRequirements password={form.password} />
        
        {/* OTP SECTION */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'stretch' }}>
          <input type="text" placeholder="Enter OTP" value={form.otp} onChange={e => updateFormField('otp', e.target.value)}
            style={{ flex: 1, padding: '11px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
          {!otpSent ? (
            <button onClick={handleSendOtp} style={{ ...BTN.outline, padding: '0 12px', fontSize: 13 }}>{loading ? 'Sending...' : 'Send OTP'}</button>
          ) : !otpVerified ? (
            <button onClick={handleVerifyOtp} style={{ background: C.success, color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', fontSize: 13, cursor: 'pointer' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', background: '#F0FFF4', color: C.success, border: `1px solid ${C.success}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontWeight: 700 }}>✓ Verified</div>
          )}
        </div>

        {devOtp && <div style={{ background: '#EFF6FF', color: C.primary, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12 }}>Development OTP: <b>{devOtp}</b></div>}
        <button onClick={async () => { 
          if (!otpVerified) { setErr('Please verify OTP first.'); return; }
          setLoading(true);
          setErr('');
          try {
            const response = await apiRequest('/api/auth/admin/login', {
              method: 'POST',
              body: {
                loginId: form.name,
                password: form.password,
                secretCode: form.secret,
              },
            });
            const session = createSessionFromTokenResponse(response);
            saveSession(session);
            setUser(session.user);
            navigate('adminDash');
          } catch (error) {
            setErr(error.message);
          } finally {
            setLoading(false);
          }
        }}
          disabled={!otpVerified}
          style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15, marginTop: 4, marginBottom: 12, opacity: otpVerified ? 1 : 0.6 }}>
          Access Dashboard 🔓
        </button>
        <button onClick={() => navigate('adminHiring')}
          style={{ ...BTN.outline, width: '100%', padding: 13, fontSize: 15, marginBottom: 16 }}>
          🤝 Join as Admin
        </button>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('home')} style={{ ...BTN.ghost, color: C.textLight, fontSize: 13 }}>← Return to Home</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          <span
            onClick={() => navigate('superAdminDash')}
            style={{ color: 'rgba(0,0,0,0.2)', fontSize: 11, cursor: 'pointer', userSelect: 'none', letterSpacing: 0.5 }}
            title="Super Admin Access"
          >
            ● Super Admin Access
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN HIRING PAGE ────────────────────────────────────────────────────────
export function AdminHiringPage({ navigate }) {
  const [form, setForm] = useState({ fullName: '', mobileNumber: '', email: '', resume: null });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!form.fullName || !form.mobileNumber || !form.email) { alert('Please fill all required fields.'); return; }
    if (!form.resume) { alert('Please attach your resume.'); return; }
    setLoading(true);
    setErr('');
    try {
      await apiRequest('/api/admin/hiring-requests', {
        method: 'POST',
        isFormData: true,
        body: createMultipartForm(form),
      });
      setSubmitted(true);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #001E5E, #003B95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: C.success, fontWeight: 900, marginBottom: 8 }}>Request Submitted!</h2>
            <p style={{ color: C.textLight, fontSize: 14, marginBottom: 24 }}>Your application has been sent to the Super Admin for review.</p>
            <button onClick={() => navigate('adminLogin')} style={{ ...BTN.primary, padding: '10px 24px' }}>← Back to Admin Login</button>
          </div>
        ) : (
          <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 44 }}>🤝</div>
                <h2 style={{ color: C.text, margin: '8px 0 4px', fontWeight: 900 }}>Admin Hiring Form</h2>
                <p style={{ color: C.textLight, fontSize: 13, margin: 0 }}>Apply to become a Stazy Admin</p>
              </div>
              {err && <div style={{ background: '#FEF2F2', color: C.danger, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{err}</div>}
              {[['fullName','Full Name *','text'],['mobileNumber','Mobile Number *','tel'],['email','Email *','email']].map(([k,ph,type]) => (
                <input key={k} type={type} placeholder={ph} value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))}
                  style={{ width:'100%', padding:'11px 14px', border:`2px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:12 }} />
              ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 6 }}>📄 Attach Resume *</label>
              <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, padding: '14px', textAlign: 'center' }}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setForm(p => ({...p, resume: e.target.files[0]}))}
                  style={{ width: '100%', fontSize: 13 }} />
                {form.resume && <div style={{ color: C.success, fontSize: 12, marginTop: 6 }}>✓ {form.resume.name}</div>}
              </div>
            </div>
              <FilePreviewList files={form.resume ? [form.resume] : []} title="Resume Preview" />
              <button onClick={handleSubmit}
                disabled={loading}
                style={{ ...BTN.primary, width: '100%', padding: 13, fontSize: 15, marginBottom: 12, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting...' : '📤 Submit Request to Super Admin'}
              </button>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => navigate('adminLogin')} style={{ ...BTN.ghost, color: C.textLight, fontSize: 13 }}>← Back to Admin Login</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
