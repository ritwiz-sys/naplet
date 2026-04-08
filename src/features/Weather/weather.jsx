import React, { useEffect, useRef, useState } from "react";
import { WeatherSkeleton } from '../../components/Skeleton';

// ── Fallback ──────────────────────────────────────────────────────
const FALLBACK = {
    name: "Amaravati",
    main: { temp: 27, temp_min: 23, temp_max: 30, feels_like: 29, humidity: 68 },
    wind: { speed: 3.2 },
    weather: [{ description: "clear sky", icon: "01d" }],
};

// ── Time period from current hour ─────────────────────────────────
function getTimePeriod() {
    const h = new Date().getHours();
    if (h >= 5  && h < 8)  return 'dawn';
    if (h >= 8  && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 20) return 'evening';
    return 'night';
}

// ── Map icon code → weather type ──────────────────────────────────
function getWeatherType(iconCode = '') {
    const code = iconCode.slice(0, 2);
    if (code === '11') return 'thunder';
    if (code === '13') return 'snow';
    if (code === '09' || code === '10') return 'rain';
    if (code === '50') return 'mist';
    if (code === '03' || code === '04') return 'cloudy';
    const p = getTimePeriod();
    if (p === 'dawn')    return 'clear_dawn';
    if (p === 'evening') return 'clear_evening';
    if (p === 'night')   return 'clear_night';
    if (p === 'morning') return 'clear_morning';
    return 'clear_day';
}

