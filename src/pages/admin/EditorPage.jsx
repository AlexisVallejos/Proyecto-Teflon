import React, { useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import PageBuilder from '../../components/PageBuilder';
import { HOME_PAGE_DATA } from '../../data/mock';

export default function EditorPage() {
    // Simulación de bloques (en el editor real vendrá de un formulario)
    const sections = useMemo(() => {
        return HOME_PAGE_DATA.sections.map(section => {
            if (section.type === 'FeaturedProducts') {
                return {
                    ...section,
                    props: {
                        ...section.props,
                        products: [
                            {
                                id: 1,
                                name: "Producto demo",
                                price: 9999,
                                badge: { text: "Vista", className: "bg-blue-500" },
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZI-CyV0a_MHtU0aC5uA0xV1K3o4Mx6s0hXSD-jAfFvKUvsnFez9VbpuhA2fqg6-nJIqEj0a5h-tTDm8ZsBhkns2TbUvo5ZTL8rlUrciw_DA9rIxZAaY1DjARxNdURIjk3PuU2Ary_6uW8b4hP0BLxU3Sxbe3uvYOBIrnhz13Go72OtqaMTN82gq5UvCnNK6t45bfoxvL7_BAqk77LiNIjLWf8pHzDPdgsLxC0jfGfhmNE4h91nii9vqbKVwelru79KaFIyEAkGGw",
                                alt: "Producto demo"
                            },
                            {
                                id: 2,
                                name: "Producto demo 2",
                                price: 12999,
                                badge: { text: "Vista", className: "bg-blue-500" },
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWW2jOajHtqeEph58h7PAe319UVZAkLVC-4pp4FxPzXJREB62MW--mPq1DZ02MlVONb9e2mXwZzlsTQ2abNemV7nozlLe7HDM1GN2CXJ-oazr-AzW4AD-3xB_wbhCfTeQD74-VAVj1Q4dClIcGGit4rfLf_S8B7_4ZXmBIKcjvtXvAEbTRkCZdjH5gSrc4eZbqzohoASzpmDWDGvmE2ISYW4UXQ-VYiv7eRmHmorsM4HfSgWafndQ8t-x0oFT2NscKyEC5PGpajx8",
                                alt: "Producto demo 2"
                            }
                        ]
                    }
                };
            }
            return section;
        });
    }, []);

    return (
        <AdminLayout>
            <div className="max-w-[1280px] mx-auto bg-white dark:bg-[#1a130c] shadow-2xl rounded-xl overflow-hidden min-h-[800px] border border-gray-200 dark:border-[#3d2f21]">
                {/* This is the "Canvas" */}
                <PageBuilder sections={sections} />
            </div>
        </AdminLayout>
    );
}
