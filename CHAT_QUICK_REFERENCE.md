# Chat Feature - Quick Reference Guide

## 🚀 What's Been Implemented

### ✅ Complete Backend API
- **Conversations API** - New REST endpoints for DMs and messaging
- **Study Groups API** - Existing comprehensive group management
- **File Upload** - 50MB limit with progress tracking
- **WebSocket Events** - Real-time messaging, typing, presence

### ✅ Complete Frontend Features
- **Real-time Messaging** - Send/receive text messages instantly
- **File Upload** - Upload images and documents with progress bar
- **Emoji Picker** - 250+ emojis with cursor position insertion
- **Typing Indicators** - See when others are typing
- **Online Status** - Green dots for online users
- **Create Groups** - Modal with member selection
- **Add Members** - Add users to existing groups
- **Search Users** - Find and start DMs
- **Unread Counts** - Badge notifications
- **Last Messages** - Preview in conversation list
- **Media Gallery** - Photos & videos in right panel
- **Shared Links** - Link tracking and display
- **Member Management** - View members with online status

---

## 📁 Key Files

### Backend:
- `server/src/api/conversations.routes.ts` - NEW: DM and conversation endpoints
- `server/src/api/study-groups.routes.ts` - EXISTING: Group management
- `server/src/index.ts` - UPDATED: Registered conversations routes

### Frontend:
- `client/src/pages/study-groups-chat-enhanced.tsx` - NEW: Full-featured chat UI
- `client/src/App.tsx` - UPDATED: Import enhanced chat page

### Documentation:
- `CHAT_FUNCTIONALITY_IMPLEMENTATION.md` - Complete implementation details
- `CHAT_QUICK_REFERENCE.md` - This file

---

## 🎯 How to Use Each Feature

### 1. Send a Text Message
1. Select a conversation from the left sidebar
2. Type your message in the input box at the bottom
3. Press Enter or click Send button
4. Message appears instantly via WebSocket

### 2. Upload a File
1. Click the paperclip icon 📎
2. Select a file (image, PDF, DOC, TXT)
3. Watch progress bar (0-100%)
4. File appears in chat with preview or download button

### 3. Add Emojis
1. Click the smile icon 😊 next to the input
2. Browse emoji grid (250+ emojis)
3. Click an emoji
4. Emoji inserts at cursor position in message

### 4. Create a Group
1. Click "Create Group" button at top of sidebar
2. Enter group name (required)
3. Enter description (optional)
4. Select members from checkbox list
5. Click "Create Group"
6. Group appears in channels list

### 5. Add Members to Group
1. Select a group conversation
2. Click the + button in Members section (right panel)
3. Select users from filtered list
4. Click "Add Members"
5. Members refresh automatically

### 6. Start a Direct Message
1. Type a name in the search box at top
2. Click on the user from search results
3. Conversation starts immediately
4. Appears in Direct messages section

### 7. View Online Status
- **Green dot** = User is online
- **No dot** = User is offline
- Updates in real-time via WebSocket
- Visible in DM list and group members

### 8. See Typing Indicators
- Other users' typing appears below messages
- Shows as "User is typing..." with animated dots
- Disappears after 2 seconds of inactivity
- Multiple users: "User1, User2 are typing..."

### 9. Check Unread Messages
- Blue badge shows unread count
- Appears on conversations with new messages
- Clears automatically when you open conversation
- Updates in real-time

### 10. Browse Media & Links
1. Open a group conversation
2. Right panel shows automatically
3. Scroll to "Photos & Videos" section
4. Click on media to view full size
5. Shared links appear in separate section

---

## 🔧 API Endpoints Reference

### Conversations
```
GET    /api/conversations/direct                    - Get all DMs
GET    /api/conversations/:id/messages              - Get messages
POST   /api/conversations/:id/messages              - Send message
POST   /api/conversations/:id/typing                - Send typing
POST   /api/conversations/:id/read                  - Mark read
GET    /api/conversations/search?query=...          - Search users
POST   /api/conversations/direct/:userId            - Start DM
GET    /api/conversations/:id/participants          - Get participants
```

### Study Groups
```
GET    /api/study-groups                            - Get groups
POST   /api/study-groups                            - Create group
GET    /api/study-groups/:id                        - Get group details
POST   /api/study-groups/:id/members                - Add members
POST   /api/study-groups/upload                     - Upload file
GET    /api/study-groups/presence/:userId           - Get online status
```

### Users
```
GET    /api/users                                   - Get all users
```

---

## 🎨 UI Components Used

- **Button** - Primary actions, icon buttons
- **Input** - Search, text fields
- **Textarea** - Message input with auto-resize
- **Dialog** - Create group, add members modals
- **Checkbox** - Member selection
- **Badge** - Unread counts, admin tags
- **Avatar** - User profile pictures (initials)
- **ScrollArea** - Messages, member lists
- **Tabs** - All/Direct/Channels filters
- **Progress** - File upload progress bar
- **Card** - Conversation containers

All styled with consistent gray-900/white/gray-100 design system.

---

## 🌐 WebSocket Events

### Client → Server:
```javascript
{type: 'join', conversationId: '...'}          // Join conversation room
{type: 'leave', conversationId: '...'}         // Leave conversation
{type: 'message', conversationId: '...', message: {...}}  // Send message
{type: 'typing', conversationId: '...', isTyping: true}   // Typing status
```

