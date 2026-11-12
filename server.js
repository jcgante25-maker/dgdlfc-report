require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

const reportController = require('./controllers/reportController');

// 1. MIDDLEWARE FIRST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. SESSION HANDLING
app.use(session({
    secret: process.env.SESSION_SECRET || 'bullying_report_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// 3. ALL ROUTES - MUST BE BEFORE app.listen()

// Public routes
app.use('/', require('./routes/reports.js'));

// Admin routes - loads ALL /admin/* from routes/admin.js
app.use('/admin', require('./routes/admin'));

// Track report page (public)
app.get('/track-report', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'track-report.html'));
});

// Public API for tracking
app.get('/api/reports/:token', reportController.trackReportStatus);

app.get('/track', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'public', 'track-report.html'));
});


// 4. SERVER BOOT - MUST BE LAST!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
