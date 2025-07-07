import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import "../styles/login.css";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    
    const navigate = useNavigate();
    const location = useLocation(); // Get the current location

    // Retrieve the intended page from the location state (if any)
    const redirectTo = location.state?.from || '/'; 

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await api.post("/token/", { username, password });
            console.log("Login successful. Storing tokens...");
            console.log("Access Token:", res.data.access); // Debugging log
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/"); // Redirect after login
        } catch (error) {
            const resMessage =
                (error.response && error.response.data && error.response.data.detail) ||
                error.message ||
                error.toString();
            setMessage(resMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container bg-dark text-white">
            <h2 className="login-heading">Login</h2>
            <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input 
                        type="text" 
                        className="form-control bg-secondary text-white login-input" 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input 
                        type="password" 
                        className="form-control bg-secondary text-white login-input" 
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
                <button 
                    type="submit" 
                    className="btn btn-primary btn-block login-btn" 
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {message && <div className="alert alert-danger mt-3">{message}</div>}
            </form>
            <p className="mt-3">Don't have an account? <Link to="/register" className="text-white register-link">Sign Up</Link></p>
        </div>
    );
};

export default Login;
