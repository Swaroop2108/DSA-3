const express = require('express');
const router = express.Router();
const bedController = require('../controllers/bedController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, bedController.getBeds);
router.post('/', verifyToken, requireRole('Admin'), bedController.createBed);
router.put('/:id', verifyToken, bedController.updateBed);
router.post('/:id/allocate', verifyToken, bedController.allocateBed);
router.post('/:id/release', verifyToken, bedController.releaseBed);
router.post('/:id/reserve', verifyToken, bedController.reserveBed);
router.post('/:id/maintenance', verifyToken, requireRole('Admin'), bedController.markMaintenance);

module.exports = router;