// ── Theme per weather type ────────────────────────────────────────
const THEMES = {
    clear_dawn: {
        bg:         'linear-gradient(170deg, #0d0820 0%, #2a1040 25%, #7a2545 55%, #c95520 78%, #e8820a 100%)',
        cardBg:     'rgba(80,20,10,0.30)',
        accent:     '#f97316',
        accentSoft: 'rgba(249,115,22,0.18)',
        glow:       'rgba(249,115,22,0.55)',
        borderColor:'rgba(249,115,22,0.28)',
        label:      'Dawn',
        labelColor: '#fcd34d',
        badge:      '🌅',
        tempColor:  '#fde68a',
        statBg:     'rgba(249,115,22,0.10)',
    },
    clear_morning: {
        bg:         'linear-gradient(160deg, #0a2452 0%, #1456a0 40%, #2980c8 70%, #55b0e0 100%)',
        cardBg:     'rgba(10,30,80,0.30)',
        accent:     '#fde68a',
        accentSoft: 'rgba(253,230,138,0.15)',
        glow:       'rgba(253,230,138,0.50)',
        borderColor:'rgba(253,230,138,0.25)',
        label:      'Morning',
        labelColor: '#fde68a',
        badge:      '🌤',
        tempColor:  '#ffffff',
        statBg:     'rgba(253,230,138,0.08)',
    },
    clear_day: {
        bg:         'linear-gradient(160deg, #0d2d6e 0%, #1a4fa8 50%, #2e72d2 100%)',
        cardBg:     'rgba(10,30,80,0.28)',
        accent:     '#fbbf24',
        accentSoft: 'rgba(251,191,36,0.14)',
        glow:       'rgba(251,191,36,0.50)',
        borderColor:'rgba(251,191,36,0.28)',
        label:      'Sunny',
        labelColor: '#fbbf24',
        badge:      '☀️',
        tempColor:  '#ffffff',
        statBg:     'rgba(251,191,36,0.08)',
    },
    clear_evening: {
        bg:         'linear-gradient(170deg, #120520 0%, #3c1040 22%, #8a2050 48%, #d44818 72%, #f07020 100%)',
        cardBg:     'rgba(100,20,10,0.30)',
        accent:     '#fb923c',
        accentSoft: 'rgba(251,146,60,0.18)',
        glow:       'rgba(251,146,60,0.60)',
        borderColor:'rgba(251,146,60,0.30)',
        label:      'Evening',
        labelColor: '#fcd34d',
        badge:      '🌇',
        tempColor:  '#fed7aa',
        statBg:     'rgba(251,146,60,0.10)',
    },
    clear_night: {
        bg:         'linear-gradient(160deg, #0c0822 0%, #13103a 55%, #1a1550 100%)',
        cardBg:     'rgba(15,8,40,0.40)',
        accent:     '#a78bfa',
        accentSoft: 'rgba(167,139,250,0.14)',
        glow:       'rgba(130,90,255,0.45)',
        borderColor:'rgba(167,139,250,0.30)',
        label:      'Night',
        labelColor: '#c4b5fd',
        badge:      '🌙',
        tempColor:  '#e9d5ff',
        statBg:     'rgba(167,139,250,0.08)',
    },
    cloudy: {
        bg:         'linear-gradient(160deg, #1a1f30 0%, #232b42 50%, #2a3350 100%)',
        cardBg:     'rgba(20,24,40,0.40)',
        accent:     '#94a3b8',
        accentSoft: 'rgba(148,163,184,0.12)',
        glow:       'rgba(148,163,184,0.25)',
        borderColor:'rgba(148,163,184,0.22)',
        label:      'Cloudy',
        labelColor: '#cbd5e1',
        badge:      '☁️',
        tempColor:  '#e2e8f0',
        statBg:     'rgba(148,163,184,0.07)',
    },
    rain: {
        bg:         'linear-gradient(160deg, #091622 0%, #122030 50%, #182c42 100%)',
        cardBg:     'rgba(5,15,30,0.45)',
        accent:     '#60a5fa',
        accentSoft: 'rgba(96,165,250,0.14)',
        glow:       'rgba(96,165,250,0.40)',
        borderColor:'rgba(96,165,250,0.28)',
        label:      'Rainy',
        labelColor: '#93c5fd',
        badge:      '🌧',
        tempColor:  '#bfdbfe',
        statBg:     'rgba(96,165,250,0.08)',
    },
    thunder: {
        bg:         'linear-gradient(160deg, #0d0818 0%, #160c28 50%, #1c1038 100%)',
        cardBg:     'rgba(10,5,25,0.50)',
        accent:     '#fbbf24',
        accentSoft: 'rgba(251,191,36,0.14)',
        glow:       'rgba(245,158,11,0.50)',
        borderColor:'rgba(251,191,36,0.35)',
        label:      'Thunder',
        labelColor: '#fde68a',
        badge:      '⛈️',
        tempColor:  '#fef3c7',
        statBg:     'rgba(251,191,36,0.08)',
    },
    snow: {
        bg:         'linear-gradient(160deg, #0e1d38 0%, #182d52 50%, #1e3a68 100%)',
        cardBg:     'rgba(10,20,45,0.40)',
        accent:     '#bfdbfe',
        accentSoft: 'rgba(191,219,254,0.14)',
        glow:       'rgba(191,219,254,0.40)',
        borderColor:'rgba(191,219,254,0.30)',
        label:      'Snowy',
        labelColor: '#e0f2fe',
        badge:      '❄️',
        tempColor:  '#e0f2fe',
        statBg:     'rgba(191,219,254,0.08)',
    },
    mist: {
        bg:         'linear-gradient(160deg, #141a2a 0%, #1c2438 50%, #232c48 100%)',
        cardBg:     'rgba(15,20,35,0.40)',
        accent:     '#cbd5e1',
        accentSoft: 'rgba(203,213,225,0.12)',
        glow:       'rgba(203,213,225,0.30)',
        borderColor:'rgba(203,213,225,0.22)',
        label:      'Misty',
        labelColor: '#e2e8f0',
        badge:      '🌫',
        tempColor:  '#f1f5f9',
        statBg:     'rgba(203,213,225,0.07)',
    },
};

function capitalize(s = '') { return s.charAt(0).toUpperCase() + s.slice(1); }
function mpsToKmh(s) { return Math.round((s || 0) * 3.6); }

