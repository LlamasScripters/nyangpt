import { useMemo } from 'react';
import Message from './Message';

const MessageList = ({ messages, currentUser }) => {
  const groupedMessages = useMemo(() => {
    if (!messages.length) return [];

    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    sortedMessages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      const messageDay = messageDate.toLocaleDateString();

      if (messageDay !== currentDate) {
        currentDate = messageDay;
        currentGroup = { date: messageDate, messages: [] };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(message);
    });

    return groups;
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="no-messages">
        <p>Aucun message dans cette conversation. Soyez le premier à écrire !</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="message-group">
          <div className="date-separator">
            <span>{formatDate(group.date)}</span>
          </div>
          
          {group.messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isCurrentUser={message.userId === currentUser?.id}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDate = new Date(date);
  
  if (messageDate.toDateString() === today.toDateString()) {
    return 'Aujourd\'hui';
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  } else {
    return messageDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
};

export default MessageList;