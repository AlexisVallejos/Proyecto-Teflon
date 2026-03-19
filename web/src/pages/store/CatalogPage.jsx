import React, { useCallback, useEffect, useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { getApiBase, getAuthHeaders, getTenantHeaders } from "../../utils/api";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";
import { navigate } from "../../utils/navigation";
import { getPriceAccessState } from "../../utils/priceVisibility";
import { getLowStockThreshold, getStockStatus, isInStock } from "../../utils/stock";
import PriceAccessPrompt from "../../components/PriceAccessPrompt";
import StoreSkeleton from "../../components/StoreSkeleton";

const FALLBACK_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBQfYj1LC2KxJbrFc3JaW30fWNfBzOogedTliYaUerOGoeN9U0yPBa1Ly6cy0ifOVDGxRUhn39rTwm0asqqAroPQHLpdkrk_InCtirUQjGAQLvthIiB6EbRD71XqIoNekpixuF5np0LnNX1TY1UFuOELn9k9yOF23KgFYf1gCkfGPYdqRsN1a1b37xx0ItWp_yRvOdkSXB6CKK-dwrUA-uIDgTyng5s8My5tUJf8uzoYo7ri3rjEb8vDaZsLXgEsjTyaUDUDLV5wrk",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBVydqb7G5A_PT5CeAhoUo5VF2YXn8B2Hx2Y7DXvOB4gcZRtfBQHFy3IXPSOyox8_pIRZ01SgjOZeoV9ydnJd4VX1MFyFby5IDfG7nwbc2nvES8jZnphd62afdnYbb6Iaf8EhHngYqYD6DaMh8Y7GWRUftLJ-ruDjZNpatP8hNSQbK7lpweqdguNtcjdh8H7Qh_N1McVphjwD3cKtffejU4Ws_7fNBO0ICFabsb2GdV_B21lIn06nqXxOYw8NB228co8N3wupZ7HDc",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuClfnnmyLSA1sheGaWQ5qYtxE0FF5qt12jk3aemf83GNBih8DrAxP333h6xoVymK2lFU8U24cWhKMczFknhA-0Grlo6BouODj-zkSJYahGjgDFAhCvYq_CdPJ6qf8USI4qWjTdBKGuPmXK6thIxNiVzbevOytIAWSgcxSvo5yQd3peEKnUsUA5ipDJrAubSfTLPPqHtK_07CVE4c8pIjXYITA0N02MfWaQVtHo7zU7YyVY-xODc39GfPmw_pebT52VXD-UGu7QlFfg",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAkClqY_wDhmuGwKW6w359XUqENuKc8aFogvTgQ_FDq87gKL2BNINH2x9v9gOdB770HKriEtiFBPB3KwankIDLcCQIqUFhdosfhhsOV2F03ExDPdQw8T6RKvZ7-TkLtHx4lrgXoWojWLnxjLYsqoyw297omFCNExuUp8_titY2UjKXJfbqDnqzOSqON-o5ZdJL0juGNioWdiLRE_dD9vylviYWQqdwwnb37AekTF5_A6oeoh3_WpvFW0lqNEU953ZUCrwPQNCqBrCc",
];

const normalizeFilterValue = (value) => {
    const raw = String(value || "").trim();
    return raw || null;
};

const getFiltersFromUrl = () => {
    const params = new URLSearchParams(window.location.search || "");
    return {
        category: normalizeFilterValue(params.get("category")),
        brand: normalizeFilterValue(params.get("brand")),
    };
};

const buildCatalogHref = ({ category, brand }) => {
    const params = new URLSearchParams();
    if (normalizeFilterValue(category)) {
        params.set("category", normalizeFilterValue(category));
    }
    if (normalizeFilterValue(brand)) {
        params.set("brand", normalizeFilterValue(brand));
    }
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
};

const normalizeCategory = (item) => {
    if (!item || (!item.id && !item.slug && !item.name)) return null;
    const name = String(item.name || item.slug || item.id).trim();
    if (!name) return null;

    return {
        id: String(item.id || item.slug || name).trim(),
        slug: String(item.slug || "").trim() || null,
        name,
        parentId: String(item.parent_id || "").trim() || null,
        parentName: String(item.parent_name || "").trim() || null,
    };
};

const normalizeBrand = (item) => {
    if (typeof item === "string") {
        const name = item.trim();
        return name ? { id: name, name } : null;
    }

    if (!item) return null;
    const name = String(item.name || item.id || "").trim();
    if (!name) return null;

    return {
        id: String(item.id || name).trim(),
        name,
    };
};

