// src/contexts/ChatContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';
import { roomService } from '../services/api';

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { currentUser, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    let isInitialized = false;
    
    const initializeChat = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      //console.log("Initialisation du chat...");
      
      if (!token) {
        //console.log("Pas de token, pas d'initialisation du chat");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Chargement des salles...");
        setLoading(true);
        const roomsData = await roomService.getAllRooms();
        console.log("Salles chargées:", roomsData);
        setRooms(roomsData);
        
        const handleConnect = () => {
          console.log("Socket connecté!");
          setConnected(true);
        };
        
        const handleDisconnect = () => {
          console.log("Socket déconnecté");
          setConnected(false);
        };
        
        const handleConnectError = (error) => {
          console.error("Erreur de connexion socket:", error);
          setError("Impossible de se connecter au serveur de chat");
        };
        
        const handleNewMessage = (message) => {
          console.log("Nouveau message reçu:", message);
          setMessages(prev => [...prev, message]);
        };
        
        const handleMessages = (roomMessages) => {
          console.log(`${roomMessages.length} messages reçus`);
          setMessages(roomMessages);
        };
        
        socketService.on('connect', handleConnect);
        socketService.on('disconnect', handleDisconnect);
        socketService.on('connectError', handleConnectError);
        socketService.on('newMessage', handleNewMessage);
        socketService.on('messages', handleMessages);
        
        socketService.connect(token);
        
        setLoading(false);
        
        return () => {
          console.log("Nettoyage du ChatContext");
          socketService.disconnect();
          socketService.off('connect');
          socketService.off('disconnect');
          socketService.off('connectError');
          socketService.off('newMessage');
          socketService.off('messages');
        };
      } catch (err) {
        console.error("Erreur d'initialisation du chat:", err);
        setError("Erreur lors du chargement des salles");
        setLoading(false);
      }
    };
    
    initializeChat();
  }, [token]);

  const joinRoom = async (roomId) => {
    try {
      if (activeRoom) {
        socketService.leaveRoom(activeRoom.id);
      }

      const room = await roomService.getRoomById(roomId);
      setActiveRoom(room);
      socketService.joinRoom(roomId);
    } catch (err) {
      console.error('Erreur lors de la connexion à la salle:', err);
      setError('Impossible de rejoindre la salle de discussion');
    }
  };

  const leaveRoom = () => {
    if (activeRoom) {
      socketService.leaveRoom(activeRoom.id);
      setActiveRoom(null);
      setMessages([]);
    }
  };

  const sendMessage = (content) => {
    if (!content.trim() || !currentUser || !activeRoom) return;

    const newMessage = {
      content,
      roomId: activeRoom.id,
    };

    socketService.sendMessage(newMessage);
  };

  const createRoom = async (roomData) => {
    try {
      const createdRoom = await roomService.createRoom(roomData);
      setRooms([...rooms, createdRoom]);
      return createdRoom;
    } catch (err) {
      console.error('Erreur lors de la création de la salle:', err);
      setError('Impossible de créer la salle de discussion');
      throw err;
    }
  };

  const refreshRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await roomService.getAllRooms();
      setRooms(roomsData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des salles:', err);
      setError('Impossible de rafraîchir les salles');
      setLoading(false);
    }
  };

  const value = {
    rooms,
    activeRoom,
    messages,
    loading,
    error,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    createRoom,
    refreshRooms,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};