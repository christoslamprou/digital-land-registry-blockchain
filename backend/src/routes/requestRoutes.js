const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const multer = require('multer');

// Multer configuration for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Workflow endpoints for handling property requests
router.post('/submit', upload.single('document'), requestController.createRequest);
router.get('/list', requestController.getRequests);
router.post('/engineer-review', requestController.engineerReview);
router.post('/staff-review', requestController.staffFinalApproval);

router.get('/my-properties', requestController.getMyProperties);

module.exports = router;