// ── Responsive size hook ──────────────────────────────────────────
function useContainerSize(ref) {
    const [size, setSize] = useState({ w: 0, h: 0 });
    useEffect(() => {
        if (!ref.current) return;
        const ro = new ResizeObserver(([e]) => {
            const { width, height } = e.contentRect;
            setSize({ w: Math.round(width), h: Math.round(height) });
        });
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, [ref]);
    return size;
}

// ─────────────────────────────────────────────────────────────────
// ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────────

function DawnIllustration({ accent }) {
    const stars = [
        { cx: 20, cy: 12, r: 0.9, delay: '0s' },
        { cx: 40, cy: 8,  r: 0.7, delay: '0.5s' },
        { cx: 65, cy: 15, r: 1.0, delay: '1.1s' },
        { cx: 82, cy: 9,  r: 0.8, delay: '0.3s' },
    ];
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
                <radialGradient id="dawn-glow" cx="50%" cy="100%" r="80%">
                    <stop offset="0%"   stopColor={accent} stopOpacity="0.7" />
                    <stop offset="60%"  stopColor="#e8820a" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="dawn-horizon" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#ffe0a0" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
                </linearGradient>
            </defs>
            {stars.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity="0.4"
                    style={{ animation: `star-blink ${2.5 + i * 0.4}s ease-in-out infinite`, animationDelay: s.delay }} />
            ))}
            <ellipse cx="50" cy="78" rx="55" ry="32" fill="url(#dawn-glow)" />
            {[0, 15, 30, 345, 330].map((angle, i) => {
                const rad = (angle - 90) * Math.PI / 180;
                return (
                    <line key={i}
                        x1={50 + Math.cos(rad) * 14} y1={78 + Math.sin(rad) * 14}
                        x2={50 + Math.cos(rad) * (28 + i * 4)} y2={78 + Math.sin(rad) * (28 + i * 4)}
                        stroke={accent} strokeWidth={i === 2 ? 2 : 1}
                        strokeLinecap="round" opacity={0.35 + i * 0.05}
                        style={{ animation: `glow-breathe 3s ${i * 0.3}s ease-in-out infinite` }} />
                );
            })}
            <clipPath id="dawn-clip"><rect x="0" y="0" width="100" height="78" /></clipPath>
            <circle cx="50" cy="78" r="17" fill="url(#dawn-horizon)"
                clipPath="url(#dawn-clip)"
                style={{ filter: `drop-shadow(0 0 12px ${accent})` }} />
            <line x1="0" y1="78" x2="100" y2="78" stroke="rgba(255,200,100,0.35)" strokeWidth="0.8" />
            <rect x="0" y="78" width="100" height="8" fill="rgba(10,5,20,0.5)" />
        </svg>
    );
}

function EveningIllustration({ accent }) {
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
                <radialGradient id="eve-glow" cx="50%" cy="100%" r="80%">
                    <stop offset="0%"  stopColor={accent} stopOpacity="0.75" />
                    <stop offset="55%" stopColor="#c04010" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="eve-sun" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#fde68a" stopOpacity="0.95" />
                    <stop offset="100%" stopColor={accent}  stopOpacity="1" />
                </linearGradient>
                <clipPath id="eve-clip"><rect x="0" y="0" width="100" height="68" /></clipPath>
            </defs>
            <ellipse cx="50" cy="72" rx="60" ry="35" fill="url(#eve-glow)" />
            <g style={{ transformOrigin: '50px 68px', animation: 'sun-spin 40s linear infinite' }}>
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => {
                    const r = a * Math.PI / 180;
                    return (
                        <line key={i}
                            x1={50 + Math.cos(r)*20} y1={68 + Math.sin(r)*20}
                            x2={50 + Math.cos(r)*(i%3===0?38:30)} y2={68 + Math.sin(r)*(i%3===0?38:30)}
                            stroke={accent} strokeWidth={i%3===0?1.5:0.8}
                            strokeLinecap="round" opacity={i%3===0?0.55:0.28} />
                    );
                })}
            </g>
            {[0, 0.8, 1.6].map((d, i) => (
                <circle key={i} cx="50" cy="68" r="16" fill="none"
                    stroke={accent} strokeWidth="1.2" opacity="0"
                    style={{ animation: `ring-expand 2.8s ${d}s ease-out infinite` }} />
            ))}
            <circle cx="50" cy="68" r="15" fill="url(#eve-sun)" clipPath="url(#eve-clip)"
                style={{ filter: `drop-shadow(0 0 14px ${accent})` }} />
            <line x1="0" y1="68" x2="100" y2="68" stroke="rgba(255,160,60,0.30)" strokeWidth="0.8" />
            <rect x="0" y="68" width="100" height="12" fill="rgba(10,3,18,0.55)" />
            {[[28,52],[38,48],[72,55],[82,50]].map(([x,y], i) => (
                <path key={i} d={`M${x},${y} q3,-3,6,0 q3,3,6,0`}
                    fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" strokeLinecap="round" />
            ))}
        </svg>
    );
}

