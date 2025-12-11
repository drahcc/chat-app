# ChatZone Frontend (Quasar + Vue 3 + Pinia)

A feature-rich real-time chat SPA built with **Quasar (Vue 3)** and **Pinia**, connected to the ChatZone backend (AdonisJS + Socket.IO).  
Includes channels, messages, mentions, invites, presence, notifications and more.

---

## 🚀 Features

### 🔐 Authentication
- Login & register (email + nickname)
- JWT token storage
- Persistent session handling

### 👤 User Presence
- Online / Away / DND status
- Real-time presence updates

### 💬 Channels
- Public & private channels
- Create, join, leave
- Smart sorting
- Invite badges (NEW)
- Invite pinning using `invited_at`

### 📩 Invites
- Highlighted with NEW badge
- Auto-pinned until opened
- Cleared automatically via `/channels/:id/clear-invite`

### 📨 Messages
- Real-time Socket.IO delivery
- Infinite scroll history
- Edit/delete flags
- Mentions (`@nickname`)
- Mention highlight and notifications

### ✍️ Typing Indicator
- Live typing display
- Preview of typed text

### ⌨️ Commands
`/help`, `/join`, `/invite`, `/kick`, `/ban`, `/unban`, `/list`,  
`/cancel`, `/quit`

### 🔔 Notifications
- Browser notifications (hidden window only)
- Notification preferences: `all` or `mentions_only`
- Auto-suppressed in DND mode
- Safe fallback when Service Worker missing

### 🚫 Kick Handling
- Real-time kick event
- Auto-redirect to channel list

### 🖥️ UI
- Minimalistic responsive SPA
- Quasar UI components
- Login/Register/Channels/Chat screens

---

## 🛠 Tech Stack
- **Quasar Framework (Vue 3, Vite)**
- **Pinia** (state management)
- **Axios**
- **Socket.IO client**
- **SCSS**

---

## 📦 Prerequisites
- **Node.js ≥ 16**
- Backend running at:
  - API → `http://127.0.0.1:3333`
  - WebSocket → `ws://127.0.0.1:3334`

---

## 📥 Install

`bash
cd "c:\Users\PC NITRO INTEL\Desktop\Нова папка\chat-app"
npm install`

## ▶️ Run (Dev)

`bash
cd "c:\Users\PC NITRO INTEL\Desktop\Нова папка\chat-app"
quasar dev`

## 🏗 Build (SPA)
`cd "c:\Users\PC NITRO INTEL\Desktop\Нова папка\chat-app"
quasar build` 
## 📂 Key Paths
src/
 ├─ App.vue
 ├─ layouts/
 │   └─ MainLayout.vue
 ├─ pages/
 │   ├─ LoginPage.vue
 │   ├─ RegisterPage.vue
 │   ├─ ChannelListPage.vue
 │   └─ ChatPage.vue
 ├─ stores/
 │   ├─ authStore.js
 │   ├─ channelsStore.js
 │   └─ chatStore.js
 ├─ boot/
 │   ├─ axios.js
 │   ├─ socket.js
 │   └─ ws.js
 └─ composables/
     └─ useNotifications.js

---

## 🔔 Notification System (Detailed)

- Fires only when the browser window is **hidden**  
- Respects user preferences (`all` or `mentions_only`)  
- Auto-disabled while user status = `dnd`  
- Does **not** require a Service Worker (safe fallback)

---

## ✨ Invite Highlighting Logic

Backend sets `invited_at`.

Frontend behavior:

- Pins the invited channel at the top  
- Displays **NEW** badge  
- Clears highlight via:



---

## 🐛 Troubleshooting

### Dev server fails to start
- Ensure Node ≥ 16  
- Delete `node_modules` and reinstall  

### No API / Socket connection
Backend must run on:

- **3333** → API  
- **3334** → WebSocket  

### Notifications not appearing
- Browser must allow notifications  
- Notifications appear **only when the tab is not in focus**

---


