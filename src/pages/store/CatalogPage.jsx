import React, { useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";

export default function CatalogPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [chips, setChips] = useState([
        { id: "inodoros", label: "Inodoros", active: true, type: "active" },
        { id: "grif", label: "Grifería", active: false, type: "dropdown" },
        { id: "tanques", label: "Tanques", active: false, type: "dropdown" },
        { id: "ofertas", label: "Ofertas", active: false, type: "deal" },
    ]);

    const products = useMemo(
        () => [
            {
                id: 1,
                name: "Inodoro Prusia",
                desc: "Línea premium con descarga dual de 3/6 litros. Diseño minimalista y elegante.",
                price: 185000,
                oldPrice: 210000,
                tag: "Bestseller",
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBQfYj1LC2KxJbrFc3JaW30fWNfBzOogedTliYaUerOGoeN9U0yPBa1Ly6cy0ifOVDGxRUhn39rTwm0asqqAroPQHLpdkrk_InCtirUQjGAQLvthIiB6EbRD71XqIoNekpixuF5np0LnNX1TY1UFuOELn9k9yOF23KgFYf1gCkfGPYdqRsN1a1b37xx0ItWp_yRvOdkSXB6CKK-dwrUA-uIDgTyng5s8My5tUJf8uzoYo7ri3rjEb8vDaZsLXgEsjTyaUDUDLV5wrk",
                alt: "Modern white toilet minimal bathroom background",
            },
            {
                id: 2,
                name: "Monocomando Cocina",
                desc: "Grifería de alta gama con rociador extraíble y acabado cromado brillante.",
                price: 54300,
                oldPrice: null,
                tag: "New",
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBVydqb7G5A_PT5CeAhoUo5VF2YXn8B2Hx2Y7DXvOB4gcZRtfBQHFy3IXPSOyox8_pIRZ01SgjOZeoV9ydnJd4VX1MFyFby5IDfG7nwbc2nvES8jZnphd62afdnYbb6Iaf8EhHngYqYD6DaMh8Y7GWRUftLJ-ruDjZNpatP8hNSQbK7lpweqdguNtcjdh8H7Qh_N1McVphjwD3cKtffejU4Ws_7fNBO0ICFabsb2GdV_B21lIn06nqXxOYw8NB228co8N3wupZ7HDc",
                alt: "Modern kitchen chrome faucet close up shot",
            },
            {
                id: 3,
                name: "Tanque de Agua 1000L",
                desc: "Capacidad de 1000 litros, tricapa con protección UV y antibacteriana.",
                price: 125750,
                oldPrice: null,
                tag: null,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuClfnnmyLSA1sheGaWQ5qYtxE0FF5qt12jk3aemf83GNBih8DrAxP333h6xoVymK2lFU8U24cWhKMczFknhA-0Grlo6BouODj-zkSJYahGjgDFAhCvYq_CdPJ6qf8USI4qWjTdBKGuPmXK6thIxNiVzbevOytIAWSgcxSvo5yQd3peEKnUsUA5ipDJrAubSfTLPPqHtK_07CVE4c8pIjXYITA0N02MfWaQVtHo7zU7YyVY-xODc39GfPmw_pebT52VXD-UGu7QlFfg",
                alt: "Large blue water storage tank outdoor setting",
            },
            {
                id: 4,
                name: "Bacha Apoyo Oval",
                desc: "Porcelana sanitaria blanca de alto brillo. Resistente a manchas y rayaduras.",
                price: 38900,
                oldPrice: null,
                tag: null,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAkClqY_wDhmuGwKW6w359XUqENuKc8aFogvTgQ_FDq87gKL2BNINH2x9v9gOdB770HKriEtiFBPB3KwankIDLcCQIqUFhdosfhhsOV2F03ExDPdQw8T6RKvZ7-TkLtHx4lrgXoWojWLnxjLYsqoyw297omFCNExuUp8_titY2UjKXJfbqDnqzOSqON-o5ZdJL0juGNioWdiLRE_dD9vylviYWQqdwwnb37AekTF5_A6oeoh3_WpvFW0lqNEU953ZUCrwPQNCqBrCc",
                alt: "Modern rectangular bathroom sink white porcelain",
            },
            {
                id: 5,
                name: "Termotanque 80L",
                desc: "Carga superior, eficiencia energética Clase A. Recuperación rápida.",
                price: 142100,
                oldPrice: null,
                tag: null,
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAlXkkpwr_PWpoPFtTyKilf50mPiNUUNTxKFKxAwbxkcU7-NnPDI38y2HbFpMLXvMRuDyakKbOgUipDfWv1bn1HyXWdlWY2C-vZYIGB51Ha6QW6Gn-R_Mk_QdkdkwGkvscCVbPpUWIPuZrAMLNc2-PzQFMILcet4lIIFzFRfJCyoGjBaFU8KTQ6lSg7547MNZtSsMvB0Y7ltoM1SaBarh45qKOdTWE5-MasI5F6fX8cm9YzR1L4TLh1emomJfA2p_2oYRwE69yW28w",
                alt: "Electric water heater vertical installation modern design",
            },
        ],
        []
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return products;
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
        );
    }, [products, search]);

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
                        <a
                            onClick={() => window.location.hash = '#'}
                            className="text-[#8a7560] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
                        >
                            Home
                        </a>
                        <span className="text-[#8a7560] text-sm font-medium leading-normal">/</span>
                        <a className="text-[#8a7560] text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">
                            Store
                        </a>
                        <span className="text-[#8a7560] text-sm font-medium leading-normal">/</span>
                        <span className="text-[#181411] dark:text-white text-sm font-medium leading-normal">
                            Bathroom &amp; Kitchen
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-between items-end gap-3 py-4 border-b border-[#e5e1de] dark:border-[#3d2f21] mb-6">
                        <div className="flex min-w-72 flex-col gap-1">
                            <p className="text-[#181411] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                Bathroom &amp; Kitchen Products
                            </p>
                            <p className="text-[#8a7560] text-base font-normal leading-normal">
                                Professional hardware collection for construction and renovation.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#f5f2f0] dark:bg-[#2c2116] text-[#181411] dark:text-white text-sm font-bold gap-2 border border-transparent hover:border-primary/50 transition-all">
                                <span className="material-symbols-outlined text-sm">
                                    dashboard_customize
                                </span>
                                <span>Edit Layout</span>
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
                                    Filters
                                </h1>
                                <span className="material-symbols-outlined text-[#8a7560] cursor-pointer hover:text-primary">
                                    tune
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                    <span className="material-symbols-outlined">category</span>
                                    <p className="text-sm font-bold">Categories</p>
                                </div>

                                {[
                                    { icon: "sell", label: "Brands" },
                                    { icon: "payments", label: "Price Range" },
                                    { icon: "texture", label: "Material" },
                                    { icon: "star", label: "Rating" },
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
                                    Apply Filters
                                </button>
                                <button className="w-full mt-2 text-[#8a7560] text-xs font-medium text-center hover:text-primary">
                                    Reset all filters
                                </button>
                            </div>
                        </div>

                        <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-primary font-bold text-lg mb-1">Theme Settings</p>
                                <p className="text-xs text-[#8a7560] dark:text-[#a08b76] mb-4">
                                    Customize the catalog appearance in one click.
                                </p>
                                <button className="text-xs font-bold uppercase tracking-wider text-[#181411] dark:text-white flex items-center gap-1 hover:underline">
                                    Open Visual Editor
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((p) => (
                                <CatalogProductCard key={p.id} product={p} />
                            ))}

                            <AddNewCard />
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center mt-12 gap-2">
                            <button
                                onClick={() => setPage((n) => Math.max(1, n - 1))}
                                className="flex items-center justify-center rounded-lg size-10 border border-[#e5e1de] dark:border-[#3d2f21] hover:bg-white dark:hover:bg-[#1a130c] text-[#8a7560]"
                                aria-label="Previous page"
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
                                aria-label="Next page"
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

function CatalogProductCard({ product }) {
    const { name, desc, price, oldPrice, tag, image, alt } = product;

    return (
        <div className="bg-white dark:bg-[#1a130c] rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div
                className="relative aspect-square overflow-hidden bg-[#f5f2f0] dark:bg-[#2c2116] cursor-pointer"
                onClick={() => window.location.hash = '#product'}
            >
                {/* En React, mejor img normal (como tenías) */}
                <img
                    alt={name}
                    title={alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={image}
                    loading="lazy"
                />

                {/* Hover actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/90 p-2 rounded-full shadow-sm text-[#181411] hover:bg-primary hover:text-white">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                    </button>
                    <button className="bg-white/90 p-2 rounded-full shadow-sm text-[#181411] hover:bg-primary hover:text-white">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                </div>

                {tag ? (
                    tag === "New" ? (
                        <div className="absolute top-3 left-3 bg-primary text-white px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                            New
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
                        <span className="text-primary font-black text-xl">{formatCurrency(price)}</span>
                        {oldPrice ? (
                            <span className="text-[#8a7560] text-xs line-through">{formatCurrency(oldPrice)}</span>
                        ) : null}
                    </div>

                    <button
                        onClick={() => window.location.hash = '#product'}
                        className="bg-primary text-white p-2 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
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
        <div className="bg-background-light dark:bg-[#2c2116] rounded-xl border-2 border-dashed border-[#e5e1de] dark:border-[#3d2f21] flex flex-col items-center justify-center p-8 group cursor-pointer hover:border-primary transition-all">
            <div className="size-16 rounded-full bg-[#f5f2f0] dark:bg-[#1a130c] flex items-center justify-center text-[#8a7560] group-hover:bg-primary group-hover:text-white transition-all mb-4">
                <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <p className="text-[#181411] dark:text-white font-bold">Add New Product</p>
            <p className="text-[#8a7560] text-sm text-center">
                Customize this grid by adding more items.
            </p>
        </div>
    );
}

function FooterCol({ title, links }) {
    return (
        <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#181411] dark:text-white">
                {title}
            </h4>
            {links.map((l) => (
                <a key={l} className="text-[#8a7560] text-sm hover:text-primary" href="#">
                    {l}
                </a>
            ))}
        </div>
    );
}
