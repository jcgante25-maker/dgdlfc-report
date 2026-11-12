
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,

    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Check Gmail connection
transporter.verify()
    .then(() => {
        console.log('Gmail SMTP connection successful!');
    })
    .catch(err => {
        console.error('Gmail SMTP Connection Error:', err.message);
    });

async function sendReportConfirmation({
    to,
    token,
    reporterName
}) {
    if (!to) return;

    const safeName = String(reporterName || 'Reporter')
        .replace(/[<>&"']/g, '');

    const mailOptions = {
        from: `"Bullying Incident Reporting System" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Your Incident Report Tracking Number',

        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Incident Report Received</h2>

                <p>Hello ${safeName},</p>

                <p>Your bullying incident report has been successfully received.</p>

                <p>Your tracking number is:</p>

                <h1 style="
                    color: #198754;
                    background: #f1f5f9;
                    padding: 15px;
                    text-align: center;
                    border-radius: 8px;
                ">${token}</h1>

                <p>Please keep this tracking number private.</p>

                <p>You can use this number on our website's Track Report page to check your report status.</p>

                <p>Thank you.</p>

                <hr>

                <small>Bullying Incident Reporting & Assessment System</small>

                <p style="margin-top: 25px; color: #777; font-size: 13px; text-align: center;">
                    This is an automated message from the Bullying Incident Reporting System.
                    Please do not reply to this email.
                </p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = {
    sendReportConfirmation
};
