import React, { useMemo, useState, useEffect } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { getApiBase, getTenantHeaders } from "../../utils/api";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";
import { navigate } from "../../utils/navigation";
import { getLowStockThreshold, getStockStatus, isInStock } from "../../utils/stock";

export default function CatalogPage() {
    const { search } = useStore();
    const { settings } = useTenant();
    const { isWholesale } = useAuth();
    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const showPrices = settings?.commerce?.show_prices !== false;
    const showStock = settings?.commerce?.show_stock !== false;
    const lowStockThreshold = getLowStockThreshold(settings);

    const [page, setPage] = useState(1);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Filters State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(24);

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
        const fetchMetadata = async () => {
            try {
                const [catsRes, brandsRes] = await Promise.all([
                    fetch(`${getApiBase()}/public/categories`, { headers: getTenantHeaders() }),
                    fetch(`${getApiBase()}/public/brands`, { headers: getTenantHeaders() })
                ]);
                if (catsRes.ok) setCategories(await catsRes.json());
                if (brandsRes.ok) setBrands(await brandsRes.json());
            } catch (err) {
                console.error("Failed to fetch metadata", err);
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        const loadProducts = async () => {
            try {
                setLoading(true);
                const url = new URL(`${getApiBase()}/public/products`);
                url.searchParams.set("page", String(page));
                url.searchParams.set("limit", String(limit));

                if (search.trim()) {
                    url.searchParams.set("q", search.trim());
                }
                if (selectedCategory) {
                    url.searchParams.set("category", selectedCategory);
                }
                if (selectedBrand) {
                    url.searchParams.set("brand", selectedBrand);
                }
                if (priceRange.min > 0) {
                    url.searchParams.set("minPrice", String(priceRange.min));
                }
                if (priceRange.max > 0) {
                    url.searchParams.set("maxPrice", String(priceRange.max));
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
                setTotalItems(data.total || 0);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("No se pudieron cargar los productos", err);
                    if (active) {
                        setProducts([]);
                        setTotalItems(0);
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
    }, [page, search, selectedCategory, selectedBrand, priceRange, limit]);

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
                price: isWholesale ? Number(product.price_wholesale || product.price) : Number(product.price || 0),
                oldPrice: isWholesale ? null : (data.old_price ? Number(data.old_price) : null),
                tag: data.tag || null,
                image,
                alt: data.image_alt || product.name || "Producto",
                stock: product.stock,
                isWholesaleItem: isWholesale && !!product.price_wholesale,
            };
        });
    }, [products, fallbackImages, isWholesale]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return catalogProducts;
        return catalogProducts.filter(
            (p) =>
                p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
        );
    }, [catalogProducts, search]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const resetFilters = () => {
        setSelectedCategory(null);
        setSelectedBrand(null);
        setPage(1);
    };

    const chips = useMemo(() => {
        const list = [];
        if (selectedCategory) {
            const cat = categories.find(c => c.id === selectedCategory || c.name === selectedCategory);
            list.push({ id: 'cat', label: cat?.name || selectedCategory, type: 'category' });
        }
        if (selectedBrand) {
            const br = brands.find(b => b.id === selectedBrand || b.name === selectedBrand);
            list.push({ id: 'brand', label: br?.name || selectedBrand, type: 'brand' });
        }
        return list;
    }, [selectedCategory, selectedBrand, categories, brands]);

    const selectedCategoryName = useMemo(() => {
        if (!selectedCategory) return null;
        const cat = categories.find(c => c.id === selectedCategory || c.name === selectedCategory);
        return cat?.name || selectedCategory;
    }, [selectedCategory, categories]);

    return (
        <StoreLayout>
            <main className="max-w-[1440px] mx-auto flex flex-col min-h-screen">
                {/* Breadcrumbs & Category Title */}
                <div className="px-10 pt-6">
                    <div className="flex flex-wrap gap-2 py-2">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="text-[#8a7560] text-sm font-medium leading-normal hover:text-primary transition-colors"
                        >
                            Inicio
                        </button>
                        <span className="text-[#8a7560] text-sm font-medium leading-normal">/</span>
                        <button
                            type="button"
                            onClick={() => { setSelectedCategory(null); setPage(1); }}
                            className="text-[#8a7560] text-sm font-medium leading-normal hover:text-primary transition-colors"
                        >
                            Catálogo
                        </button>
                        {selectedCategoryName ? (
                            <>
                                <span className="text-[#8a7560] text-sm font-medium leading-normal">/</span>
                                <span className="text-[#181411] dark:text-white text-sm font-medium leading-normal">
                                    {selectedCategoryName}
                                </span>
                            </>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap justify-between items-end gap-3 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] mb-6">
                        <div className="flex min-w-72 flex-col gap-1">
                            <p className="text-[#181411] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Catálogo completo'}
                            </p>
                            <p className="text-[#8a7560] text-base font-normal leading-normal">
                                {selectedCategory ? `Explorá nuestra selección de ${categories.find(c => c.id === selectedCategory)?.name}.` : 'Colección profesional para obras y reformas.'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={resetFilters}
                                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#f5f2f0] dark:bg-[#2c2116] text-[#181411] dark:text-white text-sm font-bold gap-2 border border-transparent hover:border-primary/50 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                <span>Limpiar filtros</span>
                            </button>
                        </div>
                    </div>

                    {/* Chips / Quick Filters */}
                    <div className="flex gap-3 pb-6 flex-wrap min-h-[44px]">
                        {chips.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    if (c.type === 'category') setSelectedCategory(null);
                                    if (c.type === 'brand') setSelectedBrand(null);
                                    setPage(1);
                                }}
                                className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary text-white px-4 animate-in fade-in zoom-in duration-200"
                            >
                                <p className="text-sm font-medium">{c.label}</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        ))}

                        {/* Default quick access if no filters */}
                        {chips.length === 0 && (
                            <div className="flex gap-2">
                                {categories.slice(0, 3).map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                                        className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f5f2f0] dark:bg-[#2c2116] px-4 hover:bg-primary/10 transition-colors"
                                    >
                                        <p className="text-[#181411] dark:text-white text-sm font-medium">{cat.name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8a7560] cursor-pointer hover:text-primary"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-2">
                                    Categorías
                                </div>
                                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedCategory === cat.id ? 'bg-primary/10 text-primary font-bold' : 'text-[#181411] dark:text-white hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                        >
                                            <p className="text-sm">{cat.name}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-4">
                                    Marcas
                                </div>
                                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {brands.map(brand => (
                                        <div
                                            key={brand.id}
                                            onClick={() => { setSelectedBrand(brand.id); setPage(1); }}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedBrand === brand.id ? 'bg-primary/10 text-primary font-bold' : 'text-[#181411] dark:text-white hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]'}`}
                                        >
                                            <p className="text-sm">{brand.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                <button
                                    onClick={resetFilters}
                                    className="w-full text-[#8a7560] text-xs font-medium text-center hover:text-primary transition-colors"
                                >
                                    Restablecer filtros
                                </button>
                            </div>
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
                                                showStock={showStock}
                                                lowStockThreshold={lowStockThreshold}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-12 gap-2">
                                <button
                                    onClick={() => setPage((n) => Math.max(1, n - 1))}
                                    disabled={page === 1}
                                    className="flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#8a7560] disabled:opacity-30"
                                    aria-label="Página anterior"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>

                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const n = i + 1;
                                    // Only show current, 2 before, 2 after, and first/last
                                    if (n === 1 || n === totalPages || (n >= page - 1 && n <= page + 1)) {
                                        return (
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
                                        );
                                    }
                                    if (n === page - 2 || n === page + 2) {
                                        return <span key={n} className="flex items-center justify-center size-10 text-[#8a7560]">...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#8a7560] disabled:opacity-30"
                                    aria-label="Página siguiente"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </StoreLayout>
    );
}

function CatalogProductCard({ product, showPrices, currency, locale, showStock, lowStockThreshold }) {
    const { addToCart } = useStore();
    const { name, desc, price, oldPrice, tag, image, alt, stock } = product;
    const [isFavorite, setIsFavorite] = useState(false);
    const inStock = isInStock(stock);
    const stockStatus = showStock ? getStockStatus(stock, lowStockThreshold) : null;

    const navigateToProduct = () => {
        window.history.pushState({}, '', `/product/${product.id}`);
        window.dispatchEvent(new Event('navigate'));
    };

    return (
        <div className="bg-white dark:bg-[#1a130c] rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div
                className="relative aspect-square overflow-hidden bg-[#f5f2f0] dark:bg-[#2c2116] cursor-pointer"
                onClick={navigateToProduct}
            >
                <img
                    alt={name}
                    title={alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={image}
                    loading="lazy"
                />

                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
                        className={`p-2 rounded-full shadow-sm transition-all ${isFavorite ? 'bg-primary text-white' : 'bg-white/90 text-[#181411] hover:bg-primary hover:text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigateToProduct(); }}
                        className="bg-white/90 p-2 rounded-full shadow-sm text-[#181411] hover:bg-primary hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
                {stockStatus ? (
                    <span
                        className={`inline-flex items-center w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stockStatus.bg} ${stockStatus.tone}`}
                    >
                        {stockStatus.label}
                    </span>
                ) : null}

                <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                        {showPrices ? (
                            <>
                                <span className="text-primary font-black text-xl">
                                    {formatCurrency(price, currency, locale)}
                                </span>
                                {product.isWholesaleItem && (
                                    <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                        Precio Mayorista
                                    </span>
                                )}
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path><path d="M12 9h6"></path><path d="M15 6v6"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