function ClearNightIllustration({ accent }) {
    const stars = [
        { cx: 22, cy: 18, r: 1.2, delay: '0s'   },
        { cx: 38, cy: 10, r: 0.9, delay: '0.6s'  },
        { cx: 55, cy: 22, r: 1.4, delay: '1.1s'  },
        { cx: 14, cy: 35, r: 0.8, delay: '0.3s'  },
        { cx: 70, cy: 14, r: 1.0, delay: '1.5s'  },
        { cx: 80, cy: 30, r: 0.7, delay: '0.9s'  },
        { cx: 30, cy: 48, r: 1.1, delay: '1.8s'  },
        { cx: 88, cy: 50, r: 1.3, delay: '1.2s'  },
    ];
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            {stars.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white"
                    style={{ animation: `star-blink ${1.6 + i * 0.25}s ease-in-out infinite`, animationDelay: s.delay }} />
            ))}
            <line x1="8"  y1="8"  x2="32" y2="28" stroke="white" strokeWidth="1.2" strokeLinecap="round"
                strokeDasharray="24" strokeDashoffset="0"
                style={{ animation: 'meteor 2.8s 1.5s ease-in infinite', opacity: 0 }} />
            <line x1="60" y1="5"  x2="78" y2="20" stroke="white" strokeWidth="0.9" strokeLinecap="round"
                strokeDasharray="18" strokeDashoffset="0"
                style={{ animation: 'meteor 2.8s 4.2s ease-in infinite', opacity: 0 }} />
            <circle cx="62" cy="42" r="26" fill={accent} opacity="0.06"
                style={{ animation: 'moon-glow 4s ease-in-out infinite' }} />
            <circle cx="62" cy="42" r="22" fill={accent} opacity="0.09"
                style={{ animation: 'moon-glow 4s ease-in-out infinite', animationDelay: '0.5s' }} />
            <circle cx="62" cy="42" r="19" fill={accent} opacity="0.95"
                style={{ filter: `drop-shadow(0 0 14px ${accent})` }} />
            <circle cx="70" cy="38" r="16" fill="#13103a" />
            <circle cx="54" cy="48" r="2.5" fill="white" opacity="0.18" />
        </svg>
    );
}

function ClearMorningIllustration({ accent }) {
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            <circle cx="50" cy="42" r="32" fill={accent} opacity="0.08" />
            {[0, 0.8, 1.6].map((d, i) => (
                <circle key={i} cx="50" cy="42" r="16" fill="none"
                    stroke={accent} strokeWidth="1.5" opacity="0"
                    style={{ animation: `ring-expand 2.4s ${d}s ease-out infinite` }} />
            ))}
            <g style={{ transformOrigin: '50px 42px', animation: 'sun-spin 20s linear infinite' }}>
                {[0,45,90,135,180,225,270,315].map((angle, i) => (
                    <line key={i}
                        x1={50 + Math.cos(angle * Math.PI / 180) * 19}
                        y1={42 + Math.sin(angle * Math.PI / 180) * 19}
                        x2={50 + Math.cos(angle * Math.PI / 180) * 27}
                        y2={42 + Math.sin(angle * Math.PI / 180) * 27}
                        stroke={accent} strokeWidth={i % 2 === 0 ? 2 : 1}
                        strokeLinecap="round" opacity={i % 2 === 0 ? 0.8 : 0.35} />
                ))}
            </g>
            <circle cx="50" cy="42" r="13" fill={accent}
                style={{ filter: `drop-shadow(0 0 14px ${accent})` }} />
            <circle cx="44" cy="37" r="4" fill="white" opacity="0.22" />
            {[[18,22],[26,18],[76,26],[84,20]].map(([x,y], i) => (
                <path key={i} d={`M${x},${y} q2,-2,4,0 q2,2,4,0`}
                    fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth="1" strokeLinecap="round" />
            ))}
        </svg>
    );
}

