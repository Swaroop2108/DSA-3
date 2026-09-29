const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbHelper = require('../utils/dbHelper');
const { JWT_SECRET } = require('../middleware/authMiddleware');

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await dbHelper.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role check if supplied
    if (role && user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This account does not have the selected role' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await dbHelper.addAuditLog({
      user: user.name,
      role: user.role,
      action: 'User Login',
      entity: `User ${user.email}`,
      details: `${user.role} logged in successfully.`
    });

    const normalizedRole = user.role.toLowerCase() === 'admin' ? 'admin' : (user.role.toLowerCase() === 'staff' ? 'staff' : user.role);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await dbHelper.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await dbHelper.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'Staff',
      department: department || 'General',
      phone: phone || ''
    });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'User Registration',
      entity: `User ${email}`,
      details: `Created new user ${name} with role ${role || 'Staff'}.`
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await dbHelper.getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
};
