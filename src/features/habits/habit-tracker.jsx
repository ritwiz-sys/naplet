import { collection, addDoc, getDocs, updateDoc, deleteDoc, deleteField, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { HabitSkeleton } from '../../components/Skeleton';

const db = getFirestore();

const getTodayKey = () => new Date().toISOString().split('T')[0];

const calculateStreak = (completedDates = {}) => {
    let streak = 0;
    const date = new Date();
    while (completedDates[date.toISOString().slice(0, 10)]) {
        streak++;
        date.setDate(date.getDate() - 1);
    }
    return streak;
};

// Streak → color/glow theming
const getStreakTheme = (streak) => {
    if (streak >= 30) return { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', label: '🏆' };
    if (streak >= 14) return { color: '#a78bfa', glow: 'rgba(167,139,250,0.5)', label: '🔥' };
    if (streak >= 7)  return { color: '#34d399', glow: 'rgba(52,209,153,0.5)',  label: '🔥' };
    if (streak >= 3)  return { color: '#60a5fa', glow: 'rgba(96,165,250,0.4)',  label: '🔥' };
    return { color: '#6366f1', glow: 'rgba(99,102,241,0.4)', label: '🔥' };
};

const HabitTracker = () => {
    const [habits, setHabits]     = useState([]);
    const [input, setInput]       = useState('');
    const [showInput, setShowInput] = useState(false);
    const [loading, setLoading]   = useState(true);
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const snap = await getDocs(collection(db, 'users', user.id, 'habits'));
                setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const addHabit = async () => {
        if (!user || !input.trim()) return;
        const docRef = await addDoc(collection(db, 'users', user.id, 'habits'), {
            text: input.trim(), completedDates: {}, createdAt: serverTimestamp(),
        });
        setHabits(prev => [...prev, { id: docRef.id, text: input.trim(), completedDates: {} }]);
        setInput('');
        setShowInput(false);
    };

    const toggleHabit = async (id) => {
        const habit = habits.find(h => h.id === id);
        if (!habit) return;
        const today = getTodayKey();
        const done = habit.completedDates?.[today];
        await updateDoc(doc(db, 'users', user.id, 'habits', id), {
            [`completedDates.${today}`]: done ? deleteField() : true,
        });
        setHabits(prev => prev.map(h => {
            if (h.id !== id) return h;
            const cd = { ...h.completedDates };
            done ? delete cd[today] : (cd[today] = true);
            return { ...h, completedDates: cd };
        }));
    };

    const deleteHabit = async (id) => {
        await deleteDoc(doc(db, 'users', user.id, 'habits', id));
        setHabits(prev => prev.filter(h => h.id !== id));
    };

    if (loading) return <HabitSkeleton />;

    return (
        <div className="px-4 py-3 flex flex-col gap-2.5 h-full">

            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-logo)' }}>
                    Habits
                </h3>
                <button
                    onClick={() => setShowInput(s => !s)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                    style={showInput
                        ? { background: 'rgba(255,255,255,0.12)', color: 'white' }
                        : { color: 'rgba(255,255,255,0.35)' }
                    }
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>

            {/* Add input */}
            {showInput && (
                <div className="flex gap-1.5 flex-shrink-0">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addHabit()}
                        placeholder="New habit..."
                        className="flex-1 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-white/20 focus:outline-none transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    />
                    <button
                        onClick={addHabit}
                        disabled={!input.trim()}
                        className="px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}
                    >
                        Add
                    </button>
                </div>
            )}

            {/* Habits list */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
                {habits.length === 0 && !showInput && (
                    <div className="flex flex-col items-center justify-center py-3 gap-1.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            ✦
                        </div>
                        <p className="text-white/20 text-[10px]">No habits yet — click +</p>
                    </div>
                )}

                {habits.map(habit => {
                    const today  = getTodayKey();
                    const done   = !!habit.completedDates?.[today];
                    const streak = calculateStreak(habit.completedDates || {});
                    const pct    = Math.min(100, (streak / 30) * 100);
                    const theme  = getStreakTheme(streak);

                    return (
                        <div key={habit.id} className="flex flex-col gap-1 group">
                            <div className="flex items-center gap-2">

                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleHabit(habit.id)}
                                    className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                    style={done
                                        ? {
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                                            border: 'none',
                                        }
                                        : {
                                            border: '1.5px solid rgba(255,255,255,0.18)',
                                            background: 'rgba(255,255,255,0.04)',
                                        }
                                    }
                                >
                                    {done && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>

                                {/* Label */}
                                <span className={`flex-1 text-xs leading-tight truncate transition-all duration-300
                                    ${done ? 'text-white/30 line-through' : 'text-white/80'}`}>
                                    {habit.text}
                                </span>

                                {/* Streak badge */}
                                {streak > 0 && (
                                    <span
                                        className="text-[9px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full"
                                        style={{
                                            color: theme.color,
                                            background: theme.glow.replace('0.', '0.0'),
                                            boxShadow: streak >= 7 ? `0 0 6px ${theme.glow}` : 'none',
                                        }}
                                    >
                                        {theme.label} {streak}
                                    </span>
                                )}

                                {/* Delete on hover */}
                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="h-0.5 rounded-full overflow-hidden ml-6"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${pct}%`,
                                        background: done
                                            ? `linear-gradient(90deg, ${theme.color}aa, ${theme.color})`
                                            : 'rgba(255,255,255,0.12)',
                                        boxShadow: done && pct > 0 ? `0 0 6px ${theme.glow}` : 'none',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HabitTracker;
