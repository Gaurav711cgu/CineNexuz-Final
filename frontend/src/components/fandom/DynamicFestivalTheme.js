import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const FestivalThemeProvider = ({ children }) => {
    // CUSTOMER POV: Static dark mode is boring. Fans love events. 
    // This dynamically injects CSS variables to theme the entire app 
    // based on active "Festivals" (e.g., Dune release week = Arrakis theme).
    const [activeFestival, setActiveFestival] = useState('default');

    const festivals = {
        default: {
            '--bg-primary': '#0f172a', // Slate 900
            '--accent': '#3b82f6', // Blue 500
            '--particle-fx': 'none'
        },
        cyberpunk: {
            '--bg-primary': '#000000',
            '--accent': '#facc15', // Neon Yellow
            '--text-glow': '0 0 10px #facc15, 0 0 20px #facc15',
            '--particle-fx': 'glitch-rain'
        },
        high_fantasy: {
            '--bg-primary': '#1e293b',
            '--accent': '#d97706', // Amber/Gold
            '--font-family': '"Cinzel", serif',
            '--particle-fx': 'ember-sparks'
        }
    };

    useEffect(() => {
        const root = document.documentElement;
        const theme = festivals[activeFestival];
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }, [activeFestival]);

    return (
        <ThemeContext.Provider value={{ activeFestival, setActiveFestival }}>
            <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-1000">
                {/* Simulated Particle Layer based on theme */}
                {activeFestival === 'high_fantasy' && <div className="absolute inset-0 pointer-events-none ember-overlay animate-pulse-slow opacity-30"></div>}
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useFestivalTheme = () => useContext(ThemeContext);
