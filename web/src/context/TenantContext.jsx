import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBase, getTenantHeaders } from '../utils/api';

const DEFAULT_TENANT = {
    id: 'demo-tenant-id',
    name: 'Sanitarios El Teflon',
};

const DEFAULT_SETTINGS = {
    branding: {
        name: 'Sanitarios El Teflon',
        logo_url: '',
    },
    theme: {
        primary: '#ea580c',
        accent: '#181411',
        background: '#ffffff',
        text: '#181411',
        font_family: 'Inter, sans-serif',
    },
    commerce: {
        currency: 'ARS',
        locale: 'es-AR',
        show_prices: true,
        show_stock: true,
        mode: 'hybrid',
        whatsapp_number: '',
        tax_rate: 0.21,
        shipping_flat: 1500,
        free_shipping_threshold: 999,
    },
};

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(DEFAULT_TENANT);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchTenant = async () => {
            try {
                const response = await fetch(`${getApiBase()}/public/tenant`, {
                    headers: getTenantHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`Tenant request failed: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                setTenant(data.tenant || DEFAULT_TENANT);
                setSettings({
                    branding: data.settings?.branding || DEFAULT_SETTINGS.branding,
                    theme: data.settings?.theme || DEFAULT_SETTINGS.theme,
                    commerce: data.settings?.commerce || DEFAULT_SETTINGS.commerce,
                });
            } catch (err) {
                console.error('Failed to load tenant settings', err);
                if (!active) return;
                setTenant(DEFAULT_TENANT);
                setSettings(DEFAULT_SETTINGS);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchTenant();
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando tienda...</div>;
    }

    return (
        <TenantContext.Provider value={{ tenant, settings }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
