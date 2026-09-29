const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, reportController.getReports);

module.exports = router;
