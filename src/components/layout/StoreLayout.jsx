import React, { useMemo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function StoreLayout({ children }) {
    const [search, setSearch] = useState("");

    const navLinks = useMemo(
        () => ["Sanitarios", "Grifería", "Accesorios", "Amoblamientos"],
        []
    );

    return (
        <div className="bg-background-light dark:bg-background-dark font-[Inter] text-[#181411] dark:text-[#f8f7f5] min-h-screen flex flex-col">
            <Header search={search} setSearch={setSearch} navLinks={navLinks} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
