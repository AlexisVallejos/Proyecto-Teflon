import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-background-dark text-white pt-16 pb-8">
            <div className="mx-auto max-w-[1280px] px-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-8">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 text-primary mb-6">
                            <span className="material-symbols-outlined text-3xl">
                                plumbing
                            </span>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                                El Teflon
                            </h2>
                        </div>

                        <p className="text-white/60 mb-6 leading-relaxed">
                            Leading provider of sanitary and hardware solutions in Mar
                            del Plata since 1995. Quality you can trust.
                        </p>

                        <div className="flex gap-4">
                            <a
                                className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary transition-colors"
                                href="#"
                                aria-label="Facebook"
                            >
                                <svg
                                    className="w-5 h-5 fill-current"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary transition-colors"
                                href="#"
                                aria-label="Instagram"
                            >
                                <svg
                                    className="w-5 h-5 fill-current"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4 text-white/60">
                            <li>
                                <a className="hover:text-primary transition-colors" href="#">
                                    Our Products
                                </a>
                            </li>
                            <li>
                                <a className="hover:text-primary transition-colors" href="#">
                                    Installation Guide
                                </a>
                            </li>
                            <li>
                                <a className="hover:text-primary transition-colors" href="#">
                                    Shipping Policy
                                </a>
                            </li>
                            <li>
                                <a className="hover:text-primary transition-colors" href="#">
                                    Bulk Orders
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4 text-white/60">
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">
                                    location_on
                                </span>
                                <span>Av. Juan B. Justo 1234, Mar del Plata</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">
                                    call
                                </span>
                                <span>+54 223 123-4567</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">
                                    mail
                                </span>
                                <span>ventas@elteflon.com</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">WhatsApp Support</h4>
                        <p className="text-white/60 mb-4">
                            Chat directly with our sales team for quick quotes.
                        </p>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#25D366] text-white font-bold hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Message Us
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center text-white/40 text-sm">
                    <p>© 2024 Sanitarios El Teflon. All rights reserved.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a className="hover:text-white transition-colors" href="#">
                            Privacy Policy
                        </a>
                        <a className="hover:text-white transition-colors" href="#">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
