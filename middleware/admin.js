// middleware/admin.js

// This middleware runs AFTER the auth middleware
// It assumes req.user is already populated
module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed
  } else {
    // User is not an admin or not logged in
    res.status(403).json({ msg: 'Access denied. Admin role required.' });
  }
};