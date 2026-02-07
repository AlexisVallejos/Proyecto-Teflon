import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { navigate } from '../../utils/navigation';

export default function AdminLayout({ children }) {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={`flex h-screen bg-gray-100 ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1a130c] border-r border-gray-200 dark:border-[#3d2f21] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-[#3d2f21] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <h1 className="font-bold text-lg dark:text-white">Editor visual</h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Páginas
                    </div>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg bg-primary/10 text-primary font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        Inicio
                    </button>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2116] text-gray-600 dark:text-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
                        Catálogo
                    </button>

                    <div className="mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Configuración
                    </div>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2116] text-gray-600 dark:text-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.644-.438-1.125 0-.927.758-1.688 1.688-1.688h1.952c2.312 0 4.587-2.236 4.587-4.75C22 6.5 17.5 2 12 2z"></path></svg>
                        Apariencia
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-[#3d2f21]">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Volver a la tienda
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full p-2 rounded-lg bg-gray-50 dark:bg-[#2c2116] text-sm text-gray-600 dark:text-gray-300"
                    >
                        <span>Modo oscuro</span>
                        <div className="text-primary">
                            {isDarkMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="16" cy="12" r="3" fill="currentColor"></circle></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>
                            )}
                        </div>
                    </button>
                </div>
            </aside>

            {/* Área de vista previa */}
            <main className="flex-1 overflow-hidden flex flex-col relative">
                <header className="h-14 bg-white dark:bg-[#1a130c] border-b border-gray-200 dark:border-[#3d2f21] flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#2c2116] text-xs font-mono text-gray-500">
                            Modo edición
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status indicators can go here */}
                    </div>
                </header>

                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#0f0f0f] p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
