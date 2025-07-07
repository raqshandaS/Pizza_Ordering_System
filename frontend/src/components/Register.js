// src/components/Register.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'
import "../styles/login.css"

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            await api.post('/user/register/', { username, email, password });
            setLoading(false);
            setMessage("Registration successful. You can now login.");
        } catch (error) {
            const resMessage =
                (error.response && error.response.data && error.response.data.detail) ||
                error.message ||
                error.toString();
            setLoading(false);
            setMessage(resMessage);
        }
    };

    return (
        <div className="register-container bg-dark text-white">
            <h2>Register</h2>
            <form onSubmit={handleRegister} className="register-form">
                <div className="form-group">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input type="text" className="form-control bg-secondary text-white register-input" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input type="email" className="form-control bg-secondary text-white register-input" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" className="form-control bg-secondary text-white register-input" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-block register-btn" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
                {message && <div className="alert alert-danger mt-3">{message}</div>}
            </form>
            <p className="mt-3">Already have an account? <Link to="/login" className="text-white login-link">Login Here</Link></p>
        </div>

    );
};

export default Register;
