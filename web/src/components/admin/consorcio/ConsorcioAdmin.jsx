import React, { useEffect } from 'react';
import ClubsTable from './ClubsTable';
import CuotasTable from './CuotasTable';
import SorteoPanel from './SorteoPanel';
import ConsorcioConfig from './ConsorcioConfig';

const tabs = [
    { id: 'clubs', label: 'Clubes' },
    { id: 'quotas', label: 'Cuotas' },
    { id: 'draws', label: 'Sorteo' },
    { id: 'config', label: 'Configuracion' },
];

export default function ConsorcioAdmin({ manager }) {
    const { activeTab, setActiveTab, loading, error, loadAll } = manager;

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-10 text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Cargando consorcio...
                </div>
            );
        }
        if (activeTab === 'clubs') return <ClubsTable manager={manager} />;
        if (activeTab === 'quotas') return <CuotasTable manager={manager} />;
        if (activeTab === 'draws') return <SorteoPanel manager={manager} />;
        return <ConsorcioConfig manager={manager} />;
    };

    return (
        <div className="space-y-5 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Consorcio de Clubes</h2>
                    <p className="text-sm text-zinc-400">
                        Gestion de clubes, cuotas por transferencia y sorteos mensuales.
                    </p>
                </div>
                <div className="flex rounded-2xl border border-white/10 bg-zinc-950/60 p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-evolution-indigo text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            ) : null}

            {renderContent()}
        </div>
    );
}
