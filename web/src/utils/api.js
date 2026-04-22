const DEFAULT_API_BASE = '';

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
    const tenantId = import.meta.env.VITE_TENANT_ID;
    return tenantId ? { 'X-Tenant-Id': tenantId } : {};
}

export function getAuthHeaders() {
    const token = localStorage.getItem('teflon_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
