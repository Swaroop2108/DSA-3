const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/find-slot', verifyToken, schedulingController.findSlot);
router.post('/schedule', verifyToken, schedulingController.scheduleSurgery);
router.post('/emergency', verifyToken, schedulingController.handleEmergency);
router.get('/conflicts', verifyToken, schedulingController.getConflicts);
router.post('/demo-run', verifyToken, schedulingController.runDSADemo);
router.post('/dsa-demo', verifyToken, schedulingController.runDSADemo);
router.get('/dsa-demo', verifyToken, schedulingController.runDSADemo);

module.exports = router;
