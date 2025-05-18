import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { roomService } from '../../services/api';
import { FaPlus, FaUsers } from 'react-icons/fa';

const Sidebar = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', description: '' });
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsData = await roomService.getAllRooms();
        setRooms(roomsData);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des salles:', err);
        setError('Impossible de charger les salles');
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomData.name.trim()) return;

    try {
      const createdRoom = await roomService.createRoom(newRoomData);
      setRooms([...rooms, createdRoom]);
      setNewRoomData({ name: '', description: '' });
      setShowNewRoomForm(false);
      navigate(`/chat/${createdRoom.id}`);
    } catch (err) {
      console.error('Erreur lors de la création de la salle:', err);
      setError('Impossible de créer la salle');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoomData({ ...newRoomData, [name]: value });
  };

  if (loading) {
    return <div className="sidebar-loading">Chargement...</div>;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Salles de discussion</h3>
        <button
          className="new-room-btn"
          onClick={() => setShowNewRoomForm(!showNewRoomForm)}
        >
          <FaPlus /> Nouvelle salle
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showNewRoomForm && (
        <div className="new-room-form">
          <form onSubmit={handleCreateRoom}>
            <div className="form-group">
              <label htmlFor="roomName">Nom de la salle</label>
              <input
                type="text"
                id="roomName"
                name="name"
                value={newRoomData.name}
                onChange={handleInputChange}
                placeholder="Nom de la salle"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="roomDescription">Description (optionnelle)</label>
              <textarea
                id="roomDescription"
                name="description"
                value={newRoomData.description}
                onChange={handleInputChange}
                placeholder="Description de la salle"
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="create-btn">
                Créer
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowNewRoomForm(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rooms-list">
        {rooms.length === 0 ? (
          <div className="no-rooms">
            <p>Aucune salle disponible</p>
          </div>
        ) : (
          <ul>
            {rooms.map((room) => (
              <li key={room.id} className={roomId === room.id ? 'active' : ''}>
                <Link to={`/chat/${room.id}`}>
                  <FaUsers className="room-icon" />
                  <div className="room-info">
                    <span className="room-name">{room.name}</span>
                    {room.description && (
                      <span className="room-description">{room.description}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;