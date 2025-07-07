import React, { useState, useEffect } from 'react';
import '../styles/OrderConfirmation.css'; // Import CSS file for styling

const OrderConfirmation = () => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        // Retrieve cart items from local storage if available
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    const getTotalPrice = () => {
        let total = 0;
        for (let item of cartItems) {
            let itemTotal = parseFloat(item.price) * item.quantity;
            if (item.toppings) {
                for (let topping of item.toppings) {
                    itemTotal += parseFloat(topping.price) * item.quantity;
                }
            }
            total += itemTotal;
        }
        return total.toFixed(2); // toFixed(2) rounds the total to 2 decimal places    
    };

    return (
        <div className="order-confirmation-container">
            <h1 className="order-confirmation-title">Order Confirmation</h1>
            <p className="order-confirmation-message">Thank you for your order!</p>
            <div className="ordered-items-container">
                <h2 className="ordered-items-title">Ordered Items:</h2>
                {cartItems.map((item, index) => (
                    <div key={index} className="ordered-item">
                        <img src={item.image} alt={item.name} className="ordered-item-image" />
                        <div className="ordered-item-details">
                            <h3 className="ordered-item-name">{item.name}</h3>
                            <p className="ordered-item-description">{item.description}</p>
                            <p className="ordered-item-size">Size: {item.size}</p>
                            <p className="ordered-item-quantity">Quantity: {item.quantity}</p>
                            {item.toppings && (
                                <div className="ordered-item-toppings">
                                    <h4>Toppings:</h4>
                                    <ul>
                                        {item.toppings.map((topping, toppingIndex) => (
                                            <li key={toppingIndex}>{topping.name} - ${topping.price}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <p className="ordered-item-price">Price: ${item.price}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="total-price-container">
                <h2 className="total-price-title">Total Price:</h2>
                <p className="total-price">${getTotalPrice()}</p>
            </div>
            <p className="order-confirmed-message">Your order has been confirmed!</p>
        </div>
    );
};

export default OrderConfirmation;
