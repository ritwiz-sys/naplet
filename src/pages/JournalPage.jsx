import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/react';
import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ── Icons ──────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
);
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const MOOD_TAGS = [
    { id: 'happy',      emoji: '😊', color: '#fbbf24' },
    { id: 'reflective', emoji: '🤔', color: '#60a5fa' },
    { id: 'motivated',  emoji: '🔥', color: '#f87171' },
    { id: 'calm',       emoji: '😌', color: '#34d399' },
    { id: 'tired',      emoji: '😴', color: '#94a3b8' },
    { id: 'grateful',   emoji: '🙏', color: '#a78bfa' },
];

const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getPreview = (content = '') =>
    content.replace(/\n/g, ' ').trim().slice(0, 80) + (content.trim().length > 80 ? '…' : '');

const wordCount = (text = '') =>
    text.trim() ? text.trim().split(/\s+/).length : 0;

// ── Entry list item ───────────────────────────────────────────────
function EntryItem({ entry, isActive, onClick, onDelete }) {
    const mood = MOOD_TAGS.find(m => m.id === entry.mood);
    return (
        <div
            onClick={onClick}
            className="group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150"
            style={isActive ? {
                background: 'linear-gradient(135deg,rgba(79,70,229,0.18),rgba(109,40,217,0.12))',
                border: '1px solid rgba(99,102,241,0.35)',
            } : {
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {/* Active left accent */}
            {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg,transparent,#a78bfa,transparent)' }} />
            )}

            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    {/* Date + mood */}
                    <div className="flex items-center gap-1.5 mb-1">
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 600 }}>
                            {formatDate(entry.createdAt)}
                        </span>
                        {mood && <span style={{ fontSize: 11 }}>{mood.emoji}</span>}
                    </div>
                    {/* Preview */}
                    <p style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.60)',
                        lineHeight: 1.45, wordBreak: 'break-word',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {getPreview(entry.content) || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Empty entry</span>}
                    </p>
                    {/* Word count */}
                    {entry.content && (
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 3, display: 'block' }}>
                            {wordCount(entry.content)} words
                        </span>
                    )}
                </div>
                <button
                    onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-all"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export default function JournalPage() {
    const { user } = useUser();

    const [entries,   setEntries]   = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [activeId,  setActiveId]  = useState(null);
    const [draft,     setDraft]     = useState('');
    const [activeMood,setActiveMood]= useState(null);
    const [saving,    setSaving]    = useState(false);
    const [saved,     setSaved]     = useState(false);
    const [search,    setSearch]    = useState('');

    const textareaRef = useRef(null);
    const saveTimer   = useRef(null);

    // Load entries
    useEffect(() => {
        if (!user) return;
        getDocs(collection(db, 'users', user.id, 'journal')).then(snap => {
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setEntries(data);
            if (data.length > 0) {
                setActiveId(data[0].id);
                setDraft(data[0].content || '');
                setActiveMood(data[0].mood || null);
            }
            setLoading(false);
        });
    }, [user]);

    // Auto-save on draft/mood change
    useEffect(() => {
        if (!user || loading) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setSaved(false);

        saveTimer.current = setTimeout(async () => {
            setSaving(true);
            try {
                if (activeId) {
                    await updateDoc(doc(db, 'users', user.id, 'journal', activeId), {
                        content: draft,
                        mood: activeMood || null,
                        updatedAt: serverTimestamp(),
                    });
                    setEntries(prev => prev.map(e =>
                        e.id === activeId ? { ...e, content: draft, mood: activeMood || null } : e
                    ));
                } else if (draft.trim()) {
                    const ref = await addDoc(collection(db, 'users', user.id, 'journal'), {
                        content: draft,
                        mood: activeMood || null,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                    const newEntry = { id: ref.id, content: draft, mood: activeMood || null };
                    setActiveId(ref.id);
                    setEntries(prev => [newEntry, ...prev]);
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } finally {
                setSaving(false);
            }
        }, 900);

        return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, activeMood]);

    const newEntry = () => {
        setActiveId(null);
        setDraft('');
        setActiveMood(null);
        setSaved(false);
        setTimeout(() => textareaRef.current?.focus(), 60);
    };

    const openEntry = (entry) => {
        setActiveId(entry.id);
        setDraft(entry.content || '');
        setActiveMood(entry.mood || null);
        setSaved(false);
        setTimeout(() => textareaRef.current?.focus(), 60);
    };

    const deleteEntry = async (id) => {
        await deleteDoc(doc(db, 'users', user.id, 'journal', id));
        setEntries(prev => prev.filter(e => e.id !== id));
        if (id === activeId) newEntry();
    };

    const filteredEntries = entries.filter(e =>
        !search || (e.content || '').toLowerCase().includes(search.toLowerCase())
    );

    const activeEntry = entries.find(e => e.id === activeId);
    const words = wordCount(draft);
    const chars = draft.length;

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2px solid rgba(99,102,241,0.2)',
                borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    );

    return (
        <div className="flex-1 flex overflow-hidden min-h-0">

            {/* ── LEFT PANEL: Entry list ─────────────────────────────── */}
            <div className="flex-shrink-0 flex flex-col border-r"
                style={{
                    width: 240,
                    background: 'rgba(4,3,12,0.60)',
                    borderColor: 'rgba(255,255,255,0.05)',
                }}>

                {/* Panel header */}
                <div className="px-4 pt-4 pb-3 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 style={{ color: 'white', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-logo)', lineHeight: 1 }}>
                                Journal
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 2 }}>
                                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                            </p>
                        </div>
                        <button onClick={newEntry}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                            style={{
                                background: 'linear-gradient(135deg,rgba(79,70,229,0.35),rgba(109,40,217,0.25))',
                                border: '1px solid rgba(99,102,241,0.35)',
                                color: '#c4b5fd',
                                boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                            }}
                            title="New entry"
                        >
                            <PlusIcon />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search entries…"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 10,
                                padding: '6px 10px 6px 30px',
                                color: 'rgba(255,255,255,0.75)',
                                fontSize: 11,
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />

                {/* Entry list */}
                <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5" style={{ scrollbarWidth: 'none' }}>
                    {filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: 'rgba(99,102,241,0.08)',
                                border: '1px solid rgba(99,102,241,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, textAlign: 'center' }}>
                                {search ? 'No entries found' : 'No entries yet.\nClick + to start writing.'}
                            </p>
                        </div>
                    ) : (
                        filteredEntries.map(entry => (
                            <EntryItem
                                key={entry.id}
                                entry={entry}
                                isActive={entry.id === activeId}
                                onClick={() => openEntry(entry)}
                                onDelete={deleteEntry}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL: Editor ───────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden"
                style={{ background: 'rgba(5,4,14,0.55)' }}>

                {/* Editor toolbar */}
                <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

                    {/* Entry meta */}
                    <div className="flex items-center gap-3">
                        {activeEntry?.createdAt ? (
                            <div className="flex flex-col gap-0.5">
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                                    {formatDate(activeEntry.createdAt)}
                                </span>
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>
                                    {formatTime(activeEntry.createdAt)}
                                </span>
                            </div>
                        ) : (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                                New entry
                            </span>
                        )}
                    </div>

                    {/* Right side: mood tags + save indicator */}
                    <div className="flex items-center gap-3">
                        {/* Mood selector */}
                        <div className="flex items-center gap-1">
                            {MOOD_TAGS.map(m => (
                                <button key={m.id} onClick={() => setActiveMood(activeMood === m.id ? null : m.id)}
                                    title={m.id}
                                    className="transition-all rounded-full flex items-center justify-center"
                                    style={{
                                        width: activeMood === m.id ? 28 : 22,
                                        height: activeMood === m.id ? 28 : 22,
                                        fontSize: activeMood === m.id ? 16 : 13,
                                        background: activeMood === m.id ? `${m.color}22` : 'transparent',
                                        border: activeMood === m.id ? `1px solid ${m.color}55` : '1px solid transparent',
                                        boxShadow: activeMood === m.id ? `0 0 10px ${m.color}44` : 'none',
                                        opacity: activeMood && activeMood !== m.id ? 0.35 : 1,
                                    }}>
                                    {m.emoji}
                                </button>
                            ))}
                        </div>

                        {/* Save status */}
                        <div className="flex items-center gap-1.5" style={{ minWidth: 60, justifyContent: 'flex-end' }}>
                            {saving ? (
                                <>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: '#6366f1', animation: 'pulse 1s ease-in-out infinite',
                                    }} />
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Saving…</span>
                                </>
                            ) : saved ? (
                                <>
                                    <SaveIcon />
                                    <span style={{ fontSize: 10, color: '#34d399' }}>Saved</span>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Textarea */}
                <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        placeholder={`What's on your mind today?\n\nCapture your thoughts, reflections, and ideas here…`}
                        style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 400,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            color: 'rgba(255,255,255,0.80)',
                            fontSize: 15,
                            lineHeight: 1.8,
                            fontFamily: 'var(--font-body)',
                            caretColor: '#a78bfa',
                        }}
                    />
                </div>

                {/* Bottom status bar */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-4">
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)' }}>
                            {words} {words === 1 ? 'word' : 'words'}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)' }}>
                            {chars} chars
                        </span>
                    </div>

                    {/* Mood label */}
                    {activeMood && (() => {
                        const m = MOOD_TAGS.find(t => t.id === activeMood);
                        return m ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                                <span style={{ fontSize: 11 }}>{m.emoji}</span>
                                <span style={{ fontSize: 9, color: m.color, fontWeight: 600, textTransform: 'capitalize' }}>{m.id}</span>
                            </div>
                        ) : null;
                    })()}

                    {/* New entry shortcut hint */}
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>
                        Auto-saves as you type
                    </span>
                </div>
            </div>

            {/* Spin keyframe */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
            `}</style>
        </div>
    );
}
