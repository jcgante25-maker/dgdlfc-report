const db = require('../config/db');
const path = require('path');

exports.getDashboardStats = (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Pending' OR status IS NULL OR status = '' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
        FROM reports
    `;
    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('Error fetching dashboard statistics:', err.message);
            return res.status(500).json({ error: 'Internal database error' });
        }
        return res.json({
            total: row.total || 0,
            pending: row.pending || 0,
            resolved: row.resolved || 0
        });
    });
};

exports.getAllReports = (req, res) => {
    const sql = 'SELECT * FROM reports ORDER BY id DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching reports list:', err.message);
            return res.status(500).json({ error: 'Internal database error' });
        }
        return res.json(rows);
    });
};

exports.renderDetailView = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/report-detail.html'));
};

exports.getReportById = (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error querying report details:', err.message);
            return res.status(500).json({ error: 'Database processing exception.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Incident record not found.' });
        }
        return res.json(row);
    });
};


exports.updateReportStatus = (req, res) => {
    const id = req.params.id;
    const { status, admin_notes, severity_level } = req.body;

    if (!status) {
        return res.status(400).json({
            error: 'Status is required.'
        });
    }

    const sql = `
        UPDATE reports
        SET status = ?,
            admin_notes = ?,
            severity_level = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [status, admin_notes || '', severity_level || '', id],
        function(err) {
            if (err) {
                console.error('Error updating case:', err.message);
                return res.status(500).json({
                    error: 'Failed to update case: ' + err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: 'Case not found.'
                });
            }

            return res.json({
                success: true,
                message: 'Case and severity updated successfully.'
            });
        }
    );
};


exports.updateReportRemarks = (req, res) => {
    const id = req.params.id;
    const { remarks } = req.body;

    if (remarks === undefined || remarks === null) {
        return res.status(400).json({ error: 'Remarks are required.' });
    }

    const sql = 'UPDATE reports SET admin_notes = ? WHERE id = ?';
    db.run(sql, [remarks, id], function(err) {
        if (err) {
            console.error('Error updating case remarks:', err.message);
            return res.status(500).json({ error: 'Failed to update case remarks.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Case not found.' });
        }
        return res.json({ 
            success: true, 
            message: 'Case remarks updated successfully.'
        });
    });
};

exports.deleteReport = (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM reports WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Error deleting report row:', err.message);
            return res.status(500).json({ error: 'Failed to purge record from database.' });
        }
        return res.json({ 
            success: true, 
            message: 'Incident case file permanently deleted.' 
        });
    });
};

exports.bulkDeleteReports = (req, res) => {
    const { ids } = req.body; 
    if (!ids || ids.length === 0) return res.status(400).json({ error: 'No items selected.' });

    const placeholders = ids.map(() => '?').join(',');
    const sql = 'DELETE FROM reports WHERE id IN (' + placeholders + ')';

    db.run(sql, ids, function(err) {
        if (err) {
            console.error('Error in bulk delete:', err.message);
            return res.status(500).json({ error: 'Database error.' });
        }
        res.json({ success: true, deleted: this.changes });
    });
};