function ClearDayIllustration({ accent }) {
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            {[0, 0.8, 1.6].map((d, i) => (
                <circle key={i} cx="50" cy="42" r="16" fill="none"
                    stroke={accent} strokeWidth="1.5" opacity="0"
                    style={{ animation: `ring-expand 2.4s ${d}s ease-out infinite` }} />
            ))}
            <g style={{ transformOrigin: '50px 42px', animation: 'sun-spin 20s linear infinite' }}>
                {[0,45,90,135,180,225,270,315].map((angle, i) => (
                    <line key={i}
                        x1={50 + Math.cos(angle * Math.PI / 180) * 19}
                        y1={42 + Math.sin(angle * Math.PI / 180) * 19}
                        x2={50 + Math.cos(angle * Math.PI / 180) * 26}
                        y2={42 + Math.sin(angle * Math.PI / 180) * 26}
                        stroke={accent} strokeWidth={i % 2 === 0 ? 2 : 1}
                        strokeLinecap="round" opacity={i % 2 === 0 ? 0.85 : 0.4} />
                ))}
            </g>
            <circle cx="50" cy="42" r="13" fill={accent}
                style={{ filter: `drop-shadow(0 0 12px ${accent})` }} />
            <circle cx="44" cy="37" r="4" fill="white" opacity="0.2" />
        </svg>
    );
}

function CloudyIllustration({ accent }) {
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full">
            <g style={{ animation: 'cloud-drift 6s ease-in-out infinite', animationDelay: '0.5s' }} opacity="0.4">
                <ellipse cx="70" cy="44" rx="22" ry="12" fill="white" />
                <ellipse cx="60" cy="40" rx="14" ry="10" fill="white" />
                <ellipse cx="80" cy="40" rx="12" ry="9"  fill="white" />
            </g>
            <g style={{ animation: 'cloud-drift 5s ease-in-out infinite' }}>
                <ellipse cx="45" cy="46" rx="26" ry="14" fill="white" opacity="0.9" />
                <ellipse cx="32" cy="40" rx="16" ry="12" fill="white" opacity="0.9" />
                <ellipse cx="57" cy="39" rx="18" ry="13" fill="white" opacity="0.9" />
                <ellipse cx="44" cy="37" rx="12" ry="10" fill="white" />
            </g>
        </svg>
    );
}

function RainIllustration({ accent }) {
    const drops = [
        { x: 18, delay: '0.0s', dur: '0.9s'  },
        { x: 30, delay: '0.3s', dur: '1.0s'  },
        { x: 42, delay: '0.1s', dur: '0.85s' },
        { x: 54, delay: '0.5s', dur: '1.05s' },
        { x: 66, delay: '0.2s', dur: '0.95s' },
        { x: 78, delay: '0.7s', dur: '1.0s'  },
        { x: 24, delay: '0.6s', dur: '0.88s' },
        { x: 48, delay: '0.8s', dur: '0.92s' },
        { x: 72, delay: '0.4s', dur: '1.02s' },
        { x: 12, delay: '0.9s', dur: '0.87s' },
        { x: 88, delay: '0.15s',dur: '0.98s' },
    ];
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            <g style={{ animation: 'cloud-drift 5s ease-in-out infinite' }}>
                <ellipse cx="48" cy="26" rx="28" ry="14" fill="#b0c8e8" opacity="0.7" />
                <ellipse cx="34" cy="20" rx="16" ry="12" fill="#b0c8e8" opacity="0.7" />
                <ellipse cx="62" cy="19" rx="19" ry="13" fill="#b0c8e8" opacity="0.7" />
                <ellipse cx="48" cy="18" rx="12" ry="9"  fill="#c8daf0" opacity="0.5" />
            </g>
            {drops.map((d, i) => (
                <line key={i} x1={d.x} y1="0" x2={d.x + 6} y2="12"
                    stroke={accent} strokeWidth="1.4" strokeLinecap="round"
                    style={{ animation: `rain-slant ${d.dur} ease-in infinite`, animationDelay: d.delay }} />
            ))}
        </svg>
    );
}

