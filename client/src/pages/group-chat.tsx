import { GroupChatLayout } from "@/components/group-chat/GroupChatLayout";

export default function GroupChat() {
  return (
    <>
      {/* SEO Meta Tags */}
      <title>EduVerse Group Chat - Collaborate & Learn Together</title>
      <meta name="description" content="Connect with classmates and teachers in EduVerse's interactive group chat. Share ideas, collaborate on projects, and learn together in real-time." />
      
      <div className="pt-20 h-screen luxury-gradient">
        {/* Luxury Header */}
        <div className="relative py-6 mb-4" data-testid="group-chat-header">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-3xl font-luxury text-white/90 mb-2 flex items-center justify-center gap-3 drop-shadow-2xl">
              <span className="text-4xl animate-bounce">💬</span>
              EduVerse Group Chat
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto font-elegant drop-shadow-lg">
              Connect, collaborate, and learn together in real-time group conversations
            </p>
          </div>
        </div>
        
        <GroupChatLayout />
      </div>
    </>
  );
}