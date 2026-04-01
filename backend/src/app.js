const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Import Routes
const propertyRoutes = require('./routes/propertyRoutes');

// Middleware setup
app.use(cors()); 
app.use(express.json()); 

// Logs every incoming HTTP request to the terminal
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} request to ${req.url}`);
    
    // Safety check: only log body if it exists and has content
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', req.body);
    }
    
    next();
});

// Base URL for property endpoints
app.use('/api/property', propertyRoutes);

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Digital Land Registry Backend is running.' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});