import axios from 'axios';

// instance axios avec le proxy
const api = axios.create({
  baseURL: '/api', // utilisation du proxy configuré => vite.config.js
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    try {
      console.log(`Préparation requête ${config.method?.toUpperCase()} ${config.url}`);
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token ajouté à la requête');
      } else {
        console.log('Pas de token disponible');
      }
      return config;
    } catch (error) {
      console.error('Erreur dans l\'intercepteur de requête:', error);
      return config;
    }
  },
  (error) => {
    console.error('Erreur lors de la configuration de la requête:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`Réponse reçue (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Erreur API détaillée:', error);
    if (error.response) {
      console.error(`Réponse d'erreur (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('Pas de réponse reçue du serveur, vérifiez la connexion réseau ou le proxy:', error.request);
    } else {
      console.error('Erreur de configuration avant envoi de la requête:', error.message);
    }
    return Promise.reject(error);
  }
);

export const userService = {
  register: async (userData) => {
    try {
      console.log('Envoi de données d\'inscription:', userData);
      const response = await api.post('/users', userData);
      console.log('Réponse d\'inscription:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
    }
  },

  login: async (credentials) => {
    try {
      console.log('Tentative de connexion:', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('Réponse de connexion:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error.response?.data || { message: 'Erreur de connexion' };
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  updateProfile: async (userId, userData) => {
    try {
      const response = await api.patch(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  },
};

// service salles de chat
export const roomService = {
  // création nouvelle salle
  createRoom: async (roomData) => {
    try {
      console.log('Tentative de création de salle:', roomData);
      const response = await api.post('/rooms', roomData);
      console.log('Salle créée:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error);
      throw error.response?.data || { message: 'Erreur lors de la création de la salle' };
    }
  },

  // récupère toutes les salles
  getAllRooms: async () => {
    try {
      console.log('Récupération de toutes les salles...');
      const response = await api.get('/rooms');
      console.log('Salles récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des salles:', error);
      return [];
    }
  },

  // récupère une salle
  getRoomById: async (roomId) => {
    try {
      console.log(`Récupération de la salle ${roomId}...`);
      const response = await api.get(`/rooms/${roomId}`);
      console.log('Salle récupérée:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la salle ${roomId}:`, error);
      throw error.response?.data || { message: 'Erreur lors de la récupération de la salle' };
    }
  },

  // maj d'une salle
  updateRoom: async (roomId, roomData) => {
    try {
      const response = await api.patch(`/rooms/${roomId}`, roomData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la salle:', error);
      throw error.response?.data || { message: 'Erreur lors de la mise à jour de la salle' };
    }
  },

  // supression d'une salle
  deleteRoom: async (roomId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la salle:', error);
      throw error.response?.data || { message: 'Erreur lors de la suppression de la salle' };
    }
  },
};

// service messages
export const messageService = {
  // récupère les messages d'une salle
  getMessagesByRoom: async (roomId) => {
    try {
      const response = await api.get(`/messages/room/${roomId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des messages de la salle ${roomId}:`, error);
      return [];
    }
  },
};

export default api;