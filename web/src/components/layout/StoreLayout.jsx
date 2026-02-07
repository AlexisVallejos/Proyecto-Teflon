import React, { useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useTenant } from '../../context/TenantContext';

export default function StoreLayout({ children }) {
    const { settings } = useTenant();
    const navLinks = settings?.branding?.navbar?.links || [];

    return (
        <div className="bg-background-light dark:bg-background-dark font-[var(--font-family)] text-[#181411] dark:text-[#f8f7f5] min-h-screen flex flex-col">
            <Header navLinks={navLinks} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
