import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout({ children }) {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={`flex h-screen bg-gray-100 ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1a130c] border-r border-gray-200 dark:border-[#3d2f21] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-[#3d2f21] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_square</span>
                    <h1 className="font-bold text-lg dark:text-white">Editor visual</h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Páginas
                    </div>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg bg-primary/10 text-primary font-medium">
                        <span className="material-symbols-outlined text-sm">home</span>
                        Inicio
                    </button>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2116] text-gray-600 dark:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                        Catálogo
                    </button>

                    <div className="mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Configuración
                    </div>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2116] text-gray-600 dark:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-sm">palette</span>
                        Apariencia
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-[#3d2f21]">
                    <button
                        onClick={() => (window.location.hash = '#')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-4"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Volver a la tienda
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full p-2 rounded-lg bg-gray-50 dark:bg-[#2c2116] text-sm text-gray-600 dark:text-gray-300"
                    >
                        <span>Modo oscuro</span>
                        <span className="material-symbols-outlined text-sm">
                            {isDarkMode ? 'toggle_on' : 'toggle_off'}
                        </span>
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
                        <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            Descartar
                        </button>
                        <button className="px-3 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm">
                            Publicar cambios
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#0f0f0f] p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
