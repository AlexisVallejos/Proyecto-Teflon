import React, { useState, useMemo, useEffect } from "react";
import PageBuilder from "../../components/PageBuilder";
import { HOME_PAGE_DATA } from "../../data/mock";
import StoreLayout from "../../components/layout/StoreLayout";
import { getApiBase, getTenantHeaders } from "../../utils/api";

const FALLBACK_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCZI-CyV0a_MHtU0aC5uA0xV1K3o4Mx6s0hXSD-jAfFvKUvsnFez9VbpuhA2fqg6-nJIqEj0a5h-tTDm8ZsBhkns2TbUvo5ZTL8rlUrciw_DA9rIxZAaY1DjARxNdURIjk3PuU2Ary_6uW8b4hP0BLxU3Sxbe3uvYOBIrnhz13Go72OtqaMTN82gq5UvCnNK6t45bfoxvL7_BAqk77LiNIjLWf8pHzDPdgsLxC0jfGfhmNE4h91nii9vqbKVwelru79KaFIyEAkGGw",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-emIIyjxSLD1gTruwFOpPoZq5IFjF6Su7lEW2RuOeHjkmVFxMqCnldNcHYcVJzbmYw0rqpSChrjsPdHF_UpNwpqcwuG0QJuRpq5hcDNCXcopdU3Zj2s9jAEfn3WQzRJl9WTdS2QfZ8s9m5aFMD16ze5brLhUIKSYaNX2N9Z3zY8N-xMXRIibKXSlG30itHlK06AlrXw5SgpVGbaVZ1XQbmJ36hgzlPJPBXqSBDBNPu3g0BRvwbrHk6ZM_czkwlvjQiDi3BlQ2NAk",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAU9e5BzXTXy2-ONjFkT1f1pr16vl5t3bzDCN3vxB1wb90Z6mt2bO04ujC7t5UFT6GwZDuBR2B0gl2D8Gof0uQKH2-sCV1KJFaUH1G6dm7746jSUZDChhRrTIAf1joSYSZ4zwCAeN1QOOGIIHEfa_MB7ECGvG6tqBXMVdeeCHEZbxP_lNBdh_IJuY9VUql2d8vSPMbvYMAfa7rgb9wOk1c0qAatrua4fcedVJL4XxheqScNGLC_coHKF-vhKoV1VBZ-8KXaZ4-ibdU",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBWW2jOajHtqeEph58h7PAe319UVZAkLVC-4pp4FxPzXJREB62MW--mPq1DZ02MlVONb9e2mXwZzlsTQ2abNemV7nozlLe7HDM1GN2CXJ-oazr-AzW4AD-3xB_wbhCfTeQD74-VAVj1Q4dClIcGGit4rfLf_S8B7_4ZXmBIKcjvtXvAEbTRkCZdjH5gSrc4eZbqzohoASzpmDWDGvmE2ISYW4UXQ-VYiv7eRmHmorsM4HfSgWafndQ8t-x0oFT2NscKyEC5PGpajx8",
];

const buildFeaturedCard = (product, index) => {
    const data = product.data || {};
    const rawImages = Array.isArray(data.images) ? data.images : [];
    const rawFirst = rawImages[0];
    const image =
        data.image ||
        data.image_url ||
        (rawFirst && (rawFirst.url || rawFirst.src || rawFirst)) ||
        FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

    const inStock = typeof product.stock === "number" ? product.stock > 0 : true;
    const badge = inStock
        ? { text: "En stock", className: "bg-green-500" }
        : { text: "Sin stock", className: "bg-zinc-400" };

    return {
        id: product.id,
        sku: product.sku || product.erp_id,
        name: product.name,
        price: Number(product.price || 0),
        badge,
        image,
        alt: data.image_alt || product.name || "Producto",
        stock: product.stock,
    };
};

export default function HomePage() {
    const [sections, setSections] = useState(HOME_PAGE_DATA.sections);
    const [featuredProducts, setFeaturedProducts] = useState([]);

    useEffect(() => {
        let active = true;

        const loadSections = async () => {
            try {
                const response = await fetch(`${getApiBase()}/public/pages/home`, {
                    headers: getTenantHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`Home request failed: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                if (Array.isArray(data.sections) && data.sections.length) {
                    setSections(data.sections);
                }
            } catch (err) {
                console.error('No se pudieron cargar las secciones del home', err);
            }
        };

        loadSections();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadFeatured = async () => {
            try {
                const url = new URL(`${getApiBase()}/public/products`);
                url.searchParams.set("page", "1");
                url.searchParams.set("limit", "4");

                const response = await fetch(url.toString(), {
                    headers: getTenantHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`Featured request failed: ${response.status}`);
                }

                const data = await response.json();
                if (!active) return;

                const items = Array.isArray(data.items) ? data.items : [];
                setFeaturedProducts(items.map(buildFeaturedCard));
            } catch (err) {
                console.error('No se pudieron cargar los productos destacados', err);
                if (active) {
                    setFeaturedProducts([]);
                }
            }
        };

        loadFeatured();
        return () => {
            active = false;
        };
    }, []);

    const hydratedSections = useMemo(() => {
        return sections
            .filter((section) => section.enabled !== false)
            .map((section) => {
                if (section.type === 'FeaturedProducts') {
                    return {
                        ...section,
                        props: {
                            ...(section.props || {}),
                            products: featuredProducts,
                        },
                    };
                }
                return section;
            });
    }, [featuredProducts, sections]);

    return (
        <StoreLayout>
            <PageBuilder sections={hydratedSections} />
        </StoreLayout>
    );
}
