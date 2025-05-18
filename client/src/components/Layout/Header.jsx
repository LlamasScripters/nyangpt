import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaComment, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <h1>NyanGPT</h1>
        </Link>
      </div>
      <nav className="nav-menu">
        {currentUser ? (
          <>
            <div className="user-info">
              <span 
                className="username"
                style={{ color: currentUser.color || '#000000' }}
              >
                {currentUser.username}
              </span>
            </div>
            <ul className="nav-links">
              <li>
                <Link to="/chat" className="nav-link">
                  <FaComment /> <span>Chat</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="nav-link">
                  <FaUser /> <span>Profil</span>
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt /> <span>Déconnexion</span>
                </button>
              </li>
            </ul>
          </>
        ) : (
          <ul className="nav-links">
            <li>
              <Link to="/login" className="nav-link">
                Connexion
              </Link>
            </li>
            <li>
              <Link to="/register" className="nav-link">
                Inscription
              </Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
};

export default Header;