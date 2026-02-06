import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "teflon_cart_v1";

const StoreContext = createContext(null);

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, qty: item.qty + nextQty }
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
                    qty: nextQty,
                    image: product.image || product.image_url || "",
                    alt: product.alt || product.name || "Producto",
                    variant: product.variant || "",
                },
            ];
        });
    };

    const updateQty = (id, qty) => {
        const nextQty = Math.max(1, safeNumber(qty, 1));
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item))
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
