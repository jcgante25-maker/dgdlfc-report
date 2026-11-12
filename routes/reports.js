const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // 1. Add the native File System module

// 2. Define your upload target directory path
const uploadDir = path.join(__dirname, '../public/uploads/');

// 3. Automatically create the directory structure if it is missing
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for processing optional image/evidence file attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // 4. Pass the validated directory path here
    },
    filename: (req, file, cb) => {
        // Generate a cryptographically unique filename using timestamps
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Restrict uploads to safe document and graphic image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only graphic images (.jpg, .jpeg, .png) and documentation PDFs are accepted.'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Enforce 5MB limit rule
    fileFilter: fileFilter
});

// Import the public report controller module
const reportController = require('../controllers/reportController');

/**
 * --- PUBLIC PORTAL VIEWS ---
 */

// GET / - Serves the institutional landing portal index page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/public/index.html'));
});

// GET /submit-report - Serves the intake incident reporting form interface
router.get('/submit-report', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/public/submit-report.html'));
});

// GET /track-report - Serves the tracking query window
router.get('/track-report', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/public/track-report.html'));
});

// GET /report-success - Serves the submission confirmation panel
router.get('/report-success', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/public/report-success.html'));
});

/**
 * --- PUBLIC PORTAL INTERACTIVE API ENDPOINTS ---
 */

// POST /submit-report - Processes text details, handles files, and commits entry to SQLite
router.post('/submit-report', upload.single('evidence'), reportController.submitReport);

// GET /api/track/:token - Queries the resolution progress & evaluator feedback using the tracking token
router.get('/api/track/:token', reportController.trackReportStatus);

module.exports = router;