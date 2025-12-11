# ChatZone PWA Documentation

## Overview
- Frontend: Quasar (Vue 3, Pinia, Vite) SPA at `chat-app/`
- Backend: AdonisJS (HTTP + Socket.IO) at `chat-backend/`
- Database: PostgreSQL (tables for users, channels, messages, members, bans, tokens)
- Real-time: Socket.IO for typing, status, message events

## Architecture
- Client (Quasar):
  - Pages: `ChatPage.vue`, `ChannelListPage.vue`, `LoginPage.vue`, etc.
  - Stores: `authStore`, `channelsStore`, `chatStore`
  - Boot: `axios.js` (API), `ws.js` (Socket.IO)
  - Components: `MessageItem.vue`, `TypingIndicator.vue`, `PinnedMessages.vue`
- Server (AdonisJS):
  - Controllers: `ChannelController`, `MessageController`, `UsersController`, etc.
  - Routes: `start/routes.js` (REST endpoints grouped under `auth` middleware)
  - Socket server: `socket-server.js`
  - Config: `config/` (auth, cors, database)

## Data Model (physical)
Tables and key relations (PostgreSQL):
- `users(id, email, password, username, first_name?, last_name?, status, last_seen, notification_preference)`
- `channels(id, name, description, type, admin_id, last_message_at)`
- `channel_members(id, channel_id, user_id, is_admin, invited_at)`
- `messages(id, channel_id, user_id, content, mentioned_user_id?, is_deleted, is_edited, created_at)`
- `channel_bans(id, channel_id, user_id, reason, created_at)`
- `tokens(id, user_id, token, created_at)`
Keys:
- `channel_members.channel_id -> channels.id`, `channel_members.user_id -> users.id`
- `messages.channel_id -> channels.id`, `messages.user_id -> users.id`
- `channels.admin_id -> users.id`

Note: `invited_at` is used to highlight and pin a channel for the invited user; cleared on first open.

## Major Use Cases Mapping
1. Auth: `AuthController.register/login` + `UsersController.updateStatus`
2. Channel list: `GET /channels` with `members.user` and `invited_at` derived per current user
3. Command line: handled in `ChatPage.vue` → API `POST /messages/command`
4. Channel create/join/invite/kick: `MessageController` commands, REST endpoints under `ChannelController`
5. Leave/quit: `/cancel` or `/quit` mapped to `ChannelController.leave` and admin delete
6. Mentions: Message content parsing + `mentioned_user_id` highlighting in `MessageItem.vue`
7. History & infinite scroll: `GET /channels/:id/messages` with pagination
8. Notifications: `useNotifications.js` + App Visibility + preferences via `UsersController`
9. Status: `UsersController.updateStatus` + ws broadcast, rendered in UI
10. Members: `GET /channels/:id/members`
11. Typing: ws events `typing` and preview in `ChatPage.vue`

## Design Decisions
- Use Socket.IO for low-latency events (typing, status, live message push), while persisting via REST for durability.
- Keep mention detection simple: `@nickname` text and/or `mentioned_user_id` from backend.
- Invite highlighting: store per-user `invited_at` in `channel_members`; sort/pin on client; clear on open.
- Notifications are shown only when the app is not visible; respect DND and preferences.

## External Libraries
- Quasar (UI), Vue 3, Pinia
- Axios (HTTP)
- Socket.IO client/server
- AdonisJS (framework)
- PostgreSQL driver (`pg`)

## Setup & Run
Backend (ensure PostgreSQL running and configured in `config/database.js`):
```
cd chat-backend
node server.js
node socket-server.js
```

Frontend:
```
cd chat-app
quasar dev
```

## PWA Notes
- The app is SPA and can be packaged as PWA; current notifications use the Notifications API without actions (service worker optional). For full PWA actions, add a Quasar PWA mode and service worker.

## Diagrams
- Physical DB model: users ↔ channel_members ↔ channels; channels ↔ messages; channels ↔ bans; users ↔ tokens.
- Application architecture: Quasar SPA → Axios (REST) + Socket.IO (WS) → Adonis controllers → PostgreSQL.

