const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all users with report counts
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        faculty: true,
        degree: true,
        course: true,
        isActive: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            reportedReports: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalUsers = users.length;

    res.json({ users, totalUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'İstifadəçilər alınarkən xəta baş verdi' });
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId, isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'İstifadəçi ID-si tələb olunur' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });

    res.json({ message: `İstifadəçi ${isActive ? 'aktivləşdirildi' : 'deaktivləşdirildi'}` });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'İstifadəçi statusu dəyişdirilərkən xəta baş verdi' });
  }
};

// Get reported users (16+ reports)
exports.getReportedUsers = async (req, res) => {
  try {
    const reportedUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        faculty: true,
        degree: true,
        course: true,
        isActive: true,
        profilePicture: true,
        _count: {
          select: {
            reportedReports: true
          }
        }
      }
    });

    // Filter users with 16 or more reports
    const filtered = reportedUsers.filter(user => user._count.reportedReports >= 16);

    res.json({ reportedUsers: filtered });
  } catch (error) {
    console.error('Get reported users error:', error);
    res.status(500).json({ error: 'Şikayət edilən istifadəçilər alınarkən xəta baş verdi' });
  }
};

// Get/Update settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findMany();
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Parametrlər alınarkən xəta baş verdi' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Açar və dəyər tələb olunur' });
    }

    await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    res.json({ message: 'Parametr uğurla yeniləndi' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Parametr yenilənərkən xəta baş verdi' });
  }
};

// Filter words management
exports.getFilterWords = async (req, res) => {
  try {
    const words = await prisma.filterWord.findMany({
      orderBy: { word: 'asc' }
    });

    res.json({ words });
  } catch (error) {
    console.error('Get filter words error:', error);
    res.status(500).json({ error: 'Filtr sözləri alınarkən xəta baş verdi' });
  }
};

exports.addFilterWord = async (req, res) => {
  try {
    const { word } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Söz tələb olunur' });
    }

    // Check if word already exists
    const existing = await prisma.filterWord.findUnique({
      where: { word: word.toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu söz artıq filtr siyahısındadır' });
    }

    await prisma.filterWord.create({
      data: { word: word.toLowerCase() }
    });

    res.json({ message: 'Söz uğurla əlavə edildi' });
  } catch (error) {
    console.error('Add filter word error:', error);
    res.status(500).json({ error: 'Söz əlavə edilərkən xəta baş verdi' });
  }
};

exports.deleteFilterWord = async (req, res) => {
  try {
    const { wordId } = req.params;

    await prisma.filterWord.delete({
      where: { id: wordId }
    });

    res.json({ message: 'Söz uğurla silindi' });
  } catch (error) {
    console.error('Delete filter word error:', error);
    res.status(500).json({ error: 'Söz silinərkən xəta baş verdi' });
  }
};

// Sub-admin management (Super Admin only)
exports.getAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      where: { isSuperAdmin: false },
      select: {
        id: true,
        username: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Adminlər alınarkən xəta baş verdi' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    // Check if username already exists
    const existing = await prisma.admin.findUnique({
      where: { username }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu istifadəçi adı artıq mövcuddur' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        isSuperAdmin: false
      }
    });

    res.json({ message: 'Admin uğurla yaradıldı' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Admin yaradılarkən xəta baş verdi' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Check if trying to delete super admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (admin && admin.isSuperAdmin) {
      return res.status(400).json({ error: 'Super admin silinə bilməz' });
    }

    await prisma.admin.delete({
      where: { id: adminId }
    });

    res.json({ message: 'Admin uğurla silindi' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Admin silinərkən xəta baş verdi' });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const totalMessages = await prisma.message.count();
    const totalReports = await prisma.report.count();

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalMessages,
        totalReports
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Statistika alınarkən xəta baş verdi' });
  }
};
