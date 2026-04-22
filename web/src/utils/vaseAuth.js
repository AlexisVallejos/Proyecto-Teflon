const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const joinUrl = (base, path) => {
    const normalizedBase = normalizeUrl(base);
    const normalizedPath = String(path || '').trim();
    if (!normalizedBase) return '';
    if (!normalizedPath) return normalizedBase;
    return `${normalizedBase}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
};

const buildConfiguredUrl = (specificUrl, fallbackPath) => {
    const directUrl = normalizeUrl(specificUrl);
    const baseUrl = normalizeUrl(import.meta.env.VITE_VASE_APP_URL);
    const targetUrl = directUrl || joinUrl(baseUrl, fallbackPath);
    if (!targetUrl) return '';

    const redirectParam = String(import.meta.env.VITE_VASE_APP_REDIRECT_PARAM || '').trim();
    const redirectTarget = normalizeUrl(import.meta.env.VITE_VASE_APP_REDIRECT_URL);
    if (!redirectParam || !redirectTarget) {
        return targetUrl;
    }

    try {
        const url = new URL(targetUrl);
        url.searchParams.set(redirectParam, redirectTarget);
        return url.toString();
    } catch (err) {
        return targetUrl;
    }
};

export const getExternalLoginUrl = () =>
    buildConfiguredUrl(import.meta.env.VITE_VASE_APP_LOGIN_URL, '/login');

export const getExternalSignupUrl = () =>
    buildConfiguredUrl(import.meta.env.VITE_VASE_APP_SIGNUP_URL, '/register');

export const isExternalAuthEnabled = () => {
    const externalAuthFlag = String(import.meta.env.VITE_EXTERNAL_AUTH || '').trim().toLowerCase();
    const hasExternalTargets = Boolean(getExternalLoginUrl() || getExternalSignupUrl());
    if (TRUTHY_VALUES.has(externalAuthFlag)) {
        return hasExternalTargets;
    }

    return hasExternalTargets;
};
