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
    const [activeImage, setActiveImage] = useState(0);
    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

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
        setActiveImage(0);
        setQty(1);
        setActiveTab("description");

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

    useEffect(() => {
        let active = true;
        if (!productId) return () => {};

        const loadRelated = async () => {
            setRelatedLoading(true);
            try {
                const res = await fetch(`${getApiBase()}/public/products/${productId}/related?limit=4`, {
                    headers: getTenantHeaders(),
                });
                if (!res.ok) {
                    throw new Error(`Related request failed: ${res.status}`);
                }
                const data = await res.json();
                if (!active) return;
                setRelatedProducts(Array.isArray(data.items) ? data.items : []);
            } catch (err) {
                if (!active) return;
                console.error("Failed to load related products", err);
                setRelatedProducts([]);
            } finally {
                if (active) {
                    setRelatedLoading(false);
                }
            }
        };

        loadRelated();

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
            images: [],
            alt: data.image_alt || product.name || "Product",
            price,
            oldPrice: !isWholesale && data.old_price ? Number(data.old_price) : null,
            isWholesaleItem: isWholesale && product.price_wholesale != null,
            extra: data,
        };
    }, [product, isWholesale]);

    const images = useMemo(() => {
        if (!view) return [];
        const data = view.extra || {};
        const rawImages = Array.isArray(data.images) ? data.images : [];
        const normalized = [];
        const pushUrl = (url) => {
            if (!url) return;
            if (!normalized.some((item) => item.url === url)) {
                normalized.push({ url });
            }
        };

        if (data.image || data.image_url) {
            pushUrl(data.image || data.image_url);
        }

        rawImages.forEach((img) => {
            if (typeof img === "string") {
                pushUrl(img);
                return;
            }
            if (img && typeof img === "object") {
                pushUrl(img.url || img.src || img.image);
            }
        });

        if (!normalized.length) {
            pushUrl(view.image || FALLBACK_IMAGE);
        }

        return normalized;
    }, [view]);

    const features = useMemo(() => {
        if (!view) return [];
        const items = Array.isArray(view.extra?.features) ? view.extra.features : [];
        return items.filter((item) => item && (item.title || item.description || item.text));
    }, [view]);

    const specifications = useMemo(() => {
        if (!view) return [];
        const specMap = view.extra?.specifications || {};
        const labels = {
            material: "Material",
            medidas: "Medidas",
            terminacion: "Terminacion",
            descarga: "Descarga",
            warranty: "Garantia",
        };
        return Object.entries(specMap)
            .map(([key, value]) => ({
                key,
                label: labels[key] || key,
                value,
            }))
            .filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== "");
    }, [view]);

    const relatedCards = useMemo(() => {
        return relatedProducts.map((item, index) => {
            const data = item.data || {};
            const rawImages = Array.isArray(data.images) ? data.images : [];
            const rawFirst = rawImages[0];
            const image =
                data.image ||
                data.image_url ||
                (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
                FALLBACK_IMAGE;

            const price = isWholesale && item.price_wholesale != null
                ? Number(item.price_wholesale)
                : Number(item.price || 0);

            return {
                id: item.id,
                name: item.name,
                price,
                image,
                alt: data.image_alt || item.name || "Producto",
                stock: item.stock,
                isWholesaleItem: isWholesale && item.price_wholesale != null,
                index,
            };
        });
    }, [relatedProducts, isWholesale]);

    const canBuy = view ? isInStock(view.stock) : false;
    const stockStatus = view && showStock ? getStockStatus(view.stock, lowStockThreshold) : null;

    const handleAdd = () => {
        if (!view || !canBuy) return;
        const safeQty = Math.max(1, Number(qty) || 1);
        addToCart({
            id: view.id,
            sku: view.sku,
            name: view.name,
            price: view.price,
            image: view.image,
            alt: view.alt,
            stock: view.stock,
            variant: view.extra?.variant || "",
        }, safeQty);
    };

    return (
        <StoreLayout>
            <main className="max-w-[1400px] mx-auto w-full px-4 md:px-10 py-10">
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
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10">
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-4">
                                    <div className="aspect-[4/3] w-full rounded-2xl bg-[#f5f2f0] dark:bg-[#2c2116] overflow-hidden">
                                        <img
                                            src={images[activeImage]?.url || view.image}
                                            alt={view.alt}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                                {images.length > 1 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {images.slice(0, 4).map((img, index) => (
                                            <button
                                                key={img.url}
                                                type="button"
                                                onClick={() => setActiveImage(index)}
                                                className={`rounded-xl border p-1 bg-white dark:bg-[#1a130c] transition-colors ${index === activeImage ? 'border-primary' : 'border-[#e5e1de] dark:border-[#3d2f21] hover:border-primary/60'}`}
                                            >
                                                <div className="aspect-square rounded-lg overflow-hidden bg-[#f5f2f0] dark:bg-[#2c2116]">
                                                    <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-6">
                                <div>
                                    {view.extra?.collection ? (
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                            {view.extra.collection}
                                        </p>
                                    ) : null}
                                    <h1 className="text-3xl md:text-4xl font-black text-[#181411] dark:text-white mt-2">
                                        {view.name}
                                    </h1>
                                    {view.sku ? (
                                        <p className="text-[#8a7560] mt-2 text-xs font-bold uppercase tracking-wider">
                                            SKU: {view.sku}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-3">
                                    {stockStatus ? (
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stockStatus.bg} ${stockStatus.tone}`}
                                        >
                                            {stockStatus.label}
                                        </span>
                                    ) : null}
                                    {view.extra?.delivery_time ? (
                                        <span className="text-xs text-[#8a7560]">Entrega en {view.extra.delivery_time}</span>
                                    ) : null}
                                </div>

                                <div className="border-y border-[#e5e1de] dark:border-[#3d2f21] py-4 space-y-2">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8a7560]">Precio</p>
                                    {showPrices ? (
                                        <div className="flex items-end gap-3">
                                            <span className="text-3xl font-black text-[#181411] dark:text-white">
                                                {formatCurrency(view.price, currency, locale)}
                                            </span>
                                            {view.oldPrice ? (
                                                <span className="text-sm text-[#8a7560] line-through">
                                                    {formatCurrency(view.oldPrice, currency, locale)}
                                                </span>
                                            ) : null}
                                            {view.isWholesaleItem ? (
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">
                                                    Wholesale
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="text-[#8a7560]">Contactar para precio</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                                            className="h-11 w-11 flex items-center justify-center text-[#8a7560] hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]"
                                        >
                                            -
                                        </button>
                                        <span className="h-11 w-12 flex items-center justify-center font-bold text-[#181411] dark:text-white">
                                            {qty}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setQty((prev) => prev + 1)}
                                            className="h-11 w-11 flex items-center justify-center text-[#8a7560] hover:bg-[#f5f2f0] dark:hover:bg-[#2c2116]"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        className="h-11 flex-1 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
                                        disabled={!canBuy}
                                    >
                                        {canBuy ? "Agregar al carrito" : "Sin stock"}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="h-11 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] font-bold text-[#181411] dark:text-white hover:border-primary/50"
                                >
                                    Agregar a favoritos
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-start gap-3 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] p-3 bg-white/70 dark:bg-[#1a130c]">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#181411] dark:text-white">Envio rapido</p>
                                            <p className="text-[11px] text-[#8a7560]">Consulte tiempos y cobertura.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] p-3 bg-white/70 dark:bg-[#1a130c]">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#181411] dark:text-white">Garantia</p>
                                            <p className="text-[11px] text-[#8a7560]">
                                                {view.extra?.warranty ? view.extra.warranty : "Consulta condiciones."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c]">
                            <div className="flex flex-wrap gap-2 border-b border-[#e5e1de] dark:border-[#3d2f21] px-6 pt-4">
                                {[
                                    { id: "description", label: "Descripcion" },
                                    { id: "specs", label: "Especificaciones" },
                                    { id: "shipping", label: "Envio" },
                                    { id: "reviews", label: "Reseñas" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 text-sm font-bold uppercase tracking-widest ${activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-[#8a7560] hover:text-primary"}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === "description" ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-black text-[#181411] dark:text-white mb-2">
                                                {view.name}
                                            </h3>
                                            <p className="text-sm text-[#8a7560] leading-relaxed">
                                                {view.description || "Sin descripcion disponible."}
                                            </p>
                                        </div>
                                        {features.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {features.map((feature, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <span className="text-sm font-black">
                                                                {feature.icon || "✓"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#181411] dark:text-white">
                                                                {feature.title || "Caracteristica"}
                                                            </p>
                                                            <p className="text-[12px] text-[#8a7560]">
                                                                {feature.description || feature.text || ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {activeTab === "specs" ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {specifications.length > 0 ? (
                                            specifications.map((spec) => (
                                                <div key={spec.key}>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a7560]">
                                                        {spec.label}
                                                    </p>
                                                    <p className="text-sm font-semibold text-[#181411] dark:text-white mt-1">
                                                        {spec.value}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-[#8a7560]">Sin especificaciones.</p>
                                        )}
                                    </div>
                                ) : null}

                                {activeTab === "shipping" ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-[#8a7560]">
                                            {view.extra?.delivery_time
                                                ? `Entrega estimada: ${view.extra.delivery_time}.`
                                                : "Consulta tiempos de envio y disponibilidad."}
                                        </p>
                                        <p className="text-sm text-[#8a7560]">
                                            Coordinamos envios y retiros con la logistica que mejor se adapte a tu obra.
                                        </p>
                                    </div>
                                ) : null}

                                {activeTab === "reviews" ? (
                                    <div className="text-sm text-[#8a7560]">
                                        Todavia no hay reseñas para este producto.
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-[#181411] dark:text-white">
                                    Productos relacionados
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => navigate("/catalog")}
                                    className="text-[11px] font-bold uppercase tracking-widest text-[#8a7560] hover:text-primary"
                                >
                                    Ver catalogo
                                </button>
                            </div>

                            {relatedLoading ? (
                                <div className="rounded-xl border border-dashed border-[#e5e1de] dark:border-[#3d2f21] p-6 text-center text-[#8a7560]">
                                    Cargando relacionados...
                                </div>
                            ) : relatedCards.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#e5e1de] dark:border-[#3d2f21] p-6 text-center text-[#8a7560]">
                                    No hay productos relacionados.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {relatedCards.map((item) => (
                                        <div key={item.id} className="bg-white dark:bg-[#1a130c] rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] overflow-hidden group hover:shadow-xl transition-all duration-300">
                                            <div
                                                className="relative aspect-square overflow-hidden bg-[#f5f2f0] dark:bg-[#2c2116] cursor-pointer"
                                                onClick={() => navigate(`/product/${item.id}`)}
                                            >
                                                <img
                                                    alt={item.name}
                                                    title={item.alt}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    src={item.image}
                                                    loading="lazy"
                                                />
                                            </div>

                                            <div className="p-4 flex flex-col gap-2">
                                                <div>
                                                    <h3 className="text-[#181411] dark:text-white font-bold text-sm leading-tight mb-1 line-clamp-2">
                                                        {item.name}
                                                    </h3>
                                                </div>
                                                {showPrices ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-primary font-black text-base">
                                                            {formatCurrency(item.price, currency, locale)}
                                                        </span>
                                                        {item.isWholesaleItem ? (
                                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                                                Wholesale
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#8a7560] text-xs">Consultar precio</span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(item, 1)}
                                                    className="mt-2 w-full h-9 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-colors"
                                                    disabled={!isInStock(item.stock)}
                                                >
                                                    {isInStock(item.stock) ? "Agregar" : "Sin stock"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </StoreLayout>
    );
}
