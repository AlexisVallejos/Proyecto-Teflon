import React from 'react';
import { Bell, CheckCircle, CreditCard, UserCheck } from '@phosphor-icons/react';

const formatMoney = (value, currency = 'ARS') => {
    const amount = Number(value || 0);
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
    } catch (err) {
        return `${amount.toFixed(2)} ${currency}`;
    }
};

const formatDateTime = (value) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('es-AR');
    } catch (err) {
        return value;
    }
};

const NotificationsPopover = ({ manager, onOpenCenter, onClose }) => {
    if (!manager) return null;

    const {
        loading,
        error,
        pendingUsers,
        paymentApprovals,
        recentNotifications,
        actionKey,
        refresh,
        approveUser,
        approvePayment,
    } = manager;

    const previewItems = recentNotifications.slice(0, 6);

    return (
        <div
            style={{
                backgroundColor: 'var(--admin-panel-bg)',
                borderColor: 'var(--admin-border)',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.22)',
            }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] rounded-3xl border p-3 animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Centro rapido</p>
                        <p className="mt-1 text-lg font-semibold text-white">Notificaciones</p>
                        <p className="mt-1 text-xs text-zinc-400">
                            Usuarios por aprobar y pagos pendientes sin salir del topbar.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onOpenCenter?.();
                            onClose?.();
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-100 transition hover:bg-white/10"
                    >
                        Ver todo
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center gap-2 text-zinc-300">
                            <UserCheck size={16} weight="bold" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Usuarios</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-white">{pendingUsers.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center gap-2 text-zinc-300">
                            <CreditCard size={16} weight="bold" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Pagos</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-white">{paymentApprovals.length}</p>
                    </div>
                </div>
            </div>

            <div className="custom-scrollbar mt-3 max-h-[420px] overflow-auto pr-1">
                {error ? (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-zinc-400">
                        Actualizando notificaciones...
                    </div>
                ) : null}

                {!loading && !previewItems.length ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-10 text-center text-sm text-zinc-500">
                        No hay nada pendiente por ahora.
                    </div>
                ) : null}

                {!loading && previewItems.length ? (
                    <div className="space-y-3">
                        {previewItems.map((item) => {
                            const isUser = item.kind === 'user_approval';
                            const approveKey = isUser ? `user:${item.userId}` : `order:${item.orderId}:paid`;
                            return (
                                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {isUser ? (
                                                    <UserCheck size={14} weight="bold" className="text-amber-300" />
                                                ) : (
                                                    <Bell size={14} weight="bold" className="text-sky-300" />
                                                )}
                                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                            </div>
                                            <p className="text-xs text-zinc-400">{item.subtitle}</p>
                                            <p className="text-[11px] text-zinc-500">
                                                {isUser
                                                    ? formatDateTime(item.created_at)
                                                    : `${formatMoney(item.total, item.currency)} · ${formatDateTime(item.created_at)}`}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => (isUser ? approveUser({ id: item.userId, role: item.role }) : approvePayment(item.order))}
                                            disabled={actionKey === approveKey}
                                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/12 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300 transition hover:bg-emerald-500/18 disabled:opacity-60"
                                        >
                                            <CheckCircle size={14} weight="bold" />
                                            {actionKey === approveKey ? '...' : 'Resolver'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 px-1 pt-3">
                <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-200 transition hover:bg-white/10 disabled:opacity-60"
                >
                    {loading ? 'Actualizando...' : 'Recargar'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onOpenCenter?.();
                        onClose?.();
                    }}
                    className="rounded-xl bg-[var(--admin-accent)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--admin-accent-contrast)] transition hover:opacity-90"
                >
                    Abrir bandeja
                </button>
            </div>
        </div>
    );
};

export default NotificationsPopover;
