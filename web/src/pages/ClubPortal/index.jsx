import React, { useEffect, useMemo, useState } from 'react';
import StoreLayout from '../../components/layout/StoreLayout';
import StoreSkeleton from '../../components/StoreSkeleton';
import { useAuth } from '../../context/AuthContext';
import { getApiBase, getAuthHeaders, getTenantHeaders } from '../../utils/api';
import { navigate } from '../../utils/navigation';
import MisCuotas from './MisCuotas';
import PagarCuota from './PagarCuota';
import MisSorteos from './MisSorteos';

const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'quotas', label: 'Mis cuotas' },
    { id: 'pay', label: 'Pagar cuota' },
    { id: 'draws', label: 'Mis sorteos' },
];

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusLabels = {
    pendiente: 'Pendiente',
    en_revision: 'En revision',
    pagada: 'Pagada',
    vencida: 'Vencida',
};

export default function ClubPortal() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [payload, setPayload] = useState(null);

    const loadPortal = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${getApiBase()}/api/consortium/me`, {
                headers: {
                    ...getTenantHeaders(),
                    ...getAuthHeaders(),
                },
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.error || `club_portal_${response.status}`);
            }
            setPayload(data);
        } catch (err) {
            setError(err.message || 'No se pudo cargar el portal');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            sessionStorage.setItem('teflon_post_login_redirect', '/consorcio');
            navigate('/login');
            return;
        }
        if (user.role !== 'club') {
            setLoading(false);
            return;
        }
        loadPortal();
    }, [authLoading, user]);

    const onUploadProof = async (quotaId, file) => {
        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('proof', file);
            const response = await fetch(`${getApiBase()}/api/consortium/quotas/${quotaId}/proof`, {
                method: 'POST',
                headers: {
                    ...getTenantHeaders(),
                    ...getAuthHeaders(),
                },
                body: formData,
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.error || `proof_${response.status}`);
            }
            await loadPortal();
            setActiveTab('quotas');
        } catch (err) {
            setError(err.message || 'No se pudo subir el comprobante');
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const nextDrawMonth = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    if (authLoading || loading) {
        return (
            <StoreLayout>
                <StoreSkeleton variant="page" />
            </StoreLayout>
        );
    }

    if (!user || user.role !== 'club') {
        return (
            <StoreLayout>
                <main className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                        <h1 className="text-2xl font-black text-[#181411]">Acceso exclusivo para clubes</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Inicia sesion con una cuenta de club habilitada por administracion.
                        </p>
                        <button type="button" onClick={() => navigate('/login')} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
                            Iniciar sesion
                        </button>
                    </div>
                </main>
            </StoreLayout>
        );
    }

    const club = payload?.club || {};
    const quotas = Array.isArray(payload?.quotas) ? payload.quotas : [];
    const draws = Array.isArray(payload?.draws) ? payload.draws : [];
    const currentQuota = payload?.current_quota || quotas[0] || null;
    const config = payload?.config || {};

    return (
        <StoreLayout>
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="rounded-3xl bg-[#181411] p-6 text-white shadow-xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Consorcio de Clubes</p>
                    <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-black">{club.nombre || 'Club'}</h1>
                            <p className="mt-1 text-sm text-white/70">
                                Responsable: {club.responsable || '-'} - Estado: {club.estado || '-'}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-4 py-3">
                            <p className="text-xs text-white/60">Proximo sorteo</p>
                            <p className="text-xl font-black">{nextDrawMonth}</p>
                        </div>
                    </div>
                </section>

                <div className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#181411]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {activeTab === 'dashboard' ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase text-gray-400">Cuota actual</p>
                            <p className="mt-2 text-2xl font-black text-[#181411]">
                                {currentQuota ? formatMoney(currentQuota.monto) : '-'}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {currentQuota ? statusLabels[currentQuota.estado] || currentQuota.estado : 'Sin generar'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase text-gray-400">Vencimiento</p>
                            <p className="mt-2 text-2xl font-black text-[#181411]">
                                {currentQuota?.fecha_vencimiento || '-'}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">Avisos automaticos antes del vencimiento.</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase text-gray-400">Sorteos ganados</p>
                            <p className="mt-2 text-2xl font-black text-[#181411]">{draws.length}</p>
                            <p className="mt-1 text-sm text-gray-500">Historial del club.</p>
                        </div>
                    </div>
                ) : null}

                {activeTab === 'quotas' ? <MisCuotas quotas={quotas} /> : null}
                {activeTab === 'pay' ? (
                    <PagarCuota currentQuota={currentQuota} config={config} onUploadProof={onUploadProof} uploading={uploading} />
                ) : null}
                {activeTab === 'draws' ? <MisSorteos draws={draws} /> : null}
            </main>
        </StoreLayout>
    );
}
