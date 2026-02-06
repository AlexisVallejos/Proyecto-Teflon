import React, { useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function StoreLayout({ children }) {
    const navLinks = useMemo(
        () => ["Sanitarios", "Grifería", "Accesorios", "Amoblamientos"],
        []
    );

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
