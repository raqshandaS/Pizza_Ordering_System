import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);

    // auth function to check if the token is valid
    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorized(false);
            return;
        }
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;  // Convert milliseconds to seconds
        if (tokenExpiration >= now) {
            setIsAuthorized(true);  // Token is still valid
        } else {
            await refreshToken();  // Token expired, try to refresh it
        }
    };

    // Token refresh function
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
            setIsAuthorized(false);
            return;
        }
        try {
            const res = await api.post("/api/token/refresh/", { refresh: refreshToken });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);  // Refresh successful
            } else {
                setIsAuthorized(false);  // Refresh failed
            }
        } catch (error) {
            console.error("Refresh token error:", error);
            setIsAuthorized(false);  // Set as unauthorized if error occurs
        }
    };

    // Effect hook to check the authorization when the component mounts
    useEffect(() => {
        auth();  // Only run auth check on mount
    }, []);  // Empty array ensures it only runs once on mount

    if (isAuthorized === null) {
        return <div>Loading...</div>;  // Wait until authorization check completes
    }

    return isAuthorized ? children : <Navigate to='/login' />;  // Redirect to login if not authorized
}

export default ProtectedRoute;
