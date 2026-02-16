import React, { useMemo } from "react";
import { useStore } from "../../context/StoreContext";
import ProductCard from "../ProductCard";
import { navigate } from "../../utils/navigation";

export default function FeaturedProducts({
  products,
  title = "Productos destacados",
  subtitle = "Lo más elegido en sanitarios y ferretería.",
  ctaLabel = "Todos los Productos",
  ctaLink = "/catalog",
  styles = {}
}) {
  const { search } = useStore();
  const {
    alignment = "items-end justify-between",
    titleSize = "text-3xl",
    subtitleSize = "text-base",
    titleColor = "text-[#181411] dark:text-white",
    subtitleColor = "text-[#8a7560] dark:text-white/60",
    sectionBg = "bg-transparent",
  } = styles;

  const visibleProducts = useMemo(() => {
    const items = Array.isArray(products) ? products : [];
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.name?.toLowerCase().includes(query));
  }, [products, search]);

  return (
    <section className={`px-10 py-12 ${sectionBg}`}>
      <div className="mx-auto max-w-[1280px]">
        <div className={`flex px-4 mb-8 ${alignment}`}>
          <div>
            <h2 className={`${titleSize} font-bold tracking-tight ${titleColor}`}>
              {title}
            </h2>
            <p className={`${subtitleSize} mt-1 ${subtitleColor}`}>
              {subtitle}
            </p>
          </div>
          {ctaLabel ? (
            <button
              type="button"
              onClick={() => navigate(ctaLink || "/catalog")}
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              {ctaLabel}{" "}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          ) : null}
        </div>

        {visibleProducts.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed border-[#e5e1de] dark:border-[#32261a] rounded-xl m-4 text-[#8a7560]">
            No encontramos productos para tu búsqueda.
          </div>
        )}
      </div>
    </section>
  );
}
