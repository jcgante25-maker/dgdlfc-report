const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs'); // Using bcryptjs to match your controller layout

const dbPath = path.join(__dirname, '../database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Database connection fault:', err.message);
    }
    console.log('Connected to the SQLite database successfully.');
});

db.serialize(() => {
    // 1. Verify Reports Table
    db.run(`
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE,
            reporter_type TEXT,
            reporter_name TEXT,
            reporter_contact TEXT,
            victim_name TEXT,
            perpetrator_name TEXT,
            incident_date TEXT,
            incident_location TEXT,
            description TEXT,
            evidence_path TEXT,
            status TEXT DEFAULT 'Pending',
            severity_level TEXT DEFAULT 'Pending Assessment',
            category TEXT DEFAULT 'Uncategorized',
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. Create Admins Table with matching 'password_hash' column
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT, -- Changed from password to password_hash!
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error establishing authentication table:', err.message);
            return;
        }

        // Check if any credentials exist. If empty, auto-inject the admin profile
        db.get(`SELECT COUNT(*) as count FROM admins`, [], (err, row) => {
            if (err) return console.error(err.message);
            
            if (row.count === 0) {
                const defaultUser = 'admin';
                const defaultPass = 'admin123';
                
                bcrypt.hash(defaultPass, 10, (err, hash) => {
                    if (err) return console.error('Bcrypt compilation error:', err.message);
                    
                    // Insert using password_hash column name
                    db.run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, [defaultUser, hash], (err) => {
                        if (err) {
                            console.error('Failed to seed default admin profile:', err.message);
                        } else {
                            console.log('--------------------------------------------------');
                            console.log('⚠️  SECURITY AUTO-SEED: Admin profile restored!');
                            console.log(`Username: ${defaultUser}`);
                            console.log(`Password: ${defaultPass}`);
                            console.log('--------------------------------------------------');
                        }
                    });
                });
            }
        });
    });
});

module.exports = db;