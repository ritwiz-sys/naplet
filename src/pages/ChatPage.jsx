import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/react';
import {
    collection, addDoc, getDocs, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ── Icons ──────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const ChatBubbleIcon = ({ className = 'w-3.5 h-3.5' }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);
const SendIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
        <path d="M22 2L11 13" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.25)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={active ? '#a78bfa' : 'rgba(255,255,255,0.25)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function ThinkingDots() {
    return (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', height: 16 }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'rgba(167,139,250,0.7)', display: 'inline-block',
                    animation: `dot-bounce 1.2s ${i * 0.18}s ease-in-out infinite`,
                }} />
            ))}
        </span>
    );
}

const formatWhen = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Conversation list item ──────────────────────────────────────────
function ConvoItem({ convo, isActive, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150 flex items-start gap-2"
            style={isActive ? {
                background: 'linear-gradient(135deg,rgba(79,70,229,0.18),rgba(109,40,217,0.12))',
                border: '1px solid rgba(99,102,241,0.35)',
            } : {
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg,transparent,#a78bfa,transparent)' }} />
            )}
            <div className="mt-0.5 flex-shrink-0" style={{ color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.28)' }}>
                <ChatBubbleIcon />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)' }}>
                    {convo.title || 'New conversation'}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {formatWhen(convo.createdAt)}
                </p>
            </div>
        </div>
    );
}

