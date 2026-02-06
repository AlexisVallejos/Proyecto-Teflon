import React from 'react';
import ProductCard from '../ProductCard';

export default function FeaturedProducts({ products }) {
    return (
        <section className="px-10 py-12">
            <div className="mx-auto max-w-[1280px]">
                <div className="flex items-end justify-between px-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Productos destacados
                        </h2>
                        <p className="text-[#8a7560] mt-1">
                            Nuestra selección más popular en sanitarios y grifería.
                        </p>
                    </div>
                    <a
                        className="text-primary font-bold hover:underline flex items-center gap-1"
                        href="#catalog"
                    >
                        Ver todos los productos{" "}
                        <span className="material-symbols-outlined text-sm">
                            arrow_forward
                        </span>
                    </a>
                </div>

                {products && products.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center border-2 border-dashed border-[#e5e1de] rounded-xl m-4 text-[#8a7560]">
                        No hay productos destacados todavía.
                    </div>
                )}
            </div>
        </section>
    );
}
