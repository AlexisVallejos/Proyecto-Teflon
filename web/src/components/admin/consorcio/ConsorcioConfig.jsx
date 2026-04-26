import React from 'react';

const fieldClass = 'w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white outline-none focus:border-evolution-indigo';

export default function ConsorcioConfig({ manager }) {
    const { config, setConfig, saveConfig, saving } = manager;
    const bank = config?.bank_transfer || {};

    const updateField = (field, value) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const updateBank = (field, value) => {
        setConfig((prev) => ({
            ...prev,
            bank_transfer: {
                ...(prev.bank_transfer || {}),
                [field]: value,
            },
        }));
    };

    return (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
            <div className="mb-5">
                <h3 className="text-lg font-bold text-white">Configuracion del consorcio</h3>
                <p className="text-sm text-zinc-400">
                    Parametros propios del modulo, separados del checkout de la tienda.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Cuota mensual</span>
                    <input className={fieldClass} type="number" min="0" step="0.01" value={config.monthly_fee || 0} onChange={(e) => updateField('monthly_fee', e.target.value)} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Maximo activos</span>
                    <input className={fieldClass} type="number" min="1" value={config.max_active_clubs || 200} onChange={(e) => updateField('max_active_clubs', e.target.value)} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Dias de aviso</span>
                    <input className={fieldClass} type="number" min="1" value={config.reminder_days || 5} onChange={(e) => updateField('reminder_days', e.target.value)} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Dia de vencimiento</span>
                    <input className={fieldClass} type="number" min="1" max="28" value={config.quota_due_day || 10} onChange={(e) => updateField('quota_due_day', e.target.value)} />
                </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">CBU</span>
                    <input className={fieldClass} value={bank.cbu || ''} onChange={(e) => updateBank('cbu', e.target.value)} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Alias</span>
                    <input className={fieldClass} value={bank.alias || ''} onChange={(e) => updateBank('alias', e.target.value)} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Banco</span>
                    <input className={fieldClass} value={bank.bank || ''} onChange={(e) => updateBank('bank', e.target.value)} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase text-zinc-500">Titular</span>
                    <input className={fieldClass} value={bank.holder || ''} onChange={(e) => updateBank('holder', e.target.value)} />
                </label>
            </div>

            <div className="mt-6 flex justify-end">
                <button type="button" disabled={saving} onClick={saveConfig} className="rounded-xl bg-evolution-indigo px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                    {saving ? 'Guardando...' : 'Guardar configuracion'}
                </button>
            </div>
        </section>
    );
}
