import React, { useState, useEffect } from 'react';
import { TenantProvider } from './context/TenantContext';

import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import pages from new structure
import HomePage from './pages/store/HomePage';
import CatalogPage from './pages/store/CatalogPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import ProductDetail from './pages/store/ProductDetail';
import EditorPage from './pages/admin/EditorPage';

function AppContent() {
    const [route, setRoute] = useState(window.location.hash || '#');
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash || '#');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    let Component = HomePage;
    if (route === '#catalog') Component = CatalogPage;
    if (route === '#cart') Component = CartPage;
    if (route === '#checkout') Component = CheckoutPage;
    if (route.startsWith('#product')) Component = ProductDetail;
    if (route === '#admin') Component = EditorPage;

    return (
        <div className={`w-full min-h-screen bg-gray-50 transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
            <Component />
        </div>
    );
}

function App() {
    return (
        <TenantProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </TenantProvider>
    );
}

export default App;
