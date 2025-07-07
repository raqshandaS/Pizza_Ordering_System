// CheckoutForm.js
import React, { useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import '../styles/CheckoutForm.css'; // Import CSS file for styling

const CheckoutForm = ({ onSubmit }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        if (!stripe || !elements) {
            setLoading(false);
            return;
        }

        const cardElement = elements.getElement(CardNumberElement);
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: event.target.cardholderName.value, // Get cardholder name from form
            },
        });
        setLoading(false);
        if (error) {
            console.error('Stripe error:', error);
        } else {
            onSubmit(paymentMethod);
        }
    };

    return (
        <form className="checkout-form" onSubmit={handleSubmit}>
            <label htmlFor="cardholderName">Cardholder Name:</label>
            <input type="text" id="cardholderName" name="cardholderName" required />

            <label htmlFor="cardNumber">Card Number:</label>
            <CardNumberElement id="cardNumber" className="card-element" />

            <label htmlFor="cardExpiry">Expiration Date:</label>
            <CardExpiryElement id="cardExpiry" className="card-element" />

            <label htmlFor="cardCvc">CVC:</label>
            <CardCvcElement id="cardCvc" className="card-element" />

            <button type="submit" disabled={loading || !stripe} className="pay-button">
                {loading ? 'Loading...' : 'Pay'}
            </button>
        </form>
    );
};

export default CheckoutForm;
