import React from 'react';

const statusLabels = {
    pendiente: 'Pendiente',
    en_revision: 'En revision',
    pagada: 'Pagada',
    vencida: 'Vencida',
};

const statusClass = {
    pendiente: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    en_revision: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
    pagada: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    vencida: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
};

const formatMoney = (value) => {
    const amount = Number(value || 0);
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function CuotasTable({ manager }) {
    const {
        quotas,
        month,
        setMonth,
        quotaStatus,
        setQuotaStatus,
        loadQuotas,
        generateQuotas,
        approveQuota,
        saving,
    } = manager;

    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                    <h3 className="font-bold text-white">Cuotas mensuales</h3>
                    <p className="text-xs text-zinc-400">Generacion, revision y aprobacion manual de pagos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    />
                    <select
                        value={quotaStatus}
                        onChange={(e) => setQuotaStatus(e.target.value)}
                        className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    >
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_revision">En revision</option>
                        <option value="pagada">Pagada</option>
                        <option value="vencida">Vencida</option>
                    </select>
                    <button type="button" onClick={() => loadQuotas()} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200">
                        Filtrar
                    </button>
                    <button type="button" disabled={saving} onClick={generateQuotas} className="rounded-xl bg-evolution-indigo px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        Generar mes
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-white/[0.03] text-xs uppercase text-zinc-500">
                        <tr>
                            <th className="px-4 py-3">Club</th>
                            <th className="px-4 py-3">Mes</th>
                            <th className="px-4 py-3">Monto</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Comprobante</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {quotas.map((quota) => (
                            <tr key={quota.id} className="text-zinc-200">
                                <td className="px-4 py-3">
                                    <p className="font-bold text-white">{quota.club_nombre}</p>
                                    <p className="text-xs text-zinc-500">{quota.club_email}</p>
                                </td>
                                <td className="px-4 py-3">{quota.mes}</td>
                                <td className="px-4 py-3">{formatMoney(quota.monto)}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusClass[quota.estado] || statusClass.pendiente}`}>
                                        {statusLabels[quota.estado] || quota.estado}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {quota.comprobante_url ? (
                                        <a href={quota.comprobante_url} target="_blank" rel="noreferrer" className="text-evolution-indigo hover:underline">
                                            Ver archivo
                                        </a>
                                    ) : (
                                        <span className="text-zinc-500">Sin comprobante</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end">
                                        {quota.estado === 'en_revision' ? (
                                            <button type="button" disabled={saving} onClick={() => approveQuota(quota.id)} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                                                Aprobar pago
                                            </button>
                                        ) : (
                                            <span className="text-xs text-zinc-500">-</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!quotas.length ? (
                            <tr>
                                <td className="px-4 py-8 text-center text-zinc-500" colSpan={6}>
                                    No hay cuotas para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
