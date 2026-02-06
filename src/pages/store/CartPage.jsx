import React, { useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";

export default function CartPage() {

    const [cartItems, setCartItems] = useState([
        {
            id: "SET-BATH-001",
            name: "Deluxe Porcelain Toilet Set",
            sku: "SET-BATH-001",
            finish: "Glossy White",
            price: 459.0,
            qty: 1,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDv8YzTCR4gX6zFam1LwuH5HJDAvE7aoXu0L9TL3JEOIcOHOTOo9gR_f4s9-fMVH0hYykw7F1_qJR2tnBpxcugeFAX1ZL0xHfBmmOniSI2_EoVFQBT_xRfiRBjHjaC17PYofIUT_SN9UIb0LIfiokaioKAtueDer-u8wQFqGvO6ynAkWb3h5nY4Ky3WNKUcPhQwwwhWEAp4pT0mPjay6W_ZpDUjHJJvvuNKQCYqeDg7kLZfBX1Z17RERUu1m8P2FMBpPzsIadDuEuo",
            alt: "Modern high-end ceramic white toilet in minimalist bathroom",
        },
        {
            id: "KITCH-F-992",
            name: "Chrome Kitchen Faucet",
            sku: "KITCH-F-992",
            finish: "Polished Chrome",
            price: 129.5,
            qty: 1,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAfZANt4wnettS9zM29Iu_Ou5J0oBh7sIDLGOG8nhRyoKdDucptDU4R4Uy_tWIKUeKer1UynWLegSrymoCgaz5uZX1IxZ2SnhTeAwbf-oTAvGQFPBNtz7h6msgH1RziEahlJ5jrd_9j2nYYX1_uvWx0JW3VTOZG63Il1k8vkz6WwZxZpzE3wFy9OqC5XFCp0b341k-4vyxGT5iu_ApOGulnpeiUUpa4G8XSbMxeKJu52IGjnRlLU0VizCu_wjNCAqBZPoePiG8eHQk",
            alt: "Close up of flushing mechanism / product shot",
        },
    ]);

    const frequentlyBought = useMemo(
        () => [
            {
                id: "ADD-INS-001",
                name: "Installation Kit",
                price: 24.99,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAi9SmBaQmnYzStL8Gj4LTvnSZ7g224X01bDGcuTtFUMgpyfvf0QXmV7U1Yuig9YznlmPgrW-TxpMiriX27oI8fnTekPNxR8VK_wv6lbSOTp9ISGejQRMoujHtzd4fBr-_ik0srmNKh3RQg49L7uuZMhsujGdGlNvjOHduVVB6VXGo1n_iHJ-aF-LviHagqS7Is9ybIIo2IaN1o62VEm8zOltEq82ctJSCTA9a2ritultjetB72IjhfQ2yGoE0c2REJjktmiN27LgQ",
                alt: "Installation kit close-up",
            },
            {
                id: "ADD-SIL-002",
                name: "Silicone Sealant",
                price: 12.5,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAot3vJROZtP44PaIZ0wb_jJjqR0WKvwN53AyUXh2SIs5lPwb5Yg7tGpgHDRPAdzzSJeScEyxjJvySYuticwqBuCNoXGB3tZ4Mct2DmSl8qALnIwTUsFttZxIdLY4J_z3IIP_cT807TmSub1WTHsTUnvxXqRNgpYcKTnB4iaslPulsdBzJjrKtPQKpjb3HvDVJhIHNIAjm5o_Sc1IF2M4MH1VCcu3zwmjxJLIzGN0SJSUKoGhmrYpB-0Dfl9J2-N-gFX76D0vO_YAs",
                alt: "Silicone sealant product shot",
            },
        ],
        []
    );

    const cartCount = useMemo(
        () => cartItems.reduce((acc, it) => acc + it.qty, 0),
        [cartItems]
    );

    const updateQty = (id, nextQty) => {
        setCartItems((prev) =>
            prev
                .map((it) => (it.id === id ? { ...it, qty: Math.max(1, nextQty) } : it))
                .filter((it) => it.qty > 0)
        );
    };

    const removeItem = (id) => {
        setCartItems((prev) => prev.filter((it) => it.id !== id));
    };

    const addToCart = (item) => {
        setCartItems((prev) => {
            const found = prev.find((p) => p.id === item.id);
            if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
            return [
                ...prev,
                {
                    id: item.id,
                    sku: item.id,
                    name: item.name,
                    finish: "—",
                    price: item.price,
                    qty: 1,
                    image: item.image,
                    alt: item.alt,
                },
            ];
        });
    };

    const subtotal = useMemo(
        () => cartItems.reduce((acc, it) => acc + it.price * it.qty, 0),
        [cartItems]
    );

    // Mock: shipping/tax iguales a tu HTML, pero calculables
    const shipping = useMemo(() => (subtotal > 0 ? 15.0 : 0.0), [subtotal]);
    const tax = useMemo(() => subtotal * 0.08, [subtotal]); // 8% ejemplo
    const total = subtotal + shipping + tax;

    const freeShippingThreshold = 999;
    const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

    return (
        <StoreLayout>
            <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-black tracking-tight">Shopping Cart</h1>
                    <p className="text-[#8a7560] text-sm">
                        You have {cartCount} item{cartCount === 1 ? "" : "s"} in your cart
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
                            />
                        ))}

                        {/* Frequently Bought Together */}
                        <div className="mt-10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Frequently Bought Together
                                    <span className="material-symbols-outlined text-zinc-400 text-sm cursor-pointer">
                                        edit
                                    </span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {frequentlyBought.map((x) => (
                                    <UpsellCard key={x.id} item={x} onAdd={() => addToCart(x)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                            <div className="flex flex-col gap-4 mb-6">
                                <Row label="Subtotal" value={formatCurrency(subtotal)} />
                                <Row label="Shipping Estimate" value={formatCurrency(shipping)} />
                                <Row label="Tax Estimate" value={formatCurrency(tax)} />
                            </div>

                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold">Total</span>
                                    <span className="text-3xl font-black text-primary">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.hash = '#checkout'}
                                className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
                            >
                                Proceed to Checkout
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>

                            <div className="flex flex-col gap-4 mt-8">
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <span className="material-symbols-outlined text-primary">
                                        local_shipping
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Free Shipping Qualification</span>
                                        <span className="text-[10px] text-zinc-500">
                                            {freeShippingRemaining > 0
                                                ? `Spend ${formatCurrency(freeShippingRemaining)} more for free shipping`
                                                : "You qualify for free shipping!"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <span className="material-symbols-outlined text-primary">
                                        verified_user
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Secure Checkout</span>
                                        <span className="text-[10px] text-zinc-500">
                                            SSL Encrypted Payment System
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

function CartItem({ item, onRemove, onDec, onInc, onChangeQty }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex gap-6 relative group">
            <button
                onClick={onRemove}
                className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                title="Remove"
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

                <p className="text-sm text-zinc-500 mt-2">Finish: {item.finish}</p>

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

                    <div className="text-right">
                        <span className="text-xl font-black text-black dark:text-white">
                            {formatCurrency(item.price * item.qty)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UpsellCard({ item, onAdd }) {
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
                <span className="text-primary font-bold text-sm">{formatCurrency(item.price)}</span>
            </div>

            <button
                onClick={onAdd}
                className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
                title="Add to cart"
            >
                <span className="material-symbols-outlined">add_shopping_cart</span>
            </button>
        </div>
    );
}
