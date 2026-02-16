import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useStore } from '../../context/StoreContext';

export default function StoreLayout({ children }) {
    const { toast } = useStore();
    const navLinks = [
        { label: 'Inicio', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Ofertas', href: '/#ofertas' },
        { label: 'Sobre nosotros', href: '/about' },
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark font-[var(--font-family)] text-[color:var(--color-text,#181411)] dark:text-[#f8f7f5] min-h-screen flex flex-col">
            <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ease-out ${toast?.show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-green-400">
                    <div className="bg-white/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tight leading-none">¡Excelente!</p>
                        <p className="text-sm font-bold text-green-50 text-nowrap">{toast?.message}</p>
                    </div>
                </div>
            </div>
            <Header navLinks={navLinks} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
