import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLORS = ['#6366f1','#a78bfa','#34d399','#60a5fa','#fbbf24','#f472b6'];

export default function GoalsPage() {
    const { user } = useUser();
    const [goals,     setGoals]     = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [showForm,  setShowForm]  = useState(false);
    const [title,     setTitle]     = useState('');
    const [target,    setTarget]    = useState('');
    const [unit,      setUnit]      = useState('');
    const [color,     setColor]     = useState(COLORS[0]);
    const [saving,    setSaving]    = useState(false);

    useEffect(() => {
        if (!user) return;
        getDocs(collection(db, 'users', user.id, 'goals')).then(snap => {
            setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
    }, [user]);

    const addGoal = async () => {
        if (!title.trim() || !user) return;
        setSaving(true);
        const data = { title: title.trim(), target: Number(target) || 100, current: 0, unit: unit.trim() || '%', color, createdAt: serverTimestamp() };
        const ref  = await addDoc(collection(db, 'users', user.id, 'goals'), data);
        setGoals(prev => [...prev, { id: ref.id, ...data }]);
        setTitle(''); setTarget(''); setUnit(''); setColor(COLORS[0]);
        setShowForm(false); setSaving(false);
    };

    const updateProgress = async (id, delta) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;
        const next = Math.max(0, Math.min(goal.target, (goal.current || 0) + delta));
        await updateDoc(doc(db, 'users', user.id, 'goals', id), { current: next });
        setGoals(prev => prev.map(g => g.id === id ? { ...g, current: next } : g));
    };

    const deleteGoal = async (id) => {
        await deleteDoc(doc(db, 'users', user.id, 'goals', id));
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'none' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-bold text-2xl" style={{ fontFamily: 'var(--font-logo)' }}>Goals</h2>
                    <p className="text-white/35 text-xs mt-0.5">Track what you're working towards</p>
                </div>
                <button onClick={() => setShowForm(s => !s)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={showForm
                        ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                        : { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }
                    }>
                    {showForm ? '✕ Cancel' : '+ New Goal'}
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="naplet-card mb-5 p-4 flex flex-col gap-3"
                    style={{
                        background: 'linear-gradient(160deg,#0e0c1c,#060610)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: '1px solid rgba(255,255,255,0.13)',
                    }}>
                    <div className="flex gap-3">
                        <input value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Goal title…"
                            className="flex-1 bg-transparent text-white text-sm placeholder-white/20 focus:outline-none border-b pb-1"
                            style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                        <input value={target} onChange={e => setTarget(e.target.value)}
                            placeholder="Target (e.g. 100)"
                            type="number" min="1"
                            className="w-28 bg-transparent text-white text-sm placeholder-white/20 focus:outline-none border-b pb-1"
                            style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                        <input value={unit} onChange={e => setUnit(e.target.value)}
                            placeholder="Unit (km, hrs…)"
                            className="w-24 bg-transparent text-white text-sm placeholder-white/20 focus:outline-none border-b pb-1"
                            style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)}
                                    className="rounded-full transition-all"
                                    style={{
                                        width: color === c ? 16 : 12, height: color === c ? 16 : 12,
                                        background: c,
                                        boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                                        opacity: color === c ? 1 : 0.5,
                                    }} />
                            ))}
                        </div>
                        <button onClick={addGoal} disabled={!title.trim() || saving}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-30"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                            {saving ? 'Saving…' : 'Add Goal'}
                        </button>
                    </div>
                </div>
            )}

            {/* Goals grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                </div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        🎯
                    </div>
                    <p className="text-white/25 text-sm">No goals yet — create your first one</p>
                </div>
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
                    {goals.map(goal => {
                        const pct  = Math.min(100, Math.round(((goal.current || 0) / (goal.target || 1)) * 100));
                        const done = pct >= 100;
                        return (
                            <div key={goal.id} className="naplet-card group p-4 flex flex-col gap-3"
                                style={{
                                    background: `linear-gradient(160deg,#0e0c1c,#060610)`,
                                    border: `1px solid ${goal.color}22`,
                                    borderTop: `1px solid ${goal.color}44`,
                                    boxShadow: `0 0 0 1px ${goal.color}14, 0 4px 20px rgba(0,0,0,0.5)`,
                                }}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-white font-semibold text-sm leading-tight">{goal.title}</p>
                                        <p className="text-white/30 text-xs mt-0.5">
                                            {goal.current || 0} / {goal.target} {goal.unit}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {done && <span className="text-sm">🏆</span>}
                                        <button onClick={() => deleteGoal(goal.id)}
                                            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="flex justify-between mb-1.5">
                                        <span style={{ fontSize: 9, color: goal.color, fontWeight: 700 }}>{pct}%</span>
                                        {done && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 700 }}>COMPLETE</span>}
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                background: `linear-gradient(90deg,${goal.color}99,${goal.color})`,
                                                boxShadow: `0 0 8px ${goal.color}88`,
                                            }} />
                                    </div>
                                </div>

                                {/* +/- controls */}
                                {!done && (
                                    <div className="flex items-center gap-2">
                                        {[1, 5, 10].map(step => (
                                            <button key={step} onClick={() => updateProgress(goal.id, step)}
                                                className="flex-1 py-1 rounded-lg text-xs font-bold transition-all"
                                                style={{
                                                    background: `${goal.color}18`,
                                                    color: goal.color,
                                                    border: `1px solid ${goal.color}30`,
                                                }}>
                                                +{step}
                                            </button>
                                        ))}
                                        <button onClick={() => updateProgress(goal.id, -1)}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            −
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
