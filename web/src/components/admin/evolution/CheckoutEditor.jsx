import React from 'react';

const CHECKOUT_METHOD_OPTIONS = [
    { key: 'transfer', label: 'Transferencia' },
    { key: 'stripe', label: 'Stripe' },
    { key: 'cash_on_pickup', label: 'Pago en local' },
];

const createLocalId = () => (
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const EMPTY_BRANCH = () => ({
    id: createLocalId(),
    name: '',
    address: '',
    hours: '',
    phone: '',
    pickup_fee: 0,
    enabled: true,
});

const EMPTY_SHIPPING_ZONE = () => ({
    id: createLocalId(),
    name: '',
    description: '',
    price: 0,
    enabled: true,
});

const fieldClass =
    'w-full rounded-xl border border-white/25 bg-zinc-900/70 px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-evolution-indigo focus:ring-2 focus:ring-evolution-indigo/30';

const compactFieldClass =
    'w-full rounded-lg border border-white/25 bg-zinc-900/70 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-evolution-indigo focus:ring-2 focus:ring-evolution-indigo/30';

const CheckoutEditor = ({ settings, setSettings, onSave, isSaving }) => {
    const checkoutMethods = Array.isArray(settings?.commerce?.payment_methods)
        ? settings.commerce.payment_methods
        : ['stripe', 'transfer'];

    const shippingZones = Array.isArray(settings?.commerce?.shipping_zones)
        ? settings.commerce.shipping_zones
        : [];

    const branches = Array.isArray(settings?.commerce?.branches)
        ? settings.commerce.branches
        : [];

    const bankTransferSettings = settings?.commerce?.bank_transfer || {};

    const toggleCheckoutMethod = (method) => {
        if (!CHECKOUT_METHOD_OPTIONS.some((opt) => opt.key === method)) return;
        setSettings((prev) => {
            const current = Array.isArray(prev.commerce?.payment_methods)
                ? prev.commerce.payment_methods
                : [];
            const exists = current.includes(method);
            if (exists && current.length <= 1) {
                return prev;
            }
            const next = exists ? current.filter((item) => item !== method) : [...current, method];
            return {
                ...prev,
                commerce: {
                    ...prev.commerce,
                    payment_methods: next,
                },
            };
        });
    };

    const updateCommerceField = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            commerce: {
                ...prev.commerce,
                [field]: value,
            },
        }));
    };

    const updateBankTransferField = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            commerce: {
                ...prev.commerce,
                bank_transfer: {
                    ...(prev.commerce?.bank_transfer || {}),
                    [field]: value,
                },
            },
        }));
    };

    const addShippingZone = () => {
        setSettings((prev) => ({
            ...prev,
            commerce: {
                ...prev.commerce,
                shipping_zones: [
                    ...(Array.isArray(prev.commerce?.shipping_zones) ? prev.commerce.shipping_zones : []),
                    EMPTY_SHIPPING_ZONE(),
                ],
            },
        }));
    };

    const updateShippingZone = (index, field, value) => {
        setSettings((prev) => {
            const current = Array.isArray(prev.commerce?.shipping_zones)
                ? [...prev.commerce.shipping_zones]
                : [];
            if (!current[index]) return prev;
            current[index] = { ...current[index], [field]: value };
            return {
                ...prev,
                commerce: {
                    ...prev.commerce,
                    shipping_zones: current,
                },
            };
        });
    };

    const removeShippingZone = (index) => {
        setSettings((prev) => {
            const current = Array.isArray(prev.commerce?.shipping_zones)
                ? [...prev.commerce.shipping_zones]
                : [];
            if (!current[index]) return prev;
            current.splice(index, 1);
            return {
                ...prev,
                commerce: {
                    ...prev.commerce,
                    shipping_zones: current,
                },
            };
        });
    };

    const addBranch = () => {
        setSettings((prev) => ({
            ...prev,
            commerce: {
                ...prev.commerce,
                branches: [...(Array.isArray(prev.commerce?.branches) ? prev.commerce.branches : []), EMPTY_BRANCH()],
            },
        }));
    };

    const updateBranch = (index, field, value) => {
        setSettings((prev) => {
            const current = Array.isArray(prev.commerce?.branches) ? [...prev.commerce.branches] : [];
            if (!current[index]) return prev;
            current[index] = { ...current[index], [field]: value };
            return {
                ...prev,
                commerce: {
                    ...prev.commerce,
                    branches: current,
                },
            };
        });
    };

    const removeBranch = (index) => {
        setSettings((prev) => {
            const current = Array.isArray(prev.commerce?.branches) ? [...prev.commerce.branches] : [];
            if (!current[index]) return prev;
            current.splice(index, 1);
            return {
                ...prev,
                commerce: {
                    ...prev.commerce,
                    branches: current,
                },
            };
        });
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Checkout</h2>
                    <p className="text-sm text-zinc-400">Completa los campos para pagos, envio y sucursales.</p>
                </div>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="rounded-lg bg-evolution-indigo px-3 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                    {isSaving ? 'Guardando...' : 'Guardar ajustes'}
                </button>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Metodos de pago</p>
                <div className="flex flex-wrap gap-2">
                    {CHECKOUT_METHOD_OPTIONS.map((method) => {
                        const selected = checkoutMethods.includes(method.key);
                        return (
                            <button
                                key={method.key}
                                type="button"
                                onClick={() => toggleCheckoutMethod(method.key)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                                    selected
                                        ? 'border-evolution-indigo/70 bg-evolution-indigo/20 text-indigo-100'
                                        : 'border-white/15 bg-black/20 text-zinc-300'
                                }`}
                            >
                                {method.label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-zinc-500">Selecciona que opciones va a ver el cliente en checkout.</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Notificaciones de pedido</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">WhatsApp del pedido</label>
                        <input
                            type="text"
                            value={settings?.commerce?.whatsapp_number || ''}
                            placeholder="+54 11..."
                            onChange={(e) => updateCommerceField('whatsapp_number', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Gmail del admin</label>
                        <input
                            type="email"
                            value={settings?.commerce?.order_notification_email || settings?.commerce?.email || ''}
                            placeholder="pedidos@tuempresa.com"
                            onChange={(e) => updateCommerceField('order_notification_email', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Email visible de la tienda</label>
                        <input
                            type="email"
                            value={settings?.commerce?.email || ''}
                            placeholder="info@tuempresa.com"
                            onChange={(e) => updateCommerceField('email', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Estado cliente</label>
                        <input
                            type="text"
                            value={settings?.commerce?.customer_order_processing_label || ''}
                            placeholder="En proceso"
                            onChange={(e) => updateCommerceField('customer_order_processing_label', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Texto para el cliente</label>
                        <textarea
                            rows={4}
                            value={settings?.commerce?.customer_order_processing_text || ''}
                            placeholder="Tu pedido fue recibido y se encuentra en proceso."
                            onChange={(e) => updateCommerceField('customer_order_processing_text', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Asunto pago aprobado</label>
                        <input
                            type="text"
                            value={settings?.commerce?.customer_payment_approved_subject || ''}
                            placeholder="Pago aprobado para tu pedido #{{order_id}}"
                            onChange={(e) => updateCommerceField('customer_payment_approved_subject', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Texto pago aprobado</label>
                        <textarea
                            rows={4}
                            value={settings?.commerce?.customer_payment_approved_text || ''}
                            placeholder="Confirmamos que tu pago fue aprobado. Ya estamos preparando tu pedido."
                            onChange={(e) => updateCommerceField('customer_payment_approved_text', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Asunto pago cancelado</label>
                        <input
                            type="text"
                            value={settings?.commerce?.customer_payment_cancelled_subject || ''}
                            placeholder="Actualizacion de tu pedido #{{order_id}}"
                            onChange={(e) => updateCommerceField('customer_payment_cancelled_subject', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Texto pago cancelado</label>
                        <textarea
                            rows={4}
                            value={settings?.commerce?.customer_payment_cancelled_text || ''}
                            placeholder="Te informamos de manera formal que no pudimos aprobar el pago de tu pedido."
                            onChange={(e) => updateCommerceField('customer_payment_cancelled_text', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Estado admin</label>
                        <input
                            type="text"
                            value={settings?.commerce?.admin_order_confirmation_label || ''}
                            placeholder="En confirmacion"
                            onChange={(e) => updateCommerceField('admin_order_confirmation_label', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Texto para el admin</label>
                        <textarea
                            rows={4}
                            value={settings?.commerce?.admin_order_confirmation_text || ''}
                            placeholder="Tienes un pedido en confirmacion. Revisa el panel de usuarios y confirma la compra."
                            onChange={(e) => updateCommerceField('admin_order_confirmation_text', e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                </div>
                <p className="text-xs text-zinc-500">
                    Variables disponibles para los textos: <code>{'{{order_id}}'}</code>, <code>{'{{customer_name}}'}</code>, <code>{'{{customer_email}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{payment_method}}'}</code>, <code>{'{{delivery_label}}'}</code>, <code>{'{{status}}'}</code>, <code>{'{{cancel_reason}}'}</code>.
                </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Impuestos y entrega</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Tasa de impuesto</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={settings?.commerce?.tax_rate ?? 0}
                            onChange={(e) => updateCommerceField('tax_rate', Number(e.target.value || 0))}
                            className={fieldClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Entrega por defecto</label>
                        <select
                            value={settings?.commerce?.default_delivery || ''}
                            onChange={(e) => updateCommerceField('default_delivery', e.target.value)}
                            className={fieldClass}
                        >
                            <option value="" className="bg-zinc-900">Sin definir</option>
                            {shippingZones.map((zone) => (
                                <option key={`zone-${zone.id}`} value={`zone:${zone.id}`} className="bg-zinc-900">
                                    Zona: {zone.name}
                                </option>
                            ))}
                            {branches.map((branch) => (
                                <option key={`branch-${branch.id}`} value={`branch:${branch.id}`} className="bg-zinc-900">
                                    Sucursal: {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Zonas de envio</p>
                    <button
                        type="button"
                        onClick={addShippingZone}
                        className="rounded-lg bg-evolution-indigo px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white"
                    >
                        Agregar zona
                    </button>
                </div>
                <div className="space-y-2">
                    {shippingZones.map((zone, index) => (
                        <div key={zone.id || index} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <input
                                    type="text"
                                    value={zone.name || ''}
                                    placeholder="Nombre de zona"
                                    onChange={(e) => updateShippingZone(index, 'name', e.target.value)}
                                    className={compactFieldClass}
                                />
                                <input
                                    type="number"
                                    value={zone.price ?? 0}
                                    placeholder="Costo"
                                    onChange={(e) => updateShippingZone(index, 'price', Number(e.target.value || 0))}
                                    className={compactFieldClass}
                                />
                            </div>
                            <input
                                type="text"
                                value={zone.description || ''}
                                placeholder="Descripcion"
                                onChange={(e) => updateShippingZone(index, 'description', e.target.value)}
                                className={compactFieldClass}
                            />
                            <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400">
                                    <input
                                        type="checkbox"
                                        checked={zone.enabled !== false}
                                        onChange={(e) => updateShippingZone(index, 'enabled', e.target.checked)}
                                    />
                                    Habilitada
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeShippingZone(index)}
                                    className="text-xs font-bold uppercase tracking-widest text-rose-300"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Sucursales</p>
                    <button
                        type="button"
                        onClick={addBranch}
                        className="rounded-lg bg-evolution-indigo px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white"
                    >
                        Agregar sucursal
                    </button>
                </div>
                <div className="space-y-2">
                    {branches.map((branch, index) => (
                        <div key={branch.id || index} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                            <input
                                type="text"
                                value={branch.name || ''}
                                placeholder="Nombre"
                                onChange={(e) => updateBranch(index, 'name', e.target.value)}
                                className={compactFieldClass}
                            />
                            <input
                                type="text"
                                value={branch.address || ''}
                                placeholder="Direccion"
                                onChange={(e) => updateBranch(index, 'address', e.target.value)}
                                className={compactFieldClass}
                            />
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                <input
                                    type="text"
                                    value={branch.hours || ''}
                                    placeholder="Horario"
                                    onChange={(e) => updateBranch(index, 'hours', e.target.value)}
                                    className={compactFieldClass}
                                />
                                <input
                                    type="text"
                                    value={branch.phone || ''}
                                    placeholder="Telefono"
                                    onChange={(e) => updateBranch(index, 'phone', e.target.value)}
                                    className={compactFieldClass}
                                />
                                <input
                                    type="number"
                                    value={branch.pickup_fee ?? 0}
                                    placeholder="Costo retiro"
                                    onChange={(e) => updateBranch(index, 'pickup_fee', Number(e.target.value || 0))}
                                    className={compactFieldClass}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400">
                                    <input
                                        type="checkbox"
                                        checked={branch.enabled !== false}
                                        onChange={(e) => updateBranch(index, 'enabled', e.target.checked)}
                                    />
                                    Habilitada
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeBranch(index)}
                                    className="text-xs font-bold uppercase tracking-widest text-rose-300"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Datos de transferencia</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                        type="text"
                        value={bankTransferSettings.cbu || ''}
                        placeholder="CBU"
                        onChange={(e) => updateBankTransferField('cbu', e.target.value)}
                        className={fieldClass}
                    />
                    <input
                        type="text"
                        value={bankTransferSettings.alias || ''}
                        placeholder="Alias"
                        onChange={(e) => updateBankTransferField('alias', e.target.value)}
                        className={fieldClass}
                    />
                    <input
                        type="text"
                        value={bankTransferSettings.bank || ''}
                        placeholder="Banco"
                        onChange={(e) => updateBankTransferField('bank', e.target.value)}
                        className={fieldClass}
                    />
                    <input
                        type="text"
                        value={bankTransferSettings.holder || ''}
                        placeholder="Titular"
                        onChange={(e) => updateBankTransferField('holder', e.target.value)}
                        className={fieldClass}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutEditor;
