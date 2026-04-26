import React, { useMemo, useState } from 'react';

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PagarCuota({ currentQuota, config, onUploadProof, uploading }) {
    const [file, setFile] = useState(null);
    const bank = config?.bank_transfer || {};
    const canUpload = currentQuota && ['pendiente', 'vencida', 'en_revision'].includes(currentQuota.estado);
    const alreadyPaid = currentQuota?.estado === 'pagada';

    const statusText = useMemo(() => {
        if (!currentQuota) return 'Sin cuota generada para este mes.';
        if (alreadyPaid) return 'La cuota de este mes ya figura pagada.';
        if (currentQuota.estado === 'en_revision') return 'Tu comprobante esta en revision.';
        if (currentQuota.estado === 'vencida') return 'La cuota esta vencida. Subi el comprobante para regularizarla.';
        return 'Subi el comprobante luego de realizar la transferencia.';
    }, [alreadyPaid, currentQuota]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!file || !currentQuota) return;
        onUploadProof(currentQuota.id, file).then(() => setFile(null));
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#181411]">Pagar cuota</h2>
            <p className="mt-1 text-sm text-gray-500">{statusText}</p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                    ['CBU', bank.cbu],
                    ['Alias', bank.alias],
                    ['Banco', bank.bank],
                    ['Titular', bank.holder],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
                        <p className="mt-1 truncate text-sm font-bold text-[#181411]">{value || '-'}</p>
                    </div>
                ))}
            </div>

            {currentQuota ? (
                <div className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-sm text-[#181411]">
                    Cuota {currentQuota.mes}: <strong>{formatMoney(currentQuota.monto)}</strong>
                </div>
            ) : null}

            {canUpload ? (
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => setFile(event.target.files?.[0] || null)}
                        className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {uploading ? 'Subiendo...' : 'Subir comprobante'}
                    </button>
                </form>
            ) : null}
        </section>
    );
}
