const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medischedule_super_secret_jwt_key_2026_dsa3';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    const allowedRoles = roles.map(r => String(r).toLowerCase());
    const userRole = req.user && req.user.role ? String(req.user.role).toLowerCase() : '';

    if (!req.user || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Action requires one of the following roles: [${roles.join(', ')}].`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};
