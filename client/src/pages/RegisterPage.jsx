import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Register from '../components/Auth/Register';
import Header from '../components/Layout/Header';

const RegisterPage = () => {
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
        <Register />
      </main>
    </div>
  );
};

export default RegisterPage;