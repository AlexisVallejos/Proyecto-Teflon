import React from 'react';
import ProductCard from '../ProductCard';

export default function FeaturedProducts({ products }) {
    return (
        <section className="px-10 py-12">
            <div className="mx-auto max-w-[1280px]">
                <div className="flex items-end justify-between px-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Featured Products
                        </h2>
                        <p className="text-[#8a7560] mt-1">
                            Our most popular hardware and sanitary selections.
                        </p>
                    </div>
                    <a
                        className="text-primary font-bold hover:underline flex items-center gap-1"
                        href="#catalog"
                    >
                        See all products{" "}
                        <span className="material-symbols-outlined text-sm">
                            arrow_forward
                        </span>
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                    {products.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
        </section>
    );
}
