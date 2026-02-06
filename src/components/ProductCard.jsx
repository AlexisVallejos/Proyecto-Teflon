import React from "react";
import { useStore } from "../context/StoreContext";
import { useTenant } from "../context/TenantContext";
import { formatCurrency } from "../utils/format";

export default function ProductCard({ product }) {
  const { addToCart } = useStore();
  const { settings } = useTenant();
  const currency = settings?.commerce?.currency || "ARS";
  const locale = settings?.commerce?.locale || "es-AR";

  const { id, sku, name, price, badge, image, alt, stock } = product;
  const inStock = typeof stock === "number" ? stock > 0 : true;

  const handleAdd = () => {
    if (!inStock) return;
    addToCart({ id, sku, name, price, image, alt });
  };

  return (
    <div className="group flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <div
          onClick={() => (window.location.hash = `#product/${id}`)}
          className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
          style={{ backgroundImage: `url("${image}")` }}
          role="img"
          aria-label={alt}
          title={alt}
        />
        {badge ? (
          <span
            className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-bold text-white ${badge.className}`}
          >
            {badge.text}
          </span>
        ) : null}
      </div>

      <div className="px-2 pb-2">
        <h3 className="text-base md:text-lg font-bold">{name}</h3>
        {settings?.commerce?.show_prices !== false ? (
          <p className="text-xl md:text-2xl font-black text-primary mt-1">
            {formatCurrency(price, currency, locale)}
          </p>
        ) : (
          <p className="text-sm text-[#8a7560] mt-1">Consultar precio</p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5f2f0] py-2.5 font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!inStock}
        >
          <span className="material-symbols-outlined text-lg">
            add_shopping_cart
          </span>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
