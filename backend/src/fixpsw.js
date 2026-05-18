const bcryptjs = require('bcryptjs'); 
const User = require('./models/User');
const sequelize = require('./config/database');

async function fix() {
    try {
        await sequelize.authenticate();
        
        
        const newHash = await bcryptjs.hash('EngineerPassword2026!', 10);
        
        
        await User.update(
            { password: newHash }, 
            { 
                where: { email: 'engineer@landregistry.gr' },
                hooks: false 
            }
        );
        
        console.log("Password fixed successfully!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

fix();