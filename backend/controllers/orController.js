const dbHelper = require('../utils/dbHelper');

exports.getORs = async (req, res, next) => {
  try {
    const { department, status } = req.query;
    let ors = await dbHelper.getORs();

    if (department) {
      ors = ors.filter(o => o.department.toLowerCase() === department.toLowerCase());
    }

    if (status) {
      ors = ors.filter(o => o.status.toUpperCase() === status.toUpperCase());
    }

    res.json({ success: true, count: ors.length, ors });
  } catch (err) {
    next(err);
  }
};

exports.createOR = async (req, res, next) => {
  try {
    const { orId, name, department, equipment } = req.body;
    if (!orId || !name || !department) {
      return res.status(400).json({ success: false, message: 'OR ID, name, and department are required.' });
    }

    const existing = await dbHelper.getORById(orId);
    if (existing) {
      return res.status(400).json({ success: false, message: `Operating Room ${orId} already exists.` });
    }

    const newOR = await dbHelper.createOR({
      orId,
      name,
      department,
      status: 'AVAILABLE',
      equipment: Array.isArray(equipment) ? equipment : (equipment ? equipment.split(',') : [])
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'OR Created',
      entity: `OR ${orId}`,
      details: `Created Operating Room ${name} (${department}).`
    });

    res.status(201).json({ success: true, message: 'Operating Room created successfully.', or: newOR });
  } catch (err) {
    next(err);
  }
};

exports.updateOR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await dbHelper.updateOR(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Operating Room not found.' });
    }

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'OR Update',
      entity: `OR ${updated.orId}`,
      details: `Updated details for Operating Room ${updated.orId}.`
    });

    res.json({ success: true, message: 'Operating Room updated successfully.', or: updated });
  } catch (err) {
    next(err);
  }
};

exports.getORSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const or = await dbHelper.getORById(id);
    if (!or) return res.status(404).json({ success: false, message: 'Operating Room not found.' });

    const allSurgeries = await dbHelper.getSurgeries();
    const schedule = allSurgeries.filter(s => s.orId === or.orId && s.status !== 'CANCELLED');

    res.json({
      success: true,
      or,
      schedule
    });
  } catch (err) {
    next(err);
  }
};
