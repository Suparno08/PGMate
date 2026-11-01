import { useState } from 'react';
import { useNavigate, Link } from '../router';
import { useAuth } from '../contexts/AuthContext';
import { validators } from '../utils/validators';
import FormError from '../components/FormError';

/**
 * SignupPage - Register new user
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('register'); // 'register' | 'confirm'
  const [confirmCode, setConfirmCode] = useState('');
  const { signUp, confirmSignUp, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const emailErr = validators.email(email);
    const passwordErr = validators.password(password);
    const passwordMatchErr = validators.passwordMatch(password, confirmPassword);

    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (passwordErr) {
      setError(passwordErr);
      return;
    }
    if (passwordMatchErr) {
      setError(passwordMatchErr);
      return;
    }

    try {
      await signUp(email, password);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Sign up failed');
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');

    const codeErr = validators.confirmationCode(confirmCode);
    if (codeErr) {
      setError(codeErr);
      return;
    }

    try {
      await confirmSignUp(email, confirmCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Confirmation failed');
    }
  };

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
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🏠</div>
          <h1 style={{ fontSize: '28px', color: '#172033', margin: '0 0 10px 0' }}>
            Create Account
          </h1>
          <p style={{ color: '#697386', margin: '0' }}>
            Join PGMate to find your perfect PG
          </p>
        </div>

        {error && (
          <FormError 
            message={error}
            onRetry={() => setError('')}
          />
        )}

        {step === 'register' ? (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#26334b',
              }}>
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                required
                aria-required="true"
                aria-describedby={error ? 'signup-error' : undefined}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #dce1eb',
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
                onBlur={(e) => {
                  e.target.style.borderColor = '#dce1eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#26334b',
              }}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="At least 8 characters"
                required
                aria-required="true"
                aria-describedby={error ? 'signup-error' : undefined}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #dce1eb',
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
                onBlur={(e) => {
                  e.target.style.borderColor = '#dce1eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#26334b',
              }}>
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                required
                aria-required="true"
                aria-describedby={error ? 'signup-error' : undefined}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #dce1eb',
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
                onBlur={(e) => {
                  e.target.style.borderColor = '#dce1eb';
                  e.target.style.boxShadow = 'none';
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
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            <p style={{ color: '#697386', marginBottom: '20px', fontSize: '14px' }}>
              A confirmation code has been sent to <strong>{email}</strong>. Please enter it below.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#26334b',
              }}>
                Confirmation Code
              </label>
              <input
                id="signup-confirm-code"
                type="text"
                value={confirmCode}
                onChange={(e) => {
                  setConfirmCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                placeholder="123456"
                maxLength="6"
                inputMode="numeric"
                required
                aria-required="true"
                aria-describedby={error ? 'signup-error' : undefined}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #dce1eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  backgroundColor: '#fafbfe',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  letterSpacing: '3px',
                  fontWeight: '600',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5146e5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(81, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#dce1eb';
                  e.target.style.boxShadow = 'none';
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
              {isLoading ? 'Confirming...' : 'Confirm Account'}
            </button>
          </form>
        )}

        {step === 'register' && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#697386',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#5146e5',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#4038c7'}
            onMouseLeave={(e) => e.target.style.color = '#5146e5'}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
