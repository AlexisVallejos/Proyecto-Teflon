import React, { useMemo } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";

export default function CartPage() {
    const { cartItems, updateQty, removeItem, addToCart } = useStore();
    const { settings } = useTenant();
    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const showPrices = settings?.commerce?.show_prices !== false;

    const frequentlyBought = useMemo(
        () => [
            {
                id: "ADD-INS-001",
                name: "Kit de instalación",
                price: 2499,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAi9SmBaQmnYzStL8Gj4LTvnSZ7g224X01bDGcuTtFUMgpyfvf0QXmV7U1Yuig9YznlmPgrW-TxpMiriX27oI8fnTekPNxR8VK_wv6lbSOTp9ISGejQRMoujHtzd4fBr-_ik0srmNKh3RQg49L7uuZMhsujGdGlNvjOHduVVB6VXGo1n_iHJ-aF-LviHagqS7Is9ybIIo2IaN1o62VEm8zOltEq82ctJSCTA9a2ritultjetB72IjhfQ2yGoE0c2REJjktmiN27LgQ",
                alt: "Kit de instalación",
            },
            {
                id: "ADD-SIL-002",
                name: "Sellador de silicona",
                price: 1250,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAot3vJROZtP44PaIZ0wb_jJjqR0WKvwN53AyUXh2SIs5lPwb5Yg7tGpgHDRPAdzzSJeScEyxjJvySYuticwqBuCNoXGB3tZ4Mct2DmSl8qALnIwTUsFttZxIdLY4J_z3IIP_cT807TmSub1WTHsTUnvxXqRNgpYcKTnB4iaslPulsdBzJjrKtPQKpjb3HvDVJhIHNIAjm5o_Sc1IF2M4MH1VCcu3zwmjxJLIzGN0SJSUKoGhmrYpB-0Dfl9J2-N-gFX76D0vO_YAs",
                alt: "Sellador de silicona",
            },
        ],
        []
    );

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
                        onClick={() => (window.location.hash = '#catalog')}
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
                                    <span className="material-symbols-outlined text-zinc-400 text-sm cursor-pointer">
                                        edit
                                    </span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {frequentlyBought.map((x) => (
                                    <UpsellCard
                                        key={x.id}
                                        item={x}
                                        onAdd={() => addToCart(x)}
                                        currency={currency}
                                        locale={locale}
                                        showPrices={showPrices}
                                    />
                                ))}
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
                                onClick={() => (window.location.hash = '#checkout')}
                                className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
                            >
                                Continuar al checkout
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>

                            <div className="flex flex-col gap-4 mt-8">
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <span className="material-symbols-outlined text-primary">
                                        local_shipping
                                    </span>
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
                                    <span className="material-symbols-outlined text-primary">
                                        verified_user
                                    </span>
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
                <span className="material-symbols-outlined">delete</span>
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
                    <span className="material-symbols-outlined text-zinc-300 opacity-0 group-hover:opacity-100 cursor-pointer text-sm">
                        edit
                    </span>
                </div>

                <p className="text-sm text-zinc-500 mt-2">
                    Acabado: {item.variant || "Estándar"}
                </p>

                <div className="mt-auto flex items-end justify-between">
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg h-9 bg-zinc-50 dark:bg-zinc-800">
                        <button onClick={onDec} className="px-2 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">remove</span>
                        </button>

                        <input
                            className="w-10 text-center bg-transparent border-none focus:ring-0 font-bold text-sm"
                            type="number"
                            value={item.qty}
                            min={1}
                            onChange={(e) => onChangeQty(Number(e.target.value || 1))}
                        />

                        <button onClick={onInc} className="px-2 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">add</span>
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
                <span className="material-symbols-outlined">add_shopping_cart</span>
            </button>
        </div>
    );
}
