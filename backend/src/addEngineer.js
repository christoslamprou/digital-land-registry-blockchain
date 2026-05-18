const bcrypt = require('bcrypt');
const User = require('./models/User'); 
const sequelize = require('./config/database'); 

async function insertEngineer() {
    try {
        await sequelize.authenticate();
        console.log("Connected to the database successfully.");

        
        try {
            await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'engineer';`);
            console.log("Database ENUM updated to accept 'engineer'.");
        } catch (e) {
            
            console.log("Enum check passed.");
        }

        const hashedPassword = await bcrypt.hash('EngineerPassword2026!', 10);

        const [user, created] = await User.findOrCreate({
            where: { email: 'engineer@landregistry.gr' },
            defaults: {
                password: hashedPassword,
                role: 'engineer',
                afm: 'ENGINEER9'
            }
        });

        if (created) {
            console.log("Engineer user successfully added to the database!");
        } else {
            console.log("Engineer user already exists.");
        }

    } catch (error) {
        console.error("Error adding engineer:", error);
    } finally {
        process.exit();
    }
}

insertEngineer();