export const DEFAULT_STOREFRONT_LIGHT_THEME = {
    mode: 'light',
    primary: '#111111',
    accent: '#111111',
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
    primary: '#111111',
    accent: '#f5f5f5',
    background: '#09090b',
    text: '#f5f5f5',
    secondary: '#a1a1aa',
    font_family: 'Inter, sans-serif',
    catalog: {
        shell_bg: '#09090b',
        panel_bg: '#111113',
        surface_bg: '#0c0c0e',
        card_bg: '#111113',
        border: '#27272a',
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
