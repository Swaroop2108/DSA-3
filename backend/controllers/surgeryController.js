const dbHelper = require('../utils/dbHelper');
const IntervalScheduler = require('../algorithms/IntervalScheduler');

exports.getSurgeries = async (req, res, next) => {
  try {
    const { status, doctorId, orId, priority, date } = req.query;
    let surgeries = await dbHelper.getSurgeries();

    if (status) {
      surgeries = surgeries.filter(s => s.status.toUpperCase() === status.toUpperCase());
    }

    if (doctorId) {
      surgeries = surgeries.filter(s => s.doctorId === doctorId || s.doctorName.toLowerCase().includes(doctorId.toLowerCase()));
    }

    if (orId) {
      surgeries = surgeries.filter(s => s.orId === orId);
    }

    if (priority) {
      surgeries = surgeries.filter(s => String(s.priority) === String(priority) || s.priorityLabel.toUpperCase() === priority.toUpperCase());
    }

    if (date) {
      const target = new Date(date).toDateString();
      surgeries = surgeries.filter(s => new Date(s.startTime).toDateString() === target);
    }

    res.json({ success: true, count: surgeries.length, surgeries });
  } catch (err) {
    next(err);
  }
};

exports.getSurgeryById = async (req, res, next) => {
  try {
    const surgery = await dbHelper.getSurgeryById(req.params.id);
    if (!surgery) return res.status(404).json({ success: false, message: 'Surgery not found.' });
    res.json({ success: true, surgery });
  } catch (err) {
    next(err);
  }
};

exports.createSurgery = async (req, res, next) => {
  try {
    const {
      patientId, surgeryType, orId, doctorId,
      startTime, duration = 60, notes, requiredEquipment
    } = req.body;

    if (!patientId || !orId || !doctorId || !startTime) {
      return res.status(400).json({ success: false, message: 'Patient ID, OR ID, Doctor ID, and Start Time are required.' });
    }

    const patient = await dbHelper.getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const doctor = await dbHelper.getStaffById(doctorId);
    const doctorName = doctor ? doctor.name : doctorId;

    const sTime = new Date(startTime);
    const eTime = new Date(sTime.getTime() + duration * 60 * 1000);

    const existingSurgeries = await dbHelper.getSurgeries();
    const operatingRooms = await dbHelper.getORs();
    const staffList = await dbHelper.getStaff();

    // Perform strict DSA Conflict Check
    const conflictCheck = IntervalScheduler.checkConflicts({
      startTime: sTime,
      endTime: eTime,
      orId,
      doctorId,
      existingSurgeries,
      operatingRooms,
      staffList
    });

    if (conflictCheck.hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'SCHEDULING CONFLICT DETECTED',
        conflicts: conflictCheck.conflicts
      });
    }

    const surgeryId = `SURG-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newSurgery = await dbHelper.createSurgery({
      surgeryId,
      patientId: patient.patientId,
      patientName: patient.name,
      surgeryType: surgeryType || patient.surgeryType || 'Surgical Procedure',
      orId,
      doctorId,
      doctorName,
      department: patient.department || 'General',
      startTime: sTime,
      endTime: eTime,
      duration: Number(duration),
      priority: patient.priority || 4,
      priorityLabel: patient.priorityLabel || 'NORMAL',
      status: 'SCHEDULED',
      notes: notes || '',
      requiredEquipment: Array.isArray(requiredEquipment) ? requiredEquipment : (requiredEquipment ? requiredEquipment.split(',') : [])
    });

    // Update patient status to SCHEDULED
    await dbHelper.updatePatient(patient.patientId, { status: 'SCHEDULED' });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Surgery Scheduled',
      entity: `Surgery ${surgeryId}`,
      details: `Scheduled ${newSurgery.surgeryType} for ${patient.name} in ${orId} with ${doctorName}.`
    });

    await dbHelper.addNotification({
      title: '🏥 Surgery Scheduled',
      message: `Surgery ${surgeryId} scheduled for ${patient.name} in ${orId}.`,
      type: 'INFO'
    });

    res.status(201).json({
      success: true,
      message: 'Surgery successfully scheduled.',
      surgery: newSurgery
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSurgery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const surgery = await dbHelper.getSurgeryById(id);
    if (!surgery) return res.status(404).json({ success: false, message: 'Surgery not found.' });

    const updateData = { ...req.body };

    if (updateData.startTime || updateData.duration) {
      const sTime = updateData.startTime ? new Date(updateData.startTime) : new Date(surgery.startTime);
      const dur = updateData.duration ? Number(updateData.duration) : surgery.duration;
      const eTime = new Date(sTime.getTime() + dur * 60 * 1000);
      updateData.startTime = sTime;
      updateData.endTime = eTime;

      // Validate conflicts
      const existingSurgeries = await dbHelper.getSurgeries();
      const operatingRooms = await dbHelper.getORs();
      const staffList = await dbHelper.getStaff();

      const check = IntervalScheduler.checkConflicts({
        startTime: sTime,
        endTime: eTime,
        orId: updateData.orId || surgery.orId,
        doctorId: updateData.doctorId || surgery.doctorId,
        existingSurgeries,
        operatingRooms,
        staffList,
        excludeSurgeryId: surgery.surgeryId
      });

      if (check.hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'RESCHEDULING CONFLICT DETECTED',
          conflicts: check.conflicts
        });
      }
    }

    const updated = await dbHelper.updateSurgery(surgery.surgeryId, updateData);

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Surgery Updated',
      entity: `Surgery ${surgery.surgeryId}`,
      details: `Updated surgery ${surgery.surgeryId} details.`
    });

    res.json({ success: true, message: 'Surgery updated successfully.', surgery: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteSurgery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dbHelper.deleteSurgery(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Surgery not found.' });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Surgery Cancelled',
      entity: `Surgery ${deleted.surgeryId}`,
      details: `Cancelled surgery ${deleted.surgeryId} for ${deleted.patientName}.`
    });

    res.json({ success: true, message: 'Surgery record cancelled/deleted successfully.', surgery: deleted });
  } catch (err) {
    next(err);
  }
};
