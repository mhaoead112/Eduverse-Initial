import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import { Send, Bot, User, Sparkles, GraduationCap, Zap, Heart, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  lessonId?: string;
  lessonTitle?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  response?: string;
  isUser?: boolean;
  persona?: string;
}

// Persona definitions with avatars and colors
const PERSONAS = {
  alex: {
    id: 'alex',
    name: 'Alex',
    subtitle: 'The Fun Learner',
    emoji: '🎮',
    icon: Zap,
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    description: 'Makes learning fun with jokes & pop-culture!',
  },
  doctor: {
    id: 'doctor',
    name: 'Dr. Focus',
    subtitle: 'The Academic',
    emoji: '🎓',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    description: 'Structured, detailed & methodical approach',
  },
  coach: {
    id: 'coach',
    name: 'Coach Inspire',
    subtitle: 'The Motivator',
    emoji: '💪',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    description: 'Your personal cheerleader & motivator!',
  }
};

type PersonaKey = keyof typeof PERSONAS;

export const StudyBuddyChat: React.FC<Props> = ({ lessonId, lessonTitle }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('alex');
  const [showPersonaSelector, setShowPersonaSelector] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentPersona = PERSONAS[selectedPersona];

  useEffect(() => {
    // Welcome message contextualized to lesson and persona
    const persona = PERSONAS[selectedPersona];
    const welcomeMessages: Record<PersonaKey, string> = {
      alex: `Hey there! 🎮 I'm Alex, your fun study buddy! Let's make "${lessonTitle || "this lesson"}" super interesting! Got questions? Hit me up! 🚀`,
      doctor: `Good day. I'm Dr. Focus. I'll help you understand "${lessonTitle || "this lesson"}" with clear, structured explanations. What would you like to explore?`,
      coach: `YOU'VE GOT THIS! 💪 I'm Coach Inspire, and together we'll conquer "${lessonTitle || "this lesson"}"! What's on your mind, champion?`
    };
    
    const welcome: ChatMessage = {
      id: "welcome",
      message: welcomeMessages[selectedPersona],
      isUser: false,
      persona: selectedPersona,
    };
    setMessages([welcome]);
    setShowPersonaSelector(true);
  }, [lessonId, lessonTitle, selectedPersona]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setShowPersonaSelector(false);

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      message: inputMessage, 
      isUser: true 
    };
    
    setMessages((s) => [...s, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("eduverse_token");
      const response = await fetch(apiEndpoint("/api/ai-chat/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: inputMessage,
          lessonId: lessonId,
          persona: selectedPersona
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to get response");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: data.answer || "",
        isUser: false,
        persona: selectedPersona,
      };
      
      setMessages((s) => [...s, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      toast({ 
        title: "Chat error", 
        description: err.message || "Failed to send message", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonaChange = (persona: PersonaKey) => {
    setSelectedPersona(persona);
  };

  const PersonaAvatar = ({ persona, size = 'md' }: { persona: PersonaKey; size?: 'sm' | 'md' | 'lg' }) => {
    const p = PERSONAS[persona];
    const sizeClasses = {
      sm: 'h-8 w-8 text-lg',
      md: 'h-10 w-10 text-xl',
      lg: 'h-14 w-14 text-2xl'
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <span>{p.emoji}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Persona Selector */}
      {showPersonaSelector && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <p className="text-xs text-gray-500 mb-2 text-center">Choose your study buddy:</p>
          <div className="flex gap-2 justify-center">
            {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => {
              const p = PERSONAS[key];
              const isSelected = selectedPersona === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePersonaChange(key)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? `${p.bgColor} ${p.borderColor} border-2 shadow-md scale-105` 
                      : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                  title={p.description}
                >
                  <PersonaAvatar persona={key} size="sm" />
                  <span className={`text-[10px] font-medium mt-1 ${isSelected ? p.textColor : 'text-gray-600'}`}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((m) => {
            const msgPersona = m.persona ? PERSONAS[m.persona as PersonaKey] : currentPersona;
            
            return (
              <div key={m.id} className={m.isUser ? "flex justify-end gap-2" : "flex gap-2"}>
                {!m.isUser && (
                  <PersonaAvatar persona={(m.persona || selectedPersona) as PersonaKey} size="sm" />
                )}
                {m.isUser ? (
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-2xl rounded-tr-md max-w-[80%] shadow-md">
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                ) : (
                  <div className={`${msgPersona.bgColor} ${msgPersona.borderColor} border p-3 rounded-2xl rounded-tl-md max-w-[85%] shadow-sm`}>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{m.message}</p>
                  </div>
                )}
                {m.isUser && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 shadow">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-2">
              <PersonaAvatar persona={selectedPersona} size="sm" />
              <div className={`${currentPersona.bgColor} ${currentPersona.borderColor} border p-3 rounded-2xl rounded-tl-md shadow-sm`}>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">{currentPersona.name} is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={inputMessage} 
            onChange={(e) => setInputMessage(e.target.value)} 
            placeholder={`Ask ${currentPersona.name} a question...`}
            disabled={isLoading}
            className="flex-1 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()} 
            className={`bg-gradient-to-r ${currentPersona.color} hover:opacity-90 shadow-md`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {/* Persona indicator */}
        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">Chatting with</span>
          <button
            onClick={() => setShowPersonaSelector(true)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${currentPersona.bgColor} ${currentPersona.borderColor} border hover:shadow-sm transition-shadow`}
          >
            <span className="text-xs">{currentPersona.emoji}</span>
            <span className={`text-[10px] font-medium ${currentPersona.textColor}`}>
              {currentPersona.name}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyBuddyChat;
