export const DEFAULT_STOREFRONT_LIGHT_THEME = {
    mode: 'light',
    primary: '#ea580c',
    accent: '#ea580c',
    background: '#f8fafc',
    text: '#111827',
    secondary: '#64748b',
    font_family: 'Inter, sans-serif',
    catalog: {
        panel_bg: '#ffffff',
        surface_bg: '#ffffff',
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
        panel_bg: '#ffffff',
        surface_bg: '#ffffff',
        card_bg: '#ffffff',
        border: '#3d2f21',
        muted_text: '#a1a1aa',
    },
};

export const getCatalogThemePreset = (mode, currentTheme = {}) => {
    const preset = mode === 'dark' ? DEFAULT_STOREFRONT_DARK_THEME.catalog : DEFAULT_STOREFRONT_LIGHT_THEME.catalog;
    const overrides = (currentTheme?.catalog && typeof currentTheme.catalog === 'object') ? currentTheme.catalog : {};
    return { ...preset, ...overrides };
};

export const getStorefrontThemePreset = (mode, currentTheme = {}) => {
    const preset = mode === 'light' ? DEFAULT_STOREFRONT_LIGHT_THEME : DEFAULT_STOREFRONT_DARK_THEME;
    return {
        ...preset,
        ...currentTheme,
        mode,
        font_family: currentTheme?.font_family || currentTheme?.fontFamily || preset.font_family,
        catalog: getCatalogThemePreset(mode, currentTheme),
    };
};
