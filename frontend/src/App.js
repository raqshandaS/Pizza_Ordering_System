// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import MenuItemDetail from './components/MenuItemDetail';
import OrderConfirmation from './components/OrderConfirmation';
import { CartProvider } from './CartContext';  // Import CartProvider


function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <CartProvider>  {/* Wrap app with CartProvider */}
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navbar />
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/menu" element={<ProtectedRoute><Navbar /><Menu /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Navbar /><Cart /></ProtectedRoute>} />
          <Route path="/menu/:itemId" element={<ProtectedRoute><Navbar /><MenuItemDetail /></ProtectedRoute>} />
          <Route path="/order/confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </Router>
    </CartProvider>  
  );
}

export default App;