const findCategory = (categories, value) => {
    const normalized = normalizeFilterValue(value);
    if (!normalized) return null;
    return categories.find((item) => item.id === normalized || item.slug === normalized || item.name === normalized) || null;
};

const findBrand = (brands, value) => {
    const normalized = normalizeFilterValue(value);
    if (!normalized) return null;
    return brands.find((item) => item.id === normalized || item.name === normalized) || null;
};

export default function CatalogPage() {
    const { search, showToast } = useStore();
    const { settings } = useTenant();
    const { isWholesale, user, loading: authLoading } = useAuth();
    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const { showPricesEnabled, canViewPrices } = getPriceAccessState(settings, user);
    const showStock = settings?.commerce?.show_stock !== false;
    const lowStockThreshold = getLowStockThreshold(settings);

    const initialFilters = useMemo(() => getFiltersFromUrl(), []);
    const [page, setPage] = useState(1);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
    const [selectedBrand, setSelectedBrand] = useState(initialFilters.brand);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const limit = 24;

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        const syncFiltersFromLocation = () => {
            const next = getFiltersFromUrl();
            setSelectedCategory((prev) => (prev === next.category ? prev : next.category));
            setSelectedBrand((prev) => (prev === next.brand ? prev : next.brand));
            setPage(1);
            setMobileFiltersOpen(false);
        };

        window.addEventListener("navigate", syncFiltersFromLocation);
        window.addEventListener("popstate", syncFiltersFromLocation);

        return () => {
            window.removeEventListener("navigate", syncFiltersFromLocation);
            window.removeEventListener("popstate", syncFiltersFromLocation);
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadMetadata = async () => {
            try {
                const [categoriesRes, brandsRes] = await Promise.all([
                    fetch(`${getApiBase()}/public/categories`, { headers: getTenantHeaders() }),
                    fetch(`${getApiBase()}/public/brands`, { headers: getTenantHeaders() }),
                ]);

                if (active && categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    const normalizedCategories = Array.isArray(categoriesData)
                        ? categoriesData.map(normalizeCategory).filter(Boolean)
                        : [];
                    setCategories(normalizedCategories);
                }

                if (active && brandsRes.ok) {
                    const brandsData = await brandsRes.json();
                    const normalizedBrands = Array.isArray(brandsData)
                        ? brandsData.map(normalizeBrand).filter(Boolean)
                        : [];
                    const uniqueBrands = [...new Map(normalizedBrands.map((item) => [item.id.toLowerCase(), item])).values()];
                    setBrands(uniqueBrands);
                }
            } catch (error) {
                console.error("No se pudieron cargar categorias y marcas", error);
            }
        };

        loadMetadata();

        return () => {
            active = false;
        };
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

                const response = await fetch(url.toString(), {
                    headers: { ...getTenantHeaders(), ...getAuthHeaders() },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Error al cargar el catalogo: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                const items = Array.isArray(data.items) ? data.items : [];
                setProducts(items);
                setTotalItems(Number(data.total || items.length || 0));
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("No se pudieron cargar los productos", error);
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
    }, [limit, page, search, selectedBrand, selectedCategory]);

    const selectedCategoryEntry = useMemo(() => findCategory(categories, selectedCategory), [categories, selectedCategory]);
    const selectedBrandEntry = useMemo(() => findBrand(brands, selectedBrand), [brands, selectedBrand]);

    const categoryTree = useMemo(() => {
        const byId = new Map();
        categories.forEach((item) => {
            byId.set(item.id, { ...item, children: [] });
        });

        const roots = [];
        byId.forEach((item) => {
            if (item.parentId && byId.has(item.parentId)) {
                byId.get(item.parentId).children.push(item);
            } else {
                roots.push(item);
            }
        });

        const sorter = (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        roots.sort(sorter);
        roots.forEach((item) => item.children.sort(sorter));
        return roots;
    }, [categories]);

    const catalogProducts = useMemo(() => {
        return products.map((product, index) => {
            const data = product.data || {};
            const rawImages = Array.isArray(data.images) ? data.images : [];
            const rawFirst = rawImages[0];
            const image =
                data.image ||
                data.image_url ||
                (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
                FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

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
    }, [isWholesale, products]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const activeFilterCount = [selectedCategory, selectedBrand].filter(Boolean).length;

    const applyFilters = useCallback(
        (next = {}) => {
            const nextCategory = Object.prototype.hasOwnProperty.call(next, "category")
                ? normalizeFilterValue(next.category)
                : selectedCategory;
            const nextBrand = Object.prototype.hasOwnProperty.call(next, "brand")
                ? normalizeFilterValue(next.brand)
                : selectedBrand;

            setSelectedCategory(nextCategory);
            setSelectedBrand(nextBrand);
            setPage(1);
            setMobileFiltersOpen(false);
            navigate(buildCatalogHref({ category: nextCategory, brand: nextBrand }));
        },
        [selectedBrand, selectedCategory]
    );

    const resetFilters = useCallback(() => {
        applyFilters({ category: null, brand: null });
    }, [applyFilters]);

    const chips = useMemo(() => {
        const next = [];
        if (selectedCategoryEntry) {
            next.push({ id: "category", label: selectedCategoryEntry.name, clear: () => applyFilters({ category: null }) });
        }
        if (selectedBrandEntry) {
            next.push({ id: "brand", label: selectedBrandEntry.name, clear: () => applyFilters({ brand: null }) });
        }
        return next;
    }, [applyFilters, selectedBrandEntry, selectedCategoryEntry]);

    const quickCategories = useMemo(() => categoryTree.slice(0, 4), [categoryTree]);
    const quickBrands = useMemo(() => brands.slice(0, 4), [brands]);

    const handleFavoriteChange = (_product, added) => {
        if (added) {
            showToast("Producto anadido a favoritos");
        }
    };

    const resultsSummary = useMemo(() => {
        if (search.trim()) {
            return `Resultados para "${search.trim()}"`;
        }
        if (selectedCategoryEntry && selectedBrandEntry) {
            return `${selectedCategoryEntry.name} · ${selectedBrandEntry.name}`;
        }
        if (selectedCategoryEntry) {
            return `Explora ${selectedCategoryEntry.name}`;
        }
        if (selectedBrandEntry) {
            return `Productos de ${selectedBrandEntry.name}`;
        }
        return "Coleccion profesional para obras y reformas.";
    }, [search, selectedBrandEntry, selectedCategoryEntry]);

    return (
        <StoreLayout>
            <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 md:px-6 lg:pt-8 xl:px-10">
                {mobileFiltersOpen ? (
                    <div
                        className="fixed inset-0 z-40 bg-black/45 lg:hidden"
                        onClick={() => setMobileFiltersOpen(false)}
                        aria-hidden="true"
                    />
                ) : null}

                <section className="rounded-[28px] border border-[#e5e1de] bg-white/95 p-5 shadow-sm dark:border-[#3d2f21] dark:bg-[#120c08]/95 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#8a7560]">
                        <button type="button" className="transition-colors hover:text-primary" onClick={() => navigate("/")}>Inicio</button>
                        <span>/</span>
                        <button type="button" className="transition-colors hover:text-primary" onClick={resetFilters}>Catalogo</button>
                        {selectedCategoryEntry ? (
                            <>
                                <span>/</span>
                                <span className="text-[#181411] dark:text-white">{selectedCategoryEntry.name}</span>
                            </>
                        ) : null}
                    </div>

                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                                Catalogo completo
                            </span>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight text-[#181411] dark:text-white md:text-4xl">
                                    {selectedCategoryEntry?.name || selectedBrandEntry?.name || "Todos los productos"}
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-[#8a7560] md:text-base">{resultsSummary}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileFiltersOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#d9d1ca] px-4 py-3 text-sm font-bold text-[#181411] transition-colors hover:border-primary hover:text-primary dark:border-[#3d2f21] dark:text-white lg:hidden"
                            >
                                <FilterIcon className="size-4" />
                                {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#f5f2f0] px-4 py-3 text-sm font-bold text-[#181411] transition-colors hover:bg-primary hover:text-white dark:bg-[#21160e] dark:text-white"
                            >
                                <ResetIcon className="size-4" />
                                Limpiar filtros
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {chips.length ? (
                            chips.map((chip) => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={chip.clear}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                                >
                                    <span>{chip.label}</span>
                                    <CloseIcon className="size-3.5" />
                                </button>
                            ))
                        ) : (
                            <>
                                {quickCategories.map((category) => (
                                    <button
                                        key={`quick-category-${category.id}`}
                                        type="button"
                                        onClick={() => applyFilters({ category: category.id })}
                                        className="rounded-full border border-[#ded7d0] px-4 py-2 text-sm font-medium text-[#181411] transition-colors hover:border-primary hover:text-primary dark:border-[#3d2f21] dark:text-white"
                                    >
                                        {category.name}
                                    </button>
                                ))}
                                {quickBrands.map((brand) => (
                                    <button
                                        key={`quick-brand-${brand.id}`}
                                        type="button"
                                        onClick={() => applyFilters({ brand: brand.id })}
                                        className="rounded-full border border-[#ded7d0] px-4 py-2 text-sm font-medium text-[#181411] transition-colors hover:border-primary hover:text-primary dark:border-[#3d2f21] dark:text-white"
                                    >
                                        {brand.name}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </section>

                <div className="mt-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
                    <aside className="hidden lg:block">
                        <CatalogFilters
                            categoryTree={categoryTree}
                            brands={brands}
                            selectedCategory={selectedCategory}
                            selectedBrand={selectedBrand}
                            onSelectCategory={(value) => applyFilters({ category: value })}
                            onSelectBrand={(value) => applyFilters({ brand: value })}
                            onReset={resetFilters}
                        />
                    </aside>

                    {mobileFiltersOpen ? (
                        <aside className="fixed inset-y-0 left-0 z-50 w-full max-w-sm overflow-y-auto bg-white p-4 shadow-2xl dark:bg-[#120c08] lg:hidden">
                            <CatalogFilters
                                mobile
                                categoryTree={categoryTree}
                                brands={brands}
                                selectedCategory={selectedCategory}
                                selectedBrand={selectedBrand}
                                onSelectCategory={(value) => applyFilters({ category: value })}
                                onSelectBrand={(value) => applyFilters({ brand: value })}
                                onReset={resetFilters}
                                onClose={() => setMobileFiltersOpen(false)}
                            />
                        </aside>
                    ) : null}

                    <section className="mt-6 min-w-0 lg:mt-0">
                        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e5e1de] bg-[#fcfbfa] px-4 py-4 dark:border-[#3d2f21] dark:bg-[#17100b] sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a7560]">Resultados</p>
                                <h2 className="mt-1 text-lg font-bold text-[#181411] dark:text-white">
                                    {totalItems === 1 ? "1 producto" : `${totalItems} productos`}
                                </h2>
                            </div>
                            <p className="text-sm text-[#8a7560]">
                                {activeFilterCount > 0
                                    ? "Filtra por categoria y marca, o limpia para volver al catalogo completo."
                                    : "Usa el buscador, categorias y marcas para encontrar mas rapido lo que necesitas."}
                            </p>
                        </div>

                        {loading ? (
                            <StoreSkeleton variant="catalog" />
                        ) : catalogProducts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#e5e1de] px-6 py-14 text-center text-[#8a7560] dark:border-[#3d2f21]">
                                <p className="text-lg font-bold text-[#181411] dark:text-white">No encontramos productos para esta busqueda.</p>
                                <p className="mt-2 text-sm">Prueba con otra categoria, otra marca o limpia los filtros activos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {catalogProducts.map((product) => (
                                    <CatalogProductCard
                                        key={product.id}
                                        product={product}
                                        showPricesEnabled={showPricesEnabled}
                                        canViewPrices={canViewPrices}
                                        authLoading={authLoading}
                                        currency={currency}
                                        locale={locale}
                                        showStock={showStock}
                                        lowStockThreshold={lowStockThreshold}
                                        onFavoriteChange={handleFavoriteChange}
                                    />
                                ))}
                            </div>
                        )}

                        {totalPages > 1 ? (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                                <PaginationButton
                                    label="Anterior"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page === 1}
                                />

                                {Array.from({ length: totalPages }).map((_, index) => {
                                    const pageNumber = index + 1;
                                    const nearCurrent = pageNumber === 1 || pageNumber === totalPages || (pageNumber >= page - 1 && pageNumber <= page + 1);
                                    if (!nearCurrent) {
                                        if (pageNumber === page - 2 || pageNumber === page + 2) {
                                            return (
                                                <span key={`ellipsis-${pageNumber}`} className="px-2 text-sm font-bold text-[#8a7560]">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={`page-${pageNumber}`}
                                            type="button"
                                            onClick={() => setPage(pageNumber)}
                                            className={`min-w-[42px] rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                                                pageNumber === page
                                                    ? "bg-primary text-white"
                                                    : "border border-[#e5e1de] text-[#181411] hover:border-primary hover:text-primary dark:border-[#3d2f21] dark:text-white"
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}

                                <PaginationButton
                                    label="Siguiente"
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    disabled={page === totalPages}
                                />
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>
        </StoreLayout>
    );
}

function CatalogFilters({
    categoryTree,
    brands,
    selectedCategory,
    selectedBrand,
    onSelectCategory,
    onSelectBrand,
    onReset,
    mobile = false,
    onClose,
}) {
    return (
        <div className={`rounded-[24px] border border-[#e5e1de] bg-white p-5 shadow-sm dark:border-[#3d2f21] dark:bg-[#120c08] ${mobile ? "min-h-full" : "sticky top-24"}`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a7560]">Explorar</p>
                    <h2 className="mt-1 text-xl font-black text-[#181411] dark:text-white">Filtros</h2>
                </div>
                {mobile ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-[#ded7d0] p-2 text-[#181411] dark:border-[#3d2f21] dark:text-white"
                        aria-label="Cerrar filtros"
                    >
                        <CloseIcon className="size-4" />
                    </button>
                ) : null}
            </div>

            <button
                type="button"
                onClick={onReset}
                className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[#ded7d0] px-4 py-3 text-left text-sm font-bold text-[#181411] transition-colors hover:border-primary hover:text-primary dark:border-[#3d2f21] dark:text-white"
            >
                <span>Catalogo completo</span>
                <ResetIcon className="size-4" />
            </button>

            <div className="mt-6 space-y-6">
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#8a7560]">Categorias</h3>
                        {selectedCategory ? (
                            <button
                                type="button"
                                onClick={() => onSelectCategory(null)}
                                className="text-xs font-bold text-primary"
                            >
                                Limpiar
                            </button>
                        ) : null}
                    </div>
                    <div className="space-y-3">
                        {categoryTree.length ? (
                            categoryTree.map((category) => {
                                const parentActive = selectedCategory === category.id || selectedCategory === category.slug;
                                return (
                                    <div key={`category-${category.id}`} className="rounded-2xl border border-[#f0ebe7] p-3 dark:border-[#24170f]">
                                        <button
                                            type="button"
                                            onClick={() => onSelectCategory(category.id)}
                                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
                                                parentActive
                                                    ? "bg-primary text-white"
                                                    : "text-[#181411] hover:bg-[#f5f2f0] dark:text-white dark:hover:bg-[#21160e]"
                                            }`}
                                        >
                                            <span>{category.name}</span>
                                            <ChevronRightIcon className="size-4" />
                                        </button>
                                        {category.children.length ? (
                                            <div className="mt-2 space-y-1 border-l border-[#ece5df] pl-3 dark:border-[#2f2118]">
                                                {category.children.map((child) => {
                                                    const childActive = selectedCategory === child.id || selectedCategory === child.slug;
                                                    return (
                                                        <button
                                                            key={`category-child-${child.id}`}
                                                            type="button"
                                                            onClick={() => onSelectCategory(child.id)}
                                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                                childActive
                                                                    ? "bg-primary/12 font-bold text-primary"
                                                                    : "text-[#6f5f50] hover:bg-[#f7f4f1] hover:text-[#181411] dark:text-[#d6c4b4] dark:hover:bg-[#1d140d] dark:hover:text-white"
                                                            }`}
                                                        >
                                                            <span>{child.name}</span>
                                                            <ChevronRightIcon className="size-4" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-[#8a7560]">No hay categorias disponibles.</p>
                        )}
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#8a7560]">Marcas</h3>
                        {selectedBrand ? (
                            <button
                                type="button"
                                onClick={() => onSelectBrand(null)}
                                className="text-xs font-bold text-primary"
                            >
                                Limpiar
                            </button>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {brands.length ? (
                            brands.map((brand) => {
                                const active = selectedBrand === brand.id || selectedBrand === brand.name;
                                return (
                                    <button
                                        key={`brand-${brand.id}`}
                                        type="button"
                                        onClick={() => onSelectBrand(brand.id)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                            active
                                                ? "bg-primary text-white"
                                                : "border border-[#ded7d0] text-[#181411] hover:border-primary hover:text-primary dark:border-[#3d2f21] dark:text-white"
                                        }`}
                                    >
                                        {brand.name}
                                    </button>
                                );
                            })
                        ) : (
                            <p className="text-sm text-[#8a7560]">No hay marcas disponibles.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function CatalogProductCard({
    product,
    showPricesEnabled,
    canViewPrices,
    authLoading,
    currency,
    locale,
    showStock,
    lowStockThreshold,
    onFavoriteChange,
}) {
    const { addToCart, toggleFavorite, isFavorite } = useStore();
    const { name, desc, price, oldPrice, tag, image, alt, stock } = product;
    const favoriteActive = isFavorite(product.id);
    const inStock = isInStock(stock);
    const stockStatus = showStock ? getStockStatus(stock, lowStockThreshold) : null;

    const openProduct = () => navigate(`/product/${product.id}`);

    return (
        <article className="group overflow-hidden rounded-[24px] border border-[#e5e1de] bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-[#3d2f21] dark:bg-[#120c08]">
            <div className="relative aspect-square cursor-pointer overflow-hidden bg-[#f5f2f0] dark:bg-[#21160e]" onClick={openProduct}>
                <img
                    alt={name}
                    title={alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={image}
                    loading="lazy"
                />

                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            const nextValue = !favoriteActive;
                            toggleFavorite(product);
                            onFavoriteChange?.(product, nextValue);
                        }}
                        className={`rounded-full p-2 shadow-sm transition-colors ${
                            favoriteActive
                                ? "bg-primary text-white"
                                : "bg-white/90 text-[#181411] hover:bg-primary hover:text-white"
                        }`}
                        aria-label="Agregar a favoritos"
                    >
                        <HeartIcon active={favoriteActive} className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            openProduct();
                        }}
                        className="rounded-full bg-white/90 p-2 text-[#181411] shadow-sm transition-colors hover:bg-primary hover:text-white"
                        aria-label="Ver detalle"
                    >
                        <EyeIcon className="size-4" />
                    </button>
                </div>

                {tag ? (
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                        {String(tag).toLowerCase() === "nuevo" || String(tag).toLowerCase() === "new" ? "Nuevo" : tag}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-col gap-4 p-5">
                <div className="space-y-2">
                    <button type="button" onClick={openProduct} className="text-left">
                        <h3 className="text-lg font-black leading-tight text-[#181411] transition-colors group-hover:text-primary dark:text-white">
                            {name}
                        </h3>
                    </button>
                    <p className="line-clamp-2 text-sm leading-6 text-[#8a7560]">{desc || "Producto profesional listo para tu obra."}</p>
                    {stockStatus ? (
                        <span
                            className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${stockStatus.bg} ${stockStatus.tone}`}
                        >
                            {stockStatus.label}
                        </span>
                    ) : null}
                </div>

                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        {showPricesEnabled ? (
                            canViewPrices ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-2xl font-black text-primary">{formatCurrency(price, currency, locale)}</span>
                                        <span
                                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                                                product.isWholesaleItem
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-[#181411]/10 text-[#181411] dark:bg-white/10 dark:text-white"
                                            }`}
                                        >
                                            {product.isWholesaleItem ? "Mayorista" : "Minorista"}
                                        </span>
                                    </div>
                                    {oldPrice ? (
                                        <span className="text-sm text-[#8a7560] line-through">{formatCurrency(oldPrice, currency, locale)}</span>
                                    ) : null}
                                </>
                            ) : authLoading ? (
                                <span className="text-sm text-[#8a7560]">Cargando precio...</span>
                            ) : (
                                <PriceAccessPrompt compact />
                            )
                        ) : (
                            <span className="text-sm text-[#8a7560]">Consultar precio</span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => addToCart(product, 1)}
                        disabled={!inStock}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <CartPlusIcon className="size-5" />
                    </button>
                </div>
            </div>
        </article>
    );
}

function PaginationButton({ label, onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="rounded-xl border border-[#e5e1de] px-4 py-2 text-sm font-bold text-[#181411] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#3d2f21] dark:text-white"
        >
            {label}
        </button>
    );
}

function FilterIcon({ className = "size-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
    );
}

function ResetIcon({ className = "size-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}

function CloseIcon({ className = "size-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ChevronRightIcon({ className = "size-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function HeartIcon({ active = false, className = "size-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}

function EyeIcon({ className = "size-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function CartPlusIcon({ className = "size-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.64 16h9.72a2 2 0 0 0 1.96-1.61L23 6H6" />
            <path d="M12 9h6" />
            <path d="M15 6v6" />
        </svg>
    );
}
