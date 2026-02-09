import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function StoreLayout({ children }) {
    const navLinks = [
        { label: 'Inicio', href: '/' },
        { label: 'Catalogo', href: '/catalog' },
        { label: 'Ofertas', href: '/#ofertas' },
        { label: 'Sobre nosotros', href: '/about' },
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark font-[var(--font-family)] text-[color:var(--color-text,#181411)] dark:text-[#f8f7f5] min-h-screen flex flex-col">
            <Header navLinks={navLinks} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
