import React, { useState, useEffect } from 'react';
import { TenantProvider } from './context/TenantContext';
import { StoreProvider } from './context/StoreContext';

import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import pages from new structure
import HomePage from './pages/store/HomePage';
import CatalogPage from './pages/store/CatalogPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import ProductDetail from './pages/store/ProductDetail';
import LoginPage from './pages/store/LoginPage';
import SignupPage from './pages/store/SignupPage';
import EditorPage from './pages/admin/EditorPage';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
    const [route, setRoute] = useState(window.location.pathname);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const handleLocationChange = () => setRoute(window.location.pathname);

        // Listen for browser back/forward buttons
        window.addEventListener('popstate', handleLocationChange);

        // Listen for custom navigation events
        window.addEventListener('navigate', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('navigate', handleLocationChange);
        };
    }, []);

    let Component = HomePage;
    if (route === '/catalog') Component = CatalogPage;
    else if (route === '/cart') Component = CartPage;
    else if (route === '/checkout') Component = CheckoutPage;
    else if (route.startsWith('/product')) Component = ProductDetail;
    else if (route === '/login') Component = LoginPage;
    else if (route === '/signup') Component = SignupPage;
    else if (route === '/admin') Component = EditorPage;

    return (
        <div className={`w-full min-h-screen bg-gray-50 transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
            <Component />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <TenantProvider>
                <StoreProvider>
                    <ThemeProvider>
                        <ErrorBoundary>
                            <AppContent />
                        </ErrorBoundary>
                    </ThemeProvider>
                </StoreProvider>
            </TenantProvider>
        </AuthProvider>
    );
}

export default App;
