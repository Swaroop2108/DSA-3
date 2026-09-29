const dbHelper = require('../utils/dbHelper');
const PriorityQueue = require('../algorithms/PriorityQueue');

// Helper priority mapping
const PRIORITY_MAP = {
  EMERGENCY: 1,
  HIGH: 2,
  MEDIUM: 3,
  NORMAL: 4
};

exports.getPatients = async (req, res, next) => {
  try {
    const { search, priority, status, department } = req.query;
    let patients = await dbHelper.getPatients();

    if (search) {
      const q = search.toLowerCase();
      patients = patients.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q)
      );
    }

    if (priority) {
      patients = patients.filter(p => p.priorityLabel.toUpperCase() === priority.toUpperCase() || String(p.priority) === String(priority));
    }

    if (status) {
      patients = patients.filter(p => p.status.toUpperCase() === status.toUpperCase());
    }

    if (department) {
      patients = patients.filter(p => p.department.toLowerCase() === department.toLowerCase());
    }

    res.json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (err) {
    next(err);
  }
};

exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await dbHelper.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    next(err);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const {
      name, age, gender, phone, email, address,
      diagnosis, priority, surgeryRequired, surgeryType,
      expectedSurgeryDuration, doctor, department
    } = req.body;

    if (!name || !age || !gender || !diagnosis) {
      return res.status(400).json({ success: false, message: 'Name, age, gender, and diagnosis are required.' });
    }

    const priorityLabel = typeof priority === 'string' ? priority.toUpperCase() : (['EMERGENCY', 'HIGH', 'MEDIUM', 'NORMAL'][priority - 1] || 'NORMAL');
    const priorityVal = PRIORITY_MAP[priorityLabel] || 4;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const patientId = `PAT-2026-${randomNum}`;

    const newPatient = await dbHelper.createPatient({
      patientId,
      name,
      age: Number(age),
      gender,
      phone: phone || '',
      email: email || '',
      address: address || '',
      diagnosis,
      admissionDate: new Date(),
      priority: priorityVal,
      priorityLabel,
      surgeryRequired: Boolean(surgeryRequired),
      surgeryType: surgeryType || (surgeryRequired ? 'Surgical Procedure' : 'N/A'),
      expectedSurgeryDuration: expectedSurgeryDuration ? Number(expectedSurgeryDuration) : 60,
      doctor: doctor || 'Unassigned',
      department: department || 'General',
      status: 'WAITING',
      bedId: null
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Patient Registration',
      entity: `Patient ${patientId}`,
      details: `Registered ${name} (${priorityLabel} priority) - ${diagnosis}.`
    });

    if (priorityVal === 1) {
      await dbHelper.addNotification({
        title: '🚨 Emergency Patient Registered',
        message: `Emergency patient ${name} (${patientId}) admitted with ${diagnosis}.`,
        type: 'EMERGENCY'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      patient: newPatient
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.priority) {
      const priorityLabel = typeof updateData.priority === 'string' ? updateData.priority.toUpperCase() : (['EMERGENCY', 'HIGH', 'MEDIUM', 'NORMAL'][updateData.priority - 1] || 'NORMAL');
      updateData.priorityLabel = priorityLabel;
      updateData.priority = PRIORITY_MAP[priorityLabel] || 4;
    }

    const updated = await dbHelper.updatePatient(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Patient Update',
      entity: `Patient ${updated.patientId}`,
      details: `Updated details for ${updated.name}.`
    });

    res.json({ success: true, message: 'Patient updated successfully.', patient: updated });
  } catch (err) {
    next(err);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dbHelper.deletePatient(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Release bed if assigned
    if (deleted.bedId) {
      const bed = await dbHelper.getBedById(deleted.bedId);
      if (bed && bed.assignedPatientId === deleted.patientId) {
        await dbHelper.updateBed(bed.bedId, {
          status: 'AVAILABLE',
          assignedPatientId: null,
          assignedPatientName: null,
          assignedDate: null
        });
      }
    }

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Patient Deletion',
      entity: `Patient ${deleted.patientId}`,
      details: `Deleted patient ${deleted.name}.`
    });

    res.json({ success: true, message: 'Patient record deleted successfully.', patient: deleted });
  } catch (err) {
    next(err);
  }
};
