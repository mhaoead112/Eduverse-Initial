import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Props {
  lessonId?: string;
  lessonTitle?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  response?: string;
  isUser?: boolean;
}

export const StudyBuddyChat: React.FC<Props> = ({ lessonId, lessonTitle }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Welcome message contextualized to lesson
    const welcome = {
      id: "welcome",
      message: `Hi! I'm Versa 🌟 Let's explore "${lessonTitle || "this lesson"}" together! Ask me anything about the content.`,
      isUser: false,
    } as ChatMessage;
    setMessages([welcome]);
  }, [lessonId, lessonTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

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
      const response = await fetch("/api/ai-chat/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: inputMessage,
          lessonId: lessonId,
          persona: 'alex'
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

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span>Versa - Your AI Study Buddy</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
          {messages.map((m) => (
            <div key={m.id} className={m.isUser ? "flex justify-end gap-2" : "flex gap-2"}>
              {!m.isUser && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              {m.isUser ? (
                <div className="bg-blue-600 text-white p-3 rounded-2xl max-w-[70%] shadow-sm">
                  {m.message}
                </div>
              ) : (
                <div className="bg-white text-gray-800 p-3 rounded-2xl max-w-[80%] shadow-sm border">
                  {m.message}
                </div>
              )}
              {m.isUser && (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-gray-700" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white p-3 rounded-2xl border">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
          <Input 
            value={inputMessage} 
            onChange={(e) => setInputMessage(e.target.value)} 
            placeholder="Ask a question about the lesson..." 
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send size={14} />
            Ask
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudyBuddyChat;
