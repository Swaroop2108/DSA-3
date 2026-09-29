const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, staffController.getStaff);
router.post('/', verifyToken, requireRole('Admin'), staffController.createStaff);
router.put('/:id', verifyToken, requireRole('Admin'), staffController.updateStaff);

module.exports = router;
