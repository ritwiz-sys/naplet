import { useState, useEffect, useRef, useCallback } from 'react';

// ── Streaming hook — reveals text char-by-char ────────────────────
function useStreaming(fullText, speed = 18) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone]           = useState(true);

    const stream = useCallback((text) => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const tick = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(tick);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(tick);
    }, [speed]);

    return { displayed, done, stream };
}

// ── Animated dots loader ──────────────────────────────────────────
function ThinkingDots() {
    return (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', height: 16 }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: 'rgba(167,139,250,0.7)',
                    display: 'inline-block',
                    animation: `dot-bounce 1.2s ${i * 0.18}s ease-in-out infinite`,
                }} />
            ))}
        </span>
    );
}

// ── Cursor blink ──────────────────────────────────────────────────
function Cursor() {
    return (
        <span style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            background: '#a78bfa',
            marginLeft: 1,
            verticalAlign: 'text-bottom',
            animation: 'cursor-blink 0.6s step-end infinite',
        }} />
    );
}

// ── Send icon ─────────────────────────────────────────────────────
function SendIcon({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
            <path d="M22 2L11 13" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.25)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.25)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Main Component ────────────────────────────────────────────────
function AIWelcomeCard({ firstName, habits = [], moods = [], todos = [], weather = null }) {
    const [query,   setQuery]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const inputRef              = useRef(null);
    const responseRef           = useRef(null);

    const { displayed, done, stream } = useStreaming('', 14);

    // Auto-scroll response area as text streams
    useEffect(() => {
        if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
    }, [displayed]);

    const askAI = async () => {
        const trimmed = query.trim();
        if (!trimmed || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8080/api/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `You are a personal productivity coach for Naplet app. Be concise and helpful.
User data:
- Habits: ${JSON.stringify(habits)}
- Moods: ${JSON.stringify(moods)}
- Todos: ${JSON.stringify(todos)}
- Weather: ${JSON.stringify(weather)}

User: ${trimmed}`,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            stream(data.response || 'No response received.');
        } catch (e) {
            stream('Sorry, something went wrong. Please try again.');
            setError(true);
        } finally {
            setLoading(false);
            setQuery('');
            // Re-focus input after response
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askAI();
        }
    };

    const hasResponse = displayed.length > 0;

    return (
        <div className="naplet-card flex-1 flex flex-col relative" style={{
            minHeight: 0,
            background: 'rgba(6,4,13,0.62)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            boxShadow: `
                0 0 0 1px rgba(79,70,229,0.06),
                0 4px 24px rgba(0,0,0,0.40),
                inset 0 1px 0 rgba(255,255,255,0.04)
            `,
            overflow: 'hidden',
        }}>
            {/* ── CSS keyframes injected once ── */}
            <style>{`
                @keyframes dot-bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40%           { transform: scale(1.1); opacity: 1; }
                }
                @keyframes cursor-blink {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0; }
                }
                @keyframes response-fade-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ── Ambient glow blobs ── */}
            <div className="absolute pointer-events-none" style={{
                top: -20, right: -20, width: 160, height: 160,
                background: 'radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
            }} />

            {/* ── Brand accent stripe ── */}
            <div className="flex-shrink-0 relative" style={{ height: 2, zIndex: 2 }}>
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, #4338ca 20%, #7c3aed 50%, #6366f1 80%, transparent 100%)' }} />
                <div className="absolute inset-x-0 top-0"
                    style={{ height: 10, background: 'linear-gradient(180deg, rgba(99,102,241,0.35) 0%, transparent 100%)', transform: 'translateY(-2px)' }} />
            </div>

            {/* ── Grid texture ── */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                zIndex: 1,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
            }} />

            {/* ── Card body ── */}
            <div className="relative flex flex-col h-full" style={{ zIndex: 2, padding: '14px 16px 14px', minHeight: 0 }}>

                {/* Header */}
                <div style={{ marginBottom: 12, flexShrink: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, fontWeight: 500, marginBottom: 2 }}>
                        Welcome back,
                    </p>
                    <h2 style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 800,
                        fontFamily: 'var(--font-logo)',
                        lineHeight: 1,
                    }}>
                        {firstName || 'there'}
                    </h2>
                </div>

                {/* ── Response area ── */}
                <div
                    ref={responseRef}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: hasResponse || loading ? 'flex-start' : 'center',
                        alignItems: hasResponse || loading ? 'stretch' : 'center',
                        marginBottom: 10,
                    }}
                >
                    {/* Empty state — centered orb */}
                    {!hasResponse && !loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'radial-gradient(circle at 35% 35%, rgba(160,120,255,0.85) 0%, rgba(80,60,220,0.55) 45%, transparent 100%)',
                                boxShadow: '0 0 30px 8px rgba(100,70,255,0.30)',
                                animation: 'float 4s ease-in-out infinite',
                            }} />
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', textAlign: 'center', lineHeight: 1.5 }}>
                                Ask me anything about<br />your day, habits, or goals
                            </p>
                        </div>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            animation: 'response-fade-in 0.2s ease-out both',
                        }}>
                            {/* AI avatar dot */}
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                boxShadow: '0 0 10px rgba(99,102,241,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: 1,
                            }}>
                                <span style={{ fontSize: 8, fontWeight: 900, color: 'white', fontFamily: 'var(--font-logo)' }}>N</span>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '4px 12px 12px 12px',
                                padding: '8px 12px',
                            }}>
                                <ThinkingDots />
                            </div>
                        </div>
                    )}

                    {/* Streamed response */}
                    {hasResponse && !loading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            animation: 'response-fade-in 0.2s ease-out both',
                        }}>
                            {/* AI avatar dot */}
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                boxShadow: '0 0 10px rgba(99,102,241,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: 1,
                            }}>
                                <span style={{ fontSize: 8, fontWeight: 900, color: 'white', fontFamily: 'var(--font-logo)' }}>N</span>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '4px 12px 12px 12px',
                                padding: '8px 12px',
                                flex: 1,
                            }}>
                                <p style={{
                                    fontSize: 12.5,
                                    color: 'rgba(255,255,255,0.80)',
                                    lineHeight: 1.65,
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {displayed}
                                    {!done && <Cursor />}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Input bar ── */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.045)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 12,
                    padding: '8px 10px 8px 13px',
                    transition: 'border-color 0.2s ease',
                }}>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask me anything…"
                        disabled={loading}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            caretColor: '#a78bfa',
                        }}
                    />
                    <button
                        onClick={askAI}
                        disabled={!query.trim() || loading}
                        style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: query.trim() && !loading
                                ? 'linear-gradient(135deg, #6d28d9, #4f46e5)'
                                : 'rgba(255,255,255,0.05)',
                            border: 'none',
                            cursor: query.trim() && !loading ? 'pointer' : 'default',
                            transition: 'background 0.2s ease, box-shadow 0.2s ease',
                            boxShadow: query.trim() && !loading ? '0 0 14px rgba(99,102,241,0.35)' : 'none',
                        }}
                    >
                        <SendIcon active={!!query.trim() && !loading} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AIWelcomeCard;
