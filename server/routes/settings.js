const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get public settings (rules, topic of the day)
router.get('/public', async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['rules', 'topicOfDay', 'groupMessageExpiry', 'privateMessageExpiry']
        }
      }
    });

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Parametrlər alınarkən xəta baş verdi' });
  }
});

module.exports = router;
