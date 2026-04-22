const DEFAULT_API_BASE = '';

function getStoredTenantId() {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        const rawUser = localStorage.getItem('teflon_user');
        if (!rawUser) return '';
        const parsedUser = JSON.parse(rawUser);
        return String(parsedUser?.tenant_id || parsedUser?.tenantId || '').trim();
    } catch (err) {
        return '';
    }
}

export function getApiBase() {
    const configuredBase = String(import.meta.env.VITE_API_URL || DEFAULT_API_BASE).trim();
    if (!configuredBase) {
        if (typeof window !== 'undefined') {
            return window.location.origin.replace(/\/+$/, '');
        }
        return '';
    }
    return configuredBase.replace(/\/+$/, '');
}

export function getTenantHeaders() {
    const tenantId = String(import.meta.env.VITE_TENANT_ID || '').trim() || getStoredTenantId();
    return tenantId ? { 'X-Tenant-Id': tenantId } : {};
}

export function getAuthHeaders() {
    const token = localStorage.getItem('teflon_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
