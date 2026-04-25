export const DEFAULT_STOREFRONT_LIGHT_THEME = {
    mode: 'light',
    primary: '#ea580c',
    accent: '#ea580c',
    background: '#f8fafc',
    text: '#111827',
    secondary: '#64748b',
    font_family: 'Inter, sans-serif',
    catalog: {
        shell_bg: '#f1f5f9',
        panel_bg: '#ffffff',
        surface_bg: '#f8fafc',
        card_bg: '#ffffff',
        border: '#e2e8f0',
        muted_text: '#64748b',
    },
};

export const DEFAULT_STOREFRONT_DARK_THEME = {
    mode: 'dark',
    primary: '#ea580c',
    accent: '#ea580c',
    background: '#120c08',
    text: '#f5f5f5',
    secondary: '#a1a1aa',
    font_family: 'Inter, sans-serif',
    catalog: {
        shell_bg: '#120c08',
        panel_bg: '#1a130c',
        surface_bg: '#2c2116',
        card_bg: '#2d2218',
        border: '#3d2f21',
        muted_text: '#a1a1aa',
    },
};

export const getCatalogThemePreset = (mode, currentTheme = {}) => {
    const preset = mode === 'dark' ? DEFAULT_STOREFRONT_DARK_THEME.catalog : DEFAULT_STOREFRONT_LIGHT_THEME.catalog;
    return { ...preset };
};

export const getStorefrontThemePreset = (mode, currentTheme = {}) => {
    const preset = mode === 'light' ? DEFAULT_STOREFRONT_LIGHT_THEME : DEFAULT_STOREFRONT_DARK_THEME;
    return {
        ...preset,
        mode,
        font_family: currentTheme?.font_family || currentTheme?.fontFamily || preset.font_family,
        catalog: getCatalogThemePreset(mode),
    };
};
