import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Send, Paperclip, Search, Loader2,
  MessageCircle, Plus, Check, CheckCheck, MoreVertical,
  UserX, Flag, Phone, Video, Smile, Download,
  Settings, LogOut
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface DMConversation {
  conversationId: string;
  otherUser: User;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  type: 'text' | 'file';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  deliveredAt?: string;
}

// Sidebar navigation items
const sidebarItems = [
  { icon: "dashboard", label: "Dashboard", path: "/student/dashboard" },
  { icon: "school", label: "Courses", path: "/student/courses" },
  { icon: "bar_chart", label: "Grades", path: "/student/grades" },
  { icon: "chat", label: "Messages", path: "/student/messages", active: true },
  { icon: "settings", label: "Settings", path: "/settings" },
];

export default function DirectMessagesPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, sendMessage: wsSendMessage } = useWebSocket((data) => {
    handleWebSocketMessage(data);
  });

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("eduverse_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiEndpoint("/api/study-groups"), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error("Failed to fetch conversations");
      
      const allConversations = await response.json();
      const dms = allConversations
        .filter((conv: any) => conv.type === 'direct')
        .map((conv: any) => ({
          ...conv,
          conversationId: conv.conversationId || conv.id
        }));
      setConversations(dms);
      
      const userIds = dms.map((dm: any) => dm.otherUser?.id).filter(Boolean);
      if (userIds.length > 0) {
        fetchOnlineStatus(userIds);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(apiEndpoint("/api/users"), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error("Failed to fetch users");
      
      const users = await response.json();
      const otherUsers = users.filter((u: User) => u.id !== user?.id);
      setAllUsers(otherUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchOnlineStatus = async (userIds: string[]) => {
    try {
      const statuses = await Promise.all(
        userIds.map(userId =>
          fetch(apiEndpoint(`/api/study-groups/presence/${userId}`), {
            headers: getAuthHeaders()
          }).then(r => r.json()).catch(() => null)
        )
      );
      
      const online = new Set(
        statuses
          .filter(s => s && s.status === 'online')
          .map(s => s.userId)
      );
      setOnlineUsers(online);
    } catch (error) {
      console.error("Error fetching online status:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        apiEndpoint(`/api/study-groups/${conversationId}/messages`),
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(
        apiEndpoint(`/api/study-groups/${selectedConversation.conversationId}/messages`),
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "text",
            content: newMessage
          })
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      const sentMessage = await response.json();
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage("");

      if (isConnected) {
        wsSendMessage({
          type: "message",
          conversationId: selectedConversation.conversationId,
          message: sentMessage
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStartDM = async (targetUserId: string) => {
    try {
      const response = await fetch(
        apiEndpoint(`/api/study-groups/direct/${targetUserId}`),
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error("Failed to create DM");

      const data = await response.json();
      
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (targetUser) {
        const newConv: DMConversation = {
          conversationId: data.conversationId || data.id,
          otherUser: targetUser
        };
        setSelectedConversation(newConv);
        setShowNewDM(false);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error starting DM:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const response = await fetch(apiEndpoint('/api/notifications/block'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blockedUserId: userId })
      });

      if (!response.ok) throw new Error("Failed to block user");

      toast({
        title: "Success",
        description: "User blocked"
      });
      setShowBlockReport(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive"
      });
    }
  };

  const handleReportUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch(apiEndpoint('/api/notifications/report'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportedUserId: userId, reason })
      });

      if (!response.ok) throw new Error("Failed to report user");

      toast({
        title: "Success",
        description: "User reported"
      });
      setShowBlockReport(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to report user",
        variant: "destructive"
      });
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.conversationId === selectedConversation?.conversationId) {
          setMessages(prev => [...prev, data.message]);
        } else {
          fetchConversations();
        }
        break;
      case 'message_delivered':
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, deliveredAt: data.deliveredAt } : msg
        ));
        break;
      case 'presence_update':
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
        break;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    
    msgs.forEach(msg => {
      const msgDate = format(new Date(msg.createdAt), 'MMMM d, yyyy');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-amber-400 mb-4 block">chat</span>
          <p className="text-slate-300">Please sign in to view messages.</p>
          <Link href="/login">
            <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-['Spline_Sans',_sans-serif] flex">
      {/* Left Sidebar - Navigation */}
      <aside className="w-56 bg-slate-800/60 border-r border-slate-700/50 flex flex-col h-screen fixed left-0 top-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-900">school</span>
            </div>
            <span className="text-xl font-bold text-white">EduVerse</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {sidebarItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                  item.active
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.label === "Messages" && conversations.filter(c => c.unreadCount && c.unreadCount > 0).length > 0 && (
                  <span className="ml-auto bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {conversations.filter(c => c.unreadCount && c.unreadCount > 0).length}
                  </span>
                )}
              </button>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-700/50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-56 flex-1 flex h-screen">
        {/* Conversations List */}
        <div className="w-80 bg-slate-800/40 border-r border-slate-700/50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Messages</h2>
              <button
                onClick={() => setShowNewDM(true)}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all"
              >
                <Users className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Compose Button */}
          <div className="px-4 py-3">
            <button
              onClick={() => setShowNewDM(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl transition-all"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Compose New
            </button>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-16 w-16 mx-auto mb-3 text-slate-600" />
                <p className="font-medium text-slate-400">No conversations yet</p>
                <p className="text-sm text-slate-500 mt-1">Start a new conversation</p>
              </div>
            ) : (
              <div className="px-2">
                {filteredConversations.map((conv) => {
                  const isOnline = onlineUsers.has(conv.otherUser.id);
                  const isActive = selectedConversation?.conversationId === conv.conversationId;
                  
                  return (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-3 flex items-start gap-3 rounded-xl mb-1 transition-all ${
                        isActive 
                          ? 'bg-amber-500/20 border border-amber-500/30' 
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 border-2 border-slate-600">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {conv.otherUser.fullName?.substring(0, 2).toUpperCase() || conv.otherUser.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`font-semibold truncate ${isActive ? 'text-amber-300' : 'text-white'}`}>
                            {conv.otherUser.fullName}
                          </p>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {conv.lastMessage || `@${conv.otherUser.username}`}
                        </p>
                      </div>
                      
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <div className="flex-shrink-0 h-5 min-w-5 bg-amber-500 text-slate-900 text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-slate-900">
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-slate-600">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {selectedConversation.otherUser.fullName?.substring(0, 2).toUpperCase() || selectedConversation.otherUser.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.has(selectedConversation.otherUser.id) && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {selectedConversation.otherUser.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedConversation.otherUser.role === 'teacher' && 'Teacher • '}
                    {onlineUsers.has(selectedConversation.otherUser.id) ? (
                      <span className="text-emerald-400">Online</span>
                    ) : (
                      <span>Offline</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all">
                  <Video className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedUserForAction(selectedConversation.otherUser.id);
                    setShowBlockReport(true);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {groupMessagesByDate(messages).map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-6">
                      <div className="px-4 py-1.5 bg-slate-800/60 rounded-full">
                        <span className="text-xs text-slate-400 font-medium">
                          {group.date === format(new Date(), 'MMMM d, yyyy') ? 'Today' : group.date}
                        </span>
                      </div>
                    </div>

                    {/* Messages for this date */}
                    {group.messages.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {message.senderName?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                            {/* Text Message */}
                            {message.type === 'text' && message.content && (
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isOwn 
                                    ? 'bg-amber-500 text-slate-900 rounded-br-md' 
                                    : 'bg-slate-700/60 text-white rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {message.content}
                                </p>
                              </div>
                            )}

                            {/* File Message */}
                            {message.type === 'file' && message.fileName && (
                              <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600/50">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{message.fileName}</p>
                                    <p className="text-xs text-slate-400">{formatFileSize(message.fileSize)}</p>
                                  </div>
                                  {message.fileUrl && (
                                    <a
                                      href={message.fileUrl}
                                      download
                                      className="p-2 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all"
                                    >
                                      <Download className="h-5 w-5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Timestamp */}
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-slate-500">
                                {format(new Date(message.createdAt), 'h:mm a')}
                              </span>
                              {isOwn && (
                                message.deliveredAt ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-amber-400" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-slate-500" />
                                )
                              )}
                            </div>
                          </div>

                          {isOwn && (
                            <Avatar className="h-8 w-8 ml-2 flex-shrink-0 mt-1">
                              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 text-xs font-semibold">
                                {user?.fullName?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50 bg-slate-800/40">
              <div className="flex items-center gap-3 max-w-3xl mx-auto">
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type a message to ${selectedConversation.otherUser.fullName}...`}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all pr-12"
                    disabled={isSending}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 transition-all"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-slate-500 mt-2">Press Enter to send</p>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900/50">
            <div className="text-center">
              <MessageCircle className="h-20 w-20 mx-auto mb-4 text-slate-700" />
              <p className="text-lg font-medium text-slate-400">Select a conversation</p>
              <p className="text-sm text-slate-500 mt-1">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* New DM Dialog */}
      <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Start a Conversation</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose a user to start a direct message conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {allUsers
                  .filter(u => 
                    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((targetUser) => {
                    const isOnline = onlineUsers.has(targetUser.id);
                    return (
                      <button
                        key={targetUser.id}
                        onClick={() => handleStartDM(targetUser.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10 border-2 border-slate-600">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                              {targetUser.fullName?.substring(0, 2).toUpperCase() || targetUser.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-white">{targetUser.fullName}</p>
                          <p className="text-sm text-slate-400">@{targetUser.username}</p>
                        </div>
                        {isOnline && (
                          <span className="text-xs text-emerald-400 px-2 py-0.5 bg-emerald-500/20 rounded-full">Online</span>
                        )}
                      </button>
                    );
                  })}
                
                {allUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-slate-600" />
                    <p className="text-slate-400">No users available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block/Report Modal */}
      <Dialog open={showBlockReport} onOpenChange={setShowBlockReport}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">User Actions</DialogTitle>
            <DialogDescription className="text-slate-400">
              Block or report this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-300">
                <strong>Blocking</strong> will prevent this user from sending you messages.
              </p>
            </div>
            
            <Button
              variant="destructive"
              className="w-full gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              onClick={() => {
                if (selectedUserForAction) {
                  handleBlockUser(selectedUserForAction);
                }
              }}
            >
              <UserX className="h-4 w-4" />
              Block User
            </Button>

            <Separator className="bg-slate-700" />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Report User</label>
              <Textarea
                placeholder="Describe why you're reporting this user..."
                className="min-h-24 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500"
                id="report-reason"
              />
              <Button
                variant="outline"
                className="w-full gap-2 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                onClick={() => {
                  if (selectedUserForAction) {
                    const reason = (document.getElementById('report-reason') as HTMLTextAreaElement)?.value;
                    if (reason) {
                      handleReportUser(selectedUserForAction, reason);
                    }
                  }
                }}
              >
                <Flag className="h-4 w-4" />
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
