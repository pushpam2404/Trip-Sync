import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './contexts/AppProvider';
import { useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Spinner } from './components/ui/Spinner';

// Each screen is its own chunk, so the login page does not download the map code.
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const SignUpScreen = lazy(() => import('./screens/auth/SignUpScreen'));
const ProfileSetup1Screen = lazy(() => import('./screens/profile/ProfileSetup1Screen'));
const ProfileSetup2Screen = lazy(() => import('./screens/profile/ProfileSetup2Screen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const SakhaScreen = lazy(() => import('./screens/SakhaScreen'));
const PlannerScreen = lazy(() => import('./screens/planner/PlannerScreen'));
const SavedScreen = lazy(() => import('./screens/SavedScreen'));
const HistoryScreen = lazy(() => import('./screens/HistoryScreen'));
const AccountScreen = lazy(() => import('./screens/AccountScreen'));
const NavigationScreen = lazy(() => import('./screens/NavigationScreen'));

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestOnly() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

const PageLoader = () => (
  <div className="grid min-h-dvh place-items-center">
    <Spinner label="Loading" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/signup" element={<SignUpScreen />} />
            </Route>

            {/* Sign-up continues here before the account exists, so these stay public. */}
            <Route path="/profile/setup-1" element={<ProfileSetup1Screen />} />
            <Route path="/profile/setup-2" element={<ProfileSetup2Screen />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<HomeScreen />} />
                <Route path="sakha" element={<SakhaScreen />} />
                <Route path="planner" element={<PlannerScreen />} />
                <Route path="saved" element={<SavedScreen />} />
                <Route path="history" element={<HistoryScreen />} />
              </Route>
              <Route path="account" element={<AccountScreen />} />
              <Route path="navigation" element={<NavigationScreen />} />
              <Route path="app" element={<Navigate to="/sakha" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  );
}
