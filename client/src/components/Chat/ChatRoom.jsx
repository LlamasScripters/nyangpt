import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import socketService from '../../services/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatRoom = () => {
  const { roomId } = useParams();
  const { currentUser, token } = useAuth();
  const { connected } = useChat();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    let mounted = true;
    
    const initRoom = async () => {
      try {
        if (!token) {
          setError('Vous devez être connecté pour accéder au chat');
          navigate('/login');
          return;
        }
        
        if (!roomId) {
          setError('Aucune salle sélectionnée');
          return;
        }
        
        setLoading(true);
        
        // changement infos de la salle
        try {
          const response = await fetch(`/api/rooms/${roomId}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Salle introuvable');
          }
          
          const roomData = await response.json();
          if (mounted) {
            setRoom(roomData);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la salle:", error);
          if (mounted) {
            setError('Erreur lors du chargement de la salle');
          }
          return;
        }
        
        // config des écouteurs pour les messages
        const handleMessages = (roomMessages) => {
          console.log(`${roomMessages.length} messages reçus`);
          if (mounted) {
            setMessages(roomMessages);
          }
        };
        
        const handleNewMessage = (message) => {
          console.log("Nouveau message reçu:", message);
          if (mounted && message.roomId === roomId) {
            setMessages(prev => [...prev, message]);
          }
        };
        
        const handleMessageUpdated = (updatedMessage) => {
          if (mounted && updatedMessage.roomId === roomId) {
            setMessages(prev => 
              prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
            );
          }
        };
        
        const handleMessageDeleted = (messageId) => {
          if (mounted) {
            setMessages(prev => prev.filter(m => m.id !== messageId));
          }
        };
        
        socketService.on('messages', handleMessages);
        socketService.on('newMessage', handleNewMessage);
        socketService.on('messageUpdated', handleMessageUpdated);
        socketService.on('messageDeleted', handleMessageDeleted);
        
        // join la salle
        socketService.joinRoom(roomId);
        
        if (mounted) {
          setLoading(false);
        }
        
        return () => {
          mounted = false;
          socketService.leaveRoom(roomId);
          socketService.off('messages', handleMessages);
          socketService.off('newMessage', handleNewMessage);
          socketService.off('messageUpdated', handleMessageUpdated);
          socketService.off('messageDeleted', handleMessageDeleted);
        };
      } catch (error) {
        console.error("Erreur critique dans ChatRoom:", error);
        if (mounted) {
          setError('Une erreur est survenue');
          setLoading(false);
        }
      }
    };
    
    initRoom();
    
    return () => {
      mounted = false;
    };
  }, [roomId, token, navigate]); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (content) => {
    if (!content.trim() || !roomId) {
      console.error("Impossible d'envoyer le message: contenu vide ou roomId manquant");
      return;
    }

    if (!connected) {
      console.error("Impossible d'envoyer le message: socket non connecté");
      setError("Connexion au serveur de chat perdue. Veuillez rafraîchir la page.");
      return;
    }
    
    const newMessage = {
      content,
      roomId,
    };

    // console.log("Tentative d'envoi de message:", newMessage);
    socketService.sendMessage(newMessage);
  };

  const handleReconnect = () => {
    window.location.reload();
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Erreur</h3>
        <p>{error}</p>
        <button onClick={handleReconnect} className="retry-btn">
          Rafraîchir
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="error-container">
        <h3>Salle introuvable</h3>
        <p>La salle de discussion que vous cherchez n'existe pas.</p>
        <button onClick={() => navigate('/chat')} className="retry-btn">
          Retour aux salles
        </button>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>{room.name}</h2>
        {room.description && <p>{room.description}</p>}
        <div className={`connection-status ${connected ? 'success' : 'error'}`}>
          {connected ? 'Connecté' : 'Déconnecté du serveur de chat'}
          {!connected && (
            <button onClick={handleReconnect} className="reconnect-btn">
              Reconnecter
            </button>
          )}
        </div>
      </div>
      
      <MessageList 
        messages={messages} 
        currentUser={currentUser} 
      />
      
      <div ref={messagesEndRef} />
      
      <MessageInput 
        onSendMessage={sendMessage} 
        disabled={!connected}
      />
    </div>
  );
};

export default ChatRoom;