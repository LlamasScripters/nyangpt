import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  
  // Fonction utilitaire pour extraire l'information du token
  const parseToken = (token) => {
    try {
      if (!token) return null;
      
      // Extraire les parties du token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  };

  // Créer un utilisateur minimal à partir des données du token
  const createUserFromToken = (tokenData) => {
    return {
      id: tokenData.sub,
      username: tokenData.username,
      // Ajouter d'autres propriétés par défaut si nécessaire
      color: '#000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Vérifier si le token n'est pas expiré
          const decoded = parseToken(token);
          
          if (!decoded) {
            throw new Error("Token invalide");
          }
          
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // console.log("Token expiré");
            localStorage.removeItem('token');
            localStorage.removeItem('user'); 
            setToken(null);
            setCurrentUser(null);
          } else {
            // console.log("Token valide");
            // Récupérer l'utilisateur depuis localStorage
            const savedUser = JSON.parse(localStorage.getItem('user'));
            
            if (savedUser) {
              // console.log("Utilisateur trouvé dans localStorage:", savedUser);
              setCurrentUser(savedUser);
            } else {
              // console.log("Création d'un utilisateur à partir du token");
              const miniUser = createUserFromToken(decoded);
              setCurrentUser(miniUser);
              localStorage.setItem('user', JSON.stringify(miniUser));
            }
          }
        } catch (error) {
          console.error('Erreur d\'authentification détaillée:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
  
    initAuth();
  }, [token]);

  const register = async (userData) => {
    try {
      const response = await axios.post(`/api/users`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
    }
  };

  const login = async (credentials) => {
    try {
      // console.log("Tentative de connexion avec:", credentials);
      const response = await axios.post(`/api/auth/login`, credentials);
      // console.log("Réponse de connexion:", response.data);
      
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error("Token manquant dans la réponse");
      }
      
      localStorage.setItem('token', token);
      
      // Si l'utilisateur est fourni dans la réponse, l'utiliser
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        // Sinon, créer un utilisateur à partir du token
        const decoded = parseToken(token);
        const miniUser = createUserFromToken(decoded);
        localStorage.setItem('user', JSON.stringify(miniUser));
        setCurrentUser(miniUser);
      }
      
      setToken(token);
      return user;
    } catch (error) {
      console.error("Erreur de connexion complète:", error);
      throw error.response?.data || { message: 'Erreur de connexion' };
    }
  };

  const logout = () => {
    // console.log("Déconnexion de l'utilisateur:", currentUser?.username);
    
    socketService.reset();
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setToken(null);
    setCurrentUser(null);
    
    //console.log("Déconnexion terminée, socket réinitialisé");
  };

  const updateProfile = async (userData) => {
    try {
      if (!currentUser?.id) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Construire l'objet de mise à jour avec seulement les champs fournis
      const updateData = {};
      
      // N'inclure que les champs qui ont été fournis
      if (userData.username) updateData.username = userData.username;
      if (userData.color) updateData.color = userData.color;
      if (userData.email) updateData.email = userData.email;
      
      //console.log("Envoi de la mise à jour du profil:", updateData);
      
      const response = await axios.patch(
        `/api/users/${currentUser.id}`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = response.data;
      
      // Fusionner les nouvelles données avec les anciennes pour conserver les champs non modifiés
      const mergedUser = { ...currentUser, ...updatedUser };
      
      setCurrentUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));
      return mergedUser;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du profil' };
    }
  };

  const value = {
    currentUser,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};