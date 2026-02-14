import React, { useMemo, useRef, useState, useEffect } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";
import { useStore } from "../../context/StoreContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";
import { getApiBase, getTenantHeaders } from "../../utils/api";
import { navigate } from "../../utils/navigation";

export default function CheckoutPage() {
    const { cartItems, clearCart } = useStore();
    const { settings } = useTenant();
    const { user } = useAuth();
    const commerce = settings?.commerce || {};
    const currency = commerce.currency || "ARS";
    const locale = commerce.locale || "es-AR";
    const whatsappNumber = (commerce.whatsapp_number || "2236334301").replace(/\D/g, "");

    const [items, setItems] = useState(cartItems);
    const [validation, setValidation] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [creating, setCreating] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);

    // Form state
    const [shippingInfo, setShippingInfo] = useState({
        fullAddress: "",
        city: "",
        postalCode: "",
    });
    const shippingAutofillRef = useRef(false);

    const shippingFlat = Number(commerce.shipping_flat || 0);

    const DELIVERY = {
        home: {
            key: "home",
            title: "Entrega a domicilio",
            desc: "Recibí tu pedido en 24/48 hs en Mar del Plata",
            price: shippingFlat,
        },
        mdp: {
            key: "mdp",
            title: "Retiro: Sucursal Mar del Plata",
            desc: "Listo en 2 horas. Av. Independencia 1234",
            price: shippingFlat,
        },
        necochea: {
            key: "necochea",
            title: "Retiro: Sucursal Necochea",
            desc: "Listo en 4 horas. Calle 64 Nro 3456",
            price: shippingFlat,
        },
    };

    const [deliveryMethod, setDeliveryMethod] = useState("home");

    const paymentOptions = useMemo(
        () => [
            {
                key: "mp",
                label: "Mercado Pago (pago online)",
                highlight: true,
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                ),
            },
            {
                key: "whatsapp",
                label: "WhatsApp (efectivo o transferencia)",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 4.5z"></path></svg>
                ),
            },
        ],
        []
    );

    const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]?.key || "mp");

    useEffect(() => {
        if (!paymentOptions.find((opt) => opt.key === paymentMethod)) {
            setPaymentMethod(paymentOptions[0]?.key || "mp");
        }
    }, [paymentOptions, paymentMethod]);

    const [orderSuccess, setOrderSuccess] = useState(null);

    // Accordion open
    const [openStep, setOpenStep] = useState(1); // 1..3

    useEffect(() => {
        setItems(cartItems);
    }, [cartItems]);

    useEffect(() => {
        if (!user || shippingAutofillRef.current) return;
        const key = `teflon_profile_address_${user.id || user.email}`;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const prefill = {
                fullAddress: parsed.line1 || parsed.fullAddress || "",
                city: parsed.city || "",
                postalCode: parsed.postal || parsed.postalCode || "",
            };
            setShippingInfo((prev) => ({
                fullAddress: prev.fullAddress || prefill.fullAddress,
                city: prev.city || prefill.city,
                postalCode: prev.postalCode || prefill.postalCode,
            }));
            shippingAutofillRef.current = true;
        } catch (err) {
            console.warn("No se pudo cargar la direccion de perfil", err);
        }
    }, [user]);

    useEffect(() => {
        let active = true;

        const validateCart = async () => {
            if (!items.length) {
                setValidation(null);
                setValidationError(null);
                return;
            }

            try {
                const response = await fetch(`${getApiBase()}/checkout/validate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getTenantHeaders(),
                        'Authorization': `Bearer ${localStorage.getItem('teflon_token')}`
                    },
                    body: JSON.stringify({
                        items: items.map((item) => ({
                            product_id: item.id,
                            qty: item.qty,
                        })),
                    }),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error?.errors?.[0] || "No se pudo validar el carrito");
                }

                const data = await response.json();
                if (!active) return;

                setValidation(data);
                setValidationError(null);
            } catch (err) {
                console.error("Error al validar el carrito", err);
                if (active) {
                    setValidation(null);
                    setValidationError("No se pudo validar el carrito. Revisá los productos.");
                }
            }
        };

        validateCart();

        return () => {
            active = false;
        };
    }, [items]);

    const subtotal = useMemo(() => {
        if (validation?.subtotal != null) {
            return Number(validation.subtotal);
        }
        return items.reduce((acc, it) => acc + it.price * it.qty, 0);
    }, [items, validation]);

    const displayCurrency = validation?.currency || currency;
    const taxRate = Number(commerce.tax_rate || 0);
    const shipping = subtotal > 0 ? shippingFlat : 0;
    const iva = (subtotal + shipping) * taxRate;
    const total = subtotal + shipping + iva;

    const summaryItems = validation?.items?.length
        ? validation.items.map((item) => {
            const fallback = items.find((it) => it.id === item.product_id);
            return {
                id: item.product_id,
                name: item.name,
                qty: item.qty,
                price: item.unit_price,
                image: fallback?.image,
                alt: fallback?.alt || item.name,
            };
        })
        : items;

    const paymentSummary = useMemo(() => {
        if (paymentMethod === "mp") {
            return "Mercado Pago (pago online). Luego de confirmar, te redirigimos al pago.";
        }
        if (paymentMethod === "whatsapp") {
            return "WhatsApp (efectivo o transferencia). Luego de confirmar, abrimos WhatsApp con el detalle.";
        }
        return "";
    }, [paymentMethod]);

    const paymentLabel = useMemo(
        () => paymentOptions.find((opt) => opt.key === paymentMethod)?.label || "",
        [paymentOptions, paymentMethod]
    );

    const getProfileAddress = () => {
        if (!user) return {};
        const key = `teflon_profile_address_${user.id || user.email}`;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return {
                fullName: parsed.fullName || "",
                phone: parsed.phone || parsed.phoneNumber || "",
                line1: parsed.line1 || "",
                city: parsed.city || "",
                postal: parsed.postal || "",
            };
        } catch (err) {
            console.warn("No se pudo leer la direccion de perfil", err);
            return {};
        }
    };

    const buildWhatsappMessage = (note = "") => {
        const profile = getProfileAddress();
        const name =
            profile.fullName ||
            (user?.email ? user.email.split("@")[0] : "Cliente");
        const phone = profile.phone || "Sin telefono";
        const deliveryLabel = DELIVERY[deliveryMethod]?.title || deliveryMethod;
        const paymentLine =
            paymentMethod === "mp"
                ? "Pago: Mercado Pago (online)"
                : "Pago: WhatsApp (efectivo o transferencia)";
        const addressParts = [
            shippingInfo.fullAddress || profile.line1,
            shippingInfo.city || profile.city,
            shippingInfo.postalCode || profile.postal,
        ]
            .filter(Boolean)
            .join(", ");
        const lines = [
            "Pedido nuevo",
            `Cliente: ${name}`,
            `Telefono: ${phone}`,
            `Direccion: ${addressParts || "Sin direccion"}`,
            `Entrega: ${deliveryLabel}`,
            paymentLine,
            "",
            "Productos:",
            ...items.map(
                (item) =>
                    `- ${item.name} (SKU: ${item.sku || item.id}) x${item.qty}`
            ),
        ];
        if (note) {
            lines.push("", note);
        }
        return lines.join("\n");
    };

    const buildWhatsappUrl = (note = "") => {
        const message = buildWhatsappMessage(note);
        const number = whatsappNumber || "2236334301";
        return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    };

    const handleCompletePurchase = async () => {
        if (!items.length) return;

        setCreating(true);
        setCheckoutError(null);

        try {
            const response = await fetch(`${getApiBase()}/checkout/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getTenantHeaders(),
                    'Authorization': `Bearer ${localStorage.getItem('teflon_token')}`
                },
                body: JSON.stringify({
                    items: items.map((item) => ({
                        product_id: item.id,
                        qty: item.qty,
                    })),
                    customer: {
                        ...shippingInfo,
                        delivery_method: deliveryMethod,
                        payment_method: paymentMethod,
                    },
                }),
            });

            if (!response.ok) {
                let detail = "";
                try {
                    const error = await response.json();
                    detail = error?.errors?.[0] || error?.error || "";
                } catch (err) {
                    try {
                        detail = await response.text();
                    } catch (innerErr) {
                        detail = "";
                    }
                }
                const message = detail ? `No se pudo crear la orden: ${detail}` : "No se pudo crear la orden";
                throw new Error(message);
            }

            const data = await response.json();

            const orderInfo = {
                id: data.order?.id || data.order_id || data.id || "",
                method: paymentMethod,
                paymentLabel,
                deliveryMethod,
                deliveryLabel: DELIVERY[deliveryMethod]?.title || deliveryMethod,
                items: items.map((item) => ({
                    id: item.id,
                    sku: item.sku || item.id,
                    name: item.name,
                    qty: item.qty,
                })),
                whatsappUrl: buildWhatsappUrl(),
                whatsappReceiptUrl: buildWhatsappUrl(
                    "Pago realizado. Adjunto comprobante."
                ),
                createdAt: new Date().toISOString(),
            };

            try {
                localStorage.setItem("teflon_last_order", JSON.stringify(orderInfo));
            } catch (err) {
                console.warn("No se pudo guardar el pedido", err);
            }

            clearCart();

            setOrderSuccess(orderInfo);
            setOpenStep(3);

            if (paymentMethod === "mp" && data.payment?.init_point) {
                window.location.href = data.payment.init_point;
                return;
            }

            if (paymentMethod === "whatsapp") {
                navigate("/order-success");
            }
        } catch (err) {
            console.error("Error al crear la orden", err);
            setCheckoutError("No se pudo iniciar el pago. Proba nuevamente.");
        } finally {
            setCreating(false);
        }
    };

    if (!items.length) {
        return (
            <StoreLayout>
                <main className="max-w-[960px] mx-auto w-full px-4 md:px-10 py-16 text-center">
                    <h1 className="text-3xl font-black mb-4">No hay productos para pagar</h1>
                    <p className="text-[#8a7560] mb-8">
                        Sumá productos al carrito para continuar.
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
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 pb-4">
                    <button
                        className="text-[#8a7560] text-sm font-medium hover:text-primary cursor-pointer"
                        onClick={() => (window.location.hash = '#')}
                        type="button"
                    >
                        Inicio
                    </button>
                    <span className="text-[#8a7560] text-sm font-medium">
                        /
                    </span>
                    <button
                        className="text-[#8a7560] text-sm font-medium hover:text-primary"
                        onClick={() => (window.location.hash = '#cart')}
                        type="button"
                    >
                        Carrito
                    </button>
                    <span className="text-[#8a7560] text-sm font-medium">
                        /
                    </span>
                    <span className="text-[#181411] dark:text-white text-sm font-medium">
                        Finalizar compra
                    </span>
                </div>

                {/* Heading */}
                <div className="pb-8">
                    <h1 className="text-[#181411] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        Finalizar compra
                    </h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left column */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Step Progress */}
                        <StepProgress openStep={openStep} />

                        {/* Steps */}
                        <div className="flex flex-col gap-4">
                            {/* 1 Shipping */}
                            <Accordion
                                step={1}
                                title="Información de envío"
                                openStep={openStep}
                                onOpen={() => setOpenStep(1)}
                            >
                                <div className="pt-4 pb-2 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                Dirección completa
                                            </label>
                                            <input
                                                className="w-full rounded-lg border-[#e6e0db] dark:border-[#3d2e1f] dark:bg-[#3d2e1f] focus:ring-primary focus:border-primary"
                                                placeholder="Calle Falsa 123"
                                                type="text"
                                                value={shippingInfo.fullAddress}
                                                onChange={(e) =>
                                                    setShippingInfo((s) => ({
                                                        ...s,
                                                        fullAddress: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Ciudad
                                            </label>
                                            <input
                                                className="w-full rounded-lg border-[#e6e0db] dark:border-[#3d2e1f] dark:bg-[#3d2e1f] focus:ring-primary focus:border-primary"
                                                placeholder="Mar del Plata"
                                                type="text"
                                                value={shippingInfo.city}
                                                onChange={(e) =>
                                                    setShippingInfo((s) => ({
                                                        ...s,
                                                        city: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Código postal
                                            </label>
                                            <input
                                                className="w-full rounded-lg border-[#e6e0db] dark:border-[#3d2e1f] dark:bg-[#3d2e1f] focus:ring-primary focus:border-primary"
                                                placeholder="7600"
                                                type="text"
                                                value={shippingInfo.postalCode}
                                                onChange={(e) =>
                                                    setShippingInfo((s) => ({
                                                        ...s,
                                                        postalCode: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setOpenStep(2)}
                                            className="px-4 h-10 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                        >
                                            Continuar
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </button>
                                    </div>
                                </div>
                            </Accordion>

                            {/* 2 Delivery */}
                            <Accordion
                                step={2}
                                title="Método de entrega"
                                openStep={openStep}
                                onOpen={() => setOpenStep(2)}
                            >
                                <div className="pt-4 pb-2 space-y-3">
                                    {Object.values(DELIVERY).map((opt) => {
                                        const checked = deliveryMethod === opt.key;
                                        return (
                                            <label
                                                key={opt.key}
                                                className={[
                                                    "flex items-center p-4 rounded-lg cursor-pointer transition-colors border",
                                                    checked
                                                        ? "border-primary bg-primary/5"
                                                        : "border-[#e6e0db] dark:border-[#3d2e1f] hover:bg-background-light dark:hover:bg-[#3d2e1f]",
                                                ].join(" ")}
                                            >
                                                <input
                                                    className="text-primary focus:ring-primary h-4 w-4"
                                                    name="delivery"
                                                    type="radio"
                                                    checked={checked}
                                                    onChange={() => setDeliveryMethod(opt.key)}
                                                />
                                                <div className="ml-4">
                                                    <p className="font-bold">{opt.title}</p>
                                                    <p className="text-sm text-[#8a7560] dark:text-[#a59280]">
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                                <span className="ml-auto font-bold">
                                                    {opt.price === 0
                                                        ? "Gratis"
                                                        : formatCurrency(opt.price, displayCurrency, locale)}
                                                </span>
                                            </label>
                                        );
                                    })}

                                    <div className="flex justify-between pt-2">
                                        <button
                                            onClick={() => setOpenStep(1)}
                                            className="px-4 h-10 rounded-lg bg-background-light dark:bg-[#3d2e1f] border border-[#e6e0db] dark:border-[#3d2e1f] font-bold hover:border-primary/50 transition-colors"
                                        >
                                            Volver
                                        </button>
                                        <button
                                            onClick={() => setOpenStep(3)}
                                            className="px-4 h-10 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                        >
                                            Continuar
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </button>
                                    </div>
                                </div>
                            </Accordion>

                            {/* 3 Payment */}
                            <Accordion
                                step={3}
                                title="Método de pago"
                                openStep={openStep}
                                onOpen={() => setOpenStep(3)}
                            >
                                <div className="pt-4 pb-2 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {paymentOptions.map((opt) => (
                                            <PayOption
                                                key={opt.key}
                                                active={paymentMethod === opt.key}
                                                onClick={() => setPaymentMethod(opt.key)}
                                                icon={opt.icon}
                                                label={opt.label}
                                                highlight={opt.highlight}
                                            />
                                        ))}
                                    </div>

                                    <div className="rounded-lg border border-[#e6e0db] dark:border-[#3d2e1f] p-4 text-sm text-[#8a7560] dark:text-[#a59280]">
                                        {paymentSummary}
                                    </div>

                                    {orderSuccess ? (
                                        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm space-y-2">
                                            <p className="font-bold">Pedido confirmado</p>
                                            <p>Metodo: {orderSuccess.paymentLabel || paymentLabel}</p>
                                            {orderSuccess.id ? (
                                                <p>ID: {orderSuccess.id}</p>
                                            ) : null}
                                            {orderSuccess.method === "whatsapp" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(orderSuccess.whatsappUrl, "_blank", "noopener,noreferrer")}
                                                    className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-bold"
                                                >
                                                    Abrir WhatsApp
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(orderSuccess.whatsappReceiptUrl || orderSuccess.whatsappUrl, "_blank", "noopener,noreferrer")}
                                                    className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-bold"
                                                >
                                                    Enviar comprobante por WhatsApp
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </Accordion>
                        </div>

                        {validationError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                                {validationError}
                            </div>
                        ) : null}
                        {checkoutError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                                {checkoutError}
                            </div>
                        ) : null}
                    </div>

                    {/* Right column */}
                    <div className="w-full lg:w-[400px]">
                        <div className="sticky top-24 bg-white dark:bg-[#2c221a] rounded-xl border border-[#e6e0db] dark:border-[#3d2e1f] p-6 shadow-sm">
                            <h3 className="text-lg font-bold mb-6">Resumen del pedido</h3>

                            {/* Items */}
                            <div className="space-y-4 mb-6">
                                {summaryItems.map((it) => (
                                    <div key={it.id} className="flex gap-4">
                                        <div className="size-16 rounded-lg bg-background-light dark:bg-[#3d2e1f] border border-[#e6e0db] dark:border-[#3d2e1f] overflow-hidden flex-shrink-0">
                                            <div
                                                className="w-full h-full bg-center bg-no-repeat bg-cover"
                                                style={{
                                                    backgroundImage: it.image
                                                        ? `url("${it.image}")`
                                                        : "none",
                                                }}
                                                role="img"
                                                aria-label={it.alt || it.name}
                                                title={it.alt || it.name}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold line-clamp-1">{it.name}</p>
                                            <p className="text-xs text-[#8a7560] dark:text-[#a59280]">
                                                Cant.: {it.qty}
                                            </p>
                                            <p className="text-sm font-bold mt-1">
                                                {formatCurrency(it.price * it.qty, displayCurrency, locale)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t border-[#e6e0db] dark:border-[#3d2e1f] pt-4 space-y-3">
                                <Line label="Subtotal" value={formatCurrency(subtotal, displayCurrency, locale)} />
                                <Line label="Envío" value={formatCurrency(shipping, displayCurrency, locale)} />
                                <Line label="Impuestos" value={formatCurrency(iva, displayCurrency, locale)} />
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-[#181411] dark:bg-black text-white flex justify-between items-center">
                                <span className="font-medium">Total</span>
                                <span className="text-2xl font-black">
                                    {formatCurrency(total, displayCurrency, locale)}
                                </span>
                            </div>

                            <button
                                onClick={handleCompletePurchase}
                                className="w-full mt-6 py-4 bg-primary text-white font-black text-lg rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                                disabled={creating || !items.length || !!validationError}
                            >
                                <span>{creating ? "Procesando..." : "Confirmar compra"}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </button>

                            <p className="text-[10px] text-center mt-4 text-[#8a7560] dark:text-[#a59280] uppercase tracking-wider">
                                Compra segura con Mercado Pago
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </StoreLayout>
    );
}

/* ---------- UI components ---------- */

function StepProgress({ openStep }) {
    const active = (n) => (openStep === n ? "text-primary" : "text-[#8a7560] dark:text-[#a59280]");

    return (
        <div className="grid grid-cols-[40px_1fr] gap-x-4 mb-4">
            {/* 1 */}
            <div className="flex flex-col items-center gap-1">
                <div className={active(1)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div className="w-[1.5px] bg-primary h-12" />
            </div>
            <div className="flex flex-col pt-1 pb-4">
                <p className="text-primary text-base font-bold">Envío y entrega</p>
                <p className="text-xs text-[#8a7560] dark:text-[#a59280]">
                    Completá la dirección o elegí retiro
                </p>
            </div>

            {/* 2 */}
            <div className="flex flex-col items-center gap-1">
                <div className={active(2)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                </div>
                <div className="w-[1.5px] bg-[#e6e0db] dark:bg-[#3d2e1f] h-12" />
            </div>
            <div className={`flex flex-col pt-1 pb-4 ${openStep >= 2 ? "" : "opacity-50"}`}>
                <p className="text-[#181411] dark:text-white text-base font-medium">
                    Método de pago
                </p>
                <p className="text-xs text-[#8a7560] dark:text-[#a59280]">
                    Seleccioná cómo querés pagar
                </p>
            </div>

            {/* 3 */}
            <div className="flex flex-col items-center gap-1">
                <div className={active(3)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
            </div>
            <div className={`flex flex-col pt-1 ${openStep >= 3 ? "" : "opacity-50"}`}>
                <p className="text-[#181411] dark:text-white text-base font-medium">Confirmación</p>
            </div>
        </div>
    );
}

function Accordion({ step, title, openStep, onOpen, children }) {
    const isOpen = openStep === step;

    return (
        <div
            className={[
                "flex flex-col rounded-xl border bg-white dark:bg-[#2c221a] px-6 py-4 group",
                "border-[#e6e0db] dark:border-[#3d2e1f]",
            ].join(" ")}
        >
            <button
                type="button"
                onClick={onOpen}
                className="flex w-full items-center justify-between gap-6 py-2"
            >
                <div className="flex items-center gap-3">
                    <span
                        className={[
                            "flex items-center justify-center size-6 rounded-full text-xs font-bold",
                            step === 1 && isOpen
                                ? "bg-primary text-white"
                                : isOpen
                                    ? "bg-primary text-white"
                                    : "bg-gray-200 dark:bg-[#3d2e1f] text-[#181411] dark:text-white",
                        ].join(" ")}
                    >
                        {step}
                    </span>
                    <p className="text-[#181411] dark:text-white text-lg font-bold">{title}</p>
                </div>

                <div className={`text-[#181411] dark:text-white transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </button>

            {isOpen ? children : null}
        </div>
    );
}

function PayOption({ active, onClick, icon, label, highlight }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-colors border",
                active
                    ? "border-primary bg-primary/5"
                    : "border-[#e6e0db] dark:border-[#3d2e1f] hover:border-primary hover:bg-primary/5",
            ].join(" ")}
        >
            <div
                className={[
                    "mb-2",
                    highlight ? "text-primary" : active ? "text-primary" : "text-[#8a7560]",
                ].join(" ")}
            >
                {icon}
            </div>
            <p className="text-xs font-bold text-center">{label}</p>
        </button>
    );
}

function Line({ label, value }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-[#8a7560] dark:text-[#a59280]">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