function ThunderIllustration({ accent }) {
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            <g style={{ animation: 'cloud-drift 4s ease-in-out infinite' }}>
                <ellipse cx="48" cy="28" rx="30" ry="15" fill="#2d1b6e" opacity="0.9" />
                <ellipse cx="33" cy="22" rx="17" ry="13" fill="#2d1b6e" opacity="0.9" />
                <ellipse cx="62" cy="21" rx="19" ry="14" fill="#2d1b6e" opacity="0.9" />
                <ellipse cx="48" cy="20" rx="12" ry="10" fill="#241560" />
            </g>
            <polygon points="52,38 44,52 50,52 42,68 58,50 51,50 58,38" fill={accent}
                style={{
                    animation: 'lightning-flash 3s ease-in-out infinite',
                    filter: `drop-shadow(0 0 6px ${accent})`,
                }} />
        </svg>
    );
}

function SnowIllustration({ accent }) {
    const flakes = [
        { x: 18, delay: '0.0s', dur: '1.4s', size: 8 },
        { x: 34, delay: '0.5s', dur: '1.6s', size: 6 },
        { x: 50, delay: '0.2s', dur: '1.3s', size: 9 },
        { x: 66, delay: '0.8s', dur: '1.5s', size: 7 },
        { x: 82, delay: '0.3s', dur: '1.4s', size: 8 },
        { x: 26, delay: '1.0s', dur: '1.6s', size: 6 },
        { x: 58, delay: '0.6s', dur: '1.3s', size: 7 },
        { x: 74, delay: '1.2s', dur: '1.5s', size: 9 },
    ];
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
            <g style={{ animation: 'cloud-drift 6s ease-in-out infinite' }}>
                <ellipse cx="48" cy="28" rx="28" ry="13" fill="white" opacity="0.8" />
                <ellipse cx="34" cy="23" rx="16" ry="12" fill="white" opacity="0.8" />
                <ellipse cx="61" cy="22" rx="18" ry="12" fill="white" opacity="0.8" />
            </g>
            {flakes.map((f, i) => (
                <text key={i} x={f.x} y={10} fontSize={f.size} fill={accent} opacity="0"
                    textAnchor="middle"
                    style={{ animation: `snow-fall ${f.dur} ease-in infinite`, animationDelay: f.delay }}>
                    ❄
                </text>
            ))}
        </svg>
    );
}

function MistIllustration({ accent }) {
    const lines = [
        { y: 25, w: 70, x: 15, delay: '0s',   dur: '3.5s' },
        { y: 35, w: 55, x: 22, delay: '0.6s', dur: '4.0s' },
        { y: 44, w: 65, x: 18, delay: '0.2s', dur: '3.0s' },
        { y: 53, w: 50, x: 25, delay: '1.0s', dur: '3.8s' },
        { y: 62, w: 60, x: 20, delay: '0.4s', dur: '3.2s' },
    ];
    return (
        <svg viewBox="0 0 100 80" className="w-full h-full">
            {lines.map((l, i) => (
                <rect key={i} x={l.x} y={l.y - 2} width={l.w} height={3} rx={1.5}
                    fill={accent} opacity={0}
                    style={{ animation: `mist-drift ${l.dur} ease-in-out infinite`, animationDelay: l.delay }} />
            ))}
        </svg>
    );
}

