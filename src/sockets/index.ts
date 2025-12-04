import { Server as SocketIOServer } from 'socket.io';
import { setupEditLockSocket } from './edit-lock.socket';

export const initializeSockets = (io: SocketIOServer): void => {
  setupEditLockSocket(io);

  console.log('✅ All socket handlers initialized');
};

export default initializeSockets;
