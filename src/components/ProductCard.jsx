import React from 'react';

export default function ProductCard({ product }) {
    const { name, price, badge, image, alt } = product;

    return (
        <div className="group flex flex-col gap-3 rounded-xl bg-white dark:bg-[#2d2218] p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <div
                    onClick={() => window.location.hash = '#product'}
                    className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    style={{ backgroundImage: `url("${image}")` }}
                    role="img"
                    aria-label={alt}
                    title={alt}
                />
                <span
                    className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-bold text-white ${badge.className}`}
                >
                    {badge.text}
                </span>
            </div>

            <div className="px-2 pb-2">
                <h3 className="text-lg font-bold">{name}</h3>
                <p className="text-2xl font-black text-primary mt-1">{price}</p>

                <button
                    type="button"
                    onClick={() => window.location.hash = '#cart'}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5f2f0] dark:bg-[#3d2e21] py-2.5 font-bold hover:bg-primary hover:text-white transition-all"
                >
                    <span className="material-symbols-outlined text-lg">
                        add_shopping_cart
                    </span>
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
