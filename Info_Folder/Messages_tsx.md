# Detailed Breakdown: `src/pages/Messages.tsx`

## 1. Overview & Importance
This page is the real-time chat room for a specific project. It renders a chat interface, handles file attachments, and utilizes WebSockets.

**What problem it solves:**
In the old version of the app, this page probably used "HTTP Polling" (asking the server every 3 seconds if there are new messages). Now, it hooks into our `Socket.io` connection to receive messages instantly with zero lag and zero unnecessary network requests.

## 2. Line-by-Line Breakdown
- **Socket Listeners**: `socket.on('message:new')` listens for the exact event emitted by our backend `server/routes/messages.ts`. When a message arrives, it instantly appends it to the React Query cache so the UI updates without needing to refresh.
