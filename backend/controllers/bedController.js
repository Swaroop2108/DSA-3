const dbHelper = require('../utils/dbHelper');

exports.getBeds = async (req, res, next) => {
  try {
    const { ward, status, type } = req.query;
    let beds = await dbHelper.getBeds();

    if (ward) {
      beds = beds.filter(b => b.ward.toUpperCase() === ward.toUpperCase());
    }

    if (status) {
      beds = beds.filter(b => b.status.toUpperCase() === status.toUpperCase());
    }

    if (type) {
      beds = beds.filter(b => b.type.toUpperCase() === type.toUpperCase());
    }

    res.json({ success: true, count: beds.length, beds });
  } catch (err) {
    next(err);
  }
};

exports.createBed = async (req, res, next) => {
  try {
    const { bedId, ward, floor, type, equipment } = req.body;
    if (!bedId || !ward || !type) {
      return res.status(400).json({ success: false, message: 'Bed ID, ward, and type are required.' });
    }

    const existing = await dbHelper.getBedById(bedId);
    if (existing) {
      return res.status(400).json({ success: false, message: `Bed with ID ${bedId} already exists.` });
    }

    const newBed = await dbHelper.createBed({
      bedId,
      ward,
      floor: floor || '1st Floor',
      type,
      status: 'AVAILABLE',
      equipment: Array.isArray(equipment) ? equipment : (equipment ? equipment.split(',') : [])
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Bed Created',
      entity: `Bed ${bedId}`,
      details: `Created new ${type} bed ${bedId} in ${ward}.`
    });

    res.status(201).json({ success: true, message: 'Bed created successfully.', bed: newBed });
  } catch (err) {
    next(err);
  }
};

exports.updateBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await dbHelper.updateBed(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }
    res.json({ success: true, message: 'Bed updated successfully.', bed: updated });
  } catch (err) {
    next(err);
  }
};

// DSA Bed Allocation Algorithm Controller Endpoint
exports.allocateBed = async (req, res, next) => {
  try {
    const { id } = req.params; // bedId or _id
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required for allocation.' });
    }

    const bed = await dbHelper.getBedById(id);
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    if (bed.status === 'OCCUPIED') {
      return res.status(400).json({ success: false, message: `Cannot assign bed ${bed.bedId}. Bed is already OCCUPIED.` });
    }

    if (bed.status === 'MAINTENANCE') {
      return res.status(400).json({ success: false, message: `Cannot assign bed ${bed.bedId}. Bed is currently under MAINTENANCE.` });
    }

    const patient = await dbHelper.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Rule check: Emergency beds reserved for emergency patients
    if (bed.ward === 'EMERGENCY' && patient.priority > 1) {
      return res.status(400).json({
        success: false,
        message: 'EMERGENCY beds are reserved exclusively for priority 1 EMERGENCY patients.'
      });
    }

    // Rule check: ICU priority alignment
    if (bed.ward === 'ICU' && patient.priority > 2) {
      return res.status(400).json({
        success: false,
        message: 'ICU beds are restricted to EMERGENCY (1) and HIGH (2) priority patients.'
      });
    }

    // Allocate bed
    const updatedBed = await dbHelper.updateBed(bed.bedId, {
      status: 'OCCUPIED',
      assignedPatientId: patient.patientId,
      assignedPatientName: patient.name,
      assignedDate: new Date()
    });

    // Update patient record
    await dbHelper.updatePatient(patient.patientId, {
      status: 'ADMITTED',
      bedId: bed.bedId
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Bed Allocation',
      entity: `Bed ${bed.bedId}`,
      details: `Allocated bed ${bed.bedId} (${bed.ward}) to patient ${patient.name} (${patient.patientId}).`
    });

    await dbHelper.addNotification({
      title: '🛏️ Bed Allocated',
      message: `Bed ${bed.bedId} allocated to ${patient.name}.`,
      type: 'SUCCESS'
    });

    res.json({
      success: true,
      message: `Bed ${bed.bedId} successfully allocated to ${patient.name}.`,
      bed: updatedBed
    });
  } catch (err) {
    next(err);
  }
};

exports.releaseBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bed = await dbHelper.getBedById(id);
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    const previousPatientId = bed.assignedPatientId;
    const previousPatientName = bed.assignedPatientName;

    const updatedBed = await dbHelper.updateBed(bed.bedId, {
      status: 'AVAILABLE',
      assignedPatientId: null,
      assignedPatientName: null,
      assignedDate: null
    });

    if (previousPatientId) {
      const patient = await dbHelper.getPatientById(previousPatientId);
      if (patient) {
        await dbHelper.updatePatient(previousPatientId, {
          bedId: null,
          status: patient.status === 'ADMITTED' ? 'WAITING' : patient.status
        });
      }
    }

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Bed Release',
      entity: `Bed ${bed.bedId}`,
      details: `Released bed ${bed.bedId} (previously occupied by ${previousPatientName || 'N/A'}).`
    });

    res.json({
      success: true,
      message: `Bed ${bed.bedId} is now AVAILABLE.`,
      bed: updatedBed
    });
  } catch (err) {
    next(err);
  }
};

exports.reserveBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bed = await dbHelper.getBedById(id);
    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found.' });

    const updatedBed = await dbHelper.updateBed(bed.bedId, { status: 'RESERVED' });
    
    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Bed Reserved',
      entity: `Bed ${bed.bedId}`,
      details: `Reserved bed ${bed.bedId}.`
    });

    res.json({ success: true, message: `Bed ${bed.bedId} status set to RESERVED.`, bed: updatedBed });
  } catch (err) {
    next(err);
  }
};

exports.markMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bed = await dbHelper.getBedById(id);
    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found.' });

    const updatedBed = await dbHelper.updateBed(bed.bedId, {
      status: 'MAINTENANCE',
      assignedPatientId: null,
      assignedPatientName: null,
      assignedDate: null
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Bed Maintenance',
      entity: `Bed ${bed.bedId}`,
      details: `Marked bed ${bed.bedId} under MAINTENANCE.`
    });

    res.json({ success: true, message: `Bed ${bed.bedId} status set to MAINTENANCE.`, bed: updatedBed });
  } catch (err) {
    next(err);
  }
};