## Screenshots (examples to include in PDF)
- Login/Register
- Channel list with NEW highlight
- Chat page with typing indicator
- Notification settings and app visibility demo
- Command line usage (/join, /invite, /kick)
# Chat App PWA - Complete Documentation

## 📱 Overview

Chat App is a modern Progressive Web Application built with Vue.js/Quasar (frontend) and Adonis.js (backend) that enables real-time communication through channels, messages, and notifications. It supports offline functionality, PWA installation, and comprehensive user management features.

## 🎯 Key Features

### 1. **Authentication & User Management**
- User registration with email and username
- Secure JWT-based authentication
- User status management (online, do not disturb, offline)
- Persistent session management
- Automatic login with stored credentials

### 2. **Channels**
- **Public Channels**: Anyone can join
- **Private Channels**: Requires invitation from admin
- Channel creation and management
- Channel descriptions
- Admin controls for member management
- Automatic deletion of inactive channels (30+ days)

### 3. **Real-Time Messaging**
- Instant message delivery via WebSocket
- Message persistence in database
- Pagination and infinite scroll for message history
- Typing indicators
- @mentions with visual highlighting
- Support for 25 messages per page

### 4. **User Mentions**
- **Syntax**: `@username` in message
- **Visual Indicator**: Mentioned messages highlighted in yellow with left border
- **Backend Detection**: Automatic detection and storage of mention metadata
- **Real-time Notifications**: Mentioned users receive notifications (if setting enabled)

### 5. **Commands**

All commands start with `/` and can be used in the message input:

#### Channel Management
- **`/join <channelName> [private]`** - Create or join a channel
  - Creates channel if doesn't exist
  - Joins existing public channel
  - Requires invitation for private channels
  
- **`/cancel` or `/leave`** - Leave current channel
  - Admin: Deletes the channel
  - Member: Removes user from channel
  
- **`/quit`** - Admin only, delete current channel

#### Member Management
- **`/list`** - List all members in current channel
  - Shows member names and count
  
- **`/invite <username>`** - Invite user to channel
  - Admin only for public channels
  - Creates pending invitation for private channels
  - Auto-adds user if already invited
  
- **`/kick <username>`** - Remove user from channel
  - Admin only
  - Tracks kicks (3 kicks = auto-ban)
  - Shows kick count in response
  
- **`/revoke <username>`** - Remove user from private channel
  - Admin only
  - Removes invitation and/or membership
  
- **`/unban <username>`** - Remove ban from user
  - Admin only
  - Clears kick history for user

### 6. **Ban System**
- **3-Strike Policy**: Auto-ban after 3 kicks in same channel
- **Manual Ban**: Admin can manually ban/unban users
- **Kick Tracking**: Persistent record of all kicks
- **Ban Management**: `/unban` to restore user access

### 7. **Notification Settings**
- **All Messages**: Receive notifications for all channel messages
- **Mentions Only**: Receive notifications only for @mentions
- Settings accessible via ⚙️ menu in chat header
- Persistent user preferences in database

### 8. **Typing Indicators**
- Shows when others are typing in real-time
- Automatic timeout after 600ms of inactivity
- Displayed above message input area

### 9. **Infinite Scroll**
- Automatically loads older messages when scrolling up
- Shows loading spinner during fetch
- Maintains scroll position for better UX
- 25 messages per page (configurable)

### 10. **Offline Support (PWA)**
- Service Worker caching of app shell and assets
- Offline message queue (messages stored locally when offline)
- Auto-sync when back online
- Network status detection
- Works without internet (limited functionality)

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework**: Vue.js 3 with Composition API
- **UI Framework**: Quasar v2.18
- **State Management**: Pinia
- **Real-time**: Socket.IO client
- **HTTP**: Axios
- **Build Tool**: Vite

### Backend Stack
- **Framework**: Adonis.js 4
- **Database**: PostgreSQL
- **Real-time**: Socket.IO server
- **Authentication**: JWT (jsonwebtoken)
- **ORM**: Lucid (Adonis ORM)

