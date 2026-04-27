const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('./authMiddleware');

// Protect all admin routes
router.use(verifyToken);
router.use(isAdmin);

router.get('/stats', adminController.getStats);
router.post('/candidates', adminController.addCandidate);
router.delete('/candidates/:id', adminController.deleteCandidate);
router.get('/voters', adminController.getVoters);

module.exports = router;
