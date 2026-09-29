const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  diagnosis: { type: String, required: true },
  admissionDate: { type: Date, default: Date.now },
  priority: { type: Number, required: true, enum: [1, 2, 3, 4], default: 4 }, // 1: EMERGENCY, 2: HIGH, 3: MEDIUM, 4: NORMAL
  priorityLabel: { type: String, enum: ['EMERGENCY', 'HIGH', 'MEDIUM', 'NORMAL'], default: 'NORMAL' },
  surgeryRequired: { type: Boolean, default: false },
  surgeryType: { type: String, default: 'N/A' },
  expectedSurgeryDuration: { type: Number, default: 60 }, // in minutes
  doctor: { type: String, default: 'Unassigned' },
  department: { type: String, default: 'General' },
  status: { type: String, enum: ['WAITING', 'ADMITTED', 'SCHEDULED', 'IN SURGERY', 'DISCHARGED'], default: 'WAITING' },
  bedId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);
