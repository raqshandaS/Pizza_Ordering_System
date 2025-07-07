import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item, size, price) => {
        const key = `${item.id}-${size}`;
        const index = cartItems.findIndex(i => `${i.id}-${i.size}` === key);

        if (index !== -1) {
            const updatedCart = [...cartItems];
            updatedCart[index].quantity++;
            setCartItems(updatedCart);
        } else {
            setCartItems([...cartItems, { ...item, size, quantity: 1, price }]);
        }
    };

    return (
        <CartContext.Provider value={{ cartItems, setCartItems, addToCart }}>
            {children}
        </CartContext.Provider>
    );
};
