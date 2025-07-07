import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import api from "../services/api";
import "../styles/Cart.css";
import { ACCESS_TOKEN, STRIPE_PUBLIC_KEY } from '../constants';
import { useCart } from '../CartContext';

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, setCartItems } = useCart();  // Using useCart from context

  // Calculate total price including toppings and quantity
  const getTotalPrice = () => {
    let total = 0;
    cartItems.forEach(item => {
      let toppingTotal = 0;
      if (item.toppings) {
        toppingTotal = item.toppings.reduce((sum, topping) => sum + parseFloat(topping.price), 0);
      }
      total += (parseFloat(item.price) + toppingTotal) * item.quantity;
    });
    return total.toFixed(2); // Round to two decimal places
  };

  // Remove item from cart based on unique key
  const removeFromCart = (uniqueKey) => {
    setCartItems(cartItems.filter(item => `${item.id}-${item.size}` !== uniqueKey));
  };

  // Increment quantity of item
  const incrementQuantity = (uniqueKey) => {
    setCartItems(cartItems.map(item => 
      `${item.id}-${item.size}` === uniqueKey ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Decrement quantity of item
  const decrementQuantity = (uniqueKey) => {
    setCartItems(cartItems.map(item =>
      `${item.id}-${item.size}` === uniqueKey ? { ...item, quantity: item.quantity - 1 } : item
    ));
    // Remove item from cart if quantity is 1 and decremented
    const item = cartItems.find(item => `${item.id}-${item.size}` === uniqueKey);
    if (item && item.quantity === 1) {
      removeFromCart(uniqueKey);
    }
  };

  // Clear all items from cart
  const clearCart = () => {
    setCartItems([]);  // Clear the cart
  };

  // Handle payment logic with Stripe
  const handlePayment = async (paymentMethod) => {
    const paymentData = {
      token: paymentMethod.id,
      amount: getTotalPrice() * 100,  // Amount in cents
      description: 'Payment for order',
      return_url: 'http://localhost:3000/order/confirmation',
    };

    try {
      const response = await api.post('/charge/', paymentData, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 201) {
        navigate('/order/confirmation');
      } else {
        console.error('Payment failed:', response.data.error);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  return (
    <div className="cart-container bg-dark text-white">
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <button className="btn btn-danger clear-cart-btn" onClick={clearCart}>Clear Cart</button>
      </div>
      {cartItems.length === 0 ? (
        <p className="empty-cart-msg">Your cart is empty</p>
      ) : (
        <div>
          <ul className="list-group">
            {cartItems.map(item => (
              <li className="list-group-item cart-item bg-dark text-white" key={`${item.id}-${item.size}`}>
                <span>{item.name} ({item.size}) - ${item.price}</span>
                <ul className="list-group topping-list">
                  {item.toppings && item.toppings.map(topping => (
                    <li className="list-group-item bg-dark text-white" key={`${item.id}-${item.size}-${topping.name}`}>
                      {topping.name}: ${topping.price}
                    </li>
                  ))}
                </ul>
                <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                    <span className="badge bg-secondary me-2">{item.size.toUpperCase()}</span>
                    <div className="btn-group" role="group">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => decrementQuantity(`${item.id}-${item.size}`)}
                    >-</button>
                    <span className="btn btn-light">{item.quantity}</span>
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => incrementQuantity(`${item.id}-${item.size}`)}
                    >+</button>
                    </div>
                    <button
                        className="btn btn-sm btn-danger ms-2"
                        onClick={() => removeFromCart(`${item.id}-${item.size}`)}
                    >Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="cart-total">Total: ${getTotalPrice()}</p>
          <div className="checkout-section">
            <h2>Checkout</h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm onSubmit={handlePayment} />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
