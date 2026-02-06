import React, { useMemo, useState } from "react";
import StoreLayout from "../../components/layout/StoreLayout";
import { formatCurrency } from "../../utils/format";

export default function ProductDetail() {
    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState("description");

    const images = useMemo(
        () => [
            {
                id: "main",
                alt: "Modern high-end ceramic white toilet in minimalist bathroom",
                url: `https://lh3.googleusercontent.com/aida-public/AB6AXuDv8YzTCR4gX6zFam1LwuH5HJDAvE7aoXu0L9TL3JEOIcOHOTOo9gR_f4s9-fMVH0hYykw7F1_qJR2tnBpxcugeFAX1ZL0xHfBmmOniSI2_EoVFQBT_xRfiRBjHjaC17PYofIUT_SN9UIb0LIfiokaioKAtueDer-u8wQFqGvO6ynAkWb3h5nY4Ky3WNKUcPhQwwwhWEAp4pT0mPjay6W_ZpDUjHJJvvuNKQCYqeDg7kLZfBX1Z17RERUu1m8P2FMBpPzsIadDuEuo`,
            },
            {
                id: "thumb-1",
                alt: "Main view of porcelain toilet set",
                url: `https://lh3.googleusercontent.com/aida-public/AB6AXuAot3vJROZtP44PaIZ0wb_jJjqR0WKvwN53AyUXh2SIs5lPwb5Yg7tGpgHDRPAdzzSJeScEyxjJvySYuticwqBuCNoXGB3tZ4Mct2DmSl8qALnIwTUsFttZxIdLY4J_z3IIP_cT807TmSub1WTHsTUnvxXqRNgpYcKTnB4iaslPulsdBzJjrKtPQKpjb3HvDVJhIHNIAjm5o_Sc1IF2M4MH1VCcu3zwmjxJLIzGN0SJSUKoGhmrYpB-0Dfl9J2-N-gFX76D0vO_YAs`,
            },
            {
                id: "thumb-2",
                alt: "Close up of flushing mechanism",
                url: `https://lh3.googleusercontent.com/aida-public/AB6AXuAfZANt4wnettS9zM29Iu_Ou5J0oBh7sIDLGOG8nhRyoKdDucptDU4R4Uy_tWIKUeKer1UynWLegSrymoCgaz5uZX1IxZ2SnhTeAwbf-oTAvGQFPBNtz7h6msgH1RziEahlJ5jrd_9j2nYYX1_uvWx0JW3VTOZG63Il1k8vkz6WwZxZpzE3wFy9OqC5XFCp0b341k-4vyxGT5iu_ApOGulnpeiUUpa4G8XSbMxeKJu52IGjnRlLU0VizCu_wjNCAqBZPoePiG8eHQk`,
            },
            {
                id: "thumb-3",
                alt: "Side profile of the ceramic base",
                url: `https://lh3.googleusercontent.com/aida-public/AB6AXuAi9SmBaQmnYzStL8Gj4LTvnSZ7g224X01bDGcuTtFUMgpyfvf0QXmV7U1Yuig9YznlmPgrW-TxpMiriX27oI8fnTekPNxR8VK_wv6lbSOTp9ISGejQRMoujHtzd4fBr-_ik0srmNKh3RQg49L7uuZMhsujGdGlNvjOHduVVB6VXGo1n_iHJ-aF-LviHagqS7Is9ybIIo2IaN1o62VEm8zOltEq82ctJSCTA9a2ritultjetB72IjhfQ2yGoE0c2REJjktmiN27LgQ`,
            },
        ],
        []
    );

    const [activeImage, setActiveImage] = useState(images[0]);

    const inc = () => setQty((q) => Math.min(999, q + 1));
    const dec = () => setQty((q) => Math.max(1, q - 1));

    return (
        <StoreLayout>
            <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <nav className="flex flex-wrap gap-2 mb-6 items-center">
                    <a
                        className="text-[#8a7560] text-sm font-medium hover:text-primary"
                        href="#"
                    >
                        Home
                    </a>
                    <span className="material-symbols-outlined text-sm text-[#8a7560]">
                        chevron_right
                    </span>
                    <a
                        className="text-[#8a7560] text-sm font-medium hover:text-primary"
                        href="#"
                    >
                        Sanitary Ware
                    </a>
                    <span className="material-symbols-outlined text-sm text-[#8a7560]">
                        chevron_right
                    </span>
                    <span className="text-[#181411] dark:text-white text-sm font-medium">
                        Deluxe Porcelain Toilet Set
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
                                aria-label="Edit image"
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
                                        aria-label={`Select image ${idx + 1}`}
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
                                aria-label="Add photo"
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
                                    Luxury Collection
                                </span>
                                <span
                                    className="material-symbols-outlined text-zinc-400 cursor-pointer hover:text-zinc-600"
                                    title="Edit"
                                >
                                    edit_note
                                </span>
                            </div>

                            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#181411] dark:text-white">
                                Deluxe Porcelain Toilet Set - Pure White
                            </h1>
                            <p className="text-[#8a7560] text-sm font-normal">
                                SKU: SET-BATH-001
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">
                                    check_circle
                                </span>
                                In Stock
                            </div>
                            <div className="text-[#8a7560] text-sm font-normal">
                                Ready for delivery in 24-48h
                            </div>
                        </div>

                        <div className="py-4 border-y border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                            <span className="text-sm font-medium text-[#8a7560]">
                                Unit Price
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-black dark:text-white">
                                    {formatCurrency(459)}
                                </span>
                                <span className="text-lg text-zinc-400 line-through">
                                    {formatCurrency(580)}
                                </span>
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
                                        aria-label="Decrease quantity"
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
                                        aria-label="Increase quantity"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => window.location.hash = '#cart'}
                                    className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">
                                        shopping_cart_checkout
                                    </span>
                                    Add to Cart
                                </button>
                            </div>

                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 py-3 px-8 border border-zinc-300 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <span className="material-symbols-outlined">favorite</span>
                                Add to Wishlist
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <span className="material-symbols-outlined text-primary">
                                    local_shipping
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Free Shipping</span>
                                    <span className="text-[10px] text-zinc-500">
                                        On orders over $999
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <span className="material-symbols-outlined text-primary">
                                    verified_user
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">5 Year Warranty</span>
                                    <span className="text-[10px] text-zinc-500">
                                        Ceramic &amp; Mechanism
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
                            Description
                        </TabButton>

                        <TabButton
                            active={activeTab === "specs"}
                            onClick={() => setActiveTab("specs")}
                            rightIcon="edit"
                        >
                            Technical Specs
                        </TabButton>

                        <TabButton
                            active={activeTab === "shipping"}
                            onClick={() => setActiveTab("shipping")}
                        >
                            Shipping Info
                        </TabButton>

                        <TabButton
                            active={activeTab === "reviews"}
                            onClick={() => setActiveTab("reviews")}
                        >
                            Reviews (12)
                        </TabButton>
                    </div>

                    <div className="p-8">
                        {activeTab === "description" && (
                            <div className="max-w-3xl flex flex-col gap-6">
                                <div className="relative group">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        Elevate Your Bathroom Experience
                                        <span className="material-symbols-outlined text-zinc-300 opacity-0 group-hover:opacity-100 cursor-pointer">
                                            edit
                                        </span>
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Our Deluxe Porcelain Toilet Set combines modern aesthetics
                                        with high-performance engineering. Crafted from premium
                                        grade-A ceramic, this one-piece design offers a sleek,
                                        seamless look that's easy to clean and maintains its
                                        brilliant white finish for decades.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="flex flex-col gap-4">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">
                                                eco
                                            </span>
                                            Eco-Friendly Flushing
                                        </h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Features a dual-flush system (0.8/1.28 GPF) that saves
                                            up to 15,000 gallons of water per year without
                                            compromising on power.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">
                                                cleaning_services
                                            </span>
                                            Easy-Clean Coating
                                        </h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Nanotech glazing prevents bacteria growth and staining,
                                            making maintenance a breeze and reducing the need for
                                            harsh chemicals.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                                    <h3 className="text-xl font-bold mb-4">Specifications</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <Spec label="Material" value="Vitreous China" />
                                        <Spec label="Dimensions" value={`28" x 15" x 29"`} />
                                        <Spec label="Finish" value="Glossy White" />
                                        <Spec label="Flushing" value="Dual Tornado" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "specs" && (
                            <div className="max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">Technical Specs</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    (Mock) Acá iría la tabla completa de specs técnicas.
                                    Podés reemplazarlo por tu componente de specs real.
                                </p>
                            </div>
                        )}

                        {activeTab === "shipping" && (
                            <div className="max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">Shipping Info</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    (Mock) Info de envíos, retiro en sucursal, tiempos, etc.
                                </p>
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="max-w-3xl">
                                <h3 className="text-xl font-bold mb-4">Reviews</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    (Mock) Reviews del producto (12).
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
