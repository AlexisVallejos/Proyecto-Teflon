import React, { useState } from 'react';
import BranchLocationPicker from './BranchLocationPicker';
import ShippingZonesMapPreview from './ShippingZonesMapPreview';

const CHECKOUT_METHOD_OPTIONS = [
    { key: 'transfer', label: 'Transferencia' },
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
    latitude: '',
    longitude: '',
    enabled: true,
});

const EMPTY_SHIPPING_ZONE = () => ({
    id: createLocalId(),
    name: '',
    description: '',
    price: 0,
    type: 'flat',
    branch_id: '',
    min_distance_km: 0,
    max_distance_km: '',
    enabled: true,
});

const fieldClass =
    'w-full rounded-xl border border-white/25 bg-zinc-900/70 px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-evolution-indigo focus:ring-2 focus:ring-evolution-indigo/30';

const compactFieldClass =
    'w-full rounded-lg border border-white/25 bg-zinc-900/70 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-evolution-indigo focus:ring-2 focus:ring-evolution-indigo/30';

const CheckoutEditor = ({ settings, setSettings, onSave, isSaving }) => {
    const [mapBranchIndex, setMapBranchIndex] = useState(null);
    const checkoutMethods = Array.isArray(settings?.commerce?.payment_methods)
        ? settings.commerce.payment_methods
        : ['transfer', 'cash_on_pickup'];

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
        setMapBranchIndex(branches.length);
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
        setMapBranchIndex((current) => {
            if (current == null) return current;
            if (current === index) return null;
            return current > index ? current - 1 : current;
        });
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

    const toggleBranchMap = (index) => {
        setMapBranchIndex((current) => (current === index ? null : index));
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
                            {shippingZones.some((zone) => zone.type === 'distance') ? (
                                <option value="distance:auto" className="bg-zinc-900">
                                    Envio segun ubicacion
                                </option>
                            ) : null}
                            {shippingZones.map((zone) => (
                                <option key={`zone-${zone.id}`} value={`zone:${zone.id}`} className="bg-zinc-900">
                                    {zone.type === 'distance' ? 'Distancia' : 'Zona'}: {zone.name}
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
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <select
                                    value={zone.type || 'flat'}
                                    onChange={(e) => updateShippingZone(index, 'type', e.target.value)}
                                    className={compactFieldClass}
                                >
                                    <option value="flat" className="bg-zinc-900">Zona fija</option>
                                    <option value="distance" className="bg-zinc-900">Por distancia</option>
                                </select>
                                {zone.type === 'distance' ? (
                                    <select
                                        value={zone.branch_id || ''}
                                        onChange={(e) => updateShippingZone(index, 'branch_id', e.target.value)}
                                        className={compactFieldClass}
                                    >
                                        <option value="" className="bg-zinc-900">Sucursal origen</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id} className="bg-zinc-900">
                                                {branch.name || branch.id}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-zinc-500">
                                        El cliente elige esta zona directamente.
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                value={zone.description || ''}
                                placeholder="Descripcion"
                                onChange={(e) => updateShippingZone(index, 'description', e.target.value)}
                                className={compactFieldClass}
                            />
                            {zone.type === 'distance' ? (
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={zone.min_distance_km ?? 0}
                                        placeholder="Desde km"
                                        onChange={(e) => updateShippingZone(index, 'min_distance_km', Number(e.target.value || 0))}
                                        className={compactFieldClass}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={zone.max_distance_km ?? ''}
                                        placeholder="Hasta km"
                                        onChange={(e) => updateShippingZone(index, 'max_distance_km', e.target.value === '' ? '' : Number(e.target.value))}
                                        className={compactFieldClass}
                                    />
                                </div>
                            ) : null}
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
                <p className="text-xs text-zinc-500">
                    Las zonas por distancia usan la ubicacion del cliente y la sucursal origen para calcular el costo.
                </p>
                <ShippingZonesMapPreview branches={branches} shippingZones={shippingZones} />
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
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={branch.latitude ?? ''}
                                    placeholder="Latitud"
                                    onChange={(e) => updateBranch(index, 'latitude', e.target.value === '' ? '' : Number(e.target.value))}
                                    className={compactFieldClass}
                                />
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={branch.longitude ?? ''}
                                    placeholder="Longitud"
                                    onChange={(e) => updateBranch(index, 'longitude', e.target.value === '' ? '' : Number(e.target.value))}
                                    className={compactFieldClass}
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs text-zinc-500">
                                    Usa OpenStreetMap para elegir la sucursal o deja las coordenadas manuales.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => toggleBranchMap(index)}
                                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-200 transition-all hover:border-white/25 hover:bg-white/10"
                                >
                                    {mapBranchIndex === index ? 'Ocultar mapa' : 'Seleccionar en mapa'}
                                </button>
                            </div>
                            {mapBranchIndex === index ? (
                                <BranchLocationPicker
                                    branch={branch}
                                    onAddressChange={(value) => updateBranch(index, 'address', value)}
                                    onCoordinatesChange={({ latitude, longitude }) => {
                                        updateBranch(index, 'latitude', latitude);
                                        updateBranch(index, 'longitude', longitude);
                                    }}
                                />
                            ) : null}
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
                <p className="text-xs text-zinc-500">
                    Carga latitud y longitud para habilitar el calculo de envio por distancia desde esa sucursal. El selector usa OpenStreetMap y no requiere Google Cloud.
                </p>
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


