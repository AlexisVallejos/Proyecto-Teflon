import React, { createContext, useContext, useEffect } from 'react';
import { useTenant } from './TenantContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const { tenant, settings } = useTenant();

    useEffect(() => {
        const theme = settings?.theme || tenant?.theme || {};
        const palette = theme.colors || {};
        const fallbackPalette = {};
        const root = document.documentElement;

        root.classList.remove('dark');
        document.body?.classList?.remove('dark');

        ['primary', 'accent', 'background', 'text'].forEach((key) => {
            if (theme[key]) {
                fallbackPalette[key] = theme[key];
            }
        });
        if (!fallbackPalette.text && theme.secondary) {
            fallbackPalette.text = theme.secondary;
        }

        const colors = { ...fallbackPalette, ...palette };

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

    const themeValue = settings?.theme || tenant?.theme || {};

    return (
        <ThemeContext.Provider value={{ theme: themeValue }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
