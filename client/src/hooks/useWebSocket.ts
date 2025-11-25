import { useState, useEffect, useRef } from 'react';
import type { GroupMessage, InsertGroupMessage } from '@shared/schema';

interface WSMessage {
  type: string;
  data: any;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  joinGroup: (groupId: string, userId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessage: (message: InsertGroupMessage) => void;
  sendTyping: (groupId: string, isTyping: boolean) => void;
  onlineUsers: string[];
  messages: Record<string, GroupMessage[]>;
  typingUsers: Record<string, string[]>;
}

export function useWebSocket(userId?: string): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Record<string, GroupMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!userId) return;

    const connectWebSocket = () => {
      try {
        // Use the correct WebSocket URL for the chat service
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setSocket(ws);
          
          // Clear reconnect timeout if connection is successful
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
        };

        ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setSocket(null);
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [userId]);

  const handleWebSocketMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'connection':
        console.log('WebSocket connection established:', message.data);
        break;
        
      case 'group_joined':
        console.log('Joined group:', message.data);
        break;
        
      case 'new_message':
        const newMessage = message.data as GroupMessage;
        setMessages(prev => ({
          ...prev,
          [newMessage.groupId]: [...(prev[newMessage.groupId] || []), newMessage]
        }));
        break;
        
      case 'typing_status':
        const { groupId, userId: typingUserId, isTyping } = message.data;
        setTypingUsers(prev => {
          const groupTyping = prev[groupId] || [];
          if (isTyping) {
            if (!groupTyping.includes(typingUserId)) {
              return {
                ...prev,
                [groupId]: [...groupTyping, typingUserId]
              };
            }
          } else {
            return {
              ...prev,
              [groupId]: groupTyping.filter(id => id !== typingUserId)
            };
          }
          return prev;
        });
        
        // Auto-clear typing status after 3 seconds
        if (isTyping) {
          if (typingTimeoutRef.current[`${groupId}-${typingUserId}`]) {
            clearTimeout(typingTimeoutRef.current[`${groupId}-${typingUserId}`]);
          }
          typingTimeoutRef.current[`${groupId}-${typingUserId}`] = setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [groupId]: (prev[groupId] || []).filter(id => id !== typingUserId)
            }));
          }, 3000);
        }
        break;
        
      case 'message_reaction':
        console.log('Message reaction:', message.data);
        // Handle reaction updates
        break;
        
      case 'new_poll':
        console.log('New poll:', message.data);
        break;
        
      case 'raise_hand_request':
        console.log('Raise hand request:', message.data);
        break;
        
      case 'user_joined':
      case 'user_left':
      case 'user_disconnected':
        // Update online users list
        break;
        
      case 'error':
        console.error('WebSocket error:', message.data);
        break;
        
      default:
        console.log('Unknown message type:', message.type, message.data);
    }
  };

  const sendWebSocketMessage = (type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const joinGroup = (groupId: string, userId: string) => {
    sendWebSocketMessage('join_group', { groupId, userId });
  };

  const leaveGroup = (groupId: string) => {
    sendWebSocketMessage('leave_group', { groupId });
  };

  const sendMessage = (message: InsertGroupMessage) => {
    sendWebSocketMessage('send_message', message);
  };

  const sendTyping = (groupId: string, isTyping: boolean) => {
    sendWebSocketMessage('typing', { groupId, isTyping });
  };

  return {
    socket,
    isConnected,
    joinGroup,
    leaveGroup,
    sendMessage,
    sendTyping,
    onlineUsers,
    messages,
    typingUsers
  };
}