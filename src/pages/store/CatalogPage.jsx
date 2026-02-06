import React, { useMemo, useState, useEffect } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { getApiBase, getTenantHeaders } from "../../utils/api";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";

export default function CatalogPage() {
    const { search } = useStore();
    const { settings } = useTenant();
    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const showPrices = settings?.commerce?.show_prices !== false;

    const [page, setPage] = useState(1);
    const [chips, setChips] = useState([
        { id: "inodoros", label: "Inodoros", active: true, type: "active" },
        { id: "grif", label: "Grifería", active: false, type: "dropdown" },
        { id: "tanques", label: "Tanques", active: false, type: "dropdown" },
        { id: "ofertas", label: "Ofertas", active: false, type: "deal" },
    ]);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fallbackImages = useMemo(
        () => [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBQfYj1LC2KxJbrFc3JaW30fWNfBzOogedTliYaUerOGoeN9U0yPBa1Ly6cy0ifOVDGxRUhn39rTwm0asqqAroPQHLpdkrk_InCtirUQjGAQLvthIiB6EbRD71XqIoNekpixuF5np0LnNX1TY1UFuOELn9k9yOF23KgFYf1gCkfGPYdqRsN1a1b37xx0ItWp_yRvOdkSXB6CKK-dwrUA-uIDgTyng5s8My5tUJf8uzoYo7ri3rjEb8vDaZsLXgEsjTyaUDUDLV5wrk",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBVydqb7G5A_PT5CeAhoUo5VF2YXn8B2Hx2Y7DXvOB4gcZRtfBQHFy3IXPSOyox8_pIRZ01SgjOZeoV9ydnJd4VX1MFyFby5IDfG7nwbc2nvES8jZnphd62afdnYbb6Iaf8EhHngYqYD6DaMh8Y7GWRUftLJ-ruDjZNpatP8hNSQbK7lpweqdguNtcjdh8H7Qh_N1McVphjwD3cKtffejU4Ws_7fNBO0ICFabsb2GdV_B21lIn06nqXxOYw8NB228co8N3wupZ7HDc",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuClfnnmyLSA1sheGaWQ5qYtxE0FF5qt12jk3aemf83GNBih8DrAxP333h6xoVymK2lFU8U24cWhKMczFknhA-0Grlo6BouODj-zkSJYahGjgDFAhCvYq_CdPJ6qf8USI4qWjTdBKGuPmXK6thIxNiVzbevOytIAWSgcxSvo5yQd3peEKnUsUA5ipDJrAubSfTLPPqHtK_07CVE4c8pIjXYITA0N02MfWaQVtHo7zU7YyVY-xODc39GfPmw_pebT52VXD-UGu7QlFfg",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAkClqY_wDhmuGwKW6w359XUqENuKc8aFogvTgQ_FDq87gKL2BNINH2x9v9gOdB770HKriEtiFBPB3KwankIDLcCQIqUFhdosfhhsOV2F03ExDPdQw8T6RKvZ7-TkLtHx4lrgXoWojWLnxjLYsqoyw297omFCNExuUp8_titY2UjKXJfbqDnqzOSqON-o5ZdJL0juGNioWdiLRE_dD9vylviYWQqdwwnb37AekTF5_A6oeoh3_WpvFW0lqNEU953ZUCrwPQNCqBrCc",
        ],
        []
    );

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        const loadProducts = async () => {
            try {
                setLoading(true);
                const url = new URL(`${getApiBase()}/public/products`);
                url.searchParams.set("page", String(page));
                url.searchParams.set("limit", "24");
                if (search.trim()) {
                    url.searchParams.set("q", search.trim());
                }

                const response = await fetch(url.toString(), {
                    headers: getTenantHeaders(),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Catalog request failed: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                setProducts(Array.isArray(data.items) ? data.items : []);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("No se pudieron cargar los productos", err);
                    if (active) {
                        setProducts([]);
                    }
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadProducts();

        return () => {
            active = false;
            controller.abort();
        };
    }, [page, search]);

    const catalogProducts = useMemo(() => {
        return products.map((product, index) => {
            const data = product.data || {};
            const rawImages = Array.isArray(data.images) ? data.images : [];
            const rawFirst = rawImages[0];
            const image =
                data.image ||
                data.image_url ||
                (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
                fallbackImages[index % fallbackImages.length];

            return {
                id: product.id,
                sku: product.sku || product.erp_id,
                name: product.name,
                desc: product.description || data.short_description || "",
                price: Number(product.price || 0),
                oldPrice: data.old_price ? Number(data.old_price) : null,
                tag: data.tag || null,
                image,
                alt: data.image_alt || product.name || "Producto",
                stock: product.stock,
            };
        });
    }, [products, fallbackImages]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return catalogProducts;
        return catalogProducts.filter(
            (p) =>
                p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
        );
    }, [catalogProducts, search]);

    const onToggleChip = (id) => {
        setChips((prev) =>
            prev.map((c) =>
                c.id === id
                    ? { ...c, active: c.type === "active" ? false : !c.active }
                    : c
            )
        );
    };

    const removeChip = (id) => {
        setChips((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
    };

    return (
        <StoreLayout>
            <main className="max-w-[1440px] mx-auto flex flex-col min-h-screen">
                {/* Breadcrumbs & Category Title */}
                <div className="px-10 pt-6">
                    <div className="flex flex-wrap gap-2 py-2">
                        <button
                            type="button"
                            onClick={() => (window.location.hash = '#')}
                            className="text-[#8a7560] text-sm font-medium leading-normal hover:text-primary transition-colors"
                        >
                            Inicio
                        </button>
                        <span className="text-[#8a7560] text-sm font-medium leading-normal">/</span>
                        <span className="text-[#8a7560] text-sm font-medium leading-normal">
                            Catálogo
                        </span>
                        <span className="text-[#8a7560] text-sm font-medium leading-normal">/</span>
                        <span className="text-[#181411] dark:text-white text-sm font-medium leading-normal">
                            Baño y cocina
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-between items-end gap-3 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] mb-6">
                        <div className="flex min-w-72 flex-col gap-1">
                            <p className="text-[#181411] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                Productos de baño y cocina
                            </p>
                            <p className="text-[#8a7560] text-base font-normal leading-normal">
                                Colección profesional para obras y reformas.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#f5f2f0] dark:bg-[#2c2116] text-[#181411] dark:text-white text-sm font-bold gap-2 border border-transparent hover:border-primary/50 transition-all">
                                <span className="material-symbols-outlined text-sm">
                                    dashboard_customize
                                </span>
                                <span>Editar vista</span>
                            </button>
                        </div>
                    </div>

                    {/* Chips / Quick Filters */}
                    <div className="flex gap-3 pb-6 flex-wrap">
                        {chips.map((c) => {
                            if (!c.active && c.type === "active") return null;

                            if (c.type === "active" && c.active) {
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => removeChip(c.id)}
                                        className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary text-white px-4"
                                    >
                                        <p className="text-sm font-medium">{c.label}</p>
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                );
                            }

                            if (c.type === "deal") {
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => onToggleChip(c.id)}
                                        className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4"
                                    >
                                        <span className="material-symbols-outlined text-sm">local_offer</span>
                                        <p className="text-sm font-bold">{c.label}</p>
                                        <span className="material-symbols-outlined text-sm">
                                            keyboard_arrow_down
                                        </span>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onToggleChip(c.id)}
                                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f5f2f0] dark:bg-[#2c2116] px-4 hover:bg-primary/10 transition-colors"
                                >
                                    <p className="text-[#181411] dark:text-white text-sm font-medium">
                                        {c.label}
                                    </p>
                                    <span className="material-symbols-outlined text-sm">
                                        keyboard_arrow_down
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-1 px-10 gap-8 pb-20">
                    {/* Sidebar Navigation/Filters */}
                    <aside className="w-64 shrink-0 flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#1a130c] p-6 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-[#181411] dark:text-white text-lg font-bold">
                                    Filtros
                                </h1>
                                <span className="material-symbols-outlined text-[#8a7560] cursor-pointer hover:text-primary">
                                    tune
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <span className="material-symbols-outlined">category</span>
                                    <p className="text-sm font-bold">Categorías</p>
                                </div>

                                {[
                                    { icon: "sell", label: "Marcas" },
                                    { icon: "payments", label: "Rango de precio" },
                                    { icon: "texture", label: "Material" },
                                    { icon: "star", label: "Calificación" },
                                ].map((x) => (
                                    <div
                                        key={x.label}
                                        className="flex items-center gap-3 px-3 py-2 text-[#181411] dark:text-white hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116] rounded-lg cursor-pointer transition-colors group"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {x.icon}
                                        </span>
                                        <p className="text-sm font-medium">{x.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                <button className="w-full flex items-center justify-center rounded-lg h-11 bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all">
                                    Aplicar filtros
                                </button>
                                <button className="w-full mt-2 text-[#8a7560] text-xs font-medium text-center hover:text-primary">
                                    Restablecer filtros
                                </button>
                            </div>
                        </div>

                        <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-primary font-bold text-lg mb-1">Configuración del tema</p>
                                <p className="text-xs text-[#8a7560] dark:text-[#a08b76] mb-4">
                                    Personalizá el catálogo en un clic.
                                </p>
                                <button className="text-xs font-bold uppercase tracking-wider text-[#181411] dark:text-white flex items-center gap-1 hover:underline">
                                    Abrir editor visual
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </button>
                            </div>
                            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-primary/10 text-8xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                format_paint
                            </span>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="rounded-xl border border-dashed border-[#e5e1de] dark:border-[#3d2f21] p-10 text-center text-[#8a7560]">
                                Cargando productos...
                            </div>
                        ) : (
                            <>
                                {filtered.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#e5e1de] dark:border-[#3d2f21] p-10 text-center text-[#8a7560]">
                                        No encontramos productos para tu búsqueda.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filtered.map((p) => (
                                            <CatalogProductCard
                                                key={p.id}
                                                product={p}
                                                showPrices={showPrices}
                                                currency={currency}
                                                locale={locale}
                                            />
                                        ))}

                                        <AddNewCard />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-center mt-12 gap-2">
                            <button
                                onClick={() => setPage((n) => Math.max(1, n - 1))}
                                className="flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#8a7560]"
                                aria-label="Página anterior"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>

                            {[1, 2, 3].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    className={
                                        n === page
                                            ? "flex items-center justify-center rounded-lg size-10 bg-primary text-white font-bold"
                                            : "flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#181411] dark:text-white"
                                    }
                                >
                                    {n}
                                </button>
                            ))}

                            <span className="flex items-center justify-center size-10 text-[#8a7560]">
                                ...
                            </span>

                            <button
                                onClick={() => setPage(12)}
                                className="flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#181411] dark:text-white"
                            >
                                12
                            </button>

                            <button
                                onClick={() => setPage((n) => Math.min(12, n + 1))}
                                className="flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#8a7560]"
                                aria-label="Página siguiente"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </StoreLayout>
    );
}

function CatalogProductCard({ product, showPrices, currency, locale }) {
    const { addToCart } = useStore();
    const { name, desc, price, oldPrice, tag, image, alt, stock } = product;
    const inStock = typeof stock === "number" ? stock > 0 : true;

    return (
        <div className="bg-white dark:bg-[#1a130c] rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div
                className="relative aspect-square overflow-hidden bg-[#f5f2f0] dark:bg-[#2c2116] cursor-pointer"
                onClick={() => (window.location.hash = `#product/${product.id}`)}
            >
                <img
                    alt={name}
                    title={alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={image}
                    loading="lazy"
                />

                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/90 p-2 rounded-full shadow-sm text-[#181411] hover:bg-primary hover:text-white">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                    </button>
                    <button className="bg-white/90 p-2 rounded-full shadow-sm text-[#181411] hover:bg-primary hover:text-white">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                </div>

                {tag ? (
                    String(tag).toLowerCase() === "new" || String(tag).toLowerCase() === "nuevo" ? (
                        <div className="absolute top-3 left-3 bg-primary text-white px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                            Nuevo
                        </div>
                    ) : (
                        <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-[#8a7560] tracking-wider uppercase">
                            {tag}
                        </div>
                    )
                ) : null}
            </div>

            <div className="p-5 flex flex-col gap-3">
                <div>
                    <h3 className="text-[#181411] dark:text-white font-bold text-lg leading-tight mb-1">
                        {name}
                    </h3>
                    <p className="text-[#8a7560] text-sm line-clamp-2">{desc}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                        {showPrices ? (
                            <>
                                <span className="text-primary font-black text-xl">
                                    {formatCurrency(price, currency, locale)}
                                </span>
                                {oldPrice ? (
                                    <span className="text-[#8a7560] text-xs line-through">
                                        {formatCurrency(oldPrice, currency, locale)}
                                    </span>
                                ) : null}
                            </>
                        ) : (
                            <span className="text-[#8a7560] text-sm">Consultar precio</span>
                        )}
                    </div>

                    <button
                        onClick={() => addToCart(product, 1)}
                        className="bg-primary text-white p-2 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label="Agregar al carrito"
                        disabled={!inStock}
                    >
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddNewCard() {
    return (
        <div className="border-2 border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl flex flex-col items-center justify-center p-10 text-center bg-white/70 dark:bg-[#1a130c] hover:border-primary transition-colors">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <p className="text-[#181411] dark:text-white font-bold">Agregar producto</p>
            <p className="text-[#8a7560] text-xs mt-1">
                Ajustá la grilla desde el editor.
            </p>
        </div>
    );
}
