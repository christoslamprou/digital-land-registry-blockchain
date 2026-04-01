const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Route for registering a new property (POST request)
// Endpoint: http://localhost:3000/api/property/mint
router.post('/mint', propertyController.mintToken);

// Route for reading a property (GET request)
// Endpoint: http://localhost:3000/api/property/:id
router.get('/:id', propertyController.readToken);

module.exports = router;