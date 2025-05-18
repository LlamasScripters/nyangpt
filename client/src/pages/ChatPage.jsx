import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import ChatRoom from '../components/Chat/ChatRoom';
import { roomService } from '../services/api';

const ChatPage = () => {
  const { currentUser, loading: authLoading, token } = useAuth();
  const { rooms, loading: roomsLoading, refreshRooms } = useChat();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);
  const [noRooms, setNoRooms] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // console.log("ChatPage - Auth loading:", authLoading);
  console.log("ChatPage - Current user:", currentUser);
  // console.log("ChatPage - Token existe:", !!token);
  // console.log("ChatPage - Rooms loading:", roomsLoading);
  // console.log("ChatPage - Rooms count:", rooms?.length);

  useEffect(() => {
    if (!authLoading && !token) {
      console.log("Pas de token, redirection vers /login");
      navigate('/login');
    }
  }, [token, authLoading, navigate]);

  useEffect(() => {
    if (roomsLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [roomsLoading]);

  useEffect(() => {
    const createDefaultRoom = async () => {
      if (!roomsLoading && rooms.length === 0 && token && !noRooms) {
        try {
          console.log("Aucune salle trouvée, création d'une salle par défaut");
          setNoRooms(true);
          
          const defaultRoom = {
            name: "Général",
            description: "Salle de discussion générale"
          };
          
          const createdRoom = await roomService.createRoom(defaultRoom);
          console.log("Salle par défaut créée:", createdRoom);
          
          await refreshRooms();
          
          navigate(`/chat/${createdRoom.id}`);
        } catch (error) {
          console.error("Erreur lors de la création de la salle par défaut:", error);
        }
      }
    };
    
    createDefaultRoom();
  }, [rooms, roomsLoading, token, navigate, refreshRooms, noRooms]);

  useEffect(() => {
    if (!roomsLoading && rooms.length > 0 && !roomId && initialLoad) {
      console.log("Redirection vers la première salle:", rooms[0].id);
      navigate(`/chat/${rooms[0].id}`);
      setInitialLoad(false);
    }
  }, [roomId, rooms, roomsLoading, navigate, initialLoad]);

  if (authLoading || (roomsLoading && !loadingTimeout)) {
    return (
      <div className="page-container">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  if (loadingTimeout) {
    return (
      <div className="page-container">
        <Header />
        <div className="error-container">
          <h2>Problème de chargement</h2>
          <p>Le chargement des salles prend plus de temps que prévu. Vérifiez votre connexion ou réessayez plus tard.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Rafraîchir la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="chat-container">
        <Sidebar />
        <main className="chat-content">
          {roomId ? (
            <ChatRoom forceToken={token} />
          ) : rooms.length === 0 ? (
            <div className="no-room-selected">
              <p>Aucune salle disponible. Une salle par défaut sera créée automatiquement.</p>
            </div>
          ) : (
            <div className="no-room-selected">
              <p>Sélectionnez une salle de discussion pour commencer à chatter</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;