import React from 'react';

const fieldClass = 'w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white outline-none focus:border-evolution-indigo';

const statusLabels = {
    pending: 'Pendiente',
    active: 'Activo',
    suspended: 'Suspendido',
};

const statusClass = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    suspended: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
};

export default function ClubsTable({ manager }) {
    const {
        clubs,
        clubForm,
        setClubForm,
        editingClubId,
        saveClub,
        resetClubForm,
        editClub,
        updateClubStatus,
        saving,
        activeClubsCount,
        config,
    } = manager;

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">{editingClubId ? 'Editar club' : 'Crear club'}</h3>
                    <p className="text-xs text-zinc-400">
                        Activos: {activeClubsCount}/{Number(config?.max_active_clubs || 200)}
                    </p>
                </div>
                <div className="space-y-3">
                    <input className={fieldClass} placeholder="Nombre del club" value={clubForm.nombre} onChange={(e) => setClubForm({ ...clubForm, nombre: e.target.value })} />
                    <input className={fieldClass} placeholder="Responsable" value={clubForm.responsable} onChange={(e) => setClubForm({ ...clubForm, responsable: e.target.value })} />
                    <input className={fieldClass} placeholder="Email de contacto" value={clubForm.email} onChange={(e) => setClubForm({ ...clubForm, email: e.target.value })} />
                    <input className={fieldClass} placeholder="Telefono" value={clubForm.telefono} onChange={(e) => setClubForm({ ...clubForm, telefono: e.target.value })} />
                    <input className={fieldClass} placeholder="CUIT / ID fiscal" value={clubForm.cuit} onChange={(e) => setClubForm({ ...clubForm, cuit: e.target.value })} />
                    <textarea className={fieldClass} rows={3} placeholder="Direccion" value={clubForm.direccion} onChange={(e) => setClubForm({ ...clubForm, direccion: e.target.value })} />
                    <select className={fieldClass} value={clubForm.estado} onChange={(e) => setClubForm({ ...clubForm, estado: e.target.value })}>
                        <option value="pending">Pendiente</option>
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                    </select>
                    <div className="flex gap-2">
                        <button type="button" disabled={saving} onClick={saveClub} className="flex-1 rounded-xl bg-evolution-indigo px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                            {saving ? 'Guardando...' : editingClubId ? 'Guardar' : 'Crear'}
                        </button>
                        {editingClubId ? (
                            <button type="button" onClick={resetClubForm} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300">
                                Cancelar
                            </button>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
                <div className="border-b border-white/10 px-5 py-4">
                    <h3 className="font-bold text-white">Clubes registrados</h3>
                    <p className="text-xs text-zinc-400">Aprobacion manual, estado de acceso y datos de contacto.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-xs uppercase text-zinc-500">
                            <tr>
                                <th className="px-4 py-3">Club</th>
                                <th className="px-4 py-3">Responsable</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Cuotas</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {clubs.map((club) => (
                                <tr key={club.id} className="text-zinc-200">
                                    <td className="px-4 py-3">
                                        <button type="button" onClick={() => editClub(club)} className="text-left font-bold text-white hover:text-evolution-indigo">
                                            {club.nombre}
                                        </button>
                                        <p className="text-xs text-zinc-500">{club.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {club.responsable}
                                        <p className="text-xs text-zinc-500">{club.telefono || '-'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusClass[club.estado] || statusClass.pending}`}>
                                            {statusLabels[club.estado] || club.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">
                                        {club.paid_quotas_count || 0}/{club.quotas_count || 0} pagadas
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            {club.estado !== 'active' ? (
                                                <button type="button" disabled={saving} onClick={() => updateClubStatus(club.id, 'active')} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                                                    Activar
                                                </button>
                                            ) : (
                                                <button type="button" disabled={saving} onClick={() => updateClubStatus(club.id, 'suspended')} className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200">
                                                    Suspender
                                                </button>
                                            )}
                                            <button type="button" onClick={() => editClub(club)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300">
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!clubs.length ? (
                                <tr>
                                    <td className="px-4 py-8 text-center text-zinc-500" colSpan={5}>
                                        Todavia no hay clubes cargados.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
