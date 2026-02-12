import React, { createContext, useContext, useEffect } from 'react';
import { useTenant } from './TenantContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const { tenant, settings } = useTenant();
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    useEffect(() => {
        const theme = settings?.theme || tenant?.theme || {};
        const mode = theme.mode || (theme.dark_mode ? 'dark' : 'light');
        if (mode === 'dark') {
            setIsDarkMode(true);
        } else if (mode === 'light') {
            setIsDarkMode(false);
        }
        const palette = theme.colors || {};
        const fallbackPalette = {};

        ['primary', 'accent', 'background', 'text'].forEach((key) => {
            if (theme[key]) {
                fallbackPalette[key] = theme[key];
            }
        });
        if (!fallbackPalette.text && theme.secondary) {
            fallbackPalette.text = theme.secondary;
        }

        const colors = { ...fallbackPalette, ...palette };
        const root = document.documentElement;

        Object.entries(colors).forEach(([key, value]) => {
            if (typeof value === 'string') {
                root.style.setProperty(`--color-${key}`, value);
            }
        });

        const fontFamily =
            theme.font_family || theme.fontFamily || theme.typography?.fontFamily;
        if (fontFamily) {
            root.style.setProperty('--font-family', fontFamily);
        }
    }, [settings, tenant]);

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ theme: settings?.theme || tenant?.theme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
