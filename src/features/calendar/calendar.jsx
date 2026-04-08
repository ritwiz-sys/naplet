import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/react';
import { loadEvents, addEvent, deleteEvent } from './calendar-services';
import { CalendarSkeleton } from '../../components/Skeleton';

const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const EVENT_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];

const toDateKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const formatShort = (dateKey) => {
    if (!dateKey) return '';
    return new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
    });
};

// ── Icons ──────────────────────────────────────────────────────────
const ChevLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const ChevRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
);
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ── CalendarGrid – shared grid section ────────────────────────────
function CalendarGrid({ embedded, viewYear, viewMonth, todayKey, eventsForDate, selectedDate, handleDayClick }) {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    // In embedded mode cells are shorter so the full grid fits without clipping
    const cellPy = embedded ? 'py-1' : 'py-2';

    return (
        <div className={`flex-shrink-0 grid grid-cols-7 px-3 ${embedded ? 'gap-y-0.5' : 'gap-y-1'}`}>
            {Array.from({ length: totalCells }).map((_, i) => {
                const day      = i - firstDay + 1;
                const isValid  = day >= 1 && day <= daysInMonth;
                const dateKey  = isValid ? toDateKey(viewYear, viewMonth, day) : null;
                const isToday    = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const dayEvents  = isValid ? eventsForDate(dateKey) : [];

                return (
                    <div key={i}
                        onClick={() => isValid && handleDayClick(day)}
                        className={`relative flex flex-col items-center gap-0.5 ${cellPy} rounded-lg transition-all duration-150
                            ${!isValid ? 'pointer-events-none opacity-0' : 'cursor-pointer'}
                            ${isValid && !isToday && !isSelected ? 'hover:bg-white/4' : ''}
                        `}
                    >
                        <div className="w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200"
                            style={
                                isSelected && isToday ? {
                                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                    boxShadow: '0 0 12px rgba(99,102,241,0.7)',
                                } : isSelected ? {
                                    background: 'rgba(99,102,241,0.3)',
                                    boxShadow: '0 0 8px rgba(99,102,241,0.4)',
                                    border: '1px solid rgba(99,102,241,0.5)',
                                } : isToday ? {
                                    background: 'linear-gradient(135deg, #4f46e5cc, #6d28d9cc)',
                                    boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                                } : {}
                            }
                        >
                            <span style={{ fontSize: 11, fontWeight: isToday || isSelected ? 700 : 500 }}
                                className={isToday || isSelected ? 'text-white' : 'text-white/40'}>
                                {isValid ? day : ''}
                            </span>
                        </div>

                        {dayEvents.length > 0 && (
                            <div className="flex gap-px">
                                {dayEvents.slice(0, 3).map(ev => (
                                    <span key={ev.id} className="rounded-full"
                                        style={{ width: 4, height: 4, backgroundColor: ev.color, boxShadow: `0 0 4px ${ev.color}cc` }} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Embedded event mini-strip (compact, no expansion) ─────────────
function EmbeddedEventStrip({ selectedDate, todayKey, selectedEvents, showAddForm, setShowAddForm,
    newTitle, setNewTitle, newColor, setNewColor, newTime, setNewTime,
    handleAddEvent, saving, inputRef, handleDeleteEvent }) {
    return (
        <div className="flex-shrink-0 px-4 flex flex-col gap-1.5">
            {/* Strip header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-1 h-2.5 rounded-full"
                        style={{ background: 'linear-gradient(180deg, #6366f1, #7c3aed)' }} />
                    <span className="font-semibold text-white/60" style={{ fontSize: 10 }}>
                        {selectedDate === todayKey ? 'Today' : formatShort(selectedDate)}
                    </span>
                    {selectedEvents.length > 0 && (
                        <span className="font-bold rounded-full px-1.5 py-px"
                            style={{ fontSize: 8, background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                            {selectedEvents.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => { setShowAddForm(f => !f); setNewTitle(''); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold tracking-wide transition-all"
                    style={showAddForm
                        ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 9 }
                        : {
                            background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(109,40,217,0.3))',
                            color: '#c4b5fd', fontSize: 9,
                            border: '1px solid rgba(99,102,241,0.3)',
                        }
                    }
                >
                    {showAddForm ? <><CloseIcon /><span>Cancel</span></> : <><PlusIcon /><span>Add</span></>}
                </button>
            </div>

            {/* Mini add form */}
            {showAddForm && (
                <div className="flex flex-col gap-1.5 rounded-xl p-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <input ref={inputRef} type="text" value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                        placeholder="Event title..."
                        className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none"
                        style={{ fontSize: 11 }} />
                    <div className="flex items-center justify-between">
                        <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                            className="bg-transparent text-white/40 focus:outline-none" style={{ fontSize: 9 }} />
                        <div className="flex gap-1 items-center">
                            {EVENT_COLORS.map(c => (
                                <button key={c} onClick={() => setNewColor(c)} className="rounded-full transition-all"
                                    style={{
                                        width: newColor === c ? 12 : 9, height: newColor === c ? 12 : 9,
                                        backgroundColor: c,
                                        boxShadow: newColor === c ? `0 0 6px ${c}` : 'none',
                                        opacity: newColor === c ? 1 : 0.4,
                                    }} />
                            ))}
                        </div>
                        <button onClick={handleAddEvent} disabled={saving || !newTitle.trim()}
                            className="px-2 py-0.5 rounded-md font-bold text-white transition-all disabled:opacity-30"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', fontSize: 9 }}>
                            {saving ? '…' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {/* Selected day events – compact 1-line rows */}
            {!showAddForm && selectedEvents.length > 0 && (
                <div className="flex flex-col gap-0.5">
                    {selectedEvents.slice(0, 2).map(ev => (
                        <div key={ev.id}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1 group"
                            style={{
                                background: `linear-gradient(90deg, ${ev.color}10, transparent)`,
                                borderLeft: `2px solid ${ev.color}`,
                            }}>
                            <span className="flex-1 truncate text-white/75 font-medium" style={{ fontSize: 10 }}>{ev.title}</span>
                            {ev.time && <span style={{ fontSize: 8, color: ev.color, opacity: 0.7 }}>{ev.time}</span>}
                            <button onClick={() => handleDeleteEvent(ev.id)}
                                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Full event panel (standalone mode) ────────────────────────────
function FullEventPanel({ selectedDate, todayKey, selectedEvents, showAddForm, setShowAddForm,
    newTitle, setNewTitle, newColor, setNewColor, newTime, setNewTime,
    handleAddEvent, saving, inputRef, handleDeleteEvent, events }) {

    const upcomingEvents = events
        .filter(e => e.date >= todayKey)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4);

    return (
        <div className="flex-1 flex flex-col px-4 pb-3 gap-2 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className="w-1 h-3 rounded-full"
                        style={{ background: 'linear-gradient(180deg, #6366f1, #7c3aed)' }} />
                    <span className="font-semibold text-white/70" style={{ fontSize: 11 }}>
                        {selectedDate === todayKey ? 'Today' : formatShort(selectedDate)}
                    </span>
                    {selectedEvents.length > 0 && (
                        <span className="font-bold rounded-full px-1.5 py-px"
                            style={{ fontSize: 9, background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                            {selectedEvents.length}
                        </span>
                    )}
                </div>
                <button onClick={() => { setShowAddForm(f => !f); setNewTitle(''); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all"
                    style={showAddForm
                        ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                        : {
                            background: 'linear-gradient(135deg, rgba(79,70,229,0.35), rgba(109,40,217,0.35))',
                            color: '#c4b5fd',
                            border: '1px solid rgba(99,102,241,0.35)',
                            boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                        }
                    }
                >
                    {showAddForm ? <><CloseIcon /><span>Cancel</span></> : <><PlusIcon /><span>Add</span></>}
                </button>
            </div>

            {showAddForm && (
                <div className="flex flex-col gap-2 rounded-xl p-3 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <input ref={inputRef} type="text" value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                        placeholder="Event title..."
                        className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none"
                        style={{ fontSize: 12 }} />
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="flex items-center justify-between">
                        <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                            className="bg-transparent text-white/50 focus:outline-none" style={{ fontSize: 10 }} />
                        <div className="flex gap-1.5 items-center">
                            {EVENT_COLORS.map(c => (
                                <button key={c} onClick={() => setNewColor(c)} className="rounded-full transition-all"
                                    style={{
                                        width: newColor === c ? 14 : 11, height: newColor === c ? 14 : 11,
                                        backgroundColor: c,
                                        boxShadow: newColor === c ? `0 0 8px ${c}` : 'none',
                                        opacity: newColor === c ? 1 : 0.45,
                                    }} />
                            ))}
                        </div>
                    </div>
                    <button onClick={handleAddEvent} disabled={saving || !newTitle.trim()}
                        className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white transition-all disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}>
                        {saving ? 'Saving…' : 'Save Event'}
                    </button>
                </div>
            )}

            <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0 pr-0.5">
                {selectedEvents.length === 0 && !showAddForm ? (
                    upcomingEvents.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            <span className="font-bold tracking-widest uppercase"
                                style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>Upcoming</span>
                            {upcomingEvents.map(ev => (
                                <div key={ev.id}
                                    className="flex items-center gap-2.5 group transition-all rounded-lg px-2.5 py-1.5"
                                    style={{ background: 'rgba(255,255,255,0.025)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: ev.color, boxShadow: `0 0 5px ${ev.color}` }} />
                                    <span className="flex-1 truncate text-white/50 font-medium" style={{ fontSize: 11 }}>{ev.title}</span>
                                    <span className="text-white/20 flex-shrink-0" style={{ fontSize: 9 }}>{formatShort(ev.date)}</span>
                                    <button onClick={() => handleDeleteEvent(ev.id)}
                                        className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all flex-shrink-0">
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-2 gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <span className="text-white/20" style={{ fontSize: 10 }}>No events — tap + Add</span>
                        </div>
                    )
                ) : (
                    selectedEvents.map(ev => (
                        <div key={ev.id}
                            className="flex items-center justify-between rounded-xl px-3 py-2 group transition-all"
                            style={{
                                background: `linear-gradient(90deg, ${ev.color}12, rgba(255,255,255,0.02))`,
                                borderLeft: `2px solid ${ev.color}`,
                            }}>
                            <div className="min-w-0">
                                <p className="text-white/85 font-semibold leading-tight truncate" style={{ fontSize: 12 }}>{ev.title}</p>
                                {ev.time && <p className="font-medium mt-0.5" style={{ fontSize: 9, color: ev.color, opacity: 0.75 }}>{ev.time}</p>}
                            </div>
                            <button onClick={() => handleDeleteEvent(ev.id)}
                                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all ml-2 flex-shrink-0">
                                <TrashIcon />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Watermark – standalone only */}
            <div className="flex-shrink-0 flex items-center justify-center gap-1 pt-0.5">
                <div className="w-3 h-3 rounded-sm flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}>
                    <span className="text-white font-black" style={{ fontSize: 7, fontFamily: 'var(--font-logo)' }}>N</span>
                </div>
                <span className="font-bold tracking-widest" style={{ fontSize: 7, color: 'rgba(255,255,255,0.12)', fontFamily: 'var(--font-logo)', letterSpacing: '0.2em' }}>
                    NAPLET
                </span>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────
const Calendar = ({ embedded = false }) => {
    const { user } = useUser();
    const today    = new Date();
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const [viewYear, setViewYear]         = useState(today.getFullYear());
    const [viewMonth, setViewMonth]       = useState(today.getMonth());
    const [events, setEvents]             = useState([]);
    const [selectedDate, setSelectedDate] = useState(todayKey);
    const [showAddForm, setShowAddForm]   = useState(false);
    const [newTitle, setNewTitle]         = useState('');
    const [newColor, setNewColor]         = useState(EVENT_COLORS[0]);
    const [newTime, setNewTime]           = useState('');
    const [saving, setSaving]             = useState(false);
    const [eventsLoading, setEventsLoading] = useState(true);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        loadEvents(user.id).then(ev => { setEvents(ev); setEventsLoading(false); });
    }, [user]);

    useEffect(() => {
        if (showAddForm && inputRef.current) inputRef.current.focus();
    }, [showAddForm]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleDayClick = (day) => {
        setSelectedDate(toDateKey(viewYear, viewMonth, day));
        setShowAddForm(false);
        setNewTitle('');
    };

    const handleAddEvent = async () => {
        if (!newTitle.trim() || !user) return;
        setSaving(true);
        const ev = await addEvent(user.id, { title: newTitle.trim(), date: selectedDate, color: newColor, time: newTime || null });
        setEvents(prev => [...prev, ev]);
        setNewTitle(''); setNewTime(''); setShowAddForm(false); setSaving(false);
    };

    const handleDeleteEvent = async (id) => {
        if (!user) return;
        await deleteEvent(user.id, id);
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    if (eventsLoading) return <CalendarSkeleton />;

    const eventsForDate  = (dk) => events.filter(e => e.date === dk);
    const selectedEvents = eventsForDate(selectedDate);

    const sharedProps = {
        selectedDate, todayKey, selectedEvents, showAddForm, setShowAddForm,
        newTitle, setNewTitle, newColor, setNewColor, newTime, setNewTime,
        handleAddEvent, saving, inputRef, handleDeleteEvent,
    };

    const gridProps = {
        embedded, viewYear, viewMonth, todayKey,
        eventsForDate, selectedDate, handleDayClick,
    };

    // ── EMBEDDED MODE ──────────────────────────────────────────────
    // Grid is flex-shrink-0 so it never clips.
    // The event mini-strip is also flex-shrink-0.
    // Parent (Dashboard) gives the remaining space to the task list.
    if (embedded) {
        return (
            <div className="flex flex-col select-none relative">

                {/* ── Premium header zone with top glow ── */}
                <div className="relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, rgba(79,70,229,0.14) 0%, rgba(79,70,229,0.04) 70%, transparent 100%)',
                        paddingBottom: 6,
                    }}
                >
                    {/* Radial top bloom */}
                    <div className="absolute inset-x-0 top-0 pointer-events-none"
                        style={{
                            height: 60,
                            background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(99,102,241,0.22) 0%, transparent 100%)',
                        }} />

                    {/* Month nav */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-2 relative z-10">
                        <button onClick={prevMonth}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <ChevLeft />
                        </button>
                        <div className="flex flex-col items-center leading-none gap-0.5">
                            {/* Month name with subtle text glow */}
                            <span className="text-white font-bold"
                                style={{
                                    fontFamily: 'var(--font-logo)', fontSize: 18, letterSpacing: '-0.01em',
                                    textShadow: '0 0 30px rgba(139,92,246,0.6)',
                                }}>
                                {MONTHS[viewMonth]}
                            </span>
                            <span style={{ fontSize: 9, letterSpacing: '0.14em', color: 'rgba(167,139,250,0.5)', fontWeight: 700 }}>
                                {viewYear}
                            </span>
                        </div>
                        <button onClick={nextMonth}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <ChevRight />
                        </button>
                    </div>

                    {/* Day labels inside the shaded zone */}
                    <div className="grid grid-cols-7 px-3 pb-1 relative z-10">
                        {DAYS.map(d => (
                            <div key={d} className="text-center"
                                style={{ fontSize: 7.5, color: 'rgba(167,139,250,0.35)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Full grid – compact cells with subtle row shading */}
                <div className="relative"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%)' }}>
                    <CalendarGrid {...gridProps} />
                </div>

                {/* Divider with glow */}
                <div className="mx-4 mt-2 mb-1.5 relative">
                    <div className="h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.3), transparent)' }} />
                    <div className="absolute inset-x-0 -top-1 pointer-events-none"
                        style={{ height: 6, background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.06))' }} />
                </div>

                {/* Event mini-strip */}
                <EmbeddedEventStrip {...sharedProps} />
            </div>
        );
    }

    // ── STANDALONE MODE ────────────────────────────────────────────
    return (
        <div className="h-full flex flex-col overflow-hidden select-none"
            style={{
                background: 'linear-gradient(180deg, #08080f 0%, #0b0b18 100%)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {/* Brand stripe */}
            <div className="flex-shrink-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #4f46e5, #7c3aed, transparent)' }} />

            {/* Month nav */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-2">
                <button onClick={prevMonth}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-white/25 hover:text-white/70 hover:bg-white/6">
                    <ChevLeft />
                </button>
                <div className="flex flex-col items-center leading-none gap-0.5">
                    <span className="text-white font-bold"
                        style={{ fontFamily: 'var(--font-logo)', fontSize: 18, letterSpacing: '-0.01em' }}>
                        {MONTHS[viewMonth]}
                    </span>
                    <span className="text-white/25 font-semibold"
                        style={{ fontSize: 10, letterSpacing: '0.12em' }}>
                        {viewYear}
                    </span>
                </div>
                <button onClick={nextMonth}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-white/25 hover:text-white/70 hover:bg-white/6">
                    <ChevRight />
                </button>
            </div>

            {/* Day labels */}
            <div className="flex-shrink-0 grid grid-cols-7 px-3 pb-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center"
                        style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <CalendarGrid {...gridProps} />

            {/* Divider */}
            <div className="flex-shrink-0 mx-5 my-2 relative">
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="absolute left-0 top-0 h-px w-8"
                    style={{ background: 'linear-gradient(90deg, #6366f1, transparent)' }} />
            </div>

            {/* Full event panel */}
            <FullEventPanel {...sharedProps} events={events} />
        </div>
    );
};

export default Calendar;