### Database Schema

#### Users Table
```sql
- id (primary key)
- email (unique)
- username (unique)
- password (hashed)
- first_name
- last_name
- avatar_url
- status (enum: online, dnd, offline)
- notification_preference (enum: all, mentions_only)
- last_seen (timestamp)
```

#### Channels Table
```sql
- id (primary key)
- name (unique)
- description
- type (enum: public, private)
- admin_id (foreign key to users)
- last_message_at (timestamp)
```

#### ChannelMembers Table
```sql
- id (primary key)
- channel_id (foreign key)
- user_id (foreign key)
- is_admin (boolean)
- joined_at (timestamp)
```

#### Messages Table
```sql
- id (primary key)
- channel_id (foreign key)
- user_id (foreign key)
- content (text)
- mentioned_user_id (nullable, foreign key)
- is_command (boolean)
- created_at (timestamp)
```

#### ChannelKicks Table
```sql
- id (primary key)
- channel_id (foreign key)
- user_id (foreign key)
- kicked_by (foreign key to users)
- created_at (timestamp)
```

#### ChannelBans Table
```sql
- id (primary key)
- channel_id (foreign key)
- user_id (foreign key)
- reason (text)
- created_at (timestamp)
```

#### ChannelInvites Table
```sql
- id (primary key)
- channel_id (foreign key)
- sender_id (foreign key to users)
- receiver_id (foreign key to users)
- status (enum: pending, accepted, declined)
- created_at (timestamp)
```

## 🚀 Getting Started

### Installation

#### Frontend Setup
```bash
cd chat-app
npm install
npm run dev
```
Frontend runs on `http://localhost:9000`

#### Backend Setup
```bash
cd chat-backend
npm install
npm run dev
```
API Server runs on `http://localhost:3333`
Socket.IO Server runs on `http://localhost:3334`

### Database Setup
```bash
# Create database
createdb chat_app_db

# Run migrations
npm run migration:run
```

### Configuration

#### Backend (.env)
```
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=chat_app_db
JWT_SECRET=your_secret_key
NODE_ENV=development
```

#### Frontend (axios boot)
```javascript
// boot/axios.js
const api = axios.create({
  baseURL: 'http://localhost:3333'
})
```

## 📖 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login (returns JWT token)

### Channels
- `GET /channels` - List all channels
- `POST /channels` - Create new channel
- `GET /channels/:id` - Get channel details
- `POST /channels/:id/join` - Join channel
- `POST /channels/:id/leave` - Leave channel
- `GET /channels/:id/members` - List channel members
- `POST /channels/:id/invite` - Invite user
- `POST /channels/:id/ban` - Ban user
- `POST /channels/:id/unban` - Unban user
- `POST /channels/cleanup` - Delete inactive channels (30+ days)

### Messages
- `GET /channels/:channelId/messages?page=1` - Get messages (paginated)
- `POST /channels/:channelId/messages` - Send message
- `POST /messages/command` - Send command

### User Settings
- `POST /users/status` - Update user status
- `POST /users/notification-preference` - Set notification preference
- `GET /users/notification-preference` - Get notification preference
- `GET /users/statuses` - Get all user statuses (public)

## 🔌 WebSocket Events

### Client → Server
- `message` - Send message
- `typing` - Send typing indicator
- `join` - Join channel room
- `leave` - Leave channel room

### Server → Client
- `message` - Receive message
- `typing` - Receive typing indicator
- `user:status` - User status changed
- `message:deleted` - Message was deleted (future feature)

## 💾 Storage

### LocalStorage
- User token
- Channel preferences
- Notification settings
- UI preferences

### IndexedDB (via Service Worker)
- Cached messages
- Offline queue
- API responses
- Static assets

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **CORS**: Configured for frontend origin
- **Password Hashing**: bcrypt hashing for passwords
- **Token Validation**: Verified on all protected endpoints
- **WebSocket Auth**: JWT verified on socket connection

