const mongoose = require('mongoose');

const OperatingRoomSchema = new mongoose.Schema({
  orId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' },
  equipment: { type: [String], default: [] },
  currentSurgeryId: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OperatingRoom', OperatingRoomSchema);
