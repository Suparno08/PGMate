
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from '../router';
import homeIcon from '../assets/home.svg';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await signOut();
      closeMenu();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="navbar mobile-nav">

      {/* Logo */}
      <Link to="/" className="mobile-nav-logo" onClick={closeMenu}>
        <div className="logo">
          <img
            src={homeIcon}
            alt="Home"
            style={{
              width: '30px',
              height: '30px',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />
          <span>PGMate</span>
        </div>
      </Link>

      {/* Hamburger button - mobile only */}
      <button
        className={`mobile-nav-toggle ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        type="button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation and authentication */}
      <div className={`mobile-nav-content ${menuOpen ? 'open' : ''}`}>

        <div className="nav-links">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <a href="/#find" onClick={closeMenu}>Find PG</a>
          <a href="/#compare" onClick={closeMenu}>Compare</a>
          <a href="/#assistant" onClick={closeMenu}>AI Assistant</a>

          {user && (
            <Link to="/preferences" onClick={closeMenu}>
              My Preferences
            </Link>
          )}
        </div>

        <div className="mobile-nav-auth">
          {user ? (
            <>
              <span className="mobile-nav-email">
                {user.email}
              </span>

              <button
                className="login-btn"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>
                <button className="login-btn" type="button">
                  Login
                </button>
              </Link>

              <Link to="/signup" onClick={closeMenu}>
                <button className="mobile-nav-signup" type="button">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
