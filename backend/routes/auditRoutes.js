const express = require('express');
const router = express.Router();
const dbHelper = require('../utils/dbHelper');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/logs', verifyToken, async (req, res, next) => {
  try {
    const logs = await dbHelper.getAuditLogs();
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
});

router.get('/notifications', verifyToken, async (req, res, next) => {
  try {
    const notifications = await dbHelper.getNotifications();
    res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    next(err);
  }
});

router.put('/notifications/:id/read', verifyToken, async (req, res, next) => {
  try {
    const updated = await dbHelper.markNotificationRead(req.params.id);
    res.json({ success: true, notification: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
