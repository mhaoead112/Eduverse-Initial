import { useState, useEffect } from 'react';
import { GroupSidebar } from './GroupSidebar';
import { ChatArea } from './ChatArea';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Group, User } from '@shared/schema';

export function GroupChatLayout() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const { 
    socket, 
    isConnected, 
    joinGroup, 
    leaveGroup, 
    sendMessage,
    onlineUsers,
    messages,
    typingUsers 
  } = useWebSocket(user?.id);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  const handleGroupSelect = (group: Group) => {
    if (selectedGroup) {
      leaveGroup(selectedGroup.id);
    }
    setSelectedGroup(group);
    if (user) {
      joinGroup(group.id, user.id);
    }
  };

  const handleSendMessage = (content: string, messageType: string = 'text', metadata?: any) => {
    if (selectedGroup && user) {
      sendMessage({
        groupId: selectedGroup.id,
        userId: user.id,
        content,
        messageType,
        metadata
      });
    }
  };

  return (
    <div className="mx-4 mb-4 h-full luxury-card border-0 shadow-2xl overflow-hidden flex flex-col">
      {/* Offline Banner */}
      {!isConnected && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2" data-testid="offline-banner">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Connection lost. Attempting to reconnect...</span>
        </div>
      )}
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm border-r border-white/30 flex flex-col">
        <GroupSidebar
          user={user}
          selectedGroup={selectedGroup}
          onGroupSelect={handleGroupSelect}
          onlineUsers={onlineUsers}
          onLogout={logout}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <ChatArea
            group={selectedGroup}
            user={user}
            messages={messages[selectedGroup.id] || []}
            onSendMessage={handleSendMessage}
            typingUsers={typingUsers[selectedGroup.id] || []}
            isConnected={isConnected}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-luxury text-gray-700 mb-2">
                Welcome to EduVerse Group Chat
              </h2>
              <p className="text-gray-600 font-elegant">
                Select a group to start chatting with your classmates and teachers
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onLogin={login}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}