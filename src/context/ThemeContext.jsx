import React, { createContext, useContext, useEffect } from 'react';
import { useTenant } from './TenantContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const tenant = useTenant();
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    useEffect(() => {
        if (tenant?.theme?.colors) {
            const root = document.documentElement;
            Object.entries(tenant.theme.colors).forEach(([key, value]) => {
                root.style.setProperty(`--color-${key}`, value);
            });
        }
    }, [tenant]);

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ theme: tenant.theme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
