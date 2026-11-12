const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');

/**
 * GET /admin/login
 * Serves the admin login HTML portal page
 */
exports.getLoginPage = (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/admin/login.html'));
};

/**
 * POST /admin/login
 * Validates admin credentials against the SQLite database and establishes a session
 */
exports.loginAdmin = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Please enter both username and password.');
    }

    const sql = `SELECT * FROM admins WHERE username = ?`;
    
    db.get(sql, [username.trim()], (err, admin) => {
        if (err) {
            console.error('Database query error during login:', err.message);
            return res.status(500).send(`Database Error: ${err.message}`);
        }

        if (!admin) {
            return res.status(401).send('Invalid username or password.');
        }

        // 🔍 DIAGNOSTIC LOG: Prints out exactly what the database returned to your terminal
        console.log('\n--- 🕵️‍♂️ ADMIN LOGIN DIAGNOSTIC ---');
        console.log('Database Row Found:', admin);
        console.log('---------------------------------\n');

        // FALLBACK: Use password_hash, or fall back to password if the old database is still there
        const targetHash = admin.password_hash || admin.password;

        bcrypt.compare(password, targetHash, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt comparison error:', err.message);
                return res.status(500).send(`Bcrypt Error: ${err.message}`);
            }

            if (!isMatch) {
                return res.status(401).send('Invalid username or password.');
            }

            // Authentication successful! Save details to the express-session
            req.session.isAdminLoggedIn = true;
            req.session.adminId = admin.id;
            req.session.adminUsername = admin.username;

            // Redirect directly to the administrator workspace dashboard
            return res.redirect('/admin/dashboard');
        });
    });
};

/**
 * GET /admin/logout
 * Destroys the active session cookie and redirects to the login screen
 */
exports.logoutAdmin = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying admin session:', err.message);
            return res.status(500).send('Could not log out. Please try again.');
        }
        
        res.clearCookie('connect.sid'); 
        return res.redirect('/admin/login');
    });
};