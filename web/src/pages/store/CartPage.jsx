import React, { useEffect, useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";
import { navigate } from "../../utils/navigation";
import { getApiBase, getTenantHeaders } from "../../utils/api";

export default function CartPage() {
    const { cartItems, updateQty, removeItem, addToCart } = useStore();
    const { settings } = useTenant();
    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const showPrices = settings?.commerce?.show_prices !== false;
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loadingSuggested, setLoadingSuggested] = useState(false);

    useEffect(() => {
        let active = true;

        const loadSuggested = async () => {
            setLoadingSuggested(true);
            try {
                const res = await fetch(`${getApiBase()}/public/products?limit=24`, {
                    headers: getTenantHeaders(),
                });
                if (!res.ok) {
                    throw new Error(`Suggested products request failed: ${res.status}`);
                }
                const data = await res.json();
                if (!active) return;
                const items = Array.isArray(data.items) ? data.items : [];
                const shuffled = [...items].sort(() => Math.random() - 0.5);
                setSuggestedProducts(shuffled.slice(0, 4));
            } catch (err) {
                console.error("Failed to load suggested products", err);
                if (!active) return;
                setSuggestedProducts([]);
            } finally {
                if (active) {
                    setLoadingSuggested(false);
                }
            }
        };

        loadSuggested();
        return () => {
            active = false;
        };
    }, []);

    const frequentlyBought = useMemo(() => {
        return suggestedProducts.map((product) => {
            const data = product.data || {};
            const rawImages = Array.isArray(data.images) ? data.images : [];
            const rawFirst = rawImages[0];
            const image =
                data.image ||
                data.image_url ||
                (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
                "https://via.placeholder.com/200";
            return {
                id: product.id,
                sku: product.sku || product.erp_id,
                name: product.name || "Producto",
                price: Number(product.price || 0),
                image,
                alt: data.image_alt || product.name || "Producto",
                stock: product.stock,
            };
        });
    }, [suggestedProducts]);

    const cartCount = useMemo(
        () => cartItems.reduce((acc, it) => acc + it.qty, 0),
        [cartItems]
    );

    const subtotal = useMemo(
        () => cartItems.reduce((acc, it) => acc + it.price * it.qty, 0),
        [cartItems]
    );

    const shippingFlat = Number(settings?.commerce?.shipping_flat || 0);
    const taxRate = Number(settings?.commerce?.tax_rate || 0);
    const shipping = subtotal > 0 ? shippingFlat : 0;
    const tax = (subtotal + shipping) * taxRate;
    const total = subtotal + shipping + tax;

    const freeShippingThreshold = Number(settings?.commerce?.free_shipping_threshold || 0);
    const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

    if (!cartItems.length) {
        return (
            <StoreLayout>
                <main className="max-w-[960px] mx-auto w-full px-4 md:px-10 py-16 text-center">
                    <h1 className="text-3xl font-black mb-4">Tu carrito está vacío</h1>
                    <p className="text-[#8a7560] mb-8">
                        Sumá productos para empezar tu compra.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/catalog")}
                        className="bg-primary text-white font-bold px-6 py-3 rounded-lg"
                    >
                        Ir al catálogo
                    </button>
                </main>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout>
            <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-black tracking-tight">Carrito de compras</h1>
                    <p className="text-[#8a7560] text-sm">
                        Tenés {cartCount} producto{cartCount === 1 ? "" : "s"} en tu carrito
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {cartItems.map((it) => (
                            <CartItem
                                key={it.id}
                                item={it}
                                onRemove={() => removeItem(it.id)}
                                onDec={() => updateQty(it.id, it.qty - 1)}
                                onInc={() => updateQty(it.id, it.qty + 1)}
                                onChangeQty={(v) => updateQty(it.id, v)}
                                currency={currency}
                                locale={locale}
                                showPrices={showPrices}
                            />
                        ))}

                        {/* Frequently Bought Together */}
                        <div className="mt-10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Sugeridos para tu compra
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 cursor-pointer"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loadingSuggested ? (
                                    <div className="col-span-full rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-[#8a7560]">
                                        Cargando sugeridos...
                                    </div>
                                ) : frequentlyBought.length ? (
                                    frequentlyBought.map((x) => (
                                        <UpsellCard
                                            key={x.id}
                                            item={x}
                                            onAdd={() => addToCart(x)}
                                            currency={currency}
                                            locale={locale}
                                            showPrices={showPrices}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-[#8a7560]">
                                        No hay sugeridos disponibles.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Resumen del pedido</h2>

                            <div className="flex flex-col gap-4 mb-6">
                                <Row
                                    label="Subtotal"
                                    value={formatCurrency(subtotal, currency, locale)}
                                />
                                <Row
                                    label="Envío"
                                    value={formatCurrency(shipping, currency, locale)}
                                />
                                <Row
                                    label="Impuestos"
                                    value={formatCurrency(tax, currency, locale)}
                                />
                            </div>

                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold">Total</span>
                                    <span className="text-3xl font-black text-primary">
                                        {formatCurrency(total, currency, locale)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate("/checkout")}
                                className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
                            >
                                Continuar al checkout
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>

                            <div className="flex flex-col gap-4 mt-8">
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Envío gratis</span>
                                        <span className="text-[10px] text-zinc-500">
                                            {freeShippingThreshold > 0
                                                ? freeShippingRemaining > 0
                                                    ? `Te faltan ${formatCurrency(
                                                        freeShippingRemaining,
                                                        currency,
                                                        locale
                                                    )} para envío gratis`
                                                    : "Ya calificás para envío gratis"
                                                : "Beneficios en envíos seleccionados"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Compra segura</span>
                                        <span className="text-[10px] text-zinc-500">
                                            Tus datos están protegidos
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Right */}
                </div>
            </main>
        </StoreLayout>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between text-[#8a7560] text-sm">
            <span>{label}</span>
            <span className="font-medium text-black dark:text-white">{value}</span>
        </div>
    );
}

function CartItem({ item, onRemove, onDec, onInc, onChangeQty, currency, locale, showPrices }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex gap-6 relative group">
            <button
                onClick={onRemove}
                className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                title="Eliminar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>

            <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover"
                    style={{ backgroundImage: `url("${item.image}")` }}
                    role="img"
                    aria-label={item.alt}
                    title={item.alt}
                />
            </div>

            <div className="flex flex-col flex-1 gap-1">
                <div className="flex justify-between items-start pr-8">
                    <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-xs text-[#8a7560] uppercase tracking-wider font-bold">
                            SKU: {item.sku}
                        </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 opacity-0 group-hover:opacity-100 cursor-pointer"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </div>

                <p className="text-sm text-zinc-500 mt-2">
                    Acabado: {item.variant || "Estándar"}
                </p>

                <div className="mt-auto flex items-end justify-between">
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg h-9 bg-zinc-50 dark:bg-zinc-800">
                        <button onClick={onDec} className="px-2 hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>

                        <input
                            className="w-10 text-center bg-transparent border-none focus:ring-0 font-bold text-sm"
                            type="number"
                            value={item.qty}
                            min={1}
                            onChange={(e) => onChangeQty(Number(e.target.value || 1))}
                        />

                        <button onClick={onInc} className="px-2 hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>

                    {showPrices ? (
                        <div className="text-right">
                            <span className="text-xl font-black text-black dark:text-white">
                                {formatCurrency(item.price * item.qty, currency, locale)}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function UpsellCard({ item, onAdd, currency, locale, showPrices }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 group hover:border-primary transition-colors">
            <div className="size-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover"
                    style={{ backgroundImage: `url("${item.image}")` }}
                    role="img"
                    aria-label={item.alt}
                    title={item.alt}
                />
            </div>

            <div className="flex flex-col flex-1">
                <h4 className="text-sm font-bold">{item.name}</h4>
                {showPrices ? (
                    <span className="text-primary font-bold text-sm">
                        {formatCurrency(item.price, currency, locale)}
                    </span>
                ) : null}
            </div>

            <button
                onClick={onAdd}
                className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
                title="Agregar al carrito"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path><path d="M12 9h6"></path><path d="M15 6v6"></path></svg>
            </button>
        </div>
    );
}


