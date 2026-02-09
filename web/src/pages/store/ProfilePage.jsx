import React, { useEffect, useMemo } from 'react';
import StoreLayout from '../../components/layout/StoreLayout';
import { useAuth } from '../../context/AuthContext';
import { navigate } from '../../utils/navigation';

const ORDERS = [
    { id: 'ORD-88219', date: 'Oct 24, 2023', status: 'Shipped', total: '$12,450.00' },
    { id: 'ORD-88104', date: 'Oct 18, 2023', status: 'Delivered', total: '$5,230.50' },
    { id: 'ORD-87955', date: 'Oct 12, 2023', status: 'Pending', total: '$1,200.00' },
];

const STATUS_STYLES = {
    Shipped: 'bg-primary/20 text-primary',
    Delivered: 'bg-green-100 text-green-700',
    Pending: 'bg-zinc-100 text-zinc-600',
};

const ProfileIcon = ({ name, className = "h-5 w-5" }) => {
    const iconProps = {
        className,
        "aria-hidden": true,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    switch (name) {
        case "account_circle":
            return (
                <svg {...iconProps}>
                    <circle cx="12" cy="7" r="4" />
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                </svg>
            );
        case "package_2":
            return (
                <svg {...iconProps}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            );
        case "location_on":
            return (
                <svg {...iconProps}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            );
        case "chevron_right":
            return (
                <svg {...iconProps}>
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            );
        case "support_agent":
            return (
                <svg {...iconProps}>
                    <path d="M4 14c0 2 1.5 3 3.5 3 2 0 3.5-1 3.5-3s-1.5-3-3.5-3c-2 0-3.5 1-3.5 3z" />
                    <path d="M12 14c0 2 1.5 3 3.5 3 2 0 3.5-1 3.5-3s-1.5-3-3.5-3c-2 0-3.5 1-3.5 3z" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <path d="M12 17v4" />
                    <path d="M8 21h8" />
                </svg>
            );
        default:
            return null;
    }
};

export default function ProfilePage() {
    const { user, logout, loading, isAdmin } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [loading, user]);

    if (loading) {
        return (
            <StoreLayout>
                <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#8a7560]">
                    Cargando perfil...
                </div>
            </StoreLayout>
        );
    }

    if (!user) {
        return null;
    }

    const displayName = useMemo(() => {
        if (!user?.email) return 'Cliente';
        const [name] = user.email.split('@');
        return name || 'Cliente';
    }, [user]);

    const roleLabel = useMemo(() => {
        if (isAdmin) return 'Administrador';
        if (user?.role === 'wholesale') return 'Mayorista';
        return 'Minorista';
    }, [user, isAdmin]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <StoreLayout>
            <div className="mx-auto w-full max-w-[1400px] px-4 md:px-10 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="w-full lg:w-64 border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold dark:text-white">{displayName}</span>
                                    <span className="text-xs text-[#8a7560]">{roleLabel}</span>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold transition-all">
                                    <ProfileIcon name="account_circle" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Mi cuenta</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116] transition-all">
                                    <ProfileIcon name="package_2" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Historial de pedidos</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116] transition-all">
                                    <ProfileIcon name="location_on" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Direcciones</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116] transition-all">
                                    <span className="material-symbols-outlined">favorite</span>
                                    <span className="text-sm">Favoritos</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116] transition-all">
                                    <span className="material-symbols-outlined">security</span>
                                    <span className="text-sm">Seguridad</span>
                                </button>
                            </nav>
                        </div>

                        <div className="pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium"
                            >
                                <span className="material-symbols-outlined">logout</span>
                                <span className="text-sm">Cerrar sesion</span>
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 bg-[#f8f7f5] dark:bg-[#1a140d] rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-2 text-xs text-[#8a7560] mb-6 uppercase tracking-wider font-semibold">
                            <button className="hover:text-primary transition-colors" onClick={() => navigate('/')}>
                                Home
                            </button>
                            <ProfileIcon name="chevron_right" className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-primary">Mi cuenta</span>
                        </div>

                        <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] p-6 md:p-8 mb-8 flex flex-col lg:flex-row justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className="size-16 rounded-full border-4 border-primary/10 overflow-hidden flex items-center justify-center bg-primary/5 text-primary">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-[#181411] dark:text-white leading-tight">
                                        Hola, {displayName}!
                                    </h1>
                                    <p className="text-[#8a7560] mt-1 text-sm">
                                        Gestiona tu cuenta, revisa tus pedidos y actualiza tu perfil.
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                            Cuenta activa
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            {roleLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className="px-5 py-2.5 bg-white border border-[#e5e1de] text-[#181411] font-bold text-sm rounded-lg hover:bg-[#f5f2f0] transition-all shadow-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Editar perfil
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] flex justify-between items-center">
                                        <h3 className="font-bold text-lg">Pedidos recientes</h3>
                                        <button className="text-sm text-primary font-semibold hover:underline">Ver todo</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-[#f5f2f0]/60 dark:bg-[#2d241c] text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                                                    <th className="px-6 py-3">Pedido</th>
                                                    <th className="px-6 py-3">Fecha</th>
                                                    <th className="px-6 py-3">Estado</th>
                                                    <th className="px-6 py-3">Total</th>
                                                    <th className="px-6 py-3">Accion</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#e5e1de] dark:divide-[#3d2e21] text-sm">
                                                {ORDERS.map((order) => (
                                                    <tr key={order.id} className="hover:bg-[#f5f2f0]/40 transition-colors">
                                                        <td className="px-6 py-4 font-mono font-medium">#{order.id}</td>
                                                        <td className="px-6 py-4">{order.date}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[order.status] || STATUS_STYLES.Pending}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold">{order.total}</td>
                                                        <td className="px-6 py-4">
                                                            <button className="text-primary hover:text-primary/70 font-semibold underline decoration-2">
                                                                Detalles
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] flex justify-between items-center">
                                        <h3 className="font-bold text-lg">Direccion principal</h3>
                                        <ProfileIcon name="location_on" className="h-5 w-5 shrink-0 text-[#8a7560]" />
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-primary text-[20px] mt-1">person</span>
                                                <div>
                                                    <p className="font-bold text-sm">{displayName}</p>
                                                    <p className="text-xs text-[#8a7560]">Cuenta {roleLabel}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-primary text-[20px] mt-1">home</span>
                                                <div>
                                                    <p className="text-sm">Av. Colon 1234, 4to B</p>
                                                    <p className="text-sm">Mar del Plata, B7600</p>
                                                    <p className="text-sm font-semibold">Buenos Aires, Argentina</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-primary text-[20px] mt-1">call</span>
                                                <p className="text-sm">+54 223 555-0192</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex gap-3">
                                            <button className="flex-1 px-3 py-2 bg-[#f5f2f0] border border-[#e5e1de] text-xs font-bold rounded hover:bg-white transition-all">
                                                Editar
                                            </button>
                                            <button className="flex-1 px-3 py-2 bg-[#f5f2f0] border border-[#e5e1de] text-xs font-bold rounded hover:bg-white transition-all text-red-600">
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h4 className="font-bold text-lg mb-2">Necesitas cotizacion mayorista?</h4>
                                        <p className="text-white/80 text-sm mb-4">
                                            Contacta a nuestro equipo para precios profesionales.
                                        </p>
                                        <button className="w-full bg-white text-primary font-bold py-2 rounded-lg text-sm hover:bg-[#f8f7f5] transition-all">
                                            Contactar asesor
                                        </button>
                                    </div>
                                    <ProfileIcon
                                        name="support_agent"
                                        className="h-[100px] w-[100px] text-white/10 absolute -bottom-4 -right-4 group-hover:scale-110 transition-transform"
                                    />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </StoreLayout>
    );
}
