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

      // Find the user by the ID from the token payload
      // .select('-password') ensures we don't attach the password to the req object
      req.user = await User.findById(decoded.user.id).select('-password');

      // Move on to the next function (the actual route handler)
      return next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ msg: 'Token is not valid' });
    }
  }

  // If no token is found
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
};