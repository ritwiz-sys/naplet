import { createContext, useContext, useState, useEffect, useRef } from 'react';

const SettingsContext = createContext(null);

const DEFAULTS = {
    notifications: false,
    sounds:        false,
    compactMode:   false,
    accentColor:   'indigo',   // 'indigo' | 'violet' | 'cyan' | 'rose'
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('naplet_settings');
            return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
        } catch {
            return DEFAULTS;
        }
    });

    // Ambient audio refs
    const audioCtxRef = useRef(null);
    const sourceRef   = useRef(null);
    const gainRef     = useRef(null);

    // Persist on change
    useEffect(() => {
        localStorage.setItem('naplet_settings', JSON.stringify(settings));
    }, [settings]);

    // Apply compact class to root
    useEffect(() => {
        const root = document.getElementById('root');
        if (!root) return;
        if (settings.compactMode) root.classList.add('naplet-compact');
        else root.classList.remove('naplet-compact');
    }, [settings.compactMode]);

    // Manage ambient audio
    useEffect(() => {
        if (settings.sounds) startAmbient();
        else stopAmbient();
        return () => stopAmbient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.sounds]);

    const startAmbient = () => {
        try {
            if (audioCtxRef.current) return;
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = ctx;

            // Brown noise (relaxing lo-fi hiss)
            const sampleRate = ctx.sampleRate;
            const bufferSize = sampleRate * 4;
            const buffer     = ctx.createBuffer(1, bufferSize, sampleRate);
            const data       = buffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i]     = (lastOut + 0.02 * white) / 1.02;
                lastOut     = data[i];
                data[i]    *= 3.5;
            }

            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop   = true;
            sourceRef.current = src;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 1.5);
            gainRef.current = gain;

            src.connect(gain);
            gain.connect(ctx.destination);
            src.start();
        } catch (e) {
            console.warn('[NAPLET] Ambient audio unavailable:', e.message);
        }
    };

    const stopAmbient = () => {
        try {
            if (gainRef.current && audioCtxRef.current) {
                gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.8);
            }
            setTimeout(() => {
                sourceRef.current?.stop?.();
                audioCtxRef.current?.close?.();
                audioCtxRef.current = null;
                sourceRef.current   = null;
                gainRef.current     = null;
            }, 900);
        } catch (_) {}
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        // Side effects
        if (key === 'notifications' && value) {
            if ('Notification' in window && Notification.permission !== 'granted') {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                        new Notification('NAPLET 🔔', {
                            body: "Notifications enabled! We'll remind you about habits and goals.",
                            icon: '/favicon.ico',
                        });
                    }
                });
            } else if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('NAPLET 🔔', {
                    body: "Daily reminders are on! Stay consistent. 💪",
                    icon: '/favicon.ico',
                });
            }
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
    return ctx;
};
