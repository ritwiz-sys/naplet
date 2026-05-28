import { useState } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/settingsContext';

// ── Inline editable field ─────────────────────────────────────────
function EditableField({ label, value, onSave, validate, placeholder, hint }) {
    const [editing, setEditing] = useState(false);
    const [draft,   setDraft]   = useState(value);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState(false);

    const startEdit = () => { setDraft(value); setError(''); setSuccess(false); setEditing(true); };
    const cancel    = () => { setEditing(false); setError(''); };

    const save = async () => {
        const trimmed = draft.trim();
        if (trimmed === value) { setEditing(false); return; }
        if (validate) { const err = validate(trimmed); if (err) { setError(err); return; } }
        setSaving(true); setError('');
        try {
            await onSave(trimmed);
            setSuccess(true); setEditing(false);
            setTimeout(() => setSuccess(false), 2000);
        } catch (e) {
            setError(e?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                    {label}
                </span>
                {success && <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>✓ Saved</span>}
            </div>
            {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                            placeholder={placeholder}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(99,102,241,0.45)'}`,
                                borderRadius: 9, padding: '8px 12px', color: 'rgba(255,255,255,0.88)',
                                fontSize: 13, outline: 'none', fontFamily: 'inherit',
                                boxShadow: '0 0 0 3px rgba(99,102,241,0.10)',
                            }} />
                        <button onClick={save} disabled={saving || !draft.trim()}
                            style={{
                                padding: '8px 14px', borderRadius: 9, border: 'none',
                                background: saving || !draft.trim() ? 'rgba(99,102,241,0.25)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                color: saving || !draft.trim() ? 'rgba(255,255,255,0.35)' : 'white',
                                fontSize: 12, fontWeight: 700, cursor: saving || !draft.trim() ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={cancel}
                            style={{
                                padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                            Cancel
                        </button>
                    </div>
                    {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
                    {hint && !error && <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.22)' }}>{hint}</span>}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 13, color: value ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
                        {value || placeholder}
                    </span>
                    <button onClick={startEdit}
                        style={{
                            padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)',
                            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.40)',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.12)'; e.currentTarget.style.color='#a78bfa'; e.currentTarget.style.borderColor='rgba(99,102,241,0.30)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.40)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; }}>
                        Edit
                    </button>
                </div>
            )}
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="naplet-card p-5 flex flex-col gap-4"
            style={{
                background: 'linear-gradient(160deg,#0e0c1c 0%,#060610 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 0 0 1px rgba(79,70,229,0.07), 0 4px 24px rgba(0,0,0,0.5)',
            }}>
            <p className="text-white/35 text-[9px] font-bold uppercase tracking-[0.18em]">{title}</p>
            {children}
        </div>
    );
}

function Row({ label, sub, right }) {
    return (
        <div className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white/80 text-sm font-medium">{label}</span>
                {sub && <span className="text-white/30 text-[10px]">{sub}</span>}
            </div>
            <div className="flex-shrink-0">{right}</div>
        </div>
    );
}

// ── Animated toggle ───────────────────────────────────────────────
function Toggle({ on, onChange, disabled = false }) {
    return (
        <button
            onClick={() => !disabled && onChange(!on)}
            disabled={disabled}
            className="relative w-10 h-5 rounded-full transition-all duration-300 flex-shrink-0"
            style={{
                background: on ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.08)',
                boxShadow: on ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
            }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300"
                style={{ left: on ? '18px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
        </button>
    );
}

// ── Notification permission badge ─────────────────────────────────
function NotifBadge() {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    if (perm === 'granted')   return <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>● Allowed</span>;
    if (perm === 'denied')    return <span style={{ fontSize: 9, color: '#f87171', fontWeight: 600 }}>● Blocked in browser</span>;
    return null;
}

export default function SettingsPage() {
    const { user }                = useUser();
    const { signOut }             = useClerk();
    const navigate                = useNavigate();
    const { settings, updateSetting } = useSettings();

    const [showSignOut, setShowSignOut] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const currentUsername = user?.unsafeMetadata?.username || user?.firstName || '';
    const saveUsername    = async (val) => {
        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, username: val } });
    };
    const validateUsername = (val) => {
        if (!val)            return 'Username cannot be empty';
        if (val.length < 3)  return 'At least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers & underscores';
        return '';
    };

    const displayName = currentUsername;
    const initials    = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

    // Sounds: check if AudioContext is available
    const soundsSupported = typeof window !== 'undefined' &&
        !!(window.AudioContext || window.webkitAudioContext);

    return (
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'none' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-white font-bold text-2xl" style={{ fontFamily: 'var(--font-logo)' }}>Settings</h2>
                <p className="text-white/35 text-xs mt-0.5">Manage your account and preferences</p>
            </div>

            <div className="flex flex-col gap-4 max-w-xl">

                {/* ── Profile ── */}
                <Section title="Profile">
                    <div className="flex items-center gap-4">
                        {user?.imageUrl ? (
                            <img src={user.imageUrl} alt="avatar"
                                className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                                style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.4), 0 0 20px rgba(99,102,241,0.2)' }} />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 0 2px rgba(99,102,241,0.4)' }}>
                                {initials}
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            <p className="text-white font-semibold text-base leading-tight">
                                {displayName || user?.firstName || 'User'}
                            </p>
                            <p className="text-white/40 text-xs">{user?.primaryEmailAddress?.emailAddress}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                                <span className="text-emerald-400/70 text-[9px] font-semibold uppercase tracking-wider">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <EditableField
                        label="Username"
                        value={currentUsername}
                        onSave={saveUsername}
                        validate={validateUsername}
                        placeholder="e.g. ritwiz_07"
                        hint="Only letters, numbers & underscores — min 3 chars"
                    />
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <Row
                        label="Member since"
                        sub="Your NAPLET account creation date"
                        right={
                            <span className="text-white/35 text-xs">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                            </span>
                        }
                    />
                </Section>

                {/* ── Preferences ── */}
                <Section title="Preferences">
                    {/* Notifications */}
                    <Row
                        label="Notifications"
                        sub={
                            <span className="flex items-center gap-1.5">
                                Daily reminders for habits and goals
                                <NotifBadge />
                            </span>
                        }
                        right={
                            <Toggle
                                on={settings.notifications}
                                onChange={val => updateSetting('notifications', val)}
                                disabled={'Notification' in window && Notification.permission === 'denied'}
                            />
                        }
                    />
                    {/* Show hint if blocked */}
                    {'Notification' in window && Notification.permission === 'denied' && (
                        <p style={{ fontSize: 10, color: '#f87171', marginTop: -8 }}>
                            Notifications are blocked by your browser. Enable them in browser settings to use this feature.
                        </p>
                    )}

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

                    {/* Ambient sounds */}
                    <Row
                        label="Focus sounds"
                        sub={
                            <span className="flex items-center gap-1.5">
                                Ambient brown-noise during sessions
                                {settings.sounds && (
                                    <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600, animation: 'pulse 2s ease-in-out infinite' }}>
                                        ♫ Playing
                                    </span>
                                )}
                            </span>
                        }
                        right={
                            <Toggle
                                on={settings.sounds}
                                onChange={val => updateSetting('sounds', val)}
                                disabled={!soundsSupported}
                            />
                        }
                    />
                    {!soundsSupported && (
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: -8 }}>
                            Web Audio is not supported in this browser.
                        </p>
                    )}

                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

                    {/* Compact mode */}
                    <Row
                        label="Compact mode"
                        sub={
                            <span>
                                Reduce spacing across the dashboard
                                {settings.compactMode && (
                                    <span style={{ marginLeft: 6, fontSize: 9, color: '#a78bfa', fontWeight: 600 }}>● Active</span>
                                )}
                            </span>
                        }
                        right={
                            <Toggle
                                on={settings.compactMode}
                                onChange={val => updateSetting('compactMode', val)}
                            />
                        }
                    />
                </Section>

                {/* ── Appearance ── */}
                <Section title="Appearance">
                    <div className="flex flex-col gap-3">
                        <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Accent colour</span>
                        <div className="flex items-center gap-3 flex-wrap">
                            {[
                                { id: 'indigo', label: 'Indigo',  from: '#4f46e5', to: '#6366f1' },
                                { id: 'violet', label: 'Violet',  from: '#7c3aed', to: '#a78bfa' },
                                { id: 'cyan',   label: 'Cyan',    from: '#0891b2', to: '#22d3ee' },
                                { id: 'rose',   label: 'Rose',    from: '#e11d48', to: '#fb7185' },
                                { id: 'emerald',label: 'Emerald', from: '#059669', to: '#34d399' },
                            ].map(c => (
                                <button key={c.id}
                                    onClick={() => updateSetting('accentColor', c.id)}
                                    className="flex flex-col items-center gap-1.5 transition-all"
                                    title={c.label}>
                                    <div className="w-7 h-7 rounded-full transition-all"
                                        style={{
                                            background: `linear-gradient(135deg,${c.from},${c.to})`,
                                            boxShadow: settings.accentColor === c.id
                                                ? `0 0 14px ${c.from}88, 0 0 0 2px white`
                                                : `0 0 8px ${c.from}44`,
                                            transform: settings.accentColor === c.id ? 'scale(1.2)' : 'scale(1)',
                                        }} />
                                    <span style={{ fontSize: 8, color: settings.accentColor === c.id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                                        {c.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {settings.accentColor !== 'indigo' && (
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', marginTop: -4 }}>
                                Full accent theming coming soon — preference saved ✓
                            </p>
                        )}
                    </div>
                </Section>

                {/* ── Data ── */}
                <Section title="Data & Privacy">
                    <Row
                        label="Export your data"
                        sub="Download all your habits, todos, and journal entries"
                        right={
                            <button
                                onClick={() => {
                                    const data = {
                                        exportedAt: new Date().toISOString(),
                                        user: {
                                            username: currentUsername,
                                            email: user?.primaryEmailAddress?.emailAddress,
                                        },
                                        note: 'Full data export from Firestore coming soon.',
                                    };
                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                    const url  = URL.createObjectURL(blob);
                                    const a    = document.createElement('a');
                                    a.href = url; a.download = 'naplet-export.json'; a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                                style={{
                                    background: 'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(109,40,217,0.20))',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(99,102,241,0.30)',
                                }}>
                                Export JSON
                            </button>
                        }
                    />
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <Row
                        label="Clear local settings"
                        sub="Reset all preferences to defaults"
                        right={
                            <button
                                onClick={() => {
                                    localStorage.removeItem('naplet_settings');
                                    window.location.reload();
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.40)',
                                    border: '1px solid rgba(255,255,255,0.09)',
                                }}>
                                Reset
                            </button>
                        }
                    />
                </Section>

                {/* ── About ── */}
                <Section title="About">
                    <Row label="Version"  right={<span className="text-white/25 text-xs font-mono">1.0.0-beta</span>} />
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <Row label="Built with" right={<span className="text-white/25 text-xs">React · Firebase · Clerk</span>} />
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <Row
                        label="NAPLET"
                        sub="Your personal productivity workspace"
                        right={
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}>
                                <span className="text-white font-black text-xs" style={{ fontFamily: 'var(--font-logo)' }}>N</span>
                            </div>
                        }
                    />
                </Section>

                {/* ── Account / Danger ── */}
                <Section title="Account">
                    {!showSignOut ? (
                        <Row
                            label="Sign out"
                            sub="You'll be redirected to the login page"
                            right={
                                <button onClick={() => setShowSignOut(true)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                    style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                                    Sign out
                                </button>
                            }
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-white/50 text-sm">Are you sure you want to sign out?</p>
                            <div className="flex gap-2">
                                <button onClick={handleSignOut}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                                    style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 0 16px rgba(220,38,38,0.35)' }}>
                                    Yes, sign out
                                </button>
                                <button onClick={() => setShowSignOut(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </Section>

            </div>
        </div>
    );
}
