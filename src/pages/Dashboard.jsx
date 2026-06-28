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
import Beams from '../components/Beams';
import FocusPage from './FocusPage';
import GoalsPage from './GoalsPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import JournalPage from './JournalPage';
import ChatPage from './ChatPage';
import AIWelcomeCard from '../features/AIWelcomecard';
import { useSettings } from '../context/settingsContext';


// ── Full-page skeleton shown while Clerk resolves the user ─────────
function DashboardSkeleton() {
    return (
        <div className="flex h-dvh w-screen overflow-hidden dashboard-bg">
            <div className="hidden md:flex relative z-10 flex-col items-center py-5 gap-3 flex-shrink-0"
                style={{ width: 56, background: 'rgba(6,10,28,0.70)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton rounded-xl" style={{ width: 36, height: 36 }} />
                ))}
                <div className="mt-auto skeleton rounded-full" style={{ width: 36, height: 36 }} />
            </div>
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
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
                <div className="flex flex-col items-center py-1.5 gap-2">
                    <div className="skeleton rounded-xl" style={{ width: 320, height: 36 }} />
                    <div className="skeleton rounded-md" style={{ width: 180, height: 11 }} />
                </div>
                <div className="flex-1 px-4 pb-4 grid gap-3 min-h-0"
                    style={{ gridTemplateColumns: 'minmax(0,200px) minmax(0,1fr) minmax(0,260px)' }}>
                    <div className="flex flex-col gap-3">
                        <div className="glass p-4" style={{ flexShrink: 0, height: 90 }} />
                        <div className="glass flex-1" style={{ minHeight: 0 }} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="glass flex-1" style={{ minHeight: 0 }} />
                        <div className="glass" style={{ height: 140, flexShrink: 0 }} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="glass flex-1" style={{ minHeight: 0 }} />
                        <div className="glass" style={{ height: 110, flexShrink: 0 }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Section card wrapper ───────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
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
            <div className="absolute pointer-events-none" style={{
                top: -15, right: -15, width: 120, height: 120,
                background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
            }} />
            <div className="absolute pointer-events-none" style={{
                bottom: -20, left: -10, width: 100, height: 100,
                background: 'radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
            }} />
            <div className="flex-shrink-0 relative" style={{ height: 2, zIndex: 1 }}>
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, #4338ca 20%, #7c3aed 50%, #6366f1 80%, transparent 100%)' }} />
                <div className="absolute inset-x-0 top-0"
                    style={{ height: 10, background: 'linear-gradient(180deg, rgba(99,102,241,0.35) 0%, transparent 100%)', transform: 'translateY(-2px)' }} />
            </div>
            <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}

// ── Inner page header bar ─────────────────────────────────────────
function PageHeader({ title, onBack }) {
    return (
        <div className="px-5 py-3 flex-shrink-0 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={onBack}
                className="flex items-center gap-1.5 text-white/35 hover:text-white/70 transition-colors text-xs font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Home
            </button>
            <span className="text-white/15 text-xs">/</span>
            <span className="text-white/60 text-xs font-semibold capitalize">{title}</span>
        </div>
    );
}

// ── Dashboard ──────────────────────────────────────────────────────
function Dashboard() {
    const { user, isLoaded } = useUser();
    const { signOut }        = useClerk();
    const navigate           = useNavigate();
    const { settings }       = useSettings();
    const [activePage, setActivePage] = useState('home');

    const habits  = [];
    const moods   = [];
    const todos   = [];
    const weather = null;

    const handleBackToLogin = async () => {
        await signOut();
        navigate('/login');
    };

    if (!isLoaded) return <DashboardSkeleton />;

    const displayName = user?.unsafeMetadata?.username || user?.firstName || 'there';

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

    const dayLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
    });

    const isInnerPage = activePage !== 'home';

    return (
        <div className={`flex h-dvh w-screen overflow-hidden dashboard-bg${settings.compactMode ? ' naplet-compact' : ''}`}>

            {/* Beams background */}
            <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                <Beams beamWidth={2} beamHeight={15} beamNumber={12} lightColor="#ffffff" speed={2} noiseIntensity={1.75} scale={0.2} rotation={0} />
            </div>

            {/* Sidebar */}
            <Sidebar activePage={activePage} onNav={setActivePage} />

            {/* Main */}
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-w-0 pb-16 md:pb-0">

                {/* Top bar */}
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

                {/* ── Inner pages ── */}
                {isInnerPage && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <PageHeader title={activePage} onBack={() => setActivePage('home')} />
                        <div className="flex-1 flex overflow-hidden min-h-0">
                            {activePage === 'calendar'  && <Calendar embedded={false} />}
                            {activePage === 'journal'   && <JournalPage />}
                            {activePage === 'chat'      && <ChatPage />}
                            {activePage === 'focus'     && <FocusPage />}
                            {activePage === 'goals'     && <GoalsPage />}
                            {activePage === 'analytics' && <AnalyticsPage />}
                            {activePage === 'settings'  && <SettingsPage />}
                        </div>
                    </div>
                )}

                {/* ── Home ── */}
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
                                    <div className="px-4 pb-4"><Mood /></div>
                                </Card>
                                <div className="card-lift flex-1 min-h-0 dash-weather-card"><Weather /></div>
                            </div>

                            {/* ── CENTER COLUMN ── */}
                            <div className="flex flex-col gap-3 min-h-0 dash-col">
                                <div className="flex-1 min-h-0 dash-ai-card flex flex-col">
                                    <AIWelcomeCard firstName={displayName} habits={habits} moods={moods} todos={todos} weather={weather} />
                                </div>
                                <Card style={{ height: 155, flexShrink: 0, padding: 0 }}>
                                    <NotesWidget />
                                </Card>
                            </div>

                            {/* ── RIGHT COLUMN ── */}
                            <div className="flex flex-col gap-3 min-h-0 dash-col">
                                <div className="naplet-card flex-1 min-h-0 flex flex-col relative dash-calendar-card"
                                    style={{
                                        background: 'rgba(6,4,13,0.62)',
                                        backdropFilter: 'blur(14px)',
                                        WebkitBackdropFilter: 'blur(14px)',
                                        borderRadius: 20,
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderTop: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: `0 0 0 1px rgba(79,70,229,0.06),0 4px 24px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.04)`,
                                        overflow: 'hidden',
                                    }}>
                                    <div className="absolute pointer-events-none" style={{ top:-20,right:-20,width:160,height:160,background:'radial-gradient(circle,rgba(109,40,217,0.07) 0%,transparent 70%)',borderRadius:'50%' }} />
                                    <div className="absolute pointer-events-none" style={{ bottom:-30,left:-20,width:130,height:130,background:'radial-gradient(circle,rgba(79,70,229,0.04) 0%,transparent 70%)',borderRadius:'50%' }} />
                                    <div className="flex-shrink-0 relative overflow-hidden" style={{ height: 2 }}>
                                        <div className="absolute inset-0" style={{ background:'linear-gradient(90deg,transparent 0%,#4338ca 20%,#7c3aed 50%,#6366f1 80%,transparent 100%)' }} />
                                        <div className="absolute inset-x-0 top-0" style={{ height:12,background:'linear-gradient(180deg,rgba(99,102,241,0.4) 0%,transparent 100%)',transform:'translateY(-2px)' }} />
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10" style={{ scrollbarWidth:'none' }}>
                                        <Calendar embedded />
                                        <div style={{ background:`linear-gradient(180deg,rgba(99,102,241,0.06) 0%,rgba(79,70,229,0.03) 40%,transparent 100%)`,borderTop:'1px solid rgba(99,102,241,0.12)',position:'relative' }}>
                                            <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height:30,background:'linear-gradient(180deg,rgba(99,102,241,0.08) 0%,transparent 100%)' }} />
                                            <div className="px-4 pt-3 pb-1 flex items-center gap-2 relative">
                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'linear-gradient(135deg,#a78bfa,#6366f1)',boxShadow:'0 0 6px rgba(167,139,250,0.6)' }} />
                                                <span className="font-bold tracking-widest uppercase text-white/50" style={{ fontSize:9,fontFamily:'var(--font-logo)',letterSpacing:'0.15em' }}>Tasks</span>
                                                <div className="flex-1 h-px" style={{ background:'linear-gradient(90deg,rgba(99,102,241,0.25),transparent)' }} />
                                            </div>
                                            <div style={{ minHeight: 220 }}><TodoList /></div>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                                            <div className="w-3.5 h-3.5 rounded-md flex items-center justify-center" style={{ background:'linear-gradient(135deg,#4f46e5,#6d28d9)',boxShadow:'0 0 8px rgba(99,102,241,0.5)' }}>
                                                <span className="text-white font-black" style={{ fontSize:7.5,fontFamily:'var(--font-logo)' }}>N</span>
                                            </div>
                                            <span className="font-bold" style={{ fontSize:7.5,color:'rgba(255,255,255,0.15)',fontFamily:'var(--font-logo)',letterSpacing:'0.22em' }}>NAPLET</span>
                                        </div>
                                    </div>
                                </div>
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
