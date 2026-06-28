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

// ── Week-view helpers ──────────────────────────────────────────────
const DAY_START_HOUR = 6;   // 6 AM
const DAY_END_HOUR   = 23;  // 11 PM (inclusive)
const HOUR_PX         = 52; // height of one hour row

const parseDateKey = (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
};

const dateToKey = (d) => toDateKey(d.getFullYear(), d.getMonth(), d.getDate());

// Returns array of 7 dateKeys (Sun → Sat) for the week containing dateKey
const getWeekDates = (dateKey) => {
    const d        = parseDateKey(dateKey);
    const sunday   = addDays(d, -d.getDay());
    return Array.from({ length: 7 }, (_, i) => dateToKey(addDays(sunday, i)));
};

const formatWeekRange = (weekDates) => {
    const start = parseDateKey(weekDates[0]);
    const end   = parseDateKey(weekDates[6]);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr   = end.toLocaleDateString('en-US', {
        month: start.getMonth() === end.getMonth() ? undefined : 'short', day: 'numeric',
    });
    return `${startStr} – ${endStr}`;
};

const timeToMinutes = (time) => {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
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

// ── WeekView – Google-Calendar-style time grid ─────────────────────
const WEEK_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function WeekView({
    weekDates, todayKey, selectedDate, setSelectedDate, eventsForDate,
    onSlotClick, onDeleteEvent, nowMinutes,
}) {
    const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
    const gridHeight = hours.length * HOUR_PX;

    const formatHourLabel = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12} ${period}`;
    };

    const nowTopPx = (nowMinutes / 60 - DAY_START_HOUR) * HOUR_PX;
    const nowVisible = nowMinutes >= DAY_START_HOUR * 60 && nowMinutes <= (DAY_END_HOUR + 1) * 60;

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Day headers */}
            <div className="flex-shrink-0 flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: 52 }} className="flex-shrink-0" />
                {weekDates.map((dk, i) => {
                    const isToday    = dk === todayKey;
                    const isSelected = dk === selectedDate;
                    const d = parseDateKey(dk);
                    return (
                        <button key={dk}
                            onClick={() => setSelectedDate(dk)}
                            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
                            style={{
                                background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                                borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            <span className="font-bold tracking-wide" style={{ fontSize: 9, color: isToday ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
                                {WEEK_DAY_LABELS[i]}
                            </span>
                            <span className="w-6 h-6 flex items-center justify-center rounded-full font-bold"
                                style={{
                                    fontSize: 12,
                                    color: isToday ? '#fff' : 'rgba(255,255,255,0.65)',
                                    background: isToday ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
                                    boxShadow: isToday ? '0 0 10px rgba(99,102,241,0.6)' : 'none',
                                }}>
                                {d.getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Scrollable time grid */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex relative" style={{ height: gridHeight }}>
                    {/* Hour labels column */}
                    <div className="flex-shrink-0 relative" style={{ width: 52 }}>
                        {hours.map(h => (
                            <div key={h} className="absolute right-1.5 text-right"
                                style={{ top: (h - DAY_START_HOUR) * HOUR_PX - 6, fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                                {formatHourLabel(h)}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {weekDates.map((dk, dayIdx) => {
                        const isToday   = dk === todayKey;
                        const dayEvents = eventsForDate(dk);
                        const timedEvents   = dayEvents.filter(e => e.time);
                        const allDayEvents  = dayEvents.filter(e => !e.time);

                        return (
                            <div key={dk} className="flex-1 relative"
                                style={{
                                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                                    background: isToday ? 'rgba(99,102,241,0.04)' : 'transparent',
                                }}
                            >
                                {/* All-day chips, stacked at top inside the column */}
                                {allDayEvents.length > 0 && (
                                    <div className="absolute left-0.5 right-0.5 top-0.5 flex flex-col gap-0.5 z-10">
                                        {allDayEvents.slice(0, 2).map(ev => (
                                            <div key={ev.id}
                                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                                                title={`${ev.title} (click to remove)`}
                                                className="truncate rounded px-1 cursor-pointer"
                                                style={{ fontSize: 8.5, lineHeight: '14px', background: `${ev.color}33`, color: ev.color, border: `1px solid ${ev.color}55` }}>
                                                {ev.title}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Hour slot click targets */}
                                {hours.map(h => (
                                    <div key={h}
                                        onClick={() => onSlotClick(dk, h)}
                                        className="absolute left-0 right-0 cursor-pointer hover:bg-white/[0.03] transition-colors"
                                        style={{ top: (h - DAY_START_HOUR) * HOUR_PX, height: HOUR_PX, borderTop: '1px solid rgba(255,255,255,0.035)' }}
                                    />
                                ))}

                                {/* Timed event blocks */}
                                {timedEvents.map(ev => {
                                    const mins = timeToMinutes(ev.time);
                                    if (mins === null) return null;
                                    const top = (mins / 60 - DAY_START_HOUR) * HOUR_PX;
                                    if (top < -HOUR_PX || top > gridHeight) return null;
                                    return (
                                        <div key={ev.id}
                                            onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                                            title={`${ev.title} · ${ev.time} (click to remove)`}
                                            className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] z-10"
                                            style={{
                                                top: Math.max(0, top), height: Math.min(HOUR_PX - 4, gridHeight - top),
                                                minHeight: 20,
                                                background: `linear-gradient(135deg, ${ev.color}40, ${ev.color}1f)`,
                                                borderLeft: `2.5px solid ${ev.color}`,
                                                boxShadow: `0 0 8px ${ev.color}30`,
                                            }}>
                                            <p className="text-white font-semibold truncate" style={{ fontSize: 10 }}>{ev.title}</p>
                                            <p className="truncate" style={{ fontSize: 8, color: ev.color, opacity: 0.85 }}>{ev.time}</p>
                                        </div>
                                    );
                                })}

                                {/* Current-time indicator line */}
                                {isToday && nowVisible && (
                                    <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                        style={{ top: nowTopPx }}>
                                        <div className="rounded-full flex-shrink-0"
                                            style={{ width: 7, height: 7, marginLeft: -3.5, background: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }} />
                                        <div className="flex-1" style={{ height: 1.5, background: '#f43f5e', boxShadow: '0 0 4px #f43f5e' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
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

    // ── Week-view slot popup state ──
    const [weekSlot, setWeekSlot]       = useState(null); // { date, hour } | null
    const [weekTitle, setWeekTitle]     = useState('');
    const [weekColor, setWeekColor]     = useState(EVENT_COLORS[0]);
    const [weekSaving, setWeekSaving]   = useState(false);
    const [nowMinutes, setNowMinutes]   = useState(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    });
    const weekInputRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        loadEvents(user.id).then(ev => { setEvents(ev); setEventsLoading(false); });
    }, [user]);

    useEffect(() => {
        if (showAddForm && inputRef.current) inputRef.current.focus();
    }, [showAddForm]);

    useEffect(() => {
        if (weekSlot && weekInputRef.current) weekInputRef.current.focus();
    }, [weekSlot]);

    // Live "current time" ticker for the red indicator line
    useEffect(() => {
        const id = setInterval(() => {
            const n = new Date();
            setNowMinutes(n.getHours() * 60 + n.getMinutes());
        }, 60 * 1000);
        return () => clearInterval(id);
    }, []);

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

    const handleSlotClick = (date, hour) => {
        setWeekSlot({ date, hour });
        setWeekTitle('');
        setWeekColor(EVENT_COLORS[0]);
    };

    const handleAddWeekEvent = async () => {
        if (!weekTitle.trim() || !user || !weekSlot) return;
        setWeekSaving(true);
        const time = `${String(weekSlot.hour).padStart(2, '0')}:00`;
        const ev = await addEvent(user.id, { title: weekTitle.trim(), date: weekSlot.date, color: weekColor, time });
        setEvents(prev => [...prev, ev]);
        setWeekTitle(''); setWeekSaving(false); setWeekSlot(null);
    };

    if (eventsLoading) return <CalendarSkeleton />;

    const eventsForDate  = (dk) => events.filter(e => e.date === dk);
    const selectedEvents = eventsForDate(selectedDate);
    const weekDates      = getWeekDates(selectedDate);

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
    // Two-column layout: narrow month calendar + quick list on the left,
    // a Google-Calendar-style weekly time grid on the right.
    return (
        <div className="h-full w-full flex overflow-hidden select-none relative"
            style={{
                background: 'linear-gradient(180deg, #08080f 0%, #0b0b18 100%)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {/* ── LEFT: month calendar + quick list ── */}
            <div className="flex flex-col flex-shrink-0 h-full overflow-hidden"
                style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.06)' }}>

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

                {/* Full event panel (quick list for the selected day) */}
                <FullEventPanel {...sharedProps} events={events} />
            </div>

            {/* ── RIGHT: weekly time-grid view ── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">

                {/* Week header bar */}
                <div className="flex-shrink-0 flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-3.5 rounded-full"
                            style={{ background: 'linear-gradient(180deg, #6366f1, #7c3aed)' }} />
                        <span className="text-white/80 font-bold" style={{ fontSize: 13, fontFamily: 'var(--font-logo)' }}>
                            {formatWeekRange(weekDates)}
                        </span>
                    </div>
                    <button onClick={() => setSelectedDate(todayKey)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all"
                        style={{
                            background: 'rgba(99,102,241,0.12)', color: '#a78bfa',
                            border: '1px solid rgba(99,102,241,0.25)',
                        }}>
                        Today
                    </button>
                </div>

                <WeekView
                    weekDates={weekDates}
                    todayKey={todayKey}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    eventsForDate={eventsForDate}
                    onSlotClick={handleSlotClick}
                    onDeleteEvent={handleDeleteEvent}
                    nowMinutes={nowMinutes}
                />
            </div>

            {/* ── Slot-click "add event" popup ── */}
            {weekSlot && (
                <div className="absolute inset-0 z-30 flex items-center justify-center"
                    style={{ background: 'rgba(3,3,8,0.55)' }}
                    onClick={() => setWeekSlot(null)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                        className="flex flex-col gap-3 rounded-2xl p-4"
                        style={{
                            width: 280,
                            background: 'linear-gradient(180deg, #100f1c, #0a0a14)',
                            border: '1px solid rgba(99,102,241,0.25)',
                            boxShadow: '0 0 40px rgba(99,102,241,0.18), 0 12px 32px rgba(0,0,0,0.6)',
                        }}>
                        <div className="flex items-center justify-between">
                            <span className="text-white/80 font-bold" style={{ fontSize: 12 }}>
                                New event · {formatShort(weekSlot.date)} at {(() => {
                                    const h = weekSlot.hour;
                                    const period = h >= 12 ? 'PM' : 'AM';
                                    const h12 = h % 12 === 0 ? 12 : h % 12;
                                    return `${h12}:00 ${period}`;
                                })()}
                            </span>
                            <button onClick={() => setWeekSlot(null)} className="text-white/30 hover:text-white/70 transition-all">
                                <CloseIcon />
                            </button>
                        </div>

                        <input ref={weekInputRef} type="text" value={weekTitle}
                            onChange={e => setWeekTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddWeekEvent()}
                            placeholder="Event title..."
                            className="w-full rounded-lg px-3 py-2 bg-transparent text-white placeholder-white/20 focus:outline-none"
                            style={{ fontSize: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} />

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5 items-center">
                                {EVENT_COLORS.map(c => (
                                    <button key={c} onClick={() => setWeekColor(c)} className="rounded-full transition-all"
                                        style={{
                                            width: weekColor === c ? 14 : 11, height: weekColor === c ? 14 : 11,
                                            backgroundColor: c,
                                            boxShadow: weekColor === c ? `0 0 8px ${c}` : 'none',
                                            opacity: weekColor === c ? 1 : 0.45,
                                        }} />
                                ))}
                            </div>
                            <button onClick={handleAddWeekEvent} disabled={weekSaving || !weekTitle.trim()}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all disabled:opacity-30"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}>
                                {weekSaving ? 'Saving…' : 'Add Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
