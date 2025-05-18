import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.initialized = false;
    this.callbacks = {
      newMessage: [],
      messageUpdated: [],
      messageDeleted: [],
      messages: [],
      connect: [],
      connectError: [],
      disconnect: []
    };
    this.backendUrl = 'http://localhost:3000';
  }

  getUserIdFromToken(token) {
    try {
      if (!token) return null;
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decoded = JSON.parse(jsonPayload);
      console.log("Décodage manuel du token:", decoded);
      return decoded.sub;
    } catch (error) {
      console.error('Erreur lors du décodage du token JWT:', error);
      return null;
    }
  }

  connect(token) {
    if (this.initialized) {
      console.log("Socket déjà initialisé");
      return this.socket;
    }
    
    if (!token) {
      console.error("Tentative de connexion socket sans token");
      return null;
    }

    this.userId = this.getUserIdFromToken(token);
    if (!this.userId) {
      console.error("Impossible d'extraire l'ID utilisateur du token");
      return null;
    }

    console.log(`Connexion WebSocket avec ID utilisateur: ${this.userId}`);

    try {
      this.socket = io(this.backendUrl, {
        auth: { token },
        extraHeaders: {
          Authorization: `Bearer ${token}`
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      this.initialized = true;

      // events de connexion
      this.socket.on('connect', () => {
        console.log('Socket connecté! Socket ID:', this.socket.id);
        this.callbacks.connect.forEach(cb => cb());
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erreur de connexion socket:', error);
        this.callbacks.connectError.forEach(cb => cb(error));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket déconnecté. Raison:', reason);
        this.callbacks.disconnect.forEach(cb => cb(reason));
      });

      // events de message
      this.socket.on('newMessage', (message) => {
        console.log('Nouveau message reçu:', message);
        this.callbacks.newMessage.forEach(cb => cb(message));
      });

      this.socket.on('messages', (messages) => {
        console.log('Messages historiques reçus:', messages?.length || 0);
        this.callbacks.messages.forEach(cb => cb(messages || []));
      });

      this.socket.on('messageUpdated', (message) => {
        console.log('Message mis à jour:', message);
        this.callbacks.messageUpdated.forEach(cb => cb(message));
      });

      this.socket.on('messageDeleted', (messageId) => {
        console.log('Message supprimé:', messageId);
        this.callbacks.messageDeleted.forEach(cb => cb(messageId));
      });

      return this.socket;
    } catch (error) {
      console.error("Erreur lors de la création du socket:", error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Déconnexion du socket');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.initialized = false;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  joinRoom(roomId) {
    console.log(`Tentative de rejoindre la salle ${roomId}`);
    if (!this.socket || !this.isConnected()) {
      console.error('Socket non connecté. Impossible de rejoindre la salle.');
      return;
    }
    this.socket.emit('joinRoom', roomId);
  }

  leaveRoom(roomId) {
    console.log(`Tentative de quitter la salle ${roomId}`);
    if (!this.socket || !this.isConnected()) {
      console.error('Socket non connecté. Impossible de quitter la salle.');
      return;
    }
    this.socket.emit('leaveRoom', roomId);
  }

  sendMessage(message) {
    if (!this.socket || !this.isConnected()) {
      console.error('Socket non connecté. Impossible d\'envoyer le message.');
      return;
    }

    if (!message.content || !message.roomId) {
      console.error('Message invalide:', message);
      return;
    }

    const messageData = {
      ...message,
      userId: this.userId
    };

    console.log('Envoi de message:', messageData);
    this.socket.emit('createMessage', messageData);
  }

  updateMessage(userId, message) {
    if (!this.socket || !this.isConnected()) {
      console.error('Socket non connecté. Impossible de mettre à jour le message.');
      return;
    }

    const updateData = {
      userId: this.userId,
      message
    };

    console.log('Mise à jour de message:', updateData);
    this.socket.emit('updateMessage', updateData);
  }

  deleteMessage(messageId, userId, roomId) {
    if (!this.socket || !this.isConnected()) {
      console.error('Socket non connecté. Impossible de supprimer le message.');
      return;
    }

    const deleteData = {
      id: messageId,
      userId: this.userId,
      roomId
    };

    console.log('Suppression de message:', deleteData);
    this.socket.emit('deleteMessage', deleteData);
  }

  // gestion des écouteurs d'événements
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (!this.callbacks[event]) return;
    
    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    } else {
      this.callbacks[event] = [];
    }
  }

  reset() {
    // deconnecte le socket s'il existe déjà
    if (this.socket) {
      console.log('Réinitialisation complète du socket');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.userId = null;
    this.initialized = false;
    
    // vide tous les callbacks
    for (const eventType in this.callbacks) {
      this.callbacks[eventType] = [];
    }
    
    console.log('Service socket réinitialisé avec succès');
  }
}

// singleton
const socketService = new SocketService();
export default socketService;