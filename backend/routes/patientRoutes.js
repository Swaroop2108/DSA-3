const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, patientController.getPatients);
router.get('/:id', verifyToken, patientController.getPatientById);
router.post('/', verifyToken, requireRole('Admin'), patientController.createPatient);
router.put('/:id', verifyToken, requireRole('Admin'), patientController.updatePatient);
router.delete('/:id', verifyToken, requireRole('Admin'), patientController.deletePatient);

module.exports = router;
