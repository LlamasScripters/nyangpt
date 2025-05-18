import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ColorPicker from './ColorPicker';

const ProfileSettings = () => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    color: '#000000',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        color: currentUser.color || '#000000',
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleColorChange = (color) => {
    setFormData({ ...formData, color });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        username: formData.username,
        color: formData.color,
      };
      
      if (formData.email && formData.email !== currentUser.email) {
        updateData.email = formData.email;
      }
      
      await updateProfile(updateData);
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="profile-settings">
      <h2>Paramètres du profil</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email <small>(optionnel)</small></label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Laissez vide pour ne pas modifier"
          />
        </div>
        <div className="form-group">
          <label>Couleur personnalisée</label>
          <ColorPicker color={formData.color} onChange={handleColorChange} />
        </div>
        <div className="color-preview" style={{ backgroundColor: formData.color }}>
          <span style={{ color: getContrastColor(formData.color) }}>
            Exemple de texte avec votre couleur
          </span>
        </div>
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
};

const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default ProfileSettings;