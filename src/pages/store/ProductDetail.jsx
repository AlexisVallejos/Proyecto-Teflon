import React, { useMemo, useState, useEffect } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { getApiBase, getTenantHeaders } from "../../utils/api";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";

const DEFAULT_DESCRIPTION =
    "Nuestro set de porcelana combina estética moderna con ingeniería de alto rendimiento. Diseñado para facilitar la limpieza y mantener el brillo por años.";

const DEFAULT_PRODUCT = {
    id: "SET-BATH-001",
    name: "Set de inodoro porcelana - Blanco",
    sku: "SET-BATH-001",
    price: 459,
    oldPrice: 580,
    stock: 12,
    description: DEFAULT_DESCRIPTION,
    data: {},
};

const DEFAULT_IMAGES = [
    {
        id: "main",
        alt: "Inodoro blanco porcelana en baño moderno",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDv8YzTCR4gX6zFam1LwuH5HJDAvE7aoXu0L9TL3JEOIcOHOTOo9gR_f4s9-fMVH0hYykw7F1_qJR2tnBpxcugeFAX1ZL0xHfBmmOniSI2_EoVFQBT_xRfiRBjHjaC17PYofIUT_SN9UIb0LIfiokaioKAtueDer-u8wQFqGvO6ynAkWb3h5nY4Ky3WNKUcPhQwwwhWEAp4pT0mPjay6W_ZpDUjHJJvvuNKQCYqeDg7kLZfBX1Z17RERUu1m8P2FMBpPzsIadDuEuo",
    },
    {
        id: "thumb-1",
        alt: "Vista principal del inodoro",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAot3vJROZtP44PaIZ0wb_jJjqR0WKvwN53AyUXh2SIs5lPwb5Yg7tGpgHDRPAdzzSJeScEyxjJvySYuticwqBuCNoXGB3tZ4Mct2DmSl8qALnIwTUsFttZxIdLY4J_z3IIP_cT807TmSub1WTHsTUnvxXqRNgpYcKTnB4iaslPulsdBzJjrKtPQKpjb3HvDVJhIHNIAjm5o_Sc1IF2M4MH1VCcu3zwmjxJLIzGN0SJSUKoGhmrYpB-0Dfl9J2-N-gFX76D0vO_YAs",
    },
    {
        id: "thumb-2",
        alt: "Detalle del mecanismo de descarga",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfZANt4wnettS9zM29Iu_Ou5J0oBh7sIDLGOG8nhRyoKdDucptDU4R4Uy_tWIKUeKer1UynWLegSrymoCgaz5uZX1IxZ2SnhTeAwbf-oTAvGQFPBNtz7h6msgH1RziEahlJ5jrd_9j2nYYX1_uvWx0JW3VTOZG63Il1k8vkz6WwZxZpzE3wFy9OqC5XFCp0b341k-4vyxGT5iu_ApOGulnpeiUUpa4G8XSbMxeKJu52IGjnRlLU0VizCu_wjNCAqBZPoePiG8eHQk",
    },
    {
        id: "thumb-3",
        alt: "Perfil del producto en porcelana",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi9SmBaQmnYzStL8Gj4LTvnSZ7g224X01bDGcuTtFUMgpyfvf0QXmV7U1Yuig9YznlmPgrW-TxpMiriX27oI8fnTekPNxR8VK_wv6lbSOTp9ISGejQRMoujHtzd4fBr-_ik0srmNKh3RQg49L7uuZMhsujGdGlNvjOHduVVB6VXGo1n_iHJ-aF-LviHagqS7Is9ybIIo2IaN1o62VEm8zOltEq82ctJSCTA9a2ritultjetB72IjhfQ2yGoE0c2REJjktmiN27LgQ",
    },
];

const getProductIdFromHash = () => {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#product")) {
        return null;
    }

    const tail = hash.slice("#product".length);
    if (tail.startsWith("/")) {
        return tail.slice(1) || null;
    }

    if (tail.startsWith("?")) {
        const params = new URLSearchParams(tail.slice(1));
        return params.get("id");
    }

    return null;
};

