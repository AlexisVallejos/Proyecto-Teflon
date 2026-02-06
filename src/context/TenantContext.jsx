import React, { createContext, useContext, useState, useEffect } from 'react';

// Default config for development/fallback
const DEFAULT_TENANT = {
    id: 'demo-tenant-id',
    name: 'Demo Hardware Store',
    subdomain: 'demo',
    theme: {
        colors: {
            primary: '#ea580c', // orange-600
            accent: '#181411',
            background: '#ffffff',
            text: '#181411'
        },
        typography: {
            fontFamily: 'Inter, sans-serif'
        },
        borderRadius: '0.5rem'
    },
    settings: {
        currency: 'USD',
        showPrices: true,
        showStock: true
    }
};

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch based on subdomain
        const fetchTenant = async () => {
            // In production, this would parse window.location.hostname
            // and call /api/public/config
            setTimeout(() => {
                console.log('Tenant resolved:', DEFAULT_TENANT);
                setTenant(DEFAULT_TENANT);
                setLoading(false);
            }, 500);
        };

        fetchTenant();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Store...</div>;
    }

    return (
        <TenantContext.Provider value={tenant}>
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
