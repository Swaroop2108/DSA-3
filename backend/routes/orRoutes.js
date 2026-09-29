const express = require('express');
const router = express.Router();
const orController = require('../controllers/orController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, orController.getORs);
router.post('/', verifyToken, requireRole('Admin'), orController.createOR);
router.put('/:id', verifyToken, orController.updateOR);
router.get('/:id/schedule', verifyToken, orController.getORSchedule);

module.exports = router;
