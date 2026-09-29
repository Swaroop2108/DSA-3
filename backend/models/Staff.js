const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Doctor', 'Surgeon', 'Nurse', 'Technician', 'Anesthetist'], required: true },
  department: { type: String, required: true },
  specialization: { type: String, default: 'General Medicine' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFF-DUTY'], default: 'AVAILABLE' },
  availableFrom: { type: String, default: '08:00' },
  availableTo: { type: String, default: '18:00' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', StaffSchema);
