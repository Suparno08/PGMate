
import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Simple routing using Context API (no react-router-dom)
 * Handles URL-based navigation for SPA
 */

const RouterContext = createContext();

export const useNavigate = () => {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error('useNavigate must be used within RouterProvider');
  }

  return context.navigate;
};

export const useLocation = () => {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error('useLocation must be used within RouterProvider');
  }

  return context.location;
};

export const Link = ({ to, children, ...props }) => {
  const navigate = useNavigate();

  return (
    <a
      href={to}
      {...props}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};

export const RouterProvider = ({ children }) => {
  const [pathname, setPathname] = useState(
    window.location.pathname || '/'
  );

  // Navigate between pages
  const navigate = (to) => {
    if (!to) return;

    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
    }

    setPathname(to);
  };

  // Reset scroll whenever the route changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  // Handle browser back and forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const value = {
    navigate,
    location: { pathname }
  };

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};
