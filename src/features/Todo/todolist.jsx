import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/react';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const db = getFirestore();

// Priority config: 1 = highest, 5 = lowest
const PRIORITY = {
    1: { label: 'P1', color: '#ef4444', glow: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.12)'  },
    2: { label: 'P2', color: '#f97316', glow: 'rgba(249,115,22,0.4)',  bg: 'rgba(249,115,22,0.12)' },
    3: { label: 'P3', color: '#eab308', glow: 'rgba(234,179,8,0.4)',   bg: 'rgba(234,179,8,0.12)'  },
    4: { label: 'P4', color: '#22d3ee', glow: 'rgba(34,211,238,0.4)',  bg: 'rgba(34,211,238,0.12)' },
    5: { label: 'P5', color: '#6366f1', glow: 'rgba(99,102,241,0.4)',  bg: 'rgba(99,102,241,0.12)' },
};

// ── Icons ──────────────────────────────────────────────────────────
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
        <polyline points="20 6 9 17 4 12" />
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

// ── Todo Card ──────────────────────────────────────────────────────
function TodoCard({ todo, onToggle, onDelete }) {
    const p = PRIORITY[todo.priority] || PRIORITY[5];
    return (
        <div
            className="group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200 cursor-default relative overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.06)`,
                borderLeft: `2px solid ${p.color}`,
            }}
        >
            {/* Subtle left glow */}
            <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                style={{ background: `linear-gradient(90deg, ${p.color}10, transparent)` }} />

            {/* Checkbox */}
            <button
                onClick={() => onToggle(todo.id)}
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 relative z-10"
                style={todo.completed
                    ? {
                        background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)`,
                        boxShadow: `0 0 8px ${p.glow}`,
                        border: 'none',
                    }
                    : {
                        border: `1.5px solid ${p.color}60`,
                        background: `${p.color}08`,
                    }
                }
            >
                {todo.completed && <CheckIcon />}
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0 relative z-10">
                <p className={`text-xs font-medium leading-tight truncate transition-all duration-300
                    ${todo.completed ? 'line-through text-white/20' : 'text-white/80'}`}>
                    {todo.text}
                </p>
            </div>

            {/* Priority badge */}
            <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 leading-none relative z-10"
                style={{ color: p.color, background: p.bg }}
            >
                {p.label}
            </span>

            {/* Delete */}
            <button
                onClick={() => onDelete(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0 relative z-10"
            >
                <TrashIcon />
            </button>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────
const TodoList = () => {
    const { user } = useUser();

    const [todos, setTodos]       = useState([]);
    const [input, setInput]       = useState('');
    const [priority, setPriority] = useState(3);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter]     = useState('all');
    const [loading, setLoading]   = useState(true);
    const inputRef                = useRef(null);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const q = query(collection(db, 'todos'), where('userId', '==', user.id));
                const snap = await getDocs(q);
                const data = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (a.priority || 5) - (b.priority || 5));
                setTodos(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    useEffect(() => {
        if (showForm && inputRef.current) inputRef.current.focus();
    }, [showForm]);

    const addTodo = async () => {
        if (!input.trim() || !user) return;
        const docRef = await addDoc(collection(db, 'todos'), {
            text: input.trim(),
            userId: user.id,
            completed: false,
            priority,
            createdAt: serverTimestamp(),
        });
        const newTodo = { id: docRef.id, text: input.trim(), completed: false, priority };
        setTodos(prev => [...prev, newTodo].sort((a, b) => (a.priority || 5) - (b.priority || 5)));
        setInput('');
        setShowForm(false);
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        await updateDoc(doc(db, 'todos', id), { completed: !todo.completed });
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = async (id) => {
        await deleteDoc(doc(db, 'todos', id));
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    const visibleTodos = todos.filter(t =>
        filter === 'all'    ? true :
        filter === 'active' ? !t.completed :
        t.completed
    );

    const doneCount  = todos.filter(t => t.completed).length;
    const totalCount = todos.length;
    const pct        = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

    return (
        <div className="flex flex-col gap-2 px-3 py-3">

            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-logo)' }}>Tasks</h3>
                    {totalCount > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}>
                            {doneCount}/{totalCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowForm(f => !f)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                    style={showForm
                        ? { background: 'rgba(255,255,255,0.12)', color: 'white' }
                        : { color: 'rgba(255,255,255,0.35)' }
                    }
                >
                    <PlusIcon />
                </button>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="h-0.5 rounded-full overflow-hidden flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                            boxShadow: pct > 0 ? '0 0 8px rgba(99,102,241,0.6)' : 'none',
                        }}
                    />
                </div>
            )}

            {/* Add form */}
            {showForm && (
                <div className="flex flex-col gap-1.5 flex-shrink-0 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTodo()}
                        placeholder="What needs to be done?"
                        className="w-full bg-transparent text-white text-xs placeholder-white/20 focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className="w-5 h-5 rounded text-[9px] font-bold transition-all"
                                    style={{
                                        color: PRIORITY[p].color,
                                        background: priority === p ? PRIORITY[p].bg : 'rgba(255,255,255,0.04)',
                                        transform: priority === p ? 'scale(1.15)' : 'scale(1)',
                                        boxShadow: priority === p ? `0 0 8px ${PRIORITY[p].glow}` : 'none',
                                        border: priority === p ? `1px solid ${PRIORITY[p].color}40` : '1px solid transparent',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={addTodo}
                            disabled={!input.trim()}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white transition-all disabled:opacity-30"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-0.5 flex-shrink-0 p-0.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['all', 'active', 'done'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="flex-1 px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize transition-all duration-200"
                        style={filter === f
                            ? { background: 'rgba(99,102,241,0.3)', color: '#c4b5fd', boxShadow: '0 0 8px rgba(99,102,241,0.3)' }
                            : { color: 'rgba(255,255,255,0.25)' }
                        }
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Todos list */}
            <div className="flex flex-col gap-1.5 pr-0.5">
                {loading ? (
                    <div className="flex flex-col gap-1.5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="skeleton rounded-full flex-shrink-0" style={{ width: 14, height: 14 }} />
                                <div className="skeleton rounded-md flex-1" style={{ height: 11 }} />
                                <div className="skeleton rounded-md" style={{ width: 24, height: 16 }} />
                            </div>
                        ))}
                    </div>
                ) : visibleTodos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-5 gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
                                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        <span className="text-white/20 text-[10px] text-center">
                            {filter === 'done' ? 'Nothing completed yet' : 'All clear — add a task!'}
                        </span>
                    </div>
                ) : (
                    visibleTodos.map(todo => (
                        <TodoCard
                            key={todo.id}
                            todo={todo}
                            onToggle={toggleTodo}
                            onDelete={deleteTodo}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoList;
