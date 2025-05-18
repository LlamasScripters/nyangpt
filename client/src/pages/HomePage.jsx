import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Layout/Header';
import { FaComment, FaUser, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const HomePage = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/chat');
    }
  }, [currentUser, loading, navigate]);

  return (
    <div className="page-container">
      <Header />
      <main className="main-content">
        <div className="home-container">
          <div className="hero-section">
            <h1>Bienvenue sur NyanGPT !</h1>
            <p className="subtitle">
              Une application de chat simple et conviviale pour communiquer en temps réel avec vos amiiiiiiiiiiiiiiiis !
            </p>
            <img src="/nyan-cat.gif" alt="Nyan Cat" className="nyan-cat" />
            
            <div className="cta-buttons">
              {!currentUser && !loading ? (
                <>
                  <Link to="/login" className="cta-button login">
                    <FaSignInAlt /> Se connecter
                  </Link>
                  <Link to="/register" className="cta-button register">
                    <FaUserPlus /> S'inscrire
                  </Link>
                </>
              ) : loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <Link to="/chat" className="cta-button chat">
                  <FaComment /> Accéder au chat
                </Link>
              )}
            </div>
          </div>
          
          <div className="features-section">
            <h2>Fonctionnalités</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <FaComment />
                </div>
                <h3>Chat en temps réel</h3>
                <p>
                  Échangez des messages instantanément avec d'autres utilisateurs
                  grâce à notre système de chat en temps réel !
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <FaUser />
                </div>
                <h3>Personnalisation</h3>
                <p>
                  Personnalisez votre profil avec une couleur unique qui vous
                  représente dans les conversations !
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;