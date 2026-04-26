import React from 'react';

export default function MisSorteos({ draws = [] }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#181411]">Mis sorteos</h2>
            <p className="mt-1 text-sm text-gray-500">Meses en los que el club resulto seleccionado.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {draws.map((draw) => (
                    <div key={draw.id} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-black text-emerald-800">Ganador {draw.mes}</p>
                        <p className="mt-1 text-xs text-emerald-700">
                            Registrado el {new Date(draw.created_at).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                ))}
                {!draws.length ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 md:col-span-2">
                        Todavia no registra sorteos ganados.
                    </div>
                ) : null}
            </div>
        </section>
    );
}
