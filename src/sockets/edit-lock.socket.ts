import { Server as SocketIOServer, Socket } from 'socket.io';
import { editLockService } from '../services';

export const setupEditLockSocket = (io: SocketIOServer): void => {
  io.on('connection', (socket: Socket) => {
    /**
     * Join event room for real-time lock updates
     */
    socket.on('event:join', (eventId: string) => {
      socket.join(`event:${eventId}`);
      console.log(`👥 User ${socket.data.email} joined event room: ${eventId}`);
    });

    /**
     * Leave event room
     */
    socket.on('event:leave', (eventId: string) => {
      socket.leave(`event:${eventId}`);
      console.log(`👋 User ${socket.data.email} left event room: ${eventId}`);
    });

    /**
     * Acquire edit lock (real-time)
     */
    socket.on('editlock:acquire', async (eventId: string, callback) => {
      try {
        const lock = await editLockService.acquireLock(
          eventId,
          socket.data.userId,
          socket.data.email
        );

        io.to(`event:${eventId}`).emit('editlock:acquired', {
          eventId,
          userId: socket.data.userId,
          userEmail: socket.data.email,
          expiresAt: lock.expiresAt,
        });

        callback({ success: true, lock });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    /**
     * Release edit lock (real-time)
     */
    socket.on('editlock:release', async (eventId: string, callback) => {
      try {
        await editLockService.releaseLock(eventId, socket.data.userId);

        io.to(`event:${eventId}`).emit('editlock:released', {
          eventId,
          userId: socket.data.userId,
          userEmail: socket.data.email,
        });

        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    /**
     * Maintain edit lock (real-time)
     */
    socket.on('editlock:maintain', async (eventId: string, callback) => {
      try {
        const lock = await editLockService.maintainLock(eventId, socket.data.userId);

        io.to(`event:${eventId}`).emit('editlock:maintained', {
          eventId,
          userId: socket.data.userId,
          userEmail: socket.data.email,
          expiresAt: lock.expiresAt,
        });

        callback({ success: true, lock });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    /**
     * Check lock status
     */
    socket.on('editlock:status', async (eventId: string, callback) => {
      try {
        const lock = await editLockService.getLockInfo(eventId);

        callback({ success: true, lock });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });
  });

  console.log('✅ Edit lock socket handlers registered');
};

export default setupEditLockSocket;
