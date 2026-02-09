import React, { useEffect, useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/format";
import { getApiBase, getTenantHeaders } from "../../utils/api";
import { navigate } from "../../utils/navigation";
import { getLowStockThreshold, getStockStatus, isInStock } from "../../utils/stock";

const FALLBACK_IMAGE = "https://via.placeholder.com/900";

const getProductId = () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] !== "product") return null;
    return parts[1] || null;
};

export default function ProductDetail() {
    const { addToCart } = useStore();
    const { settings } = useTenant();
    const { isWholesale } = useAuth();

    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const showPrices = settings?.commerce?.show_prices !== false;
    const showStock = settings?.commerce?.show_stock !== false;
    const lowStockThreshold = getLowStockThreshold(settings);

    const [productId, setProductId] = useState(getProductId);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const update = () => setProductId(getProductId());
        window.addEventListener("popstate", update);
        window.addEventListener("navigate", update);
        return () => {
            window.removeEventListener("popstate", update);
            window.removeEventListener("navigate", update);
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadProduct = async () => {
            if (!productId) {
                setError("Missing product id.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await fetch(`${getApiBase()}/public/products/${productId}`, {
                    headers: getTenantHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`Product request failed: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                setProduct(data);
            } catch (err) {
                if (!active) return;
                console.error("Failed to load product", err);
                setProduct(null);
                setError("We could not load this product.");
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadProduct();

        return () => {
            active = false;
        };
    }, [productId]);

    const view = useMemo(() => {
        if (!product) return null;
        const data = product.data || {};
        const rawImages = Array.isArray(data.images) ? data.images : [];
        const rawFirst = rawImages[0];
        const image =
            data.image ||
            data.image_url ||
            (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
            FALLBACK_IMAGE;

        const price = isWholesale && product.price_wholesale != null
            ? Number(product.price_wholesale)
            : Number(product.price || 0);

        return {
            id: product.id,
            sku: product.sku || product.erp_id,
            name: product.name || "Product",
            description: product.description || data.description || "",
            brand: product.brand || data.brand,
            stock: product.stock,
            image,
            alt: data.image_alt || product.name || "Product",
            price,
            isWholesaleItem: isWholesale && product.price_wholesale != null,
            extra: data,
        };
    }, [product, isWholesale]);

    const canBuy = view ? isInStock(view.stock) : false;
    const stockStatus = view && showStock ? getStockStatus(view.stock, lowStockThreshold) : null;

    const handleAdd = () => {
        if (!view || !canBuy) return;
        addToCart({
            id: view.id,
            sku: view.sku,
            name: view.name,
            price: view.price,
            image: view.image,
            alt: view.alt,
            stock: view.stock,
            variant: view.extra?.variant || "",
        });
    };

    return (
        <StoreLayout>
            <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-10">
                <div className="flex items-center gap-2 text-sm text-[#8a7560] mb-6">
                    <button type="button" onClick={() => navigate("/")} className="hover:text-primary">
                        Home
                    </button>
                    <span>/</span>
                    <button type="button" onClick={() => navigate("/catalog")} className="hover:text-primary">
                        Catalog
                    </button>
                    <span>/</span>
                    <span className="text-[#181411] dark:text-white">
                        {view?.name || "Product"}
                    </span>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-dashed border-[#e5e1de] dark:border-[#3d2f21] p-10 text-center text-[#8a7560]">
                        Loading product...
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-10 text-center text-red-600">
                        {error}
                    </div>
                ) : !view ? (
                    <div className="rounded-xl border border-dashed border-[#e5e1de] dark:border-[#3d2f21] p-10 text-center text-[#8a7560]">
                        Product not found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-6">
                            <div className="aspect-square w-full rounded-xl bg-[#f5f2f0] dark:bg-[#2c2116] overflow-hidden">
                                <div
                                    className="w-full h-full bg-center bg-no-repeat bg-cover"
                                    style={{ backgroundImage: `url("${view.image}")` }}
                                    role="img"
                                    aria-label={view.alt}
                                    title={view.alt}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-[#181411] dark:text-white">
                                    {view.name}
                                </h1>
                                {view.brand ? (
                                    <p className="text-[#8a7560] mt-2 text-sm">Brand: {view.brand}</p>
                                ) : null}
                                {view.sku ? (
                                    <p className="text-[#8a7560] mt-1 text-xs font-bold uppercase tracking-wider">
                                        SKU: {view.sku}
                                    </p>
                                ) : null}
                            </div>

                            {showPrices ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-primary">
                                        {formatCurrency(view.price, currency, locale)}
                                    </span>
                                    {view.isWholesaleItem ? (
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">
                                            Wholesale
                                        </span>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="text-[#8a7560]">Contact for price</p>
                            )}

                            <p className="text-[#8a7560] leading-relaxed">
                                {view.description || "No description available."}
                            </p>
                            {stockStatus ? (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stockStatus.bg} ${stockStatus.tone}`}
                                    >
                                        {stockStatus.label}
                                    </span>
                                    {typeof view.stock === "number" ? (
                                        <span className="text-xs text-[#8a7560]">Stock: {view.stock}</span>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    className="h-12 px-6 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
                                    disabled={!canBuy}
                                >
                                    {canBuy ? "Agregar al carrito" : "Sin stock"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/catalog")}
                                    className="h-12 px-6 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] font-bold text-[#181411] dark:text-white hover:border-primary/50"
                                >
                                    Volver al catalogo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </StoreLayout>
    );
}
