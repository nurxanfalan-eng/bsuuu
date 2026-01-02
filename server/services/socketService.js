const jwt = require('jsonwebtoken');
const { filterMessage } = require('../controllers/messageController');

// Store online users
const onlineUsers = new Map();

module.exports = (io, socket, prisma) => {
  console.log('New socket connection:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      
      // Store user's socket ID
      onlineUsers.set(decoded.userId, socket.id);
      
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          faculty: true,
          degree: true,
          course: true,
          profilePicture: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        socket.emit('auth_error', { error: 'Hesab deaktivdir' });
        socket.disconnect();
        return;
      }

      socket.user = user;
      socket.emit('authenticated', { user });

      console.log(`User ${user.name} authenticated with socket ${socket.id}`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth_error', { error: 'Autentifikasiya xətası' });
      socket.disconnect();
    }
  });

  // Join faculty room
  socket.on('join_faculty', async (faculty) => {
    if (!socket.user) {
      return socket.emit('error', { message: 'Autentifikasiya tələb olunur' });
    }

    socket.join(`faculty_${faculty}`);
    console.log(`User ${socket.user.name} joined faculty room: ${faculty}`);

    // Notify room
    socket.to(`faculty_${faculty}`).emit('user_joined', {
      user: socket.user,
      timestamp: new Date().toISOString()
    });
  });

  // Leave faculty room
  socket.on('leave_faculty', (faculty) => {
    socket.leave(`faculty_${faculty}`);
    console.log(`User ${socket.user?.name} left faculty room: ${faculty}`);
  });

  // Send faculty message
  socket.on('send_faculty_message', async (data) => {
    if (!socket.user) {
      return socket.emit('error', { message: 'Autentifikasiya tələb olunur' });
    }

    try {
      const { faculty, content } = data;

      if (!content || !content.trim()) {
        return socket.emit('error', { message: 'Mesaj boş ola bilməz' });
      }

      // Filter message
      const filteredContent = await filterMessage(content);

      // Get message expiry settings
      const expirySetting = await prisma.settings.findUnique({
        where: { key: 'groupMessageExpiry' }
      });

      const expiryHours = expirySetting ? parseInt(expirySetting.value) : null;
      const expiresAt = expiryHours ? new Date(Date.now() + expiryHours * 60 * 60 * 1000) : null;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content: filteredContent,
          type: 'text',
          roomType: 'faculty',
          roomId: faculty,
          senderId: socket.userId,
          expiresAt
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              faculty: true,
              degree: true,
              course: true,
              profilePicture: true
            }
          }
        }
      });

      // Get blocked users for this sender
      const blocks = await prisma.block.findMany({
        where: { blockedId: socket.userId },
        select: { blockerId: true }
      });

      const blockedByIds = blocks.map(b => b.blockerId);

      // Broadcast to faculty room except blocked users
      io.to(`faculty_${faculty}`).emit('new_faculty_message', {
        message,
        blockedBy: blockedByIds
      });

      console.log(`Message sent to faculty ${faculty} by ${socket.user.name}`);
    } catch (error) {
      console.error('Send faculty message error:', error);
      socket.emit('error', { message: 'Mesaj göndərilə bilmədi' });
    }
  });

  // Start private chat
  socket.on('start_private_chat', async (data) => {
    if (!socket.user) {
      return socket.emit('error', { message: 'Autentifikasiya tələb olunur' });
    }

    try {
      const { userId } = data;

      // Check if blocked
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: socket.userId, blockedId: userId },
            { blockerId: userId, blockedId: socket.userId }
          ]
        }
      });

      if (isBlocked) {
        return socket.emit('error', { message: 'Bu istifadəçi ilə mesajlaşma mümkün deyil' });
      }

      // Create private room ID
      const roomId = [socket.userId, userId].sort().join('_');
      socket.join(`private_${roomId}`);

      socket.emit('private_chat_started', { roomId, userId });
    } catch (error) {
      console.error('Start private chat error:', error);
      socket.emit('error', { message: 'Şəxsi söhbət başladıla bilmədi' });
    }
  });

  // Send private message
  socket.on('send_private_message', async (data) => {
    if (!socket.user) {
      return socket.emit('error', { message: 'Autentifikasiya tələb olunur' });
    }

    try {
      const { receiverId, content } = data;

      if (!content || !content.trim()) {
        return socket.emit('error', { message: 'Mesaj boş ola bilməz' });
      }

      // Check if blocked
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: socket.userId, blockedId: receiverId },
            { blockerId: receiverId, blockedId: socket.userId }
          ]
        }
      });

      if (isBlocked) {
        return socket.emit('error', { message: 'Bu istifadəçi ilə mesajlaşma mümkün deyil' });
      }

      // Filter message
      const filteredContent = await filterMessage(content);

      // Get message expiry settings
      const expirySetting = await prisma.settings.findUnique({
        where: { key: 'privateMessageExpiry' }
      });

      const expiryHours = expirySetting ? parseInt(expirySetting.value) : null;
      const expiresAt = expiryHours ? new Date(Date.now() + expiryHours * 60 * 60 * 1000) : null;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content: filteredContent,
          type: 'text',
          roomType: 'private',
          senderId: socket.userId,
          receiverId,
          expiresAt
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              faculty: true,
              degree: true,
              course: true,
              profilePicture: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              faculty: true,
              degree: true,
              course: true,
              profilePicture: true
            }
          }
        }
      });

      // Create room ID
      const roomId = [socket.userId, receiverId].sort().join('_');

      // Emit to both sender and receiver
      io.to(`private_${roomId}`).emit('new_private_message', { message });

      // If receiver is online but not in room, send notification
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          from: socket.user,
          message
        });
      }

      console.log(`Private message sent from ${socket.user.name} to user ${receiverId}`);
    } catch (error) {
      console.error('Send private message error:', error);
      socket.emit('error', { message: 'Mesaj göndərilə bilmədi' });
    }
  });

  // Typing indicator for private chat
  socket.on('typing_private', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId: socket.userId,
        user: socket.user,
        isTyping
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.user?.name} disconnected`);
    }
  });
};

// Cleanup expired messages (run periodically)
const cleanupExpiredMessages = async (prisma) => {
  try {
    const deleted = await prisma.message.deleteMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    });

    if (deleted.count > 0) {
      console.log(`Deleted ${deleted.count} expired messages`);
    }
  } catch (error) {
    console.error('Cleanup expired messages error:', error);
  }
};

// Run cleanup every 5 minutes
setInterval(() => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  cleanupExpiredMessages(prisma);
}, 5 * 60 * 1000);
