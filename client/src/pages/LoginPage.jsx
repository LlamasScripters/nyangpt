import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Auth/Login';
import Header from '../components/Layout/Header';

const LoginPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  return (
    <div className="page-container">
      <Header />
      <main className="main-content">
        <Login />
      </main>
    </div>
  );
};

export default LoginPage;