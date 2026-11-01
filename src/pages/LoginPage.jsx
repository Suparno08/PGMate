import { useState } from 'react';
import { useNavigate } from '../router';
import { useAuth } from '../contexts/AuthContext';
import { Link } from '../router';
import { validators } from '../utils/validators';
import FormError from '../components/FormError';

/**
 * LoginPage - Sign in with email + password
 * Includes validation, error handling, and accessibility features
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const emailErr = validators.email(email);
    const passwordErr = validators.password(password);

    if (emailErr) return emailErr;
    if (passwordErr) return passwordErr;

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setApiError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await signIn(email, password);

      window.scrollTo(0, 0);
      navigate('/');

      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      });
    } catch (err) {
      setApiError(err.message || 'Sign in failed. Please try again.');
    }
  };

  const displayError = error || apiError;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f7f9fc',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 35px rgba(31, 41, 65, 0.1)',
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }} aria-hidden="true">
            🏠
          </div>
          <h1 style={{ fontSize: '28px', color: '#172033', margin: '0 0 10px 0' }}>
            Sign In
          </h1>
          <p style={{ color: '#697386', margin: '0' }}>
            Welcome back to PGMate
          </p>
        </div>

        {displayError && (
          <FormError
            message={displayError}
            onRetry={() => {
              setError('');
              setApiError('');
            }}
          />
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#26334b',
            }}>
              Email Address <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (displayError) setApiError('');
              }}
              onBlur={(e) => {
                setTouched(prev => ({ ...prev, email: true }));
                e.target.style.borderColor = displayError && touched.email ? '#dc2626' : '#dce1eb';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="you@example.com"
              required
              aria-required="true"
              aria-describedby={displayError ? 'login-error' : undefined}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: `1px solid ${displayError && touched.email ? '#dc2626' : '#dce1eb'}`,
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: '#fafbfe',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#5146e5';
                e.target.style.boxShadow = '0 0 0 3px rgba(81, 70, 229, 0.1)';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#26334b',
            }}>
              Password <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (displayError) setApiError('');
              }}
              onBlur={(e) => {
                setTouched(prev => ({ ...prev, password: true }));
                e.target.style.borderColor = displayError && touched.password ? '#dc2626' : '#dce1eb';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="••••••••"
              required
              aria-required="true"
              aria-describedby={displayError ? 'login-error' : undefined}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: `1px solid ${displayError && touched.password ? '#dc2626' : '#dce1eb'}`,
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: '#fafbfe',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#5146e5';
                e.target.style.boxShadow = '0 0 0 3px rgba(81, 70, 229, 0.1)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#5146e5',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#4038c7')}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#5146e5')}
            aria-busy={isLoading}
          >
            {isLoading ? '🔄 Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#697386',
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{
            color: '#5146e5',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => e.target.style.color = '#4038c7'}
            onMouseLeave={(e) => e.target.style.color = '#5146e5'}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
