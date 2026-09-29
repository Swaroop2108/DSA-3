const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'SUCCESS', 'WARNING', 'EMERGENCY'], default: 'INFO' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
