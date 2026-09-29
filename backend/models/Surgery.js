const mongoose = require('mongoose');

const SurgerySchema = new mongoose.Schema({
  surgeryId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  surgeryType: { type: String, required: true },
  orId: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, default: 'General' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  priority: { type: Number, required: true, enum: [1, 2, 3, 4], default: 4 },
  priorityLabel: { type: String, default: 'NORMAL' },
  status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'], default: 'SCHEDULED' },
  notes: { type: String, default: '' },
  requiredEquipment: { type: [String], default: [] },
  isEmergencyPreempted: { type: Boolean, default: false },
  preemptedBySurgeryId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Surgery', SurgerySchema);
