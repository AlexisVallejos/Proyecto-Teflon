const DEFAULT_API_BASE = '';

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
    const rawEnvId = String(import.meta.env.VITE_TENANT_ID || '').trim();
    const envId = (rawEnvId === 'undefined' || rawEnvId === 'null') ? '' : rawEnvId;
    const tenantId = envId || getStoredTenantId();
    return tenantId ? { 'X-Tenant-Id': tenantId } : {};
}

export function getAuthHeaders() {
    const token = localStorage.getItem('teflon_token');
    return {
        ...getTenantHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}