const normalizeProduct = (data) => {
    if (!data) return DEFAULT_PRODUCT;

    return {
        id: data.id || DEFAULT_PRODUCT.id,
        name: data.name || DEFAULT_PRODUCT.name,
        sku: data.sku || data.erp_id || data.id || DEFAULT_PRODUCT.sku,
        price: Number(data.price ?? DEFAULT_PRODUCT.price),
        oldPrice: data.data?.old_price ? Number(data.data.old_price) : null,
        stock: typeof data.stock === "number" ? data.stock : DEFAULT_PRODUCT.stock,
        description: data.description || DEFAULT_PRODUCT.description,
        data: data.data || {},
    };
};

const normalizeImages = (product) => {
    const data = product?.data || {};
    const rawImages = Array.isArray(data.images) ? data.images : [];

    const images = rawImages
        .map((img, index) => {
            if (!img) return null;
            if (typeof img === "string") {
                return {
                    id: `img-${index}`,
                    url: img,
                    alt: product?.name || "Producto",
                };
            }
            if (typeof img === "object") {
                const url = img.url || img.src || img.href;
                if (!url) return null;
                return {
                    id: img.id || `img-${index}`,
                    url,
                    alt: img.alt || product?.name || "Producto",
                };
            }
            return null;
        })
        .filter(Boolean);

    return images.length ? images : DEFAULT_IMAGES;
};

