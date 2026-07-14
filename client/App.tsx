import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMapplsLoader } from './src/hooks/useMapplsLoader';
import { AppProvider, useAppContext } from './src/contexts/AppContext';
import { ProtectedRoute } from './src/components/common/ProtectedRoute';

// Screen Imports
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { ProfileSetup1Screen } from './src/screens/profile/ProfileSetup1Screen';
import { ProfileSetup2Screen } from './src/screens/profile/ProfileSetup2Screen';
import { MainScreen } from './src/screens/MainScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NavigationScreen } from './src/screens/NavigationScreen';
import { AccountScreen } from './src/screens/AccountScreen';

const AppContent = () => {
    // Load Mappls SDK script dynamically
    const { isLoaded, loadError } = useMapplsLoader();

    if (loadError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-red-500 p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">Mappls Maps Load Error</h1>
                <p className="text-slate-400">{loadError.message}</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium">Initializing Mappls Map Platform...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignUpScreen />} />

            {/* Profile Setup - Public (during signup flow) */}
            <Route path="/profile/setup-1" element={<ProfileSetup1Screen />} />
            <Route path="/profile/setup-2" element={<ProfileSetup2Screen />} />

            {/* Authenticated Dashboard / Workflows */}
            <Route path="/" element={
                <ProtectedRoute>
                    <HomeScreen />
                </ProtectedRoute>
            } />

            {/* Main Tabs Container (Sakha, Planner, Saved, History) */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <MainScreen />
                </ProtectedRoute>
            } />

            {/* Interactive Live Navigation */}
            <Route path="/navigation/*" element={
                <ProtectedRoute>
                    <NavigationScreen />
                </ProtectedRoute>
            } />

            {/* Account Settings */}
            <Route path="/account" element={
                <ProtectedRoute>
                    <AccountScreen />
                </ProtectedRoute>
            } />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AppProvider>
                <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-cyan-500/30">
                    <AppContent />
                </div>
            </AppProvider>
        </BrowserRouter>
    );
};

export default App;