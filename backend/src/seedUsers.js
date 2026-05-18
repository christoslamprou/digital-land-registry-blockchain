const bcrypt = require('bcryptjs'); // Using bcryptjs as configured in package.json
const sequelize = require('./config/database');
const User = require('./models/User');

const seedDatabase = async () => {
    try {
        // 1. Establish connection with the database
        await sequelize.authenticate();
        console.log('Database connection established. Starting seed process...');

        // 2. Hash the passwords securely
        const saltRounds = 10;
        const hashedStaffPassword = await bcrypt.hash('StaffPassword2026!', saltRounds);
        const hashedNotaryPassword = await bcrypt.hash('NotaryPassword2026!', saltRounds);
        const hashedCitizenPassword = await bcrypt.hash('CitizenPassword2026!', saltRounds);
        const hashedCitizen2Password = await bcrypt.hash('Citizen2Password2026!', saltRounds);

        // 3. Clear any existing records to prevent unique constraint errors
        await User.destroy({ where: {} });
        console.log('Cleared existing users from the database.');

        // 4. Insert initial users with their respective roles and AFM (Tax ID) strings
        // Note: Roles are lowercase to comply with the PostgreSQL ENUM case constraints
        await User.bulkCreate([
            {
                email: 'staff@landregistry.gr',
                password: hashedStaffPassword,
                role: 'staff',
                afm: 'STAFF9999' // Custom identifier for Land Registry Staff
            },
            {
                email: 'notary@landregistry.gr',
                password: hashedNotaryPassword,
                role: 'notary',
                afm: 'NOTARY999' // Custom identifier for Notary
            },
            {
                email: 'citizen@example.com',
                password: hashedCitizenPassword,
                role: 'citizen',
                afm: '012345678' // Realistic 9-digit AFM for the testing citizen
            },
            {
                email: 'citizen2@example.com',
                password: hashedCitizen2Password,
                role: 'citizen',
                afm: '123456789' // Realistic 9-digit AFM for the testing citizen
            }


        ]);

        console.log('Success! All 4 initial users with AFM values have been inserted into the database.');
        process.exit(0); // Exit the script successfully
        
    } catch (error) {
        console.error('Failed to seed the database. Error details:', error);
        process.exit(1); // Exit the script with an error code
    }
};

// Execute the seeding logic
seedDatabase();