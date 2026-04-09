import { useState } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Weather from '../features/Weather/weather';
import Mood from '../features/moods/moodtracker';
import TodoList from '../features/Todo/todolist';
import HabitTracker from '../features/habits/habit-tracker';
import NotesWidget from '../features/notes/notes-widget';
import Calendar from '../features/calendar/calendar';
import Beams         from '../components/Beams';
import FocusPage     from './FocusPage';
import GoalsPage     from './GoalsPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage  from './SettingsPage';
import AIWelcomeCard from '../features/AIWelcomecard';


// ── Full-page skeleton shown while Clerk resolves the user ─────────
function DashboardSkeleton() {
    return (
        <div className="flex h-dvh w-screen overflow-hidden dashboard-bg">

            {/* Sidebar skeleton - hidden on mobile */}
            <div className="hidden md:flex relative z-10 flex-col items-center py-5 gap-3 flex-shrink-0"
                style={{ width: 56, background: 'rgba(6,10,28,0.70)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton rounded-xl" style={{ width: 36, height: 36 }} />
                ))}
                <div className="mt-auto skeleton rounded-full" style={{ width: 36, height: 36 }} />
            </div>

            <div className="relative z-10 flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
                {/* Top bar skeleton */}
                <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="skeleton rounded-xl" style={{ width: 32, height: 32 }} />
                        <div className="skeleton rounded-md" style={{ width: 80, height: 14 }} />
                    </div>
                    <div className="flex gap-2">
                        <div className="skeleton rounded-xl" style={{ width: 72, height: 30 }} />
                        <div className="skeleton rounded-xl" style={{ width: 110, height: 30 }} />
                    </div>
                </div>

                {/* Greeting skeleton */}
                <div className="flex flex-col items-center py-1.5 gap-2">
                    <div className="skeleton rounded-xl" style={{ width: 320, height: 36 }} />
                    <div className="skeleton rounded-md" style={{ width: 180, height: 11 }} />
                </div>

                {/* Grid skeleton */}
                <div className="flex-1 px-4 pb-4 grid gap-3 min-h-0"
                    style={{ gridTemplateColumns: 'minmax(0,200px) minmax(0,1fr) minmax(0,260px)', gridTemplateRows: '1fr' }}>

                    {/* Left column */}
                    <div className="flex flex-col gap-3">
                        <div className="glass p-4 flex flex-col gap-3" style={{ flexShrink: 0 }}>
                            <div className="skeleton rounded-md" style={{ width: 90, height: 14 }} />
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => <div key={i} className="skeleton rounded-full flex-1" style={{ height: 32 }} />)}
                            </div>
                            <div className="skeleton rounded-xl" style={{ height: 34 }} />
                        </div>
                        <div className="glass flex-1" style={{ minHeight: 0 }}>
                            <div className="p-4 flex flex-col gap-4 h-full">
                                <div className="flex justify-between">
                                    <div className="skeleton rounded-full" style={{ width: 40, height: 40 }} />
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="skeleton rounded-md" style={{ width: 60, height: 28 }} />
                                        <div className="skeleton rounded-md" style={{ width: 44, height: 10 }} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 mt-auto">
                                    <div className="skeleton rounded-md" style={{ width: '70%', height: 14 }} />
                                    <div className="skeleton rounded-md" style={{ width: '50%', height: 10 }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center column */}
                    <div className="flex flex-col gap-3">
                        <div className="glass flex-1" style={{ minHeight: 0 }} />
                        <div className="glass" style={{ height: 140, flexShrink: 0 }}>
                            <div className="p-4 flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <div className="skeleton rounded-md" style={{ width: 55, height: 14 }} />
                                    <div className="skeleton rounded-md" style={{ width: 22, height: 22 }} />
                                </div>
                                {[90, 70, 80].map((w, i) => (
                                    <div key={i} className="skeleton rounded-md" style={{ width: `${w}%`, height: 11 }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-3">
                        <div className="glass flex-1 p-3" style={{ minHeight: 0 }}>
                            <div className="flex flex-col gap-2 h-full">
                                <div className="flex justify-between">
                                    <div className="skeleton rounded-md" style={{ width: 22, height: 22 }} />
                                    <div className="skeleton rounded-md" style={{ width: 100, height: 12 }} />
                                    <div className="skeleton rounded-md" style={{ width: 22, height: 22 }} />
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {[...Array(35)].map((_, i) => <div key={i} className="skeleton rounded-md" style={{ height: 24 }} />)}
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex-1 flex flex-col gap-1.5">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="skeleton rounded-full" style={{ width: 8, height: 8 }} />
                                            <div className="skeleton rounded-md flex-1" style={{ height: 12 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="glass" style={{ height: 200, flexShrink: 0 }}>
                            <div className="px-3 py-3 flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <div className="skeleton rounded-md" style={{ width: 44, height: 14 }} />
                                    <div className="skeleton rounded-md" style={{ width: 22, height: 22 }} />
                                </div>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div className="skeleton rounded-full" style={{ width: 14, height: 14 }} />
                                        <div className="skeleton rounded-md flex-1" style={{ height: 11 }} />
                                        <div className="skeleton rounded-md" style={{ width: 20, height: 18 }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="glass" style={{ minHeight: 110, flexShrink: 0 }}>
                            <div className="px-4 py-3 flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <div className="skeleton rounded-md" style={{ width: 44, height: 14 }} />
                                    <div className="skeleton rounded-md" style={{ width: 22, height: 22 }} />
                                </div>
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="skeleton rounded-full" style={{ width: 14, height: 14 }} />
                                            <div className="skeleton rounded-md flex-1" style={{ height: 11 }} />
                                        </div>
                                        <div className="skeleton rounded-full ml-6" style={{ height: 3 }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Section card wrapper ───────────────────────────────────────────
function Card({ children, className = '', style = {}, noStripe = false }) {
    return (
        <div
            className={`naplet-card flex flex-col ${className}`}
            style={{
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
                ...style,
            }}
        >
            {/* Ambient top-right glow blob */}
            <div className="absolute pointer-events-none" style={{
                top: -15, right: -15, width: 120, height: 120,
                background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
            }} />
            {/* Ambient bottom-left glow blob */}
            <div className="absolute pointer-events-none" style={{
                bottom: -20, left: -10, width: 100, height: 100,
                background: 'radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
            }} />
            {/* Brand accent stripe */}
            {!noStripe && (
                <div className="flex-shrink-0 relative" style={{ height: 2, zIndex: 1 }}>
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, #4338ca 20%, #7c3aed 50%, #6366f1 80%, transparent 100%)' }} />
                    <div className="absolute inset-x-0 top-0"
                        style={{ height: 10, background: 'linear-gradient(180deg, rgba(99,102,241,0.35) 0%, transparent 100%)', transform: 'translateY(-2px)' }} />
                </div>
            )}
            {/* Content */}
            <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}


// ── Dashboard ──────────────────────────────────────────────────────
function Dashboard() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const navigate    = useNavigate();
    const [activePage, setActivePage] = useState('home');

    // Placeholders for AI context data (to be connected to actual data sources later)
    const habits = [];
    const moods = [];
    const todos = [];
    const weather = null;


    const handleBackToLogin = async () => {
        await signOut();
        navigate('/login');
    };

    // Show full-page skeleton until Clerk has resolved the user
    if (!isLoaded) return <DashboardSkeleton />;

    // Prefer username from unsafeMetadata (set during custom signup), fallback to firstName
    const displayName = user?.unsafeMetadata?.username || user?.firstName || 'there';

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

    const dayLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric'
    });

    return (
        <div className="flex h-dvh w-screen overflow-hidden dashboard-bg">

            {/* ── Beams background ── */}
            <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                <Beams
                    beamWidth={2}
                    beamHeight={15}
                    beamNumber={12}
                    lightColor="#ffffff"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={0.2}
                    rotation={0}
                />
            </div>

            {/* Sidebar */}
            <Sidebar activePage={activePage} onNav={setActivePage} />

            {/* Main */}
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-w-0 pb-16 md:pb-0">

                {/* ── Top bar ── */}
                <header className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}>
                            <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-logo)' }}>N</span>
                        </div>
                        <span className="text-white font-bold text-sm tracking-widest hidden sm:block"
                            style={{ fontFamily: 'var(--font-logo)', letterSpacing: '0.15em' }}>
                            NAPLET
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-xl text-white/55 text-xs font-medium transition-all hover:text-white hidden sm:flex"
                            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                            Upgrade
                        </button>
                        <button
                            onClick={handleBackToLogin}
                            className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90 flex items-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span className="hidden sm:block">Back to Login</span>
                        </button>
                    </div>
                </header>

                {/* ── Inner pages (Focus / Goals / Analytics / Settings) ── */}
                {activePage !== 'home' && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        {/* Page header bar */}
                        <div className="px-5 py-3 flex-shrink-0 flex items-center gap-2"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <button onClick={() => setActivePage('home')}
                                className="flex items-center gap-1.5 text-white/35 hover:text-white/70 transition-colors text-xs font-medium">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                                Home
                            </button>
                            <span className="text-white/15 text-xs">/</span>
                            <span className="text-white/60 text-xs font-semibold capitalize">{activePage}</span>
                        </div>
                        {/* Page content */}
                        <div className="flex-1 flex overflow-hidden min-h-0">
                            {activePage === 'focus'     && <FocusPage />}
                            {activePage === 'goals'     && <GoalsPage />}
                            {activePage === 'analytics' && <AnalyticsPage />}
                            {activePage === 'settings'  && <SettingsPage />}
                        </div>
                    </div>
                )}

                {/* ── Home: greeting + widget grid ── */}
                {activePage === 'home' && <>
                <div className="text-center py-1 sm:py-1.5 flex-shrink-0">
                    <h1 className="text-white font-bold tracking-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                        style={{ fontFamily: 'var(--font-logo)' }}>
                        {greeting}, {displayName}!
                    </h1>
                    <p className="text-white/35 text-xs mt-0.5 font-medium">{dayLabel}</p>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 pb-4 min-h-0">
                    <div className="dash-grid h-full grid gap-3"
                        style={{
                            gridTemplateColumns: 'minmax(0,200px) minmax(0,1fr) minmax(0,260px)',
                            gridTemplateRows: '1fr',
                            minHeight: '100%',
                        }}>

                        {/* ── LEFT COLUMN ── */}
                        <div className="flex flex-col gap-3 min-h-0 dash-col">

                            {/* Mood Tracker */}
                            <Card className="flex-shrink-0" style={{ padding: 0 }}>
                                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#a78bfa,#6366f1)', boxShadow: '0 0 6px rgba(167,139,250,0.6)' }} />
                                    <span className="font-bold tracking-widest uppercase"
                                        style={{ fontSize: 9, fontFamily: 'var(--font-logo)', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)' }}>
                                        Mood
                                    </span>
                                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.22), transparent)' }} />
                                </div>
                                <div className="px-4 pb-4">
                                    <Mood />
                                </div>
                            </Card>

                            {/* Weather */}
                            <div className="card-lift flex-1 min-h-0 dash-weather-card">
                                <Weather />
                            </div>
                        </div>

                        {/* ── CENTER COLUMN ── */}
                        <div className="flex flex-col gap-3 min-h-0 dash-col">

                            {/* AI Welcome (unchanged) */}
                            {/* AI card – needs explicit height on mobile/tablet */}
                            <div className="flex-1 min-h-0 dash-ai-card flex flex-col">
                                <AIWelcomeCard
                                    firstName={displayName}
                                    habits={habits}
                                    moods={moods}
                                    todos={todos}
                                    weather={weather}
                                />
                            </div>

                            {/* Journal */}
                            <Card style={{ height: 155, flexShrink: 0, padding: 0 }}>
                                <NotesWidget />
                            </Card>
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div className="flex flex-col gap-3 min-h-0 dash-col">

                            {/* ── Unified Calendar + Tasks card ── */}
                            <div className="naplet-card flex-1 min-h-0 flex flex-col relative dash-calendar-card"
                                style={{
                                    background: 'rgba(6,4,13,0.62)',
                                    backdropFilter: 'blur(14px)',
                                    WebkitBackdropFilter: 'blur(14px)',
                                    borderRadius: 20,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderTop: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: `
                                        0 0 0 1px rgba(79,70,229,0.06),
                                        0 4px 24px rgba(0,0,0,0.40),
                                        inset 0 1px 0 rgba(255,255,255,0.04)
                                    `,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Ambient corner glow – top right */}
                                <div className="absolute pointer-events-none"
                                    style={{
                                        top: -20, right: -20, width: 160, height: 160,
                                        background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
                                        borderRadius: '50%',
                                    }} />
                                {/* Ambient corner glow – bottom left */}
                                <div className="absolute pointer-events-none"
                                    style={{
                                        bottom: -30, left: -20, width: 130, height: 130,
                                        background: 'radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%)',
                                        borderRadius: '50%',
                                    }} />

                                {/* ── Brand accent stripe – glowing, never scrolls ── */}
                                <div className="flex-shrink-0 relative overflow-hidden" style={{ height: 2 }}>
                                    <div className="absolute inset-0"
                                        style={{ background: 'linear-gradient(90deg, transparent 0%, #4338ca 20%, #7c3aed 50%, #6366f1 80%, transparent 100%)' }} />
                                    {/* Stripe glow bloom */}
                                    <div className="absolute inset-x-0 top-0"
                                        style={{ height: 12, background: 'linear-gradient(180deg, rgba(99,102,241,0.4) 0%, transparent 100%)', transform: 'translateY(-2px)' }} />
                                </div>

                                {/* ── Scrollable body ── */}
                                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10"
                                    style={{ scrollbarWidth: 'none' }}>

                                    {/* Calendar full grid */}
                                    <Calendar embedded />

                                    {/* ── Tasks section ── */}
                                    <div style={{
                                        background: `
                                            linear-gradient(180deg,
                                                rgba(99,102,241,0.06) 0%,
                                                rgba(79,70,229,0.03) 40%,
                                                transparent 100%
                                            )
                                        `,
                                        borderTop: '1px solid rgba(99,102,241,0.12)',
                                        position: 'relative',
                                    }}>
                                        {/* Tasks section top glow */}
                                        <div className="absolute inset-x-0 top-0 pointer-events-none"
                                            style={{ height: 30, background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)' }} />

                                        {/* Tasks label row */}
                                        <div className="px-4 pt-3 pb-1 flex items-center gap-2 relative">
                                            {/* Accent pill */}
                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', boxShadow: '0 0 6px rgba(167,139,250,0.6)' }} />
                                            <span className="font-bold tracking-widest uppercase text-white/50"
                                                style={{ fontSize: 9, fontFamily: 'var(--font-logo)', letterSpacing: '0.15em' }}>
                                                Tasks
                                            </span>
                                            <div className="flex-1 h-px"
                                                style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.25), transparent)' }} />
                                        </div>

                                        {/* TodoList */}
                                        <div style={{ minHeight: 220 }}>
                                            <TodoList />
                                        </div>
                                    </div>

                                    {/* ── Bottom brand watermark ── */}
                                    <div className="flex items-center justify-center gap-1.5 py-3"
                                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div className="w-3.5 h-3.5 rounded-md flex items-center justify-center"
                                            style={{
                                                background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                                                boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                                            }}>
                                            <span className="text-white font-black"
                                                style={{ fontSize: 7.5, fontFamily: 'var(--font-logo)' }}>N</span>
                                        </div>
                                        <span className="font-bold"
                                            style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-logo)', letterSpacing: '0.22em' }}>
                                            NAPLET
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Habits – its own card */}
                            <Card style={{ minHeight: 110, flexShrink: 0 }}>
                                <HabitTracker />
                            </Card>
                        </div>
                    </div>
                </div>
                </>}

            </div>
        </div>
    );
}

export default Dashboard;
