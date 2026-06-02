import React from 'react';
import {
    HouseLine,
    ShoppingBag,
    Users,
    Tag,
    CaretLeft,
    CaretRight,
    Palette,
    Command,
    CreditCard,
    Percent,
    Plug,
    Bell,
    Truck,
} from '@phosphor-icons/react';
import useEvolutionStore from '../../../store/useEvolutionStore';
import { cn } from '../../../utils/cn';

const getPanelInitial = (title = '') => {
    const safeTitle = title.trim();
    return safeTitle ? safeTitle.charAt(0).toUpperCase() : 'E';
};

const SidebarItem = ({ icon: Icon, label, shortLabel, active, onClick, collapsed }) => (
    <button
        onClick={onClick}
        style={active ? { backgroundColor: 'var(--admin-accent-soft)', color: 'var(--admin-accent)' } : undefined}
        className={cn(
            'admin-hover-surface group relative flex w-full items-center rounded-xl border border-transparent transition-all duration-200',
            collapsed ? 'min-h-[62px] flex-col justify-center gap-1.5 px-2 py-2 text-center' : 'min-h-[46px] px-3 py-2.5',
            active ? 'border border-transparent' : 'border border-transparent admin-text-muted'
        )}
        title={collapsed ? label : undefined}
    >
        <Icon
            size={collapsed ? 21 : 20}
            weight={active ? 'bold' : 'regular'}
            className={cn('shrink-0 transition-transform', active && 'scale-110')}
        />
        {!collapsed ? (
            <span className="ml-3 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-200 group-hover:translate-x-1">
                {label}
            </span>
        ) : (
            <span className="max-w-[78px] overflow-hidden text-ellipsis text-[10px] font-bold leading-tight tracking-tight">
                {shortLabel || label}
            </span>
        )}
    </button>
);

