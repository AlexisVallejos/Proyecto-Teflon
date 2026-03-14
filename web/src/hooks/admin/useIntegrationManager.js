import { useCallback, useState } from 'react';

import { getApiBase, getTenantHeaders } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export const useIntegrationManager = () => {
    const { addToast } = useToast();
    const [manifest, setManifest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rotatingToken, setRotatingToken] = useState(false);

    const buildHeaders = useCallback(() => {
        const token = localStorage.getItem('teflon_token');
        return {
            ...getTenantHeaders(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }, []);

    const loadManifest = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getApiBase()}/tenant/integrations/product-sync`, {
                headers: buildHeaders(),
            });
            if (!res.ok) {
                throw new Error('integration_manifest_failed');
            }
            const data = await res.json();
            setManifest(data);
            return data;
        } catch (err) {
            console.error('Failed to load integration manifest', err);
            addToast('No se pudo cargar la integracion ERP', 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [addToast, buildHeaders]);

    const rotateToken = useCallback(async (name = 'ERP Sync') => {
        setRotatingToken(true);
        try {
            const res = await fetch(`${getApiBase()}/tenant/integrations/product-sync/token/rotate`, {
                method: 'POST',
                headers: {
                    ...buildHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                throw new Error('integration_token_rotate_failed');
            }
            const data = await res.json();
            setManifest(data);
            addToast('Token de integracion regenerado', 'success');
            return data;
        } catch (err) {
            console.error('Failed to rotate integration token', err);
            addToast('No se pudo regenerar el token', 'error');
            throw err;
        } finally {
            setRotatingToken(false);
        }
    }, [addToast, buildHeaders]);

    return {
        manifest,
        loading,
        rotatingToken,
        loadManifest,
        rotateToken,
    };
};

export default useIntegrationManager;
