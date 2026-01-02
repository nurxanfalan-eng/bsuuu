const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Filter message content
async function filterMessage(content) {
  const filterWords = await prisma.filterWord.findMany();
  let filteredContent = content;
  
  filterWords.forEach(fw => {
    const regex = new RegExp(fw.word, 'gi');
    filteredContent = filteredContent.replace(regex, '*'.repeat(fw.word.length));
  });
  
  return filteredContent;
}

// Get faculty room messages
exports.getFacultyMessages = async (req, res) => {
  try {
    const { faculty } = req.params;
    const { limit = 50, before } = req.query;

    // Get blocked user IDs
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.user.userId },
      select: { blockedId: true }
    });
    const blockedIds = blocks.map(b => b.blockedId);

    const whereClause = {
      roomType: 'faculty',
      roomId: faculty,
      senderId: { notIn: blockedIds }
    };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get faculty messages error:', error);
    res.status(500).json({ error: 'Mesajlar alınarkən xəta baş verdi' });
  }
};

// Get private messages with a user
exports.getPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if blocked
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: req.user.userId, blockedId: userId },
          { blockerId: userId, blockedId: req.user.userId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({ error: 'Bu istifadəçi ilə mesajlaşma mümkün deyil' });
    }

    const whereClause = {
      roomType: 'private',
      OR: [
        { senderId: req.user.userId, receiverId: userId },
        { senderId: userId, receiverId: req.user.userId }
      ]
    };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ error: 'Mesajlar alınarkən xəta baş verdi' });
  }
};

// Get private conversations list
exports.getConversations = async (req, res) => {
  try {
    // Get all private messages involving the user
    const messages = await prisma.message.findMany({
      where: {
        roomType: 'private',
        OR: [
          { senderId: req.user.userId },
          { receiverId: req.user.userId }
        ]
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get blocked users
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: req.user.userId },
          { blockedId: req.user.userId }
        ]
      },
      select: { blockerId: true, blockedId: true }
    });

    const blockedIds = new Set();
    blocks.forEach(block => {
      if (block.blockerId === req.user.userId) {
        blockedIds.add(block.blockedId);
      } else {
        blockedIds.add(block.blockerId);
      }
    });

    // Group by conversation partner
    const conversationsMap = new Map();
    
    messages.forEach(message => {
      const partnerId = message.senderId === req.user.userId ? message.receiverId : message.senderId;
      const partner = message.senderId === req.user.userId ? message.receiver : message.sender;
      
      // Skip blocked users
      if (blockedIds.has(partnerId)) return;
      
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          user: partner,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Söhbətlər alınarkən xəta baş verdi' });
  }
};

module.exports = { filterMessage };
