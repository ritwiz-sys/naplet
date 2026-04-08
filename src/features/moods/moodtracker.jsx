import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUser } from '@clerk/react';
import { MoodSkeleton } from '../../components/Skeleton';

const moods = [
    { label: 'Sad',     emoji: '😢', value: 'sad',     color: '#60a5fa', glow: 'rgba(96,165,250,0.5)',  bg: 'rgba(96,165,250,0.12)'  },
    { label: 'Angry',   emoji: '😡', value: 'angry',   color: '#f87171', glow: 'rgba(248,113,113,0.5)', bg: 'rgba(248,113,113,0.12)' },
    { label: 'Neutral', emoji: '😐', value: 'neutral', color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', bg: 'rgba(148,163,184,0.1)'  },
    { label: 'Happy',   emoji: '😊', value: 'happy',   color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',  bg: 'rgba(251,191,36,0.12)'  },
    { label: 'Amazing', emoji: '🤩', value: 'amazing', color: '#a78bfa', glow: 'rgba(167,139,250,0.5)', bg: 'rgba(167,139,250,0.12)' },
];

function MoodTracker() {
    const { user } = useUser();
    const [selectedMood, setSelectedMood] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logged, setLogged] = useState(false);

    const saveMood = async () => {
        if (!user || loading || !selectedMood) return;
        const mood = moods.find(m => m.value === selectedMood);
        if (!mood) return;
        try {
            setLoading(true);
            await addDoc(collection(db, 'moods'), {
                mood: mood.value,
                emoji: mood.emoji,
                timestamp: new Date(),
                userId: user.id,
            });
            setLogged(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <MoodSkeleton />;

    const activeMood = moods.find(m => m.value === selectedMood);

    return (
        <div className="flex flex-col gap-3">

            {/* Label row */}
            <div className="flex items-center justify-between">
                <span className="text-white/30 text-[10px] font-medium tracking-wider uppercase">
                    How are you feeling?
                </span>
                {activeMood && !logged && (
                    <span className="text-[10px] font-semibold" style={{ color: activeMood.color }}>
                        {activeMood.label}
                    </span>
                )}
            </div>

            {/* Emoji row */}
            <div className="flex gap-1 justify-between">
                {moods.map((mood) => {
                    const isSelected = selectedMood === mood.value;
                    return (
                        <button
                            key={mood.value}
                            onClick={() => { setSelectedMood(mood.value); setLogged(false); }}
                            title={mood.label}
                            className="flex-1 py-1.5 rounded-xl text-xl transition-all duration-200 relative overflow-hidden"
                            style={{
                                background: isSelected ? mood.bg : 'rgba(255,255,255,0.04)',
                                transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                                boxShadow: isSelected ? `0 0 14px ${mood.glow}` : 'none',
                                border: isSelected
                                    ? `1px solid ${mood.color}50`
                                    : '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            {/* Glow ring behind emoji */}
                            {isSelected && (
                                <span
                                    className="absolute inset-0 rounded-xl pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at 50% 50%, ${mood.glow} 0%, transparent 70%)`,
                                        animation: 'mood-pulse 2s ease-in-out infinite',
                                    }}
                                />
                            )}
                            <span className="relative" style={{
                                filter: isSelected ? `drop-shadow(0 0 6px ${mood.glow})` : 'none',
                                opacity: !selectedMood || isSelected ? 1 : 0.4,
                            }}>
                                {mood.emoji}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Log button */}
            <button
                onClick={saveMood}
                disabled={loading || !selectedMood || logged}
                className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-300 relative overflow-hidden"
                style={logged
                    ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }
                    : selectedMood && activeMood
                        ? {
                            background: `linear-gradient(135deg, ${activeMood.color}cc, ${activeMood.color}88)`,
                            color: 'white',
                            boxShadow: `0 4px 16px ${activeMood.glow}`,
                            border: '1px solid transparent',
                        }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }
                }
            >
                {logged ? (
                    <span className="flex items-center justify-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Mood logged!
                    </span>
                ) : loading ? (
                    <span className="flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Saving…
                    </span>
                ) : (
                    'Log Mood'
                )}
            </button>
        </div>
    );
}

export default MoodTracker;
