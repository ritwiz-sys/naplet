// ── Primitive skeleton blocks ──────────────────────────────────────

/** A shimmering line. w/h are Tailwind width/height strings or inline style values. */
export function SkLine({ w = '100%', h = 10, rounded = 'rounded-md', className = '' }) {
    return (
        <div
            className={`skeleton ${rounded} ${className}`}
            style={{ width: w, height: h }}
        />
    );
}

/** A shimmering circle (avatar, checkbox, dot). */
export function SkCircle({ size = 16, className = '' }) {
    return (
        <div
            className={`skeleton rounded-full flex-shrink-0 ${className}`}
            style={{ width: size, height: size }}
        />
    );
}

/** A shimmering rectangle / box. */
export function SkBox({ w = '100%', h = 40, rounded = 'rounded-xl', className = '' }) {
    return (
        <div
            className={`skeleton ${rounded} ${className}`}
            style={{ width: w, height: h }}
        />
    );
}

// ── Composed widget skeletons ──────────────────────────────────────

/** Weather card skeleton */
export function WeatherSkeleton() {
    return (
        <div className="glass h-full flex flex-col justify-between p-4 gap-4">
            <div className="flex items-start justify-between">
                <SkCircle size={40} />
                <div className="flex flex-col items-end gap-2">
                    <SkLine w={70} h={32} />
                    <SkLine w={50} h={10} />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <SkLine w="70%" h={14} />
                <SkLine w="50%" h={10} />
            </div>
        </div>
    );
}

/** Mood tracker skeleton */
export function MoodSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex gap-1 justify-between">
                {[...Array(5)].map((_, i) => <SkCircle key={i} size={32} />)}
            </div>
            <SkBox h={34} rounded="rounded-xl" />
        </div>
    );
}

/** Calendar skeleton */
export function CalendarSkeleton() {
    return (
        <div className="h-full flex flex-col gap-2">
            {/* Month nav */}
            <div className="flex items-center justify-between">
                <SkCircle size={22} />
                <SkLine w={100} h={12} />
                <SkCircle size={22} />
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, i) => <SkLine key={i} h={10} rounded="rounded" />)}
            </div>
            {/* Day cells — 5 rows */}
            <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                    <SkBox key={i} h={26} rounded="rounded-md" />
                ))}
            </div>
            {/* Divider */}
            <div className="h-px bg-white/5" />
            {/* Events */}
            <div className="flex items-center justify-between">
                <SkLine w={60} h={10} />
                <SkLine w={40} h={18} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <SkCircle size={8} />
                        <SkLine h={12} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Todo list skeleton */
export function TodoSkeleton() {
    return (
        <div className="flex flex-col gap-2 px-3 py-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SkLine w={50} h={14} />
                    <SkLine w={28} h={14} rounded="rounded-full" />
                </div>
                <SkCircle size={22} />
            </div>
            {/* Progress bar */}
            <SkLine h={3} rounded="rounded-full" />
            {/* Filter tabs */}
            <div className="flex gap-1">
                {[40, 50, 38].map((w, i) => <SkLine key={i} w={w} h={16} rounded="rounded-md" />)}
            </div>
            {/* Todo cards */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <SkCircle size={14} className="rounded-full" />
                    <SkLine h={11} className="flex-1" />
                    <SkLine w={20} h={18} rounded="rounded-md" />
                </div>
            ))}
        </div>
    );
}

/** Habit tracker skeleton */
export function HabitSkeleton() {
    return (
        <div className="flex flex-col gap-2 px-3 py-3">
            <div className="flex items-center justify-between">
                <SkLine w={50} h={14} />
                <SkCircle size={22} />
            </div>
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <SkCircle size={14} />
                        <SkLine h={11} className="flex-1" />
                        <SkLine w={28} h={11} rounded="rounded-md" />
                    </div>
                    <SkLine h={3} rounded="rounded-full" className="ml-6" />
                </div>
            ))}
        </div>
    );
}

/** Notes / Journal skeleton */
export function NotesSkeleton() {
    return (
        <div className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between">
                <SkLine w={55} h={14} />
                <div className="flex gap-1">
                    <SkCircle size={22} />
                    <SkCircle size={22} />
                </div>
            </div>
            <SkLine w="90%" h={11} />
            <SkLine w="70%" h={11} />
            <SkLine w="80%" h={11} />
        </div>
    );
}

/** Full dashboard card skeleton (used for the whole card while Clerk loads) */
export function CardSkeleton({ rows = 4, className = '' }) {
    return (
        <div className={`glass p-4 flex flex-col gap-3 ${className}`}>
            {[...Array(rows)].map((_, i) => (
                <SkLine key={i} w={`${60 + (i * 13) % 40}%`} h={12 + (i % 2) * 4} />
            ))}
        </div>
    );
}
