const express = require('express');
const router = express.Router();
const multer = require('multer');
const propertyController = require('../controllers/propertyController');

const upload = multer({ storage: multer.memoryStorage() });

// Middleware to protect routes: Only allow Staff and Notary
const restrictToStaffAndNotary = (req, res, next) => {
    const userRole = req.headers['user-role'];

    if (userRole === 'Staff' || userRole === 'Notary') {
        next(); 
    } else {
        return res.status(403).json({ error: "Access Denied. Insufficient permissions." });
    }
};

// --- PROTECTED ROUTES ---

// 1. Mint Route Protected
router.post(
    '/mint', 
    restrictToStaffAndNotary, // Security check first
    upload.single('document'), 
    propertyController.mintToken
);

// 2. Transfer Route Protected. Notary Proposes Transfer
router.post(
    '/transfer/propose', 
    restrictToStaffAndNotary, 
    upload.single('document'), 
    propertyController.proposeTransfer
);

// Citizen Approves Transfer (No file upload needed, so no restrictToStaffAndNotary)
router.post('/transfer/approve', express.json(), propertyController.approveTransfer);

// Notary Executes Final Transfer
router.post('/transfer/execute', restrictToStaffAndNotary, express.json(), propertyController.executeTransfer);

// Get list of transfers
router.get('/transfers/list', propertyController.getTransfers);


router.get('/all', propertyController.getAllProperties);

// GET request to read a property
router.get('/:id', propertyController.readToken);


// GET request to get the history of property
router.get('/history/:id', propertyController.getHistory);

// Search properties by owner hash
router.get('/owner/:hash', propertyController.getPropertiesByOwner);


module.exports = router;