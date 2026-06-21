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
  title: {
    fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1a1612',
    marginBottom: '6px', letterSpacing: '-0.5px',
  },
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
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(232,93,58,0.3)',
    fontFamily: 'inherit', transition: 'all 0.2s',
  }),
  otpBoxes: { display: 'flex', gap: '10px', justifyContent: 'center' },
  otpInput: {
    width: '48px', height: '56px', textAlign: 'center', fontSize: '22px',
    fontWeight: 600, color: '#1a1612', background: '#fff',
    border: '1.5px solid rgba(26,22,18,0.15)', borderRadius: '12px',
    outline: 'none', fontFamily: 'inherit',
  },
  resendRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontSize: '13px', color: '#8a7d72',
  },
  resendBtn: (disabled) => ({
    background: 'none', border: 'none', fontSize: '13px', fontWeight: 500,
    color: disabled ? '#b0a090' : '#e85d3a',
    cursor: disabled ? 'default' : 'pointer', padding: 0,
  }),
  backBtn: {
    background: 'none', border: 'none', fontSize: '13px', color: '#8a7d72',
    cursor: 'pointer', textAlign: 'center', padding: '4px', fontFamily: 'inherit',
  },
  forgotLink: {
    background: 'none', border: 'none', fontSize: '13px', color: '#e85d3a',
    cursor: 'pointer', padding: 0, fontFamily: 'inherit',
    textDecoration: 'underline', alignSelf: 'flex-end', marginTop: '-8px',
  },
  // Step indicator dots for forgot password flow
  stepDots: {
    display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px',
  },
  stepDot: (active, done) => ({
    width: done ? '24px' : '8px', height: '8px',
    borderRadius: '4px',
    background: done ? '#e85d3a' : active ? '#e85d3a' : 'rgba(26,22,18,0.15)',
    transition: 'all 0.3s',
  }),
};

