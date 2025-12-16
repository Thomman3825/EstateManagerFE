// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { EstateProvider, useEstate } from './context/EstateContext';

// Components
import Layout from './components/Layouts';

// Pages
import EstateSelector from './pages/EstateSelector';
import Dashboard from './pages/Dashboard';
import ExpenseEntry from './pages/ExpenseEntry';
import Tracker from './pages/Tracker';
import WorkersPage from './pages/WorkersPage';
import SalesEntry from './pages/SalesEntry';

// --- PROTECTED ROUTE WRAPPER ---
// This ensures that:
// 1. The user has selected an Estate (if not, kicks them to home).
// 2. If they are allowed, it wraps the page in the "Sidebar Layout".
const ProtectedRoute = ({ children }) => {
    const { selectedEstate } = useEstate();

    // If no estate is selected in Context, redirect to the Selector page
    if (!selectedEstate) {
        return <Navigate to="/" replace />;
    }
    
    // If authenticated/selected, render the Sidebar Layout + The Page
    return <Layout>{children}</Layout>;
};

function App() {
  return (
    <EstateProvider>
        <Router>
            <Routes>
                {/* --- PUBLIC ROUTE --- */}
                {/* Estate Selection Screen (No Sidebar needed here) */}
                <Route path="/" element={<EstateSelector />} />
                
                {/* --- PROTECTED ROUTES (Sidebar + Dark Mode) --- */}
                
                {/* 1. Dashboard */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />

                {/* 2. Expense Entry (Weekly / Wages) */}
                <Route 
                    path="/expenses" 
                    element={
                        <ProtectedRoute>
                            <ExpenseEntry />
                        </ProtectedRoute>
                    } 
                />

                {/* 3. Tracker Reports (Graphs & Filters) */}
                <Route 
                    path="/tracker" 
                    element={
                        <ProtectedRoute>
                            <Tracker />
                        </ProtectedRoute>
                    } 
                />
                <Route
                path='/workers'
                element= {
                  <ProtectedRoute>
                    <WorkersPage/>
                  </ProtectedRoute>
                }
                />
                <Route 
                path='/sales'
                element={
                    <ProtectedRoute>
                        <SalesEntry/>
                    </ProtectedRoute>
                }
                />

                
                {/* Optional: Redirect unknown URLs to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Router>
    </EstateProvider>
  );
}

export default App;