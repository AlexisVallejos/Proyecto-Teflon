import React from 'react';

const labels = {
    pendiente: 'Pendiente',
    en_revision: 'En revision',
    pagada: 'Pagada',
    vencida: 'Vencida',
};

const classes = {
    pendiente: 'bg-amber-100 text-amber-700',
    en_revision: 'bg-indigo-100 text-indigo-700',
    pagada: 'bg-emerald-100 text-emerald-700',
    vencida: 'bg-rose-100 text-rose-700',
};

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MisCuotas({ quotas = [] }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#181411]">Mis cuotas</h2>
            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-gray-400">
                        <tr>
                            <th className="py-3 pr-4">Mes</th>
                            <th className="py-3 pr-4">Monto</th>
                            <th className="py-3 pr-4">Vencimiento</th>
                            <th className="py-3 pr-4">Estado</th>
                            <th className="py-3 pr-4">Comprobante</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {quotas.map((quota) => (
                            <tr key={quota.id}>
                                <td className="py-3 pr-4 font-bold">{quota.mes}</td>
                                <td className="py-3 pr-4">{formatMoney(quota.monto)}</td>
                                <td className="py-3 pr-4">{quota.fecha_vencimiento || '-'}</td>
                                <td className="py-3 pr-4">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes[quota.estado] || classes.pendiente}`}>
                                        {labels[quota.estado] || quota.estado}
                                    </span>
                                </td>
                                <td className="py-3 pr-4">
                                    {quota.comprobante_url ? (
                                        <a href={quota.comprobante_url} target="_blank" rel="noreferrer" className="font-bold text-primary">
                                            Ver archivo
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!quotas.length ? (
                            <tr>
                                <td className="py-8 text-center text-gray-500" colSpan={5}>
                                    Todavia no hay cuotas generadas.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
