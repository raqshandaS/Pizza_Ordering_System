import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MenuItem from './MenuItem';
import { useNavigate } from 'react-router-dom';  // Import navigate
import "../styles/Menu.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
const Menu = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const getItems = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN); // Retrieve token from localStorage
            console.log("Retrieved token:", token);
            if (!token) {
                console.error('No authorization token found!');
                navigate('/login'); // Redirect to login if token is missing
                return;
            }

            try {
                const response = await api.get(`/menuitems/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Add the token to headers
                    }
                });
                console.log("Menu items fetched:", response.data);
                setItems(response.data);
                setLoading(false); // Set loading to false after items are fetched
            } catch (error) {
                console.error('Failed to fetch items:', error);
                setError("Failed to fetch items");
                setLoading(false); // Set loading to false even if there's an error
            }
        };

        getItems();
    }, [navigate]); // Run this effect only once after component mounts

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems)); // Save cart to localStorage
    }, [cartItems]);

    // Handle add item to cart with selected size
    const addToCart = (item, size = 'Small', price = 'N/A') => {
        const uniqueKey = `${item.id}-${size}`;
        const existIndex = cartItems.findIndex(x => `${x.id}-${x.size}` === uniqueKey);
        if (existIndex !== -1) {
            const updatedCartItems = [...cartItems];
            updatedCartItems[existIndex].quantity++;
            setCartItems(updatedCartItems);
        } else {
            setCartItems([...cartItems, { ...item, size, quantity: 1, price }]);
        }
    };

    // Filter items based on category and search term
    const filteredItems = items.filter(item => {
        const matchesCategory = category === 'All' || item.category === category;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="container">
            <h1 className="text-white">Menu</h1>
            {error && <p className="text-danger">{error}</p>}
            {loading && <p className="text-white">Loading...</p>} {/* Show loading indicator */}
            
            {/* Filter/Search Bar */}
            <div className="filter-search-container mb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <label className="text-white mb-2 mb-md-0 mr-2">Filter by Category:</label>
                    <select
                        className="form-select bg-dark text-light mr-2 mb-2 mb-md-0"
                        onChange={(e) => setCategory(e.target.value)}
                        value={category}
                    >
                        <option value="All">All</option>
                        <option value="Pizza">Pizza</option>
                        <option value="Breads">Breads</option>
                        <option value="Deserts">Deserts</option>
                    </select>
                    <input
                        type="text"
                        className="form-control bg-dark text-light"
                        placeholder="Search menu items..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                    />
                </div>
            </div>
            
            {/* Menu Items Display */}
            <div className="menu-list">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <MenuItem key={`${item.id}-${item.size || 'default'}`} item={item} addToCart={addToCart} />
                    ))
                ) : (
                    !loading && <p className="text-white">No items found.</p>
                )}
            </div>
        </div>
    );
};

export default Menu;
