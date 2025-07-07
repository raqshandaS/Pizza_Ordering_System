import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import "../styles/MenuItem.css";

const MenuItem = ({ item }) => {
    const [buttonClicked, setButtonClicked] = useState(null);
    const { cartItems, setCartItems } = useCart();
    const navigate = useNavigate();

    const findCartItem = (size) => {
        return cartItems.find(i => `${i.id}-${i.size}` === `${item.id}-${size}`);
    };

    const handleButtonClick = (size, price) => {
        const key = `${item.id}-${size}`;
        const exists = findCartItem(size);

        if (exists) {
            const updatedCart = cartItems.map(i =>
                `${i.id}-${i.size}` === key ? { ...i, quantity: i.quantity + 1 } : i
            );
            setCartItems(updatedCart);
        } else {
            setCartItems([...cartItems, {
                ...item,
                size,
                price,
                quantity: 1,
            }]);
        }

        setButtonClicked(size);
        setTimeout(() => setButtonClicked(null), 1000);
    };

    const incrementQuantity = (size) => {
        const key = `${item.id}-${size}`;
        setCartItems(cartItems.map(i =>
            `${i.id}-${i.size}` === key ? { ...i, quantity: i.quantity + 1 } : i
        ));
    };

    const decrementQuantity = (size) => {
        const key = `${item.id}-${size}`;
        const targetItem = findCartItem(size);
        if (targetItem && targetItem.quantity === 1) {
            setCartItems(cartItems.filter(i => `${i.id}-${i.size}` !== key));
        } else {
            setCartItems(cartItems.map(i =>
                `${i.id}-${i.size}` === key ? { ...i, quantity: i.quantity - 1 } : i
            ));
        }
    };

    const renderQuantityControls = (size) => {
        const cartItem = findCartItem(size);
        if (!cartItem) return null;

        return (
            <div className="quantity-controls mt-2">
                <button className="btn btn-outline-light" onClick={() => decrementQuantity(size)}>-</button>
                <span className="mx-2">{cartItem.quantity}</span>
                <button className="btn btn-outline-light" onClick={() => incrementQuantity(size)}>+</button>
            </div>
        );
    };

    const formatPrice = (price) => {
        if (typeof price !== 'number' || isNaN(price)) {
            return 'N/A';  // Fallback if price is not a valid number
        }
        return price.toFixed(2);
    };

    // Check if item has a valid image
    const imageUrl = item.image
        ? `/media/menu_items/${item.image}`
        : 'https://via.placeholder.com/150/0000FF/808080?Text=No%20Image';

    return (
        <div className="menu-item-container bg-dark text-white d-flex align-items-stretch p-3">
            <div className="menu-item-img-container">
                <img src={imageUrl} alt={item.name} className="menu-item-img" />
            </div>
            <div className="menu-item-details d-flex flex-column justify-content-between">
                <div onClick={() => navigate(`/menu/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <h3 className="menu-item-title">{item.name}</h3>
                    <p className="menu-item-price">
                        Small: ${formatPrice(item.price_small)} | Large: ${formatPrice(item.price_large)}
                    </p>
                    <p className="menu-item-description">{item.description}</p>
                </div>
                <div className="menu-item-actions justify-content-between align-items-center">
                    <div>
                        <button
                            className={`btn btn-blue ${buttonClicked === 'Small' ? 'btn-animation' : ''}`}
                            onClick={() => handleButtonClick('Small', item.price_small)}
                        >
                            Add Small
                        </button>
                        {renderQuantityControls('Small')}
                    </div>
                    <div>
                        <button
                            className={`btn btn-blue ${buttonClicked === 'Large' ? 'btn-animation' : ''}`}
                            onClick={() => handleButtonClick('Large', item.price_large)}
                        >
                            Add Large
                        </button>
                        {renderQuantityControls('Large')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuItem;
