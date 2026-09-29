const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedId: { type: String, required: true, unique: true },
  ward: { type: String, required: true, enum: ['ICU', 'GENERAL', 'PRIVATE', 'EMERGENCY'] },
  floor: { type: String, default: '1st Floor' },
  type: { type: String, required: true, enum: ['ICU', 'GENERAL', 'PRIVATE', 'EMERGENCY'] },
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'], default: 'AVAILABLE' },
  equipment: { type: [String], default: [] },
  assignedPatientId: { type: String, default: null },
  assignedPatientName: { type: String, default: null },
  assignedDate: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bed', BedSchema);