const EvolutionSidebar = ({ branding }) => {
    const {
        activeModule,
        setActiveModule,
        isSidebarCollapsed,
        toggleSidebar,
    } = useEvolutionStore();

    const modules = [
        { id: 'home', label: 'Inicio', shortLabel: 'Inicio', icon: HouseLine },
        { id: 'about', label: 'Sobre nosotros', shortLabel: 'Nosotros', icon: Users },
        { id: 'appearance', label: 'Apariencia', shortLabel: 'Apar.', icon: Palette },
        { id: 'catalog', label: 'Catalogo', shortLabel: 'Catalogo', icon: ShoppingBag },
        { id: 'categories', label: 'Categorias', shortLabel: 'Categorias', icon: Tag },
        { id: 'pricing', label: 'Ofertas', shortLabel: 'Ofertas', icon: Percent },
        { id: 'checkout', label: 'Checkout', shortLabel: 'Checkout', icon: CreditCard },
        { id: 'shipping', label: 'Envios', shortLabel: 'Envios', icon: Truck },
        { id: 'notifications', label: 'Notificaciones', shortLabel: 'Alertas', icon: Bell },
        { id: 'integrations', label: 'Integraciones', shortLabel: 'Integr.', icon: Plug },
        { id: 'users', label: 'Usuarios', shortLabel: 'Usuarios', icon: Users },
    ];

    const panelTitle = branding?.title || 'Panel de administracion';
    const companyName = branding?.companyName || 'Empresa';
    const panelInitial = getPanelInitial(panelTitle);
    const panelLogo = branding?.logo_url || '';

    return (
        <>
            <aside
                className={cn(
                    'admin-sidebar-surface hidden md:flex h-screen flex-col border-r transition-all duration-300 ease-in-out shrink-0',
                    isSidebarCollapsed ? 'w-[104px]' : 'w-[272px]'
                )}
            >
                <div className={cn('flex items-center justify-between border-b p-4', isSidebarCollapsed && 'justify-center px-3')} style={{ borderColor: 'var(--admin-border)' }}>
                    {!isSidebarCollapsed ? (
                        <div className="flex min-w-0 items-center gap-3">
                            <div
                                style={{
                                    backgroundColor: panelLogo ? 'rgba(255,255,255,0.96)' : 'var(--admin-accent)',
                                    color: 'var(--admin-accent-contrast)',
                                    boxShadow: '0 0 24px var(--admin-shadow)',
                                }}
                                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                            >
                                {panelLogo ? (
                                    <img src={panelLogo} alt={panelTitle} className="h-8 w-8 object-contain" />
                                ) : (
                                    <span className="text-sm font-black">{panelInitial}</span>
                                )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                                <p className="truncate text-[11px] font-bold uppercase tracking-[0.22em] admin-accent-text">
                                    {companyName}
                                </p>
                                <p className="truncate text-sm font-semibold admin-text-primary">{panelTitle}</p>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: panelLogo ? 'rgba(255,255,255,0.96)' : 'var(--admin-accent)',
                                color: 'var(--admin-accent-contrast)',
                                boxShadow: '0 0 24px var(--admin-shadow)',
                            }}
                            className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl"
                        >
                            {panelLogo ? (
                                <img src={panelLogo} alt={panelTitle} className="h-7 w-7 object-contain" />
                            ) : (
                                <span className="text-sm font-black">{panelInitial}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className={cn('custom-scrollbar flex-1 space-y-1.5 overflow-y-auto py-3', isSidebarCollapsed ? 'px-2' : 'px-3')}>
                    {modules.map((module) => (
                        <SidebarItem
                            key={module.id}
                            icon={module.icon}
                            label={module.label}
                            shortLabel={module.shortLabel}
                            active={activeModule === module.id}
                            onClick={() => setActiveModule(module.id)}
                            collapsed={isSidebarCollapsed}
                        />
                    ))}
                </div>

                <div className={cn('space-y-1.5 border-t p-3', isSidebarCollapsed && 'px-2')} style={{ borderColor: 'var(--admin-border)' }}>
                    <button
                        className={cn(
                            'admin-hover-surface group flex w-full items-center rounded-xl admin-text-muted',
                            isSidebarCollapsed ? 'min-h-[56px] flex-col justify-center gap-1 px-2 py-2' : 'p-3'
                        )}
                        onClick={() => { }}
                        title={isSidebarCollapsed ? 'Comandos' : undefined}
                    >
                        <Command size={isSidebarCollapsed ? 20 : 20} weight="regular" />
                        {!isSidebarCollapsed ? (
                            <div className="ml-3 flex flex-1 items-center justify-between">
                                <span className="text-sm font-medium">Comandos</span>
                                <span
                                    style={{
                                        backgroundColor: 'var(--admin-hover)',
                                        borderColor: 'var(--admin-border)',
                                    }}
                                    className="rounded border px-1.5 py-0.5 text-[10px] text-zinc-400"
                                >
                                    Ctrl+K
                                </span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold leading-tight">Ctrl K</span>
                        )}
                    </button>

                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            'admin-hover-surface flex w-full items-center rounded-xl admin-text-muted',
                            isSidebarCollapsed ? 'min-h-[52px] flex-col justify-center gap-1 px-2 py-2' : 'p-3'
                        )}
                        title={isSidebarCollapsed ? 'Expandir menu' : undefined}
                    >
                        {isSidebarCollapsed ? (
                            <>
                                <CaretRight size={20} />
                                <span className="text-[10px] font-bold leading-tight">Abrir</span>
                            </>
                        ) : (
                            <div className="flex items-center">
                                <CaretLeft size={20} />
                                <span className="ml-3 text-sm">Contraer</span>
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden admin-sidebar-surface border-t flex items-center overflow-x-auto snap-x px-2 pb-safe pt-1 w-full shrink-0 z-50 hide-scrollbar order-last">
                {modules.map((module) => (
                    <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={cn(
                            'flex flex-col items-center justify-center p-2 rounded-lg shrink-0 snap-center min-w-[72px] transition-colors',
                            activeModule === module.id ? 'admin-accent-text bg-[var(--admin-accent-soft)]' : 'admin-text-muted hover:bg-white/5'
                        )}
                    >
                        <module.icon size={22} weight={activeModule === module.id ? 'fill' : 'regular'} />
                        <span className="text-[10px] whitespace-nowrap overflow-hidden text-ellipsis mt-1">{module.label}</span>
                    </button>
                ))}
            </nav>
        </>
    );
};

export default EvolutionSidebar;
