import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { CreatorModalProvider } from './context/CreatorModalContext';
import Layout from './components/layout/Layout/Layout';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AboutPage from './pages/AboutPage/AboutPage';
import NotificationsPage from './pages/NotificationsPage/NotificationsPage';
import AdvertDetailsPage from './pages/AdvertDetailsPage/AdvertDetailsPage';
import AddAdvertPage from './pages/AddAdvertPage/AddAdvertPage';
import AdminUsersPage from './pages/AdminUsersPage/AdminUsersPage';
import AdminStatisticsPage from './pages/AdminStatisticsPage/AdminStatisticsPage';
import './styles/globals.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && user?.role !== 'admin' && user?.isAdmin !== true && user?.roleId !== 2) {
        return <Navigate to="/" />;
    }

    return children;
};

function AppRoutes() {
    const { loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                    <ProtectedRoute>
                        <NotificationsPage />
                    </ProtectedRoute>
                } />
                <Route path="/advert/:id" element={<AdvertDetailsPage />} />
                <Route path="/add-advert" element={
                    <ProtectedRoute>
                        <AddAdvertPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                    <ProtectedRoute adminOnly>
                        <AdminUsersPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/statistics" element={
                    <ProtectedRoute adminOnly>
                        <AdminStatisticsPage />
                    </ProtectedRoute>
                } />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <Router>
            <ThemeProvider>
                <LanguageProvider>
                    <AuthProvider>
                        <CreatorModalProvider>
                            <AppRoutes />
                        </CreatorModalProvider>
                    </AuthProvider>
                </LanguageProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;