import React from 'react';
import { User } from '../types';

interface UserPresenceProps {
  users: User[];
  typingUsers: Set<string>;
}

const UserPresence: React.FC<UserPresenceProps> = ({ users, typingUsers }) => {
  const typingUsersList = users.filter(user => typingUsers.has(user.id));

  return (
    <div className="flex items-center gap-3">
      {/* User avatars */}
      <div className="flex items-center -space-x-2">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium ${
              typingUsers.has(user.id) ? 'animate-pulse' : ''
            }`}
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white text-sm font-medium">
            +{users.length - 5}
          </div>
        )}
      </div>

      {/* Typing indicators */}
      {typingUsersList.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>
            {typingUsersList.length === 1 
              ? `${typingUsersList[0].name} is typing...`
              : `${typingUsersList.length} users are typing...`
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default UserPresence;