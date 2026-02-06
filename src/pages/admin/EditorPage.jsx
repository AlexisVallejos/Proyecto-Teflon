import React, { useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import PageBuilder from '../../components/PageBuilder';
import { HOME_PAGE_DATA } from '../../data/mock';

export default function EditorPage() {
    // In strict mode, we might want to prevent links from verifying navigation inside the editor
    // For now, we reuse the PageBuilder directly.

    // Simulating "Hydration" same as HomePage
    // In a real editor, this data would come from the form state
    const sections = useMemo(() => {
        return HOME_PAGE_DATA.sections.map(section => {
            if (section.type === 'FeaturedProducts') {
                // Mock products for preview
                return {
                    ...section,
                    props: {
                        ...section.props,
                        products: [
                            {
                                id: 1,
                                name: "Sample Product",
                                price: "$99.99",
                                badge: { text: "Preview", className: "bg-blue-500" },
                                image: "https://via.placeholder.com/300",
                                alt: "Preview"
                            },
                            {
                                id: 2,
                                name: "Sample Product 2",
                                price: "$129.99",
                                badge: { text: "Preview", className: "bg-blue-500" },
                                image: "https://via.placeholder.com/300",
                                alt: "Preview"
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
