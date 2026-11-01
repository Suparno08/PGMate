import { Component } from 'react';

/**
 * Error Boundary - Catches unhandled errors in child components
 * Displays a friendly fallback UI and logs the error
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details (in production, send to monitoring service)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f7f9fc',
            padding: '20px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ fontSize: '28px', color: '#172033', marginBottom: '10px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#697386', marginBottom: '20px', lineHeight: '1.6' }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginTop: '20px',
                  padding: '10px',
                  backgroundColor: '#f5f6fa',
                  borderRadius: '8px',
                  textAlign: 'left',
                  color: '#666',
                  fontSize: '12px',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                  Error Details (development only)
                </summary>
                <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#5146e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.target.style.backgroundColor = '#4038c7'}
              onMouseLeave={e => e.target.style.backgroundColor = '#5146e5'}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
