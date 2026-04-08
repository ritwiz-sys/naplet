import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const MOOD_COLORS = {
    sad:     '#60a5fa',
    angry:   '#f87171',
    neutral: '#94a3b8',
    happy:   '#fbbf24',
    amazing: '#a78bfa',
};
const MOOD_EMOJI = {
    sad: '😢', angry: '😡', neutral: '😐', happy: '😊', amazing: '🤩',
};

// ── Matte glass section wrapper ───────────────────────────────────
function Section({ children, style = {} }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.055)',
            borderTop: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 16,
            padding: '18px 20px',
            ...style,
        }}>
            {children}
        </div>
    );
}

// ── Section label ─────────────────────────────────────────────────
function SectionLabel({ children }) {
    return (
        <p style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.30)',
            marginBottom: 14,
            fontFamily: 'var(--font-logo)',
        }}>
            {children}
        </p>
    );
}

// ── Big stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = '#6366f1', icon }) {
    return (
        <div style={{
            background: `linear-gradient(150deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)`,
            border: `1px solid ${accent}22`,
            borderTop: `1px solid ${accent}44`,
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Corner accent glow */}
            <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80,
                background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
                    {label}
                </span>
                {icon && <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>}
            </div>

            <span style={{
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1,
                fontFamily: 'var(--font-logo)',
                color: accent,
                textShadow: `0 0 20px ${accent}55`,
            }}>
                {value}
            </span>

            {sub && (
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                    {sub}
                </span>
            )}
        </div>
    );
}

// ── Horizontal mood bar ───────────────────────────────────────────
function MoodRow({ mood, count, pct }) {
    const color = MOOD_COLORS[mood] || '#6366f1';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, width: 22, flexShrink: 0 }}>{MOOD_EMOJI[mood]}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', width: 48, flexShrink: 0, fontWeight: 600 }}>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 8px ${color}55`,
                    transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', width: 18, textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>
                {count}
            </span>
        </div>
    );
}

// ── Thin progress row (habits / goals) ────────────────────────────
function ProgressRow({ label, pct, color = '#6366f1', tag }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.60)', fontWeight: 500, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
            </span>
            <div style={{ width: 88, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', flexShrink: 0, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    borderRadius: 2,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 6px ${color}66`,
                    transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
                }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 30, textAlign: 'right', flexShrink: 0 }}>
                {tag}
            </span>
        </div>
    );
}

