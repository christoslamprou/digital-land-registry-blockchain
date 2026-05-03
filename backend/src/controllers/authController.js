const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Read JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user (Limited to 'citizen' role only for public registration)
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Force 'citizen' role for all public registrations for security
        const newUser = await User.create({ 
            email, 
            password, 
            role: 'citizen' 
        });

        res.status(201).json({ 
            message: "User registered successfully as a citizen", 
            userId: newUser.id,
            role: newUser.role
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token with ID and Role
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({
            message: "Login successful",
            token,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};