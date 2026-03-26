import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let _socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (_socket?.connected) return _socket;
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return _socket;
}

export function getSocket(): Socket | null {
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
