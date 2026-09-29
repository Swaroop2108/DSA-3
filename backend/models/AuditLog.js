const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  user: { type: String, required: true },
  role: { type: String, default: 'System' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  details: { type: String, default: '' }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
