const DEFAULT_ADMIN_PANEL_TITLE = 'Panel de administracion';

export const DEFAULT_ADMIN_PANEL_BRANDING = {
    title: DEFAULT_ADMIN_PANEL_TITLE,
    logo_url: '',
};

export const DEFAULT_ADMIN_PANEL_THEME = {
    mode: 'dark',
    accent: '#111111',
    shell_bg: '#050507',
    sidebar_bg: '#0b0b0f',
    panel_bg: '#151519',
    canvas_bg: '#0f1014',
    text: '#ffffff',
    muted_text: '#c6c6cf',
};

export const LIGHT_ADMIN_PANEL_THEME = {
    mode: 'light',
    accent: '#111111',
    shell_bg: '#e4eaf2',
    sidebar_bg: '#ffffff',
    panel_bg: '#ffffff',
    canvas_bg: '#edf2f7',
    text: '#0b1220',
    muted_text: '#334155',
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const LEGACY_BLUE_ACCENTS = new Set(['#6366f1', '#4f46e5']);

const expandHex = (value) => {
    if (!HEX_COLOR_PATTERN.test(value || '')) return null;
    if (value.length === 7) return value.toLowerCase();
    return `#${value.slice(1).split('').map((char) => `${char}${char}`).join('')}`.toLowerCase();
};

const hexToRgbObject = (value) => {
    const normalized = expandHex(value);
    if (!normalized) return null;
    return {
        r: Number.parseInt(normalized.slice(1, 3), 16),
        g: Number.parseInt(normalized.slice(3, 5), 16),
        b: Number.parseInt(normalized.slice(5, 7), 16),
    };
};

export const normalizeHexColor = (value, fallback) => {
    const normalized = expandHex(value);
    return normalized || fallback;
};

const resolveAdminAccent = (value, fallback) => {
    const normalized = normalizeHexColor(value, fallback);
    return LEGACY_BLUE_ACCENTS.has(normalized) ? fallback : normalized;
};

export const toRgba = (value, alpha, fallback = '#ffffff') => {
    const rgb = hexToRgbObject(value) || hexToRgbObject(fallback);
    if (!rgb) return fallback;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const getRelativeChannel = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
};

const getLuminance = (value) => {
    const rgb = hexToRgbObject(value);
    if (!rgb) return 0;
    const r = getRelativeChannel(rgb.r);
    const g = getRelativeChannel(rgb.g);
    const b = getRelativeChannel(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getAdminPanelBranding = (branding = {}) => {
    const panelBranding = branding?.admin_panel || {};
    const companyName =
        (branding?.name || '').trim() ||
        'Empresa';
    const title =
        (panelBranding?.title || '').trim() ||
        companyName ||
        DEFAULT_ADMIN_PANEL_BRANDING.title;

    return {
        companyName,
        title,
        logo_url: panelBranding?.logo_url || branding?.logo_url || '',
    };
};

export const getAdminPanelTheme = (theme = {}) => {
    const panelTheme = theme?.admin_panel || {};
    const nextMode = panelTheme?.mode === 'light' ? 'light' : 'dark';
    const baseTheme = nextMode === 'light' ? LIGHT_ADMIN_PANEL_THEME : DEFAULT_ADMIN_PANEL_THEME;

    return {
        mode: nextMode,
        accent: resolveAdminAccent(panelTheme?.accent, baseTheme.accent),
        shell_bg: normalizeHexColor(panelTheme?.shell_bg, baseTheme.shell_bg),
        sidebar_bg: normalizeHexColor(panelTheme?.sidebar_bg, baseTheme.sidebar_bg),
        panel_bg: normalizeHexColor(panelTheme?.panel_bg, baseTheme.panel_bg),
        canvas_bg: normalizeHexColor(panelTheme?.canvas_bg, baseTheme.canvas_bg),
        text: normalizeHexColor(panelTheme?.text || theme?.text, baseTheme.text),
        muted_text: normalizeHexColor(panelTheme?.muted_text, baseTheme.muted_text),
    };
};

export const buildAdminPanelCssVars = (resolvedTheme) => {
    const baseTheme = resolvedTheme?.mode === 'light' ? LIGHT_ADMIN_PANEL_THEME : DEFAULT_ADMIN_PANEL_THEME;
    const theme = { ...baseTheme, ...resolvedTheme };
    const accentIsLight = getLuminance(theme.accent) > 0.6;

    return {
        '--admin-accent': theme.accent,
        '--admin-shell-bg': theme.shell_bg,
        '--admin-sidebar-bg': theme.sidebar_bg,
        '--admin-panel-bg': theme.panel_bg,
        '--admin-canvas-bg': theme.canvas_bg,
        '--admin-header-bg': toRgba(theme.panel_bg, theme.mode === 'light' ? 0.98 : 0.96, baseTheme.panel_bg),
        '--admin-text': theme.text,
        '--admin-muted': theme.muted_text,
        '--admin-border': toRgba(theme.text, theme.mode === 'light' ? 0.2 : 0.16, baseTheme.text),
        '--admin-border-soft': toRgba(theme.text, theme.mode === 'light' ? 0.15 : 0.1, baseTheme.text),
        '--admin-hover': toRgba(theme.text, theme.mode === 'light' ? 0.075 : 0.1, baseTheme.text),
        '--admin-hover-strong': toRgba(theme.text, theme.mode === 'light' ? 0.12 : 0.16, baseTheme.text),
        '--admin-accent-soft': toRgba(theme.accent, theme.mode === 'light' ? 0.12 : 0.18, baseTheme.accent),
        '--admin-accent-soft-strong': toRgba(theme.accent, theme.mode === 'light' ? 0.18 : 0.28, baseTheme.accent),
        '--admin-accent-border': toRgba(theme.accent, theme.mode === 'light' ? 0.28 : 0.42, baseTheme.accent),
        '--admin-selection': toRgba(theme.accent, 0.3, baseTheme.accent),
        '--admin-accent-contrast': accentIsLight ? '#111111' : '#ffffff',
        '--admin-shadow': toRgba(theme.accent, theme.mode === 'light' ? 0.16 : 0.28, baseTheme.accent),
        '--admin-overlay-top': `linear-gradient(to bottom, ${toRgba(theme.canvas_bg, theme.mode === 'light' ? 0.72 : 0.78, baseTheme.canvas_bg)}, transparent)`,
        '--admin-overlay-bottom': `linear-gradient(to top, ${toRgba(theme.canvas_bg, theme.mode === 'light' ? 0.46 : 0.5, baseTheme.canvas_bg)}, transparent)`,
        '--admin-canvas-grid-dot': toRgba(theme.text, theme.mode === 'light' ? 0.08 : 0.07, baseTheme.text),
    };
};
