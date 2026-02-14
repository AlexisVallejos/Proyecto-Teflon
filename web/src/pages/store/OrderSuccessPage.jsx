import React, { useEffect, useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { navigate } from "../../utils/navigation";

export default function OrderSuccessPage() {
    const [order, setOrder] = useState(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("teflon_last_order");
            if (raw) {
                setOrder(JSON.parse(raw));
            }
        } catch (err) {
            console.warn("No se pudo cargar el pedido", err);
        }
    }, []);

    const title = useMemo(() => {
        if (order?.method === "whatsapp") return "Pedido exitoso";
        if (order?.method === "mp") return "Pedido confirmado";
        return "Pedido confirmado";
    }, [order]);

    const subtitle = useMemo(() => {
        if (order?.method === "whatsapp") {
            return "Proseguiremos por WhatsApp. Gracias por tu compra, estamos armando tu pedido.";
        }
        return "Gracias por tu compra. Si corresponde, envia el comprobante por WhatsApp.";
    }, [order]);

    const items = Array.isArray(order?.items) ? order.items : [];

    return (
        <StoreLayout>
            <main className="max-w-[960px] mx-auto w-full px-4 md:px-10 py-16">
                <div className="bg-white dark:bg-[#1a130c] rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] p-8 text-center space-y-4">
                    <div className="mx-auto size-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#181411] dark:text-white">
                        {title}
                    </h1>
                    <p className="text-[#8a7560]">
                        {subtitle}
                    </p>

                    {order?.id ? (
                        <div className="text-sm text-[#181411] dark:text-white font-semibold">
                            ID de pedido: {order.id}
                        </div>
                    ) : null}

                    {order?.deliveryLabel ? (
                        <div className="text-sm text-[#8a7560]">
                            Entrega: {order.deliveryLabel}
                        </div>
                    ) : null}

                    {items.length ? (
                        <div className="text-left mt-6">
                            <p className="text-sm font-bold text-[#181411] dark:text-white mb-2">
                                Productos
                            </p>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between text-sm border-b border-[#f0ebe7] dark:border-[#3d2f21] pb-2"
                                    >
                                        <span className="text-[#181411] dark:text-white">
                                            {item.name}
                                        </span>
                                        <span className="text-[#8a7560]">
                                            SKU {item.sku} x{item.qty}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-col md:flex-row gap-3 justify-center pt-4">
                    {order?.whatsappUrl ? (
                        <button
                            type="button"
                            onClick={() => {
                                const url = order.method === "whatsapp"
                                    ? order.whatsappUrl
                                    : order.whatsappReceiptUrl || order.whatsappUrl;
                                window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            className="px-5 h-11 rounded-lg bg-green-600 text-white font-bold"
                        >
                            Continuar por WhatsApp
                        </button>
                    ) : null}
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="px-5 h-11 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] text-[#181411] dark:text-white font-bold"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </main>
        </StoreLayout>
    );
}
