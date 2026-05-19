// frontend/src/components/LoginModal.jsx
import { useState, useRef, useEffect } from 'react';
import api, { tokenStorage } from '../services/api';

const S = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(20,16,12,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99999, padding: '16px',
    boxSizing: 'border-box',
  },
  box: {
    background: '#f5f0e8', borderRadius: '24px',
    padding: '40px 36px', width: '100%', maxWidth: '440px',
    position: 'relative', boxShadow: '0 32px 80px rgba(20,16,12,0.35)',
    maxHeight: '90vh', overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute', top: '14px', right: '14px',
    background: 'rgba(26,22,18,0.08)', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px',
    color: '#4a3f35', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  header: { textAlign: 'center', marginBottom: '28px' },
  logo: { fontSize: '36px', marginBottom: '10px' },
  title: { fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1a1612', marginBottom: '6px', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '14px', color: '#8a7d72', lineHeight: 1.5 },
  tabs: {
    display: 'flex', background: '#ede7d9', borderRadius: '12px',
    padding: '4px', marginBottom: '24px', gap: '4px',
  },
  tab: (active) => ({
    flex: 1, border: 'none', padding: '10px', borderRadius: '9px',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    background: active ? '#f5f0e8' : 'transparent',
    color: active ? '#1a1612' : '#8a7d72',
    boxShadow: active ? '0 2px 8px rgba(26,22,18,0.1)' : 'none',
    transition: 'all 0.2s',
  }),
  errorBox: {
    background: '#fde8e8', border: '1px solid #f5c6c6', color: '#c0392b',
    fontSize: '13px', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
  },
  infoBox: {
    background: '#e8f4e8', border: '1px solid #c6e0c6', color: '#276127',
    fontSize: '13px', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#4a3f35' },
  input: {
    background: '#fff', border: '1.5px solid rgba(26,22,18,0.15)', borderRadius: '12px',
    padding: '12px 16px', fontSize: '15px', color: '#1a1612', outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },
  primaryBtn: (disabled) => ({
    background: disabled ? '#c0a898' : '#e85d3a', color: '#fff', border: 'none',
    borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer', width: '100%',
    boxShadow: '0 4px 16px rgba(232,93,58,0.3)', fontFamily: 'inherit',
  }),
  otpBoxes: { display: 'flex', gap: '10px', justifyContent: 'center' },
  otpInput: {
    width: '48px', height: '56px', textAlign: 'center', fontSize: '22px',
    fontWeight: 600, color: '#1a1612', background: '#fff',
    border: '1.5px solid rgba(26,22,18,0.15)', borderRadius: '12px',
    outline: 'none', fontFamily: 'inherit',
  },
  resendRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: '#8a7d72' },
  resendBtn: (disabled) => ({
    background: 'none', border: 'none', fontSize: '13px', fontWeight: 500,
    color: disabled ? '#b0a090' : '#e85d3a', cursor: disabled ? 'default' : 'pointer', padding: 0,
  }),
  backBtn: {
    background: 'none', border: 'none', fontSize: '13px', color: '#8a7d72',
    cursor: 'pointer', textAlign: 'center', padding: '4px', fontFamily: 'inherit',
  },
};

export default function LoginModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login');
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      setResendCooldown(60);
    }
  }, [step]);

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (tab === 'register') {
        const res = await api.auth.register({ name, email, password });
        if (res.requiresVerification) { setStep('otp'); setInfo(res.message); }
      } else {
        try {
          const res = await api.auth.login({ email, password });
          tokenStorage.set(res.token);
          onSuccess(res.user);
        } catch (err) {
          if (err.status === 403 && err.data?.requiresVerification) {
            setStep('otp'); setInfo(err.data.message);
          } else { throw err; }
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await api.auth.verifyOTP({ email, otp: code });
      tokenStorage.set(res.token);
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(''); setLoading(true);
    try {
      const res = await api.auth.resendOTP({ email });
      setInfo(res.message); setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Could not resend OTP');
    } finally { setLoading(false); }
  }

  function switchTab(t) {
    setTab(t); setStep('form'); setError(''); setInfo('');
    setOtp(['', '', '', '', '', '']); setName(''); setPassword('');
  }

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.box}>
        <button style={S.closeBtn} onClick={onClose}>✕</button>

        <div style={S.header}>
          <div style={S.logo}>🎨</div>
          <h2 style={S.title}>
            {step === 'otp' ? 'Check your email' : tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={S.subtitle}>
            {step === 'otp'
              ? `We sent a 6-digit code to ${email}`
              : tab === 'login' ? 'Sign in to continue creating' : 'Join ImageGen and start creating'}
          </p>
        </div>

        {step === 'form' && (
          <div style={S.tabs}>
            <button style={S.tab(tab === 'login')} onClick={() => switchTab('login')}>Sign In</button>
            <button style={S.tab(tab === 'register')} onClick={() => switchTab('register')}>Register</button>
          </div>
        )}

        {error && <div style={S.errorBox}>{error}</div>}
        {info  && <div style={S.infoBox}>{info}</div>}

        {step === 'form' && (
          <form style={S.form} onSubmit={handleFormSubmit}>
            {tab === 'register' && (
              <div style={S.group}>
                <label style={S.label}>Full name</label>
                <input style={S.input} type="text" placeholder="Jane Doe"
                  value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </div>
            )}
            <div style={S.group}>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="jane@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password"
                placeholder={tab === 'register' ? 'Min. 8 characters' : 'Your password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={tab === 'register' ? 8 : undefined}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            </div>
            <button type="submit" style={S.primaryBtn(loading)} disabled={loading}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form style={S.form} onSubmit={handleOtpSubmit}>
            <div style={S.otpBoxes} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i} ref={(el) => (otpRefs.current[i] = el)}
                  style={S.otpInput} type="text" inputMode="numeric"
                  maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoComplete="one-time-code" aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
            <button type="submit" style={S.primaryBtn(loading)} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
            <div style={S.resendRow}>
              <span>Didn't receive a code?</span>
              <button type="button" style={S.resendBtn(resendCooldown > 0 || loading)}
                onClick={handleResend} disabled={resendCooldown > 0 || loading}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
            <button type="button" style={S.backBtn}
              onClick={() => { setStep('form'); setError(''); setInfo(''); }}>
              ← Change email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
