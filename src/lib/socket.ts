import { io } from 'socket.io-client';

// Connect to the backend via Vite's proxy (same origin)
export const socket = io('/', {
  withCredentials: true,
  autoConnect: false, // We connect manually after auth
});

export function connectSocket(userId: string, projectId?: string) {
  if (!socket.connected) {
    socket.connect();
  }

  // Join personal notification room
  socket.emit('join_personal_room', userId);

  // Join project room for real-time messages/polls
  if (projectId) {
    socket.emit('join_project', projectId);
  }
}

export function joinProjectRoom(projectId: string) {
  if (socket.connected) {
    socket.emit('join_project', projectId);
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
