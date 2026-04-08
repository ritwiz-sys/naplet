import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/react';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { NotesSkeleton } from '../../components/Skeleton';

const db = getFirestore();

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
);
const ListIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5" />
        <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5" />
        <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5" />
    </svg>
);

// Format relative time for list view
const formatRelative = (entry) => {
    const ms = entry.createdAt?.toMillis?.();
    if (!ms) return '';
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    const hr  = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 2)   return 'just now';
    if (min < 60)  return `${min}m ago`;
    if (hr  < 24)  return `${hr}h ago`;
    return `${day}d ago`;
};

const NotesWidget = () => {
    const { user } = useUser();

    const [entries, setEntries]     = useState([]);
    const [activeId, setActiveId]   = useState(null);
    const [draftContent, setDraft]  = useState('');
    const [saving, setSaving]       = useState(false);
    const [loading, setLoading]     = useState(true);
    const [view, setView]           = useState('write');
    const [charCount, setCharCount] = useState(0);
    const textareaRef               = useRef(null);
    const saveTimer                 = useRef(null);

    // Load entries
    useEffect(() => {
        if (!user) return;
        getDocs(collection(db, 'users', user.id, 'journal')).then(snap => {
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const ta = a.createdAt?.toMillis?.() || 0;
                    const tb = b.createdAt?.toMillis?.() || 0;
                    return tb - ta;
                });
            setEntries(data);
            if (data.length > 0) {
                setActiveId(prev => prev ?? data[0].id);
                setDraft(prev => prev || data[0].content || '');
                setCharCount(prev => prev || (data[0].content || '').length);
            }
            setLoading(false);
        });
    }, [user]);

    // Auto-save on draft change
    useEffect(() => {
        if (!user || !draftContent) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            setSaving(true);
            try {
                if (activeId) {
                    await updateDoc(doc(db, 'users', user.id, 'journal', activeId), {
                        content: draftContent,
                    });
                    setEntries(prev => prev.map(e =>
                        e.id === activeId ? { ...e, content: draftContent } : e
                    ));
                } else {
                    const docRef = await addDoc(collection(db, 'users', user.id, 'journal'), {
                        content: draftContent,
                        title: draftContent.slice(0, 40),
                        createdAt: serverTimestamp(),
                    });
                    const newEntry = { id: docRef.id, content: draftContent, title: draftContent.slice(0, 40) };
                    setActiveId(docRef.id);
                    setEntries(prev => [newEntry, ...prev]);
                }
            } finally {
                setSaving(false);
            }
        }, 1000);
        return () => clearTimeout(saveTimer.current);
    }, [activeId, draftContent, user]);

    const newEntry = () => {
        setActiveId(null);
        setDraft('');
        setCharCount(0);
        setView('write');
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const openEntry = (entry) => {
        setActiveId(entry.id);
        setDraft(entry.content || '');
        setCharCount((entry.content || '').length);
        setView('write');
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const deleteEntry = async (id) => {
        await deleteDoc(doc(db, 'users', user.id, 'journal', id));
        setEntries(prev => prev.filter(e => e.id !== id));
        if (id === activeId) { setActiveId(null); setDraft(''); setCharCount(0); }
    };

    const handleDraftChange = (e) => {
        setDraft(e.target.value);
        setCharCount(e.target.value.length);
    };

    const preview = (entry) => {
        const text = entry.content || '';
        return text.slice(0, 55) + (text.length > 55 ? '…' : '');
    };

    if (loading) return <NotesSkeleton />;

    return (
        <div className="h-full flex flex-col px-4 py-3 gap-2 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-logo)' }}>
                        Journal
                    </h3>
                    {/* Saving indicator */}
                    {saving && (
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[9px] text-white/25">saving…</span>
                        </div>
                    )}
                    {!saving && activeId && view === 'write' && (
                        <span className="text-[9px] text-white/15">✓ saved</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {entries.length > 0 && (
                        <button
                            onClick={() => setView(v => v === 'list' ? 'write' : 'list')}
                            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                            style={view === 'list'
                                ? { background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }
                                : { color: 'rgba(255,255,255,0.3)' }
                            }
                        >
                            <ListIcon />
                        </button>
                    )}
                    <button
                        onClick={newEntry}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>

            {/* Write view */}
            {view === 'write' && (
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <textarea
                        ref={textareaRef}
                        value={draftContent}
                        onChange={handleDraftChange}
                        placeholder="Capture your thoughts here..."
                        className="flex-1 resize-none bg-transparent text-white/75 text-xs leading-relaxed placeholder-white/18 focus:outline-none min-h-0"
                        style={{ caretColor: '#a78bfa' }}
                    />
                    {/* Char count */}
                    {charCount > 0 && (
                        <div className="flex-shrink-0 flex justify-end">
                            <span className="text-[8px] text-white/15 font-medium">{charCount}</span>
                        </div>
                    )}
                </div>
            )}

            {/* List view */}
            {view === 'list' && (
                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
                    {entries.length === 0 ? (
                        <p className="text-white/20 text-[10px] text-center py-3">No entries yet</p>
                    ) : (
                        entries.map(entry => (
                            <div
                                key={entry.id}
                                onClick={() => openEntry(entry)}
                                className="group flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all"
                                style={entry.id === activeId
                                    ? {
                                        background: 'rgba(99,102,241,0.1)',
                                        borderLeft: '2px solid #6366f1',
                                        paddingLeft: 8,
                                    }
                                    : {
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }
                                }
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/65 text-[10px] leading-relaxed truncate">{preview(entry)}</p>
                                    <p className="text-white/20 text-[9px] mt-0.5">{formatRelative(entry)}</p>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotesWidget;