function WeatherIllustration({ type, accent }) {
    const p = { accent };
    switch (type) {
        case 'clear_dawn':    return <DawnIllustration {...p} />;
        case 'clear_morning': return <ClearMorningIllustration {...p} />;
        case 'clear_day':     return <ClearDayIllustration {...p} />;
        case 'clear_evening': return <EveningIllustration {...p} />;
        case 'clear_night':   return <ClearNightIllustration {...p} />;
        case 'rain':          return <RainIllustration {...p} />;
        case 'thunder':       return <ThunderIllustration {...p} />;
        case 'snow':          return <SnowIllustration {...p} />;
        case 'mist':          return <MistIllustration {...p} />;
        default:              return <CloudyIllustration {...p} />;
    }
}

// ── Stat item ─────────────────────────────────────────────────────
function StatItem({ icon, label, value, accent, statBg, compact }) {
    return (
        <div className="flex flex-col items-center gap-0.5 flex-1 rounded-lg py-1.5"
            style={{ background: statBg }}>
            <span style={{ fontSize: compact ? 11 : 12, lineHeight: 1 }}>{icon}</span>
            <span className="font-bold leading-none text-white"
                style={{ fontSize: compact ? 10 : 11 }}>{value}</span>
            <span style={{ fontSize: compact ? 7.5 : 8, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>{label}</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────
function Weather() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const containerRef          = useRef(null);
    const size                  = useContainerSize(containerRef);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res  = await fetch('/api/weather?city=Amaravati&units=metric');
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed');
                if (alive) setWeather(data);
            } catch (e) {
                if (alive) { setError(e.message); setWeather(FALLBACK); }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    if (loading) return <WeatherSkeleton />;

    const iconCode  = weather?.weather?.[0]?.icon ?? '01d';
    const type      = getWeatherType(iconCode);
    const theme     = THEMES[type] || THEMES.clear_night;

    const temp      = Math.round(weather?.main?.temp      ?? 27);
    const feelsLike = Math.round(weather?.main?.feels_like ?? 28);
    const tempMin   = Math.round(weather?.main?.temp_min   ?? 23);
    const tempMax   = Math.round(weather?.main?.temp_max   ?? 30);
    const humidity  = weather?.main?.humidity ?? 68;
    const windKmh   = mpsToKmh(weather?.wind?.speed);
    const city      = weather?.name ?? 'Amaravati';
    const desc      = capitalize(weather?.weather?.[0]?.description ?? 'clear sky');

    const barMin = tempMin - 6;
    const barMax = tempMax + 6;
    const barPct = Math.max(0, Math.min(100, ((temp - barMin) / (barMax - barMin)) * 100));

    const isCompact = size.h > 0 && size.h < 290;
    const isTiny    = size.h > 0 && size.h < 210;

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col overflow-hidden relative weather-card-enter"
            style={{
                background: theme.bg,
                borderRadius: 20,
                border: `1px solid ${theme.borderColor}`,
                boxShadow: `0 0 0 1px rgba(0,0,0,0.3), 0 0 32px , inset 0 1px 0 rgba(255,255,255,0.08)`,
                minHeight: 0,
            }}
        >
            {/* ── Ambient glow top-right ── */}
            <div className="absolute top-0 right-0 pointer-events-none"
                style={{
                    width: isCompact ? 90 : 150,
                    height: isCompact ? 90 : 150,
                    background: `radial-gradient(circle at 70% 30%, ${theme.glow} 0%, transparent 65%)`,
                    borderRadius: '50%',
                    animation: 'glow-breathe 4s ease-in-out infinite',
                }} />

            {/* ── Bottom vignette to ground the info section ── */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{
                    height: isCompact ? 90 : 110,
                    background: `linear-gradient(to top, ${theme.cardBg} 0%, transparent 100%)`,
                    borderRadius: '0 0 20px 20px',
                }} />

            {/* ── Thunder flash overlay ── */}
            {type === 'thunder' && (
                <div className="absolute inset-0 pointer-events-none rounded-[20px]"
                    style={{
                        background: 'rgba(253,230,138,0.9)',
                        animation: 'thunder-bg-flash 3s ease-in-out infinite',
                    }} />
            )}

            {/* ── Weather type badge (top-left) ── */}
            {!isTiny && (
                <div className="absolute top-2.5 left-3 z-10 flex items-center gap-1.5">
                    <span style={{ fontSize: 10 }}>{theme.badge}</span>
                    <span style={{
                        fontSize: 8,
                        color: theme.labelColor,
                        fontWeight: 700,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        textShadow: `0 0 8px ${theme.glow}`,
                    }}>
                        {theme.label}
                    </span>
                </div>
            )}

            {/* ── Illustration zone ── */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                style={{ padding: isCompact ? '12px 8px 0' : '18px 12px 0' }}>
                <WeatherIllustration type={type} accent={theme.accent} />
            </div>

            {/* ── Info zone ── */}
            <div className="flex-shrink-0 flex flex-col relative z-10"
                style={{ padding: isCompact ? '4px 12px 10px' : '4px 14px 14px', gap: isCompact ? 5 : 8 }}>

                {/* Temp + city row */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-start gap-0.5 leading-none">
                            <span className="font-black leading-none"
                                style={{
                                    fontSize: isCompact ? 32 : 40,
                                    fontFamily: 'var(--font-logo)',
                                    color: theme.tempColor,
                                    lineHeight: 1,
                                    textShadow: `0 2px 20px ${theme.glow}`,
                                }}>
                                {temp}
                            </span>
                            <span className="font-semibold mt-0.5"
                                style={{ fontSize: isCompact ? 13 : 16, color: 'rgba(255,255,255,0.50)' }}>
                                °C
                            </span>
                        </div>
                        {!isTiny && (
                            <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.38)', marginTop: 2, fontWeight: 500 }}>
                                Feels {feelsLike}°
                            </p>
                        )}
                    </div>
                    <div className="text-right pb-0.5 flex flex-col gap-0.5">
                        <p className="font-semibold leading-tight text-white" style={{ fontSize: isCompact ? 10 : 12 }}>
                            {city}
                        </p>
                        <p style={{ fontSize: 8.5, fontWeight: 500, color: theme.labelColor, opacity: 0.9 }}>
                            {desc}
                        </p>
                    </div>
                </div>

                {/* Temp range bar */}
                {!isTiny && (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.30)' }}>↓ {tempMin}°</span>
                            <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.30)' }}>↑ {tempMax}°</span>
                        </div>
                        <div className="h-1 rounded-full w-full relative overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.08)' }}>
                            {/* Gradient fill */}
                            <div className="absolute inset-0 rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, rgba(96,165,250,0.5), ${theme.accent}, rgba(239,68,68,0.55))`,
                                    opacity: 0.45,
                                }} />
                            {/* Current temp dot */}
                            <div className="absolute top-1/2 w-2 h-2 rounded-full -translate-y-1/2"
                                style={{
                                    left: `calc(${barPct}% - 4px)`,
                                    background: theme.accent,
                                    boxShadow: `0 0 6px ${theme.accent}`,
                                    border: '1px solid rgba(255,255,255,0.5)',
                                }} />
                        </div>
                    </div>
                )}

                {/* Divider */}
                {!isTiny && (
                    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.borderColor}, transparent)` }} />
                )}

                {/* Stats row */}
                <div className="flex items-stretch gap-1.5">
                    <StatItem icon="💧" label="Humid"   value={`${humidity}%`}   accent={theme.accent} statBg={theme.statBg} compact={isCompact} />
                    <StatItem icon="💨" label="Wind"    value={`${windKmh}km/h`} accent={theme.accent} statBg={theme.statBg} compact={isCompact} />
                    <StatItem icon="🌡" label="High"    value={`${tempMax}°`}    accent={theme.accent} statBg={theme.statBg} compact={isCompact} />
                </div>

                {error && (
                    <p className="text-center" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.16)' }}>
                        Cached data
                    </p>
                )}
            </div>
        </div>
    );
}

export default Weather;