export default function LoginModal({ onClose, onSuccess }) {
  // ── Auth tab / OTP flow state ─────────────────────────────────────────────
  const [tab, setTab] = useState('login');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Forgot password flow state ────────────────────────────────────────────
  // forgotStep: null = not in flow | 'email' | 'otp' | 'password'
  const [forgotStep, setForgotStep] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const forgotOtpRefs = useRef([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  // ── Timers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (forgotResendCooldown <= 0) return;
    const t = setTimeout(() => setForgotResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [forgotResendCooldown]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      setResendCooldown(60);
    }
  }, [step]);

  useEffect(() => {
    if (forgotStep === 'otp') {
      setTimeout(() => forgotOtpRefs.current[0]?.focus(), 100);
    }
  }, [forgotStep]);

  // ── OTP input helpers (shared logic) ─────────────────────────────────────
  function makeOtpHandlers(setter, refs) {
    return {
      onChange: (index, value) => {
        if (!/^\d*$/.test(value)) return;
        setter((prev) => {
          const next = [...prev];
          next[index] = value.slice(-1);
          return next;
        });
        if (value && index < 5) refs.current[index + 1]?.focus();
      },
      onKeyDown: (index, e) => {
        if (e.key === 'Backspace') {
          setter((prev) => {
            if (prev[index]) {
              const next = [...prev];
              next[index] = '';
              return next;
            }
            return prev;
          });
          if (index > 0) refs.current[index - 1]?.focus();
        }
      },
      onPaste: (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        setter(text.split('').concat(Array(6).fill('')).slice(0, 6));
        refs.current[Math.min(text.length, 5)]?.focus();
      },
    };
  }

  const verifyOtpHandlers = makeOtpHandlers(setOtp, otpRefs);
  const forgotOtpHandlers  = makeOtpHandlers(setForgotOtp, forgotOtpRefs);

  // ── Login / Register ──────────────────────────────────────────────────────
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

  // ── Forgot password: Step 1 — send reset OTP ─────────────────────────────
  async function handleForgotSendOtp(e) {
    if (e?.preventDefault) e.preventDefault();
    setForgotError(''); setForgotInfo('');
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) { setForgotError('Please enter a valid email address.'); return; }
    setForgotLoading(true);
    try {
      await api.auth.forgotPassword(forgotEmail.trim().toLowerCase());
      setForgotStep('otp');
      setForgotResendCooldown(60);
      setForgotInfo('Reset code sent! Check your inbox (and spam folder).');
    } catch (err) {
      // Even on error we show generic message (backend always returns 200)
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally { setForgotLoading(false); }
  }

  // ── Forgot password: Resend OTP ───────────────────────────────────────────
  async function handleForgotResend() {
    if (forgotResendCooldown > 0) return;
    setForgotError(''); setForgotInfo(''); setForgotLoading(true);
    try {
      await api.auth.forgotPassword(forgotEmail.trim().toLowerCase());
      setForgotInfo('A new reset code has been sent.');
      setForgotResendCooldown(60);
      setForgotOtp(['', '', '', '', '', '']);
      forgotOtpRefs.current[0]?.focus();
    } catch (err) {
      setForgotError(err.message || 'Could not resend code.');
    } finally { setForgotLoading(false); }
  }

  // ── Forgot password: Step 2 — verify OTP (moves to step 3) ───────────────
  function handleForgotOtpNext(e) {
    if (e?.preventDefault) e.preventDefault();
    const code = forgotOtp.join('');
    if (code.length < 6) { setForgotError('Please enter all 6 digits of the reset code.'); return; }
    setForgotError(''); setForgotInfo('');
    setForgotStep('password');
  }

  // ── Forgot password: Step 3 — submit new password ────────────────────────
  async function handleResetPassword(e) {
    if (e?.preventDefault) e.preventDefault();
    setForgotError(''); setForgotInfo('');
    if (newPassword.length < 8) { setForgotError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setForgotError('Passwords do not match.'); return; }
    setForgotLoading(true);
    try {
      const code = forgotOtp.join('');
      await api.auth.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: code,
        newPassword,
      });
      setForgotInfo('Password reset successfully! Redirecting to sign in…');
      setTimeout(() => {
        // Reset all forgot state and go back to login tab
        setForgotStep(null);
        setForgotEmail(''); setForgotOtp(['', '', '', '', '', '']);
        setNewPassword(''); setConfirmPassword('');
        setForgotError(''); setForgotInfo('');
        setTab('login'); setStep('form');
        setInfo('Password reset! Please sign in with your new password.');
      }, 1800);
    } catch (err) {
      setForgotError(err.message || 'Reset failed. Please try again.');
      // If OTP was wrong, send back to OTP step
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('incorrect') || msg.includes('invalid') || msg.includes('otp') || msg.includes('code')) {
        setForgotStep('otp');
        setForgotOtp(['', '', '', '', '', '']);
        setTimeout(() => forgotOtpRefs.current[0]?.focus(), 100);
      }
      // If expired, send back to email step
      if (msg.includes('expired')) {
        setForgotStep('email');
      }
    } finally { setForgotLoading(false); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openForgot() {
    setForgotStep('email');
    // Pre-fill email from login form if already typed
    if (email) setForgotEmail(email);
    setForgotError(''); setForgotInfo('');
    setForgotOtp(['', '', '', '', '', '']);
    setNewPassword(''); setConfirmPassword('');
  }

  function closeForgot() {
    setForgotStep(null);
    setForgotError(''); setForgotInfo('');
  }

  // Step index for progress dots (0=email, 1=otp, 2=password)
  const forgotStepIndex = { email: 0, otp: 1, password: 2 }[forgotStep] ?? 0;

  // ── Header text ───────────────────────────────────────────────────────────
  const headerTitle = (() => {
    if (forgotStep === 'email')    return 'Forgot password?';
    if (forgotStep === 'otp')      return 'Check your email';
    if (forgotStep === 'password') return 'New password';
    if (step === 'otp')            return 'Check your email';
    return tab === 'login' ? 'Welcome back' : 'Create account';
  })();

  const headerSubtitle = (() => {
    if (forgotStep === 'email')    return 'Enter your email and we\'ll send a reset code';
    if (forgotStep === 'otp')      return `Enter the 6-digit code sent to ${forgotEmail}`;
    if (forgotStep === 'password') return 'Choose a strong new password';
    if (step === 'otp')            return `We sent a 6-digit code to ${email}`;
    return tab === 'login' ? 'Sign in to continue creating' : 'Join ImageGen and start creating';
  })();

  const headerEmoji = (() => {
    if (forgotStep === 'email')    return '🔑';
    if (forgotStep === 'otp')      return '📬';
    if (forgotStep === 'password') return '🔒';
    return '🎨';
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.box}>
        <button style={S.closeBtn} onClick={onClose}>✕</button>

        {/* Header */}
        <div style={S.header}>
          <div style={S.logo}>{headerEmoji}</div>
          <h2 style={S.title}>{headerTitle}</h2>
          <p style={S.subtitle}>{headerSubtitle}</p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            FORGOT PASSWORD FLOW
        ══════════════════════════════════════════════════════════════════ */}
        {forgotStep !== null && (
          <>
            {/* Progress dots */}
            <div style={S.stepDots}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={S.stepDot(i === forgotStepIndex, i < forgotStepIndex)} />
              ))}
            </div>

            {forgotError && <div style={S.errorBox}>{forgotError}</div>}
            {forgotInfo  && <div style={S.infoBox}>{forgotInfo}</div>}

            {/* ── Step 1: Enter email ── */}
            {forgotStep === 'email' && (
              <form style={S.form} onSubmit={handleForgotSendOtp}>
                <div style={S.group}>
                  <label style={S.label}>Email address</label>
                  <input
                    style={S.input}
                    type="email"
                    placeholder="jane@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  style={S.primaryBtn(forgotLoading)}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Sending…' : 'Send Reset Code'}
                </button>
                <button type="button" style={S.backBtn} onClick={closeForgot}>
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* ── Step 2: Enter OTP ── */}
            {forgotStep === 'otp' && (
              <form style={S.form} onSubmit={handleForgotOtpNext}>
                <div style={S.otpBoxes} onPaste={forgotOtpHandlers.onPaste}>
                  {forgotOtp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (forgotOtpRefs.current[i] = el)}
                      style={S.otpInput}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => forgotOtpHandlers.onChange(i, e.target.value)}
                      onKeyDown={(e) => forgotOtpHandlers.onKeyDown(i, e)}
                      autoComplete="one-time-code"
                      aria-label={`Reset code digit ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  style={S.primaryBtn(forgotLoading || forgotOtp.join('').length < 6)}
                  disabled={forgotLoading || forgotOtp.join('').length < 6}
                >
                  Continue
                </button>
                <div style={S.resendRow}>
                  <span>Didn't receive a code?</span>
                  <button
                    type="button"
                    style={S.resendBtn(forgotResendCooldown > 0 || forgotLoading)}
                    onClick={handleForgotResend}
                    disabled={forgotResendCooldown > 0 || forgotLoading}
                  >
                    {forgotResendCooldown > 0 ? `Resend in ${forgotResendCooldown}s` : 'Resend code'}
                  </button>
                </div>
                <button
                  type="button"
                  style={S.backBtn}
                  onClick={() => { setForgotStep('email'); setForgotError(''); setForgotInfo(''); }}
                >
                  ← Change email
                </button>
              </form>
            )}

            {/* ── Step 3: New password ── */}
            {forgotStep === 'password' && (
              <form style={S.form} onSubmit={handleResetPassword}>
                <div style={S.group}>
                  <label style={S.label}>New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...S.input, paddingRight: '44px' }}
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '16px', color: '#8a7d72', padding: 0,
                      }}
                      tabIndex={-1}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Password strength hint */}
                  {newPassword.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      {[1, 2, 3].map((level) => {
                        const strength = newPassword.length >= 12 ? 3 : newPassword.length >= 8 ? 2 : 1;
                        const colors = ['#e85d3a', '#f39c12', '#27ae60'];
                        return (
                          <div key={level} style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            background: level <= strength ? colors[strength - 1] : 'rgba(26,22,18,0.1)',
                            transition: 'background 0.3s',
                          }} />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={S.group}>
                  <label style={S.label}>Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{
                        ...S.input, paddingRight: '44px',
                        borderColor: confirmPassword && confirmPassword !== newPassword
                          ? '#e85d3a' : undefined,
                      }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '16px', color: '#8a7d72', padding: 0,
                      }}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <span style={{ fontSize: '12px', color: '#e85d3a' }}>Passwords do not match</span>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <span style={{ fontSize: '12px', color: '#27ae60' }}>✓ Passwords match</span>
                  )}
                </div>
                <button
                  type="submit"
                  style={S.primaryBtn(forgotLoading || newPassword !== confirmPassword || newPassword.length < 8)}
                  disabled={forgotLoading || newPassword !== confirmPassword || newPassword.length < 8}
                >
                  {forgotLoading ? 'Resetting password…' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  style={S.backBtn}
                  onClick={() => { setForgotStep('otp'); setForgotError(''); setForgotInfo(''); }}
                >
                  ← Back to code entry
                </button>
              </form>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            NORMAL LOGIN / REGISTER / OTP FLOW
        ══════════════════════════════════════════════════════════════════ */}
        {forgotStep === null && (
          <>
            {step === 'form' && (
              <div style={S.tabs}>
                <button style={S.tab(tab === 'login')} onClick={() => switchTab('login')}>Sign In</button>
                <button style={S.tab(tab === 'register')} onClick={() => switchTab('register')}>Register</button>
              </div>
            )}

            {error && <div style={S.errorBox}>{error}</div>}
            {info  && <div style={S.infoBox}>{info}</div>}

            {/* ── Login / Register form ── */}
            {step === 'form' && (
              <form style={S.form} onSubmit={handleFormSubmit}>
                {tab === 'register' && (
                  <div style={S.group}>
                    <label style={S.label}>Full name</label>
                    <input
                      style={S.input} type="text" placeholder="Jane Doe"
                      value={name} onChange={(e) => setName(e.target.value)}
                      required autoComplete="name"
                    />
                  </div>
                )}
                <div style={S.group}>
                  <label style={S.label}>Email</label>
                  <input
                    style={S.input} type="email" placeholder="jane@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>
                <div style={S.group}>
                  <label style={S.label}>Password</label>
                  <input
                    style={S.input} type="password"
                    placeholder={tab === 'register' ? 'Min. 8 characters' : 'Your password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={tab === 'register' ? 8 : undefined}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>

                {/* Forgot password link — only shown on login tab */}
                {tab === 'login' && (
                  <button type="button" style={S.forgotLink} onClick={openForgot}>
                    Forgot password?
                  </button>
                )}

                <button type="submit" style={S.primaryBtn(loading)} disabled={loading}>
                  {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            )}

            {/* ── Email OTP verification ── */}
            {step === 'otp' && (
              <form style={S.form} onSubmit={handleOtpSubmit}>
                <div style={S.otpBoxes} onPaste={verifyOtpHandlers.onPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      style={S.otpInput}
                      type="text" inputMode="numeric"
                      maxLength={1} value={digit}
                      onChange={(e) => verifyOtpHandlers.onChange(i, e.target.value)}
                      onKeyDown={(e) => verifyOtpHandlers.onKeyDown(i, e)}
                      autoComplete="one-time-code"
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>
                <button type="submit" style={S.primaryBtn(loading)} disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify Email'}
                </button>
                <div style={S.resendRow}>
                  <span>Didn't receive a code?</span>
                  <button
                    type="button"
                    style={S.resendBtn(resendCooldown > 0 || loading)}
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
                <button
                  type="button"
                  style={S.backBtn}
                  onClick={() => { setStep('form'); setError(''); setInfo(''); }}
                >
                  ← Change email
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}