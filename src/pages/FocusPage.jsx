import { useState, useEffect, useRef, useCallback } from 'react';

const MODES = [
    { id: 'work',       label: 'Focus',       minutes: 25, color: '#6366f1', glow: 'rgba(99,102,241,0.45)'  },
    { id: 'short',      label: 'Short Break', minutes: 5,  color: '#34d399', glow: 'rgba(52,211,153,0.40)'  },
    { id: 'long',       label: 'Long Break',  minutes: 15, color: '#60a5fa', glow: 'rgba(96,165,250,0.40)'  },
];

function pad(n) { return String(n).padStart(2, '0'); }

// SVG ring progress
function TimerRing({ pct, color, glow, size = 220 }) {
    const r      = (size - 16) / 2;
    const circ   = 2 * Math.PI * r;
    const offset = circ * (1 - pct);
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={size/2} cy={size/2} r={r}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* Progress arc */}
            <circle cx={size/2} cy={size/2} r={r}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{
                    transition: 'stroke-dashoffset 0.9s linear',
                    filter: `drop-shadow(0 0 8px ${glow})`,
                }} />
        </svg>
    );
}

export default function FocusPage() {
    const [modeIdx,   setModeIdx]   = useState(0);
    const [secsLeft,  setSecsLeft]  = useState(MODES[0].minutes * 60);
    const [running,   setRunning]   = useState(false);
    const [sessions,  setSessions]  = useState(0);
    const intervalRef = useRef(null);

    const mode    = MODES[modeIdx];
    const total   = mode.minutes * 60;
    const pct     = secsLeft / total;
    const mins    = Math.floor(secsLeft / 60);
    const secs    = secsLeft % 60;

    const stop = useCallback(() => {
        clearInterval(intervalRef.current);
        setRunning(false);
    }, []);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSecsLeft(s => {
                    if (s <= 1) {
                        stop();
                        if (MODES[modeIdx].id === 'work') setSessions(n => n + 1);
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, modeIdx, stop]);

    const switchMode = (idx) => {
        stop();
        setModeIdx(idx);
        setSecsLeft(MODES[idx].minutes * 60);
    };

    const toggle = () => setRunning(r => !r);
    const reset  = () => { stop(); setSecsLeft(total); };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 overflow-hidden">

            {/* Mode tabs */}
            <div className="flex gap-2 p-1 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {MODES.map((m, i) => (
                    <button key={m.id} onClick={() => switchMode(i)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                        style={modeIdx === i ? {
                            background: `linear-gradient(135deg,${m.color}44,${m.color}22)`,
                            color: m.color,
                            border: `1px solid ${m.color}55`,
                            boxShadow: `0 0 14px ${m.glow}`,
                        } : {
                            color: 'rgba(255,255,255,0.35)',
                            border: '1px solid transparent',
                        }}>
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Timer ring */}
            <div className="relative flex items-center justify-center">
                <TimerRing pct={pct} color={mode.color} glow={mode.glow} />

                {/* Ambient behind ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div style={{
                        width: 140, height: 140, borderRadius: '50%',
                        background: `radial-gradient(circle, ${mode.glow} 0%, transparent 70%)`,
                        animation: running ? 'glow-breathe 2.5s ease-in-out infinite' : 'none',
                    }} />
                </div>

                {/* Time display */}
                <div className="absolute flex flex-col items-center gap-1">
                    <span className="font-bold tabular-nums leading-none"
                        style={{
                            fontSize: 52,
                            fontFamily: 'var(--font-logo)',
                            color: 'white',
                            textShadow: running ? `0 0 30px ${mode.color}` : 'none',
                            transition: 'text-shadow 0.5s ease',
                        }}>
                        {pad(mins)}:{pad(secs)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: mode.color, opacity: 0.75, fontSize: 9, letterSpacing: '0.18em' }}>
                        {mode.label}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {/* Reset */}
                <button onClick={reset}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                    </svg>
                </button>

                {/* Play / Pause */}
                <button onClick={toggle}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200"
                    style={{
                        background: `linear-gradient(135deg, ${mode.color}, ${mode.color}bb)`,
                        boxShadow: `0 0 28px ${mode.glow}, 0 4px 20px rgba(0,0,0,0.4)`,
                        border: '1px solid rgba(255,255,255,0.12)',
                        transform: running ? 'scale(0.96)' : 'scale(1)',
                    }}>
                    {running ? (
                        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                    )}
                </button>

                {/* Skip to next mode */}
                <button onClick={() => switchMode((modeIdx + 1) % MODES.length)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                        <polygon points="5,4 15,12 5,20" />
                        <line x1="19" y1="5" x2="19" y2="19" />
                    </svg>
                </button>
            </div>

            {/* Session counter */}
            <div className="flex items-center gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full transition-all duration-500"
                        style={i < (sessions % 4) ? {
                            background: mode.color,
                            boxShadow: `0 0 8px ${mode.glow}`,
                        } : {
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }} />
                ))}
                <span className="text-white/25 text-xs ml-1">
                    {sessions} session{sessions !== 1 ? 's' : ''} today
                </span>
            </div>

            {/* Tips */}
            <p className="text-white/18 text-xs text-center max-w-xs leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>
                {mode.id === 'work'
                    ? 'Close distractions • Phone face-down • Deep work mode'
                    : 'Step away • Stretch • Hydrate • Breathe'}
            </p>
        </div>
    );
}
