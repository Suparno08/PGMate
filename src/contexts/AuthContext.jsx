import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext - Manages user authentication state
 * Placeholder implementation for offline development.
 * Will be wired to aws-amplify Auth in P5.1 (when amplify_outputs.json is available).
 */

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Placeholder: Restore session from localStorage (demo)
  useEffect(() => {
    const savedUser = localStorage.getItem('pgmate_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Invalid stored data; clear it
        localStorage.removeItem('pgmate_user');
      }
    }
  }, []);

  const signIn = async (email, _password) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder: In production, call aws-amplify signIn
      // For now, simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 800));
      const userData = { email, userId: `user_${Date.now()}`, isAuthenticated: true };
      setUser(userData);
      localStorage.setItem('pgmate_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      const msg = err.message || 'Sign in failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email, _password) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder: In production, call aws-amplify signUp
      await new Promise(resolve => setTimeout(resolve, 800));
      // Return a state indicating confirmation required
      return { requiresConfirmation: true, email };
    } catch (err) {
      const msg = err.message || 'Sign up failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (email, _code) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder: In production, call aws-amplify confirmSignUp
      await new Promise(resolve => setTimeout(resolve, 600));
      const userData = { email, userId: `user_${Date.now()}`, isAuthenticated: true };
      setUser(userData);
      localStorage.setItem('pgmate_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      const msg = err.message || 'Confirmation failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Placeholder: In production, call aws-amplify signOut
      await new Promise(resolve => setTimeout(resolve, 400));
      setUser(null);
      localStorage.removeItem('pgmate_user');
    } catch (err) {
      setError(err.message || 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signUp,
        confirmSignUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