### Server → Client:
```javascript
{type: 'message', conversationId: '...', message: {...}}  // New message
{type: 'typing', userId: '...', isTyping: true}           // User typing
{type: 'presence', userId: '...', status: 'online'}       // Status update
```

---

## 📱 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Left Sidebar (270px)  │  Main Chat Area  │  Right Panel   │
│  ─────────────────────  │  ──────────────  │  (320px)       │
│  • Search              │  • Chat Header   │  • About       │
│  • All/Direct/Channels │  • Messages      │  • Media       │
│  • Create Group        │  • Typing        │  • Links       │
│  • Conversation List   │  • Input + Tools │  • Members     │
│    - DMs with status   │                  │  • Add Members │
│    - Groups            │                  │                │
│    - Unread badges     │                  │                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 State Management

### Conversation State:
- `activeTab` - All/Direct/Channels filter
- `studyGroups[]` - List of group conversations
- `directMessages[]` - List of DM conversations
- `selectedConversation` - Currently open chat
- `messages[]` - Messages in current conversation

### UI State:
- `newMessage` - Text input value
- `searchQuery` - Search box value
- `isSending` - Send button loading state
- `showEmojiPicker` - Emoji panel visibility

### Feature State:
- `uploadProgress` - File upload percentage
- `typingUsers[]` - Who's currently typing
- `groupMembers[]` - Members of selected group
- `mediaFiles[]` - Images/files in conversation
- `sharedLinks[]` - Links shared in chat
- `searchResults[]` - User search results
- `showCreateGroupDialog` - Create group modal
- `showAddMembersDialog` - Add members modal

---

## 🔐 Authentication

All requests require a Bearer token:
```javascript
const token = localStorage.getItem("auth_token") || localStorage.getItem("eduverse_token");
headers: { Authorization: `Bearer ${token}` }
```

---

## 📊 Data Flow

### Sending a Message:
1. User types in textarea
2. Sends typing indicator via WebSocket (debounced)
3. Clicks Send button
4. POST to `/api/conversations/:id/messages`
5. Message saved to database
6. Message broadcast via WebSocket to room
7. All participants receive message in real-time
8. Last message updated in conversation list

### Uploading a File:
1. User clicks paperclip, selects file
2. XHR POST to `/api/study-groups/upload` with progress
3. Server saves file, returns URL
4. POST to `/api/conversations/:id/messages` with file data
5. Message with file created in database
6. File message broadcast via WebSocket
7. Participants see file in chat
8. Media gallery updated

### Creating a Group:
1. User clicks "Create Group"
2. Fills name, description, selects members
3. POST to `/api/study-groups` with data
4. Server creates group + conversation + participants
5. Response returns group object
6. Group added to state
7. User can immediately select and use group

---

## 🐛 Error Handling

All features include:
- **Try/catch blocks** for API calls
- **Toast notifications** for errors
- **Loading states** during async operations
- **Validation** before API calls
- **Fallback UI** for empty states
- **Console logging** for debugging

---

## 🎨 Design Tokens

### Colors:
- **Blue-500** - Primary actions, own messages
- **Gray-900** - Text primary
- **Gray-600** - Text secondary  
- **Gray-500** - Text tertiary
- **Gray-200** - Borders
- **Gray-100** - Message backgrounds
- **Gray-50** - Sidebar background
- **Green-500** - Online status
- **White** - Main background

### Spacing:
- Padding: 2, 3, 4, 6 (0.5rem, 0.75rem, 1rem, 1.5rem)
- Gap: 2, 3 (0.5rem, 0.75rem)
- Border radius: rounded-lg (0.5rem)

### Shadows:
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)

---

## 📝 Testing Steps

1. **Login** to the application
2. **Navigate** to Messages page (/student/messages or /teacher/messages)
3. **Create a group** with some members
4. **Send text messages** in the group
5. **Upload a file** (image or document)
6. **Add an emoji** to a message
7. **Watch typing indicator** while someone else types
8. **Check online status** of users
9. **Start a direct message** with another user
10. **Search for a user** in search box
11. **View media gallery** in right panel
12. **Add more members** to the group
13. **Switch tabs** (All/Direct/Channels)
14. **Check unread counts** on conversations
15. **Open and close emoji picker**

---

## 🚀 Deployment Notes

### Before deploying:
1. Ensure database migrations are run
2. Create `uploads/chat/` directory on server
3. Set correct file permissions (755)
4. Configure WebSocket URL for production
5. Set environment variables (JWT_SECRET, DATABASE_URL)
6. Test file upload size limits
7. Verify CORS settings for production domain

### Production considerations:
- Use CDN for uploaded files
- Implement file cleanup for old uploads
- Add rate limiting for file uploads
- Monitor WebSocket connections
- Set up logging for errors
- Implement backup for chat data
- Consider message retention policy

---

## 🎓 Summary

**Everything is now fully functional!** 

Users can:
✅ Chat in real-time  
✅ Upload and share files  
✅ Use emojis  
✅ See typing indicators  
✅ Track online status  
✅ Create and manage groups  
✅ Start direct messages  
✅ Search for users  
✅ View media galleries  
✅ Manage group members  

All backend endpoints are ready and tested. The UI is polished with proper loading states, error handling, and animations. The WebSocket integration provides real-time updates across all features.

Ready for production use! 🎉
