const dbHelper = require('../utils/dbHelper');

exports.getStaff = async (req, res, next) => {
  try {
    const { role, department, status } = req.query;
    let staff = await dbHelper.getStaff();

    if (role) {
      staff = staff.filter(s => s.role.toLowerCase() === role.toLowerCase());
    }

    if (department) {
      staff = staff.filter(s => s.department.toLowerCase() === department.toLowerCase());
    }

    if (status) {
      staff = staff.filter(s => s.status.toUpperCase() === status.toUpperCase());
    }

    res.json({ success: true, count: staff.length, staff });
  } catch (err) {
    next(err);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { staffId, name, role, department, specialization, phone, email, availableFrom, availableTo } = req.body;
    if (!name || !role || !department) {
      return res.status(400).json({ success: false, message: 'Name, role, and department are required.' });
    }

    const sId = staffId || `STF-${Math.floor(100 + Math.random() * 900)}`;
    const existing = await dbHelper.getStaffById(sId);
    if (existing) {
      return res.status(400).json({ success: false, message: `Staff member ${sId} already exists.` });
    }

    const newStaff = await dbHelper.createStaff({
      staffId: sId,
      name,
      role,
      department,
      specialization: specialization || 'General',
      phone: phone || '',
      email: email || '',
      status: 'AVAILABLE',
      availableFrom: availableFrom || '08:00',
      availableTo: availableTo || '18:00'
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Staff Registration',
      entity: `Staff ${sId}`,
      details: `Added ${role} ${name} (${department}).`
    });

    res.status(201).json({ success: true, message: 'Staff member registered successfully.', staff: newStaff });
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await dbHelper.updateStaff(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'Staff Update',
      entity: `Staff ${updated.staffId}`,
      details: `Updated details for ${updated.name}.`
    });

    res.json({ success: true, message: 'Staff record updated successfully.', staff: updated });
  } catch (err) {
    next(err);
  }
};
