const mongoose = require('mongoose');
const memoryStore = require('../models/memoryStore');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const OperatingRoom = require('../models/OperatingRoom');
const Staff = require('../models/Staff');
const Surgery = require('../models/Surgery');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

function isMongoConnected() {
  return mongoose.connection.readyState === 1 && !memoryStore.isUsingMemory;
}

const dbHelper = {
  // USERS
  async getUsers() {
    if (isMongoConnected()) return await User.find();
    return memoryStore.users;
  },

  async getUserByEmail(email) {
    if (isMongoConnected()) return await User.findOne({ email: email.toLowerCase() });
    return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async createUser(userData) {
    if (isMongoConnected()) return await User.create(userData);
    const newU = { _id: memoryStore.generateId('usr'), ...userData, createdAt: new Date() };
    memoryStore.users.push(newU);
    return newU;
  },

  // PATIENTS
  async getPatients() {
    if (isMongoConnected()) return await Patient.find().sort({ admissionDate: -1 });
    return [...memoryStore.patients].sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate));
  },

  async getPatientById(id) {
    if (isMongoConnected()) return await Patient.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { patientId: id }] });
    return memoryStore.patients.find(p => p._id === id || p.patientId === id);
  },

  async createPatient(patientData) {
    if (isMongoConnected()) return await Patient.create(patientData);
    const newP = { _id: memoryStore.generateId('pat'), ...patientData, createdAt: new Date() };
    memoryStore.patients.push(newP);
    return newP;
  },

  async updatePatient(id, updateData) {
    if (isMongoConnected()) {
      return await Patient.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { patientId: id }] },
        updateData,
        { new: true }
      );
    }
    const idx = memoryStore.patients.findIndex(p => p._id === id || p.patientId === id);
    if (idx !== -1) {
      memoryStore.patients[idx] = { ...memoryStore.patients[idx], ...updateData };
      return memoryStore.patients[idx];
    }
    return null;
  },

  async deletePatient(id) {
    if (isMongoConnected()) {
      return await Patient.findOneAndDelete({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { patientId: id }] });
    }
    const idx = memoryStore.patients.findIndex(p => p._id === id || p.patientId === id);
    if (idx !== -1) {
      const deleted = memoryStore.patients[idx];
      memoryStore.patients.splice(idx, 1);
      return deleted;
    }
    return null;
  },

  // BEDS
  async getBeds() {
    if (isMongoConnected()) return await Bed.find();
    return memoryStore.beds;
  },

  async getBedById(id) {
    if (isMongoConnected()) return await Bed.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { bedId: id }] });
    return memoryStore.beds.find(b => b._id === id || b.bedId === id);
  },

  async createBed(bedData) {
    if (isMongoConnected()) return await Bed.create(bedData);
    const newB = { _id: memoryStore.generateId('bed'), ...bedData, updatedAt: new Date() };
    memoryStore.beds.push(newB);
    return newB;
  },

  async updateBed(id, updateData) {
    if (isMongoConnected()) {
      return await Bed.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { bedId: id }] },
        updateData,
        { new: true }
      );
    }
    const idx = memoryStore.beds.findIndex(b => b._id === id || b.bedId === id);
    if (idx !== -1) {
      memoryStore.beds[idx] = { ...memoryStore.beds[idx], ...updateData, updatedAt: new Date() };
      return memoryStore.beds[idx];
    }
    return null;
  },

  // OPERATING ROOMS
  async getORs() {
    if (isMongoConnected()) return await OperatingRoom.find();
    return memoryStore.ors;
  },

  async getORById(id) {
    if (isMongoConnected()) return await OperatingRoom.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orId: id }] });
    return memoryStore.ors.find(o => o._id === id || o.orId === id);
  },

  async createOR(orData) {
    if (isMongoConnected()) return await OperatingRoom.create(orData);
    const newO = { _id: memoryStore.generateId('or'), ...orData, updatedAt: new Date() };
    memoryStore.ors.push(newO);
    return newO;
  },

  async updateOR(id, updateData) {
    if (isMongoConnected()) {
      return await OperatingRoom.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orId: id }] },
        updateData,
        { new: true }
      );
    }
    const idx = memoryStore.ors.findIndex(o => o._id === id || o.orId === id);
    if (idx !== -1) {
      memoryStore.ors[idx] = { ...memoryStore.ors[idx], ...updateData, updatedAt: new Date() };
      return memoryStore.ors[idx];
    }
    return null;
  },

  // STAFF
  async getStaff() {
    if (isMongoConnected()) return await Staff.find();
    return memoryStore.staff;
  },

  async getStaffById(id) {
    if (isMongoConnected()) return await Staff.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { staffId: id }] });
    return memoryStore.staff.find(s => s._id === id || s.staffId === id);
  },

  async createStaff(staffData) {
    if (isMongoConnected()) return await Staff.create(staffData);
    const newS = { _id: memoryStore.generateId('stf'), ...staffData, createdAt: new Date() };
    memoryStore.staff.push(newS);
    return newS;
  },

  async updateStaff(id, updateData) {
    if (isMongoConnected()) {
      return await Staff.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { staffId: id }] },
        updateData,
        { new: true }
      );
    }
    const idx = memoryStore.staff.findIndex(s => s._id === id || s.staffId === id);
    if (idx !== -1) {
      memoryStore.staff[idx] = { ...memoryStore.staff[idx], ...updateData };
      return memoryStore.staff[idx];
    }
    return null;
  },

  // SURGERIES
  async getSurgeries() {
    if (isMongoConnected()) return await Surgery.find().sort({ startTime: 1 });
    return [...memoryStore.surgeries].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },

  async getSurgeryById(id) {
    if (isMongoConnected()) return await Surgery.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { surgeryId: id }] });
    return memoryStore.surgeries.find(s => s._id === id || s.surgeryId === id);
  },

  async createSurgery(surgeryData) {
    if (isMongoConnected()) return await Surgery.create(surgeryData);
    const newS = { _id: memoryStore.generateId('surg'), ...surgeryData, createdAt: new Date() };
    memoryStore.surgeries.push(newS);
    return newS;
  },

  async updateSurgery(id, updateData) {
    if (isMongoConnected()) {
      return await Surgery.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { surgeryId: id }] },
        updateData,
        { new: true }
      );
    }
    const idx = memoryStore.surgeries.findIndex(s => s._id === id || s.surgeryId === id);
    if (idx !== -1) {
      memoryStore.surgeries[idx] = { ...memoryStore.surgeries[idx], ...updateData };
      return memoryStore.surgeries[idx];
    }
    return null;
  },

  async deleteSurgery(id) {
    if (isMongoConnected()) {
      return await Surgery.findOneAndDelete({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { surgeryId: id }] });
    }
    const idx = memoryStore.surgeries.findIndex(s => s._id === id || s.surgeryId === id);
    if (idx !== -1) {
      const deleted = memoryStore.surgeries[idx];
      memoryStore.surgeries.splice(idx, 1);
      return deleted;
    }
    return null;
  },

  // AUDIT LOGS
  async addAuditLog({ user, role, action, entity, details }) {
    const logObj = {
      logId: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date(),
      user: user || 'System',
      role: role || 'System',
      action,
      entity,
      details: details || ''
    };
    if (isMongoConnected()) {
      await AuditLog.create(logObj);
    } else {
      memoryStore.auditLogs.unshift({ _id: memoryStore.generateId('log'), ...logObj });
    }
    return logObj;
  },

  async getAuditLogs() {
    if (isMongoConnected()) return await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    return [...memoryStore.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // NOTIFICATIONS
  async addNotification({ title, message, type = 'INFO' }) {
    const notifObj = {
      notificationId: `NOTIF-${Math.floor(10 + Math.random() * 90)}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date()
    };
    if (isMongoConnected()) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications.unshift({ _id: memoryStore.generateId('ntf'), ...notifObj });
    }
    return notifObj;
  },

  async getNotifications() {
    if (isMongoConnected()) return await Notification.find().sort({ createdAt: -1 });
    return [...memoryStore.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markNotificationRead(id) {
    if (isMongoConnected()) {
      return await Notification.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { notificationId: id }] },
        { read: true },
        { new: true }
      );
    }
    const n = memoryStore.notifications.find(nt => nt._id === id || nt.notificationId === id);
    if (n) n.read = true;
    return n;
  }
};

module.exports = dbHelper;