## 📊 Error Handling

### Common Error Codes
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (channel/user/message doesn't exist)
- `500` - Server error

### Client Error Handling
Errors displayed to user in system messages:
```
❌ Error: [error message]
```

## 🎨 UI/UX Features

### Chat Interface
- Dark theme (grey-10 background)
- Color-coded user status indicators
- Responsive layout (mobile & desktop)
- Sticky input bar at bottom
- Auto-scroll to latest messages
- Smooth scroll behavior

### Accessibility
- Keyboard shortcuts (Enter to send)
- Status indicators with icons
- Clear visual feedback for mentions
- Loading states and spinners
- Error messages displayed inline

## 📱 PWA Features

### Installation
1. **Chrome/Edge**: Click install icon in address bar
2. **iOS Safari**: Tap share → Add to Home Screen
3. **Android**: Menu → Install app

### Offline Support
- Works offline with cached content
- Messages queued and synced when online
- Notification service for app updates
- Auto-update checking every minute

### App Manifest
- App name and icons
- Display mode: `standalone`
- Theme colors configured
- Shortcuts for common actions
- Screenshot previews

## 🧪 Testing

### Test Users
```
User 1:
Email: user1@example.com
Username: user1
Password: password123

User 2:
Email: user2@example.com
Username: user2
Password: password123
```

### Test Scenarios

1. **Channel Creation**
   - Create public channel: `/join mychannel`
   - Create private channel: `/join mychannel private`

2. **Member Management**
   - Invite user: `/invite user2`
   - Kick user: `/kick user2`
   - List members: `/list`

3. **Ban System**
   - Kick user 3 times: `/kick user2` (3x)
   - Try to rejoin: User is auto-banned
   - Unban user: `/unban user2`

4. **Mentions**
   - Send: `Hello @user2!`
   - Observe: Message highlighted in yellow
   - user2 receives notification (if setting enabled)

5. **Offline**
   - Disconnect internet
   - Send message (queued locally)
   - Reconnect (message auto-syncs)

## 🔍 Troubleshooting

### Service Worker Not Registering
- Clear browser cache
- Check manifest.json is linked in index.html
- Check browser console for errors

### Messages Not Sending
- Verify WebSocket connection (check DevTools Network tab)
- Check authentication token (localStorage → token)
- Verify channel membership

### Infinite Scroll Not Working
- Check page parameter in API request
- Verify lastPage value is correct
- Check scroll event listener is attached

### Notifications Not Appearing
- Check notification_preference setting (all vs mentions_only)
- Verify @mentions syntax (`@username`)
- Check Socket.IO event logs

## 📈 Performance

- **Initial Load**: ~2-3 seconds (optimized with Quasar)
- **Message Send**: ~100-500ms (depends on network)
- **Message Receive**: <100ms (WebSocket)
- **Pagination**: ~500ms per page load
- **PWA Install Size**: ~5-10MB (with assets)

## 🚦 Status

### Completed Features ✅
- Authentication & user management
- Channel creation and management
- Public and private channels
- Real-time messaging with WebSocket
- @mentions with highlighting
- All commands (/join, /list, /kick, /invite, etc.)
- Ban system (3-strike auto-ban)
- Notification settings (all/mentions-only)
- Infinite scroll with pagination
- Typing indicators
- User status indicators
- PWA support with service worker
- Offline message caching

### Future Enhancements 🚀
- File/image sharing
- Voice messages
- Video calls
- User profiles with avatars
- Message reactions/emojis
- Message editing/deletion
- Channel search
- Direct messages (DMs)
- User blocking
- Read receipts
- Message threads/replies
- Custom emojis
- Rich text formatting
- Dark/light theme toggle

## 📞 Support

For issues or feature requests, check:
1. Browser console for errors
2. Network tab for failed requests
3. LocalStorage for corrupted data
4. Service Worker cache status

## 📜 License

Chat App PWA - 2025
All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: December 8, 2025  
**Status**: Production Ready ✅
