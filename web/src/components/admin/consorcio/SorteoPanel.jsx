import React from 'react';

export default function SorteoPanel({ manager }) {
    const { draws, month, setMonth, runDraw, saving } = manager;
    const [lastResult, setLastResult] = React.useState(null);

    const handleRunDraw = async () => {
        const result = await runDraw();
        setLastResult(result);
    };

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
                <h3 className="text-lg font-bold text-white">Sorteo mensual</h3>
                <p className="mt-1 text-sm text-zinc-400">
                    Selecciona hasta 12 clubes con cuota pagada del mes indicado.
                </p>
                <div className="mt-5 space-y-3">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button type="button" disabled={saving} onClick={handleRunDraw} className="w-full rounded-xl bg-evolution-indigo px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                        {saving ? 'Ejecutando...' : 'Ejecutar sorteo'}
                    </button>
                </div>

                {lastResult ? (
                    <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-sm font-bold text-emerald-200">
                            Sorteo ejecutado: {lastResult.winners?.length || 0} ganadores
                        </p>
                        <p className="mt-1 text-xs text-emerald-200/80">
                            Elegibles: {lastResult.eligible_count || 0}
                        </p>
                    </div>
                ) : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
                <div className="border-b border-white/10 px-5 py-4">
                    <h3 className="font-bold text-white">Historial de sorteos</h3>
                    <p className="text-xs text-zinc-400">Ganadores registrados por mes.</p>
                </div>
                <div className="divide-y divide-white/10">
                    {draws.map((draw) => (
                        <article key={draw.id} className="p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h4 className="font-bold text-white">{draw.mes}</h4>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(draw.created_at).toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">
                                    {draw.winners?.length || 0} ganadores
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                                {(draw.winners || []).map((club) => (
                                    <div key={club.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                        <p className="text-sm font-bold text-white">{club.nombre}</p>
                                        <p className="text-xs text-zinc-500">{club.email}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                    {!draws.length ? (
                        <div className="px-5 py-8 text-center text-sm text-zinc-500">
                            Todavia no hay sorteos ejecutados.
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
