import React, { useMemo } from "react";
import { useStore } from "../../context/StoreContext";
import ProductCard from "../ProductCard";

export default function FeaturedProducts({ products }) {
  const { search } = useStore();

  const visibleProducts = useMemo(() => {
    const items = Array.isArray(products) ? products : [];
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.name?.toLowerCase().includes(query));
  }, [products, search]);

  return (
    <section className="px-4 md:px-10 py-12">
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

        {visibleProducts.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed border-[#e5e1de] rounded-xl m-4 text-[#8a7560]">
            No encontramos productos con ese criterio.
          </div>
        )}
      </div>
    </section>
  );
}
