import { useState } from 'react';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import Picker from 'emoji-picker-react';

const MessageInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    setMessage((prevMessage) => prevMessage + emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <button
            type="button"
            className="emoji-btn"
            onClick={toggleEmojiPicker}
            disabled={disabled}
          >
            <FaSmile />
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <Picker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={disabled ? "Déconnecté du chat..." : "Écrivez votre message..."}
            onFocus={() => setShowEmojiPicker(false)}
            disabled={disabled}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!message.trim() || disabled}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
      {disabled && (
        <div className="connection-error-message">
          Connexion au serveur perdue. Veuillez rafraîchir la page.
        </div>
      )}
    </div>
  );
};

MessageInput.defaultProps = {
  disabled: false
};

export default MessageInput;