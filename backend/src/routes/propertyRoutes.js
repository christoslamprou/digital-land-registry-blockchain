const express = require('express');
const router = express.Router();
const multer = require('multer');
const propertyController = require('../controllers/propertyController');

// Configure multer to store incoming files in memory (RAM) temporarily
const upload = multer({ storage: multer.memoryStorage() });

// POST request to mint a new property
// 'upload.single("document")' intercepts the file attached to the "document" field
router.post('/mint', upload.single('document'), propertyController.mintToken);

// GET request to read a property
router.get('/:id', propertyController.readToken);

module.exports = router;