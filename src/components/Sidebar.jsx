import { useUser } from '@clerk/react';

// ── Icons ──────────────────────────────────────────────────────────
const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
    </svg>
);
const FocusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
    </svg>
);
const GoalsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="5"  />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
);
const AnalyticsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const NAV = [
    { id: 'home',      icon: <HomeIcon />,     label: 'Home'      },
    { id: 'focus',     icon: <FocusIcon />,    label: 'Focus'     },
    { id: 'goals',     icon: <GoalsIcon />,    label: 'Goals'     },
    { id: 'analytics', icon: <AnalyticsIcon />,label: 'Analytics' },
];

// ── Single nav button with slide-in tooltip ────────────────────────
function NavBtn({ item, isActive, onClick }) {
    return (
        <div className="relative group/tip">
            <button
                onClick={() => onClick(item.id)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                style={isActive ? {
                    background: 'linear-gradient(135deg,rgba(79,70,229,0.38),rgba(109,40,217,0.28))',
                    color: '#c4b5fd',
                    boxShadow: '0 0 18px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.10)',
                    border: '1px solid rgba(99,102,241,0.38)',
                } : {
                    color: 'rgba(255,255,255,0.22)',
                    border: '1px solid transparent',
                }}
            >
                {/* Left active bar */}
                {isActive && (
                    <div className="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: 'linear-gradient(180deg, transparent, #a78bfa, transparent)' }} />
                )}
                {item.icon}
            </button>

            {/* Tooltip */}
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                opacity-0 group-hover/tip:opacity-100 translate-x-2 group-hover/tip:translate-x-0
                transition-all duration-150 ease-out">
                <div className="px-2.5 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold"
                    style={{
                        background: 'rgba(8,6,20,0.96)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: 'rgba(255,255,255,0.88)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.55), 0 0 12px rgba(79,70,229,0.15)',
                        fontFamily: 'var(--font-ui)',
                    }}>
                    {item.label}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1.5"
                        style={{
                            width: 0, height: 0,
                            borderTop: '4px solid transparent',
                            borderBottom: '4px solid transparent',
                            borderRight: '6px solid rgba(99,102,241,0.3)',
                        }} />
                </div>
            </div>
        </div>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────
function Sidebar({ activePage = 'home', onNav }) {
    const { user } = useUser();
    // Prefer username set during signup, fallback to firstName/lastName
    const displayName = user?.unsafeMetadata?.username || user?.firstName;
    const initials = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

    return (
        <aside className="relative z-10 flex flex-col items-center py-4 flex-shrink-0"
            style={{
                width: 56,
                background: 'linear-gradient(180deg, rgba(12,10,24,0.94) 0%, rgba(7,7,16,0.90) 100%)',
                backdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(255,255,255,0.055)',
                boxShadow: '2px 0 24px rgba(0,0,0,0.45), inset -1px 0 0 rgba(99,102,241,0.07)',
            }}>

            {/* Brand monogram */}
            <div className="mb-4 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        boxShadow: '0 0 18px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
                    }}>
                    <span className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-logo)' }}>N</span>
                </div>
            </div>

            {/* Divider */}
            <div className="w-5 mb-3 flex-shrink-0"
                style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.3),transparent)' }} />

            {/* Main nav */}
            <nav className="flex flex-col items-center gap-1.5 flex-1">
                {NAV.map(item => (
                    <NavBtn key={item.id} item={item} isActive={activePage === item.id} onClick={onNav} />
                ))}
            </nav>

            {/* Divider */}
            <div className="w-5 my-2 flex-shrink-0"
                style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />

            {/* Settings */}
            <NavBtn
                item={{ id: 'settings', icon: <SettingsIcon />, label: 'Settings' }}
                isActive={activePage === 'settings'}
                onClick={onNav}
            />

            {/* Divider */}
            <div className="w-5 my-2 flex-shrink-0"
                style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />

            {/* User avatar */}
            <div className="relative group/av flex-shrink-0 mt-1">
                {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="avatar"
                        className="w-9 h-9 rounded-xl object-cover cursor-pointer"
                        style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.4)' }} />
                ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 0 2px rgba(99,102,241,0.4)' }}>
                        {initials}
                    </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: '#34d399', borderColor: '#07070f', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />

                {/* User tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 bottom-0 z-50
                    opacity-0 group-hover/av:opacity-100 translate-x-2 group-hover/av:translate-x-0
                    transition-all duration-150">
                    <div className="px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(8,6,20,0.96)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.55)' }}>
                        <p className="text-white/88 text-xs font-semibold whitespace-nowrap" style={{ fontFamily: 'var(--font-ui)' }}>
                            {displayName || user?.firstName || 'NAPLET User'}
                        </p>
                        <p className="text-white/35 text-[9px] mt-0.5 whitespace-nowrap">
                            {user?.primaryEmailAddress?.emailAddress || 'NAPLET user'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
