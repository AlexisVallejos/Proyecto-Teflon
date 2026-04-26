import React, { useState, useEffect, useMemo } from "react";
import PageBuilder from "../../components/PageBuilder";
import StoreLayout from "../../components/layout/StoreLayout";
import { getApiBase, getAuthHeaders, getTenantHeaders } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { createPlaceholderImage } from "../../utils/productImage";

import HeroSlider from "../../components/blocks/HeroSlider";
import BrandMarquee from "../../components/blocks/BrandMarquee";
import FeaturedProducts from "../../components/blocks/FeaturedProducts";
import Services from "../../components/blocks/Services";

const buildFeaturedCard = (product, index, isWholesale = false) => {
    const data = product.data || {};
    const rawImages = Array.isArray(data.images) ? data.images : [];
    const rawFirst = rawImages[0];
    const image =
        data.image ||
        data.image_url ||
        (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
        createPlaceholderImage({ label: "Producto", width: 400, height: 400 });

    const inStock = typeof product.stock === "number" ? product.stock > 0 : true;
    const badge = !inStock ? { text: "Sin stock", className: "bg-zinc-400" } : null;

    return {
        id: product.id,
        sku: product.sku || product.erp_id,
        name: product.name,
        shortDescription:
            product.short_description ||
            data.short_description ||
            data.shortDescription ||
            product.description ||
            "",
        longDescription:
            product.long_description ||
            data.long_description ||
            data.longDescription ||
            product.description ||
            "",
        price: isWholesale ? Number(product.price_wholesale || product.price) : Number(product.price || 0),
        originalPrice: isWholesale && !!product.price_wholesale ? Number(product.price || 0) : null,
        badge: isWholesale && !!product.price_wholesale ? { text: "Mayorista", className: "bg-primary" } : badge,
        image,
        alt: data.image_alt || product.name || "Producto",
        stock: product.stock,
    };
};

export default function HomePage() {
    const { isWholesale } = useAuth();
    const [sections, setSections] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredLoaded, setFeaturedLoaded] = useState(false);

    useEffect(() => {
        async function loadHome() {
            try {
                const response = await fetch(`${getApiBase()}/public/pages/home`, {
                    headers: getTenantHeaders(),
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.sections && data.sections.length) {
                        setSections(data.sections);
                    }
                }

                const productsRes = await fetch(`${getApiBase()}/public/products?limit=4&featured=true`, {
                    headers: { ...getTenantHeaders(), ...getAuthHeaders() },
                });
                if (productsRes.ok) {
                    const pData = await productsRes.json();
                    if (pData.items?.length) {
                        setFeaturedProducts(pData.items.map((it, idx) => buildFeaturedCard(it, idx, isWholesale)));
                    }
                }
            } catch (err) {
                console.error('No se pudo cargar la pagina de inicio', err);
            } finally {
                setFeaturedLoaded(true);
            }
        }
        loadHome();
    }, [isWholesale]);

    const finalSections = useMemo(() => {
        if (!sections) return null;
        return sections
            .filter((section) => section.type !== 'FeaturedProducts' || (featuredLoaded && featuredProducts.length > 0))
            .map((section) => {
                if (section.type === 'FeaturedProducts') {
                    return { ...section, props: { ...section.props, products: featuredProducts } };
                }
                return section;
            });
    }, [sections, featuredLoaded, featuredProducts]);

    return (
        <StoreLayout>
            <div className="flex flex-col">
                {finalSections ? (
                    <PageBuilder sections={finalSections} />
                ) : (
                    <>
                        <HeroSlider 
                            title="Únete a nuestro exclusivo Club de Ahorro"
                            subtitle="Participá de sorteos mensuales, adjudicá vehículos y ahorrá con nuestro consorcio premium. Transparencia y confianza garantizada."
                            tag="Nuevos grupos abiertos"
                            primaryButton={{ label: "Unirme ahora", link: "/signup" }}
                            secondaryButton={{ label: "Mi Portal", link: "/consorcio" }}
                        />
                        <section id="marcas" className="bg-[#0f172a] py-8">
                            <BrandMarquee />
                        </section>
                        {featuredLoaded && featuredProducts.length > 0 ? (
                            <section id="ofertas" className="bg-[#0B101E] py-12">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-black text-white">Vehículos Disponibles para Adjudicación</h2>
                                    <p className="text-[#d4af37] mt-2">Modelos que puedes llevarte este mes</p>
                                </div>
                                <FeaturedProducts products={featuredProducts} />
                            </section>
                        ) : null}
                        <section id="sobre-nosotros" className="bg-[#0f172a] py-12 text-white border-t border-white/5">
                            <div className="max-w-6xl mx-auto px-4 text-center">
                                <h2 className="text-3xl font-black mb-8">¿Por qué elegir nuestro Consorcio?</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="glass-premium p-8 rounded-2xl">
                                        <h3 className="text-xl font-bold text-[#d4af37] mb-2">Cuotas Fijas</h3>
                                        <p className="text-white/70">Planificá tus pagos sin sorpresas ni intereses ocultos.</p>
                                    </div>
                                    <div className="glass-premium p-8 rounded-2xl">
                                        <h3 className="text-xl font-bold text-[#d4af37] mb-2">Sorteos Mensuales</h3>
                                        <p className="text-white/70">Posibilidad de adjudicación anticipada en cada sorteo.</p>
                                    </div>
                                    <div className="glass-premium p-8 rounded-2xl">
                                        <h3 className="text-xl font-bold text-[#d4af37] mb-2">Gestión Transparente</h3>
                                        <p className="text-white/70">Controlá tus cuotas pagadas y tu historial desde tu portal privado.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </StoreLayout>
    );
}
