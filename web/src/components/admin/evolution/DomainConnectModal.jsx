import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowsClockwise,
    CheckCircle,
    CrownSimple,
    Globe,
    GlobeHemisphereWest,
    HouseLine,
    Trash,
    X,
} from '@phosphor-icons/react';

import { getApiBase, getTenantHeaders } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../utils/cn';

const panelFieldClass =
    'admin-input-field w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-200';
const subtleButtonClass =
    'admin-hover-surface inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium admin-text-primary transition-all disabled:cursor-not-allowed disabled:opacity-50';

const readResponsePayload = async (res) => {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (err) {
        return text;
    }
};

const buildHeaders = () => {
    const token = localStorage.getItem('teflon_token');
    return {
        ...getTenantHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const safePublicUrl = (domain) => {
    const value = String(domain || '').trim();
    if (!value || value === 'Sin dominio principal') return null;
    return `https://${value}`;
};

const chipToneMap = {
    success: { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.25)' },
    warning: { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.25)' },
    info: { backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#7dd3fc', borderColor: 'rgba(56, 189, 248, 0.25)' },
    default: { backgroundColor: 'var(--admin-hover)', color: 'var(--admin-muted)', borderColor: 'var(--admin-border-soft)' },
};

const surfaceStyle = {
    backgroundColor: 'var(--admin-hover)',
    borderColor: 'var(--admin-border-soft)',
};

const panelStyle = {
    borderColor: 'var(--admin-border)',
};

const headerStyle = {
    borderColor: 'var(--admin-border-soft)',
};

const DomainChip = ({ label, tone = 'default' }) => (
    <span
        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={chipToneMap[tone] || chipToneMap.default}
    >
        {label}
    </span>
);

const SectionCard = ({ eyebrow, title, description, action, children }) => (
    <section className="space-y-4 rounded-2xl border p-4" style={surfaceStyle}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
                {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.24em] admin-accent-text">{eyebrow}</p> : null}
                {title ? <h3 className="text-lg font-semibold tracking-tight admin-text-primary">{title}</h3> : null}
                {description ? <p className="text-sm leading-relaxed admin-text-muted">{description}</p> : null}
            </div>
            {action || null}
        </div>
        {children}
    </section>
);

const StatCard = ({ icon, label, value, helper, tone = 'default' }) => (
    <div className="rounded-2xl border p-4" style={surfaceStyle}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">{label}</p>
                <p className="break-words text-lg font-semibold admin-text-primary">{value}</p>
                {helper ? <p className="text-xs leading-relaxed text-zinc-500">{helper}</p> : null}
            </div>
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={chipToneMap[tone] || chipToneMap.default}
            >
                {icon}
            </div>
        </div>
    </div>
);

const StepCard = ({ step, title, description }) => (
    <div className="rounded-2xl border p-4" style={surfaceStyle}>
        <div className="flex items-start gap-3">
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black admin-text-primary"
                style={{ backgroundColor: 'var(--admin-panel-bg)' }}
            >
                {step}
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold admin-text-primary">{title}</p>
                <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
            </div>
        </div>
    </div>
);

const DomainConnectModal = ({ open, onClose }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [domainState, setDomainState] = useState(null);
    const [customDomain, setCustomDomain] = useState('');

    const loadDomains = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getApiBase()}/tenant/domains`, { headers: buildHeaders() });
            const payload = await readResponsePayload(res);
            if (!res.ok) throw new Error(payload?.error || 'tenant_domains_load_failed');
            setDomainState(payload);
            return payload;
        } catch (err) {
            console.error('Failed to load tenant domains', err);
            addToast('No se pudo cargar el centro de dominios', 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (!open) return;
        loadDomains().catch(() => {});
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, open]);

    const submitCustomDomain = async () => {
        const domain = String(customDomain || '').trim();
        if (!domain) {
            addToast('Ingresa un dominio para conectar', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${getApiBase()}/tenant/domains`, {
                method: 'POST',
                headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, is_primary: true }),
            });
            const payload = await readResponsePayload(res);
            if (!res.ok) throw new Error(payload?.error || 'tenant_domain_connect_failed');
            setDomainState(payload);
            setCustomDomain('');
            addToast('Dominio conectado como principal', 'success');
        } catch (err) {
            console.error('Failed to connect custom domain', err);
            addToast('No se pudo conectar el dominio', 'error');
        } finally {
            setSaving(false);
        }
    };

    const removeDomain = async (domain) => {
        setSaving(true);
        try {
            const encoded = encodeURIComponent(domain);
            const res = await fetch(`${getApiBase()}/tenant/domains/${encoded}`, {
                method: 'DELETE',
                headers: buildHeaders(),
            });
            const payload = await readResponsePayload(res);
            if (!res.ok) throw new Error(payload?.error || 'tenant_domain_delete_failed');
            setDomainState(payload);
            addToast('Dominio eliminado', 'success');
        } catch (err) {
            console.error('Failed to remove tenant domain', err);
            addToast('No se pudo eliminar el dominio', 'error');
        } finally {
            setSaving(false);
        }
    };

    const connectedDomains = Array.isArray(domainState?.domains) ? domainState.domains : [];
    const currentPrimary = domainState?.primary_domain || 'Sin dominio principal';
    const platformTarget = domainState?.platform?.cname_target || 'cname.vercel-dns.com';
    const currentAdminOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentStoreUrl = safePublicUrl(currentPrimary);
    const hasOnlyOneDomain = connectedDomains.length <= 1;

    const primaryDomainHelp = useMemo(() => {
        if (!connectedDomains.length) {
            return 'Todavia no hay dominios conectados. El admin sigue funcionando, pero la tienda publica necesita un host.';
        }
        return 'El dominio principal es la URL publica que recibe a tus clientes.';
    }, [connectedDomains.length]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                className="admin-panel-surface relative flex h-full max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border shadow-2xl"
                style={panelStyle}
            >
                <div className="admin-header-surface flex items-center justify-between border-b px-5 py-4" style={headerStyle}>
                    <div className="flex items-center gap-3">
                        <div className="admin-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl border">
                            <Globe size={18} weight="bold" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] admin-accent-text">Inspector de dominio</p>
                            <h2 className="text-lg font-semibold tracking-tight admin-text-primary">Centro de dominio</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadDomains().catch(() => {})}
                            disabled={loading}
                            className={subtleButtonClass}
                            style={headerStyle}
                        >
                            <ArrowsClockwise size={16} weight="bold" className={cn(loading && 'animate-spin')} />
                            {loading ? 'Actualizando' : 'Actualizar'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="admin-hover-surface flex h-9 w-9 items-center justify-center rounded-full border"
                            style={headerStyle}
                        >
                            <X size={18} weight="bold" className="admin-text-primary" />
                        </button>
                    </div>
                </div>

                <div className="grid flex-1 gap-4 overflow-hidden p-5 xl:grid-cols-2">
                    <section className="admin-panel-surface flex min-h-0 flex-col overflow-hidden rounded-3xl border" style={panelStyle}>
                        <div className="admin-header-surface flex items-center justify-between border-b px-4 py-3" style={headerStyle}>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] admin-accent-text">Pantalla izquierda</p>
                                <h3 className="text-sm font-semibold admin-text-primary">Estado e inventario de dominios</h3>
                            </div>
                            {currentStoreUrl ? <DomainChip label="Storefront listo" tone="success" /> : <DomainChip label="Sin publicar" tone="warning" />}
                        </div>

                        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                            <SectionCard
                                eyebrow="Resumen"
                                title="Publicacion y ruteo"
                                description="Estado actual del dominio principal, storefront publico y configuracion del tenant."
                                action={
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DomainChip label={connectedDomains.length ? 'Dominio activo' : 'Sin dominio'} tone={connectedDomains.length ? 'success' : 'warning'} />
                                        <DomainChip label="Escenario 1" tone="info" />
                                    </div>
                                }
                            >
                                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                                    <div className="rounded-2xl border p-4" style={surfaceStyle}>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">Dominio principal</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <h3 className="text-2xl font-semibold tracking-tight admin-text-primary">{currentPrimary}</h3>
                                            {connectedDomains.length ? <DomainChip label="Principal activo" tone="success" /> : null}
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed admin-text-muted">{primaryDomainHelp}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="rounded-2xl border p-4" style={surfaceStyle}>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">Storefront publico</p>
                                            {currentStoreUrl ? (
                                                <a
                                                    href={currentStoreUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 block break-all text-sm font-semibold admin-text-primary transition hover:opacity-80"
                                                >
                                                    {currentStoreUrl}
                                                </a>
                                            ) : (
                                                <p className="mt-2 text-sm font-semibold admin-text-primary">Todavia sin URL publica</p>
                                            )}
                                        </div>
                                        <div className="rounded-2xl border p-4" style={surfaceStyle}>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">Admin actual</p>
                                            <p className="mt-2 break-all text-sm font-semibold admin-text-primary">{currentAdminOrigin || 'Sin origin'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <StatCard label="Hosts conectados" value={String(connectedDomains.length)} helper="Cantidad total de dominios asociados al tenant." icon={<HouseLine size={18} weight="bold" />} tone="info" />
                                    <StatCard label="Principal" value={currentPrimary === 'Sin dominio principal' ? 'Pendiente' : currentPrimary} helper="Host con prioridad publica." icon={<CrownSimple size={18} weight="bold" />} tone="success" />
                                    <StatCard label="CNAME objetivo" value={platformTarget} helper="Destino DNS esperado para dominios propios." icon={<GlobeHemisphereWest size={18} weight="bold" />} />
                                </div>
                            </SectionCard>

                            <SectionCard
                                eyebrow="Conectados"
                                title="Inventario de dominios"
                                description="Lista operativa con acceso publico, requisito DNS y acciones de mantenimiento."
                            >
                                <div className="space-y-3">
                                    {connectedDomains.length ? (
                                        connectedDomains.map((item) => {
                                            const publicUrl = safePublicUrl(item.domain);

                                            return (
                                                <div key={item.domain} className="rounded-2xl border p-4" style={surfaceStyle}>
                                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                        <div className="min-w-0 space-y-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="truncate text-base font-semibold admin-text-primary">{item.domain}</p>
                                                                {item.is_primary ? <DomainChip label="Principal" tone="success" /> : null}
                                                                <DomainChip label="Propio" />
                                                            </div>

                                                            <div className="grid gap-3 md:grid-cols-2">
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">Acceso publico</p>
                                                                    <p className="mt-1 break-all text-sm admin-text-primary">{publicUrl || 'Host sin URL publica valida'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">DNS requerido</p>
                                                                    <p className="mt-1 text-sm admin-text-primary">{`CNAME -> ${platformTarget}`}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <a
                                                                href={publicUrl || '#'}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={cn(subtleButtonClass, !publicUrl && 'pointer-events-none opacity-50')}
                                                                style={headerStyle}
                                                            >
                                                                <GlobeHemisphereWest size={14} weight="bold" />
                                                                Abrir
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDomain(item.domain)}
                                                                disabled={saving || (item.is_primary && hasOnlyOneDomain)}
                                                                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                                                style={chipToneMap.warning}
                                                            >
                                                                <Trash size={14} weight="bold" />
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border px-5 py-10 text-center" style={surfaceStyle}>
                                            <Globe size={28} weight="bold" className="admin-text-muted" />
                                            <p className="text-base font-semibold admin-text-primary">Todavia no hay dominios conectados</p>
                                            <p className="max-w-xl text-sm leading-relaxed admin-text-muted">
                                                Empieza por conectar el dominio propio del cliente y dejar el DNS listo para publicar la tienda.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>
                        </div>
                    </section>

                    <section className="admin-panel-surface flex min-h-0 flex-col overflow-hidden rounded-3xl border" style={panelStyle}>
                        <div className="admin-header-surface flex items-center justify-between border-b px-4 py-3" style={headerStyle}>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] admin-accent-text">Pantalla derecha</p>
                                <h3 className="text-sm font-semibold admin-text-primary">Dominio propio y publicacion</h3>
                            </div>
                            <DomainChip label="Escenario 1" tone="info" />
                        </div>

                        <aside className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                            <SectionCard
                                eyebrow="Escenario 1"
                                title="Cliente con dominio propio"
                                description="Guarda el host y dejalo listo para configurar el DNS hacia la plataforma."
                            >
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold tracking-wide admin-input-label">Dominio</label>
                                        <input
                                            className={panelFieldClass}
                                            style={headerStyle}
                                            placeholder="www.tumarca.com"
                                            value={customDomain}
                                            onChange={(event) => setCustomDomain(event.target.value)}
                                        />
                                    </div>
                                    <div className="rounded-xl border p-3" style={surfaceStyle}>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] admin-text-muted">Requisito DNS</p>
                                        <p className="mt-2 text-sm admin-text-primary">CNAME hacia {platformTarget}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={submitCustomDomain}
                                        disabled={saving}
                                        className="admin-accent-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <CheckCircle size={16} weight="bold" />
                                        {saving ? 'Guardando dominio...' : 'Conectar dominio propio'}
                                    </button>
                                </div>
                            </SectionCard>

                            <SectionCard
                                eyebrow="Operacion"
                                title="Checklist de salida en vivo"
                                description="Secuencia recomendada para dejar la tienda publicada sin friccion."
                            >
                                <div className="space-y-3">
                                    <StepCard step="1" title="Definir host" description="Carga el dominio propio que va a quedar como frente publico del cliente." />
                                    <StepCard step="2" title="Resolver DNS" description={`Para dominios propios, apunta el CNAME hacia ${platformTarget}.`} />
                                    <StepCard step="3" title="Verificar storefront" description="Confirma que el dominio principal abra la tienda publica y no el admin." />
                                </div>
                            </SectionCard>
                        </aside>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DomainConnectModal;
