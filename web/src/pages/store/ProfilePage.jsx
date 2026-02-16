import React, { useEffect, useMemo, useState } from 'react';
import StoreLayout from '../../components/layout/StoreLayout';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency } from '../../utils/format';
import { navigate } from '../../utils/navigation';

const STATUS_STYLES = {
    Enviado: 'bg-primary/20 text-primary',
    Entregado: 'bg-green-100 text-green-700',
    Pendiente: 'bg-zinc-100 text-zinc-600',
    'Pendiente de pago': 'bg-amber-100 text-amber-700',
    'En gestión': 'bg-blue-100 text-blue-700',
    Confirmado: 'bg-emerald-100 text-emerald-700',
    Pagado: 'bg-emerald-100 text-emerald-700',
};

const PHONE_COUNTRIES = [
    { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
    { code: 'US', name: 'Estados Unidos', dial: '+1', flag: '🇺🇸' },
    { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷' },
    { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
    { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
    { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
    { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
    { code: 'PE', name: 'Perú', dial: '+51', flag: '🇵🇪' },
    { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
    { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
    { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
    { code: 'MX', name: 'México', dial: '+52', flag: '🇲🇽' },
    { code: 'ES', name: 'España', dial: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Italia', dial: '+39', flag: '🇮🇹' },
    { code: 'FR', name: 'Francia', dial: '+33', flag: '🇫🇷' },
];

const getCountryByCode = (code) =>
    PHONE_COUNTRIES.find((country) => country.code === code) || PHONE_COUNTRIES[0];

const getCountryByDial = (dial) =>
    PHONE_COUNTRIES.find((country) => country.dial === dial);

const buildPhone = (countryCode, number) => {
    const country = getCountryByCode(countryCode);
    const trimmed = (number || '').trim();
    return trimmed ? `${country.dial} ${trimmed}` : country.dial;
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
    const filledProps = {
        className,
        "aria-hidden": true,
        fill: "currentColor",
        stroke: "none",
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
        case "favorite":
            return (
                <svg {...filledProps} viewBox="0 0 1280 1133">
                    <path d="M3139 11319 c-408 -27 -834 -123 -1165 -260 -251 -104 -542 -274 -744 -435 -119 -95 -371 -349 -470 -474 -503 -634 -784 -1509 -757 -2360 10 -290 39 -472 113 -703 202 -627 670 -1387 1430 -2323 1102 -1358 2896 -3120 4835 -4751 17 -14 -8 -34 379 296 1471 1256 2963 2699 3971 3841 1131 1281 1811 2338 2000 3105 114 466 84 1111 -81 1694 -109 385 -294 773 -520 1088 -470 656 -1180 1085 -2040 1232 -257 44 -402 55 -730 55 -337 0 -452 -10 -695 -59 -722 -146 -1301 -530 -1717 -1140 -199 -291 -327 -559 -467 -973 -42 -123 -80 -224 -86 -224 -5 0 -40 78 -76 173 -159 420 -305 705 -516 1006 -267 382 -631 711 -1003 907 -478 252 -1010 349 -1661 305z" />
                </svg>
            );
        case "security":
            return (
                <svg {...filledProps} viewBox="0 0 1046 1280">
                    <path d="M4885 12645 c-1070 -549 -1968 -902 -2830 -1110 -336 -81 -723 -154 -1570 -294 -395 -65 -453 -77 -472 -93 -25 -21 -16 -459 32 -1523 56 -1213 109 -1961 160 -2250 42 -235 142 -710 189 -900 171 -690 295 -1086 520 -1652 166 -420 227 -549 418 -893 283 -507 500 -852 793 -1262 261 -363 362 -485 727 -875 213 -228 278 -289 673 -634 583 -510 683 -589 920 -734 88 -54 207 -129 264 -168 121 -81 381 -217 462 -243 l57 -17 173 79 c186 84 199 92 559 319 274 173 294 187 494 353 391 325 880 767 1071 968 453 476 554 598 891 1079 277 395 400 592 679 1085 250 442 447 893 665 1521 221 635 460 1665 529 2279 63 558 135 1934 167 3211 6 245 5 257 -12 263 -53 16 -516 103 -785 146 -1094 176 -1651 315 -2439 608 -436 162 -1083 454 -1668 753 -240 122 -279 139 -320 138 -40 0 -90 -23 -347 -154z" />
                </svg>
            );
        default:
            return null;
    }
};

export default function ProfilePage() {
    const { user, logout, loading, isAdmin } = useAuth();
    const { favorites, removeFavorite, addToCart } = useStore();
    const { settings } = useTenant();
    const currency = settings?.commerce?.currency || 'ARS';
    const locale = settings?.commerce?.locale || 'es-AR';
    const showPrices = settings?.commerce?.show_prices !== false;
    const defaultAddress = useMemo(() => ({
        fullName: 'alexisvallejos803',
        line1: 'Av. Colon 1234, 4to B',
        city: 'Mar del Plata',
        postal: 'B7600',
        region: 'Buenos Aires',
        country: 'Argentina',
        phone: '+54 2236334301',
        phoneCountry: 'AR',
        phoneNumber: '2236334301',
    }), []);
    const [address, setAddress] = useState(defaultAddress);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressDraft, setAddressDraft] = useState(defaultAddress);
    const [profilePhoto, setProfilePhoto] = useState('');
    const [activeSection, setActiveSection] = useState('account');
    const [orders, setOrders] = useState([]);

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

    useEffect(() => {
        if (!user) return;
        const key = `teflon_profile_address_${user.id || user.email}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                const merged = { ...defaultAddress, ...parsed };
                const rawPhone = typeof merged.phone === 'string' ? merged.phone.trim() : '';
                if (!merged.phoneCountry || !merged.phoneNumber) {
                    const match = rawPhone.match(/^(\+\d{1,3})\s*(.*)$/);
                    if (match) {
                        const country = getCountryByDial(match[1]);
                        if (country && !merged.phoneCountry) {
                            merged.phoneCountry = country.code;
                        }
                        if (!merged.phoneNumber) {
                            merged.phoneNumber = match[2].trim();
                        }
                    } else if (!merged.phoneNumber && rawPhone) {
                        merged.phoneNumber = rawPhone;
                    }
                }
                if (!merged.phoneCountry) {
                    merged.phoneCountry = defaultAddress.phoneCountry;
                }
                if (!merged.phoneNumber) {
                    merged.phoneNumber = defaultAddress.phoneNumber;
                }
                merged.phone = buildPhone(merged.phoneCountry, merged.phoneNumber);
                setAddress(merged);
                setAddressDraft(merged);
                return;
            }
        } catch (err) {
            console.warn('No se pudo cargar la dirección guardada', err);
        }
        const fallback = {
            ...defaultAddress,
            fullName: displayName || defaultAddress.fullName,
        };
        fallback.phone = buildPhone(fallback.phoneCountry, fallback.phoneNumber);
        setAddress(fallback);
        setAddressDraft(fallback);
    }, [user, defaultAddress, displayName]);

    useEffect(() => {
        if (!user) return;
        const key = `teflon_profile_photo_${user.id || user.email}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                setProfilePhoto(raw);
                return;
            }
        } catch (err) {
            console.warn('No se pudo cargar la foto de perfil', err);
        }
        setProfilePhoto('');
    }, [user]);

    useEffect(() => {
        if (!user) {
            setOrders([]);
            return;
        }
        const key = `teflon_orders_${user.id || user.email || "guest"}`;
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            setOrders(Array.isArray(parsed) ? parsed : []);
        } catch (err) {
            console.warn('No se pudieron cargar los pedidos', err);
            setOrders([]);
        }
    }, [user]);

    const roleLabel = useMemo(() => {
        if (isAdmin) return 'Administrador';
        if (user?.role === 'wholesale') return 'Mayorista';
        return 'Minorista';
    }, [user, isAdmin]);

    const sectionLabels = {
        account: 'Mi cuenta',
        orders: 'Historial de pedidos',
        addresses: 'Direcciones',
        favorites: 'Favoritos',
        security: 'Seguridad',
    };
    const isAccountSection = activeSection === 'account';
    const showOrders = activeSection === 'orders' || isAccountSection;
    const showAddresses = activeSection === 'addresses' || isAccountSection;
    const ordersSpanClass = isAccountSection ? 'lg:col-span-2' : 'lg:col-span-3';
    const addressesSpanClass = isAccountSection ? 'lg:col-span-1' : 'lg:col-span-3';

    const visibleOrders = useMemo(() => {
        if (!orders.length) return [];
        return activeSection === 'orders' ? orders : orders.slice(0, 4);
    }, [orders, activeSection]);

    const formatOrderDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString(locale || 'es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleViewOrder = (order) => {
        try {
            localStorage.setItem("teflon_last_order", JSON.stringify(order));
        } catch (err) {
            console.warn('No se pudo guardar el pedido seleccionado', err);
        }
        navigate('/order-success');
    };

    const updateOrderStatus = (orderId, nextStatus) => {
        if (!orderId) return;
        const historyKey = `teflon_orders_${user?.id || user?.email || "guest"}`;
        setOrders((prev) => {
            const next = prev.map((order) =>
                order.id === orderId ? { ...order, status: nextStatus } : order
            );
            try {
                localStorage.setItem(historyKey, JSON.stringify(next));
            } catch (err) {
                console.warn('No se pudo actualizar el pedido', err);
            }
            try {
                const raw = localStorage.getItem("teflon_last_order");
                if (raw) {
                    const last = JSON.parse(raw);
                    if (last?.id === orderId) {
                        localStorage.setItem("teflon_last_order", JSON.stringify({ ...last, status: nextStatus }));
                    }
                }
            } catch (err) {
                console.warn('No se pudo actualizar el pedido reciente', err);
            }
            return next;
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const saveAddress = () => {
        if (!user) return;
        const next = { ...addressDraft };
        next.phone = buildPhone(next.phoneCountry, next.phoneNumber);
        setAddress(next);
        const key = `teflon_profile_address_${user.id || user.email}`;
        try {
            localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
            console.warn('No se pudo guardar la dirección', err);
        }
        setIsEditingAddress(false);
    };

    const resetAddress = () => {
        if (!user) return;
        const fallback = {
            ...defaultAddress,
            fullName: displayName || defaultAddress.fullName,
        };
        fallback.phone = buildPhone(fallback.phoneCountry, fallback.phoneNumber);
        setAddress(fallback);
        setAddressDraft(fallback);
        const key = `teflon_profile_address_${user.id || user.email}`;
        try {
            localStorage.removeItem(key);
        } catch (err) {
            console.warn('No se pudo limpiar la dirección', err);
        }
        setIsEditingAddress(false);
    };

    const handleProfilePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            setProfilePhoto(result);
            const key = `teflon_profile_photo_${user.id || user.email}`;
            try {
                if (result) {
                    localStorage.setItem(key, result);
                }
            } catch (err) {
                console.warn('No se pudo guardar la foto de perfil', err);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleRemovePhoto = () => {
        if (!user) return;
        setProfilePhoto('');
        const key = `teflon_profile_photo_${user.id || user.email}`;
        try {
            localStorage.removeItem(key);
        } catch (err) {
            console.warn('No se pudo eliminar la foto de perfil', err);
        }
    };

    return (
        <StoreLayout>
            <div className="mx-auto w-full max-w-[1400px] px-4 md:px-10 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="w-full lg:w-64 border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20">
                                    {profilePhoto ? (
                                        <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined">person</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold dark:text-white">{displayName}</span>
                                    <span className="text-xs text-[#8a7560]">{roleLabel}</span>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeSection === 'account' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                    onClick={() => setActiveSection('account')}
                                >
                                    <ProfileIcon name="account_circle" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Mi cuenta</span>
                                </button>
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeSection === 'orders' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                    onClick={() => setActiveSection('orders')}
                                >
                                    <ProfileIcon name="package_2" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Historial de pedidos</span>
                                </button>
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeSection === 'addresses' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                    onClick={() => setActiveSection('addresses')}
                                >
                                    <ProfileIcon name="location_on" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Direcciones</span>
                                </button>
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeSection === 'favorites' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                    onClick={() => setActiveSection('favorites')}
                                >
                                    <ProfileIcon name="favorite" className="h-5 w-5 shrink-0" />
                                    <span className="text-sm">Favoritos</span>
                                    {favorites?.length ? (
                                        <span className="ml-auto size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#2c2116]" />
                                    ) : null}
                                </button>
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeSection === 'security' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#181411] dark:text-gray-300 hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                    onClick={() => setActiveSection('security')}
                                >
                                    <ProfileIcon name="security" className="h-5 w-5 shrink-0" />
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
                                <span className="text-sm">Cerrar sesión</span>
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 bg-[#f8f7f5] dark:bg-[#1a140d] rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-2 text-xs text-[#8a7560] mb-6 uppercase tracking-wider font-semibold">
                            <button className="hover:text-primary transition-colors" onClick={() => navigate('/')}>
                                Inicio
                            </button>
                            <ProfileIcon name="chevron_right" className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-primary">{sectionLabels[activeSection]}</span>
                        </div>

                        {activeSection === 'account' ? (
                        <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] p-6 md:p-8 mb-8 flex flex-col lg:flex-row justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className="size-16 rounded-full border-4 border-primary/10 overflow-hidden flex items-center justify-center bg-primary/5 text-primary">
                                    {profilePhoto ? (
                                        <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined">person</span>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-[#181411] dark:text-white leading-tight">
                                        Hola, {displayName}!
                                    </h1>
                                    <p className="text-[#8a7560] mt-1 text-sm">
                                        Gestioná tu cuenta, revisá tus pedidos y actualizá tu perfil.
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
                            <div className="flex flex-col gap-2">
                                <label className="px-5 py-2.5 bg-white border border-[#e5e1de] text-[#181411] font-bold text-sm rounded-lg hover:bg-[#f5f2f0] transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Subir foto
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                                {profilePhoto ? (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="px-5 py-2.5 bg-white border border-[#e5e1de] text-red-600 font-bold text-sm rounded-lg hover:bg-red-50 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Quitar foto
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        ) : null}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {showOrders ? (
                            <div className={`${ordersSpanClass} space-y-6`}>
                                <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] flex justify-between items-center">
                                        <h3 className="font-bold text-lg">Pedidos recientes</h3>
                                        <button
                                            type="button"
                                            onClick={() => setActiveSection('orders')}
                                            className="text-sm text-primary font-semibold hover:underline"
                                        >
                                            Ver todo
                                        </button>
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
                                                {visibleOrders.length ? (
                                                    visibleOrders.map((order) => {
                                                        const statusLabel = order.status || 'Pendiente';
                                                        const isPending = statusLabel === 'Pendiente' || statusLabel === 'Pendiente de pago';
                                                        return (
                                                        <tr key={order.id} className="hover:bg-[#f5f2f0]/40 transition-colors">
                                                            <td className="px-6 py-4 font-mono font-medium">#{order.id}</td>
                                                            <td className="px-6 py-4">{formatOrderDate(order.createdAt)}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[statusLabel] || STATUS_STYLES.Pendiente}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold">
                                                                {order.total != null
                                                                    ? formatCurrency(order.total, order.currency || currency, order.locale || locale)
                                                                    : '-'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleViewOrder(order)}
                                                                        className="text-primary hover:text-primary/70 font-semibold underline decoration-2"
                                                                    >
                                                                        Detalles
                                                                    </button>
                                                                    {isPending ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateOrderStatus(order.id, 'Pagado')}
                                                                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-600"
                                                                        >
                                                                            Marcar como pagado
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-6 text-center text-[#8a7560]">
                                                            Todavía no hay pedidos recientes.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            ) : null}

                            {showAddresses ? (
                            <div className={`${addressesSpanClass} space-y-6`}>
                                <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] flex justify-between items-center">
                                        <h3 className="font-bold text-lg">Dirección principal</h3>
                                        <ProfileIcon name="location_on" className="h-5 w-5 shrink-0 text-[#8a7560]" />
                                    </div>
                                    <div className="p-6">
                                        {!isEditingAddress ? (
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-primary text-[20px] mt-1">person</span>
                                                    <div>
                                                        <p className="font-bold text-sm">{address.fullName || displayName}</p>
                                                        <p className="text-xs text-[#8a7560]">Cuenta {roleLabel}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-primary text-[20px] mt-1">home</span>
                                                    <div>
                                                        <p className="text-sm">{address.line1}</p>
                                                        <p className="text-sm">{address.city}{address.postal ? `, ${address.postal}` : ''}</p>
                                                        <p className="text-sm font-semibold">{address.region}, {address.country}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-primary text-[20px] mt-1">call</span>
                                                    <p className="text-sm">
                                                        {buildPhone(address.phoneCountry, address.phoneNumber)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={addressDraft.fullName}
                                                        onChange={(e) => setAddressDraft({ ...addressDraft, fullName: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">Dirección</label>
                                                    <input
                                                        type="text"
                                                        value={addressDraft.line1}
                                                        onChange={(e) => setAddressDraft({ ...addressDraft, line1: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">Ciudad</label>
                                                    <input
                                                        type="text"
                                                        value={addressDraft.city}
                                                        onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">Código postal</label>
                                                    <input
                                                        type="text"
                                                        value={addressDraft.postal}
                                                        onChange={(e) => setAddressDraft({ ...addressDraft, postal: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">Provincia</label>
                                                    <input
                                                        type="text"
                                                        value={addressDraft.region}
                                                        onChange={(e) => setAddressDraft({ ...addressDraft, region: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">País</label>
                                                    <input
                                                        type="text"
                                                        value={addressDraft.country}
                                                        onChange={(e) => setAddressDraft({ ...addressDraft, country: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-[#8a7560]">Teléfono</label>
                                                    <div className="flex flex-col md:flex-row gap-2">
                                                        <select
                                                            value={addressDraft.phoneCountry}
                                                            onChange={(e) =>
                                                                setAddressDraft({
                                                                    ...addressDraft,
                                                                    phoneCountry: e.target.value,
                                                                })
                                                            }
                                                            className="w-full md:w-48 px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                        >
                                                            {PHONE_COUNTRIES.map((country) => (
                                                                <option key={country.code} value={country.code}>
                                                                    {country.flag} {country.dial} {country.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={addressDraft.phoneNumber}
                                                            onChange={(e) =>
                                                                setAddressDraft({
                                                                    ...addressDraft,
                                                                    phoneNumber: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Número de teléfono"
                                                            className="w-full px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-6 flex gap-3">
                                            {isEditingAddress ? (
                                                <>
                                                    <button
                                                        className="flex-1 px-3 py-2 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90 transition-all"
                                                        onClick={saveAddress}
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        className="flex-1 px-3 py-2 bg-[#f5f2f0] border border-[#e5e1de] text-xs font-bold rounded hover:bg-white transition-all"
                                                        onClick={() => {
                                                            setAddressDraft(address);
                                                            setIsEditingAddress(false);
                                                        }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="flex-1 px-3 py-2 bg-[#f5f2f0] border border-[#e5e1de] text-xs font-bold rounded hover:bg-white transition-all"
                                                        onClick={() => setIsEditingAddress(true)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="flex-1 px-3 py-2 bg-[#f5f2f0] border border-[#e5e1de] text-xs font-bold rounded hover:bg-white transition-all text-red-600"
                                                        onClick={resetAddress}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h4 className="font-bold text-lg mb-2">¿Necesitás cotización mayorista?</h4>
                                        <p className="text-white/80 text-sm mb-4">
                                            Contactá a nuestro equipo para precios profesionales.
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
                            ) : null}

                            {activeSection === 'favorites' ? (
                                <>
                                    {favorites.length ? (
                                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {favorites.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] overflow-hidden hover:shadow-lg transition-all"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/product/${item.id}`)}
                                                        className="w-full aspect-square bg-[#f5f2f0] dark:bg-[#2c2116] overflow-hidden"
                                                    >
                                                        <img
                                                            src={item.image || "https://via.placeholder.com/300"}
                                                            alt={item.alt || item.name}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </button>
                                                    <div className="p-4 flex flex-col gap-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className="text-sm font-bold text-[#181411] dark:text-white leading-snug">
                                                                {item.name}
                                                            </h3>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFavorite(item.id)}
                                                                className="text-[#8a7560] hover:text-red-500 transition-colors"
                                                                aria-label="Quitar de favoritos"
                                                            >
                                                                <ProfileIcon name="favorite" className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        {showPrices ? (
                                                            <span className="text-primary font-black text-sm">
                                                                {formatCurrency(item.price || 0, currency, locale)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[#8a7560] text-xs">Consultar precio</span>
                                                        )}
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/product/${item.id}`)}
                                                                className="flex-1 h-9 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] text-xs font-bold text-[#181411] dark:text-white hover:border-primary/60"
                                                            >
                                                                Ver producto
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addToCart(item, 1)}
                                                                className="flex-1 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90"
                                                            >
                                                                Agregar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="lg:col-span-3 bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] p-8 text-center text-[#8a7560]">
                                            <div className="flex items-center justify-center gap-2 text-[#181411] dark:text-white font-bold mb-3">
                                                <ProfileIcon name="favorite" className="h-6 w-6 text-primary" />
                                                Favoritos
                                            </div>
                                            Todavía no agregaste favoritos.
                                        </div>
                                    )}
                                </>
                            ) : null}

                            {activeSection === 'security' ? (
                                <div className="lg:col-span-3 bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] p-8 space-y-4">
                                    <div className="flex items-center gap-2 text-[#181411] dark:text-white font-bold">
                                        <ProfileIcon name="security" className="h-6 w-6 text-primary" />
                                        Seguridad
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-[#8a7560]">Nueva contraseña</label>
                                        <input
                                            type="password"
                                            className="w-full mt-2 px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent"
                                            placeholder="********"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-[#8a7560]">Confirmar contraseña</label>
                                        <input
                                            type="password"
                                            className="w-full mt-2 px-3 py-2 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent"
                                            placeholder="********"
                                        />
                                    </div>
                                    <button className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary/90 transition-all">
                                        Guardar cambios
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </main>
                </div>
            </div>
        </StoreLayout>
    );
}
