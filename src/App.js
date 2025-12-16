import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EstateProvider } from './context/EstateContext';
import Layout from './components/Layouts';


// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import EstateSelector from './pages/EstateSelector'; 
import ExpenseEntry from './pages/ExpenseEntry'; 
import SalesEntry from './pages/SalesEntry';
import Tracker from './pages/Tracker';
import { AuthProvider, useAuth } from './context/AuthContext';
import WorkersPage from './pages/WorkersPage';

// const ProtectedRoute = ({ children }) => {
//     const token = localStorage.getItem('token');
//     if (!token) return <Navigate to="/login" />;
//     return children;
// };
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return children;
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <Routes>
                {/* 1. Public Routes */}
                <Route path="/login" element={<Auth />} />

                {/* 2. Protected App Routes (Wrapped in Layout) */}
                <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                
                {/* Renamed route to /estates to make it a clear "Page" */}
                <Route path="/estates" element={<ProtectedRoute><Layout><EstateSelector /></Layout></ProtectedRoute>} />
                
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><Layout><ExpenseEntry /></Layout></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute><Layout><SalesEntry /></Layout></ProtectedRoute>} />
                <Route path="/tracker" element={<ProtectedRoute><Layout><Tracker /></Layout></ProtectedRoute>} />
                <Route path="/workers" element={<ProtectedRoute><Layout><WorkersPage /></Layout></ProtectedRoute>} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;