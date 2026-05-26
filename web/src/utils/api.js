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

    if (typeof window !== 'undefined') {
        try {
            const configuredUrl = new URL(configuredBase);
            const editorHost = String(import.meta.env.VITE_EDITOR_HOST || '').trim().toLowerCase();
            const currentHost = String(window.location.hostname || '').trim().toLowerCase();
            const configuredHost = configuredUrl.hostname.toLowerCase();
            const isEditorApi =
                configuredHost === editorHost ||
                configuredHost.startsWith('editor.');
            const isStorefrontHost =
                currentHost &&
                currentHost !== configuredHost &&
                currentHost !== editorHost &&
                !['localhost', '127.0.0.1'].includes(currentHost);

            if (isEditorApi && isStorefrontHost) {
                return window.location.origin.replace(/\/+$/, '');
            }
        } catch {
            // Fall back to the configured API URL below.
        }
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
