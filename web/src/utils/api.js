const DEFAULT_API_BASE = '';

function getViteEnv() {
    return import.meta.env || {};
}

function getCurrentHostname() {
    if (typeof window === 'undefined') return '';
    return String(window.location.hostname || '').trim().toLowerCase();
}

function getCurrentPathname() {
    if (typeof window === 'undefined') return '';
    return String(window.location.pathname || '').trim().toLowerCase();
}

function getCurrentHost() {
    if (typeof window === 'undefined') return '';
    return String(window.location.host || window.location.hostname || '').trim().toLowerCase();
}

function isLocalHost(hostname = getCurrentHostname()) {
    return ['localhost', '127.0.0.1', '::1'].includes(hostname) || hostname.endsWith('.localhost');
}

function isEditorContext() {
    const hostname = getCurrentHostname();
    const pathname = getCurrentPathname();
    return hostname.startsWith('editor.') || pathname.startsWith('/admin');
}

function getStoredTenantId() {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        // Prioridad 1: Tenant seleccionado explícitamente para gestión
        const activeTenant = localStorage.getItem('teflon_active_tenant');
        if (activeTenant && activeTenant !== 'undefined' && activeTenant !== 'null') {
            return String(activeTenant).trim();
        }

        // Prioridad 2: Tenant asociado al usuario
        const rawUser = localStorage.getItem('teflon_user');
        if (!rawUser) return '';
        const parsedUser = JSON.parse(rawUser);
        const tid = String(parsedUser?.tenant_id || parsedUser?.tenantId || '').trim();
        return (tid === 'undefined' || tid === 'null') ? '' : tid;
    } catch (err) {
        return '';
    }
}

export function getApiBase() {
    const env = getViteEnv();
    const configuredBase = String(env.VITE_API_URL || DEFAULT_API_BASE).trim();
    if (!configuredBase) {
        if (typeof window !== 'undefined') {
            const isLocalVite =
                ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
                ['5173', '5174', '5175'].includes(window.location.port);
            if (isLocalVite) {
                return 'http://localhost:4000';
            }
            return window.location.origin.replace(/\/+$/, '');
        }
        return '';
    }
    return configuredBase.replace(/\/+$/, '');
}

export function getTenantHeaders() {
    const env = getViteEnv();
    const rawEnvId = String(env.VITE_TENANT_ID || '').trim();
    const envId = (rawEnvId === 'undefined' || rawEnvId === 'null') ? '' : rawEnvId;
    const forceEnvTenant = String(env.VITE_FORCE_TENANT_ID || '').trim().toLowerCase() === 'true';
    const allowEnvTenant = Boolean(env.DEV) || isLocalHost() || forceEnvTenant;
    const allowStoredTenant = Boolean(env.DEV) || isLocalHost() || isEditorContext();
    const tenantId = (allowEnvTenant ? envId : '') || (allowStoredTenant ? getStoredTenantId() : '');
    const storefrontHost = !isEditorContext() ? getCurrentHost() : '';
    return {
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
        ...(storefrontHost ? { 'X-Storefront-Host': storefrontHost } : {}),
    };
}

export function getAuthHeaders() {
    const token = localStorage.getItem('teflon_token');
    return {
        ...getTenantHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}
