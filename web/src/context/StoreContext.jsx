import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "teflon_cart_v1";

const StoreContext = createContext(null);

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStock = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const StoreProvider = ({ children }) => {
    const [search, setSearch] = useState("");
    const [cartItems, setCartItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.warn("No se pudo leer el carrito guardado", err);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
        } catch (err) {
            console.warn("No se pudo guardar el carrito", err);
        }
    }, [cartItems]);

    const cartCount = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.qty, 0),
        [cartItems]
    );

    const cartSubtotal = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
        [cartItems]
    );

    const addToCart = (product, qty = 1) => {
        if (!product || !product.id) return;
        const nextQty = Math.max(1, safeNumber(qty, 1));
        const stockValue = normalizeStock(product.stock);

        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            const maxQty = stockValue != null ? Math.max(stockValue, 0) : null;
            if (maxQty !== null && maxQty <= 0) {
                return prev;
            }
            if (existing) {
                const desiredQty = existing.qty + nextQty;
                const cappedQty = maxQty != null ? Math.min(desiredQty, maxQty) : desiredQty;
                if (cappedQty === existing.qty) {
                    return prev;
                }
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, qty: cappedQty, stock: stockValue ?? item.stock }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    sku: product.sku || product.erp_id || product.id,
                    name: product.name || "Producto",
                    price: safeNumber(product.price, 0),
                    qty: maxQty != null ? Math.min(nextQty, maxQty) : nextQty,
                    image: product.image || product.image_url || "",
                    alt: product.alt || product.name || "Producto",
                    variant: product.variant || "",
                    stock: stockValue ?? undefined,
                },
            ];
        });
    };

    const updateQty = (id, qty) => {
        const nextQty = Math.max(1, safeNumber(qty, 1));
        setCartItems((prev) =>
            prev.flatMap((item) => {
                if (item.id !== id) return [item];
                const maxQty = typeof item.stock === "number" ? item.stock : null;
                const cappedQty = maxQty != null ? Math.min(nextQty, maxQty) : nextQty;
                if (cappedQty < 1) return [];
                return [{ ...item, qty: cappedQty }];
            })
        );
    };

    const removeItem = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <StoreContext.Provider
            value={{
                search,
                setSearch,
                cartItems,
                cartCount,
                cartSubtotal,
                addToCart,
                updateQty,
                removeItem,
                clearCart,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useStore debe usarse dentro de StoreProvider");
    }
    return context;
};
