const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { verifyToken } = require('./authMiddleware');

router.get('/candidates', voteController.getCandidates);
router.post('/cast', verifyToken, voteController.castVote);

module.exports = router;
