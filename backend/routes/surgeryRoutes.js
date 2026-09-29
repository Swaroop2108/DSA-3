const express = require('express');
const router = express.Router();
const surgeryController = require('../controllers/surgeryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, surgeryController.getSurgeries);
router.get('/:id', verifyToken, surgeryController.getSurgeryById);
router.post('/', verifyToken, surgeryController.createSurgery);
router.put('/:id', verifyToken, surgeryController.updateSurgery);
router.delete('/:id', verifyToken, requireRole('Admin'), surgeryController.deleteSurgery);

module.exports = router;
