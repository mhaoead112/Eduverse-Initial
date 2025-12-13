import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Send, Smile, Paperclip, Phone, Video,
  MoreVertical, Hash, Lock, Users, X, Plus, MessageCircle,
  FileText, Download, Image as ImageIcon
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiEndpoint, assetUrl } from '@/lib/config';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  conversationId?: string;
  isPrivate?: boolean;
  unreadCount?: number;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface DirectMessage {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  isOnline: boolean;
  conversationId?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderProfilePicture?: string;
  content?: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

export default function StudyGroupsChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'channels'>('all');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversationType, setConversationType] = useState<'group' | 'dm'>('group');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isConnected, sendMessage: wsSendMessage } = useWebSocket((data) => {
    handleWebSocketMessage(data);
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("eduverse_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchStudyGroups();
    fetchDirectMessages();
  }, []);

  useEffect(() => {
    if (selectedConversation?.conversationId) {
      fetchMessages(selectedConversation.conversationId);
      wsSendMessage({
        type: 'join',
        conversationId: selectedConversation.conversationId
      });
    }

    return () => {
      if (selectedConversation?.conversationId) {
        wsSendMessage({
          type: 'leave',
          conversationId: selectedConversation.conversationId
        });
      }
    };
  }, [selectedConversation?.conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'new_message' && data.message?.conversationId === selectedConversation?.conversationId) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const fetchStudyGroups = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!Object.keys(authHeaders).length) return;

      const response = await fetch(apiEndpoint("/api/study-groups"), {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setStudyGroups(data);
      }
    } catch (error) {
      console.error("Error fetching study groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!Object.keys(authHeaders).length) return;

      const response = await fetch(apiEndpoint("/api/conversations/direct"), {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setDirectMessages(data);
      }
    } catch (error) {
      console.error("Error fetching DMs:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const authHeaders = getAuthHeaders();
      if (!Object.keys(authHeaders).length) return;

      const response = await fetch(apiEndpoint(`/api/conversations/${conversationId}/messages`), {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?.conversationId || isSending) return;

    setIsSending(true);
    try {
      const authHeaders = getAuthHeaders();
      if (!Object.keys(authHeaders).length) return;

      const response = await fetch(apiEndpoint(`/api/conversations/${selectedConversation.conversationId}/messages`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          type: "text",
          content: newMessage
        })
      });

      if (response.ok) {
        setNewMessage("");
        const message = await response.json();
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const selectConversation = (item: any, type: 'group' | 'dm') => {
    setSelectedConversation(item);
    setConversationType(type);
    setMessages([]);
  };

  const filteredGroups = studyGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDMs = directMessages.filter(dm => 
    dm.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-80px)] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50">
        {/* Left Sidebar - Conversations List */}
        <div className="w-[280px] border-r border-slate-700/50 flex flex-col bg-slate-900">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                <Users className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-yellow-500/50"
              />
            </div>

            {/* Compose New Button */}
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold rounded-xl h-10">
              <Plus className="h-4 w-4 mr-2" />
              Compose New
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {/* Direct Messages */}
              {filteredDMs.map(dm => (
                <button
                  key={dm.id}
                  onClick={() => selectConversation(dm, 'dm')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors mb-1 ${
                    selectedConversation?.id === dm.id ? 'bg-slate-800/80 border border-slate-700/50' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-11 w-11 border-2 border-slate-700">
                      <AvatarImage 
                        src={dm.profilePicture ? assetUrl(dm.profilePicture) : ''} 
                        alt={dm.fullName} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                        {dm.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || dm.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {dm.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-white truncate">
                        {dm.fullName}
                      </p>
                      {dm.lastMessageTime && (
                        <span className="text-xs text-slate-500 ml-2">
                          {formatTime(dm.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {dm.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {dm.lastMessage}
                      </p>
                    )}
                  </div>
                  {dm.unreadCount ? (
                    <Badge className="h-5 min-w-[20px] p-0 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full">
                      {dm.unreadCount}
                    </Badge>
                  ) : null}
                </button>
              ))}

              {/* Study Groups/Channels */}
              {filteredGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => selectConversation(group, 'group')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors mb-1 ${
                    selectedConversation?.id === group.id ? 'bg-slate-800/80 border border-slate-700/50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="h-11 w-11 rounded-full bg-slate-700/50 flex items-center justify-center border-2 border-slate-600">
                      {group.isPrivate ? (
                        <Lock className="h-5 w-5 text-slate-400" />
                      ) : (
                        <Hash className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-white truncate">
                        {group.name}
                      </p>
                      {group.lastMessageTime && (
                        <span className="text-xs text-slate-500 ml-2">
                          {formatTime(group.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {group.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {group.lastMessage}
                      </p>
                    )}
                  </div>
                  {group.unreadCount ? (
                    <Badge className="h-5 min-w-[20px] p-0 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full">
                      {group.unreadCount}
                    </Badge>
                  ) : null}
                </button>
              ))}

              {/* Empty State */}
              {filteredGroups.length === 0 && filteredDMs.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No conversations found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-slate-900/50">
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-700/50 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {conversationType === 'group' ? (
                  <div className="h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600">
                    {selectedConversation.isPrivate ? (
                      <Lock className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Hash className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-slate-700">
                      <AvatarImage 
                        src={selectedConversation.profilePicture ? assetUrl(selectedConversation.profilePicture) : ''} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {selectedConversation.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || selectedConversation.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-white">
                    {conversationType === 'group' ? selectedConversation.name : selectedConversation.fullName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {conversationType === 'group' 
                      ? `${selectedConversation.memberCount} members`
                      : selectedConversation.isOnline 
                        ? <span className="text-emerald-400">Online</span>
                        : 'Offline'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800">
                  <Video className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Date Divider */}
            <div className="flex items-center justify-center py-4">
              <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full">
                Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 pb-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user?.id;
                  const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== message.senderId);
                  const showTime = index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId;

                  return (
                    <div 
                      key={message.id} 
                      className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwnMessage && (
                        <Avatar className={`h-8 w-8 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                          <AvatarImage 
                            src={message.senderProfilePicture ? assetUrl(message.senderProfilePicture) : ''} 
                            alt={message.senderName} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {message.senderName?.split(' ').map(n => n[0]).join('').toUpperCase() || message.senderUsername.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-first' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isOwnMessage
                              ? 'bg-teal-600 text-white rounded-tr-sm'
                              : 'bg-slate-800 text-white rounded-tl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                          {/* File attachment example (if message has file) */}
                          {message.type === 'file' && message.fileUrl && (
                            <div className="mt-2 bg-slate-900/50 rounded-xl p-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-red-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{message.fileName || 'Document'}</p>
                                <p className="text-xs text-slate-400">PDF</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {showTime && (
                          <p className={`text-[10px] text-slate-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        )}
                      </div>

                      {isOwnMessage && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs">
                            {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ME'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-slate-700/50 p-4 bg-slate-900/80 backdrop-blur-sm">
              <form onSubmit={handleSendMessage}>
                <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />

                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type a message to ${conversationType === 'group' ? selectedConversation.name : selectedConversation.fullName}...`}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-white placeholder:text-slate-500"
                  />

                  <Button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-600 text-center mt-2">Press Enter to send</p>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900/50">
            <div className="text-center text-slate-500">
              <MessageCircle className="h-24 w-24 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
              <MessageCircle className="h-24 w-24 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}

        {/* Right Sidebar - Info Panel */}
        {showRightPanel && selectedConversation && (
          <div className="w-[320px] border-l border-slate-700/50 bg-slate-900">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {conversationType === 'group' ? 'Photos & Videos' : 'Details'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => setShowRightPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-160px)]">
              {conversationType === 'group' ? (
                <div className="p-4 space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-3">Photos & Videos <span className="text-slate-500">23</span></p>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square bg-slate-800 rounded-xl border border-slate-700/50" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-3">Shared Links <span className="text-slate-500">3</span></p>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                          <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Hash className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              Figma Component Best Practices
                            </p>
                            <p className="text-xs text-slate-500 truncate">www.figma.com</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-3">Members <span className="text-slate-500">24</span></p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 px-2 py-1">Online</p>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                JC
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">Jane Cooper</p>
                            <Badge variant="secondary" className="text-[10px] bg-slate-700/50 text-slate-400">Mentor</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center mb-6">
                    <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-slate-700">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                        {selectedConversation.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-white">{selectedConversation.fullName}</h3>
                    <p className="text-sm text-slate-400">@{selectedConversation.username}</p>
                    {selectedConversation.isOnline && (
                      <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-0">Online</Badge>
                    )}
                  </div>

                  {/* Shared Media Section */}
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-3">Shared Files</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">Final_Rubric_Fall2023.pdf</p>
                          <p className="text-xs text-slate-500">2.4 MB</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
