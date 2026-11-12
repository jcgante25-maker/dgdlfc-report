const express = require('express');
const router = express.Router();
const path = require('path');

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController'); 
const isAuthenticated = require('../middleware/auth');

// UNPROTECTED
router.get('/login', authController.getLoginPage);
router.post('/login', authController.loginAdmin);

// PROTECTED HTML VIEWS
router.get('/logout', isAuthenticated, authController.logoutAdmin);

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

router.get('/reports', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/reports-list.html'));
});

router.get('/reports/:id', isAuthenticated, adminController.renderDetailView);

router.get('/analytics', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/analytics.html'));
});

router.get('/settings', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/settings.html'));
});

// API ENDPOINTS
router.get('/api/stats', isAuthenticated, adminController.getDashboardStats);
router.get('/api/reports', isAuthenticated, adminController.getAllReports);
router.get('/api/reports/:id', isAuthenticated, adminController.getReportById);
router.post('/api/reports/:id/status', isAuthenticated, adminController.updateReportStatus);
router.post('/api/reports/:id/remarks', isAuthenticated, adminController.updateReportRemarks);
router.delete('/api/reports/:id', isAuthenticated, adminController.deleteReport);
router.post('/api/reports/bulk-delete', isAuthenticated, adminController.bulkDeleteReports);

router.get('/api/analytics-data', isAuthenticated, (req, res) => {
    const db = require('../config/db');
    const sql = 'SELECT category, COUNT(*) as count FROM reports GROUP BY category';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Analytics aggregation fault:', err.message);
            return res.status(500).json({ error: 'Failed to compile chart data.' });
        }
        return res.json(rows);
    });
});

module.exports = router;