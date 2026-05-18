const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user
exports.register = async (req, res) => {
    try {
        // Read afm from the request body
        const { email, password, afm } = req.body;

        if (!email || !password || !afm) {
            return res.status(400).json({ error: "Please provide email, password, and AFM" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Save the user with their afm
        const newUser = await User.create({ 
            email, 
            password: password,
            role: 'citizen',
            afm: afm 
        });

        res.status(201).json({ 
            message: "User registered successfully", 
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

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Send back token, role, and afm
        res.json({
            message: "Login successful",
            token,
            role: user.role,
            afm: user.afm 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};