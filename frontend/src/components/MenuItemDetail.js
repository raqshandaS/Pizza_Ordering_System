import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useParams } from 'react-router-dom';
import "../styles/MenuItemDetail.css";

const MenuItemDetail = () => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { itemId } = useParams(); // Use useParams to get itemId from URL
    const [size, setSize] = useState('Small');
    const [quantity, setQuantity] = useState(1);
    const [toppings, setToppings] = useState([]);
    const [selectedToppings, setSelectedToppings] = useState([]);
    const [showQuantityControls, setShowQuantityControls] = useState(false);

    const fetchToppings = useCallback(() => {
        return api.get(`/toppings/`);
    }, []);

    useEffect(() => {
        const getToppings = async () => {
            try {
                const response = await fetchToppings();
                setToppings(response.data);
            } catch (error) {
                console.error('Failed to fetch toppings:', error);
                setError("Failed to fetch toppings");
            }
        };
        getToppings();
    }, [fetchToppings]);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        if (itemId) {
            api.get(`/menuitems/${itemId}/`)
                .then(response => {
                    setItem(response.data);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Failed to fetch item details.');
                    setLoading(false);
                });
        }
    }, [itemId]);

    const addToCart = () => {
        const price = (size === 'Small') ? item.price_small : item.price_large;
        const uniqueKey = `${item.id}-${size}`;

        // Check if the item already exists in the cart
        const existIndex = cartItems.findIndex(x => `${x.id}-${x.size}` === uniqueKey);
        if (existIndex !== -1) {
            // Update existing item with new toppings and quantity
            const updatedCartItems = [...cartItems];
            updatedCartItems[existIndex].quantity += quantity; // Add quantity
            updatedCartItems[existIndex].toppings = selectedToppings; // Update toppings
            setCartItems(updatedCartItems);
        } else {
            // Add new item to cart
            setCartItems([
                ...cartItems,
                { 
                    ...item, 
                    size, 
                    quantity, 
                    price, 
                    toppings: selectedToppings 
                }
            ]);
        }
        setShowQuantityControls(true); // Show quantity controls after adding
    };

    const toggleTopping = (topping) => {
        if (selectedToppings.includes(topping)) {
            setSelectedToppings(selectedToppings.filter(t => t !== topping));
        } else {
            setSelectedToppings([...selectedToppings, topping]);
        }
    };

    const incrementQuantity = (uniqueKey) => {
        setCartItems(cartItems.map(x =>
            `${x.id}-${size}` === uniqueKey ? { ...x, quantity: x.quantity + 1 } : x
        ));
        setQuantity(quantity + 1);
    };

    const decrementQuantity = (uniqueKey) => {
        setCartItems(cartItems.map(x =>
            `${x.id}-${size}` === uniqueKey ? { ...x, quantity: x.quantity - 1 } : x
        ));
        const exist = cartItems.find(x => `${x.id}-${x.size}` === uniqueKey);
        if (exist.quantity === 1) {
            removeFromCart(uniqueKey);
        }
        setQuantity(quantity - 1);
    };

    const removeFromCart = (uniqueKey) => {
        setCartItems(cartItems.filter(item => `${item.id}-${item.size}` !== uniqueKey));
        setShowQuantityControls(false);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!item) return <div>Item not found</div>;

    return (
        <div className="menu-item-detail-container bg-dark text-white">
            <h2>{item.name}</h2>
            <img src={item.image} alt={item.name} className="menu-item-detail-img" />
            <p>{item.description}</p>
            <div className="size-selection">
                <label className="text-white">Size:</label>
                <select value={size} onChange={e => setSize(e.target.value)} className="size-select bg-secondary text-white">
                    <option value="Small">Small</option>
                    <option value="Large">Large</option>
                </select>
            </div>
            <div className="toppings-section">
                <h3 className="text-white">Toppings:</h3>
                <div className="topping-list">
                    {toppings && toppings.map(topping => (
                        <div key={topping.id} className="topping-item">
                            <input
                                type="checkbox"
                                checked={selectedToppings.includes(topping)}
                                onChange={() => toggleTopping(topping)}
                                className="topping-checkbox visually-hidden"
                                id={`topping-${topping.id}`}
                            />
                            <label
                                htmlFor={`topping-${topping.id}`}
                                className={`topping-label ${topping.name.length > 10 ? 'long' : ''}`}
                            >
                                <span className="topping-name">{topping.name}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            {showQuantityControls ? (
                <div className="quantity-controls">
                    <button onClick={() => decrementQuantity(`${item.id}-${size}`)} className="quantity-btn btn btn-outline-light">
                        <span>-</span>
                    </button>
                    <span className="quantity">{quantity}</span>
                    <button onClick={() => incrementQuantity(`${item.id}-${size}`)} className="quantity-btn btn btn-outline-light">
                        <span>+</span>
                    </button>
                </div>
            ) : (
                <button onClick={addToCart} className="add-to-cart-btn btn btn-primary">Add to Cart</button>
            )}
        </div>
    );
};

export default MenuItemDetail;
