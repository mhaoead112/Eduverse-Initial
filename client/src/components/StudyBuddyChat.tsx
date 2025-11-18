import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Welcome message contextualized to lesson
    const welcome = {
      id: "welcome",
      message: `You're now chatting about: ${lessonTitle || "this lesson"}. Ask a question about the document to get started.`,
      isUser: false,
    } as ChatMessage;
    setMessages([welcome]);
  }, [lessonId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Send lessonId so server can later do RAG over the document
      const payload = { message, lessonId };
      const res = await apiRequest("POST", "/api/chat", payload);
      return res.json();
    },
    onSuccess: (data) => {
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        message: data.response || "",
        isUser: false,
      };
      setMessages((s) => [...s, aiMsg]);
    },
    onError: (err: any) => {
      toast({ title: "Chat error", description: err instanceof Error ? err.message : "Failed to send message", variant: "destructive" });
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), message: inputMessage, isUser: true };
    setMessages((s) => [...s, userMsg]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Study Buddy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-white rounded">
          {messages.map((m) => (
            <div key={m.id} className={m.isUser ? "flex justify-end" : "flex"}>
              {m.isUser ? (
                <div className="bg-blue-600 text-white p-3 rounded-lg max-w-[70%]">{m.message}</div>
              ) : (
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[80%]">{m.message}</div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
          <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Ask a question about the lesson..." />
          <Button type="submit" disabled={chatMutation.isLoading} className="flex items-center gap-2">
            <Send size={14} />
            Ask
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudyBuddyChat;