// ── Main ChatPage ────────────────────────────────────────────────────
function ChatPage() {
    const { user } = useUser();
    const userId = user?.id;

    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId]            = useState(null);
    const [messages, setMessages]            = useState([]);
    const [input, setInput]                  = useState('');
    const [loading, setLoading]              = useState(false);
    const [loadingConvos, setLoadingConvos]  = useState(true);

    const inputRef    = useRef(null);
    const scrollRef   = useRef(null);

    // Load past conversations
    useEffect(() => {
        if (!userId) return;
        setLoadingConvos(true);
        getDocs(collection(db, 'users', userId, 'history_chats')).then(snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                    const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                    return bT - aT;
                });
            setConversations(list);
            setLoadingConvos(false);
        }).catch(() => setLoadingConvos(false));
    }, [userId]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const startNewChat = () => {
        setActiveId(null);
        setMessages([]);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const openConversation = (convo) => {
        setActiveId(convo.id);
        setMessages(convo.messages || []);
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading || !userId) return;

        setLoading(true);
        setInput('');

        const userMsg = { role: 'user', content: trimmed, timestamp: Date.now() };
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);

        let convoId = activeId;

        try {
            // Auto-create conversation on first message
            if (!convoId) {
                const title = trimmed.slice(0, 40);
                const ref = await addDoc(collection(db, 'users', userId, 'history_chats'), {
                    title,
                    createdAt: serverTimestamp(),
                    messages: nextMessages,
                });
                convoId = ref.id;
                setActiveId(convoId);
                setConversations(prev => [{ id: convoId, title, createdAt: { toDate: () => new Date() }, messages: nextMessages }, ...prev]);
            } else {
                await updateDoc(doc(db, 'users', userId, 'history_chats', convoId), {
                    messages: nextMessages,
                });
            }

            // Call AI via Express backend on Render
            const res = await fetch('https://naplet.onrender.com/api/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: trimmed }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to get a response');

            const aiMsg = { role: 'assistant', content: data.response || 'No response received.', timestamp: Date.now() };
            const withAi = [...nextMessages, aiMsg];
            setMessages(withAi);

            await updateDoc(doc(db, 'users', userId, 'history_chats', convoId), {
                messages: withAi,
            });
            setConversations(prev => prev.map(c => c.id === convoId ? { ...c, messages: withAi } : c));
        } catch (err) {
            const errMsg = { role: 'assistant', content: err?.message || 'Sorry, something went wrong. Please try again.', timestamp: Date.now() };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="flex flex-1 overflow-hidden min-h-0 w-full" style={{ padding: '0 16px 16px' }}>
            <style>{`
                @keyframes dot-bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40%           { transform: scale(1.1); opacity: 1; }
                }
                @keyframes response-fade-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ── Conversation sidebar ── */}
            <div className="naplet-card hidden sm:flex flex-col flex-shrink-0 mr-3"
                style={{
                    width: 220,
                    background: 'rgba(6,4,13,0.62)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 0 0 1px rgba(79,70,229,0.06), 0 4px 24px rgba(0,0,0,0.40)',
                    overflow: 'hidden',
                }}>
                <div style={{ padding: 12 }} className="flex-shrink-0">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl text-white text-xs font-semibold py-2 transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)', boxShadow: '0 0 14px rgba(99,102,241,0.30)' }}
                    >
                        <PlusIcon /> New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1.5" style={{ padding: '0 10px 10px' }}>
                    {loadingConvos && (
                        <p className="text-[11px] text-center mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading…</p>
                    )}
                    {!loadingConvos && conversations.length === 0 && (
                        <p className="text-[11px] text-center mt-4 px-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            No conversations yet. Start a new chat!
                        </p>
                    )}
                    {conversations.map(convo => (
                        <ConvoItem
                            key={convo.id}
                            convo={convo}
                            isActive={convo.id === activeId}
                            onClick={() => openConversation(convo)}
                        />
                    ))}
                </div>
            </div>

            {/* ── Chat interface ── */}
            <div className="naplet-card flex-1 flex flex-col relative min-w-0"
                style={{
                    minHeight: 0,
                    background: 'rgba(6,4,13,0.62)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 0 0 1px rgba(79,70,229,0.06), 0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)',
                    overflow: 'hidden',
                }}>

                {/* Ambient glow */}
                <div className="absolute pointer-events-none" style={{
                    top: -20, right: -20, width: 200, height: 200,
                    background: 'radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 70%)',
                    borderRadius: '50%',
                }} />

                {/* Accent stripe */}
                <div className="flex-shrink-0 relative" style={{ height: 2, zIndex: 2 }}>
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, #4338ca 20%, #7c3aed 50%, #6366f1 80%, transparent 100%)' }} />
                </div>

                {/* Mobile new-chat button */}
                <div className="sm:hidden flex-shrink-0 flex items-center justify-between px-3 py-2 relative" style={{ zIndex: 2 }}>
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {activeId ? (conversations.find(c => c.id === activeId)?.title || 'Chat') : 'New Chat'}
                    </span>
                    <button
                        onClick={startNewChat}
                        className="flex items-center gap-1 rounded-lg text-white text-[10px] font-semibold px-2.5 py-1.5"
                        style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)' }}
                    >
                        <PlusIcon /> New
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="relative flex-1 overflow-y-auto min-h-0" style={{ zIndex: 2, padding: '16px 18px' }}>
                    {!hasMessages && !loading && (
                        <div className="h-full flex flex-col items-center justify-center gap-3" style={{ opacity: 0.6 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'radial-gradient(circle at 35% 35%, rgba(160,120,255,0.85) 0%, rgba(80,60,220,0.55) 45%, transparent 100%)',
                                boxShadow: '0 0 30px 8px rgba(100,70,255,0.30)',
                                animation: 'float 4s ease-in-out infinite',
                            }} />
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', textAlign: 'center', lineHeight: 1.5 }}>
                                Start a new conversation<br />ask me anything
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        {messages.map((m, i) => (
                            <div key={i} className="flex items-start gap-2.5" style={{
                                animation: 'response-fade-in 0.2s ease-out both',
                                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                            }}>
                                <div className="flex-shrink-0" style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: m.role === 'user'
                                        ? 'linear-gradient(135deg, #334155, #1e293b)'
                                        : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                    boxShadow: '0 0 10px rgba(99,102,241,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginTop: 1,
                                }}>
                                    <span style={{ fontSize: 8, fontWeight: 900, color: 'white', fontFamily: 'var(--font-logo)' }}>
                                        {m.role === 'user' ? (user?.firstName?.[0] || 'U') : 'N'}
                                    </span>
                                </div>
                                <div style={{
                                    maxWidth: '72%',
                                    background: m.role === 'user' ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.04)',
                                    border: m.role === 'user' ? '1px solid rgba(99,102,241,0.22)' : '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                                    padding: '9px 13px',
                                }}>
                                    <p style={{
                                        fontSize: 13,
                                        color: 'rgba(255,255,255,0.85)',
                                        lineHeight: 1.65,
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}>
                                        {m.content}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-start gap-2.5" style={{ animation: 'response-fade-in 0.2s ease-out both' }}>
                                <div className="flex-shrink-0" style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                    boxShadow: '0 0 10px rgba(99,102,241,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginTop: 1,
                                }}>
                                    <span style={{ fontSize: 8, fontWeight: 900, color: 'white', fontFamily: 'var(--font-logo)' }}>N</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '4px 12px 12px 12px',
                                    padding: '8px 12px',
                                }}>
                                    <ThinkingDots />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input bar */}
                <div className="relative flex-shrink-0" style={{ zIndex: 2, padding: '12px 16px 16px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.045)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 12,
                        padding: '9px 10px 9px 14px',
                    }}>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Message Naplet…"
                            disabled={loading}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                fontSize: 13,
                                fontFamily: 'inherit',
                                caretColor: '#a78bfa',
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            style={{
                                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: input.trim() && !loading
                                    ? 'linear-gradient(135deg, #6d28d9, #4f46e5)'
                                    : 'rgba(255,255,255,0.05)',
                                border: 'none',
                                cursor: input.trim() && !loading ? 'pointer' : 'default',
                                boxShadow: input.trim() && !loading ? '0 0 14px rgba(99,102,241,0.35)' : 'none',
                            }}
                        >
                            <SendIcon active={!!input.trim() && !loading} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatPage;
