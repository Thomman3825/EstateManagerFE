import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // You might need to install: npm install jwt-decode
// OR if you don't want a new package, we can just check if token exists.

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token on app load
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decode token to get user info (id, name, etc.)
                // If you don't use jwt-decode, you can just set true or fetch /me endpoint
                const decoded = JSON.parse(atob(token.split('.')[1])); 
                setUser({ id: decoded.id, ...decoded });
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        // 1. Clear Token
        localStorage.removeItem('token');
        
        // 2. Clear Selected Estate (as requested)
        localStorage.removeItem('selectedEstate');
        
        // 3. Reset State
        setUser(null);
        
        // 4. Force Redirect (Optional, handled by ProtectedRoute usually)
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);