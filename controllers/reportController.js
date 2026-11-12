
const db = require('../config/db');
const crypto = require('crypto');
const { sendReportConfirmation } = require('../services/mailService');

// Generate tracking number: DG-A3F91B
function generateTrackingToken() {
    return 'DG-' + crypto.randomBytes(3)
        .toString('hex')
        .toUpperCase();
}

// SUBMIT REPORT
exports.submitReport = (req, res) => {

    const {
        identity_mode,
        reporter_type,
        reporter_name,
        reporter_contact,
        victim_name,
        perpetrator_name,
        incident_date,
        incident_location,
        description,
        bullying_type
    } = req.body;

    // Check whether reporter selected named or anonymous
    const isNamed = identity_mode === 'named';

    const name = isNamed
        ? String(reporter_name || '').trim()
        : 'Anonymous Submission';

    const contact = isNamed
        ? String(reporter_contact || '').trim()
        : 'N/A';

    // Validate named reporter information
    let isEmail = false;

    if (isNamed) {

        if (!name) {
            return res.status(400).send(
                'Please enter your full name.'
            );
        }

        if (!contact) {
            return res.status(400).send(
                'Please enter your email address or mobile number.'
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Mobile number validation
        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

        isEmail = emailRegex.test(contact);

        const digitCount = contact.replace(/\D/g, '').length;

        const isPhone =
            phoneRegex.test(contact) &&
            digitCount >= 7 &&
            digitCount <= 15;

        if (!isEmail && !isPhone) {
            return res.status(400).send(
                'Please enter a valid email address or mobile number.'
            );
        }
    }

    // Evidence file
    const evidence_path = req.file
        ? `/uploads/${req.file.filename}`
        : null;

    // Generate tracking number
    const token = generateTrackingToken();

    // Insert report into database
    const sql = `
        INSERT INTO reports (
            token,
            reporter_type,
            reporter_name,
            reporter_contact,
            victim_name,
            perpetrator_name,
            incident_date,
            incident_location,
            description,
            evidence_path,
            status,
            severity_level,
            category
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending Assessment', ?)
    `;

    const params = [
        token,
        reporter_type,
        name,
        contact,
        victim_name || 'Undisclosed',
        perpetrator_name || 'Unknown/Undisclosed',
        incident_date,
        incident_location,
        description,
        evidence_path,
        bullying_type || 'Other/Unspecified'
    ];

    db.run(sql, params, function(err) {

        if (err) {
            console.error('Database Error:', err.message);

            return res.status(500).send(
                'Unable to save incident report.'
            );
        }

        console.log('Report successfully saved:', token);

        // Send confirmation email ONLY if contact is an email
        if (isNamed && isEmail) {

            Promise.resolve()
                .then(() => sendReportConfirmation({
                    to: contact,
                    token: token,
                    reporterName: name
                }))
                .then(() => {
                    console.log('Confirmation email sent to:', contact);
                })
                .catch(mailErr => {
                    console.error(
                        'Email Sending Error:',
                        mailErr.message
                    );
                });
        }

        // Redirect after saving report
        return res.redirect(
            `/report-success?token=${encodeURIComponent(token)}`
        );
    });
};


// PUBLIC TRACKING API
exports.trackReportStatus = (req, res) => {

    const token = String(req.params.token || '')
        .trim()
        .toUpperCase();

    // Validate tracking number
    if (!/^DG-[A-F0-9]{6}$/.test(token)) {
        return res.status(400).json({
            error: 'Invalid tracking number.'
        });
    }

    // Retrieve only information safe for public tracking
    const sql = `
        SELECT
            token,
            status,
            category,
            created_at,
            admin_notes
        FROM reports
        WHERE token = ?
    `;

    db.get(sql, [token], (err, row) => {

        if (err) {
            console.error('Database Error:', err.message);

            return res.status(500).json({
                error: 'Unable to check tracking number.'
            });
        }

        if (!row) {
            return res.status(404).json({
                error: 'Tracking number not found.'
            });
        }

        // Prevent browser caching so users receive fresh updates
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        return res.json(row);
    });
};
