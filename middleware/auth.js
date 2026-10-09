// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  let token;

  // Check if the token is in the 'Authorization' header
  // It should be in the format: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split "Bearer <token>" and take the token part)
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.user || !decoded.user.id) {
        return res.status(401).json({ message: 'Token is not valid', msg: 'Token is not valid' });
      }

      // Find the user by the ID from the token payload
      // .select('-password') ensures we don't attach the password to the req object
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, authorization denied', msg: 'User not found, authorization denied' });
      }

      // Move on to the next function (the actual route handler)
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is not valid', msg: 'Token is not valid' });
    }
  }

  // If no token is found
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied', msg: 'No token, authorization denied' });
  }
};