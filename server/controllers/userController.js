const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Yalnız şəkil faylları yüklənə bilər'));
  }
}).single('profilePicture');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        faculty: true,
        degree: true,
        course: true,
        profilePicture: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Profil məlumatları alınarkən xəta baş verdi' });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Şəkil seçilməlidir' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      // Delete old profile picture if exists
      if (user.profilePicture) {
        const oldPath = path.join(__dirname, '../../public', user.profilePicture);
        try {
          await fs.unlink(oldPath);
        } catch (error) {
          console.log('Old profile picture not found or already deleted');
        }
      }

      const profilePictureUrl = '/uploads/' + req.file.filename;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: { profilePicture: profilePictureUrl },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          faculty: true,
          degree: true,
          course: true,
          profilePicture: true
        }
      });

      res.json({
        message: 'Profil şəkli uğurla yeniləndi',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile picture error:', error);
      res.status(500).json({ error: 'Profil şəkli yenilənərkən xəta baş verdi' });
    }
  });
};

// Get users by faculty
exports.getUsersByFaculty = async (req, res) => {
  try {
    const { faculty } = req.params;

    const users = await prisma.user.findMany({
      where: {
        faculty,
        isActive: true,
        id: { not: req.user.userId }
      },
      select: {
        id: true,
        name: true,
        faculty: true,
        degree: true,
        course: true,
        profilePicture: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users by faculty error:', error);
    res.status(500).json({ error: 'İstifadəçilər alınarkən xəta baş verdi' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'İstifadəçi məlumatları alınarkən xəta baş verdi' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'İstifadəçi ID-si tələb olunur' });
    }

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Özünüzü əngəlləyə bilməzsiniz' });
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.userId,
          blockedId: userId
        }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'Bu istifadəçi artıq əngəllənib' });
    }

    await prisma.block.create({
      data: {
        blockerId: req.user.userId,
        blockedId: userId
      }
    });

    res.json({ message: 'İstifadəçi uğurla əngəlləndi' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'İstifadəçi əngəllənərkən xəta baş verdi' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'İstifadəçi ID-si tələb olunur' });
    }

    await prisma.block.deleteMany({
      where: {
        blockerId: req.user.userId,
        blockedId: userId
      }
    });

    res.json({ message: 'İstifadəçi əngəldən çıxarıldı' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'İstifadəçi əngəldən çıxarılarkən xəta baş verdi' });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.user.userId },
      include: {
        blocked: {
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

    const blockedUsers = blocks.map(block => block.blocked);

    res.json({ blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Əngəllənən istifadəçilər alınarkən xəta baş verdi' });
  }
};

// Report user
exports.reportUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'İstifadəçi ID-si tələb olunur' });
    }

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Özünüzü şikayət edə bilməzsiniz' });
    }

    await prisma.report.create({
      data: {
        reporterId: req.user.userId,
        reportedUserId: userId,
        reason: reason || null
      }
    });

    res.json({ message: 'Şikayət uğurla göndərildi' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ error: 'Şikayət göndərilərkən xəta baş verdi' });
  }
};