export default function ProductDetail() {
    const { addToCart } = useStore();
    const { settings } = useTenant();
    const currency = settings?.commerce?.currency || "ARS";
    const locale = settings?.commerce?.locale || "es-AR";
    const showPrices = settings?.commerce?.show_prices !== false;
    const showStock = settings?.commerce?.show_stock !== false;
    const freeShippingThreshold = settings?.commerce?.free_shipping_threshold || 0;

    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const [productId, setProductId] = useState(getProductIdFromHash());
    const [product, setProduct] = useState(DEFAULT_PRODUCT);

    useEffect(() => {
        const handleHashChange = () => {
            setProductId(getProductIdFromHash());
        };

        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        const loadProduct = async () => {
            if (!productId) {
                setProduct(DEFAULT_PRODUCT);
                return;
            }

            try {
                const response = await fetch(
                    `${getApiBase()}/public/products/${productId}`,
                    {
                        headers: getTenantHeaders(),
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(`Product request failed: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                setProduct(normalizeProduct(data));
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("No se pudo cargar el producto", err);
                    if (active) {
                        setProduct(DEFAULT_PRODUCT);
                    }
                }
            }
        };

        loadProduct();

        return () => {
            active = false;
            controller.abort();
        };
    }, [productId]);

    const images = useMemo(() => normalizeImages(product), [product]);
    const [activeImage, setActiveImage] = useState(images[0]);

    useEffect(() => {
        setActiveImage(images[0]);
    }, [images]);

    const inc = () => setQty((q) => Math.min(999, q + 1));
    const dec = () => setQty((q) => Math.max(1, q - 1));

    const inStock = typeof product.stock === "number" ? product.stock > 0 : true;

    const handleAddToCart = () => {
        if (!inStock) return;
        addToCart(
            {
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.price,
                image: images[0]?.url,
                alt: images[0]?.alt,
            },
            qty
        );
    };

    return (
        <StoreLayout>
            <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <nav className="flex flex-wrap gap-2 mb-6 items-center">
                    <button
                        className="text-[#8a7560] text-sm font-medium hover:text-primary"
                        onClick={() => (window.location.hash = '#')}
                        type="button"
                    >
                        Inicio
                    </button>
                    <span className="material-symbols-outlined text-sm text-[#8a7560]">
                        chevron_right
                    </span>
                    <button
                        className="text-[#8a7560] text-sm font-medium hover:text-primary"
                        onClick={() => (window.location.hash = '#catalog')}
                        type="button"
                    >
                        Sanitarios
                    </button>
                    <span className="material-symbols-outlined text-sm text-[#8a7560]">
                        chevron_right
                    </span>
                    <span className="text-[#181411] dark:text-white text-sm font-medium">
                        {product.name}
                    </span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Image Gallery */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative group">
                            <div
                                className="w-full h-full bg-center bg-no-repeat bg-cover"
                                style={{ backgroundImage: `url("${activeImage.url}")` }}
                                role="img"
                                aria-label={activeImage.alt}
                                title={activeImage.alt}
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-4 bg-white/80 dark:bg-black/40 p-2 rounded-full backdrop-blur-sm"
                                aria-label="Editar imagen"
                            >
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {images.slice(1).map((img, idx) => {
                                const isActive = activeImage.id === img.id;
                                const base =
                                    "cursor-pointer rounded-lg overflow-hidden aspect-square bg-white dark:bg-zinc-900";
                                const border = isActive
                                    ? "border-2 border-primary"
                                    : "border border-transparent hover:border-primary transition-colors";
                                return (
                                    <button
                                        key={img.id}
                                        type="button"
                                        className={`${base} ${border}`}
                                        onClick={() => setActiveImage(img)}
                                        aria-label={`Seleccionar imagen ${idx + 1}`}
                                        title={img.alt}
                                    >
                                        <div
                                            className="w-full h-full bg-center bg-no-repeat bg-cover"
                                            style={{ backgroundImage: `url("${img.url}")` }}
                                        />
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                className="cursor-pointer border border-transparent hover:border-primary transition-colors rounded-lg overflow-hidden aspect-square bg-white dark:bg-zinc-900 flex items-center justify-center text-primary bg-primary/10"
                                aria-label="Agregar foto"
                            >
                                <span className="material-symbols-outlined text-3xl">
                                    add_a_photo
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                    Colección premium
                                </span>
                                <span
                                    className="material-symbols-outlined text-zinc-400 cursor-pointer hover:text-zinc-600"
                                    title="Editar"
                                >
                                    edit_note
                                </span>
                            </div>

                            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#181411] dark:text-white">
                                {product.name}
                            </h1>
                            <p className="text-[#8a7560] text-sm font-normal">
                                SKU: {product.sku}
                            </p>
                        </div>

                        {showStock ? (
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">
                                        check_circle
                                    </span>
                                    {inStock ? "En stock" : "Sin stock"}
                                </div>
                                <div className="text-[#8a7560] text-sm font-normal">
                                    Listo para entrega en 24/48 h
                                </div>
                            </div>
                        ) : null}

                        <div className="py-4 border-y border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                            <span className="text-sm font-medium text-[#8a7560]">
                                Precio unitario
                            </span>
                            <div className="flex items-baseline gap-2">
                                {showPrices ? (
                                    <>
                                        <span className="text-4xl font-black text-black dark:text-white">
                                            {formatCurrency(product.price, currency, locale)}
                                        </span>
                                        {product.oldPrice ? (
                                            <span className="text-lg text-zinc-400 line-through">
                                                {formatCurrency(product.oldPrice, currency, locale)}
                                            </span>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="text-2xl font-black text-black dark:text-white">
                                        Consultar precio
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Purchase Actions */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg h-12 bg-white dark:bg-zinc-800">
                                    <button
                                        type="button"
                                        onClick={dec}
                                        className="px-3 hover:text-primary transition-colors h-full"
                                        aria-label="Disminuir cantidad"
                                    >
                                        <span className="material-symbols-outlined">remove</span>
                                    </button>

                                    <input
                                        className="w-12 text-center bg-transparent border-none focus:ring-0 font-bold"
                                        type="number"
                                        value={qty}
                                        onChange={(e) =>
                                            setQty(
                                                Math.max(
                                                    1,
                                                    Math.min(999, Number(e.target.value || 1))
                                                )
                                            )
                                        }
                                        min={1}
                                        max={999}
                                    />

                                    <button
                                        type="button"
                                        onClick={inc}
                                        className="px-3 hover:text-primary transition-colors h-full"
                                        aria-label="Aumentar cantidad"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={!inStock}
                                >
                                    <span className="material-symbols-outlined">
                                        shopping_cart_checkout
                                    </span>
                                    Agregar al carrito
                                </button>
                            </div>

                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 py-3 px-8 border border-zinc-300 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <span className="material-symbols-outlined">favorite</span>
                                Agregar a favoritos
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <span className="material-symbols-outlined text-primary">
                                    local_shipping
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Envío gratis</span>
                                    <span className="text-[10px] text-zinc-500">
                                        {freeShippingThreshold
                                            ? `En compras mayores a ${formatCurrency(
                                                freeShippingThreshold,
                                                currency,
                                                locale
                                            )}`
                                            : "Envíos a todo el país"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <span className="material-symbols-outlined text-primary">
                                    verified_user
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Garantía 5 años</span>
                                    <span className="text-[10px] text-zinc-500">
                                        Cerámica &amp; mecanismo
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                        <TabButton
                            active={activeTab === "description"}
                            onClick={() => setActiveTab("description")}
                        >
                            Descripción
                        </TabButton>

                        <TabButton
                            active={activeTab === "specs"}
                            onClick={() => setActiveTab("specs")}
                            rightIcon="edit"
                        >
                            Especificaciones
                        </TabButton>

                        <TabButton
                            active={activeTab === "shipping"}
                            onClick={() => setActiveTab("shipping")}
                        >
                            Envío
                        </TabButton>

                        <TabButton
                            active={activeTab === "reviews"}
                            onClick={() => setActiveTab("reviews")}
                        >
                            Reseñas (12)
                        </TabButton>
                    </div>

                    <div className="p-8">
                        {activeTab === "description" && (
                            <div className="max-w-3xl flex flex-col gap-6">
                                <div className="relative group">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        Mejorá tu baño con calidad premium
                                        <span className="material-symbols-outlined text-zinc-300 opacity-0 group-hover:opacity-100 cursor-pointer">
                                            edit
                                        </span>
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="flex flex-col gap-4">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">
                                                eco
                                            </span>
                                            Descarga eficiente
                                        </h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Sistema dual que reduce el consumo de agua sin perder
                                            potencia.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">
                                                cleaning_services
                                            </span>
                                            Fácil limpieza
                                        </h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Superficie esmaltada que evita manchas y simplifica el
                                            mantenimiento.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                                    <h3 className="text-xl font-bold mb-4">Especificaciones</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <Spec label="Material" value="Porcelana vítrea" />
                                        <Spec label="Medidas" value={`28" x 15" x 29"`} />
                                        <Spec label="Terminación" value="Blanco brillante" />
                                        <Spec label="Descarga" value="Dual Tornado" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "specs" && (
                            <div className="max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">Especificaciones</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Próximamente vas a poder ver la ficha técnica completa del
                                    producto.
                                </p>
                            </div>
                        )}

                        {activeTab === "shipping" && (
                            <div className="max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">Envío</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Consultá tiempos de entrega, retiro en sucursal y envíos
                                    especiales según tu zona.
                                </p>
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">Reseñas</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Pronto vas a poder leer opiniones de otros clientes.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </StoreLayout>
    );
}

function TabButton({ active, onClick, children, rightIcon }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                active
                    ? "px-8 py-4 text-sm font-bold border-b-2 border-primary text-primary"
                    : "px-8 py-4 text-sm font-bold text-zinc-500 hover:text-primary transition-colors relative"
            }
        >
            {children}
            {rightIcon ? (
                <span className="absolute right-2 top-2 material-symbols-outlined text-[12px]">
                    {rightIcon}
                </span>
            ) : null}
        </button>
    );
}

function Spec({ label, value }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                {label}
            </span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
