import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowsClockwise,
    CheckCircle,
    Copy,
    Key,
    Link,
    Plug,
    ShieldCheck,
} from '@phosphor-icons/react';

import { cn } from '../../../utils/cn';

const cardClass = 'rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4';
const codeClass = 'rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-200 font-mono break-all';

const CopyButton = ({ value, label = 'Copiar', className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch (err) {
            console.error(`Failed to copy ${label}`, err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-zinc-200 transition hover:bg-white/10',
                className
            )}
        >
            {copied ? <CheckCircle size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
            {copied ? 'Copiado' : label}
        </button>
    );
};

const EndpointRow = ({ label, url }) => (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
            <CopyButton value={url} label="Copiar URL" />
        </div>
        <div className={codeClass}>{url}</div>
    </div>
);

const IntegrationsEditor = ({ manager }) => {
    const { manifest, loading, rotatingToken, loadManifest, rotateToken } = manager;

    useEffect(() => {
        loadManifest().catch(() => {});
    }, [loadManifest]);

    const samplePayload = useMemo(
        () => JSON.stringify(manifest?.schema?.sample_payload || {}, null, 2),
        [manifest]
    );
    const compatibilitySamplePayload = useMemo(
        () => JSON.stringify(manifest?.compatibility?.sample_payload || {}, null, 2),
        [manifest]
    );

    if (loading && !manifest) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <ArrowsClockwise size={28} weight="bold" className="mb-3 animate-spin" />
                <p className="text-xs font-bold uppercase tracking-[0.24em]">Cargando integracion</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-300">
                        <Plug size={14} weight="bold" />
                        Integraciones
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Centro ERP / Sistema de gestion</h2>
                        <p className="max-w-3xl text-sm text-zinc-500">
                            Este modulo le da al proveedor del sistema de gestion el tenant, el token y las URLs que necesita para conectarse.
                            El sync real sigue entrando por la API del ecommerce.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => loadManifest().catch(() => {})}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:bg-white/10"
                    >
                        <ArrowsClockwise size={14} weight="bold" />
                        Recargar
                    </button>
                    <button
                        type="button"
                        onClick={() => rotateToken('ERP Sync')}
                        disabled={rotatingToken}
                        className="inline-flex items-center gap-2 rounded-lg bg-evolution-indigo px-3 py-2 text-xs font-bold text-white transition hover:bg-evolution-indigo/90 disabled:opacity-60"
                    >
                        <Key size={14} weight="bold" />
                        {rotatingToken ? 'Regenerando...' : 'Regenerar token'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className={cardClass}>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                        <ShieldCheck size={16} weight="bold" />
                        Credenciales
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tenant UUID</p>
                            <div className="mt-2 space-y-2">
                                <div className={codeClass}>{manifest?.tenant_id || 'Sin tenant'}</div>
                                <CopyButton value={manifest?.tenant_id} label="Copiar tenant" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Scope requerido</p>
                            <div className="mt-2 space-y-2">
                                <div className={codeClass}>{manifest?.auth?.scope || 'products:sync'}</div>
                                <p className="text-[11px] text-zinc-500">El proveedor debe usar este scope en el token de integracion.</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Token actual</p>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                    Compartile este token al desarrollador del sistema de gestion. Si lo regeneras, el anterior deja de servir.
                                </p>
                            </div>
                            <CopyButton value={manifest?.auth?.token} label="Copiar token" />
                        </div>
                        <div className="mt-3 space-y-2">
                            <div className={codeClass}>{manifest?.auth?.token || 'Sin token generado'}</div>
                            <p className="text-[11px] text-zinc-500">Nombre visible: {manifest?.auth?.token_name || 'ERP Sync'}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Compatibilidad sistema de gestion</p>
                            <p className="mt-1 text-[11px] text-zinc-500">
                                Si el software solo deja configurar Dominio, Consumer Key y Consumer Secret, pasales estos datos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Consumer Key</p>
                                    <CopyButton value={manifest?.compatibility?.consumer_key} label="Copiar key" />
                                </div>
                                <div className={codeClass}>{manifest?.compatibility?.consumer_key || 'Genera un token para usar compatibilidad'}</div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Consumer Secret</p>
                                    <CopyButton value={manifest?.compatibility?.consumer_secret} label="Copiar secret" />
                                </div>
                                <div className={codeClass}>{manifest?.compatibility?.consumer_secret || 'Sin secret disponible'}</div>
                            </div>
                        </div>

                        <p className="text-[11px] text-zinc-500">
                            El Consumer Secret se deriva del token actual. Si regeneras el token, tambien cambia este secret.
                        </p>
                    </div>
                </div>

                <div className={cardClass}>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                        <Link size={16} weight="bold" />
                        Endpoints
                    </div>

                    <EndpointRow label="Prueba de conexion" url={manifest?.endpoints?.ping_url || ''} />
                    <EndpointRow label="Sincronizacion de productos" url={manifest?.endpoints?.sync_products_url || ''} />
                    <EndpointRow label="Esquema JSON del producto" url={manifest?.endpoints?.schema_product_url || ''} />
                    <EndpointRow label="Compatibilidad ping" url={manifest?.compatibility?.endpoints?.ping_url || ''} />
                    <EndpointRow label="Compatibilidad producto" url={manifest?.compatibility?.endpoints?.product_url || ''} />
                    <EndpointRow label="Compatibilidad productos" url={manifest?.compatibility?.endpoints?.products_url || ''} />

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-white">
                        El stock viaja dentro del mismo item de producto. No hace falta una URL separada de stock si el sistema ya puede enviar JSON de producto.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className={cardClass}>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                        <ShieldCheck size={16} weight="bold" />
                        Campos que debe enviar la gestion
                    </div>

                    <div className="space-y-3">
                        {(manifest?.schema?.fields || []).map((field) => (
                            <div key={field.key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-mono text-sm text-white">{field.key}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                                            {field.type}
                                        </span>
                                        {field.required ? (
                                            <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-300">
                                                obligatorio
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
                                                opcional
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-2 text-[12px] text-zinc-400">{field.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={cardClass}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                            <Plug size={16} weight="bold" />
                            JSON de ejemplo
                        </div>
                        <CopyButton value={samplePayload} label="Copiar JSON" />
                    </div>

                    <pre className="custom-scrollbar overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-[12px] leading-6 text-zinc-200">
                        {samplePayload}
                    </pre>

                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">JSON ejemplo compatibilidad</p>
                            <CopyButton value={compatibilitySamplePayload} label="Copiar JSON compat" />
                        </div>
                        <pre className="custom-scrollbar overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-[12px] leading-6 text-zinc-200">
                            {compatibilitySamplePayload}
                        </pre>
                    </div>

                    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Pedido corto para el proveedor</p>
                        <p className="text-[12px] leading-6 text-zinc-300">
                            Necesitamos que el sistema de gestion lea productos desde su propia base y los envie a la URL de sincronizacion.
                            Debe mandar `x-api-key`, `x-tenant-id`, `source_system` y un array `items` con `external_id`, `sku`, `name`,
                            `price_retail`, `price_wholesale`, `stock`, `is_active`, `description`, `category_id` e `images` si las tiene.
                        </p>
                        <p className="text-[12px] leading-6 text-zinc-300">
                            Si el software solo acepta `Consumer Key` y `Consumer Secret`, debe usar la capa de compatibilidad con las URLs
                            `Compatibilidad producto` o `Compatibilidad productos`.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsEditor;
