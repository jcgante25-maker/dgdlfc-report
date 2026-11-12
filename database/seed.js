const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Hash the default password 'admin123'
const hash = bcrypt.hashSync('admin123', 10);

db.run(
    'INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)',
    ['admin', hash],
    (err) => {
        if (err) {
            console.error('Error creating admin:', err.message);
        } else {
            console.log('Default admin created: admin / admin123');
            console.log('IMPORTANT: Change this password in a production environment.');
        }
        // Close the database connection when done seeding
        db.close();
    }
);