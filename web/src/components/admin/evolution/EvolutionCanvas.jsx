import React, { useEffect, useMemo, useRef, useState } from 'react';
import useEvolutionStore from '../../../store/useEvolutionStore';
import { useAuth } from '../../../context/AuthContext';
import { navigate } from '../../../utils/navigation';
import {
    MagnifyingGlass as Search,
    Bell,
    User,
    ArrowsOut as FocusOn,
    ArrowsIn as FocusOff,
    CaretDown,
    SignOut,
} from '@phosphor-icons/react';

const iconButtonStyle = {
    backgroundColor: 'transparent',
    color: 'var(--admin-muted)',
};

const EvolutionCanvas = ({ children, branding }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const { user, logout } = useAuth();
    const {
        activeModule,
        isSidebarCollapsed,
        isInspectorOpen,
        setSidebarCollapsed,
        setInspectorOpen,
    } = useEvolutionStore();

    const isLegacy = ['legacy'].includes(activeModule);
    const isStorefrontEditing = [
        'home',
        'about',
        'catalog',
        'catalog_live',
        'design_live',
    ].includes(activeModule);
    const isClientFocusMode = isStorefrontEditing && isSidebarCollapsed && !isInspectorOpen;
    const canvasPaddingClass = isLegacy ? 'p-0' : (isStorefrontEditing ? 'p-3 md:p-4' : 'p-8');
    const contentWidthClass = isLegacy || isStorefrontEditing ? 'mx-0 max-w-none' : 'max-w-7xl mx-auto';
    const adminTitle = branding?.title || 'Panel de administracion';
    const companyName = branding?.companyName || adminTitle;
    const profileName = user?.name || user?.email || 'Administrador';
    const profileEmail = user?.email || '';
    const profileRole = user?.role === 'master_admin' ? 'Master admin' : 'Admin';
    const profileInitials = useMemo(() => {
        const source = String(profileName || 'A').trim();
        if (!source) return 'A';
        const parts = source.split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    }, [profileName]);

    useEffect(() => {
        if (!isProfileMenuOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!profileMenuRef.current?.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isProfileMenuOpen]);

    const toggleClientFocusMode = () => {
        if (isClientFocusMode) {
            setSidebarCollapsed(false);
            setInspectorOpen(true);
            return;
        }
        setSidebarCollapsed(true);
        setInspectorOpen(false);
    };

    const handleLogout = () => {
        setIsProfileMenuOpen(false);
        logout();
        navigate('/login');
    };

    return (
        <main className="admin-canvas-surface relative flex flex-1 flex-col overflow-hidden">
            <header className="admin-header-surface sticky top-0 z-40 flex h-14 items-center justify-between border-b px-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] admin-accent-text">
                            {companyName}
                        </p>
                        <h1 className="text-sm font-medium capitalize tracking-wide admin-text-primary">
                            {activeModule}
                        </h1>
                    </div>
                    <div className="h-4 w-px" style={{ backgroundColor: 'var(--admin-border)' }} />
                    <div className="flex items-center gap-2 text-[11px] font-mono admin-text-muted">
                        <span>PANEL</span>
                        <span>/</span>
                        <span className="admin-text-primary">SESSION_ACTIVE</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isStorefrontEditing ? (
                        <button
                            type="button"
                            onClick={toggleClientFocusMode}
                            style={{
                                backgroundColor: 'var(--admin-hover)',
                                borderColor: 'var(--admin-border)',
                                color: 'var(--admin-text)',
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                        >
                            {isClientFocusMode ? <FocusOff size={14} weight="bold" /> : <FocusOn size={14} weight="bold" />}
                            {isClientFocusMode ? 'Editar' : 'Ver cliente'}
                        </button>
                    ) : null}

                    <button
                        style={iconButtonStyle}
                        className="admin-hover-surface flex h-8 w-8 items-center justify-center rounded-full"
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    <button
                        style={iconButtonStyle}
                        className="admin-hover-surface relative flex h-8 w-8 items-center justify-center rounded-full"
                    >
                        <Bell className="h-4 w-4" />
                        <span
                            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--admin-accent)', boxShadow: '0 0 12px var(--admin-shadow)' }}
                        />
                    </button>

                    <div className="relative" ref={profileMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsProfileMenuOpen((current) => !current)}
                            style={{
                                backgroundColor: 'var(--admin-hover)',
                                borderColor: 'var(--admin-border)',
                                color: 'var(--admin-text)',
                            }}
                            className="flex h-9 items-center gap-2 rounded-full border pl-1.5 pr-2 transition-colors hover:opacity-90"
                        >
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, var(--admin-panel-bg), var(--admin-sidebar-bg))',
                                    borderColor: 'var(--admin-border)',
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold"
                            >
                                {profileInitials}
                            </div>
                            <CaretDown
                                size={12}
                                weight="bold"
                                className={`transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isProfileMenuOpen ? (
                            <div
                                style={{
                                    backgroundColor: 'var(--admin-panel-bg)',
                                    borderColor: 'var(--admin-border)',
                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
                                }}
                                className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl border p-2"
                            >
                                <div
                                    style={{ backgroundColor: 'var(--admin-hover)' }}
                                    className="rounded-xl px-3 py-3"
                                >
                                    <p className="truncate text-sm font-semibold admin-text-primary">{profileName}</p>
                                    {profileEmail ? (
                                        <p className="mt-0.5 truncate text-xs admin-text-muted">{profileEmail}</p>
                                    ) : null}
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] admin-accent-text">
                                        {profileRole}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                                >
                                    <SignOut size={16} weight="bold" />
                                    Cerrar sesion
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </header>

            <div className={`evolution-canvas custom-scrollbar flex-1 overflow-auto ${canvasPaddingClass}`}>
                <div className={`${contentWidthClass} min-h-full transition-all duration-300`}>
                    {children}
                </div>
            </div>

            <div
                className="pointer-events-none absolute left-0 top-0 h-32 w-full"
                style={{ background: 'var(--admin-overlay-top)' }}
            />
            <div
                className="pointer-events-none absolute bottom-0 left-0 h-32 w-full"
                style={{ background: 'var(--admin-overlay-bottom)' }}
            />
        </main>
    );
};

export default EvolutionCanvas;
