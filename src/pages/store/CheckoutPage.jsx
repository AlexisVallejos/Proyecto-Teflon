import React, { useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";

export default function CheckoutPage() {

    // Mock items (los podés traer del carrito real)
    const [items] = useState([
        {
            id: "FV-ARIZONA",
            name: "Chrome Faucet FV Arizona",
            qty: 1,
            price: 45000,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuB4G6ttvkeHKzUkmhgM3qcXPz92YR4-fDaon4Z2QM9AYMkU_HLBW3g0hC-KW6tJfgJ0dI_65LpOdTaQI7-gjZxNhSGs7sRNLn53uN1xfhIbsCVDfV6HxcXaXTuOSMUkwlTCZdS9xesKogmljWq-h2e-EZP2oir3P3yz4XUA3OyXGkw8Ss8mwmzCft13Tt75PtWjzRDnr5hXsHzdT-XjFeM63YJD4ccPwkM9NYNarMgeZrrQaMyUneb_W_ZN3itCfNEyTF5BcSZDvM4",
            alt: "Chrome bathroom faucet",
        },
        {
            id: "PVC-110-4M",
            name: "PVC Pipe 110mm x 4m",
            qty: 2,
            price: 12500,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDP1SjRWdl-gWajRD-mrLIAM3GnJulsEPysk36aC_u6A_LFT4hNyAVydjp8eVfHjgC97diQR2TSXGoqvVWamHSs1bi8EM8NA_Y6ScB_gm4vg0GJCENkYiMiGTqBFxzWbGYNoheWdK_PnJ5o_gZbUaArEnb3w3fRaQWcdB9PZmKVo18I0IYber49lUH4Rcf67mb5NwtEkKN66J-Oofns1-WRX_14RECwj5yO5fhlx0x24aWK9Lc_GaAEwqEHSNmE0QK5cU96B0E9SaA",
            alt: "PVC pipe 110mm",
        },
    ]);

    // Form state
    const [shippingInfo, setShippingInfo] = useState({
        fullAddress: "",
        city: "",
        postalCode: "",
    });

    const DELIVERY = {
        home: {
            key: "home",
            title: "Home Delivery",
            desc: "Delivery within 24-48 hours in Mar del Plata",
            price: 1500,
        },
        mdp: {
            key: "mdp",
            title: "Pickup: Store Mar del Plata",
            desc: "Ready in 2 hours. Av. Independencia 1234",
            price: 0,
        },
        necochea: {
            key: "necochea",
            title: "Pickup: Store Necochea",
            desc: "Ready in 4 hours. Calle 64 Nro 3456",
            price: 0,
        },
    };

    const [deliveryMethod, setDeliveryMethod] = useState("home");

    const [paymentMethod, setPaymentMethod] = useState("card"); // card | bank | mp

    // Accordion open
    const [openStep, setOpenStep] = useState(1); // 1..3

    const subtotal = useMemo(
        () => items.reduce((acc, it) => acc + it.price * it.qty, 0),
        [items]
    );

    const shipping = useMemo(() => DELIVERY[deliveryMethod].price, [deliveryMethod]);

    const iva = useMemo(() => (subtotal + shipping) * 0.21, [subtotal, shipping]);
    const total = subtotal + shipping + iva;

    const handleCompletePurchase = () => {
        // Aca conectarías tu API / MP / Stripe etc.
        alert(
            `Compra lista (mock)\n\nDelivery: ${DELIVERY[deliveryMethod].title}\nPago: ${paymentMethod}\nTotal: ${formatCurrency(
                total
            )}`
        );
    };

    return (
        <StoreLayout>
            <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 pb-4">
                    <a
                        className="text-[#8a7560] text-sm font-medium hover:text-primary cursor-pointer"
                        onClick={() => window.location.hash = '#'}
                    >
                        Home
                    </a>
                    <span className="text-[#8a7560] text-sm font-medium">
                        /
                    </span>
                    <a
                        className="text-[#8a7560] text-sm font-medium hover:text-primary"
                        href="#"
                    >
                        Cart
                    </a>
                    <span className="text-[#8a7560] text-sm font-medium">
                        /
                    </span>
                    <span className="text-[#181411] dark:text-white text-sm font-medium">
                        Checkout
                    </span>
                </div>

                {/* Heading */}
                <div className="pb-8">
                    <h1 className="text-[#181411] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        Checkout
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
                                title="Shipping Information"
                                openStep={openStep}
                                onOpen={() => setOpenStep(1)}
                            >
                                <div className="pt-4 pb-2 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                Full Address
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
                                                City
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
                                                Postal Code
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
                                            Continue
                                            <span className="material-symbols-outlined text-base">
                                                arrow_forward
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </Accordion>

                            {/* 2 Delivery */}
                            <Accordion
                                step={2}
                                title="Delivery Method"
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
                                                    {opt.price === 0 ? "Free" : formatCurrency(opt.price)}
                                                </span>
                                            </label>
                                        );
                                    })}

                                    <div className="flex justify-between pt-2">
                                        <button
                                            onClick={() => setOpenStep(1)}
                                            className="px-4 h-10 rounded-lg bg-background-light dark:bg-[#3d2e1f] border border-[#e6e0db] dark:border-[#3d2e1f] font-bold hover:border-primary/50 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => setOpenStep(3)}
                                            className="px-4 h-10 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                        >
                                            Continue
                                            <span className="material-symbols-outlined text-base">
                                                arrow_forward
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </Accordion>

                            {/* 3 Payment */}
                            <Accordion
                                step={3}
                                title="Payment Method"
                                openStep={openStep}
                                onOpen={() => setOpenStep(3)}
                            >
                                <div className="pt-4 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <PayOption
                                        active={paymentMethod === "card"}
                                        onClick={() => setPaymentMethod("card")}
                                        icon="credit_card"
                                        label="Credit Card"
                                    />
                                    <PayOption
                                        active={paymentMethod === "bank"}
                                        onClick={() => setPaymentMethod("bank")}
                                        icon="account_balance"
                                        label="Bank Transfer"
                                    />
                                    <PayOption
                                        active={paymentMethod === "mp"}
                                        onClick={() => setPaymentMethod("mp")}
                                        customIcon={
                                            <div className="h-[30px] w-[30px] bg-sky-500 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-white font-bold text-[10px]">MP</span>
                                            </div>
                                        }
                                        label="Mercado Pago"
                                    />
                                </div>
                            </Accordion>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="w-full lg:w-[400px]">
                        <div className="sticky top-24 bg-white dark:bg-[#2c221a] rounded-xl border border-[#e6e0db] dark:border-[#3d2e1f] p-6 shadow-sm">
                            <h3 className="text-lg font-bold mb-6">Order Summary</h3>

                            {/* Items */}
                            <div className="space-y-4 mb-6">
                                {items.map((it) => (
                                    <div key={it.id} className="flex gap-4">
                                        <div className="size-16 rounded-lg bg-background-light dark:bg-[#3d2e1f] border border-[#e6e0db] dark:border-[#3d2e1f] overflow-hidden flex-shrink-0">
                                            <img
                                                className="w-full h-full object-cover"
                                                src={it.image}
                                                alt={it.alt}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold line-clamp-1">{it.name}</p>
                                            <p className="text-xs text-[#8a7560] dark:text-[#a59280]">
                                                Qty: {it.qty}
                                            </p>
                                            <p className="text-sm font-bold mt-1">
                                                {formatCurrency(it.price * it.qty)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t border-[#e6e0db] dark:border-[#3d2e1f] pt-4 space-y-3">
                                <Line label="Subtotal" value={formatCurrency(subtotal)} />
                                <Line label="Shipping" value={formatCurrency(shipping)} />
                                <Line label="Taxes (IVA 21%)" value={formatCurrency(iva)} />
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-[#181411] dark:bg-black text-white flex justify-between items-center">
                                <span className="font-medium">Total</span>
                                <span className="text-2xl font-black">{formatCurrency(total)}</span>
                            </div>

                            <button
                                onClick={handleCompletePurchase}
                                className="w-full mt-6 py-4 bg-primary text-white font-black text-lg rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
                            >
                                <span>Complete Purchase</span>
                                <span className="material-symbols-outlined">lock</span>
                            </button>

                            <p className="text-[10px] text-center mt-4 text-[#8a7560] dark:text-[#a59280] uppercase tracking-wider">
                                Secure checkout powered by Sanitarios El Teflon
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
                    <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <div className="w-[1.5px] bg-primary h-12" />
            </div>
            <div className="flex flex-col pt-1 pb-4">
                <p className="text-primary text-base font-bold">Shipping &amp; Delivery</p>
                <p className="text-xs text-[#8a7560] dark:text-[#a59280]">
                    Provide address or select store pickup
                </p>
            </div>

            {/* 2 */}
            <div className="flex flex-col items-center gap-1">
                <div className={active(2)}>
                    <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="w-[1.5px] bg-[#e6e0db] dark:bg-[#3d2e1f] h-12" />
            </div>
            <div className={`flex flex-col pt-1 pb-4 ${openStep >= 2 ? "" : "opacity-50"}`}>
                <p className="text-[#181411] dark:text-white text-base font-medium">
                    Payment Method
                </p>
                <p className="text-xs text-[#8a7560] dark:text-[#a59280]">
                    Select how you'd like to pay
                </p>
            </div>

            {/* 3 */}
            <div className="flex flex-col items-center gap-1">
                <div className={active(3)}>
                    <span className="material-symbols-outlined">check_circle</span>
                </div>
            </div>
            <div className={`flex flex-col pt-1 ${openStep >= 3 ? "" : "opacity-50"}`}>
                <p className="text-[#181411] dark:text-white text-base font-medium">Confirmation</p>
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
                    <span className="material-symbols-outlined">expand_more</span>
                </div>
            </button>

            {isOpen ? children : null}
        </div>
    );
}

function PayOption({ active, onClick, icon, label, customIcon }) {
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
            {customIcon ? (
                customIcon
            ) : (
                <span
                    className={[
                        "material-symbols-outlined text-3xl mb-2",
                        active ? "text-primary" : "text-[#8a7560]",
                    ].join(" ")}
                >
                    {icon}
                </span>
            )}
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
