
import { useEffect } from 'react';
import './App.css';
import { RouterProvider, useLocation } from './router';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PreferencesPage from './pages/PreferencesPage';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * ProtectedRoute - Shows login redirect if user not authenticated
 */
function ProtectedRoute({ element }) {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return element;
}

/**
 * RouterContent - Renders the appropriate page based on pathname
 */
function RouterContent() {
  const location = useLocation();
  const pathname = location.pathname;

  // Scroll to top whenever the route changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  let content;

  if (pathname === '/login') {
    content = <LoginPage />;
  } else if (pathname === '/signup') {
    content = <SignupPage />;
  } else if (pathname === '/preferences') {
    content = <ProtectedRoute element={<PreferencesPage />} />;
  } else {
    content = <HomePage />;
  }

  return (
    <div className="app">
      <Navbar />
      {content}
      <Footer />
    </div>
  );
}

/**
 * AppRouter - Main app with custom routing
 */
export default function AppRouter() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <RouterContent />
      </RouterProvider>
    </ErrorBoundary>
  );
}
