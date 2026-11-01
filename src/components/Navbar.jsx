
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from '../router';
import homeIcon from '../assets/home.svg';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="logo">
          <img
            src={homeIcon}
            alt="Home"
            style={{
              width: '30px',
              height: '30px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <span>PGMate</span>
        </div>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="/#find">Find PG</a>
        <a href="/#compare">Compare</a>
        <a href="/#assistant">AI Assistant</a>

        {user && (
          <Link to="/preferences">My Preferences</Link>
        )}
      </div>

      {user ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{
            fontSize: '14px',
            color: '#4b5870',
            fontWeight: '600',
          }}>
            {user.email}
          </span>

          <button
            className="login-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="login-btn">
              Login
            </button>
          </Link>

          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button
              style={{
                border: 'none',
                background: '#eeedff',
                color: '#5146e5',
                padding: '13px 27px',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) =>
                e.target.style.backgroundColor = '#e8e3ff'
              }
              onMouseLeave={(e) =>
                e.target.style.backgroundColor = '#eeedff'
              }
            >
              Sign Up
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}
