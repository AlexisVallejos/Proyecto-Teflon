import React, { useState, useEffect, useMemo } from "react";
import PageBuilder from "../../components/PageBuilder";
import { HOME_PAGE_DATA } from "../../data/mock";
import StoreLayout from "../../components/layout/StoreLayout";
import { getApiBase, getTenantHeaders } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

import HeroSlider from "../../components/blocks/HeroSlider";
import FeaturedProducts from "../../components/blocks/FeaturedProducts";
import Services from "../../components/blocks/Services";

const FALLBACK_FEATURED = [
    {
        id: "demo-1",
        name: "Chrome Luxury Faucet",
        price: 120,
        badge: { text: "In Stock", className: "bg-green-500" },
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZI-CyV0a_MHtU0aC5uA0xV1K3o4Mx6s0hXSD-jAfFvKUvsnFez9VbpuhA2fqg6-nJIqEj0a5h-tTDm8ZsBhkns2TbUvo5ZTL8rlUrciw_DA9rIxZAaY1DjARxNdURIjk3PuU2Ary_6uW8b4hP0BLxU3Sxbe3uvYOBIrnhz13Go72OtqaMTN82gq5UvCnNK6t45bfoxvL7_BAqk77LiNIjLWf8pHzDPdgsLxC0jfGfhmNE4h91nii9vqbKVwelru79KaFIyEAkGGw",
        alt: "Polished chrome modern bathroom faucet",
        stock: 10,
    },
    {
        id: "demo-2",
        name: "Oak Bathroom Cabinet",
        price: 350,
        badge: { text: "Low Stock", className: "bg-orange-500" },
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-emIIyjxSLD1gTruwFOpPoZq5IFjF6Su7lEW2RuOeHjkmVFxMqCnldNcHYcVJzbmYw0rqpSChrjsPdHF_UpNwpqcwuG0QJuRpq5hcDNCXcopdU3Zj2s9jAEfn3WQzRJl9WTdS2QfZ8s9m5aFMD16ze5brLhUIKSYaNX2N9Z3zY8N-xMXRIibKXSlG30itHlK06AlrXw5SgpVGbaVZ1XQbmJ36hgzlPJPBXqSBDBNPu3g0BRvwbrHk6ZM_czkwlvjQiDi3BlQ2NAk",
        alt: "Wooden minimalist bathroom cabinet",
        stock: 2,
    },
];

const buildFeaturedCard = (product, index, isWholesale = false) => {
    const data = product.data || {};
    const rawImages = Array.isArray(data.images) ? data.images : [];
    const rawFirst = rawImages[0];
    const image =
        data.image ||
        data.image_url ||
        (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
        "https://via.placeholder.com/400";

    const inStock = typeof product.stock === "number" ? product.stock > 0 : true;
    const badge = !inStock ? { text: "Out of Stock", className: "bg-zinc-400" } : null;

    return {
        id: product.id,
        sku: product.sku || product.erp_id,
        name: product.name,
        price: isWholesale ? Number(product.price_wholesale || product.price) : Number(product.price || 0),
        badge: isWholesale && !!product.price_wholesale ? { text: "Wholesale", className: "bg-primary" } : badge,
        image,
        alt: data.image_alt || product.name || "Producto",
        stock: product.stock,
    };
};

export default function HomePage() {
    const { isWholesale } = useAuth();
    const [sections, setSections] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState(FALLBACK_FEATURED);

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

                // Load featured products independently to ensure we have fresh data
                const productsRes = await fetch(`${getApiBase()}/public/products?limit=4&featured=true`, {
                    headers: getTenantHeaders(),
                });
                if (productsRes.ok) {
                    const pData = await productsRes.json();
                    if (pData.items?.length) {
                        setFeaturedProducts(pData.items.map((it, idx) => buildFeaturedCard(it, idx, isWholesale)));
                    }
                }
            } catch (err) {
                console.error('Home dynamic load failed', err);
            }
        }
        loadHome();
    }, [isWholesale]);

    const finalSections = useMemo(() => {
        if (!sections) return null;
        return sections.map(s => {
            if (s.type === 'FeaturedProducts') {
                return { ...s, props: { ...s.props, products: featuredProducts } };
            }
            return s;
        });
    }, [sections, featuredProducts]);

    return (
        <StoreLayout>
            <div className="flex flex-col">
                {finalSections ? (
                    <PageBuilder sections={finalSections} />
                ) : (
                    <>
                        <HeroSlider />
                        <FeaturedProducts products={featuredProducts} />
                        <Services />
                    </>
                )}
            </div>
        </StoreLayout>
    );
}
