
require('dotenv').config({ override: true });

const nodemailer = require('nodemailer');

console.log('Gmail account loaded:', !!process.env.GMAIL_USER);
console.log('App password loaded:', !!process.env.GMAIL_PASS);
console.log('App password length:', process.env.GMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

async function testEmail() {
    try {
        await transporter.verify();
        console.log('SUCCESS: Gmail authentication works!');
    } catch (error) {
        console.error('FAILED:', error.message);
    }
}

testEmail();
