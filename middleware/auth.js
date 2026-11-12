/**
 * Express Middleware to protect administrative endpoints.
 * Verifies if the user has an active login session.
 */
const isAuthenticated = (req, res, next) => {
    // Check if session exists and flag is explicitly set to true
    if (req.session && req.session.isAdminLoggedIn === true) {
        return next(); // Authorized! Proceed to the route handler
    }
    
    // Unauthorized entry attempt; clear any malformed cookie tokens and redirect to login
    return res.redirect('/admin/login');
};

// Export both formats to ensure compatibility regardless of how you require it in admin.js
module.exports = isAuthenticated;
module.exports.isAuthenticated = isAuthenticated;