// ── Donut ring (simple SVG) ───────────────────────────────────────
function DonutRing({ pct, color, size = 56 }) {
    const r    = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${color}99)` }} />
        </svg>
    );
}

// ── Empty state ───────────────────────────────────────────────────
function Empty({ emoji, text }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0', opacity: 0.5 }}>
            <span style={{ fontSize: 26 }}>{emoji}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{text}</span>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const { user }  = useUser();
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            getDocs(collection(db, 'moods')),
            getDocs(collection(db, 'users', user.id, 'habits')),
            getDocs(collection(db, 'users', user.id, 'todos')),
            getDocs(collection(db, 'users', user.id, 'goals')),
        ]).then(([moodSnap, habitSnap, todoSnap, goalSnap]) => {
            const moodCounts = {};
            moodSnap.docs.forEach(d => {
                const r = d.data();
                if (r.userId === user.id) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
            });
            setData({
                moodCounts,
                habits: habitSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                todos:  todoSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                goals:  goalSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            });
        });
    }, [user]);

    // Loading shimmer
    if (!data) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2px solid rgba(99,102,241,0.2)',
                borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    );

    const { moodCounts, habits, todos, goals } = data;

    // Derived stats
    const totalMoods = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const topMood    = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const maxMood    = Math.max(...Object.values(moodCounts), 1);

    const today      = new Date().toISOString().split('T')[0];
    const doneToday  = habits.filter(h => h.completedDates?.[today]).length;

    const doneTodos  = todos.filter(t => t.completed).length;

    const avgGoal    = goals.length
        ? Math.round(goals.reduce((a, g) => a + Math.min(100, ((g.current||0)/(g.target||1))*100), 0) / goals.length)
        : 0;

    const habitRate  = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;
    const taskRate   = todos.length   > 0 ? Math.round((doneTodos / todos.length)  * 100) : 0;

    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px 24px 32px',
            scrollbarWidth: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
        }}>
            {/* ── Page header ── */}
            <div style={{ marginBottom: 4 }}>
                <h2 style={{
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 22,
                    fontFamily: 'var(--font-logo)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    marginBottom: 4,
                }}>
                    Analytics
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, fontWeight: 500 }}>
                    Your productivity at a glance
                </p>
            </div>

            {/* ── Top stat row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                <StatCard
                    label="Habits today"
                    value={`${doneToday}/${habits.length}`}
                    sub="completed today"
                    accent="#34d399"
                    icon="✅"
                />
                <StatCard
                    label="Tasks done"
                    value={`${doneTodos}/${todos.length}`}
                    sub="all time"
                    accent="#6366f1"
                    icon="✓"
                />
                <StatCard
                    label="Goal progress"
                    value={`${avgGoal}%`}
                    sub="average across goals"
                    accent="#a78bfa"
                    icon="🎯"
                />
                <StatCard
                    label="Moods logged"
                    value={totalMoods}
                    sub={topMood ? `top: ${MOOD_EMOJI[topMood]} ${topMood}` : 'no entries yet'}
                    accent="#fbbf24"
                    icon="🧠"
                />
            </div>

            {/* ── Completion rings ── */}
            <Section>
                <SectionLabel>Today's Completion</SectionLabel>
                <div style={{ display: 'flex', gap: 20 }}>
                    {/* Habits ring */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <DonutRing pct={habitRate} color="#34d399" />
                            <span style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800, color: '#34d399',
                            }}>
                                {habitRate}%
                            </span>
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: 600, lineHeight: 1, marginBottom: 3 }}>Habits</p>
                            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>{doneToday} of {habits.length} done</p>
                        </div>
                    </div>
                    {/* Divider */}
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                    {/* Tasks ring */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <DonutRing pct={taskRate} color="#6366f1" />
                            <span style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800, color: '#6366f1',
                            }}>
                                {taskRate}%
                            </span>
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: 600, lineHeight: 1, marginBottom: 3 }}>Tasks</p>
                            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>{doneTodos} of {todos.length} done</p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Mood distribution ── */}
            <Section>
                <SectionLabel>Mood Distribution</SectionLabel>
                {totalMoods === 0 ? (
                    <Empty emoji="😐" text="No moods logged yet" />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {['amazing','happy','neutral','sad','angry']
                            .filter(m => moodCounts[m] > 0)
                            .map(m => (
                                <MoodRow
                                    key={m}
                                    mood={m}
                                    count={moodCounts[m]}
                                    pct={Math.round((moodCounts[m] / maxMood) * 100)}
                                />
                            ))}
                    </div>
                )}
            </Section>

            {/* ── Habit streaks ── */}
            <Section>
                <SectionLabel>Habit Streaks</SectionLabel>
                {habits.length === 0 ? (
                    <Empty emoji="⚡" text="No habits tracked yet" />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {habits.map(h => {
                            let streak = 0;
                            const d = new Date();
                            while (h.completedDates?.[d.toISOString().slice(0,10)]) {
                                streak++;
                                d.setDate(d.getDate() - 1);
                            }
                            const color = streak >= 14 ? '#a78bfa' : streak >= 7 ? '#34d399' : streak >= 3 ? '#60a5fa' : '#6366f1';
                            return (
                                <ProgressRow
                                    key={h.id}
                                    label={h.text}
                                    pct={Math.min(100, Math.round((streak / 30) * 100))}
                                    color={color}
                                    tag={streak > 0 ? `${streak}🔥` : '—'}
                                />
                            );
                        })}
                    </div>
                )}
            </Section>

            {/* ── Goals progress ── */}
            <Section>
                <SectionLabel>Goals Progress</SectionLabel>
                {goals.length === 0 ? (
                    <Empty emoji="🎯" text="No goals added yet" />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {goals.map(g => {
                            const pct = Math.min(100, Math.round(((g.current||0)/(g.target||1))*100));
                            return (
                                <ProgressRow
                                    key={g.id}
                                    label={g.title}
                                    pct={pct}
                                    color={g.color || '#6366f1'}
                                    tag={`${pct}%`}
                                />
                            );
                        })}
                    </div>
                )}
            </Section>
        </div>
    );
}
