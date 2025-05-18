import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket';
import axios from 'axios';

const Message = ({ message, isCurrentUser }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { currentUser, token } = useAuth();
  const [userInfo, setUserInfo] = useState(message.user || null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (message.user && message.user.username) {
        setUserInfo(message.user);
        return;
      }
      
      if (message.userId === currentUser?.id) {
        setUserInfo(currentUser);
        return;
      }
      
      try {
        const response = await axios.get(`/api/users/${message.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data) {
          setUserInfo(response.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des infos utilisateur:", error);
      }
    };
    
    fetchUserInfo();
  }, [message.userId, message.user, currentUser, token]);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      socketService.deleteMessage(message.id, currentUser.id, message.roomId);
    }
    setShowOptions(false);
  };

  const submitEdit = () => {
    if (editContent.trim() === '') return;
    
    socketService.updateMessage(currentUser.id, {
      id: message.id,
      content: editContent,
    });
    
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`message ${isCurrentUser ? 'own-message' : ''}`}>
        <div className="message-header">
          <span className="username" style={{ color: userInfo?.color || '#000000' }}>
            {userInfo?.username || 'Utilisateur inconnu'}
          </span>
          <span className="timestamp">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <div className="message-edit">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="edit-actions">
            <button onClick={submitEdit} className="save-btn">
              Enregistrer
            </button>
            <button onClick={cancelEdit} className="cancel-btn">
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${isCurrentUser ? 'own-message' : ''}`}>
      <div className="message-header">
        <span className="username" style={{ color: userInfo?.color || '#000000' }}>
          {userInfo?.username || 'Utilisateur inconnu'}
        </span>
        <span className="timestamp">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: fr })}
        </span>
        {isCurrentUser && (
          <div className="message-options">
            <button onClick={toggleOptions} className="options-btn">
              <FaEllipsisV />
            </button>
            {showOptions && (
              <div className="options-menu">
                <button onClick={handleEdit} className="option-item">
                  <FaEdit /> Modifier
                </button>
                <button onClick={handleDelete} className="option-item">
                  <FaTrash /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default Message;