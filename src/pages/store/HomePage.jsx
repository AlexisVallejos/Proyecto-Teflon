import React, { useState, useMemo } from "react";
import PageBuilder from "../../components/PageBuilder";
import { HOME_PAGE_DATA } from "../../data/mock";
import StoreLayout from "../../components/layout/StoreLayout";

export default function HomePage() {
    const [search, setSearch] = useState("");



    const products = useMemo(
        () => [
            {
                id: 1,
                name: "Chrome Luxury Faucet",
                price: "$120.00",
                badge: { text: "In Stock", className: "bg-green-500" },
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCZI-CyV0a_MHtU0aC5uA0xV1K3o4Mx6s0hXSD-jAfFvKUvsnFez9VbpuhA2fqg6-nJIqEj0a5h-tTDm8ZsBhkns2TbUvo5ZTL8rlUrciw_DA9rIxZAaY1DjARxNdURIjk3PuU2Ary_6uW8b4hP0BLxU3Sxbe3uvYOBIrnhz13Go72OtqaMTN82gq5UvCnNK6t45bfoxvL7_BAqk77LiNIjLWf8pHzDPdgsLxC0jfGfhmNE4h91nii9vqbKVwelru79KaFIyEAkGGw",
                alt: "Polished chrome modern bathroom faucet",
            },
            {
                id: 2,
                name: "Oak Bathroom Cabinet",
                price: "$350.00",
                badge: { text: "Low Stock", className: "bg-orange-500" },
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-emIIyjxSLD1gTruwFOpPoZq5IFjF6Su7lEW2RuOeHjkmVFxMqCnldNcHYcVJzbmYw0rqpSChrjsPdHF_UpNwpqcwuG0QJuRpq5hcDNCXcopdU3Zj2s9jAEfn3WQzRJl9WTdS2QfZ8s9m5aFMD16ze5brLhUIKSYaNX2N9Z3zY8N-xMXRIibKXSlG30itHlK06AlrXw5SgpVGbaVZ1XQbmJ36hgzlPJPBXqSBDBNPu3g0BRvwbrHk6ZM_czkwlvjQiDi3BlQ2NAk",
                alt: "Wooden minimalist bathroom cabinet",
            },
            {
                id: 3,
                name: "Sanitary Elite Kit",
                price: "$280.00",
                badge: { text: "In Stock", className: "bg-green-500" },
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAU9e5BzXTXy2-ONjFkT1f1pr16vl5t3bzDCN3vxB1wb90Z6mt2bO04ujC7t5UFT6GwZDuBR2B0gl2D8Gof0uQKH2-sCV1KJFaUH1G6dm7746jSUZDChhRrTIAf1joSYSZ4zwCAeN1QOOGIIHEfa_MB7ECGvG6tqBXMVdeeCHEZbxP_lNBdh_IJuY9VUql2d8vSPMbvYMAfa7rgb9wOk1c0qAatrua4fcedVJL4XxheqScNGLC_coHKF-vhKoV1VBZ-8KXaZ4-ibdU",
                alt: "Modern ceramic white toilet set",
            },
            {
                id: 4,
                name: "Rainfall Shower Set",
                price: "$150.00",
                badge: { text: "New Arrival", className: "bg-primary" },
                image:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBWW2jOajHtqeEph58h7PAe319UVZAkLVC-4pp4FxPzXJREB62MW--mPq1DZ02MlVONb9e2mXwZzlsTQ2abNemV7nozlLe7HDM1GN2CXJ-oazr-AzW4AD-3xB_wbhCfTeQD74-VAVj1Q4dClIcGGit4rfLf_S8B7_4ZXmBIKcjvtXvAEbTRkCZdjH5gSrc4eZbqzohoASzpmDWDGvmE2ISYW4UXQ-VYiv7eRmHmorsM4HfSgWafndQ8t-x0oFT2NscKyEC5PGpajx8",
                alt: "Stainless steel rainfall shower head",
            },
        ],
        []
    );

    const filteredProducts = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) => p.name.toLowerCase().includes(q));
    }, [products, search]);

    const sections = useMemo(() => {
        return HOME_PAGE_DATA.sections.map(section => {
            // Hydrate specific sections with dynamic data
            if (section.type === 'FeaturedProducts') {
                return {
                    ...section,
                    props: {
                        ...section.props,
                        products: filteredProducts
                    }
                };
            }
            return section;
        });
    }, [filteredProducts]);

    return (
        <StoreLayout>
            <PageBuilder sections={sections} />
        </StoreLayout>
    );
}


