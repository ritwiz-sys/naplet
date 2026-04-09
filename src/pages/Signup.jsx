import React, { useState } from 'react';
import { useSignUp, useAuth } from '@clerk/react';
import { Navigate, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

// ── Input field ───────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, error }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
            }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : focused ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: 10,
                    padding: '10px 13px',
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: 13,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.10)' : 'none',
                    fontFamily: 'inherit',
                }}
            />
            {error && (
                <span style={{ fontSize: 11, color: '#f87171', marginTop: 1 }}>{error}</span>
            )}
        </div>
    );
}

// ── Submit button ─────────────────────────────────────────────────
function SubmitBtn({ children, loading, disabled }) {
    return (
        <button
            type="submit"
            disabled={disabled || loading}
            style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 10,
                border: 'none',
                background: disabled || loading
                    ? 'rgba(99,102,241,0.30)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: disabled || loading ? 'rgba(255,255,255,0.40)' : 'white',
                fontSize: 13,
                fontWeight: 700,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                boxShadow: disabled || loading ? 'none' : '0 0 20px rgba(99,102,241,0.40)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'inherit',
            }}
        >
            {loading && (
                <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.25)',
                    borderTopColor: 'white',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                }} />
            )}
            {children}
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────────
function Signup() {
    const { isLoaded: authLoaded, isSignedIn } = useAuth();
    const { isLoaded, signUp, setActive }       = useSignUp();
    const navigate = useNavigate();

    const [step,     setStep]     = useState('form'); // 'form' | 'verify'
    const [username, setUsername] = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [code,     setCode]     = useState('');
    const [loading,  setLoading]  = useState(false);
    const [errors,   setErrors]   = useState({});
    const [globalErr,setGlobalErr]= useState('');

    if (authLoaded && isSignedIn) return <Navigate to="/dashboard" replace />;

    // ── Validate form ──────────────────────────────────────────────
    function validate() {
        const e = {};
        if (!username.trim())           e.username = 'Username is required';
        else if (username.length < 3)   e.username = 'At least 3 characters';
        else if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = 'Only letters, numbers & underscores';
        if (!email.trim())              e.email    = 'Email is required';
        if (password.length < 8)        e.password = 'At least 8 characters';
        return e;
    }

    // ── Step 1: Create account ─────────────────────────────────────
    const handleSignup = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        if (!isLoaded) return;

        setLoading(true);
        setErrors({});
        setGlobalErr('');

        try {
            await signUp.create({
                emailAddress:   email.trim(),
                password,
                unsafeMetadata: { username: username.trim() },
            });

            // Trigger email verification
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setStep('verify');
        } catch (err) {
            const msg = err?.errors?.[0]?.longMessage || err?.message || 'Something went wrong.';
            setGlobalErr(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ─────────────────────────────────────────
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!code.trim()) { setErrors({ code: 'Enter the code from your email' }); return; }
        if (!isLoaded) return;

        setLoading(true);
        setErrors({});
        setGlobalErr('');

        try {
            const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                navigate('/dashboard', { replace: true });
            } else {
                setGlobalErr('Verification incomplete. Please try again.');
            }
        } catch (err) {
            const msg = err?.errors?.[0]?.longMessage || err?.message || 'Invalid code.';
            setErrors({ code: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#03070f',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Background glows */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(circle at 20% 18%, rgba(79,70,229,0.12), transparent 38%), radial-gradient(circle at 82% 78%, rgba(109,40,217,0.10), transparent 36%)',
            }} />

            <section style={{
                position: 'relative',
                width: '100%',
                maxWidth: 400,
                background: 'rgba(8,6,18,0.80)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTop: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 18,
                padding: '32px 28px',
                boxShadow: '0 0 0 1px rgba(79,70,229,0.08), 0 24px 64px rgba(0,0,0,0.55)',
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        boxShadow: '0 0 16px rgba(99,102,241,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <span style={{ color: 'white', fontWeight: 900, fontSize: 14, fontFamily: 'var(--font-logo)' }}>N</span>
                    </div>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-logo)', letterSpacing: '0.12em' }}>
                        NAPLET
                    </span>
                </div>

                {step === 'form' ? (
                    <>
                        {/* Header */}
                        <div style={{ marginBottom: 22 }}>
                            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-logo)', lineHeight: 1, marginBottom: 5 }}>
                                Create your account
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12, fontWeight: 500 }}>
                                Set up your Naplet workspace
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Field
                                label="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="e.g. ritwiz_07"
                                autoComplete="username"
                                error={errors.username}
                            />
                            <Field
                                label="Email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                error={errors.email}
                            />
                            <Field
                                label="Password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                                error={errors.password}
                            />

                            {globalErr && (
                                <p style={{
                                    fontSize: 12, color: '#f87171',
                                    background: 'rgba(248,113,113,0.08)',
                                    border: '1px solid rgba(248,113,113,0.18)',
                                    borderRadius: 8, padding: '8px 12px',
                                }}>
                                    {globalErr}
                                </p>
                            )}

                            <div style={{ marginTop: 4 }}>
                                <SubmitBtn loading={loading} disabled={!isLoaded}>
                                    {loading ? 'Creating account…' : 'Create account'}
                                </SubmitBtn>
                            </div>
                        </form>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>OR</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        </div>

                        {/* Footer */}
                        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
                                Sign in
                            </Link>
                        </p>
                    </>
                ) : (
                    <>
                        {/* Verify step */}
                        <div style={{ marginBottom: 22 }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: 'rgba(99,102,241,0.12)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 14,
                                fontSize: 20,
                            }}>
                                📧
                            </div>
                            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-logo)', lineHeight: 1, marginBottom: 5 }}>
                                Verify your email
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12, fontWeight: 500, lineHeight: 1.6 }}>
                                We sent a 6-digit code to{' '}
                                <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 600 }}>{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Field
                                label="Verification code"
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                autoComplete="one-time-code"
                                error={errors.code}
                            />

                            {globalErr && (
                                <p style={{
                                    fontSize: 12, color: '#f87171',
                                    background: 'rgba(248,113,113,0.08)',
                                    border: '1px solid rgba(248,113,113,0.18)',
                                    borderRadius: 8, padding: '8px 12px',
                                }}>
                                    {globalErr}
                                </p>
                            )}

                            <div style={{ marginTop: 4 }}>
                                <SubmitBtn loading={loading} disabled={code.length < 6}>
                                    {loading ? 'Verifying…' : 'Verify & continue'}
                                </SubmitBtn>
                            </div>
                        </form>

                        <button
                            onClick={() => { setStep('form'); setCode(''); setErrors({}); setGlobalErr(''); }}
                            style={{
                                width: '100%', marginTop: 12,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.28)', fontSize: 12, fontWeight: 600,
                                padding: '6px 0',
                                fontFamily: 'inherit',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
                            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.28)'}
                        >
                            ← Back to sign up
                        </button>
                    </>
                )}
            </section>
        </main>
    );
}

export default Signup;
