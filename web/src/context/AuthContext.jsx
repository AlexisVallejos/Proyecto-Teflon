import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBase, getTenantHeaders } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('teflon_user');
        const token = localStorage.getItem('teflon_token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${getApiBase()}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, tenant_id: import.meta.env.VITE_TENANT_ID }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('teflon_token', data.token);
        localStorage.setItem('teflon_user', JSON.stringify(data.user));
        return data;
    };

    const signup = async (email, password, role) => {
        const response = await fetch(`${getApiBase()}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                role,
                tenant_id: import.meta.env.VITE_TENANT_ID
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
        }

        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('teflon_token', data.token);
        localStorage.setItem('teflon_user', JSON.stringify(data.user));
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('teflon_token');
        localStorage.removeItem('teflon_user');
    };

    const isWholesale = user?.role === 'wholesale';
    const isAdmin = user?.role === 'tenant_admin' || user?.role === 'master_admin';

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isWholesale, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
