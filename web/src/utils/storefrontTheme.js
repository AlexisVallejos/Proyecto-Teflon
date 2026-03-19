export const DEFAULT_STOREFRONT_LIGHT_THEME = {
    mode: 'light',
    primary: '#f97316',
    accent: '#181411',
    background: '#ffffff',
    text: '#181411',
    secondary: '#6b7280',
    font_family: 'Inter, sans-serif',
};

export const DEFAULT_STOREFRONT_DARK_THEME = {
    mode: 'dark',
    primary: '#f97316',
    accent: '#cbd5e1',
    background: '#090b0f',
    text: '#e6edf7',
    secondary: '#97a3b6',
    font_family: 'Inter, sans-serif',
};

export const getStorefrontThemePreset = (mode, currentTheme = {}) => {
    const preset = mode === 'light' ? DEFAULT_STOREFRONT_LIGHT_THEME : DEFAULT_STOREFRONT_DARK_THEME;
    return {
        ...preset,
        primary: currentTheme?.primary || preset.primary,
        font_family: currentTheme?.font_family || currentTheme?.fontFamily || preset.font_family,
    };
};
